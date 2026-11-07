import {
  applyDecorators,
  type CanActivate,
  Controller,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service.js';
import { metaOf } from '../auth/auth.controller.js';
import { IdentityResolver } from '../auth/identity.js';
import type { PlatformRole } from '../generated/prisma/enums.js';
import { PlatformStaffService } from './platform-staff.service.js';

export interface PlatformStaffContext {
  userId: string;
  sessionId: string;
  role: PlatformRole;
}

type PlatformRequest = Request & { platform?: PlatformStaffContext };

const REQUIRED_PLATFORM_ROLE = 'requiredPlatformRole';

/** The platform role a route needs. Super Admin satisfies every role. Defaults to verifier. */
export const RequirePlatformRole = (role: PlatformRole) =>
  SetMetadata(REQUIRED_PLATFORM_ROLE, role);

/**
 * Company staff routes (/v1/platform/...): 401 signed out, 403 for anyone who is not active
 * platform staff with the required role. Every request, allowed or denied, writes an audit row.
 */
@Injectable()
export class PlatformGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identity: IdentityResolver,
    private readonly staff: PlatformStaffService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const identity = await this.identity.resolve(request);
    if (!identity) {
      throw new UnauthorizedException();
    }

    const required =
      this.reflector.getAllAndOverride<PlatformRole | undefined>(REQUIRED_PLATFORM_ROLE, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'verifier';
    const role = await this.staff.findActiveRole(identity.userId);
    const allowed = role === 'super_admin' || (role !== null && role === required);

    await this.audit.record({
      action: 'platform.request',
      actorUserId: identity.userId,
      actorRole: role,
      category: 'security',
      sessionId: identity.sessionId,
      ip: metaOf(request).ip,
      metadata: { route: `${request.method} ${request.route?.path ?? ''}`, allowed },
    });
    if (!allowed || !role) {
      throw new ForbiddenException();
    }

    request.platform = { userId: identity.userId, sessionId: identity.sessionId, role };
    return true;
  }
}

/** Use instead of @Controller() for company staff routes: mounts under /v1/platform/<path>. */
export const PlatformController = (path: string) =>
  applyDecorators(Controller(`platform/${path}`), UseGuards(PlatformGuard));

/** The platform staff member checked by PlatformGuard. */
export const CurrentPlatformStaff = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PlatformStaffContext => {
    const staff = context.switchToHttp().getRequest<PlatformRequest>().platform;
    if (!staff) {
      throw new Error('CurrentPlatformStaff used outside a @PlatformController route');
    }
    return staff;
  },
);
