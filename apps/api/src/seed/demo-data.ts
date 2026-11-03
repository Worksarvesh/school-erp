import type { PrismaClient } from '../generated/prisma/client.js';
import type { Role } from '../generated/prisma/enums.js';
import { PasswordService } from '../auth/password.service.js';

/** Fixed ids so re-running the seed updates the same rows (idempotent). */
const demoId = (n: number) => `0197de00-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;

export const DEMO_SCHOOLS = [
  { id: demoId(1), name: 'Sunrise Public School (Demo)', code: 'DEMO-SUNRISE' },
  { id: demoId(2), name: 'Lakeview High School (Demo)', code: 'DEMO-LAKEVIEW' },
] as const;
const [SUNRISE, LAKEVIEW] = DEMO_SCHOOLS;

interface DemoUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  roles: { schoolId: string; role: Role }[];
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
];

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

  for (const school of DEMO_SCHOOLS) {
    await prisma.school.upsert({
      where: { id: school.id },
      create: school,
      update: { name: school.name, code: school.code },
    });
  }

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
  }
}
