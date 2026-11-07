/**
 * Slice 2A over HTTP: login, refresh, logout, devices, /v1/me, "not enabled" OTP actions,
 * rate limits, the error shape, and no secrets in responses or logs.
 */
import type { LoggerService } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import request from 'supertest';
import { PasswordService } from '../src/auth/password.service.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const id = (suffix: string) => `0192f0a6-0000-7000-8000-${suffix.padStart(12, '0')}`;
const SCHOOL_A = id('a');
const SCHOOL_B = id('b');
const ALICE = id('a1'); // principal in A, teacher in B
const BOB = id('b1'); // disabled account
const CAROL = id('c1'); // account without a password
const DAVE = id('d1'); // used for the per-identifier rate limit
const ERIN = id('e1'); // used for device/session tests

// Test-only passwords for throwaway fixtures.
const PW = {
  alice: 'alice-test-password-1',
  bob: 'bob-test-password-22',
  dave: 'dave-test-password-333',
  erin: 'erin-test-password-4444',
};

let owner: pg.Client;
let prisma: PrismaClient;
let app: NestExpressApplication;

const http = () => request(app.getHttpServer());
const login = (identifier: string, password: string, deviceName?: string) =>
  http()
    .post('/v1/auth/login')
    .send({ identifier, password, ...(deviceName && { deviceName }) });
const refresh = (refreshToken: string) => http().post('/v1/auth/refresh').send({ refreshToken });
const asUser = (accessToken: string) => ({
  get: (path: string) => http().get(path).set('Authorization', `Bearer ${accessToken}`),
  post: (path: string, body: object = {}) =>
    http().post(path).set('Authorization', `Bearer ${accessToken}`).send(body),
  delete: (path: string) => http().delete(path).set('Authorization', `Bearer ${accessToken}`),
});
/** What a client can observe about a failure, minus the per-request id. */
const outcome = (res: request.Response) => ({
  status: res.status,
  code: res.body.error?.code,
  message: res.body.error?.message,
});

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  const passwords = new PasswordService();
  const hash = {
    alice: await passwords.hash(PW.alice),
    bob: await passwords.hash(PW.bob),
    dave: await passwords.hash(PW.dave),
    erin: await passwords.hash(PW.erin),
  };
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES
      ('${SCHOOL_A}', 'School A', 'sch9001', now()),
      ('${SCHOOL_B}', 'School B', 'sch9002', now());
    INSERT INTO users (id, full_name, phone, email, status, updated_at) VALUES
      ('${ALICE}', 'Alice', '+919000000201', 'alice@example.test', 'active', now()),
      ('${BOB}', 'Bob', '+919000000202', NULL, 'disabled', now()),
      ('${CAROL}', 'Carol', '+919000000203', NULL, 'active', now()),
      ('${DAVE}', 'Dave', '+919000000204', NULL, 'active', now()),
      ('${ERIN}', 'Erin', NULL, 'erin@example.test', 'active', now());
    INSERT INTO credentials (user_id, password_hash, password_changed_at, updated_at) VALUES
      ('${ALICE}', '${hash.alice}', now(), now()),
      ('${BOB}', '${hash.bob}', now(), now()),
      ('${DAVE}', '${hash.dave}', now(), now()),
      ('${ERIN}', '${hash.erin}', now(), now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      (gen_random_uuid(), '${SCHOOL_A}', '${ALICE}', 'principal', 'active', now()),
      (gen_random_uuid(), '${SCHOOL_B}', '${ALICE}', 'teacher', 'active', now());
  `);
  prisma = appPrisma(4);
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

describe('POST /v1/auth/login', () => {
  it('signs in with a phone number in any common format, or an email in any case', async () => {
    const byPhone = await login('90000 00201', PW.alice).expect(200);
    expect(byPhone.body).toEqual({
      accessToken: expect.any(String),
      accessTokenExpiresIn: 900,
      refreshToken: expect.stringMatching(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/),
      refreshTokenExpiresAt: expect.any(String),
      user: { id: ALICE, fullName: 'Alice' },
    });
    await login('+91 90000-00201', PW.alice).expect(200);
    await login('  Alice@Example.TEST ', PW.alice).expect(200);
  });

  it('gives one identical answer for wrong password, unknown, disabled or password-less accounts', async () => {
    const answers = await Promise.all([
      login('alice@example.test', 'wrong-password-123'),
      login('nobody@example.test', 'wrong-password-123'),
      login('+919999999999', 'wrong-password-123'),
      login('+919000000202', PW.bob), // disabled, correct password
      login('+919000000203', 'any-password-123'), // no credentials row
      login('not-a-phone-or-email', 'any-password-123'),
    ]);
    const expected = { status: 401, code: 'invalid_credentials', message: 'Invalid login details' };
    for (const res of answers) {
      expect(outcome(res)).toEqual(expected);
    }
  });

  it('validates the body and names the bad fields, never their values', async () => {
    const res = await http().post('/v1/auth/login').send({ password: 42, extra: 'x' }).expect(400);
    expect(res.body.error.code).toBe('validation_failed');
    expect(res.body.error.details.join(' ')).toMatch(/identifier/);
    expect(res.body.error.details.join(' ')).toMatch(/property extra should not exist/);
    // The random request id may contain "42" itself, so check everything but it.
    const shown = { ...(res.body.error as Record<string, unknown>) };
    delete shown.requestId;
    expect(JSON.stringify(shown)).not.toContain('42');
  });

  it('writes audit events without the identifier the user typed', async () => {
    await login('alice@example.test', PW.alice).expect(200);
    await login('ghost@example.test', 'wrong-password-123').expect(401);
    const { rows } = await owner.query<{
      action: string;
      actor: string | null;
      ip: string | null;
      row: string;
    }>(
      `SELECT action, actor_user_id AS actor, ip, a::text AS row FROM audit_logs a
       WHERE action IN ('auth.login_succeeded', 'auth.login_failed')`,
    );
    expect(rows.some((r) => r.action === 'auth.login_succeeded' && r.actor === ALICE)).toBe(true);
    expect(rows.some((r) => r.action === 'auth.login_failed' && r.actor === null)).toBe(true);
    expect(rows.every((r) => r.ip)).toBe(true);
    expect(rows.map((r) => r.row).join(' ')).not.toMatch(/ghost|example\.test|\+91900/);
  });
});

describe('GET /v1/me', () => {
  it('returns the profile and each school with its roles', async () => {
    const { accessToken } = (await login('alice@example.test', PW.alice)).body;
    const res = await asUser(accessToken).get('/v1/me').expect(200);
    expect(res.body).toEqual({
      id: ALICE,
      fullName: 'Alice',
      phone: '+919000000201',
      email: 'alice@example.test',
      status: 'active',
      schools: [
        { schoolId: SCHOOL_A, name: 'School A', code: 'sch9001', roles: ['principal'] },
        { schoolId: SCHOOL_B, name: 'School B', code: 'sch9002', roles: ['teacher'] },
      ],
    });
  });

  it('returns 401 without a token', async () => {
    const res = await http().get('/v1/me').expect(401);
    expect(res.body.error.code).toBe('unauthenticated');
  });
});

describe('POST /v1/auth/refresh', () => {
  it('rotates: new tokens back, and the old refresh token no longer works', async () => {
    const first = (await login('alice@example.test', PW.alice)).body;
    const second = (await refresh(first.refreshToken).expect(200)).body;
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(second.refreshToken.split('.')[0]).toBe(first.refreshToken.split('.')[0]); // same device
    await asUser(second.accessToken).get('/v1/me').expect(200);
  });

  it('treats reuse of an old token as theft: revokes the session and audits it', async () => {
    const first = (await login('alice@example.test', PW.alice)).body;
    const second = (await refresh(first.refreshToken).expect(200)).body;

    await refresh(first.refreshToken).expect(401); // replay
    await refresh(second.refreshToken).expect(401); // the whole session is gone

    const sessionId = first.refreshToken.split('.')[0];
    const { rows } = await owner.query(
      `SELECT 1 FROM audit_logs WHERE action = 'auth.refresh_reuse_detected' AND target_id = $1`,
      [sessionId],
    );
    expect(rows).toHaveLength(1);
  });

  it('lets only one of two concurrent refreshes with the same token succeed', async () => {
    const { refreshToken } = (await login('alice@example.test', PW.alice)).body;
    const results = await Promise.all([refresh(refreshToken), refresh(refreshToken)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);

    // Strict reuse detection (no grace window): the loser looks like a replay, so the
    // session is revoked and the winner's new token dies too. See docs/decisions.md.
    const winner = results.find((r) => r.status === 200)!;
    await refresh(winner.body.refreshToken).expect(401);
  });

  it('gives one identical answer for garbage, unknown sessions and wrong secrets', async () => {
    const { refreshToken } = (await login('alice@example.test', PW.alice)).body;
    const [sessionId] = refreshToken.split('.');
    const answers = await Promise.all([
      refresh('garbage'),
      refresh(`${id('ffff')}.${'A'.repeat(43)}`),
      refresh(`${sessionId}.${'A'.repeat(43)}`),
    ]);
    for (const res of answers) {
      expect(outcome(res)).toEqual({
        status: 401,
        code: 'invalid_refresh_token',
        message: 'Sign in again',
      });
    }
    // A wrong guess must not revoke the real session (no denial of service by session id).
    await refresh(refreshToken).expect(200);
  });
});

describe('logout, logout-all and devices', () => {
  it('logout ends the current session and is audited', async () => {
    const { accessToken, refreshToken } = (await login('erin@example.test', PW.erin)).body;
    await asUser(accessToken).post('/v1/auth/logout').expect(204);
    await refresh(refreshToken).expect(401);
    const { rows } = await owner.query(
      `SELECT 1 FROM audit_logs WHERE action = 'auth.logout' AND actor_user_id = $1`,
      [ERIN],
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it('lists devices and signs one out; others cannot be touched', async () => {
    const phone = (await login('erin@example.test', PW.erin, 'Phone')).body;
    const laptop = (await login('erin@example.test', PW.erin, 'Laptop')).body;
    const erin = asUser(phone.accessToken);

    const before = (await erin.get('/v1/me/sessions').expect(200)).body.items;
    const mine = before.find((s: { current: boolean }) => s.current);
    expect(mine.deviceName).toBe('Phone');
    const laptopId = laptop.refreshToken.split('.')[0];
    expect(before.map((s: { id: string }) => s.id)).toContain(laptopId);

    await erin.delete(`/v1/me/sessions/${laptopId}`).expect(204);
    await refresh(laptop.refreshToken).expect(401);
    await erin.delete(`/v1/me/sessions/${laptopId}`).expect(404); // already ended

    const alice = (await login('alice@example.test', PW.alice)).body;
    await erin.delete(`/v1/me/sessions/${alice.refreshToken.split('.')[0]}`).expect(404);
    await refresh(alice.refreshToken).expect(200); // untouched

    await erin.delete('/v1/me/sessions/not-a-uuid').expect(400);
  });

  it('logout-all ends every session of the user and is audited', async () => {
    const one = (await login('erin@example.test', PW.erin, 'One')).body;
    const two = (await login('erin@example.test', PW.erin, 'Two')).body;
    const res = await asUser(one.accessToken).post('/v1/auth/logout-all').expect(200);
    expect(res.body.revoked).toBeGreaterThanOrEqual(2);
    await refresh(one.refreshToken).expect(401);
    await refresh(two.refreshToken).expect(401);
    const { rows } = await owner.query(
      `SELECT metadata FROM audit_logs WHERE action = 'auth.logout_all' AND actor_user_id = $1`,
      [ERIN],
    );
    expect(rows[0]?.metadata).toEqual({ revoked: res.body.revoked });
  });
});

describe('actions that need OTP (not built yet)', () => {
  it('POST /v1/me/password validates, then answers 501 not_enabled', async () => {
    const { accessToken } = (await login('alice@example.test', PW.alice)).body;
    const me = asUser(accessToken);
    await me
      .post('/v1/me/password', { currentPassword: PW.alice, newPassword: 'short' })
      .expect(400);
    const res = await me
      .post('/v1/me/password', { currentPassword: PW.alice, newPassword: 'a-long-new-password' })
      .expect(501);
    expect(outcome(res)).toEqual({
      status: 501,
      code: 'not_enabled',
      message: 'Step-up verification is not enabled yet',
    });
  });

  it('POST /v1/auth/password-reset answers the same for known and unknown accounts', async () => {
    const known = await http()
      .post('/v1/auth/password-reset')
      .send({ identifier: '+919000000201' });
    const unknown = await http()
      .post('/v1/auth/password-reset')
      .send({ identifier: '+919999999998' });
    expect(outcome(known)).toEqual({
      status: 501,
      code: 'not_enabled',
      message: 'Password reset is not enabled yet',
    });
    expect(outcome(unknown)).toEqual(outcome(known));
  });
});

describe('rate limits', () => {
  it('blocks an identifier after 5 failures, counting every format of it together', async () => {
    for (const identifier of [
      '9000000204',
      '+91 90000 00204',
      '090000 00204',
      '9000000204',
      '+919000000204',
    ]) {
      await login(identifier, 'wrong-password-123').expect(401);
    }
    const blocked = await login('9000000204', PW.dave); // even with the right password
    expect(outcome(blocked)).toEqual({
      status: 429,
      code: 'too_many_requests',
      message: 'Too many attempts, try again later',
    });
  });

  it('blocks unknown identifiers the same way (a 429 does not reveal an account)', async () => {
    for (let i = 0; i < 5; i++) {
      await login('+919888888888', 'wrong-password-123').expect(401);
    }
    const blocked = await login('+919888888888', 'wrong-password-123');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('too_many_requests');
  });

  it('limits auth requests per IP, and X-Forwarded-For cannot dodge it (trust proxy off)', async () => {
    const previous = process.env.AUTH_RATE_LIMIT_PER_MINUTE;
    process.env.AUTH_RATE_LIMIT_PER_MINUTE = '3';
    const limited = await createTestApp(prisma);
    try {
      const attempt = (ip: string) =>
        request(limited.getHttpServer())
          .post('/v1/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ identifier: 'x@example.test', password: 'wrong-password-123' });
      for (let i = 0; i < 3; i++) {
        await attempt('203.0.113.1').expect(401);
      }
      const res = await attempt('203.0.113.99');
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('too_many_requests');
    } finally {
      process.env.AUTH_RATE_LIMIT_PER_MINUTE = previous;
      await limited.close();
    }
  });
});

describe('error shape and request ids', () => {
  it('wraps every error as { error: { code, message, requestId } } and echoes X-Request-Id', async () => {
    const res = await http()
      .get('/v1/no-such-route')
      .set('X-Request-Id', 'trace-1234abcd')
      .expect(404);
    expect(res.body).toEqual({
      error: { code: 'not_found', message: 'Not found', requestId: 'trace-1234abcd' },
    });
    expect(res.headers['x-request-id']).toBe('trace-1234abcd');
  });

  it('replaces a malformed X-Request-Id with its own', async () => {
    const res = await http().get('/v1/no-such-route').set('X-Request-Id', 'bad id!');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('sets a request id on successful responses too', async () => {
    const res = await http().get('/v1').expect(200);
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('secrets never leak', () => {
  it('keeps passwords, tokens and Authorization headers out of responses and logs', async () => {
    const lines: string[] = [];
    const capture = (...args: unknown[]) => lines.push(args.map(String).join(' '));
    const logger: LoggerService = {
      log: capture,
      error: capture,
      warn: capture,
      debug: capture,
      verbose: capture,
      fatal: capture,
    };
    const logged = await createTestApp(prisma, { logger });
    try {
      const send = () => request(logged.getHttpServer());
      const wrongPassword = 'Leaky-Wrong-Password-0001';
      const responses: request.Response[] = [];

      const ok = await send()
        .post('/v1/auth/login')
        .send({ identifier: 'alice@example.test', password: PW.alice });
      responses.push(ok);
      const { accessToken, refreshToken } = ok.body;
      responses.push(
        await send()
          .post('/v1/auth/login')
          .send({ identifier: 'alice@example.test', password: wrongPassword }),
      );
      responses.push(
        await send().post('/v1/auth/login').send({
          identifier: 'alice@example.test',
          password: wrongPassword,
          extra: wrongPassword,
        }),
      );
      responses.push(
        await send()
          .post('/v1/auth/login')
          .set('Content-Type', 'application/json')
          .send(`{"password":"${wrongPassword}",`),
      );
      responses.push(await send().post('/v1/auth/refresh').send({ refreshToken }));
      responses.push(
        await send()
          .post('/v1/auth/refresh')
          .send({ refreshToken: `${refreshToken}x` }),
      );
      responses.push(
        await send().get('/v1/no-such-route').set('Authorization', `Bearer ${accessToken}`),
      );
      responses.push(await send().get('/v1/me').set('Authorization', `Bearer ${accessToken}x`));

      // The successful login and refresh must return tokens; everything else must not echo them.
      const errorBodies = responses
        .filter((r) => r.status >= 400)
        .map((r) => JSON.stringify(r.body) + JSON.stringify(r.headers));
      const everything = [...errorBodies, ...lines].join('\n');
      for (const secret of [
        PW.alice,
        wrongPassword,
        accessToken,
        refreshToken.split('.')[1],
        'Bearer',
      ]) {
        expect(everything, `leaked ${secret.slice(0, 6)}...`).not.toContain(secret);
      }
      expect(responses[3]!.status).toBe(400); // malformed JSON is rejected without echoing it
    } finally {
      await logged.close();
    }
  });
});
