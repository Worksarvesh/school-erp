import type { Request } from 'express';

/** Who is calling. The access token carries only these two ids; memberships are checked live. */
export interface Identity {
  userId: string;
  sessionId: string;
}

/** Works out who is calling from the request. */
export abstract class IdentityResolver {
  abstract resolve(request: Request): Promise<Identity | null>;
}
