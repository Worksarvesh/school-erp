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
}

export const APP_CONFIG = Symbol('APP_CONFIG');
export const JWT_ISSUER = 'school-erp-api';
export const JWT_AUDIENCE = 'school-erp';
const MIN_JWT_SECRET_BYTES = 32;
const APP_ENVS = ['development', 'test', 'staging', 'production'] as const;

/** Reads and checks configuration. Throws, so the app refuses to start on bad config. */
export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const secret = env.JWT_ACCESS_SECRET ?? '';
  if (Buffer.byteLength(secret, 'utf8') < MIN_JWT_SECRET_BYTES) {
    throw new Error(`JWT_ACCESS_SECRET must be at least ${MIN_JWT_SECRET_BYTES} bytes`);
  }

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
  };
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
