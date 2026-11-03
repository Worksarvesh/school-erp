/**
 * Step 1.2 spike: does Prisma (pg adapter, app role) work with transaction-local tenant context
 * and PostgreSQL RLS? Uses a throwaway table; the real tenant tables arrive in Step 1.3.
 */
import pg from 'pg';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { withSchoolContext } from '../src/database/school-context.js';
import { appPrisma, testDbUrl } from './support/test-db.js';

const SCHOOL_A = '0192f0a0-0000-7000-8000-00000000000a';
const SCHOOL_B = '0192f0a0-0000-7000-8000-00000000000b';

type Row = { name: string };

let owner: pg.Client;
let prisma: PrismaClient; // one connection, so every test reuses the same pooled connection

const namesIn = (tx: Pick<PrismaClient, '$queryRaw'>) =>
  tx.$queryRaw<Row[]>`SELECT name FROM rls_spike ORDER BY name`.then((rows) =>
    rows.map((r) => r.name),
  );

beforeAll(async () => {
  owner = new pg.Client({
    connectionString: testDbUrl('MIGRATION_DATABASE_URL'),
  });
  await owner.connect();
  await owner.query(`
    DROP TABLE IF EXISTS rls_spike;
    CREATE TABLE rls_spike (id uuid PRIMARY KEY, school_id uuid NOT NULL, name text NOT NULL);
    ALTER TABLE rls_spike ENABLE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON rls_spike
      USING (school_id = nullif(current_setting('app.school_id', true), '')::uuid)
      WITH CHECK (school_id = nullif(current_setting('app.school_id', true), '')::uuid);
    INSERT INTO rls_spike VALUES
      ('0192f0a0-0000-7000-8000-0000000000a1', '${SCHOOL_A}', 'a-1'),
      ('0192f0a0-0000-7000-8000-0000000000a2', '${SCHOOL_A}', 'a-2'),
      ('0192f0a0-0000-7000-8000-0000000000b1', '${SCHOOL_B}', 'b-1');
  `);
  prisma = appPrisma(1);
});

afterAll(async () => {
  await prisma?.$disconnect();
  await owner?.query('DROP TABLE IF EXISTS rls_spike');
  await owner?.end();
});

describe('RLS spike: Prisma + transaction-local school context', () => {
  it('connects as the app role, which is not the owner and cannot bypass RLS', async () => {
    const [me] = await prisma.$queryRaw<{ user: string; bypass: boolean; owner: string }[]>`
      SELECT current_user AS user,
             (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypass,
             (SELECT tableowner FROM pg_tables WHERE tablename = 'rls_spike') AS owner`;
    expect(me).toEqual({
      user: 'school_erp_app',
      bypass: false,
      owner: 'school_erp_owner',
    });
  });

  it('returns no rows when no school is set', async () => {
    expect(await namesIn(prisma)).toEqual([]);
  });

  it('returns only the current school rows inside withSchoolContext', async () => {
    expect(await withSchoolContext(prisma, SCHOOL_A, namesIn)).toEqual(['a-1', 'a-2']);
    expect(await withSchoolContext(prisma, SCHOOL_B, namesIn)).toEqual(['b-1']);
  });

  it('does not leak the school to the next query on the same connection', async () => {
    await withSchoolContext(prisma, SCHOOL_A, namesIn);

    const [setting] = await prisma.$queryRaw<{ value: string | null }[]>`
      SELECT current_setting('app.school_id', true) AS value`;
    expect(setting?.value ?? '').toBe('');
    expect(await namesIn(prisma)).toEqual([]);
  });

  it('does not leak the school after a rolled-back transaction', async () => {
    await expect(
      withSchoolContext(prisma, SCHOOL_A, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(await namesIn(prisma)).toEqual([]);
  });

  it('blocks writing a row for another school', async () => {
    await expect(
      withSchoolContext(
        prisma,
        SCHOOL_A,
        (tx) => tx.$executeRaw`
          INSERT INTO rls_spike VALUES
            ('0192f0a0-0000-7000-8000-0000000000c1', ${SCHOOL_B}::uuid, 'sneaky')`,
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('cannot update or delete another school rows', async () => {
    const changed = await withSchoolContext(prisma, SCHOOL_A, async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE rls_spike SET name = 'hacked' WHERE school_id = ${SCHOOL_B}::uuid`;
      const deleted = await tx.$executeRaw`
        DELETE FROM rls_spike WHERE school_id = ${SCHOOL_B}::uuid`;
      return updated + deleted;
    });
    expect(changed).toBe(0);
    expect(await withSchoolContext(prisma, SCHOOL_B, namesIn)).toEqual(['b-1']);
  });

  it('keeps concurrent transactions for different schools apart', async () => {
    const pooled = appPrisma(2);
    try {
      // pg_sleep makes the two transactions overlap on two connections.
      const slowNames = (tx: Pick<PrismaClient, '$queryRaw' | '$executeRaw'>) =>
        tx.$executeRaw`SELECT pg_sleep(0.3)`.then(() => namesIn(tx));
      const started = Date.now();
      const [a, b] = await Promise.all([
        withSchoolContext(pooled, SCHOOL_A, slowNames),
        withSchoolContext(pooled, SCHOOL_B, slowNames),
      ]);
      expect(Date.now() - started).toBeLessThan(550); // ran in parallel, not one after the other
      expect(a).toEqual(['a-1', 'a-2']);
      expect(b).toEqual(['b-1']);
    } finally {
      await pooled.$disconnect();
    }
  });

  it('rejects a school id that is not a UUID before touching the database', async () => {
    await expect(withSchoolContext(prisma, "x' OR true --", namesIn)).rejects.toThrow(
      'schoolId must be a UUID',
    );
  });
});
