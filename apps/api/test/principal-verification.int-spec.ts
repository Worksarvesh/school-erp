/**
 * Slice 2B: a principal finds their school (or describes one that is not listed), submits it for
 * verification, and a School Verifier approves or rejects it on the platform path.
 */
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import request from 'supertest';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { bearer, createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const id = (suffix: string) => `0192f0a8-0000-7000-8000-${suffix.padStart(12, '0')}`;
const LISTED = id('a'); // unclaimed directory entry
const LISTED_2 = id('b'); // second unclaimed entry, for pagination
const SUSPENDED = id('c');
const TAKEN = id('d'); // already has an active principal
const P_LISTED = id('11'); // claims LISTED
const P_UNLISTED = id('12'); // describes a new school
const P_REJECTED = id('13'); // gets rejected, then resubmits
const P_TAKEN = id('14'); // claims TAKEN
const P_NOBODY = id('15'); // never submits
const TAKEN_PRINCIPAL = id('16');
const VERIFIER = id('21');
const SUPER_ADMIN = id('22');
const DISABLED_VERIFIER = id('23');

let owner: pg.Client;
let prisma: PrismaClient;
let app: NestExpressApplication;
const tokens: Record<string, string> = {};
const http = () => request(app.getHttpServer());
const as = (userId: string) => ({
  get: (path: string) => http().get(path).set('Authorization', tokens[userId]!),
  post: (path: string, body: object = {}) =>
    http().post(path).set('Authorization', tokens[userId]!).send(body),
});
const submit = (userId: string, body: object) =>
  as(userId).post('/v1/me/school-verification-requests', body);
const queue = '/v1/platform/school-verification-requests';

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  await owner.query(`
    INSERT INTO schools (id, name, code, city, pin_code, status, updated_at) VALUES
      ('${LISTED}', 'Green Valley School', 'sch9201', 'Pune', '411001', 'unclaimed', now()),
      ('${LISTED_2}', 'Green Meadows School', 'sch9202', 'Pune', '411002', 'unclaimed', now()),
      ('${SUSPENDED}', 'Green Closed School', 'sch9203', 'Pune', '411003', 'suspended', now()),
      ('${TAKEN}', 'Hilltop School', 'sch9204', 'Nashik', '422001', 'active', now());
    INSERT INTO users (id, full_name, phone, updated_at) VALUES
      ('${P_LISTED}', '', '+919000030011', now()),
      ('${P_UNLISTED}', '', '+919000030012', now()),
      ('${P_REJECTED}', '', '+919000030013', now()),
      ('${P_TAKEN}', '', '+919000030014', now()),
      ('${P_NOBODY}', '', '+919000030015', now()),
      ('${TAKEN_PRINCIPAL}', 'Existing Principal', '+919000030016', now()),
      ('${VERIFIER}', 'Vera Verifier', '+919000030021', now()),
      ('${SUPER_ADMIN}', 'Sam Super', '+919000030022', now()),
      ('${DISABLED_VERIFIER}', 'Old Verifier', '+919000030023', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      (gen_random_uuid(), '${TAKEN}', '${TAKEN_PRINCIPAL}', 'principal', 'active', now());
    INSERT INTO platform_staff (user_id, role, status, updated_at) VALUES
      ('${VERIFIER}', 'verifier', 'active', now()),
      ('${SUPER_ADMIN}', 'super_admin', 'active', now()),
      ('${DISABLED_VERIFIER}', 'verifier', 'disabled', now());
  `);
  prisma = appPrisma(4);
  app = await createTestApp(prisma);
  for (const user of [
    P_LISTED,
    P_UNLISTED,
    P_REJECTED,
    P_TAKEN,
    P_NOBODY,
    VERIFIER,
    SUPER_ADMIN,
    DISABLED_VERIFIER,
  ]) {
    tokens[user] = await bearer(app, user);
  }
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
  await truncateTenantData(owner);
  await owner.end();
});

describe('GET /v1/directory/schools', () => {
  it('finds schools by name or PIN, with public fields only, never suspended ones', async () => {
    const byName = await as(P_NOBODY).get('/v1/directory/schools?q=green').expect(200);
    expect(byName.body.items).toEqual([
      {
        id: LISTED_2,
        name: 'Green Meadows School',
        code: 'sch9202',
        city: 'Pune',
        pinCode: '411002',
      },
      { id: LISTED, name: 'Green Valley School', code: 'sch9201', city: 'Pune', pinCode: '411001' },
    ]);
    const byPin = await as(P_NOBODY).get('/v1/directory/schools?q=422001').expect(200);
    expect(byPin.body.items.map((s: { id: string }) => s.id)).toEqual([TAKEN]);
  });

  it('pages with an opaque cursor', async () => {
    const first = await as(P_NOBODY).get('/v1/directory/schools?q=green&limit=1').expect(200);
    expect(first.body.items).toHaveLength(1);
    const second = await as(P_NOBODY)
      .get(`/v1/directory/schools?q=green&limit=1&cursor=${first.body.nextCursor}`)
      .expect(200);
    expect(second.body.items[0].id).toBe(LISTED);
    expect(second.body.nextCursor).toBeNull();
    await as(P_NOBODY).get('/v1/directory/schools?q=green&cursor=garbage').expect(400);
  });

  it('treats LIKE wildcards literally', async () => {
    const res = await as(P_NOBODY).get('/v1/directory/schools?q=%25%25').expect(200);
    expect(res.body.items).toEqual([]);
  });
});

describe('principal submits, verifier approves a listed school', () => {
  let requestId: string;

  it('submits a claim and sees it as pending', async () => {
    const res = await submit(P_LISTED, { principalName: 'Lata Listed', schoolId: LISTED }).expect(
      201,
    );
    requestId = res.body.id;
    expect(res.body).toMatchObject({ status: 'pending', schoolId: LISTED });
    const own = await as(P_LISTED).get('/v1/me/school-verification-requests').expect(200);
    expect(own.body.items.map((r: { id: string }) => r.id)).toEqual([requestId]);
    const me = await as(P_LISTED).get('/v1/me').expect(200);
    expect(me.body.fullName).toBe('Lata Listed');
  });

  it('allows only one pending request at a time', async () => {
    const res = await submit(P_LISTED, { principalName: 'Lata Listed', schoolId: LISTED_2 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('request_pending');
  });

  it('gives an unverified principal no access to the school', async () => {
    await as(P_LISTED).get(`/v1/schools/${LISTED}`).expect(404);
  });

  it('shows the request in the verifier queue with the principal contact', async () => {
    const res = await as(VERIFIER).get(queue).expect(200);
    const item = res.body.items.find((r: { id: string }) => r.id === requestId);
    expect(item).toMatchObject({ principal: { fullName: 'Lata Listed', phone: '+919000030011' } });
    await as(VERIFIER).get(`${queue}/${requestId}`).expect(200);
  });

  it('approves: the school becomes active and the principal can open it', async () => {
    const res = await as(VERIFIER).post(`${queue}/${requestId}/approve`).expect(200);
    expect(res.body).toEqual({ id: requestId, status: 'approved', schoolId: LISTED });
    const school = await as(P_LISTED).get(`/v1/schools/${LISTED}`).expect(200);
    expect(school.body).toMatchObject({ id: LISTED });

    const { rows } = await owner.query<{ status: string; audits: number }>(
      `SELECT s.status,
        (SELECT count(*)::int FROM audit_logs a
          WHERE a.action = 'verification.approved' AND a.school_id = s.id
            AND a.actor_user_id = '${VERIFIER}' AND a.actor_role = 'verifier') AS audits
       FROM schools s WHERE s.id = '${LISTED}'`,
    );
    expect(rows[0]).toEqual({ status: 'active', audits: 1 });
  });

  it('refuses a second decision', async () => {
    const res = await as(SUPER_ADMIN).post(`${queue}/${requestId}/approve`).expect(409);
    expect(res.body.error.code).toBe('already_decided');
  });
});

describe('a school that is not listed', () => {
  it('validates the shape of the request', async () => {
    await submit(P_UNLISTED, {
      principalName: 'Uma',
      schoolId: LISTED_2,
      proposedName: 'X',
    }).expect(400);
    await submit(P_UNLISTED, { principalName: 'Uma', proposedName: 'New School' }).expect(400);
    await submit(P_UNLISTED, {
      principalName: 'Uma',
      proposedName: 'New School',
      proposedAddress: '1 Main Road',
      proposedPinCode: '012345',
    }).expect(400);
    await submit(P_UNLISTED, { principalName: 'Uma', schoolId: id('ff') }).expect(400);
  });

  it('creates the school with the next sch code on approval', async () => {
    const submitted = await submit(P_UNLISTED, {
      principalName: 'Uma Unlisted',
      proposedName: 'Riverside Public School',
      proposedAddress: '12 River Road, Nagpur',
      proposedPinCode: '440001',
    }).expect(201);
    const approved = await as(SUPER_ADMIN)
      .post(`${queue}/${submitted.body.id}/approve`)
      .expect(200);
    const { rows } = await owner.query<{ code: string; status: string; pin_code: string }>(
      'SELECT code, status, pin_code FROM schools WHERE id = $1',
      [approved.body.schoolId],
    );
    expect(rows[0]).toMatchObject({ status: 'active', pin_code: '440001' });
    expect(rows[0]!.code).toMatch(/^sch[0-9]{4,}$/);
    await as(P_UNLISTED).get(`/v1/schools/${approved.body.schoolId}`).expect(200);
  });
});

describe('rejection and resubmission', () => {
  let rejectedId: string;

  it('needs a reason, then shows it to the principal', async () => {
    const res = await submit(P_REJECTED, { principalName: 'Ravi', schoolId: LISTED_2 }).expect(201);
    rejectedId = res.body.id;
    await as(VERIFIER).post(`${queue}/${rejectedId}/reject`, {}).expect(400);
    await as(VERIFIER).post(`${queue}/${rejectedId}/reject`, { reason: '   ' }).expect(400);
    await as(VERIFIER)
      .post(`${queue}/${rejectedId}/reject`, { reason: 'Could not confirm with the school office' })
      .expect(200);
    const own = await as(P_REJECTED).get('/v1/me/school-verification-requests').expect(200);
    expect(own.body.items[0]).toMatchObject({
      status: 'rejected',
      decisionReason: 'Could not confirm with the school office',
    });
  });

  it('resubmits once, keeping the history; nobody else can resubmit it', async () => {
    await submit(P_LISTED, {
      principalName: 'Lata',
      schoolId: LISTED_2,
      previousRequestId: rejectedId,
    }).expect(400);
    const again = await submit(P_REJECTED, {
      principalName: 'Ravi Rao',
      schoolId: LISTED_2,
      previousRequestId: rejectedId,
    }).expect(201);
    expect(again.body.previousRequestId).toBe(rejectedId);
    const own = await as(P_REJECTED).get('/v1/me/school-verification-requests').expect(200);
    expect(own.body.items.map((r: { status: string }) => r.status)).toEqual([
      'pending',
      'rejected',
    ]);
  });
});

describe('conflicts and the platform guard', () => {
  it('refuses to add a second principal to a school that has one', async () => {
    const res = await submit(P_TAKEN, { principalName: 'Tara', schoolId: TAKEN }).expect(201);
    const approve = await as(VERIFIER).post(`${queue}/${res.body.id}/approve`).expect(409);
    expect(approve.body.error.code).toBe('school_has_principal');
  });

  it('refuses principals and disabled platform staff, and audits every platform call', async () => {
    await as(P_NOBODY).get(queue).expect(403);
    await as(DISABLED_VERIFIER).get(queue).expect(403);
    const { rows } = await owner.query<{ allowed: string; n: number }>(
      `SELECT metadata->>'allowed' AS allowed, count(*)::int AS n FROM audit_logs
       WHERE action = 'platform.request' GROUP BY 1 ORDER BY 1`,
    );
    expect(rows.find((r) => r.allowed === 'false')?.n).toBeGreaterThanOrEqual(2);
    expect(rows.find((r) => r.allowed === 'true')?.n).toBeGreaterThan(0);
  });

  it('lets platform staff add a directory entry with the next sch code', async () => {
    const res = await as(VERIFIER)
      .post('/v1/platform/schools', { name: 'Lakeside School', city: 'Bhopal', pinCode: '462001' })
      .expect(201);
    expect(res.body).toMatchObject({ name: 'Lakeside School', status: 'unclaimed' });
    expect(res.body.code).toMatch(/^sch[0-9]{4,}$/);
  });
});
