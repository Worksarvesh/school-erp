/**
 * Phase 2, Slice 1: global identity tables (users, credentials, sessions) under a school context.
 *
 * Phase 0 audit finding R1: the users policy had no FOR clause and no WITH CHECK, so a school
 * context could UPDATE (and, with the default DELETE grant, DELETE) any user who was a member of
 * that school, including a user who also belongs to another school. Phone is the OTP login
 * identity, so that was a cross-school account-takeover path. These tests run as the app role
 * against the real test database and must stay green.
 */
import pg from 'pg';
import { SessionsService } from '../src/auth/sessions.service.js';
import type { PrismaService } from '../src/database/prisma.service.js';
import { withSchoolContext, withUserContext } from '../src/database/school-context.js';
import type { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { UsersService } from '../src/users/users.service.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const SCHOOL_A = '0192f0c0-0000-7000-8000-00000000000a';
const SCHOOL_B = '0192f0c0-0000-7000-8000-00000000000b';
const USER_A = '0192f0c0-0000-7000-8000-0000000000a1'; // member of A only
const USER_B = '0192f0c0-0000-7000-8000-0000000000b1'; // member of B only
const USER_AB = '0192f0c0-0000-7000-8000-0000000000ab'; // teacher in A, principal in B
const SESSION_AB = '0192f0c0-0000-7000-8000-0000000005ab';
const SESSION_B = '0192f0c0-0000-7000-8000-0000000005b1';
const NEW_USER = '0192f0c0-0000-7000-8000-0000000000c1';

let owner: pg.Client;
let prisma: PrismaClient;

/** The row as the owner (no RLS) sees it, to prove a write really did not happen. */
async function ownerRow(table: 'users' | 'credentials' | 'sessions', key: string, id: string) {
  const { rows } = await owner.query(`SELECT * FROM ${table} WHERE ${key} = $1`, [id]);
  return rows[0] as Record<string, unknown> | undefined;
}

/**
 * Today's withSchoolContext() sets only app.school_id. The planned request context (RLS-MATRIX)
 * also sets app.user_id. Run the same checks with both settings so the fix holds for that too.
 * Test-only: production code sets context only through src/database/school-context.ts.
 */
function withSchoolAndUser<T>(
  schoolId: string,
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.school_id', ${schoolId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  });
}

const PERMISSION_DENIED = /permission denied/;

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES
      ('${SCHOOL_A}', 'School A', 'sch8101', now()),
      ('${SCHOOL_B}', 'School B', 'sch8102', now());
    INSERT INTO users (id, full_name, phone, email, updated_at) VALUES
      ('${USER_A}', 'User A', '+919000000201', 'a@example.test', now()),
      ('${USER_B}', 'User B', '+919000000202', 'b@example.test', now()),
      ('${USER_AB}', 'User AB', '+919000000203', 'ab@example.test', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      ('0192f0c0-0000-7000-8000-0000000001a1', '${SCHOOL_A}', '${USER_A}', 'teacher', 'active', now()),
      ('0192f0c0-0000-7000-8000-0000000001b1', '${SCHOOL_B}', '${USER_B}', 'teacher', 'active', now()),
      ('0192f0c0-0000-7000-8000-0000000001a2', '${SCHOOL_A}', '${USER_AB}', 'teacher', 'active', now()),
      ('0192f0c0-0000-7000-8000-0000000001b2', '${SCHOOL_B}', '${USER_AB}', 'principal', 'active', now());
    INSERT INTO credentials (user_id, password_hash, password_changed_at, updated_at) VALUES
      ('${USER_AB}', 'hash-of-ab', now(), now()),
      ('${USER_B}', 'hash-of-b', now(), now());
    INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES
      ('${SESSION_AB}', '${USER_AB}', 'token-hash-ab', now() + interval '1 day'),
      ('${SESSION_B}', '${USER_B}', 'token-hash-b', now() + interval '1 day');
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

describe('1. a school cannot modify a global user identity', () => {
  it('School A cannot change the phone (OTP login) of a user who is principal of School B', async () => {
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_A,
        (tx) =>
          tx.$executeRaw`UPDATE users SET phone = '+919999999999' WHERE id = ${USER_AB}::uuid`,
      ),
    ).rejects.toThrow(PERMISSION_DENIED);
    expect((await ownerRow('users', 'id', USER_AB))?.phone).toBe('+919000000203');
  });

  it('School A cannot change the name of that shared user (granted column, blocked by policy)', async () => {
    const changed = await withSchoolContext(
      prisma,
      SCHOOL_A,
      (tx) => tx.$executeRaw`UPDATE users SET full_name = 'Hijacked' WHERE id = ${USER_AB}::uuid`,
    );
    expect(changed).toBe(0);
    expect((await ownerRow('users', 'id', USER_AB))?.full_name).toBe('User AB');
  });

  it('School A cannot change a user who belongs only to School B, nor its own members', async () => {
    for (const id of [USER_B, USER_A]) {
      const changed = await withSchoolContext(
        prisma,
        SCHOOL_A,
        (tx) => tx.$executeRaw`UPDATE users SET full_name = 'Changed' WHERE id = ${id}::uuid`,
      );
      expect(changed, id).toBe(0);
    }
    expect((await ownerRow('users', 'id', USER_B))?.full_name).toBe('User B');
    expect((await ownerRow('users', 'id', USER_A))?.full_name).toBe('User A');
  });

  it('the Prisma update path fails the same way (no row to update)', async () => {
    await expect(
      withSchoolContext(prisma, SCHOOL_A, (tx) =>
        tx.user.update({ where: { id: USER_AB }, data: { fullName: 'Hijacked' } }),
      ),
    ).rejects.toThrow();
    expect((await ownerRow('users', 'id', USER_AB))?.full_name).toBe('User AB');
  });

  it('stays blocked when the school context also carries the user id (planned request context)', async () => {
    const changed = await withSchoolAndUser(
      SCHOOL_A,
      USER_AB,
      (tx) => tx.$executeRaw`UPDATE users SET full_name = 'Hijacked' WHERE id = ${USER_AB}::uuid`,
    );
    expect(changed).toBe(0);
  });

  it('a school context cannot create a global user', async () => {
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_A,
        (tx) =>
          tx.$executeRaw`INSERT INTO users (id, full_name, updated_at)
          VALUES (${NEW_USER}::uuid, 'Planted', now())`,
      ),
    ).rejects.toThrow(/row-level security/);
    expect(await ownerRow('users', 'id', NEW_USER)).toBeUndefined();
  });

  it('still reads its own members (approved read access is unchanged)', async () => {
    const ids = await withSchoolContext(prisma, SCHOOL_A, (tx) =>
      tx.user.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
    );
    expect(ids.map((u) => u.id)).toEqual([USER_A, USER_AB]);
  });
});

describe('2. a school cannot delete a global user identity', () => {
  it.each([
    ['shared user (principal of School B)', USER_AB],
    ['user of School B only', USER_B],
    ['own member', USER_A],
  ])('School A cannot delete the %s', async (_label, id) => {
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_A,
        (tx) => tx.$executeRaw`DELETE FROM users WHERE id = ${id}::uuid`,
      ),
    ).rejects.toThrow(PERMISSION_DENIED);
    expect(await ownerRow('users', 'id', id)).toBeDefined();
  });
});

describe('3. a school context cannot read or modify credentials', () => {
  it('sees no credential rows', async () => {
    const rows = await withSchoolContext(
      prisma,
      SCHOOL_B,
      (tx) => tx.$queryRaw<unknown[]>`SELECT user_id FROM credentials`,
    );
    expect(rows).toEqual([]);
  });

  it('cannot overwrite a member password hash, even with the user id also set', async () => {
    const plain = await withSchoolContext(
      prisma,
      SCHOOL_B,
      (tx) =>
        tx.$executeRaw`UPDATE credentials SET password_hash = 'attacker' WHERE user_id = ${USER_AB}::uuid`,
    );
    const both = await withSchoolAndUser(
      SCHOOL_B,
      USER_AB,
      (tx) =>
        tx.$executeRaw`UPDATE credentials SET password_hash = 'attacker' WHERE user_id = ${USER_AB}::uuid`,
    );
    expect([plain, both]).toEqual([0, 0]);
    expect((await ownerRow('credentials', 'user_id', USER_AB))?.password_hash).toBe('hash-of-ab');
  });

  it('cannot insert or delete credentials', async () => {
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_A,
        (tx) =>
          tx.$executeRaw`INSERT INTO credentials (user_id, password_hash, password_changed_at, updated_at)
          VALUES (${USER_A}::uuid, 'planted', now(), now())`,
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_B,
        (tx) => tx.$executeRaw`DELETE FROM credentials WHERE user_id = ${USER_AB}::uuid`,
      ),
    ).rejects.toThrow(PERMISSION_DENIED);
    expect(await ownerRow('credentials', 'user_id', USER_A)).toBeUndefined();
    expect(await ownerRow('credentials', 'user_id', USER_AB)).toBeDefined();
  });
});

describe('4. a school context cannot read, modify or delete sessions', () => {
  it('sees no sessions and cannot revoke or rewrite one, even with the user id also set', async () => {
    const seen = await withSchoolContext(prisma, SCHOOL_B, (tx) =>
      tx.session.findMany({ select: { id: true } }),
    );
    const revoked = await withSchoolContext(
      prisma,
      SCHOOL_B,
      (tx) => tx.$executeRaw`UPDATE sessions SET revoked_at = now() WHERE id = ${SESSION_AB}::uuid`,
    );
    const rewritten = await withSchoolAndUser(
      SCHOOL_B,
      USER_AB,
      (tx) =>
        tx.$executeRaw`UPDATE sessions SET token_hash = 'attacker' WHERE id = ${SESSION_AB}::uuid`,
    );
    expect(seen).toEqual([]);
    expect([revoked, rewritten]).toEqual([0, 0]);
    const row = await ownerRow('sessions', 'id', SESSION_AB);
    expect(row?.revoked_at).toBeNull();
    expect(row?.token_hash).toBe('token-hash-ab');
  });

  it('cannot delete sessions', async () => {
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_B,
        (tx) => tx.$executeRaw`DELETE FROM sessions WHERE id = ${SESSION_B}::uuid`,
      ),
    ).rejects.toThrow(PERMISSION_DENIED);
    expect(await ownerRow('sessions', 'id', SESSION_B)).toBeDefined();
  });
});

describe('5. no context means no tenant or identity rows', () => {
  it.each([
    'schools',
    'school_memberships',
    'users',
    'credentials',
    'sessions',
    'school_verification_requests',
    'platform_staff',
  ])('%s returns nothing and cannot be changed', async (table) => {
    const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM ${table}`,
    );
    expect(rows[0]?.n).toBe(0);
  });

  it('an UPDATE of users without context changes nothing', async () => {
    expect(await prisma.$executeRaw`UPDATE users SET full_name = 'x'`).toBe(0);
  });
});

describe('6. authorized user-context operations still work', () => {
  const users = () => new UsersService(prisma as unknown as PrismaService);
  const sessions = () => new SessionsService(prisma as unknown as PrismaService);

  it('a user updates their own name and login time', async () => {
    await users().setOwnName(USER_B, 'User B Renamed');
    await users().recordPhoneLogin(USER_B);
    const row = await ownerRow('users', 'id', USER_B);
    expect(row?.full_name).toBe('User B Renamed');
    expect(row?.last_login_at).not.toBeNull();
  });

  it('first OTP login still creates the user (own row, user context)', async () => {
    const id = await users().createVerifiedPhoneUser('+919000000299');
    expect((await ownerRow('users', 'id', id))?.phone).toBe('+919000000299');
  });

  it('sessions are created, rotated and revoked in user context', async () => {
    const created = await sessions().create(USER_B, 'test device');
    const secret = created.refreshToken.split('.')[1]!;
    const rotated = await sessions().rotate(USER_B, created.sessionId, secret);
    expect(rotated.status).toBe('rotated');
    expect(await sessions().revoke(USER_B, created.sessionId, 'logout')).toBe(true);
  });

  it('a user still cannot change their own login identity or status directly', async () => {
    for (const sql of [
      `UPDATE users SET phone = '+919000000298' WHERE id = '${USER_B}'`,
      `UPDATE users SET status = 'disabled' WHERE id = '${USER_B}'`,
      `UPDATE users SET username = 'sch0001e9999' WHERE id = '${USER_B}'`,
      `DELETE FROM users WHERE id = '${USER_B}'`,
    ]) {
      await expect(
        withUserContext(prisma, USER_B, (tx) => tx.$executeRawUnsafe(sql)),
        sql,
      ).rejects.toThrow(PERMISSION_DENIED);
    }
  });
});

describe('7. privileges and policies, as stored in the catalog', () => {
  const privilege = async (sql: string) =>
    (await owner.query<{ ok: boolean }>(`SELECT ${sql} AS ok`)).rows[0]?.ok;

  it('the app role holds no DELETE or TRUNCATE on users, credentials or sessions', async () => {
    for (const table of ['users', 'credentials', 'sessions']) {
      for (const priv of ['DELETE', 'TRUNCATE']) {
        expect(
          await privilege(`has_table_privilege('school_erp_app', '${table}', '${priv}')`),
          `${table} ${priv}`,
        ).toBe(false);
      }
    }
  });

  it('the app role may update only non-identity user columns', async () => {
    const col = (c: string) =>
      privilege(`has_column_privilege('school_erp_app', 'users', '${c}', 'UPDATE')`);
    for (const c of ['full_name', 'phone_verified_at', 'last_login_at', 'updated_at']) {
      expect(await col(c), c).toBe(true);
    }
    for (const c of ['id', 'phone', 'email', 'username', 'status', 'created_at']) {
      expect(await col(c), c).toBe(false);
    }
  });

  it('no policy on these tables applies to DELETE, and every write policy needs a user context with no school', async () => {
    const { rows } = await owner.query<{
      table: string;
      cmd: string;
      qual: string | null;
      check: string | null;
    }>(
      `SELECT tablename AS table, cmd, qual, with_check AS check FROM pg_policies
       WHERE tablename IN ('users', 'credentials', 'sessions') AND 'school_erp_app' = ANY(
         CASE WHEN roles = '{public}' THEN ARRAY['school_erp_app'] ELSE roles::text[] END)`,
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const p of rows) {
      expect(p.cmd, `${p.table}`).not.toBe('DELETE');
      if (p.cmd !== 'SELECT') {
        const expr = `${p.qual ?? ''} ${p.check ?? ''}`;
        expect(expr, `${p.table} ${p.cmd}`).toMatch(/current_app_user_id\(\)/);
        expect(expr, `${p.table} ${p.cmd}`).toMatch(/current_school_id\(\) IS NULL/);
      }
    }
  });
});
