/**
 * Slice 2B: principal OTP login with the fixed provider (OTP_PROVIDER=fixed, code 999999).
 * The fixed code is a provider behaviour only: challenges, expiry, attempts and rate limits are
 * the real ones, and neither the code nor the typed phone ever reaches logs, responses or audit.
 */
import type { LoggerService } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import request from 'supertest';
import { OtpService } from '../src/auth/otp.service.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { createTestApp } from './support/test-app.js';
import { appPrisma, testDbUrl, truncateTenantData } from './support/test-db.js';

const id = (suffix: string) => `0192f0a7-0000-7000-8000-${suffix.padStart(12, '0')}`;
const SCHOOL = id('a');
const PRINCIPAL = id('a1'); // known number, principal of SCHOOL
const DISABLED = id('b1'); // known number, disabled account
const CODE = '999999';

// Each test uses its own numbers: the per-number limiter is in memory and shared by the app.
let nextNumber = 9000020000;
const freshPhone = () => `+91${nextNumber++}`;
const KNOWN_PHONE = '+919000019001';
const DISABLED_PHONE = '+919000019002';

let owner: pg.Client;
let prisma: PrismaClient;
let app: NestExpressApplication;
const http = () => request(app.getHttpServer());
const requestOtp = (phone: string) => http().post('/v1/auth/otp/request').send({ phone });
const verifyOtp = (phone: string, code: string) =>
  http().post('/v1/auth/otp/verify').send({ phone, code, deviceName: 'Test phone' });
const outcome = (res: request.Response) => ({
  status: res.status,
  code: res.body.error?.code,
  message: res.body.error?.message,
});
const openChallenges = async (phone: string) =>
  (
    await owner.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM otp_challenges WHERE phone = $1 AND consumed_at IS NULL',
      [phone],
    )
  ).rows[0]!.n;

beforeAll(async () => {
  owner = new pg.Client({ connectionString: testDbUrl('MIGRATION_DATABASE_URL') });
  await owner.connect();
  await truncateTenantData(owner);
  await owner.query(`
    INSERT INTO schools (id, name, code, updated_at) VALUES ('${SCHOOL}', 'School', 'sch9101', now());
    INSERT INTO users (id, full_name, phone, status, updated_at) VALUES
      ('${PRINCIPAL}', 'Priya Principal', '${KNOWN_PHONE}', 'active', now()),
      ('${DISABLED}', 'Dan Disabled', '${DISABLED_PHONE}', 'disabled', now());
    INSERT INTO school_memberships (id, school_id, user_id, role, status, updated_at) VALUES
      (gen_random_uuid(), '${SCHOOL}', '${PRINCIPAL}', 'principal', 'active', now());
  `);
  prisma = appPrisma(4);
  app = await createTestApp(prisma);
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
  await truncateTenantData(owner);
  await owner.end();
});

describe('POST /v1/auth/otp/request', () => {
  it('answers the same for known and unknown numbers, with no code in the body', async () => {
    const known = await requestOtp(KNOWN_PHONE).expect(202);
    const unknown = await requestOtp(freshPhone()).expect(202);
    expect(known.body).toEqual({ expiresInSeconds: 300 });
    expect(unknown.body).toEqual(known.body);
  });

  it('rejects an invalid number with 400', async () => {
    const res = await requestOtp('123456').expect(400);
    expect(res.body.error.code).toBe('invalid_phone');
  });

  it('limits requests per number (30 s cooldown), the same for unknown numbers', async () => {
    for (const phone of [freshPhone(), freshPhone()]) {
      await requestOtp(phone).expect(202);
      expect(outcome(await requestOtp(phone))).toEqual({
        status: 429,
        code: 'too_many_requests',
        message: 'Too many attempts, try again later',
      });
    }
  });
});

describe('POST /v1/auth/otp/verify', () => {
  it('signs in a known principal with the fixed code', async () => {
    const otp = app.get(OtpService);
    await otp.issue(KNOWN_PHONE, 'principal_login', null);
    const res = await verifyOtp(KNOWN_PHONE, CODE).expect(200);
    expect(res.body).toMatchObject({
      isNewUser: false,
      user: { id: PRINCIPAL, fullName: 'Priya Principal' },
      accessTokenExpiresIn: 900,
    });
    const me = await http()
      .get(`/v1/schools/${SCHOOL}`)
      .set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(me.status).toBe(200);

    const { rows } = await owner.query<{ client_app: string; verified: boolean }>(
      `SELECT s.client_app, u.phone_verified_at IS NOT NULL AS verified
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`,
      [PRINCIPAL],
    );
    expect(rows).toEqual([{ client_app: 'school_app', verified: true }]);
    expect(await openChallenges(KNOWN_PHONE)).toBe(0); // consumed
  });

  it('creates an account on the first login of an unknown number', async () => {
    const phone = freshPhone();
    await requestOtp(phone).expect(202);
    const res = await verifyOtp(phone, CODE).expect(200);
    expect(res.body.isNewUser).toBe(true);
    expect(res.body.user.fullName).toBe('');
    const me = await http().get('/v1/me').set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(me.body).toMatchObject({ phone, schools: [] });
  });

  it('gives one answer for wrong, missing, expired and used codes', async () => {
    const wrong = freshPhone();
    await requestOtp(wrong).expect(202);
    const none = freshPhone();
    const expired = freshPhone();
    await requestOtp(expired).expect(202);
    await owner.query(
      `UPDATE otp_challenges SET expires_at = now() - interval '1 second' WHERE phone = $1`,
      [expired],
    );
    const used = freshPhone();
    await requestOtp(used).expect(202);
    await verifyOtp(used, CODE).expect(200);

    const expected = { status: 401, code: 'invalid_otp', message: 'Invalid or expired code' };
    expect(outcome(await verifyOtp(wrong, '123456'))).toEqual(expected);
    expect(outcome(await verifyOtp(none, CODE))).toEqual(expected);
    expect(outcome(await verifyOtp(expired, CODE))).toEqual(expected);
    expect(outcome(await verifyOtp(used, CODE))).toEqual(expected);
  });

  it('locks a challenge after 5 attempts, even for the right code', async () => {
    const phone = freshPhone();
    await requestOtp(phone).expect(202);
    for (let i = 0; i < 4; i++) {
      await verifyOtp(phone, '000000').expect(401);
    }
    await verifyOtp(phone, '000000').expect(429); // fifth attempt locks it
    await verifyOtp(phone, CODE).expect(429);
  });

  it('keeps one open challenge per number: a new code voids the old one', async () => {
    const phone = freshPhone();
    const otp = app.get(OtpService);
    await otp.issue(phone, 'principal_registration', null);
    await otp.issue(phone, 'principal_registration', null);
    expect(await openChallenges(phone)).toBe(1);
  });

  it('refuses a disabled account with the same answer as a wrong code', async () => {
    await app.get(OtpService).issue(DISABLED_PHONE, 'principal_login', null);
    expect(outcome(await verifyOtp(DISABLED_PHONE, CODE))).toEqual({
      status: 401,
      code: 'invalid_otp',
      message: 'Invalid or expired code',
    });
  });

  it('validates the code format without echoing it', async () => {
    const res = await verifyOtp(freshPhone(), '12ab').expect(400);
    expect(res.body.error.code).toBe('validation_failed');
    expect(JSON.stringify(res.body.error.details)).not.toContain('12ab');
  });
});

describe('storage and secrets', () => {
  it('stores only an HMAC of the code, which the app role cannot even read', async () => {
    const { rows } = await owner.query<{ code_hash: string }>(
      'SELECT code_hash FROM otp_challenges LIMIT 5',
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.code_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.code_hash).not.toContain(CODE);
    }
    await expect(prisma.$queryRawUnsafe('SELECT 1 FROM otp_challenges')).rejects.toThrow(
      /permission denied/,
    );
  });

  it('keeps the code and the typed phone out of logs, responses and audit rows', async () => {
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
    const phone = freshPhone();
    try {
      const send = () => request(logged.getHttpServer());
      const responses = [
        await send().post('/v1/auth/otp/request').send({ phone }),
        await send().post('/v1/auth/otp/verify').send({ phone, code: '111111' }),
        await send().post('/v1/auth/otp/verify').send({ phone, code: CODE }),
      ];
      const digits = phone.slice(3);
      for (const res of responses) {
        expect(res.text).not.toContain(CODE);
      }
      expect(lines.join('\n')).not.toContain(CODE);
      expect(lines.join('\n')).not.toContain(digits);

      const { rows } = await owner.query<{ row: string }>(
        `SELECT a::text AS row FROM audit_logs a WHERE action LIKE 'auth.otp_%'`,
      );
      expect(rows.length).toBeGreaterThan(0);
      for (const { row } of rows) {
        expect(row).not.toContain(CODE);
        expect(row).not.toContain(digits);
      }
    } finally {
      await logged.close();
    }
  });
});
