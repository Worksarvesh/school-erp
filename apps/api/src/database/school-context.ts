import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Setting = 'app.school_id' | 'app.user_id';

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

async function withSetting<T>(
  prisma: PrismaClient,
  setting: Setting,
  id: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!UUID.test(id)) {
    throw new Error(`${setting} must be a UUID`);
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config(${setting}, ${id}, true)`;
    return fn(tx);
  });
}
