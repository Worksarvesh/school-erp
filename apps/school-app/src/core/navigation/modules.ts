import type { PermissionKey } from '@/core/permissions';

/**
 * One registry for every School App module. Home tiles, the Academics and People tabs read from
 * here, filtered by the active membership's permissions. To add a module: add one entry, add its
 * route file under `app/`, and build its screens in `src/features/<feature>/`.
 */
export type ModuleGroup = 'operations' | 'academics' | 'people' | 'communication' | 'admin';

export type ModuleIcon =
  | 'approvals'
  | 'calendar'
  | 'classes'
  | 'staff'
  | 'students'
  | 'attendance'
  | 'notices'
  | 'messages'
  | 'homework'
  | 'timetable'
  | 'exams'
  | 'marks'
  | 'audit'
  | 'link';

export interface AppModule {
  id: string;
  title: string;
  icon: ModuleIcon;
  group: ModuleGroup;
  /** Shown when the member holds ANY of these keys. */
  permissions: readonly PermissionKey[];
  /** Backend slice that delivers the API (CLAUDE.md "Slices"). */
  slice: 3 | 4 | 5 | 6 | 7 | 8;
  /** `ready` opens `route`; `coming_soon` opens the placeholder screen. */
  status: 'ready' | 'coming_soon';
  route?: string;
}

export const MODULES: readonly AppModule[] = [
  {
    id: 'approvals',
    title: 'Approvals',
    icon: 'approvals',
    group: 'operations',
    permissions: ['approvals.read'],
    slice: 3,
    status: 'coming_soon',
  },
  {
    id: 'academic-setup',
    title: 'Academic Setup',
    icon: 'calendar',
    group: 'academics',
    permissions: ['academics.manage'],
    slice: 3,
    status: 'coming_soon',
  },
  {
    id: 'staff',
    title: 'Staff',
    icon: 'staff',
    group: 'people',
    permissions: ['staff.read', 'staff.manage'],
    slice: 3,
    status: 'coming_soon',
  },
  {
    id: 'students',
    title: 'Students',
    icon: 'students',
    group: 'people',
    permissions: ['students.read', 'students.manage'],
    slice: 4,
    status: 'coming_soon',
  },
  {
    id: 'parent-links',
    title: 'Parent Link Codes',
    icon: 'link',
    group: 'people',
    permissions: ['parent_links.issue'],
    slice: 4,
    status: 'coming_soon',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: 'attendance',
    group: 'operations',
    permissions: ['attendance.mark', 'attendance.correct'],
    slice: 5,
    status: 'coming_soon',
  },
  {
    id: 'notices',
    title: 'Notices',
    icon: 'notices',
    group: 'communication',
    permissions: ['notices.read', 'notices.publish'],
    slice: 5,
    status: 'coming_soon',
  },
  {
    id: 'student-messages',
    title: 'Message Students',
    icon: 'messages',
    group: 'communication',
    permissions: ['messages.send'],
    slice: 5,
    status: 'coming_soon',
  },
  {
    id: 'homework',
    title: 'Homework',
    icon: 'homework',
    group: 'academics',
    permissions: ['homework.manage'],
    slice: 6,
    status: 'coming_soon',
  },
  {
    id: 'timetable',
    title: 'Timetable',
    icon: 'timetable',
    group: 'academics',
    permissions: ['timetable.read', 'timetable.manage'],
    slice: 7,
    status: 'coming_soon',
  },
  {
    id: 'substitutions',
    title: 'Substitutions',
    icon: 'timetable',
    group: 'operations',
    permissions: ['substitutions.manage'],
    slice: 7,
    status: 'coming_soon',
  },
  {
    id: 'exams',
    title: 'Exams',
    icon: 'exams',
    group: 'academics',
    permissions: ['exams.manage'],
    slice: 7,
    status: 'coming_soon',
  },
  {
    id: 'marks',
    title: 'Marks Entry',
    icon: 'marks',
    group: 'academics',
    permissions: ['marks.enter'],
    slice: 7,
    status: 'coming_soon',
  },
  {
    id: 'audit',
    title: 'Audit Logs',
    icon: 'audit',
    group: 'admin',
    permissions: ['audit.read'],
    slice: 8,
    status: 'coming_soon',
  },
];

/** Modules the member may see, optionally limited to some groups. */
export function visibleModules(
  granted: readonly string[],
  groups?: readonly ModuleGroup[],
): AppModule[] {
  return MODULES.filter(
    (m) =>
      (!groups || groups.includes(m.group)) && m.permissions.some((key) => granted.includes(key)),
  );
}
