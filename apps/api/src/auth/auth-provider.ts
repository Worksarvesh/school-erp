import type { Identity } from './identity.js';

export interface RequestMeta {
  ip: string | null;
}

export interface TokenPair {
  accessToken: string;
  /** Seconds. */
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResult extends TokenPair {
  user: { id: string; fullName: string };
}

export interface LoginInput {
  identifier: string;
  password: string;
  deviceName?: string;
}

/**
 * Sign-in and sessions. We run our own (LocalAuthProvider); this interface keeps the door open
 * to a managed provider without touching controllers or guards.
 */
export abstract class AuthProvider {
  abstract login(input: LoginInput, meta: RequestMeta): Promise<LoginResult>;
  abstract refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair>;
  abstract logout(identity: Identity, meta: RequestMeta): Promise<void>;
  abstract logoutAll(identity: Identity, meta: RequestMeta): Promise<number>;
  /** False if the session does not exist or belongs to someone else. */
  abstract revokeSession(
    identity: Identity,
    sessionId: string,
    meta: RequestMeta,
  ): Promise<boolean>;
}
