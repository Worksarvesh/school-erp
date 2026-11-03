import {
  applyDecorators,
  Controller,
  createParamDecorator,
  type ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { SchoolAccessGuard } from './school-access.guard.js';
import type { TenantContext, TenantRequest } from './tenant-request.js';

/**
 * Use instead of @Controller() for tenant routes: mounts under /v1/schools/:schoolId/<path>
 * and always applies SchoolAccessGuard.
 */
export const SchoolController = (path = '') =>
  applyDecorators(
    Controller(path ? `schools/:schoolId/${path}` : 'schools/:schoolId'),
    UseGuards(SchoolAccessGuard),
  );

/** The checked school and user for this request. Pass `schoolId` to withSchoolContext(). */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const tenant = context.switchToHttp().getRequest<TenantRequest>().tenant;
    if (!tenant) {
      throw new Error('CurrentTenant used outside a @SchoolController route');
    }
    return tenant;
  },
);
