/**
 * MOCK DATA ONLY for the Academic tab. No API exists yet; these values stand in for the homework
 * and attendance summaries the backend will provide.
 */

export interface MockHomeworkDue {
  id: string;
  title: string;
  /** Due date and time (local). */
  dueAt: Date;
}

export type AttendancePeriod = 'daily' | 'weekly' | 'monthly';

export interface MockAttendanceStats {
  /** Whole-number percentage, 0-100. */
  percentage: number;
  present: number;
  absent: number;
  holiday: number;
}

/** Homework due soon. Times are set on today's date so the "Due today" label always shows. */
export function mockHomeworkDue(now: Date = new Date()): MockHomeworkDue[] {
  const at = (hours: number, minutes: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  return [
    { id: 'hw-due-1', title: 'Physics Lab Report', dueAt: at(23, 59) },
    { id: 'hw-due-2', title: 'Literature Essay Draft', dueAt: at(17, 0) },
  ];
}

/** Attendance per Daily / Weekly / Monthly tab. */
export const mockAttendanceStats: Record<AttendancePeriod, MockAttendanceStats> = {
  daily: { percentage: 92, present: 23, absent: 2, holiday: 23 },
  weekly: { percentage: 83, present: 5, absent: 1, holiday: 1 },
  monthly: { percentage: 88, present: 21, absent: 3, holiday: 6 },
};
