/**
 * Slice 2A, database level: the pre-login SECURITY DEFINER lookups and RLS on users,
 * credentials and sessions, exercised as the app role.
 */
import pg from 'pg';
import { withUserContext } from '../src/database/school-context.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const ALICE = '0192f0a5-0000-7000-8000-0000000000a1';
const BOB = '0192f0a5-0000-7000-8000-0000000000b1';
const ALICE_SESSION = '0192f0a5-0000-7000-8000-0000000005a1';
const BOB_SESSION = '0192f0a5-0000-7000-8000-0000000005b1';
const FUNCTIONS = ['auth_find_login_user', 'auth_find_session_user'];

let owner: pg.Client;
let prisma: PrismaClient;

const findLogin = (identifier: string | null) =>
  prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM auth_find_login_user(${identifier})`;
const findSessionUser = async (sessionId: string) =>
  (
    await prisma.$queryRaw<{ user_id: string | null }[]>`
      SELECT auth_find_session_user(${sessionId}::uuid) AS user_id`
  )[0]?.user_id;

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  await owner.query(`
    INSERT INTO users (id, full_name, phone, email, updated_at) VALUES
      ('${ALICE}', 'Alice', '+919000000101', 'alice@example.test', now()),
      ('${BOB}', 'Bob', '+919000000102', 'bob@example.test', now());
    INSERT INTO credentials (user_id, password_hash, password_changed_at, updated_at) VALUES
      ('${ALICE}', 'hash-of-alice', now(), now()),
      ('${BOB}', 'hash-of-bob', now(), now());
    INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES
      ('${ALICE_SESSION}', '${ALICE}', 'token-hash-alice', now() + interval '1 day'),
      ('${BOB_SESSION}', '${BOB}', 'token-hash-bob', now() + interval '1 day');
  `);
  prisma = appPrisma(1);
});

afterAll(async () => {
  await prisma?.$disconnect();
  if (owner) {
    await truncateTenantData(owner);
    await owner.end();
  }
});

describe('lookup functions: how they are defined', () => {
  it('are SECURITY DEFINER with a pinned search_path', async () => {
    const { rows } = await owner.query<{ name: string; secdef: boolean; config: string[] }>(
      `SELECT proname AS name, prosecdef AS secdef, proconfig AS config
       FROM pg_proc WHERE proname = ANY($1) ORDER BY 1`,
      [FUNCTIONS],
    );
    expect(rows).toHaveLength(2);
    for (const fn of rows) {
      expect(fn.secdef, fn.name).toBe(true);
      expect(fn.config, fn.name).toEqual(['search_path=pg_catalog, pg_temp']);
    }
  });

  it('are owned by a role that cannot log in, is not superuser and cannot bypass RLS', async () => {
    const { rows } = await owner.query(
      `SELECT DISTINCT r.rolname, r.rolsuper, r.rolbypassrls, r.rolcanlogin
       FROM pg_proc p JOIN pg_roles r ON r.oid = p.proowner WHERE p.proname = ANY($1)`,
      [FUNCTIONS],
    );
    expect(rows).toEqual([
      {
        rolname: 'school_erp_auth_lookup',
        rolsuper: false,
        rolbypassrls: false,
        rolcanlogin: false,
      },
    ]);
  });

  it('can be executed only by the app role (and their owner), not PUBLIC', async () => {
    const { rows } = await owner.query<{ name: string; grantees: string[] }>(
      `SELECT p.proname AS name,
              array_agg(CASE WHEN a.grantee = 0 THEN 'PUBLIC'
                             ELSE pg_get_userbyid(a.grantee)::text END) AS grantees
       FROM pg_proc p, aclexplode(p.proacl) a
       WHERE p.proname = ANY($1) AND a.privilege_type = 'EXECUTE'
       GROUP BY 1`,
      [FUNCTIONS],
    );
    for (const fn of rows) {
      expect(fn.grantees.sort(), fn.name).toEqual(['school_erp_app', 'school_erp_auth_lookup']);
    }
  });

  it('give their owner role only the columns the lookups need', async () => {
    const can = async (sql: string) =>
      (await owner.query<{ ok: boolean }>(`SELECT ${sql} AS ok`)).rows[0]?.ok;
    expect(
      await can(`has_column_privilege('school_erp_auth_lookup', 'users', 'phone', 'SELECT')`),
    ).toBe(true);
    expect(
      await can(`has_column_privilege('school_erp_auth_lookup', 'users', 'full_name', 'SELECT')`),
    ).toBe(false);
    expect(
      await can(
        `has_column_privilege('school_erp_auth_lookup', 'sessions', 'token_hash', 'SELECT')`,
      ),
    ).toBe(false);
    expect(
      await can(`has_table_privilege('school_erp_auth_lookup', 'credentials', 'SELECT')`),
    ).toBe(false);
    expect(await can(`has_schema_privilege('school_erp_auth_lookup', 'public', 'CREATE')`)).toBe(
      false,
    );
  });
});

describe('auth_find_login_user', () => {
  it('finds a user by exact normalised phone or email, returning only id and status', async () => {
    expect(await findLogin('+919000000101')).toEqual([{ user_id: ALICE, status: 'active' }]);
    expect(await findLogin('bob@example.test')).toEqual([{ user_id: BOB, status: 'active' }]);
  });

  it.each([
    ['%'],
    ['%@example.test'],
    ['+91900000010_'],
    ['ALICE@EXAMPLE.TEST'],
    ['alice@example.test '],
    [''],
    [null],
    ["' OR true --"],
  ])('cannot be used to enumerate users: %j matches nothing', async (identifier) => {
    expect(await findLogin(identifier)).toEqual([]);
  });
});

describe('auth_find_session_user', () => {
  it('returns the owner of a session id, or null', async () => {
    expect(await findSessionUser(ALICE_SESSION)).toBe(ALICE);
    expect(await findSessionUser('0192f0a5-0000-7000-8000-0000000005ff')).toBeNull();
  });
});

describe('lookups under FORCE ROW LEVEL SECURITY', () => {
  it('still work, because they never relied on the table owner bypassing RLS', async () => {
    await owner.query('ALTER TABLE users FORCE ROW LEVEL SECURITY');
    await owner.query('ALTER TABLE sessions FORCE ROW LEVEL SECURITY');
    try {
      expect(await findLogin('alice@example.test')).toEqual([{ user_id: ALICE, status: 'active' }]);
      expect(await findSessionUser(BOB_SESSION)).toBe(BOB);
    } finally {
      await owner.query('ALTER TABLE users NO FORCE ROW LEVEL SECURITY');
      await owner.query('ALTER TABLE sessions NO FORCE ROW LEVEL SECURITY');
    }
  });
});

describe('the app role reading auth tables directly', () => {
  it('sees no users, credentials or sessions without a user context', async () => {
    for (const table of ['users', 'credentials', 'sessions']) {
      const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
        `SELECT count(*)::int AS n FROM ${table}`,
      );
      expect(rows[0]?.n, table).toBe(0);
    }
  });

  it("sees only the signed-in user's own rows, never another user's", async () => {
    const seen = await withUserContext(prisma, ALICE, async (tx) => ({
      users: await tx.user.findMany({ select: { id: true } }),
      credentials: await tx.credential.findMany({ select: { userId: true } }),
      sessions: await tx.session.findMany({ select: { userId: true } }),
      bobHash: await tx.$queryRaw<unknown[]>`
        SELECT password_hash FROM credentials WHERE user_id = ${BOB}::uuid`,
    }));
    expect(seen.users).toEqual([{ id: ALICE }]);
    expect(seen.credentials).toEqual([{ userId: ALICE }]);
    expect(seen.sessions).toEqual([{ userId: ALICE }]);
    expect(seen.bobHash).toEqual([]);
  });

  it("cannot revoke or rewrite another user's session", async () => {
    const changed = await withUserContext(prisma, ALICE, (tx) =>
      tx.session.updateMany({ where: { id: BOB_SESSION }, data: { revokedAt: new Date() } }),
    );
    expect(changed.count).toBe(0);
  });

  it('cannot update or delete audit log rows', async () => {
    await expect(prisma.$executeRaw`UPDATE audit_logs SET action = 'x'`).rejects.toThrow(
      /permission denied/,
    );
    await expect(prisma.$executeRaw`DELETE FROM audit_logs`).rejects.toThrow(/permission denied/);
  });
});
