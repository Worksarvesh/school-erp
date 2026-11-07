/**
 * Step 1.6: tenant isolation suite (design section 3, "Tests").
 *
 * Two schools. Discovers every route the app serves and every table with RLS, so new endpoints and
 * tables are covered without editing this file:
 * - every /v1/schools/:schoolId/... route returns 401 signed out and 404 across schools, and
 *   works for a member with every role in their own school (positive control)
 * - every other route is on an explicit allowlist; platform routes return 401 signed out, 403 to
 *   school members, and work for platform staff
 * - every table with a school_id column has RLS, and every RLS table returns no rows without
 *   context (or refuses the app role outright) and no other-school rows inside a school context
 *
 * If this file fails after you add a route or table, fix the route or table, not the test.
 */
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import request from 'supertest';
import { withSchoolContext } from '../src/database/school-context.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { Role } from '../src/generated/prisma/enums.js';
import { isSchoolRoute, type ServedRoute, servedRoutes } from './support/routes.js';
import { bearer, createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const SCHOOL_A = '0192f0a4-0000-7000-8000-00000000000a';
const SCHOOL_B = '0192f0a4-0000-7000-8000-00000000000b';
const ADMIN_A = '0192f0a4-0000-7000-8000-0000000000a1'; // every role in A
const ADMIN_B = '0192f0a4-0000-7000-8000-0000000000b1'; // every role in B
const SOME_ID = '0192f0a4-0000-7000-8000-0000000000ff'; // fills any other path param
const VERIFIER = '0192f0a4-0000-7000-8000-0000000000c1'; // platform staff, no school membership

/**
 * Routes outside /v1/schools/:schoolId. Adding one here is a security review decision.
 * `authenticated` routes must return 401 signed out (checked below). `public` routes must not
 * reveal whether an account exists (checked per route in auth.int-spec.ts and otp.int-spec.ts).
 * `platform` routes must return 401 signed out and 403 to a school member (checked below).
 */
const NON_SCHOOL_ROUTES: Record<string, 'public' | 'authenticated' | 'platform'> = {
  'GET /v1': 'public',
  'POST /v1/auth/login': 'public',
  'POST /v1/auth/otp/request': 'public',
  'POST /v1/auth/otp/verify': 'public',
  'POST /v1/auth/refresh': 'public',
  'POST /v1/auth/password-reset': 'public',
  'POST /v1/auth/logout': 'authenticated',
  'POST /v1/auth/logout-all': 'authenticated',
  'GET /v1/me': 'authenticated',
  'GET /v1/me/sessions': 'authenticated',
  'DELETE /v1/me/sessions/:sessionId': 'authenticated',
  'POST /v1/me/password': 'authenticated',
  'GET /v1/me/school-verification-requests': 'authenticated',
  'POST /v1/me/school-verification-requests': 'authenticated',
  'GET /v1/directory/schools': 'authenticated',
  'GET /v1/platform/school-verification-requests': 'platform',
  'GET /v1/platform/school-verification-requests/:requestId': 'platform',
  'POST /v1/platform/school-verification-requests/:requestId/approve': 'platform',
  'POST /v1/platform/school-verification-requests/:requestId/reject': 'platform',
  'POST /v1/platform/schools': 'platform',
};

// Routes are discovered at collection time so each one gets its own named tests.
const prisma: PrismaClient = appPrisma(2);
const app: NestExpressApplication = await createTestApp(prisma);
const routes = servedRoutes(app);
const schoolRoutes = routes.filter(isSchoolRoute);
const authenticatedRoutes = routes.filter((r) => NON_SCHOOL_ROUTES[label(r)] === 'authenticated');
const platformRoutes = routes.filter((r) => NON_SCHOOL_ROUTES[label(r)] === 'platform');
const auth: Record<string, string> = {
  [ADMIN_A]: await bearer(app, ADMIN_A),
  [ADMIN_B]: await bearer(app, ADMIN_B),
  [VERIFIER]: await bearer(app, VERIFIER),
};
let owner: pg.Client;

function label(r: ServedRoute) {
  return `${r.method} ${r.path}`;
}
const count = (sql: string) => `SELECT count(*)::int AS n FROM ${sql}`;

function call(route: ServedRoute, schoolId: string, userId?: string) {
  const path = route.path.replace(':schoolId', schoolId).replace(/:[A-Za-z]+/g, SOME_ID);
  const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
  let req = request(app.getHttpServer())[method](path);
  if (userId) {
    req = req.set('Authorization', auth[userId]!);
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
      ('${SCHOOL_A}', 'School A', 'sch9001', now()),
      ('${SCHOOL_B}', 'School B', 'sch9002', now());
    INSERT INTO users (id, full_name, updated_at) VALUES
      ('${ADMIN_A}', 'Admin A', now()),
      ('${ADMIN_B}', 'Admin B', now()),
      ('${VERIFIER}', 'Verifier', now());
    INSERT INTO platform_staff (user_id, role, updated_at) VALUES ('${VERIFIER}', 'verifier', now());
    INSERT INTO school_verification_requests
      (id, principal_user_id, school_id, principal_name, status, decided_by_user_id, decided_at,
       updated_at) VALUES
      (gen_random_uuid(), '${ADMIN_A}', '${SCHOOL_A}', 'Admin A', 'approved', '${VERIFIER}', now(), now()),
      (gen_random_uuid(), '${ADMIN_B}', '${SCHOOL_B}', 'Admin B', 'approved', '${VERIFIER}', now(), now());
    INSERT INTO otp_challenges (id, purpose, phone, code_hash, expires_at) VALUES
      (gen_random_uuid(), 'principal_login', '+919000000001', 'not-a-real-hash', now() + interval '5 minutes');
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      ${everyRole(SCHOOL_A, ADMIN_A)},
      ${everyRole(SCHOOL_B, ADMIN_B)};
    INSERT INTO credentials (user_id, password_hash, password_changed_at, updated_at) VALUES
      ('${ADMIN_A}', 'not-a-real-hash-a', now(), now()),
      ('${ADMIN_B}', 'not-a-real-hash-b', now(), now());
    INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES
      (gen_random_uuid(), '${ADMIN_A}', 'hash-a', now() + interval '1 day'),
      (gen_random_uuid(), '${ADMIN_B}', 'hash-b', now() + interval '1 day');
    INSERT INTO audit_logs (id, school_id, actor_user_id, action) VALUES
      (gen_random_uuid(), '${SCHOOL_A}', '${ADMIN_A}', 'test.event'),
      (gen_random_uuid(), '${SCHOOL_B}', '${ADMIN_B}', 'test.event'),
      (gen_random_uuid(), NULL, '${ADMIN_A}', 'test.global_event');
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
    expect(others.sort()).toEqual(Object.keys(NON_SCHOOL_ROUTES).sort());
  });
});

describe.each(authenticatedRoutes.map((r) => [label(r), r] as const))(
  '%s (authenticated, outside schools)',
  (_name, route) => {
    it('returns 401 when signed out', async () => {
      await call(route, SCHOOL_A).expect(401);
    });
  },
);

describe.each(platformRoutes.map((r) => [label(r), r] as const))(
  '%s (platform)',
  (_name, route) => {
    it('returns 401 when signed out', async () => {
      await call(route, SCHOOL_A).expect(401);
    });

    it('returns 403 to a school member with every role', async () => {
      await call(route, SCHOOL_A, ADMIN_A).expect(403);
    });

    it('works for platform staff (positive control)', async () => {
      const res = await call(route, SCHOOL_A, VERIFIER);
      expect([401, 403]).not.toContain(res.status);
      expect(res.status).toBeLessThan(500);
    });
  },
);

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

  // Partitions are reached only through their parent table (checked separately below).
  beforeAll(async () => {
    const rls = await owner.query<{ table: string }>(`
      SELECT relname AS table FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
        AND NOT c.relispartition
      ORDER BY 1`);
    rlsTables = rls.rows.map((r) => r.table);
    const cols = await owner.query<{ table: string }>(`
      SELECT DISTINCT c.relname AS table FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
        AND a.attname = 'school_id' AND NOT a.attisdropped`);
    schoolIdTables = cols.rows.map((r) => r.table);
  });

  it('has RLS on every table with a school_id column, and on schools and users', () => {
    const tenantTables = [...schoolIdTables, 'schools', 'users'];
    expect(tenantTables.filter((t) => !rlsTables.includes(t))).toEqual([]);
  });

  it('every partition has RLS and refuses the app role (rows only through the parent)', async () => {
    const { rows } = await owner.query<{ table: string; rls: boolean; granted: boolean }>(`
      SELECT c.relname AS table, c.relrowsecurity AS rls,
        has_table_privilege('school_erp_app', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS granted
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relispartition`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => !r.rls || r.granted)).toEqual([]);
  });

  it('audit_logs is append-only for the owner role too', async () => {
    await expect(owner.query(`UPDATE audit_logs SET action = 'x'`)).rejects.toThrow(/append-only/);
    await expect(owner.query('DELETE FROM audit_logs')).rejects.toThrow(/append-only/);
  });

  it('every RLS table has fixture rows here, so the checks below mean something', async () => {
    for (const table of rlsTables) {
      const { rows } = await owner.query<{ n: number }>(count(`"${table}"`));
      expect(rows[0]?.n, `add fixture rows for ${table} in this file`).toBeGreaterThan(0);
    }
  });

  it('every RLS table returns no rows to a raw query without context', async () => {
    for (const table of rlsTables) {
      const { rows: grant } = await owner.query<{ ok: boolean }>(
        `SELECT has_table_privilege('school_erp_app', $1, 'SELECT') AS ok`,
        [`public."${table}"`],
      );
      if (!grant[0]?.ok) {
        // Tables reached only through SECURITY DEFINER functions: the app role is refused outright.
        await expect(prisma.$queryRawUnsafe(count(`"${table}"`)), table).rejects.toThrow(
          /permission denied/,
        );
        continue;
      }
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
