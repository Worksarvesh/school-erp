import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenService } from './access-token.service.js';
import { type Identity, IdentityResolver } from './identity.js';

/** Reads `Authorization: Bearer <access token>`. */
@Injectable()
export class JwtIdentityResolver extends IdentityResolver {
  constructor(private readonly tokens: AccessTokenService) {
    super();
  }

  resolve(request: Request): Promise<Identity | null> {
    const header = request.header('authorization') ?? '';
    const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(header);
    return match ? this.tokens.verify(match[1]!) : Promise.resolve(null);
  }
}
