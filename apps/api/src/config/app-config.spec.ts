import { loadAppConfig } from './app-config.js';

const SECRET = 'x'.repeat(32);
/** The minimum a development environment needs. */
const BASE = { JWT_ACCESS_SECRET: SECRET, OTP_HASH_SECRET: 'o'.repeat(32) };

describe('loadAppConfig', () => {
  it('refuses a JWT secret shorter than 32 bytes, or a missing one', () => {
    expect(() => loadAppConfig({ ...BASE, JWT_ACCESS_SECRET: 'x'.repeat(31) })).toThrow(/32 bytes/);
    expect(() => loadAppConfig({ OTP_HASH_SECRET: BASE.OTP_HASH_SECRET })).toThrow(/32 bytes/);
  });

  it('counts bytes, not characters', () => {
    // 16 two-byte characters = 32 bytes.
    expect(
      loadAppConfig({ ...BASE, JWT_ACCESS_SECRET: 'é'.repeat(16) }).jwtAccessSecret,
    ).toHaveLength(16);
  });

  it('has trust proxy off unless set', () => {
    expect(loadAppConfig(BASE).trustProxy).toBe(false);
    expect(loadAppConfig({ ...BASE, TRUST_PROXY: 'false' }).trustProxy).toBe(false);
    expect(loadAppConfig({ ...BASE, TRUST_PROXY: 'true' }).trustProxy).toBe(true);
    expect(loadAppConfig({ ...BASE, TRUST_PROXY: '1' }).trustProxy).toBe(1);
  });

  it('rejects an unknown APP_ENV and a non-numeric limit', () => {
    expect(() => loadAppConfig({ ...BASE, APP_ENV: 'prod' })).toThrow(/APP_ENV/);
    expect(() => loadAppConfig({ ...BASE, LOGIN_FAILURES_PER_WINDOW: 'lots' })).toThrow(
      /positive integer/,
    );
  });
});

describe('loadAppConfig: OTP (startup validation)', () => {
  it('defaults to the fixed provider and 999999 in development and test', () => {
    for (const APP_ENV of ['development', 'test']) {
      const config = loadAppConfig({ ...BASE, APP_ENV });
      expect(config.otpProvider).toBe('fixed');
      expect(config.otpFixedCode).toBe('999999');
    }
  });

  it('refuses to start with the fixed provider when APP_ENV=production', () => {
    expect(() => loadAppConfig({ ...BASE, APP_ENV: 'production', OTP_PROVIDER: 'fixed' })).toThrow(
      /not allowed in production/,
    );
  });

  it('refuses to start with the fixed provider when NODE_ENV=production', () => {
    expect(() =>
      loadAppConfig({ ...BASE, APP_ENV: 'staging', NODE_ENV: 'production', OTP_PROVIDER: 'fixed' }),
    ).toThrow(/not allowed in production/);
    // Also when the provider is only defaulted (development APP_ENV on a production NODE_ENV).
    expect(() => loadAppConfig({ ...BASE, NODE_ENV: 'production' })).toThrow(
      /not allowed in production/,
    );
  });

  it('allows the fixed provider in staging only when chosen explicitly', () => {
    expect(() => loadAppConfig({ ...BASE, APP_ENV: 'staging' })).toThrow(
      /OTP_PROVIDER must be set/,
    );
    expect(loadAppConfig({ ...BASE, APP_ENV: 'staging', OTP_PROVIDER: 'fixed' }).otpProvider).toBe(
      'fixed',
    );
  });

  it('refuses the sms provider (not built) and unknown providers', () => {
    expect(() => loadAppConfig({ ...BASE, OTP_PROVIDER: 'sms' })).toThrow(/not built yet/);
    expect(() => loadAppConfig({ ...BASE, OTP_PROVIDER: 'email' })).toThrow(/OTP_PROVIDER/);
  });

  it('accepts a custom 6-digit fixed code and refuses anything else', () => {
    expect(loadAppConfig({ ...BASE, OTP_FIXED_CODE: '123456' }).otpFixedCode).toBe('123456');
    for (const OTP_FIXED_CODE of ['12345', '1234567', '12345a']) {
      expect(() => loadAppConfig({ ...BASE, OTP_FIXED_CODE })).toThrow(/6 digits/);
    }
  });

  it('requires an OTP hash secret of at least 32 bytes', () => {
    expect(() => loadAppConfig({ JWT_ACCESS_SECRET: SECRET })).toThrow(/OTP_HASH_SECRET/);
    expect(() => loadAppConfig({ ...BASE, OTP_HASH_SECRET: 'short' })).toThrow(/OTP_HASH_SECRET/);
  });
});
