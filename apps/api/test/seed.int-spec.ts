/** The demo seed is idempotent and produces accounts that can actually sign in. */
import { PrismaPg } from '@prisma/adapter-pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import request from 'supertest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { DEMO_SCHOOLS, DEMO_USERS, seedDemoData } from '../src/seed/demo-data.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const PASSWORD = 'seed-test-password-1';

let owner: pg.Client;
let ownerPrisma: PrismaClient;
let prisma: PrismaClient;
let app: NestExpressApplication;

const counts = async () =>
  (
    await owner.query<{ schools: number; users: number; credentials: number; memberships: number }>(
      `SELECT (SELECT count(*)::int FROM schools) AS schools,
              (SELECT count(*)::int FROM users) AS users,
              (SELECT count(*)::int FROM credentials) AS credentials,
              (SELECT count(*)::int FROM school_memberships) AS memberships`,
    )
  ).rows[0];

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  ownerPrisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') }),
  });
  prisma = appPrisma(2);
  app = await createTestApp(prisma);
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await ownerPrisma?.$disconnect();
  if (owner) {
    await truncateTenantData(owner);
    await owner.end();
  }
});

describe('seedDemoData', () => {
  it('can run twice without duplicating anything', async () => {
    await seedDemoData(ownerPrisma, PASSWORD);
    const first = await counts();
    await seedDemoData(ownerPrisma, PASSWORD);
    expect(await counts()).toEqual(first);
    expect(first).toEqual({
      schools: DEMO_SCHOOLS.length,
      users: DEMO_USERS.length,
      credentials: DEMO_USERS.length,
      memberships: DEMO_USERS.flatMap((u) => u.roles).length,
    });
  });

  it('creates users who can sign in and see their schools', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ identifier: 'principal.sunrise@demo.school-erp.test', password: PASSWORD })
      .expect(200);
    const me = await request(app.getHttpServer())
      .get('/v1/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body.schools).toEqual([
      expect.objectContaining({ code: 'sch0001', roles: ['principal'] }),
    ]);
  });

  it('refuses a password that breaks the policy', async () => {
    await expect(seedDemoData(ownerPrisma, 'short')).rejects.toThrow(/10-128/);
  });
});
