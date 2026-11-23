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

export interface MockExamResult {
  id: string;
  title: string;
  academicYear: string;
  className: string;
  semester: string;
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

export const mockExamResults: readonly MockExamResult[] = [
  {
    id: 'res-midterm',
    title: 'Mid Term Examination',
    academicYear: '2025 - 26',
    className: '10 - A',
    semester: '1st',
    overallGrade: 'A+',
    passed: true,
    remark: 'Well Done!',
    subjects: [
      { subject: 'Mathematics', maxMarks: 100, obtained: 92, grade: 'A+' },
      { subject: 'Science', maxMarks: 100, obtained: 88, grade: 'A' },
      { subject: 'Computer', maxMarks: 100, obtained: 95, grade: 'A+' },
      { subject: 'English', maxMarks: 100, obtained: 80, grade: 'A' },
      { subject: 'Social Science', maxMarks: 100, obtained: 85, grade: 'A' },
    ],
  },
  {
    id: 'res-quarterly',
    title: 'Quarterly Examination',
    academicYear: '2025 - 26',
    className: '10 - A',
    semester: '1st',
    overallGrade: 'A',
    passed: true,
    remark: 'Good Work!',
    subjects: [
      { subject: 'Mathematics', maxMarks: 50, obtained: 41, grade: 'A' },
      { subject: 'Science', maxMarks: 50, obtained: 39, grade: 'B+' },
      { subject: 'Computer', maxMarks: 50, obtained: 46, grade: 'A+' },
      { subject: 'English', maxMarks: 50, obtained: 40, grade: 'A' },
      { subject: 'Social Science', maxMarks: 50, obtained: 42, grade: 'A' },
    ],
  },
];
