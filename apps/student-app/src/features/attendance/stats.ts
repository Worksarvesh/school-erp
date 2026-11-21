import { ACADEMIC_YEAR_START, mockDayStatus, type DayStatus } from '@/mock/attendance';

export type Period = 'weekly' | 'monthly' | 'yearly';
export type Counts = Record<DayStatus, number>;
export interface Bar {
  label: string;
  value: number;
}

const WEEKDAY_INITIALS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** The Sunday-to-Saturday week that contains `date`. */
export function weekOf(date: Date): Date[] {
  return Array.from(
    { length: 7 },
    (_, i) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + i),
  );
}

/** Every date of the month that contains `month`. */
export function monthDates(month: Date): Date[] {
  const n = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from(
    { length: n },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
  );
}

/** First day of each of the 12 months of the academic year (June to May). */
export function yearMonths(): Date[] {
  return Array.from(
    { length: 12 },
    (_, i) => new Date(ACADEMIC_YEAR_START.getFullYear(), ACADEMIC_YEAR_START.getMonth() + i, 1),
  );
}

/** Dates covered by a period: the selected week, the shown month, or the academic year. */
export function datesFor(period: Period, selected: Date, month: Date): Date[] {
  if (period === 'weekly') return weekOf(selected);
  if (period === 'monthly') return monthDates(month);
  return yearMonths().flatMap(monthDates);
}

export function countStatuses(dates: readonly Date[], today: Date): Counts {
  const counts: Counts = { present: 0, absent: 0, holiday: 0 };
  for (const d of dates) {
    const s = mockDayStatus(d, today);
    if (s) counts[s] += 1;
  }
  return counts;
}

/** Share of school days attended: present / (present + absent), whole percent. */
export function percentPresent(c: Counts): number {
  const school = c.present + c.absent;
  return school === 0 ? 0 : Math.round((c.present / school) * 100);
}

/**
 * Bars for the chart of one status: per weekday (week), per week of the month (month) or per
 * month (year). Each value is the number of days with that status.
 */
export function chartBars(
  period: Period,
  status: DayStatus,
  selected: Date,
  month: Date,
  today: Date,
): Bar[] {
  const has = (d: Date) => (mockDayStatus(d, today) === status ? 1 : 0);
  if (period === 'weekly') {
    return weekOf(selected).map((d) => ({
      label: WEEKDAY_INITIALS[d.getDay()] ?? '',
      value: has(d),
    }));
  }
  if (period === 'monthly') {
    const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const weeks: number[] = [];
    for (const d of monthDates(month)) {
      const w = Math.floor((d.getDate() - 1 + offset) / 7);
      weeks[w] = (weeks[w] ?? 0) + has(d);
    }
    return Array.from(weeks, (v, i) => ({ label: `W${i + 1}`, value: v ?? 0 }));
  }
  return yearMonths().map((m) => ({
    label: MONTH_SHORT[m.getMonth()] ?? '',
    value: monthDates(m).reduce((n, d) => n + has(d), 0),
  }));
}
