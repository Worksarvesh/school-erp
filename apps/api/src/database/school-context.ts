import type { Prisma, PrismaClient } from '../generated/prisma/client.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs `fn` in one transaction with `app.school_id` set, so RLS policies see only that school.
 *
 * The setting is transaction-local (`set_config(..., true)`): it ends at COMMIT or ROLLBACK and
 * cannot leak to the next request that reuses this pooled connection. Never use plain `SET`.
 */
export async function withSchoolContext<T>(
  prisma: PrismaClient,
  schoolId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!UUID.test(schoolId)) {
    throw new Error('schoolId must be a UUID');
  }
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.school_id', ${schoolId}, true)`;
    return fn(tx);
  });
}
