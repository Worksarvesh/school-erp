import { Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext } from '../database/school-context.js';
import { RequirePermission } from './require-permission.decorator.js';
import { CurrentTenant, SchoolController } from './school-controller.decorator.js';
import type { TenantContext } from './tenant-request.js';

/** GET /v1/schools/:schoolId */
@SchoolController()
export class SchoolProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('school.read')
  get(@CurrentTenant() tenant: TenantContext) {
    return withSchoolContext(this.prisma, tenant.schoolId, (tx) =>
      tx.school.findUniqueOrThrow({
        where: { id: tenant.schoolId },
        select: { id: true, name: true, code: true, udiseCode: true, status: true },
      }),
    );
  }
}
