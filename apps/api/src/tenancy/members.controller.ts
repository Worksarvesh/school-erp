import { Get, Query } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext } from '../database/school-context.js';
import { UsersService } from '../users/users.service.js';
import { ListMembersQuery } from './list-members.query.js';
import { RequirePermission } from './require-permission.decorator.js';
import { CurrentTenant, SchoolController } from './school-controller.decorator.js';
import type { TenantContext } from './tenant-request.js';

/** GET /v1/schools/:schoolId/members */
@SchoolController('members')
export class MembersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  @Get()
  @RequirePermission('members.read')
  async list(@CurrentTenant() tenant: TenantContext, @Query() query: ListMembersQuery) {
    // UUIDv7 ids are time-ordered, so ordering by id is a stable cursor.
    const rows = await withSchoolContext(this.prisma, tenant.schoolId, (tx) =>
      tx.schoolMembership.findMany({
        where: {
          schoolId: tenant.schoolId,
          role: query.role,
          status: query.status,
          ...(query.cursor && { id: { gt: query.cursor } }),
        },
        orderBy: { id: 'asc' },
        take: query.limit + 1,
        select: { id: true, userId: true, role: true, status: true, createdAt: true },
      }),
    );

    const page = rows.slice(0, query.limit);
    const names = await this.users.findNames(
      tenant.schoolId,
      page.map((m) => m.userId),
    );
    return {
      items: page.map((m) => ({ ...m, fullName: names.get(m.userId) ?? null })),
      nextCursor: rows.length > query.limit ? (page.at(-1)?.id ?? null) : null,
    };
  }
}
