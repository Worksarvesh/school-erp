import { execSync } from 'node:child_process';
import { testDbUrl } from './test-db.js';

/** Vitest global setup: bring the test database up to the latest migration before any test. */
export default function migrateTestDb(): void {
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, MIGRATION_DATABASE_URL: testDbUrl('MIGRATION_DATABASE_URL') },
    stdio: 'pipe',
  });
}
