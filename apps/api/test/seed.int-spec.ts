/** The demo seed is idempotent and produces accounts that can actually sign in. */
import { PrismaPg } from '@prisma/adapter-pg';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import request from 'supertest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { DEMO_APPLICANT, DEMO_SCHOOLS, DEMO_USERS, seedDemoData } from '../src/seed/demo-data.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const PASSWORD = 'seed-test-password-1';

let owner: pg.Client;
let ownerPrisma: PrismaClient;
let prisma: PrismaClient;
let app: NestExpressApplication;

const counts = async () =>
  (
    await owner.query<{
      schools: number;
      users: number;
      credentials: number;
      memberships: number;
      platformStaff: number;
      requests: number;
    }>(
      `SELECT (SELECT count(*)::int FROM schools) AS schools,
              (SELECT count(*)::int FROM users) AS users,
              (SELECT count(*)::int FROM credentials) AS credentials,
              (SELECT count(*)::int FROM school_memberships) AS memberships,
              (SELECT count(*)::int FROM platform_staff) AS "platformStaff",
              (SELECT count(*)::int FROM school_verification_requests) AS requests`,
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
      users: DEMO_USERS.length + 1, // + the OTP-only applicant
      credentials: DEMO_USERS.length,
      memberships: DEMO_USERS.flatMap((u) => u.roles).length,
      platformStaff: DEMO_USERS.filter((u) => u.platformRole).length,
      requests: 1,
    });
  });

  it('lets the demo principal sign in with the fixed OTP', async () => {
    const principal = DEMO_USERS.find((u) => u.email.startsWith('principal.sunrise'))!;
    await request(app.getHttpServer())
      .post('/v1/auth/otp/request')
      .send({ phone: principal.phone })
      .expect(202);
    const res = await request(app.getHttpServer())
      .post('/v1/auth/otp/verify')
      .send({ phone: principal.phone, code: '999999' })
      .expect(200);
    expect(res.body).toMatchObject({ isNewUser: false, user: { id: principal.id } });
  });

  it("puts the applicant's request in the demo verifier's queue", async () => {
    const verifier = DEMO_USERS.find((u) => u.platformRole === 'verifier')!;
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ identifier: verifier.email, password: PASSWORD })
      .expect(200);
    const queue = await request(app.getHttpServer())
      .get('/v1/platform/school-verification-requests')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(queue.body.items).toEqual([
      expect.objectContaining({
        id: DEMO_APPLICANT.requestId,
        proposedName: DEMO_APPLICANT.proposedName,
      }),
    ]);
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
