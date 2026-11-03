import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from './permissions.js';

export const REQUIRED_PERMISSION = 'requiredPermission';

/** The permission a school route needs. Required on every route of a @SchoolController. */
export const RequirePermission = (permission: PermissionKey) =>
  SetMetadata(REQUIRED_PERMISSION, permission);
