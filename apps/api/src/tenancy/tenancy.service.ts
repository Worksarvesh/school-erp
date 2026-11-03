import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext } from '../database/school-context.js';
import type { PermissionKey } from './permissions.js';

export type SchoolAccess = 'allowed' | 'not_member' | 'missing_permission';

@Injectable()
export class TenancyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Does the user have an active membership in the school whose role grants `permission`? */
  checkAccess(schoolId: string, userId: string, permission: PermissionKey): Promise<SchoolAccess> {
    return withSchoolContext(this.prisma, schoolId, async (tx) => {
      const memberships = await tx.schoolMembership.findMany({
        where: { userId, status: 'active' },
        select: { role: true },
      });
      if (memberships.length === 0) {
        return 'not_member';
      }
      const grants = await tx.rolePermission.count({
        where: { role: { in: memberships.map((m) => m.role) }, permission: { key: permission } },
      });
      return grants > 0 ? 'allowed' : 'missing_permission';
    });
  }
}
