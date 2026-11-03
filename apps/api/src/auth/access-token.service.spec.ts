import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { JWT_AUDIENCE, JWT_ISSUER } from '../config/app-config.js';
import { AccessTokenService } from './access-token.service.js';
import { jwtOptions } from './identity.module.js';

const SECRET = 'a'.repeat(32);
const service = new AccessTokenService(new JwtService(jwtOptions({ jwtAccessSecret: SECRET })));
const identity = { userId: randomUUID(), sessionId: randomUUID() };

/** Signs with the same secret but options of our choosing, to build bad tokens. */
const forge = (payload: object, options: Record<string, unknown>, secret = SECRET) =>
  new JwtService({ secret }).sign(payload, options);
const valid = { issuer: JWT_ISSUER, audience: JWT_AUDIENCE, subject: identity.userId };
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('AccessTokenService', () => {
  it('round-trips user id and session id, and nothing else', async () => {
    const token = await service.sign(identity);
    expect(await service.verify(token)).toEqual(identity);

    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    expect(Object.keys(payload).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'sid', 'sub']);
  });

  it('expires after 15 minutes', async () => {
    const token = await service.sign(identity);
    const { iat, exp } = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    expect(exp - iat).toBe(15 * 60);
  });

  it.each([
    [
      'alg none',
      () =>
        `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ ...valid, sid: identity.sessionId, sub: identity.userId, iss: JWT_ISSUER, aud: JWT_AUDIENCE })}.`,
    ],
    ['HS512', () => forge({ sid: identity.sessionId }, { ...valid, algorithm: 'HS512' })],
    [
      'wrong issuer',
      () => forge({ sid: identity.sessionId }, { ...valid, issuer: 'someone-else' }),
    ],
    ['wrong audience', () => forge({ sid: identity.sessionId }, { ...valid, audience: 'other' })],
    [
      'no issuer or audience',
      () => forge({ sid: identity.sessionId }, { subject: identity.userId }),
    ],
    [
      'expired',
      () => forge({ sid: identity.sessionId, exp: Math.floor(Date.now() / 1000) - 10 }, valid),
    ],
    ['wrong secret', () => forge({ sid: identity.sessionId }, valid, 'b'.repeat(32))],
    ['missing session id', () => forge({}, valid)],
    ['non-uuid subject', () => forge({ sid: identity.sessionId }, { ...valid, subject: 'admin' })],
    ['garbage', () => 'not.a.jwt'],
  ])('rejects %s', async (_name, make) => {
    expect(await service.verify(make())).toBeNull();
  });
});
