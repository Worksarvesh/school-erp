/**
 * Step 1.5: the first real school routes, through the real AppModule and seeded permissions.
 *   GET /v1/schools/:schoolId          (school.read)
 *   GET /v1/schools/:schoolId/members  (members.read)
 */
import type { INestApplication } from '@nestjs/common';
import pg from 'pg';
import request from 'supertest';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { TEST_USER_HEADER } from './support/header-identity.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const id = (suffix: string) => `0192f0a3-0000-7000-8000-${suffix.padStart(12, '0')}`;

const SCHOOL_A = id('a');
const SCHOOL_B = id('b');
const PRINCIPAL_A = id('a1');
const TEACHER_A = id('a2');
const TEACHER_A2 = id('a3');
const CLERK_A = id('a4');
const PRINCIPAL_B = id('b1');
const USER_AB = id('ab'); // parent in A, teacher in B

// Membership ids ascend in this order, which is the list order.
const M = { pA: id('101'), tA: id('102'), t2A: id('103'), cA: id('104'), abA: id('105') };
const MB = { pB: id('201'), abB: id('202') };

let owner: pg.Client;
let prisma: PrismaClient;
let app: INestApplication;

const get = (path: string, userId: string) =>
  request(app.getHttpServer()).get(path).set(TEST_USER_HEADER, userId);
const ids = (res: request.Response) => (res.body.items as { id: string }[]).map((m) => m.id);

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES
      ('${SCHOOL_A}', 'School A', 'SCH-A', now()),
      ('${SCHOOL_B}', 'School B', 'SCH-B', now());
    INSERT INTO users (id, full_name, updated_at) VALUES
      ('${PRINCIPAL_A}', 'Principal A', now()),
      ('${TEACHER_A}', 'Teacher A', now()),
      ('${TEACHER_A2}', 'Teacher A2', now()),
      ('${CLERK_A}', 'Clerk A', now()),
      ('${PRINCIPAL_B}', 'Principal B', now()),
      ('${USER_AB}', 'User AB', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      ('${M.pA}', '${SCHOOL_A}', '${PRINCIPAL_A}', 'principal', 'active', now()),
      ('${M.tA}', '${SCHOOL_A}', '${TEACHER_A}', 'teacher', 'active', now()),
      ('${M.t2A}', '${SCHOOL_A}', '${TEACHER_A2}', 'teacher', 'invited', now()),
      ('${M.cA}', '${SCHOOL_A}', '${CLERK_A}', 'office_clerk', 'suspended', now()),
      ('${M.abA}', '${SCHOOL_A}', '${USER_AB}', 'parent', 'active', now()),
      ('${MB.pB}', '${SCHOOL_B}', '${PRINCIPAL_B}', 'principal', 'active', now()),
      ('${MB.abB}', '${SCHOOL_B}', '${USER_AB}', 'teacher', 'active', now());
  `);
  prisma = appPrisma(2);
  app = await createTestApp(prisma);
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  if (owner) {
    await truncateTenantData(owner);
    await owner.end();
  }
});

describe('GET /v1/schools/:schoolId', () => {
  it('returns the school profile', async () => {
    const res = await get(`/v1/schools/${SCHOOL_A}`, PRINCIPAL_A).expect(200);
    expect(res.body).toEqual({
      id: SCHOOL_A,
      name: 'School A',
      code: 'SCH-A',
      udiseCode: null,
      status: 'active',
    });
  });

  it('is readable by any active member', async () => {
    await get(`/v1/schools/${SCHOOL_A}`, TEACHER_A).expect(200);
    await get(`/v1/schools/${SCHOOL_A}`, USER_AB).expect(200);
  });

  it('returns 404 to members of other schools and to inactive members', async () => {
    await get(`/v1/schools/${SCHOOL_A}`, PRINCIPAL_B).expect(404);
    await get(`/v1/schools/${SCHOOL_A}`, CLERK_A).expect(404); // suspended
  });
});

describe('GET /v1/schools/:schoolId/members', () => {
  it("lists only this school's memberships, with names", async () => {
    const res = await get(`/v1/schools/${SCHOOL_A}/members`, PRINCIPAL_A).expect(200);
    expect(ids(res)).toEqual([M.pA, M.tA, M.t2A, M.cA, M.abA]);
    expect(res.body.items[0]).toEqual({
      id: M.pA,
      userId: PRINCIPAL_A,
      fullName: 'Principal A',
      role: 'principal',
      status: 'active',
      createdAt: expect.any(String),
    });
    expect(res.body.nextCursor).toBeNull();

    const b = await get(`/v1/schools/${SCHOOL_B}/members`, PRINCIPAL_B).expect(200);
    expect(ids(b)).toEqual([MB.pB, MB.abB]);
  });

  it("shows a multi-school user only in this school's role", async () => {
    const res = await get(`/v1/schools/${SCHOOL_A}/members`, PRINCIPAL_A).expect(200);
    const ab = (res.body.items as { userId: string; role: string }[]).filter(
      (m) => m.userId === USER_AB,
    );
    expect(ab.map((m) => m.role)).toEqual(['parent']);
  });

  it('returns 403 to members without members.read', async () => {
    await get(`/v1/schools/${SCHOOL_A}/members`, TEACHER_A).expect(403);
    await get(`/v1/schools/${SCHOOL_B}/members`, USER_AB).expect(403); // teacher in B
  });

  it('returns 404 to members of other schools', async () => {
    await get(`/v1/schools/${SCHOOL_B}/members`, PRINCIPAL_A).expect(404);
  });

  it('pages with a cursor', async () => {
    const base = `/v1/schools/${SCHOOL_A}/members?limit=2`;
    const p1 = await get(base, PRINCIPAL_A).expect(200);
    expect(ids(p1)).toEqual([M.pA, M.tA]);
    expect(p1.body.nextCursor).toBe(M.tA);

    const p2 = await get(`${base}&cursor=${p1.body.nextCursor}`, PRINCIPAL_A).expect(200);
    expect(ids(p2)).toEqual([M.t2A, M.cA]);

    const p3 = await get(`${base}&cursor=${p2.body.nextCursor}`, PRINCIPAL_A).expect(200);
    expect(ids(p3)).toEqual([M.abA]);
    expect(p3.body.nextCursor).toBeNull();
  });

  it("does not leak rows when given another school's cursor", async () => {
    const res = await get(`/v1/schools/${SCHOOL_A}/members?cursor=${M.pA}`, PRINCIPAL_A);
    expect(ids(res)).not.toContain(MB.pB);
    const fromB = await get(`/v1/schools/${SCHOOL_A}/members?cursor=${MB.pB}`, PRINCIPAL_A);
    expect(ids(fromB)).toEqual([]);
  });

  it('filters by role and status', async () => {
    const teachers = await get(`/v1/schools/${SCHOOL_A}/members?role=teacher`, PRINCIPAL_A);
    expect(ids(teachers)).toEqual([M.tA, M.t2A]);
    const active = await get(`/v1/schools/${SCHOOL_A}/members?status=active`, PRINCIPAL_A);
    expect(ids(active)).toEqual([M.pA, M.tA, M.abA]);
  });

  it.each([
    'limit=0',
    'limit=101',
    'limit=abc',
    'cursor=not-a-uuid',
    'role=king',
    'status=gone',
    'unknown=1',
  ])('rejects invalid query %s with 400', async (query) => {
    await get(`/v1/schools/${SCHOOL_A}/members?${query}`, PRINCIPAL_A).expect(400);
  });
});
