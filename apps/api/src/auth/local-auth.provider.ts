import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { ApiException } from '../common/errors.js';
import { UsersService } from '../users/users.service.js';
import { ACCESS_TOKEN_TTL_SECONDS, AccessTokenService } from './access-token.service.js';
import {
  AuthProvider,
  type LoginInput,
  type LoginResult,
  type RequestMeta,
  type TokenPair,
} from './auth-provider.js';
import { CredentialsService } from './credentials.service.js';
import { normalizeIdentifier } from './identifier.js';
import type { Identity } from './identity.js';
import { LoginFailureLimiter } from './login-failure-limiter.js';
import { PasswordService } from './password.service.js';
import { parseRefreshToken } from './refresh-token.js';
import { SessionsService } from './sessions.service.js';

// One answer for unknown account, disabled account and wrong password: no account enumeration.
const invalidCredentials = () =>
  new ApiException(HttpStatus.UNAUTHORIZED, 'invalid_credentials', 'Invalid login details');
const invalidRefresh = () =>
  new ApiException(HttpStatus.UNAUTHORIZED, 'invalid_refresh_token', 'Sign in again');
const tooManyAttempts = () =>
  new ApiException(
    HttpStatus.TOO_MANY_REQUESTS,
    'too_many_requests',
    'Too many attempts, try again later',
  );

@Injectable()
export class LocalAuthProvider extends AuthProvider {
  constructor(
    private readonly users: UsersService,
    private readonly credentials: CredentialsService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
    private readonly accessTokens: AccessTokenService,
    private readonly limiter: LoginFailureLimiter,
    private readonly audit: AuditService,
  ) {
    super();
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<LoginResult> {
    const identifier = normalizeIdentifier(input.identifier);
    // Rate-limit key: the normalised identifier, so "+91 98..." and "98..." count together.
    const limitKey = identifier ?? input.identifier.trim().toLowerCase();
    if (this.limiter.isBlocked(limitKey)) {
      await this.audit.record({ action: 'auth.login_rate_limited', ip: meta.ip });
      throw tooManyAttempts();
    }

    const user = identifier ? await this.users.findLoginUser(identifier) : null;
    const ok =
      user?.status === 'active'
        ? await this.credentials.verifyPassword(user.userId, input.password)
        : await this.passwords.verifyDummy(input.password);

    if (!user || !ok) {
      this.limiter.recordFailure(limitKey);
      await this.audit.record({
        action: 'auth.login_failed',
        actorUserId: user?.userId ?? null,
        ip: meta.ip,
      });
      throw invalidCredentials();
    }

    this.limiter.reset(limitKey);
    const session = await this.sessions.create(user.userId, input.deviceName);
    await this.audit.record({
      action: 'auth.login_succeeded',
      actorUserId: user.userId,
      targetType: 'session',
      targetId: session.sessionId,
      ip: meta.ip,
    });
    const profile = await this.users.getOwnProfile(user.userId);
    return {
      ...(await this.tokens(
        user.userId,
        session.sessionId,
        session.refreshToken,
        session.expiresAt,
      )),
      user: { id: user.userId, fullName: profile?.fullName ?? '' },
    };
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const parsed = parseRefreshToken(refreshToken);
    const userId = parsed ? await this.sessions.findOwner(parsed.sessionId) : null;
    if (!parsed || !userId) {
      throw invalidRefresh();
    }

    const profile = await this.users.getOwnProfile(userId);
    if (profile?.status !== 'active') {
      await this.sessions.revoke(userId, parsed.sessionId, 'user_disabled');
      throw invalidRefresh();
    }

    const result = await this.sessions.rotate(userId, parsed.sessionId, parsed.secret);
    if (result.status === 'reused') {
      await this.audit.record({
        action: 'auth.refresh_reuse_detected',
        actorUserId: userId,
        targetType: 'session',
        targetId: parsed.sessionId,
        ip: meta.ip,
      });
    }
    if (result.status !== 'rotated') {
      throw invalidRefresh();
    }
    return this.tokens(userId, result.sessionId, result.refreshToken, result.expiresAt);
  }

  async logout(identity: Identity, meta: RequestMeta): Promise<void> {
    await this.sessions.revoke(identity.userId, identity.sessionId, 'logout');
    await this.audit.record({
      action: 'auth.logout',
      actorUserId: identity.userId,
      targetType: 'session',
      targetId: identity.sessionId,
      ip: meta.ip,
    });
  }

  async logoutAll(identity: Identity, meta: RequestMeta): Promise<number> {
    const revoked = await this.sessions.revokeAll(identity.userId, 'logout_all');
    await this.audit.record({
      action: 'auth.logout_all',
      actorUserId: identity.userId,
      ip: meta.ip,
      metadata: { revoked },
    });
    return revoked;
  }

  async revokeSession(identity: Identity, sessionId: string, meta: RequestMeta): Promise<boolean> {
    const revoked = await this.sessions.revoke(identity.userId, sessionId, 'revoked_by_user');
    if (revoked) {
      await this.audit.record({
        action: 'auth.session_revoked',
        actorUserId: identity.userId,
        targetType: 'session',
        targetId: sessionId,
        ip: meta.ip,
      });
    }
    return revoked;
  }

  private async tokens(
    userId: string,
    sessionId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<TokenPair> {
    return {
      accessToken: await this.accessTokens.sign({ userId, sessionId }),
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
    };
  }
}
