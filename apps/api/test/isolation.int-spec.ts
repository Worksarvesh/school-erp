/**
 * Step 1.6: tenant isolation suite (design section 3, "Tests").
 *
 * Two schools. Discovers every route the app serves and every table with RLS, so new endpoints and
 * tables are covered without editing this file:
 * - every /v1/schools/:schoolId/... route returns 401 signed out and 404 across schools, and
 *   works for a member with every role in their own school (positive control)
 * - every other route is on an explicit allowlist
 * - every table with a school_id column has RLS, and every RLS table returns no rows without
 *   context and no other-school rows inside a school context
 *
 * If this file fails after you add a route or table, fix the route or table, not the test.
 */
import type { INestApplication } from '@nestjs/common';
import pg from 'pg';
import request from 'supertest';
import { withSchoolContext } from '../src/database/school-context.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { Role } from '../src/generated/prisma/enums.js';
import { TEST_USER_HEADER } from './support/header-identity.js';
import { isSchoolRoute, type ServedRoute, servedRoutes } from './support/routes.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const SCHOOL_A = '0192f0a4-0000-7000-8000-00000000000a';
const SCHOOL_B = '0192f0a4-0000-7000-8000-00000000000b';
const ADMIN_A = '0192f0a4-0000-7000-8000-0000000000a1'; // every role in A
const ADMIN_B = '0192f0a4-0000-7000-8000-0000000000b1'; // every role in B
const SOME_ID = '0192f0a4-0000-7000-8000-0000000000ff'; // fills any other path param

/** Routes outside /v1/schools/:schoolId. Adding one here is a security review decision. */
const NON_SCHOOL_ROUTES = ['GET /v1'];

// Routes are discovered at collection time so each one gets its own named tests.
const prisma: PrismaClient = appPrisma(2);
const app: INestApplication = await createTestApp(prisma);
const routes = servedRoutes(app);
const schoolRoutes = routes.filter(isSchoolRoute);
let owner: pg.Client;

const label = (r: ServedRoute) => `${r.method} ${r.path}`;
const count = (sql: string) => `SELECT count(*)::int AS n FROM ${sql}`;

function call(route: ServedRoute, schoolId: string, userId?: string) {
  const path = route.path.replace(':schoolId', schoolId).replace(/:[A-Za-z]+/g, SOME_ID);
  const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
  let req = request(app.getHttpServer())[method](path);
  if (userId) {
    req = req.set(TEST_USER_HEADER, userId);
  }
  return ['post', 'put', 'patch'].includes(method) ? req.send({}) : req;
}

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  const everyRole = (schoolId: string, userId: string) =>
    Object.values(Role)
      .map((role) => `(gen_random_uuid(), '${schoolId}', '${userId}', '${role}', 'active', now())`)
      .join(',\n');
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES
      ('${SCHOOL_A}', 'School A', 'SCH-A', now()),
      ('${SCHOOL_B}', 'School B', 'SCH-B', now());
    INSERT INTO users (id, full_name, updated_at) VALUES
      ('${ADMIN_A}', 'Admin A', now()),
      ('${ADMIN_B}', 'Admin B', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      ${everyRole(SCHOOL_A, ADMIN_A)},
      ${everyRole(SCHOOL_B, ADMIN_B)};
  `);
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
  if (owner) {
    await truncateTenantData(owner);
    await owner.end();
  }
});

describe('route inventory', () => {
  it('finds the school routes (route discovery works)', () => {
    expect(schoolRoutes.map(label)).toEqual(
      expect.arrayContaining(['GET /v1/schools/:schoolId', 'GET /v1/schools/:schoolId/members']),
    );
  });

  it('serves no route outside /v1/schools/:schoolId except the allowlist', () => {
    const others = routes.filter((r) => !isSchoolRoute(r)).map(label);
    expect(others.sort()).toEqual([...NON_SCHOOL_ROUTES].sort());
  });
});

describe.each(schoolRoutes.map((r) => [label(r), r] as const))('%s', (_name, route) => {
  it('returns 401 when signed out', async () => {
    await call(route, SCHOOL_A).expect(401);
  });

  it("returns 404 for another school's member, in both directions", async () => {
    await call(route, SCHOOL_B, ADMIN_A).expect(404);
    await call(route, SCHOOL_A, ADMIN_B).expect(404);
  });

  it('works for a member with every role in their own school (positive control)', async () => {
    const res = await call(route, SCHOOL_A, ADMIN_A);
    expect(res.status, 'denied: missing @RequirePermission() or no role grants it?').not.toBe(403);
    expect(res.status).not.toBe(401);
    expect(res.status).toBeLessThan(500);
    if (!/:(?!schoolId)/.test(route.path)) {
      expect(res.status).not.toBe(404); // only :schoolId in the path, so the resource exists
    }
  });
});

describe('database (RLS)', () => {
  let rlsTables: string[];
  let schoolIdTables: string[];

  beforeAll(async () => {
    const rls = await owner.query<{ table: string }>(`
      SELECT relname AS table FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
      ORDER BY 1`);
    rlsTables = rls.rows.map((r) => r.table);
    const cols = await owner.query<{ table: string }>(`
      SELECT DISTINCT table_name AS table FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'school_id'`);
    schoolIdTables = cols.rows.map((r) => r.table);
  });

  it('has RLS on every table with a school_id column, and on schools and users', () => {
    const tenantTables = [...schoolIdTables, 'schools', 'users'];
    expect(tenantTables.filter((t) => !rlsTables.includes(t))).toEqual([]);
  });

  it('every RLS table has fixture rows here, so the checks below mean something', async () => {
    for (const table of rlsTables) {
      const { rows } = await owner.query<{ n: number }>(count(`"${table}"`));
      expect(rows[0]?.n, `add fixture rows for ${table} in this file`).toBeGreaterThan(0);
    }
  });

  it('every RLS table returns no rows to a raw query without context', async () => {
    for (const table of rlsTables) {
      const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(count(`"${table}"`));
      expect(rows[0]?.n, table).toBe(0);
    }
  });

  it("every RLS table hides the other school's rows inside a school context", async () => {
    const checks = [
      ...schoolIdTables.map((t) => count(`"${t}" WHERE school_id = $1::uuid`)),
      count('schools WHERE id = $1::uuid'),
      count(`users u WHERE EXISTS (
        SELECT 1 FROM school_memberships m WHERE m.user_id = u.id AND m.school_id = $1::uuid)`),
    ];
    for (const sql of checks) {
      const [own, other] = await withSchoolContext(prisma, SCHOOL_A, async (tx) => [
        (await tx.$queryRawUnsafe<{ n: number }[]>(sql, SCHOOL_A))[0]?.n,
        (await tx.$queryRawUnsafe<{ n: number }[]>(sql, SCHOOL_B))[0]?.n,
      ]);
      expect(own, `own rows visible: ${sql}`).toBeGreaterThan(0);
      expect(other, `other school leaks: ${sql}`).toBe(0);
    }
  });
});
