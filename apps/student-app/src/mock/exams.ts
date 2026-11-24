/**
 * MOCK DATA ONLY for the Exam screens (timetable, unit tests, results). No API exists yet; dates
 * are set relative to today so the screens always show upcoming and completed items.
 */

export interface MockExamSlot {
  id: string;
  subject: string;
  kind: string;
  date: Date;
  /** Minutes from midnight. */
  start: number;
  end: number;
  maxMarks: number;
}

export interface MockUnitTest {
  id: string;
  name: string;
  subject: string;
  date: Date;
  start: number;
  end: number;
  maxMarks: number;
  /** Set once the test is marked. */
  obtained?: number;
}

export interface MockSubjectMark {
  subject: string;
  maxMarks: number;
  obtained: number;
  grade: string;
}

/** Which Result tab an exam belongs to. */
export type ExamResultKind = 'unit_test' | 'mid_term' | 'end_sem';

export interface MockExamResult {
  id: string;
  kind: ExamResultKind;
  title: string;
  academicYear: string;
  /** Grade and status as published by the school. */
  overallGrade: string;
  passed: boolean;
  remark: string;
  subjects: MockSubjectMark[];
}

const at = (h: number, m = 0) => h * 60 + m;

/** `offset` days from today, moved forward to Monday when it lands on a weekend. */
function dayFrom(today: Date, offset: number): Date {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

export function mockExamTimetable(today: Date = new Date()): MockExamSlot[] {
  const slot = (id: string, subject: string, offset: number): MockExamSlot => ({
    id,
    subject,
    kind: 'Main Exam',
    date: dayFrom(today, offset),
    start: at(10),
    end: at(12),
    maxMarks: 100,
  });
  return [
    slot('ex-1', 'Mathematics', 6),
    slot('ex-2', 'Science', 9),
    slot('ex-3', 'English', 12),
    slot('ex-4', 'Social Science', 16),
    slot('ex-5', 'Hindi', 19),
    slot('ex-6', 'Computer', 23),
  ];
}

export function mockUnitTests(today: Date = new Date()): MockUnitTest[] {
  const test = (
    id: string,
    subject: string,
    offset: number,
    obtained?: number,
    name = 'Unit Test 1',
  ): MockUnitTest => ({
    id,
    name,
    subject,
    date: dayFrom(today, offset),
    start: at(10),
    end: at(11),
    maxMarks: 30,
    obtained,
  });
  return [
    test('ut-1', 'Mathematics', 2),
    test('ut-2', 'Science', 4),
    test('ut-3', 'English', 7),
    test('ut-4', 'Social Science', 10),
    test('ut-5', 'Hindi', -6, 26),
    test('ut-6', 'Computer', -9, 28),
    test('ut-7', 'Mathematics', -20, 24, 'Class Test'),
  ];
}

/** Grade for a percentage: 90+ A+, 75+ A, 60+ B+, 45+ B, else C. */
function gradeFor(obtained: number, max: number): string {
  const p = (obtained / max) * 100;
  if (p >= 90) return 'A+';
  if (p >= 75) return 'A';
  if (p >= 60) return 'B+';
  if (p >= 45) return 'B';
  return 'C';
}

const SUBJECTS = ['Mathematics', 'Science', 'Computer', 'English', 'Social Science'] as const;

/** One published result; `marks` are in SUBJECTS order, all out of `maxMarks`. */
function result(
  id: string,
  kind: ExamResultKind,
  title: string,
  maxMarks: number,
  marks: readonly number[],
  remark: string,
): MockExamResult {
  const subjects = SUBJECTS.map((subject, i) => {
    const obtained = marks[i] ?? 0;
    return { subject, maxMarks, obtained, grade: gradeFor(obtained, maxMarks) };
  });
  const total = subjects.reduce((s, x) => s + x.obtained, 0);
  return {
    id,
    kind,
    title,
    academicYear: '2026 - 2027',
    overallGrade: gradeFor(total, maxMarks * subjects.length),
    passed: subjects.every((x) => x.obtained >= maxMarks * 0.33),
    remark,
    subjects,
  };
}

/** Published results, newest first within each kind. */
export const mockExamResults: readonly MockExamResult[] = [
  result('res-ut-4', 'unit_test', 'Unit Test 4', 30, [28, 26, 29, 24, 25], 'Well Done!'),
  result('res-ut-3', 'unit_test', 'Unit Test 3', 30, [25, 27, 28, 22, 24], 'Good Work!'),
  result('res-ut-2', 'unit_test', 'Unit Test 2', 30, [27, 23, 26, 25, 21], 'Good Work!'),
  result('res-ut-1', 'unit_test', 'Unit Test 1', 30, [24, 22, 27, 23, 20], 'Keep it up!'),
  result(
    'res-midterm',
    'mid_term',
    'Mid Term Examination',
    100,
    [92, 88, 95, 80, 85],
    'Well Done!',
  ),
  result(
    'res-endsem',
    'end_sem',
    'End Semester Examination',
    100,
    [89, 84, 93, 78, 82],
    'Well Done!',
  ),
];
