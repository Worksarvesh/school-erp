import { randomUUID } from 'node:crypto';
import {
  formatRefreshToken,
  hashRefreshSecret,
  newRefreshSecret,
  parseRefreshToken,
} from './refresh-token.js';

describe('refresh tokens', () => {
  it('uses a 256-bit secret and stores only its SHA-256 hash', () => {
    const { secret, hash } = newRefreshSecret();
    expect(Buffer.from(secret, 'base64url')).toHaveLength(32);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashRefreshSecret(secret));
    expect(hash).not.toContain(secret);
  });

  it('never repeats a secret', () => {
    const secrets = new Set(Array.from({ length: 100 }, () => newRefreshSecret().secret));
    expect(secrets.size).toBe(100);
  });

  it('round-trips <session id>.<secret>', () => {
    const sessionId = randomUUID();
    const { secret } = newRefreshSecret();
    expect(parseRefreshToken(formatRefreshToken(sessionId, secret))).toEqual({ sessionId, secret });
  });

  it.each([
    '',
    'abc',
    `${randomUUID()}`,
    `not-a-uuid.${'a'.repeat(43)}`,
    `${randomUUID()}.short`,
    `${randomUUID()}.${'a'.repeat(43)}.extra`,
  ])('rejects malformed token %j', (token) => {
    expect(parseRefreshToken(token)).toBeNull();
  });
});
