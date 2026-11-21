/**
 * MOCK DATA ONLY. No API exists yet; these values stand in for the student and linked-child
 * records the backend will provide. Every screen that shows student data reads it from here.
 */

export type Gender = 'Male' | 'Female' | 'Other';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

/**
 * Mock switches for demoing edge cases. Change a value and reload the app.
 * - parentMobileMissing: the school has no parent mobile on record, so the profile-completion
 *   screen lets the student enter one, marked "Pending confirmation by school".
 */
export const MOCK_FLAGS: { parentMobileMissing: boolean } = {
  parentMobileMissing: false,
};

/** Parent login: this (valid-format) number has no account, so login shows "No account found". */
export const MOCK_UNREGISTERED_PARENT_MOBILE = '9000000000';

const REGISTERED_PARENT_MOBILE = '9876543210';
const PARENT_NAME = 'Mr. Suresh Patil';

/** Mother's mobile, 10 digits without +91 (shown on Profile > Parent & Guardian). */
export const MOCK_MOTHER_MOBILE = '9876501234';

export interface MockStudent {
  id: string;
  /** School-issued username (approved format sch0001s0001). */
  username: string;
  firstName: string;
  fullName: string;
  className: string;
  section: string;
  rollNumber: number;
  schoolName: string;
  academicYear: string;
  /** School-controlled, read-only in the app (approved V1 rules). */
  gender: Gender;
  /** ISO date (yyyy-mm-dd). */
  dateOfBirth: string;
  parent: {
    name: string;
    /** Registered parent mobile, 10 digits without the +91 prefix. Empty when the school has none. */
    mobile: string;
  };
  unreadNotices: number;
  heroSubtitle: string;
}

/** The signed-in student (student mode), and the first linked child in parent mode. */
export const mockStudent: MockStudent = {
  id: 'child-001',
  username: 'sch0001s0014',
  firstName: 'Truptil',
  fullName: 'Truptil Patil',
  className: '7',
  section: 'A',
  rollNumber: 14,
  schoolName: 'St. Joseph High School',
  academicYear: '2026-27',
  gender: 'Male',
  dateOfBirth: '2014-03-12',
  parent: {
    name: PARENT_NAME,
    mobile: MOCK_FLAGS.parentMobileMissing ? '' : REGISTERED_PARENT_MOBILE,
  },
  unreadNotices: 2,
  heroSubtitle: 'Assignments, notices and upcoming exams, all in one place.',
};

/** Second linked child, at a different school (parent-mode child switcher). */
export const mockSecondChild: MockStudent = {
  id: 'child-002',
  username: 'sch0002s0031',
  firstName: 'Anaya',
  fullName: 'Anaya Patil',
  className: '3',
  section: 'B',
  rollNumber: 8,
  schoolName: 'Green Valley Public School',
  academicYear: '2026-27',
  gender: 'Female',
  dateOfBirth: '2018-09-05',
  parent: { name: PARENT_NAME, mobile: REGISTERED_PARENT_MOBILE },
  unreadNotices: 1,
  heroSubtitle: 'Homework, notices and today’s timetable, all in one place.',
};

/** The signed-in parent in parent mode (mock), linked to two children at different schools. */
export const mockParent = {
  name: PARENT_NAME,
  firstName: 'Suresh',
  mobile: REGISTERED_PARENT_MOBILE,
  children: [mockStudent, mockSecondChild] as const,
};

export function findChild(id: string): MockStudent {
  return mockParent.children.find((c) => c.id === id) ?? mockStudent;
}
