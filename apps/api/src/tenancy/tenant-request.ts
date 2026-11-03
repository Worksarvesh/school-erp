import type { Request } from 'express';

/** Set by SchoolAccessGuard once the caller's membership and permission are checked. */
export interface TenantContext {
  schoolId: string;
  userId: string;
}

export type TenantRequest = Request<{ schoolId?: string }> & { tenant?: TenantContext };
