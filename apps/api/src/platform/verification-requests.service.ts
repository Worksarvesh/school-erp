import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { ApiException } from '../common/errors.js';
import { PrismaService } from '../database/prisma.service.js';
import { withPlatformContext, withUserContext } from '../database/school-context.js';
import { Prisma } from '../generated/prisma/client.js';
import type { VerificationStatus } from '../generated/prisma/enums.js';
import { TenancyService } from '../tenancy/tenancy.service.js';
import { UsersService } from '../users/users.service.js';
import type { PlatformStaffContext } from './platform.guard.js';
import type { SubmitVerificationRequestDto } from './verification.dto.js';

/** What the principal sees about their own requests. */
const OWN_FIELDS = {
  id: true,
  schoolId: true,
  principalName: true,
  proposedName: true,
  proposedAddress: true,
  proposedPinCode: true,
  status: true,
  decidedAt: true,
  decisionReason: true,
  previousRequestId: true,
  submittedAt: true,
  school: { select: { name: true, code: true } },
} satisfies Prisma.SchoolVerificationRequestSelect;

const alreadyDecided = () =>
  new ApiException(HttpStatus.CONFLICT, 'already_decided', 'This request has already been decided');

/**
 * The platform module owns `school_verification_requests`: a principal claims a school (or
 * describes one that is not listed) and a School Verifier approves or rejects it. Approval asks
 * the tenancy module to activate the school and add the principal, in the same transaction.
 */
@Injectable()
export class VerificationRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  async submit(userId: string, dto: SubmitVerificationRequestDto, ip: string | null) {
    const listed = dto.schoolId !== undefined;
    const unlisted = [dto.proposedName, dto.proposedAddress, dto.proposedPinCode];
    if (listed ? unlisted.some((v) => v !== undefined) : unlisted.some((v) => v === undefined)) {
      throw new BadRequestException(
        'Send either schoolId, or proposedName, proposedAddress and proposedPinCode',
      );
    }

    const created = await withUserContext(this.prisma, userId, async (tx) => {
      if (dto.previousRequestId) {
        const previous = await tx.schoolVerificationRequest.findUnique({
          where: { id: dto.previousRequestId },
          select: { status: true, nextRequest: { select: { id: true } } },
        });
        // RLS shows only the caller's own requests, so someone else's id looks missing.
        if (!previous || previous.status !== 'rejected' || previous.nextRequest) {
          throw new BadRequestException('previousRequestId must be your own rejected request');
        }
      }
      try {
        return await tx.schoolVerificationRequest.create({
          data: {
            principalUserId: userId,
            principalName: dto.principalName.trim(),
            schoolId: dto.schoolId ?? null,
            proposedName: dto.proposedName?.trim() ?? null,
            proposedAddress: dto.proposedAddress?.trim() ?? null,
            proposedPinCode: dto.proposedPinCode ?? null,
            previousRequestId: dto.previousRequestId ?? null,
          },
          select: OWN_FIELDS,
        });
      } catch (error) {
        throw mapSubmitError(error);
      }
    });

    await this.users.setOwnName(userId, dto.principalName.trim());
    await this.audit.record({
      action: 'verification.submitted',
      actorUserId: userId,
      targetType: 'school_verification_request',
      targetId: created.id,
      ip,
      metadata: { listed },
    });
    return created;
  }

  listOwn(userId: string) {
    return withUserContext(this.prisma, userId, async (tx) => ({
      items: await tx.schoolVerificationRequest.findMany({
        where: { principalUserId: userId },
        orderBy: { id: 'desc' },
        select: OWN_FIELDS,
      }),
    }));
  }

  async listForPlatform(
    staff: PlatformStaffContext,
    status: VerificationStatus,
    limit: number,
    cursor?: string,
  ) {
    // UUIDv7 ids are time-ordered: oldest first, so the queue is worked in arrival order.
    const rows = await withPlatformContext(this.prisma, staff.userId, staff.role, (tx) =>
      tx.schoolVerificationRequest.findMany({
        where: { status, ...(cursor && { id: { gt: cursor } }) },
        orderBy: { id: 'asc' },
        take: limit + 1,
        select: { ...OWN_FIELDS, principal: { select: { fullName: true, phone: true } } },
      }),
    );
    const page = rows.slice(0, limit);
    return {
      items: page,
      nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async getForPlatform(staff: PlatformStaffContext, id: string) {
    const row = await withPlatformContext(this.prisma, staff.userId, staff.role, (tx) =>
      tx.schoolVerificationRequest.findUnique({
        where: { id },
        select: {
          ...OWN_FIELDS,
          decidedByUserId: true,
          principal: { select: { fullName: true, phone: true } },
        },
      }),
    );
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  async approve(staff: PlatformStaffContext, id: string, ip: string | null) {
    const schoolId = await withPlatformContext(
      this.prisma,
      staff.userId,
      staff.role,
      async (tx) => {
        const request = await tx.schoolVerificationRequest.findUnique({
          where: { id },
          select: {
            status: true,
            principalUserId: true,
            schoolId: true,
            proposedName: true,
            proposedAddress: true,
            proposedPinCode: true,
          },
        });
        if (!request) {
          throw new NotFoundException();
        }
        if (request.status !== 'pending') {
          throw alreadyDecided();
        }

        const common = { principalUserId: request.principalUserId, approvedBy: staff.userId };
        const activated = await this.tenancy.activateSchoolWithPrincipal(
          tx,
          request.schoolId
            ? { ...common, schoolId: request.schoolId }
            : {
                ...common,
                newSchool: {
                  name: request.proposedName!,
                  addressLine: request.proposedAddress!,
                  pinCode: request.proposedPinCode!,
                },
              },
        );
        // Conditional: of two verifiers deciding at once, only one wins.
        const { count } = await tx.schoolVerificationRequest.updateMany({
          where: { id, status: 'pending' },
          data: {
            status: 'approved',
            schoolId: activated,
            decidedByUserId: staff.userId,
            decidedAt: new Date(),
          },
        });
        if (count === 0) {
          throw alreadyDecided();
        }
        return activated;
      },
    );

    await this.audit.record({
      action: 'verification.approved',
      schoolId,
      actorUserId: staff.userId,
      actorRole: staff.role,
      targetType: 'school_verification_request',
      targetId: id,
      newValue: { status: 'approved', schoolId },
      sessionId: staff.sessionId,
      ip,
    });
    return { id, status: 'approved' as const, schoolId };
  }

  async reject(staff: PlatformStaffContext, id: string, reason: string, ip: string | null) {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('reason is required');
    }
    await withPlatformContext(this.prisma, staff.userId, staff.role, async (tx) => {
      const { count } = await tx.schoolVerificationRequest.updateMany({
        where: { id, status: 'pending' },
        data: {
          status: 'rejected',
          decisionReason: trimmed,
          decidedByUserId: staff.userId,
          decidedAt: new Date(),
        },
      });
      if (count === 0) {
        const exists = await tx.schoolVerificationRequest.count({ where: { id } });
        throw exists ? alreadyDecided() : new NotFoundException();
      }
    });

    await this.audit.record({
      action: 'verification.rejected',
      actorUserId: staff.userId,
      actorRole: staff.role,
      targetType: 'school_verification_request',
      targetId: id,
      newValue: { status: 'rejected' },
      reason: trimmed,
      sessionId: staff.sessionId,
      ip,
    });
    return { id, status: 'rejected' as const };
  }
}

function mapSubmitError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new ApiException(
        HttpStatus.CONFLICT,
        'request_pending',
        'You already have a request waiting for verification',
      );
    }
    if (error.code === 'P2003') {
      return new BadRequestException('Unknown school');
    }
  }
  return error;
}
