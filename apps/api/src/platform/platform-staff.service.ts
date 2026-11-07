import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withUserContext } from '../database/school-context.js';
import type { PlatformRole } from '../generated/prisma/enums.js';

/** The platform module owns `platform_staff` (Company Super Admin, School Verifier). */
@Injectable()
export class PlatformStaffService {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's platform role, or null if they are not active platform staff (own row via RLS). */
  async findActiveRole(userId: string): Promise<PlatformRole | null> {
    const row = await withUserContext(this.prisma, userId, (tx) =>
      tx.platformStaff.findUnique({ where: { userId }, select: { role: true, status: true } }),
    );
    return row?.status === 'active' ? row.role : null;
  }
}
