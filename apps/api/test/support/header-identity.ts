import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { type Identity, IdentityResolver } from '../../src/auth/identity.js';

export const TEST_USER_HEADER = 'x-test-user-id';

/** Test-only stand-in for Step 2's JWT auth: trusts a header. Never register this in src/. */
@Injectable()
export class HeaderIdentityResolver extends IdentityResolver {
  resolve(request: Request): Promise<Identity | null> {
    const userId = request.header(TEST_USER_HEADER);
    return Promise.resolve(userId ? { userId } : null);
  }
}
