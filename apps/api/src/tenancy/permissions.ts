/**
 * Permission keys the API checks. Rows in `permissions` / `role_permissions` grant them to roles;
 * guards only ever check these keys, never role names.
 */
export const PERMISSIONS = ['school.read', 'members.read'] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];
