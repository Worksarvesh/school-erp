import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdentityResolver } from '../auth/identity.js';
import { isUuid } from '../common/uuid.js';
import type { PermissionKey } from './permissions.js';
import { REQUIRED_PERMISSION } from './require-permission.decorator.js';
import type { TenantRequest } from './tenant-request.js';
import { TenancyService } from './tenancy.service.js';

/**
 * Layer 1 of tenant isolation, on every /v1/schools/:schoolId/... route:
 * - 401 if nobody is signed in
 * - 400 if the body carries a school id (it only ever comes from the URL)
 * - 404 if the caller has no active membership in that school (never reveal that it exists)
 * - 403 if the membership's roles lack the route's permission
 */
@Injectable()
export class SchoolAccessGuard implements CanActivate {
  private readonly logger = new Logger(SchoolAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly identity: IdentityResolver,
    private readonly tenancy: TenancyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const permission = this.reflector.getAllAndOverride<PermissionKey | undefined>(
      REQUIRED_PERMISSION,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) {
      // Fail closed: every school route must declare its permission with @RequirePermission().
      this.logger.error(`No @RequirePermission() on ${request.method} ${request.route?.path}`);
      throw new ForbiddenException();
    }

    const identity = await this.identity.resolve(request);
    if (!identity) {
      throw new UnauthorizedException();
    }

    if (hasSchoolIdInBody(request.body)) {
      throw new BadRequestException('school id comes from the URL, not the request body');
    }

    const schoolId = request.params.schoolId;
    if (!isUuid(schoolId)) {
      throw new NotFoundException();
    }

    const access = await this.tenancy.checkAccess(schoolId, identity.userId, permission);
    if (access === 'not_member') {
      throw new NotFoundException();
    }
    if (access === 'missing_permission') {
      throw new ForbiddenException();
    }

    request.tenant = { schoolId, userId: identity.userId };
    return true;
  }
}

function hasSchoolIdInBody(body: unknown): boolean {
  return typeof body === 'object' && body !== null && ('schoolId' in body || 'school_id' in body);
}
