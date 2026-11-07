import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Integration tests need the local database (docker compose up -d --wait).
config({ path: '../../.env', quiet: true });

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.int-spec.ts'],
    globalSetup: ['./test/support/migrate-test-db.ts'],
    env: {
      // Many logins from one IP; the per-IP limit has its own test with a low value.
      AUTH_RATE_LIMIT_PER_MINUTE: '10000',
      // Test-only value (used unless .env sets one); never use it anywhere else.
      OTP_HASH_SECRET:
        process.env.OTP_HASH_SECRET ?? 'test-only-otp-hash-secret-not-used-elsewhere',
    },
    // Files share one test database.
    fileParallelism: false,
  },
});
