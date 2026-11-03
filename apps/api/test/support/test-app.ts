import { randomUUID } from 'node:crypto';
import type { LoggerService, Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { AccessTokenService } from '../../src/auth/access-token.service.js';
import { configureApp } from '../../src/configure-app.js';
import { PrismaService } from '../../src/database/prisma.service.js';
import type { PrismaClient } from '../../src/generated/prisma/client.js';

/** The real AppModule (real JWT auth), wired to the test database, configured like main.ts. */
export async function createTestApp(
  prisma: PrismaClient,
  { controllers = [], logger }: { controllers?: Type[]; logger?: LoggerService } = {},
): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();
  const app = configureApp(
    moduleRef.createNestApplication<NestExpressApplication>({ logger: logger ?? false }),
  );
  await app.init();
  return app;
}

/**
 * `Authorization` header value with a real access token for `userId`. The session id is
 * random: guards do not look sessions up (memberships are checked live instead).
 */
export async function bearer(app: NestExpressApplication, userId: string): Promise<string> {
  const token = await app.get(AccessTokenService).sign({ userId, sessionId: randomUUID() });
  return `Bearer ${token}`;
}
