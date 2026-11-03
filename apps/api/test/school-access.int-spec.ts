/**
 * Step 1.4: SchoolAccessGuard over HTTP. A test-only probe controller exercises every guard
 * branch, including ones no real route has (an undeclared permission, a body).
 */
import { Body, Get, type INestApplication, Post } from '@nestjs/common';
import pg from 'pg';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service.js';
import { withSchoolContext } from '../src/database/school-context.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { RequirePermission } from '../src/tenancy/require-permission.decorator.js';
import { CurrentTenant, SchoolController } from '../src/tenancy/school-controller.decorator.js';
import type { TenantContext } from '../src/tenancy/tenant-request.js';
import { TEST_USER_HEADER } from './support/header-identity.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const SCHOOL_A = '0192f0a2-0000-7000-8000-00000000000a';
const SCHOOL_B = '0192f0a2-0000-7000-8000-00000000000b';
const UNKNOWN_SCHOOL = '0192f0a2-0000-7000-8000-00000000000f';
const PRINCIPAL_A = '0192f0a2-0000-7000-8000-0000000000a1';
const TEACHER_A = '0192f0a2-0000-7000-8000-0000000000a2';
const SUSPENDED_A = '0192f0a2-0000-7000-8000-0000000000a3';
const PRINCIPAL_B = '0192f0a2-0000-7000-8000-0000000000b1';

@SchoolController('probe')
class ProbeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('school.read')
  async read(@CurrentTenant() tenant: TenantContext) {
    const school = await withSchoolContext(this.prisma, tenant.schoolId, (tx) =>
      tx.school.findUniqueOrThrow({ where: { id: tenant.schoolId } }),
    );
    return { ...tenant, schoolName: school.name };
  }

  @Get('members')
  @RequirePermission('members.read')
  members() {
    return { ok: true };
  }

  @Get('undeclared')
  undeclared() {
    return { leaked: true };
  }

  @Post()
  @RequirePermission('school.read')
  write(@Body() body: unknown) {
    return { received: body };
  }
}

let owner: pg.Client;
let prisma: PrismaClient;
let app: INestApplication;

const createApp = (identity: 'header' | 'default') =>
  createTestApp(prisma, { identity, controllers: [ProbeController] });

const get = (path: string, userId?: string) => {
  const req = request(app.getHttpServer()).get(path);
  return userId ? req.set(TEST_USER_HEADER, userId) : req;
};

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  // Permissions come from the seed migration: principal has school.read and members.read,
  // teacher has school.read only.
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES
      ('${SCHOOL_A}', 'School A', 'SCH-A', now()),
      ('${SCHOOL_B}', 'School B', 'SCH-B', now());
    INSERT INTO users (id, full_name, updated_at) VALUES
      ('${PRINCIPAL_A}', 'Principal A', now()),
      ('${TEACHER_A}', 'Teacher A', now()),
      ('${SUSPENDED_A}', 'Suspended A', now()),
      ('${PRINCIPAL_B}', 'Principal B', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      (gen_random_uuid(), '${SCHOOL_A}', '${PRINCIPAL_A}', 'principal', 'active', now()),
      (gen_random_uuid(), '${SCHOOL_A}', '${TEACHER_A}', 'teacher', 'active', now()),
      (gen_random_uuid(), '${SCHOOL_A}', '${SUSPENDED_A}', 'principal', 'suspended', now()),
      (gen_random_uuid(), '${SCHOOL_B}', '${PRINCIPAL_B}', 'principal', 'active', now());
  `);
  prisma = appPrisma(2);
  app = await createApp('header');
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  if (owner) {
    await truncateTenantData(owner);
    await owner.end();
  }
});

describe('SchoolAccessGuard', () => {
  it('lets an active member with the permission in, with the tenant set', async () => {
    const res = await get(`/v1/schools/${SCHOOL_A}/probe`, PRINCIPAL_A).expect(200);
    expect(res.body).toEqual({ schoolId: SCHOOL_A, userId: PRINCIPAL_A, schoolName: 'School A' });
  });

  it('returns 401 when nobody is signed in', async () => {
    await get(`/v1/schools/${SCHOOL_A}/probe`).expect(401);
  });

  it("returns 404 for another school's route, not 403", async () => {
    await get(`/v1/schools/${SCHOOL_B}/probe`, PRINCIPAL_A).expect(404);
    await get(`/v1/schools/${SCHOOL_A}/probe`, PRINCIPAL_B).expect(404);
  });

  it('returns 404 for an unknown school and for a malformed school id', async () => {
    await get(`/v1/schools/${UNKNOWN_SCHOOL}/probe`, PRINCIPAL_A).expect(404);
    await get('/v1/schools/not-a-uuid/probe', PRINCIPAL_A).expect(404);
  });

  it('returns 404 for a membership that is not active', async () => {
    await get(`/v1/schools/${SCHOOL_A}/probe`, SUSPENDED_A).expect(404);
  });

  it("returns 403 when the member's roles lack the permission", async () => {
    await get(`/v1/schools/${SCHOOL_A}/probe/members`, TEACHER_A).expect(403);
    await get(`/v1/schools/${SCHOOL_A}/probe/members`, PRINCIPAL_A).expect(200);
  });

  it('returns 403 on a school route that declares no permission (fails closed)', async () => {
    await get(`/v1/schools/${SCHOOL_A}/probe/undeclared`, PRINCIPAL_A).expect(403);
  });

  it('rejects a school id in the request body', async () => {
    const post = (body: object) =>
      request(app.getHttpServer())
        .post(`/v1/schools/${SCHOOL_A}/probe`)
        .set(TEST_USER_HEADER, PRINCIPAL_A)
        .send(body);

    await post({ schoolId: SCHOOL_B }).expect(400);
    await post({ school_id: SCHOOL_B }).expect(400);
    await post({ name: 'fine' }).expect(201);
  });

  it('serves school routes only under /v1', async () => {
    await get(`/schools/${SCHOOL_A}/probe`, PRINCIPAL_A).expect(404);
  });
});

describe('without the test identity stub (no login until Step 2)', () => {
  it('returns 401 on school routes', async () => {
    const defaultApp = await createApp('default');
    try {
      await request(defaultApp.getHttpServer())
        .get(`/v1/schools/${SCHOOL_A}/probe`)
        .set(TEST_USER_HEADER, PRINCIPAL_A)
        .expect(401);
    } finally {
      await defaultApp.close();
    }
  });
});
