import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface Identity {
  userId: string;
}

/** Works out who is calling. Step 2 replaces the default with JWT verification. */
export abstract class IdentityResolver {
  abstract resolve(request: Request): Promise<Identity | null>;
}

/** Until Step 2 there is no login, so nobody is authenticated and school routes return 401. */
@Injectable()
export class NoIdentityResolver extends IdentityResolver {
  resolve(): Promise<Identity | null> {
    return Promise.resolve(null);
  }
}
