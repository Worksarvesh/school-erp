import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUuid } from '../common/uuid.js';
import type { Identity } from './identity.js';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * Access JWTs: HS256 only, fixed issuer and audience (set in IdentityModule), 15 minutes.
 * Payload is `sub` (user id) and `sid` (session id), nothing else.
 */
@Injectable()
export class AccessTokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(identity: Identity): Promise<string> {
    return this.jwt.signAsync({ sid: identity.sessionId }, { subject: identity.userId });
  }

  /** The identity in a valid token, or null for anything invalid, expired or tampered with. */
  async verify(token: string): Promise<Identity | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown; sid?: unknown }>(token);
      if (!isUuid(payload.sub) || !isUuid(payload.sid)) {
        return null;
      }
      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      return null;
    }
  }
}
