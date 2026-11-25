/**
 * Permission keys the School App uses to decide what to SHOW. This is UX only: the API is the
 * only authorization (it returns 403 without the key). Never hide a check in the app and skip it
 * in the API.
 *
 * LIVE keys exist today in `apps/api/src/tenancy/permissions.ts`.
 * PLANNED keys are placeholders for later slices. When a slice adds the real key to the API,
 * rename it here to match exactly (one file, one place). Do not invent keys in screens.
 *
 * Rule from CLAUDE.md: decide by permission, never by role name. Roles are only a label.
 */
export const LIVE_PERMISSIONS = ['school.read', 'members.read'] as const;

export const PLANNED_PERMISSIONS = [
  // Slice 3: school setup
  'academics.manage', // academic years, classes, sections, subjects
  'staff.read',
  'staff.manage',
  'staff.permissions.manage', // per-member permission grants
  'approvals.read',
  'approvals.decide',
  // Slice 4: students
  'students.read',
  'students.manage',
  'parent_links.issue',
  // Slice 5: attendance, notices, messaging
  'attendance.mark',
  'attendance.correct',
  'notices.read',
  'notices.publish',
  'messages.send',
  // Slice 6
  'homework.manage',
  // Slice 7
  'timetable.read',
  'timetable.manage',
  'substitutions.manage',
  'exams.manage',
  'marks.enter',
  // Slice 8
  'audit.read',
] as const;

export type PermissionKey =
  (typeof LIVE_PERMISSIONS)[number] | (typeof PLANNED_PERMISSIONS)[number];
