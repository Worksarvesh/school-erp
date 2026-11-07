/**
 * pnpm --filter api run seed
 * Loads demo schools and users into the local database. Runs as the owner role
 * (MIGRATION_DATABASE_URL). Refuses to run when APP_ENV=production.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { DEMO_APPLICANT, DEMO_SCHOOLS, DEMO_USERS, seedDemoData } from './demo-data.js';

async function main(): Promise<void> {
  if (process.env.APP_ENV === 'production') {
    throw new Error('Refusing to seed demo data when APP_ENV=production');
  }
  const url = process.env.MIGRATION_DATABASE_URL;
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!url || !password) {
    throw new Error('Set MIGRATION_DATABASE_URL and SEED_DEMO_PASSWORD in .env (see .env.example)');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    await seedDemoData(prisma, password);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`Seeded ${DEMO_SCHOOLS.length} schools and ${DEMO_USERS.length + 1} users.`);
  for (const school of DEMO_SCHOOLS) {
    console.log(`  ${school.code}  ${school.name} (${school.status})  id=${school.id}`);
  }
  console.log('Sign in with any of these (password = SEED_DEMO_PASSWORD):');
  for (const u of DEMO_USERS) {
    const roles = u.platformRole ?? u.roles.map((r) => r.role).join(', ');
    console.log(`  ${u.email.padEnd(40)} ${u.phone}  ${u.fullName} (${roles})`);
  }
  console.log(
    'Principals also sign in by OTP: POST /v1/auth/otp/request, then /v1/auth/otp/verify with the ' +
      'fixed local code (OTP_FIXED_CODE, default 999999).',
  );
  console.log(
    `Pending verification: ${DEMO_APPLICANT.fullName} (${DEMO_APPLICANT.phone}, OTP only) asked ` +
      `for "${DEMO_APPLICANT.proposedName}".`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
