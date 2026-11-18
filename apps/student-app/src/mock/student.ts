/**
 * MOCK DATA ONLY. No API exists yet; these values stand in for the student and linked-child
 * records the backend will provide. Every screen that shows student data reads it from here.
 */

export type Gender = 'Male' | 'Female' | 'Other';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export interface MockStudent {
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
    /** Registered parent mobile, 10 digits without the +91 prefix. */
    mobile: string;
  };
  unreadNotices: number;
  heroSubtitle: string;
}

export const mockStudent: MockStudent = {
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
    name: 'Mr. Suresh Patil',
    mobile: '9876543210',
  },
  unreadNotices: 2,
  heroSubtitle: 'Assignments, notices and upcoming exams, all in one place.',
};

/** The signed-in parent in parent mode (mock). Linked to mockStudent. */
export const mockParent = {
  name: 'Mr. Suresh Patil',
  firstName: 'Suresh',
} as const;
