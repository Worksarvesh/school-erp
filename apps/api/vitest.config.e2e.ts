import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// AppModule needs DATABASE_URL.
config({ path: '../../.env', quiet: true });

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      // Test-only value (used unless .env sets one); never use it anywhere else.
      OTP_HASH_SECRET:
        process.env.OTP_HASH_SECRET ?? 'test-only-otp-hash-secret-not-used-elsewhere',
    },
  },
});
