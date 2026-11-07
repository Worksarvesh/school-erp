import { Global, Module } from '@nestjs/common';

export interface AppConfig {
  appEnv: 'development' | 'test' | 'staging' | 'production';
  jwtAccessSecret: string;
  /** Express `trust proxy` value. Off by default; enable only behind a known proxy. */
  trustProxy: boolean | number | string;
  /** Requests per minute per IP on the public auth routes. */
  authRateLimitPerMinute: number;
  /** Failed logins per identifier per 15 minutes before 429. */
  loginFailuresPerWindow: number;
  /**
   * Who delivers OTP codes. `fixed`: every code is `otpFixedCode` and nothing is sent (interim, until
   * real SMS exists; never allowed in production). `sms`: reserved, not built yet.
   */
  otpProvider: 'fixed';
  otpFixedCode: string;
  /** HMAC key for stored OTP hashes, so a leaked row cannot be brute-forced offline. */
  otpHashSecret: string;
}

export const APP_CONFIG = Symbol('APP_CONFIG');
export const JWT_ISSUER = 'school-erp-api';
export const JWT_AUDIENCE = 'school-erp';
const MIN_SECRET_BYTES = 32;
const APP_ENVS = ['development', 'test', 'staging', 'production'] as const;
const DEFAULT_FIXED_OTP = '999999';

/** Reads and checks configuration. Throws, so the app refuses to start on bad config. */
export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const secret = requireSecret(env, 'JWT_ACCESS_SECRET');

  const appEnv = (env.APP_ENV ?? 'development') as AppConfig['appEnv'];
  if (!APP_ENVS.includes(appEnv)) {
    throw new Error(`APP_ENV must be one of ${APP_ENVS.join(', ')}`);
  }

  return {
    appEnv,
    jwtAccessSecret: secret,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    authRateLimitPerMinute: positiveInt(env.AUTH_RATE_LIMIT_PER_MINUTE, 20),
    loginFailuresPerWindow: positiveInt(env.LOGIN_FAILURES_PER_WINDOW, 5),
    ...loadOtpConfig(env, appEnv),
    otpHashSecret: requireSecret(env, 'OTP_HASH_SECRET'),
  };
}

function loadOtpConfig(
  env: NodeJS.ProcessEnv,
  appEnv: AppConfig['appEnv'],
): Pick<AppConfig, 'otpProvider' | 'otpFixedCode'> {
  // Local and test default to the fixed code; every other environment must choose explicitly.
  const provider =
    env.OTP_PROVIDER || (appEnv === 'development' || appEnv === 'test' ? 'fixed' : '');
  if (provider === 'sms') {
    throw new Error('OTP_PROVIDER=sms is not built yet');
  }
  if (provider !== 'fixed') {
    throw new Error('OTP_PROVIDER must be set (only "fixed" exists for now)');
  }
  // Hard guard: a well-known code must never protect real accounts.
  if (appEnv === 'production' || env.NODE_ENV === 'production') {
    throw new Error('OTP_PROVIDER=fixed is not allowed in production');
  }
  const code = env.OTP_FIXED_CODE || DEFAULT_FIXED_OTP;
  if (!/^\d{6}$/.test(code)) {
    throw new Error('OTP_FIXED_CODE must be 6 digits');
  }
  return { otpProvider: provider, otpFixedCode: code };
}

function requireSecret(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name] ?? '';
  if (Buffer.byteLength(value, 'utf8') < MIN_SECRET_BYTES) {
    throw new Error(`${name} must be at least ${MIN_SECRET_BYTES} bytes`);
  }
  return value;
}

function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (!value || value === 'false') return false;
  if (value === 'true') return true;
  return /^\d+$/.test(value) ? Number(value) : value;
}

function positiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Expected a positive integer, got "${value}"`);
  }
  return n;
}

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadAppConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
