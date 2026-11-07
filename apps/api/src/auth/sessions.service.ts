import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withUserContext } from '../database/school-context.js';
import type { ClientApp } from '../generated/prisma/enums.js';
import {
  formatRefreshToken,
  hashRefreshSecret,
  newRefreshSecret,
  REFRESH_TOKEN_TTL_MS,
} from './refresh-token.js';

export type RotateResult =
  | { status: 'rotated'; userId: string; sessionId: string; refreshToken: string; expiresAt: Date }
  | { status: 'reused'; userId: string; sessionId: string }
  | { status: 'invalid' };

/** The auth module owns the `sessions` table: one row per signed-in device. */
@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, deviceName: string | undefined, clientApp?: ClientApp) {
    const { secret, hash } = newRefreshSecret();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const session = await withUserContext(this.prisma, userId, (tx) =>
      tx.session.create({
        data: {
          userId,
          tokenHash: hash,
          deviceName: deviceName ?? null,
          clientApp: clientApp ?? null,
          expiresAt,
        },
        select: { id: true },
      }),
    );
    return {
      sessionId: session.id,
      refreshToken: formatRefreshToken(session.id, secret),
      expiresAt,
    };
  }

  /** Owner of a session, via the auth_find_session_user() SECURITY DEFINER function. */
  async findOwner(sessionId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<{ user_id: string | null }[]>`
      SELECT auth_find_session_user(${sessionId}::uuid) AS user_id`;
    return rows[0]?.user_id ?? null;
  }

  /**
   * Swaps the refresh secret in one conditional UPDATE, so of two concurrent refreshes with
   * the same token only one can match. Presenting the previous secret again is reuse: the
   * session is revoked (strict, no grace window; see docs/decisions.md).
   */
  rotate(userId: string, sessionId: string, presentedSecret: string): Promise<RotateResult> {
    const presented = hashRefreshSecret(presentedSecret);
    const next = newRefreshSecret();
    return withUserContext(this.prisma, userId, async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE sessions
        SET previous_token_hash = token_hash, token_hash = ${next.hash}, last_used_at = now()
        WHERE id = ${sessionId}::uuid AND token_hash = ${presented}
          AND revoked_at IS NULL AND expires_at > now()`;
      if (updated === 1) {
        const { expiresAt } = await tx.session.findUniqueOrThrow({
          where: { id: sessionId },
          select: { expiresAt: true },
        });
        const refreshToken = formatRefreshToken(sessionId, next.secret);
        return { status: 'rotated', userId, sessionId, refreshToken, expiresAt };
      }

      const reused = await tx.session.updateMany({
        where: { id: sessionId, previousTokenHash: presented, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'refresh_token_reuse' },
      });
      return reused.count === 1 ? { status: 'reused', userId, sessionId } : { status: 'invalid' };
    });
  }

  /** Revokes one of the user's sessions. False if it does not exist or is not theirs. */
  async revoke(userId: string, sessionId: string, reason: string): Promise<boolean> {
    const { count } = await withUserContext(this.prisma, userId, (tx) =>
      tx.session.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: reason },
      }),
    );
    return count === 1;
  }

  async revokeAll(userId: string, reason: string): Promise<number> {
    const { count } = await withUserContext(this.prisma, userId, (tx) =>
      tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: reason },
      }),
    );
    return count;
  }

  listActive(userId: string) {
    return withUserContext(this.prisma, userId, (tx) =>
      tx.session.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastUsedAt: 'desc' },
        select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true, expiresAt: true },
      }),
    );
  }
}
