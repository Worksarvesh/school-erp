import { isUuid } from '../common/uuid.js';
import type { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { PlatformRole } from '../generated/prisma/enums.js';

type Setting = 'app.school_id' | 'app.user_id';
const PLATFORM_ROLES: string[] = Object.values(PlatformRole);

/**
 * Runs `fn` in one transaction with `app.school_id` set, so RLS policies see only that school.
 *
 * The setting is transaction-local (`set_config(..., true)`): it ends at COMMIT or ROLLBACK and
 * cannot leak to the next request that reuses this pooled connection. Never use plain `SET`.
 */
export function withSchoolContext<T>(
  prisma: PrismaClient,
  schoolId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withSetting(prisma, 'app.school_id', schoolId, fn);
}

/**
 * Runs `fn` in one transaction with `app.user_id` set and no school. RLS then shows only the
 * user's own row and memberships (for example, to list the schools a user can open).
 */
export function withUserContext<T>(
  prisma: PrismaClient,
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withSetting(prisma, 'app.user_id', userId, fn);
}

/**
 * Platform path (Verifier, Super Admin) after PlatformGuard has checked `platform_staff`:
 * `app.user_id` plus `app.platform_role`, which the platform RLS policies read. No school is set.
 */
export function withPlatformContext<T>(
  prisma: PrismaClient,
  userId: string,
  role: PlatformRole,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!isUuid(userId) || !PLATFORM_ROLES.includes(role)) {
    throw new Error('platform context needs a user id and a platform role');
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.platform_role', ${role}, true)`;
    return fn(tx);
  });
}

async function withSetting<T>(
  prisma: PrismaClient,
  setting: Setting,
  id: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!isUuid(id)) {
    throw new Error(`${setting} must be a UUID`);
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config(${setting}, ${id}, true)`;
    return fn(tx);
  });
}
