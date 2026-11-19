/**
 * MOCK DATA ONLY for the Time Table screen. No API exists yet; these rows stand in for the
 * section timetable the backend will provide.
 */

interface BaseSlot {
  id: string;
  /** Start and end as minutes after midnight (local time). */
  start: number;
  end: number;
}

export interface ClassSlot extends BaseSlot {
  kind: 'class';
  subject: string;
  /** Optional subject code shown under the name, e.g. "HIS-110". */
  code?: string;
  teacher: string;
  room: string;
}

export interface BreakSlot extends BaseSlot {
  kind: 'break';
  title: string;
  /** Dot colour: lunch (green) or short break (amber). */
  variant: 'lunch' | 'short';
  place: string;
  /** Small grey tag next to the place, e.g. "Dining". */
  tag?: string;
}

export type TimetableSlot = ClassSlot | BreakSlot;

/** First Monday of the academic term: "Week N" counts from here. */
export const TERM_START = new Date(2026, 7, 24);

const t = (h: number, m = 0) => h * 60 + m;

const cls = (
  id: string,
  start: number,
  end: number,
  subject: string,
  teacher: string,
  room: string,
  code?: string,
): ClassSlot => ({ id, kind: 'class', start, end, subject, teacher, room, code });

const lunch = (id: string): BreakSlot => ({
  id,
  kind: 'break',
  start: t(11, 45),
  end: t(12, 45),
  title: 'Lunch & Rest',
  variant: 'lunch',
  place: 'Food Court',
  tag: 'Dining',
});

const shortBreak = (id: string): BreakSlot => ({
  id,
  kind: 'break',
  start: t(14, 15),
  end: t(14, 30),
  title: 'Short Break',
  variant: 'short',
  place: '',
  tag: 'Lounge',
});

/** Timetable by weekday (1 = Monday ... 5 = Friday). Wednesday matches the approved design. */
export const mockTimetable: Record<number, TimetableSlot[]> = {
  1: [
    cls('mon-1', t(8), t(9, 30), 'English', 'Prof. shasi', '71'),
    cls('mon-2', t(9, 30), t(10), 'Mathematics', 'Prof. Vance', '304 (East)'),
    cls('mon-3', t(10), t(11, 45), 'Chemistry Lab', 'Dr. M. Reid', 'Lab A (Grd)'),
    lunch('mon-4'),
    cls('mon-5', t(12, 45), t(14, 15), 'Geography', 'Ms. Jenkins', 'Auditorium2', 'GEO-104'),
    shortBreak('mon-6'),
    cls('mon-7', t(14, 30), t(16), 'Computer Science', 'Mr. R. Kale', 'comp. Lab'),
    cls('mon-8', t(16, 30), t(17), 'Hindi', 'TA Peterson', '22'),
  ],
  2: [
    cls('tue-1', t(8), t(9, 30), 'Physics', 'Dr. M. Reid', '210'),
    cls('tue-2', t(9, 30), t(10), 'Hindi', 'TA Peterson', '22'),
    cls('tue-3', t(10), t(11, 45), 'Mathematics', 'Prof. Vance', '304 (East)'),
    lunch('tue-4'),
    cls('tue-5', t(12, 45), t(14, 15), 'Literature & Comp.', 'Dr. A. Liang', 'comp. Lab'),
    shortBreak('tue-6'),
    cls('tue-7', t(14, 30), t(16), 'World History', 'Ms. Jenkins', 'Auditorium2', 'HIS-110'),
    cls('tue-8', t(16, 30), t(17), 'English', 'Prof. shasi', '71'),
  ],
  3: [
    cls('wed-1', t(8), t(9, 30), 'Mathematics', 'Prof. Vance', '304 (East)'),
    cls('wed-2', t(9, 30), t(10), 'English', 'Prof. shasi', '71'),
    cls('wed-3', t(10), t(11, 45), 'Physics Lab', 'Dr. M. Reid', 'Lab B (Grd)'),
    lunch('wed-4'),
    cls('wed-5', t(12, 45), t(14, 15), 'World History', 'Ms. Jenkins', 'Auditorium2', 'HIS-110'),
    shortBreak('wed-6'),
    cls('wed-7', t(14, 30), t(16), 'Literature & Comp.', 'Dr. A. Liang', 'comp. Lab'),
    cls('wed-8', t(16, 30), t(17), 'Hindi', 'TA Peterson', '22'),
  ],
  4: [
    cls('thu-1', t(8), t(9, 30), 'Biology', 'Dr. S. Rao', 'Lab C (1st)'),
    cls('thu-2', t(9, 30), t(10), 'Mathematics', 'Prof. Vance', '304 (East)'),
    cls('thu-3', t(10), t(11, 45), 'English', 'Prof. shasi', '71'),
    lunch('thu-4'),
    cls('thu-5', t(12, 45), t(14, 15), 'Economics', 'Ms. Jenkins', 'Auditorium2', 'ECO-102'),
    shortBreak('thu-6'),
    cls('thu-7', t(14, 30), t(16), 'Physical Education', 'Mr. D. Singh', 'Ground'),
    cls('thu-8', t(16, 30), t(17), 'Hindi', 'TA Peterson', '22'),
  ],
  5: [
    cls('fri-1', t(8), t(9, 30), 'Mathematics', 'Prof. Vance', '304 (East)'),
    cls('fri-2', t(9, 30), t(10), 'Hindi', 'TA Peterson', '22'),
    cls('fri-3', t(10), t(11, 45), 'Computer Science', 'Mr. R. Kale', 'comp. Lab'),
    lunch('fri-4'),
    cls('fri-5', t(12, 45), t(14, 15), 'Literature & Comp.', 'Dr. A. Liang', 'comp. Lab'),
    shortBreak('fri-6'),
    cls('fri-7', t(14, 30), t(16), 'Art & Craft', 'Ms. P. Nair', 'Art Room'),
    cls('fri-8', t(16, 30), t(17), 'English', 'Prof. shasi', '71'),
  ],
};
