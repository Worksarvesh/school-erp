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
  },
});
