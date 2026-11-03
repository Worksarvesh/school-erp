import { createHash, randomBytes } from 'node:crypto';
import { isUuid } from '../common/uuid.js';

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days from login

/** `<session id>.<secret>`: the id finds the row, the 256-bit secret proves possession. */
export function newRefreshSecret(): { secret: string; hash: string } {
  const secret = randomBytes(32).toString('base64url');
  return { secret, hash: hashRefreshSecret(secret) };
}

export function formatRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}

export function parseRefreshToken(token: string): { sessionId: string; secret: string } | null {
  const [sessionId, secret, ...rest] = token.split('.');
  if (rest.length > 0 || !isUuid(sessionId) || !secret || !/^[A-Za-z0-9_-]{43}$/.test(secret)) {
    return null;
  }
  return { sessionId, secret };
}

/** SHA-256 is enough for a 256-bit random secret (no need for a slow password hash). */
export function hashRefreshSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
