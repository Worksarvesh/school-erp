import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// One .env at the repo root (see docs/local-setup.md).
config({ path: '../../.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // The Prisma CLI (migrate) runs as the owner role. The running API uses DATABASE_URL
    // through the pg adapter instead. Not required for `prisma generate`, so no throw here.
    url: process.env.MIGRATION_DATABASE_URL ?? '',
  },
});
