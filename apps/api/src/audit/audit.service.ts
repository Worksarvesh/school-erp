import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext } from '../database/school-context.js';
import type { AuditCategory, AuditModule } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';

export type AuditAction =
  | 'auth.login_succeeded'
  | 'auth.login_failed'
  | 'auth.login_rate_limited'
  | 'auth.logout'
  | 'auth.logout_all'
  | 'auth.session_revoked'
  | 'auth.refresh_reuse_detected'
  | 'auth.otp_requested'
  | 'auth.otp_rate_limited'
  | 'auth.otp_verified'
  | 'auth.otp_failed'
  | 'auth.otp_locked'
  | 'verification.submitted'
  | 'verification.approved'
  | 'verification.rejected'
  | 'directory.school_added'
  | 'platform.request';

/** A value safe to keep in audit metadata: never personal data, typed identifiers, codes or tokens. */
type Scalar = string | number | boolean;

export interface AuditEntry {
  action: AuditAction;
  /** Null for global events such as logins. */
  schoolId?: string | null;
  actorUserId?: string | null;
  /** A school role or a platform role. */
  actorRole?: string | null;
  module?: AuditModule;
  category?: AuditCategory;
  targetType?: string;
  targetId?: string;
  /** Record values before/after a change. Callers pass only the changed, non-secret fields. */
  oldValue?: Record<string, Scalar | null>;
  newValue?: Record<string, Scalar | null>;
  reason?: string;
  ip?: string | null;
  sessionId?: string | null;
  /** Never put personal data, identifiers typed by the user, passwords, codes or tokens here. */
  metadata?: Record<string, Scalar>;
}

/** Writes to the append-only audit_logs table (the app role can insert, never update or delete). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    const data: Prisma.AuditLogCreateManyInput = {
      action: entry.action,
      schoolId: entry.schoolId ?? null,
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole ?? null,
      module: entry.module ?? moduleOf(entry.action),
      category: entry.category ?? 'general',
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      reason: entry.reason ?? null,
      ip: entry.ip ?? null,
      sessionId: entry.sessionId ?? null,
      metadata: entry.metadata ?? {},
    };
    // createMany: an INSERT without RETURNING, since RLS hides global rows from reads.
    if (data.schoolId) {
      await withSchoolContext(this.prisma, data.schoolId, (tx) =>
        tx.auditLog.createMany({ data: [data] }),
      );
    } else {
      await this.prisma.auditLog.createMany({ data: [data] });
    }
  }
}

function moduleOf(action: AuditAction): AuditModule {
  const prefix = action.split('.')[0];
  return prefix === 'auth' ? 'auth' : prefix === 'directory' ? 'tenancy' : 'platform';
}
