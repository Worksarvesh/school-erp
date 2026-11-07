import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service.js';
import { metaOf } from '../auth/auth.controller.js';
import { AuthenticatedGuard, CurrentIdentity } from '../auth/authenticated.guard.js';
import type { Identity } from '../auth/identity.js';
import { PrismaService } from '../database/prisma.service.js';
import { withPlatformContext } from '../database/school-context.js';
import { TenancyService } from '../tenancy/tenancy.service.js';
import {
  CurrentPlatformStaff,
  PlatformController,
  type PlatformStaffContext,
} from './platform.guard.js';
import {
  AddDirectorySchoolDto,
  ListVerificationRequestsQuery,
  RejectVerificationRequestDto,
  SubmitVerificationRequestDto,
} from './verification.dto.js';
import { VerificationRequestsService } from './verification-requests.service.js';

/** /v1/me/school-verification-requests: a signed-in principal's own claims. */
@ApiTags('me')
@ApiBearerAuth()
@Controller('me/school-verification-requests')
@UseGuards(AuthenticatedGuard)
export class MyVerificationRequestsController {
  constructor(private readonly requests: VerificationRequestsService) {}

  @Post()
  submit(
    @CurrentIdentity() identity: Identity,
    @Body() body: SubmitVerificationRequestDto,
    @Req() request: Request,
  ) {
    return this.requests.submit(identity.userId, body, metaOf(request).ip);
  }

  @Get()
  list(@CurrentIdentity() identity: Identity) {
    return this.requests.listOwn(identity.userId);
  }
}

/** /v1/platform/school-verification-requests: the School Verifier's queue. */
@ApiTags('platform')
@ApiBearerAuth()
@PlatformController('school-verification-requests')
export class PlatformVerificationRequestsController {
  constructor(private readonly requests: VerificationRequestsService) {}

  @Get()
  list(
    @CurrentPlatformStaff() staff: PlatformStaffContext,
    @Query() query: ListVerificationRequestsQuery,
  ) {
    return this.requests.listForPlatform(staff, query.status, query.limit, query.cursor);
  }

  @Get(':requestId')
  get(
    @CurrentPlatformStaff() staff: PlatformStaffContext,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.requests.getForPlatform(staff, requestId);
  }

  @Post(':requestId/approve')
  @HttpCode(200)
  approve(
    @CurrentPlatformStaff() staff: PlatformStaffContext,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Req() request: Request,
  ) {
    return this.requests.approve(staff, requestId, metaOf(request).ip);
  }

  @Post(':requestId/reject')
  @HttpCode(200)
  reject(
    @CurrentPlatformStaff() staff: PlatformStaffContext,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() body: RejectVerificationRequestDto,
    @Req() request: Request,
  ) {
    return this.requests.reject(staff, requestId, body.reason, metaOf(request).ip);
  }
}

/** /v1/platform/schools: add directory entries before any principal claims them. */
@ApiTags('platform')
@ApiBearerAuth()
@PlatformController('schools')
export class PlatformSchoolsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async add(
    @CurrentPlatformStaff() staff: PlatformStaffContext,
    @Body() body: AddDirectorySchoolDto,
    @Req() request: Request,
  ) {
    const school = await withPlatformContext(this.prisma, staff.userId, staff.role, (tx) =>
      this.tenancy.addDirectorySchool(tx, { ...body, createdBy: staff.userId }),
    );
    await this.audit.record({
      action: 'directory.school_added',
      actorUserId: staff.userId,
      actorRole: staff.role,
      targetType: 'school',
      targetId: school.id,
      sessionId: staff.sessionId,
      ip: metaOf(request).ip,
    });
    return school;
  }
}
