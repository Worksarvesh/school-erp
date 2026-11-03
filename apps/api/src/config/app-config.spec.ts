import { loadAppConfig } from './app-config.js';

const SECRET = 'x'.repeat(32);

describe('loadAppConfig', () => {
  it('refuses a JWT secret shorter than 32 bytes, or a missing one', () => {
    expect(() => loadAppConfig({ JWT_ACCESS_SECRET: 'x'.repeat(31) })).toThrow(/32 bytes/);
    expect(() => loadAppConfig({})).toThrow(/32 bytes/);
  });

  it('counts bytes, not characters', () => {
    // 16 two-byte characters = 32 bytes.
    expect(loadAppConfig({ JWT_ACCESS_SECRET: 'é'.repeat(16) }).jwtAccessSecret).toHaveLength(16);
  });

  it('has trust proxy off unless set', () => {
    expect(loadAppConfig({ JWT_ACCESS_SECRET: SECRET }).trustProxy).toBe(false);
    expect(loadAppConfig({ JWT_ACCESS_SECRET: SECRET, TRUST_PROXY: 'false' }).trustProxy).toBe(
      false,
    );
    expect(loadAppConfig({ JWT_ACCESS_SECRET: SECRET, TRUST_PROXY: 'true' }).trustProxy).toBe(true);
    expect(loadAppConfig({ JWT_ACCESS_SECRET: SECRET, TRUST_PROXY: '1' }).trustProxy).toBe(1);
  });

  it('rejects an unknown APP_ENV and a non-numeric limit', () => {
    expect(() => loadAppConfig({ JWT_ACCESS_SECRET: SECRET, APP_ENV: 'prod' })).toThrow(/APP_ENV/);
    expect(() =>
      loadAppConfig({ JWT_ACCESS_SECRET: SECRET, LOGIN_FAILURES_PER_WINDOW: 'lots' }),
    ).toThrow(/positive integer/);
  });
});
