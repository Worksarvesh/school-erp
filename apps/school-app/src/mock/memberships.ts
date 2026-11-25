import type { LoginResponseDto } from '@school-erp/api-client';
import type { PermissionKey } from '@/core/permissions';

/**
 * MOCK ONLY. The real list comes from the API once it returns the caller's memberships with
 * their permission keys (see README "Open questions" Q1). Grants below are a demo, not the
 * seeded defaults.
 */
export type StaffRole =
  'principal' | 'school_admin' | 'vice_principal' | 'teacher' | 'non_teaching_staff';

export interface Membership {
  schoolId: string;
  schoolName: string;
  role: StaffRole;
  /** Display only. Non-teaching job titles are school-configured designations. */
  roleLabel: string;
  permissions: PermissionKey[];
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  principal: 'Principal',
  school_admin: 'Admin',
  vice_principal: 'Vice Principal',
  teacher: 'Teacher',
  non_teaching_staff: 'Non-teaching Staff',
};

const DEMO_GRANTS: Record<StaffRole, PermissionKey[]> = {
  principal: [
    'school.read',
    'members.read',
    'approvals.read',
    'approvals.decide',
    'academics.manage',
    'staff.read',
    'staff.manage',
    'students.read',
    'parent_links.issue',
    'attendance.correct',
    'notices.read',
    'notices.publish',
    'messages.send',
    'timetable.read',
    'exams.manage',
    'audit.read',
  ],
  school_admin: [
    'school.read',
    'members.read',
    'approvals.read',
    'academics.manage',
    'staff.read',
    'staff.manage',
    'staff.permissions.manage',
    'students.read',
    'students.manage',
    'parent_links.issue',
    'attendance.correct',
    'notices.read',
    'notices.publish',
    'messages.send',
    'timetable.read',
    'timetable.manage',
    'substitutions.manage',
    'exams.manage',
    'audit.read',
  ],
  vice_principal: [
    'school.read',
    'approvals.read',
    'approvals.decide',
    'staff.read',
    'students.read',
    'notices.read',
    'messages.send',
    'timetable.read',
    'substitutions.manage',
    'exams.manage',
    'audit.read',
  ],
  teacher: [
    'school.read',
    'students.read',
    'attendance.mark',
    'notices.read',
    'messages.send',
    'homework.manage',
    'timetable.read',
    'marks.enter',
  ],
  non_teaching_staff: ['school.read', 'notices.read'],
};

function membership(schoolId: string, schoolName: string, role: StaffRole): Membership {
  return {
    schoolId,
    schoolName,
    role,
    roleLabel: ROLE_LABELS[role],
    permissions: DEMO_GRANTS[role],
  };
}

const SCHOOL_A = { id: '01930000-0000-7000-8000-00000000000a', name: 'Green Valley Public School' };
const SCHOOL_B = { id: '01930000-0000-7000-8000-00000000000b', name: 'Sunrise Convent School' };

/**
 * Demo usernames for staff login (any password; one starting with "temp" opens the
 * change-temporary-password screen): `admin`, `vp`, `teacher`, `staff`.
 * `admin` also teaches at a second school, to demo the role switcher.
 */
export function mockMembershipsForUsername(username: string): Membership[] {
  const name = username.trim().toLowerCase();
  if (name.startsWith('admin')) {
    return [
      membership(SCHOOL_A.id, SCHOOL_A.name, 'school_admin'),
      membership(SCHOOL_B.id, SCHOOL_B.name, 'teacher'),
    ];
  }
  if (name.startsWith('vp')) return [membership(SCHOOL_A.id, SCHOOL_A.name, 'vice_principal')];
  if (name.startsWith('staff')) {
    return [membership(SCHOOL_A.id, SCHOOL_A.name, 'non_teaching_staff')];
  }
  return [membership(SCHOOL_A.id, SCHOOL_A.name, 'teacher')];
}

export function mockPrincipalMemberships(): Membership[] {
  return [membership(SCHOOL_A.id, SCHOOL_A.name, 'principal')];
}

/** Placeholder tokens passed to useAuthStore.setSession. No network. */
export function mockLoginResponse(fullName: string, memberships: Membership[]): LoginResponseDto {
  return {
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      sessionId: 'mock-session',
      expiresIn: 900,
    },
    user: {
      id: '01930000-0000-7000-8000-000000000001',
      fullName,
      roles: memberships.map((m) => m.role),
      activeSchoolId: memberships[0]?.schoolId ?? null,
    },
  };
}
