import type { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { IdentityResolver } from '../../src/auth/identity.js';
import { configureApp } from '../../src/configure-app.js';
import { PrismaService } from '../../src/database/prisma.service.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { HeaderIdentityResolver } from './header-identity.js';

interface TestAppOptions {
  /** 'header' trusts the x-test-user-id header; 'default' keeps the real (no login yet) resolver. */
  identity?: 'header' | 'default';
  /** Extra test-only controllers. */
  controllers?: Type[];
}

/** The real AppModule, wired to the test database, configured exactly like main.ts. */
export async function createTestApp(
  prisma: PrismaClient,
  { identity = 'header', controllers = [] }: TestAppOptions = {},
): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule], controllers })
    .overrideProvider(PrismaService)
    .useValue(prisma);
  if (identity === 'header') {
    builder = builder.overrideProvider(IdentityResolver).useClass(HeaderIdentityResolver);
  }
  const moduleRef = await builder.compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: false }));
  await app.init();
  return app;
}
