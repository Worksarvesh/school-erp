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
    // Files share one test database.
    fileParallelism: false,
  },
});
