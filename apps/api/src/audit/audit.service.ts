import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { withSchoolContext } from '../database/school-context.js';

export type AuditAction =
  | 'auth.login_succeeded'
  | 'auth.login_failed'
  | 'auth.login_rate_limited'
  | 'auth.logout'
  | 'auth.logout_all'
  | 'auth.session_revoked'
  | 'auth.refresh_reuse_detected';

export interface AuditEntry {
  action: AuditAction;
  /** Null for global events such as logins. */
  schoolId?: string | null;
  actorUserId?: string | null;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  /** Never put personal data, identifiers typed by the user, passwords or tokens here. */
  metadata?: Record<string, string | number | boolean>;
}

/** Writes to the append-only audit_logs table (the app role can insert, never update or delete). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    const data = {
      action: entry.action,
      schoolId: entry.schoolId ?? null,
      actorUserId: entry.actorUserId ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      ip: entry.ip ?? null,
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
