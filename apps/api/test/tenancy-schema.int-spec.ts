/**
 * Step 1.3: tenancy tables and their RLS policies, exercised through Prisma model queries as the
 * app role. Fixtures are inserted by the owner role, which RLS does not apply to.
 */
import pg from 'pg';
import { Prisma, type PrismaClient } from '../src/generated/prisma/client.js';
import { withSchoolContext, withUserContext } from '../src/database/school-context.js';
import { PERMISSIONS } from '../src/tenancy/permissions.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const SCHOOL_A = '0192f0a1-0000-7000-8000-00000000000a';
const SCHOOL_B = '0192f0a1-0000-7000-8000-00000000000b';
const USER_A = '0192f0a1-0000-7000-8000-0000000000a0'; // teacher in A
const USER_B = '0192f0a1-0000-7000-8000-0000000000b0'; // teacher in B
const USER_AB = '0192f0a1-0000-7000-8000-0000000000ab'; // principal in A, parent in B

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let owner: pg.Client;
let prisma: PrismaClient;

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES
      ('${SCHOOL_A}', 'School A', 'SCH-A', now()),
      ('${SCHOOL_B}', 'School B', 'SCH-B', now());
    INSERT INTO users (id, full_name, updated_at) VALUES
      ('${USER_A}', 'User A', now()),
      ('${USER_B}', 'User B', now()),
      ('${USER_AB}', 'User AB', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      (gen_random_uuid(), '${SCHOOL_A}', '${USER_A}', 'teacher', 'active', now()),
      (gen_random_uuid(), '${SCHOOL_B}', '${USER_B}', 'teacher', 'active', now()),
      (gen_random_uuid(), '${SCHOOL_A}', '${USER_AB}', 'principal', 'active', now()),
      (gen_random_uuid(), '${SCHOOL_B}', '${USER_AB}', 'parent', 'active', now());
  `);
  prisma = appPrisma(2);
});

afterAll(async () => {
  await prisma?.$disconnect();
  if (owner) {
    await truncateTenantData(owner);
    await owner.end();
  }
});

describe('RLS coverage', () => {
  it('has RLS enabled on every table with a school_id column, plus schools and users', async () => {
    const { rows } = await owner.query<{ table: string; rls: boolean }>(`
      SELECT c.relname AS table, c.relrowsecurity AS rls
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
        AND (c.relname IN ('schools', 'users') OR EXISTS (
          SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public' AND col.table_name = c.relname
            AND col.column_name = 'school_id'))
      ORDER BY 1`);
    expect(rows.map((r) => r.table)).toEqual(['school_memberships', 'schools', 'users']);
    expect(rows.filter((r) => !r.rls)).toEqual([]);
  });
});

describe('schools', () => {
  it('shows no school without context', async () => {
    expect(await prisma.school.findMany()).toEqual([]);
  });

  it('shows only the current school', async () => {
    const schools = await withSchoolContext(prisma, SCHOOL_A, (tx) => tx.school.findMany());
    expect(schools.map((s) => s.id)).toEqual([SCHOOL_A]);
  });

  it('cannot update another school', async () => {
    const { count } = await withSchoolContext(prisma, SCHOOL_A, (tx) =>
      tx.school.updateMany({ where: { id: SCHOOL_B }, data: { name: 'hacked' } }),
    );
    expect(count).toBe(0);
  });
});

describe('school_memberships', () => {
  it('shows only memberships of the current school', async () => {
    const rows = await withSchoolContext(prisma, SCHOOL_A, (tx) =>
      tx.schoolMembership.findMany({ orderBy: { role: 'asc' } }),
    );
    expect(rows.map((m) => [m.userId, m.role])).toEqual([
      [USER_AB, 'principal'],
      [USER_A, 'teacher'],
    ]);
  });

  it("shows a user's own memberships across schools, and nobody else's", async () => {
    const rows = await withUserContext(prisma, USER_AB, (tx) =>
      tx.schoolMembership.findMany({ orderBy: { role: 'asc' } }),
    );
    expect(rows.map((m) => [m.schoolId, m.role])).toEqual([
      [SCHOOL_A, 'principal'],
      [SCHOOL_B, 'parent'],
    ]);
  });

  it('cannot create a membership with only a user context', async () => {
    await expect(
      withUserContext(prisma, USER_AB, (tx) =>
        tx.schoolMembership.create({
          data: { schoolId: SCHOOL_A, userId: USER_AB, role: 'school_admin' },
        }),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('cannot create a membership in another school', async () => {
    await expect(
      withSchoolContext(prisma, SCHOOL_A, (tx) =>
        tx.schoolMembership.create({
          data: { schoolId: SCHOOL_B, userId: USER_A, role: 'teacher' },
        }),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('allows several roles per user in one school but not the same role twice', async () => {
    const created = await withSchoolContext(prisma, SCHOOL_A, (tx) =>
      tx.schoolMembership.create({
        data: { schoolId: SCHOOL_A, userId: USER_A, role: 'parent' },
      }),
    );
    expect(created.id).toMatch(UUID_V7);
    expect(created.status).toBe('invited');

    const duplicate = withSchoolContext(prisma, SCHOOL_A, (tx) =>
      tx.schoolMembership.create({
        data: { schoolId: SCHOOL_A, userId: USER_A, role: 'parent' },
      }),
    );
    await expect(duplicate).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    await expect(duplicate).rejects.toMatchObject({ code: 'P2002' });
  });
});

describe('users', () => {
  it('shows no users without context', async () => {
    expect(await prisma.user.findMany()).toEqual([]);
  });

  it('shows only members of the current school', async () => {
    const users = await withSchoolContext(prisma, SCHOOL_B, (tx) =>
      tx.user.findMany({ orderBy: { fullName: 'asc' } }),
    );
    expect(users.map((u) => u.id)).toEqual([USER_AB, USER_B]);
  });

  it('shows only yourself with a user context', async () => {
    const users = await withUserContext(prisma, USER_A, (tx) => tx.user.findMany());
    expect(users.map((u) => u.id)).toEqual([USER_A]);
  });
});

describe('permissions', () => {
  it('seeded catalogue matches the keys the code checks, and the app role can read it', async () => {
    const rows = await prisma.permission.findMany({ orderBy: { key: 'asc' } });
    expect(rows.map((p) => p.key)).toEqual([...PERMISSIONS].sort());
  });

  it('seeds school.read for every role and members.read for school leadership', async () => {
    const grants = await prisma.rolePermission.findMany({
      select: { role: true, permission: { select: { key: true } } },
    });
    const rolesWith = (key: string) =>
      grants
        .filter((g) => g.permission.key === key)
        .map((g) => g.role)
        .sort();
    expect(rolesWith('school.read')).toHaveLength(10);
    expect(rolesWith('members.read')).toEqual(['principal', 'school_admin', 'vice_principal']);
  });

  it('cannot be changed by the app role', async () => {
    await expect(
      prisma.permission.create({ data: { key: 'members.write', description: 'nope' } }),
    ).rejects.toThrow(/permission denied/);
  });
});
