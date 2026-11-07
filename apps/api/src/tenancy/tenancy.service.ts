import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors.js';
import { isUuid } from '../common/uuid.js';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext, withUserContext } from '../database/school-context.js';
import type { Prisma } from '../generated/prisma/client.js';
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

  /**
   * School directory for signed-in principals who are not members yet: name or PIN search through
   * the directory_search_schools() SECURITY DEFINER function (public fields only, no suspended
   * schools). Keyset pagination on (name, id).
   */
  async searchDirectory(query: string, limit: number, after?: { name: string; id: string }) {
    // The function matches with ILIKE: escape the wildcards so the query is taken literally.
    const pattern = query.replace(/[\\%_]/g, (c) => `\\${c}`);
    const rows = await this.prisma.$queryRaw<DirectorySchool[]>`
      SELECT id, name, code, city, pin_code AS "pinCode"
      FROM directory_search_schools(${pattern}, ${after?.name ?? null}, ${after?.id ?? null}::uuid,
        ${limit + 1}::integer)`;
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page,
      nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
    };
  }

  /**
   * Called by the platform module inside its platform-context transaction when a verifier
   * approves a principal: activates (or, for an unlisted school, creates) the school and adds the
   * active principal membership. Returns the school id.
   */
  async activateSchoolWithPrincipal(
    tx: Prisma.TransactionClient,
    input: ActivateSchoolInput,
  ): Promise<string> {
    let schoolId: string;
    if (input.schoolId !== undefined) {
      schoolId = input.schoolId;
      const principals = await tx.schoolMembership.count({
        where: { schoolId, role: 'principal', status: 'active' },
      });
      if (principals > 0) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          'school_has_principal',
          'This school already has an active principal',
        );
      }
      await tx.school.update({
        where: { id: schoolId },
        data: { status: 'active', updatedBy: input.approvedBy },
        select: { id: true },
      });
    } else {
      const school = await tx.school.create({
        data: {
          name: input.newSchool.name,
          code: await nextSchoolCode(tx),
          addressLine: input.newSchool.addressLine,
          pinCode: input.newSchool.pinCode,
          status: 'active',
          createdBy: input.approvedBy,
        },
        select: { id: true },
      });
      schoolId = school.id;
    }
    await tx.schoolMembership.create({
      data: {
        schoolId,
        userId: input.principalUserId,
        role: 'principal',
        status: 'active',
        createdBy: input.approvedBy,
      },
      select: { id: true },
    });
    return schoolId;
  }

  /** Platform: add a school to the directory before any principal claims it. */
  async addDirectorySchool(
    tx: Prisma.TransactionClient,
    input: {
      name: string;
      city?: string;
      pinCode?: string;
      addressLine?: string;
      createdBy: string;
    },
  ) {
    return tx.school.create({
      data: {
        name: input.name,
        code: await nextSchoolCode(tx),
        city: input.city ?? null,
        pinCode: input.pinCode ?? null,
        addressLine: input.addressLine ?? null,
        status: 'unclaimed',
        createdBy: input.createdBy,
      },
      select: { id: true, name: true, code: true, city: true, pinCode: true, status: true },
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

export interface DirectorySchool {
  id: string;
  name: string;
  code: string;
  city: string | null;
  pinCode: string | null;
}

export type ActivateSchoolInput = { principalUserId: string; approvedBy: string } & (
  | { schoolId: string; newSchool?: undefined }
  | { schoolId?: undefined; newSchool: { name: string; addressLine: string; pinCode: string } }
);

/** sch0001, sch0002, ... from school_code_seq. */
async function nextSchoolCode(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<{ code: string }[]>`SELECT next_school_code() AS code`;
  return rows[0]!.code;
}

/** Opaque directory cursor: the last row's (name, id). */
function encodeCursor(row: { name: string; id: string }): string {
  return Buffer.from(JSON.stringify([row.name, row.id])).toString('base64url');
}

export function decodeDirectoryCursor(cursor: string): { name: string; id: string } | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      Array.isArray(value) &&
      value.length === 2 &&
      typeof value[0] === 'string' &&
      isUuid(value[1])
    ) {
      return { name: value[0], id: value[1] };
    }
  } catch {
    // fall through
  }
  return null;
}

export interface MySchool {
  schoolId: string;
  name: string;
  code: string;
  roles: Role[];
}
