import type { PrismaClient } from '../generated/prisma/client.js';
import type { PlatformRole, Role } from '../generated/prisma/enums.js';
import { PasswordService } from '../auth/password.service.js';

/** Fixed ids so re-running the seed updates the same rows (idempotent). */
const demoId = (n: number) => `0197de00-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;

export const DEMO_SCHOOLS = [
  {
    id: demoId(1),
    name: 'Sunrise Public School (Demo)',
    code: 'sch0001',
    city: 'Pune',
    pinCode: '411001',
    status: 'active',
  },
  {
    id: demoId(2),
    name: 'Lakeview High School (Demo)',
    code: 'sch0002',
    city: 'Nagpur',
    pinCode: '440001',
    status: 'active',
  },
  // In the directory, no principal yet: a new principal can claim it.
  {
    id: demoId(3),
    name: 'Hillside Academy (Demo)',
    code: 'sch0003',
    city: 'Nashik',
    pinCode: '422001',
    status: 'unclaimed',
  },
] as const;
const [SUNRISE, LAKEVIEW] = DEMO_SCHOOLS;

interface DemoUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  roles: { schoolId: string; role: Role }[];
  platformRole?: PlatformRole;
}

// Fictional people. Phones use the +91 90000 1xxxx range, emails the reserved .test domain.
// Students and parents are users with memberships for now; student records and guardian links
// arrive in slice 4.
export const DEMO_USERS: DemoUser[] = [
  user(101, 'Anita Sharma', 'principal.sunrise', [[SUNRISE.id, 'principal']]),
  user(102, 'Rahul Verma', 'admin.sunrise', [[SUNRISE.id, 'school_admin']]),
  user(103, 'Priya Nair', 'priya.teacher', [[SUNRISE.id, 'teacher']]),
  user(104, 'Arjun Mehta', 'arjun.teacher', [[SUNRISE.id, 'teacher']]),
  user(105, 'Kavya Iyer', 'kavya.student', [[SUNRISE.id, 'student']]),
  user(106, 'Rohan Das', 'rohan.student', [[SUNRISE.id, 'student']]),
  user(107, 'Sunita Iyer', 'sunita.parent', [[SUNRISE.id, 'parent']]),
  // In two schools: parent at Sunrise, teacher at Lakeview.
  user(108, 'Vikram Das', 'vikram.parent', [
    [SUNRISE.id, 'parent'],
    [LAKEVIEW.id, 'teacher'],
  ]),
  user(201, 'Meera Pillai', 'principal.lakeview', [[LAKEVIEW.id, 'principal']]),
  user(202, 'Sanjay Gupta', 'sanjay.teacher', [[LAKEVIEW.id, 'teacher']]),
  user(203, 'Ishaan Rao', 'ishaan.student', [[LAKEVIEW.id, 'student']]),
  user(204, 'Lakshmi Rao', 'lakshmi.parent', [[LAKEVIEW.id, 'parent']]),
  // Company staff: sign in with email + password; they review principal registrations.
  { ...user(301, 'Vera Verifier (Demo)', 'verifier', []), platformRole: 'verifier' },
  { ...user(302, 'Sam Super Admin (Demo)', 'superadmin', []), platformRole: 'super_admin' },
];

/**
 * A new principal who signed in with OTP (no password) and asked for a school that is not listed.
 * Their request waits in the verifier queue.
 */
export const DEMO_APPLICANT = {
  id: demoId(401),
  fullName: 'Neha Kulkarni (Demo)',
  phone: '+919000010401',
  requestId: demoId(402),
  proposedName: 'Greenfield School (Demo)',
  proposedAddress: '7 Station Road, Kolhapur',
  proposedPinCode: '416001',
} as const;

function user(n: number, fullName: string, handle: string, roles: [string, Role][]): DemoUser {
  return {
    id: demoId(n),
    fullName,
    phone: `+9190000${String(10000 + n)}`,
    email: `${handle}@demo.school-erp.test`,
    roles: roles.map(([schoolId, role]) => ({ schoolId, role })),
  };
}

/**
 * Creates or updates the demo schools, users, passwords and memberships. Must run as the owner
 * role (it writes across schools). Safe to run any number of times.
 */
export async function seedDemoData(prisma: PrismaClient, password: string): Promise<void> {
  const passwords = new PasswordService();
  if (!passwords.isAcceptable(password)) {
    throw new Error('SEED_DEMO_PASSWORD must be 10-128 characters');
  }

  for (const { id, ...fields } of DEMO_SCHOOLS) {
    await prisma.school.upsert({ where: { id }, create: { id, ...fields }, update: fields });
  }
  // New schools (verifier approvals, directory entries) continue after the seeded codes.
  await prisma.$executeRaw`
    SELECT setval('school_code_seq', GREATEST(
      (SELECT last_value FROM school_code_seq),
      (SELECT coalesce(max(substring(code from 4)::int), 1) FROM schools WHERE code ~ '^sch[0-9]+$')))`;

  for (const u of DEMO_USERS) {
    const profile = {
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      status: 'active' as const,
    };
    await prisma.user.upsert({
      where: { id: u.id },
      create: { id: u.id, ...profile },
      update: profile,
    });

    const passwordHash = await passwords.hash(password);
    await prisma.credential.upsert({
      where: { userId: u.id },
      create: { userId: u.id, passwordHash, passwordChangedAt: new Date() },
      update: { passwordHash, passwordChangedAt: new Date() },
    });

    for (const { schoolId, role } of u.roles) {
      await prisma.schoolMembership.upsert({
        where: { userId_schoolId_role: { userId: u.id, schoolId, role } },
        create: { userId: u.id, schoolId, role, status: 'active' },
        update: { status: 'active' },
      });
    }

    if (u.platformRole) {
      await prisma.platformStaff.upsert({
        where: { userId: u.id },
        create: { userId: u.id, role: u.platformRole, status: 'active' },
        update: { role: u.platformRole, status: 'active' },
      });
    }
  }

  // OTP-only applicant: phone verified, no password, one pending "not listed" request.
  const a = DEMO_APPLICANT;
  const applicant = { fullName: a.fullName, phone: a.phone, phoneVerifiedAt: new Date() };
  await prisma.user.upsert({
    where: { id: a.id },
    create: { id: a.id, ...applicant },
    update: applicant,
  });
  const request = {
    principalUserId: a.id,
    principalName: a.fullName,
    proposedName: a.proposedName,
    proposedAddress: a.proposedAddress,
    proposedPinCode: a.proposedPinCode,
  };
  await prisma.schoolVerificationRequest.upsert({
    where: { id: a.requestId },
    create: { id: a.requestId, ...request },
    // Leaves a request that a tester already decided alone.
    update: {},
  });
}
