import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

const TEST_DB = 'school_erp_test';

/** Same server and role as `envName`, but always the test database, never the dev one. */
export function testDbUrl(envName: 'DATABASE_URL' | 'MIGRATION_DATABASE_URL'): string {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`${envName} is not set. See docs/local-setup.md.`);
  }
  const url = new URL(value);
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

/**
 * Clears tenant data between test files. Leaves `permissions` and `role_permissions` alone:
 * they are reference data seeded by migrations.
 */
export async function truncateTenantData(owner: { query(sql: string): Promise<unknown> }) {
  await owner.query(
    'TRUNCATE audit_logs, sessions, credentials, school_memberships, users, schools CASCADE',
  );
}

/** Prisma client connected as the app role (no BYPASSRLS), like the running API. */
export function appPrisma(maxConnections: number): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: testDbUrl('DATABASE_URL'),
    max: maxConnections,
  });
  return new PrismaClient({ adapter });
}
