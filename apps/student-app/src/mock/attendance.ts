/**
 * MOCK DATA ONLY for the Attendance calendar. No API exists yet; the status of each day is made
 * up by simple rules so every month has some present, absent and holiday days.
 */

export type DayStatus = 'present' | 'absent' | 'holiday';

/** First month of the academic year (June 2026): the month picker starts here. */
export const ACADEMIC_YEAR_START = new Date(2026, 5, 1);

/** School holidays (month is 1-based: "2026-08-15"). Sundays are holidays too (Saturday is a school day). */
const HOLIDAYS = new Set([
  '2026-08-15',
  '2026-08-28',
  '2026-10-02',
  '2026-10-20',
  '2026-11-09',
  '2026-11-10',
  '2026-11-11',
  '2026-12-25',
]);

/** Absent days, so the mock calendar has a few red dots each month. */
const ABSENT = new Set([
  '2026-06-18',
  '2026-07-07',
  '2026-07-13',
  '2026-07-20',
  '2026-08-11',
  '2026-09-03',
  '2026-09-24',
  '2026-10-14',
  '2026-11-05',
  '2026-11-16',
]);

function key(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Status for one day, or null when there is no record (a future day, or before the academic
 * year started).
 */
export function mockDayStatus(date: Date, today: Date = new Date()): DayStatus | null {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d > t || d < ACADEMIC_YEAR_START) return null;
  const k = key(d);
  if (d.getDay() === 0 || HOLIDAYS.has(k)) return 'holiday';
  if (ABSENT.has(k)) return 'absent';
  return 'present';
}
