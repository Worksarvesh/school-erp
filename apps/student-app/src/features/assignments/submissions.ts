import { create } from 'zustand';
import { mockSubmissions, type MockAssignment } from '@/mock/assignments';

export interface Submission {
  assignmentId: string;
  answer: string;
  /** Google Drive share link to the student's work; empty when none was given. */
  driveLink: string;
  submittedOn: Date;
}

interface SubmissionState {
  submissions: Record<string, Submission>;
  submit: (assignmentId: string, answer: string, driveLink: string) => void;
}

/**
 * Assignment submissions kept in app memory only (MOCK: there is no API yet, so they are lost
 * when the app restarts). Starts with the sample submissions from the mock data.
 */
export const useSubmissions = create<SubmissionState>((set) => ({
  submissions: Object.fromEntries(mockSubmissions().map((s) => [s.assignmentId, s])),
  submit: (assignmentId, answer, driveLink) =>
    set((state) => ({
      submissions: {
        ...state.submissions,
        [assignmentId]: { assignmentId, answer, driveLink, submittedOn: new Date() },
      },
    })),
}));

/** An https link on Google Drive or Google Docs (drive.google.com, docs.google.com). */
export function isDriveLink(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'drive.google.com' || url.hostname === 'docs.google.com')
    );
  } catch {
    return false;
  }
}

export type AssignmentTab = 'upcoming' | 'past' | 'submitted';

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Submitted: the student has submitted it. Otherwise Upcoming when due today or later, and Past
 * (overdue) when the due date has gone.
 */
export function assignmentTab(a: MockAssignment, today: Date, submitted: boolean): AssignmentTab {
  if (submitted) return 'submitted';
  return startOfDay(a.dueOn) >= startOfDay(today) ? 'upcoming' : 'past';
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
