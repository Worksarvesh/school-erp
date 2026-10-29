/**
 * Roles from the product requirements. The backend is the source of truth for
 * authorization; these constants only keep client and server vocabulary aligned.
 */
export const ROLES = [
  'principal',
  'school_admin',
  'vice_principal',
  'teacher',
  'non_teaching_staff',
  'office_clerk',
  'accountant',
  'student',
  'parent',
  'other_staff',
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
