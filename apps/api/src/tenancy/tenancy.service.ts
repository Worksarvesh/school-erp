import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext, withUserContext } from '../database/school-context.js';
import type { Role } from '../generated/prisma/enums.js';
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

  /** Schools where the user has an active membership, with their roles there (for GET /v1/me). */
  async listMySchools(userId: string): Promise<MySchool[]> {
    const memberships = await withUserContext(this.prisma, userId, (tx) =>
      tx.schoolMembership.findMany({
        where: { userId, status: 'active' },
        orderBy: [{ schoolId: 'asc' }, { role: 'asc' }],
        select: { role: true, school: { select: { id: true, name: true, code: true } } },
      }),
    );
    const bySchool = new Map<string, MySchool>();
    for (const { role, school } of memberships) {
      const entry = bySchool.get(school.id) ?? {
        schoolId: school.id,
        name: school.name,
        code: school.code,
        roles: [],
      };
      entry.roles.push(role);
      bySchool.set(school.id, entry);
    }
    return [...bySchool.values()];
  }
}

export interface MySchool {
  schoolId: string;
  name: string;
  code: string;
  roles: Role[];
}
