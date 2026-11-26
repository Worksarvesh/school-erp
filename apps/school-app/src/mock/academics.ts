// MOCK DATA for Academic Performance, copied from the approved design. Delete once the exams API is
// wired. The design shows one selection (10th, A, All, Annual Exam); the other choices are
// placeholders.

export const ACADEMIC_FILTERS = {
  class: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
  section: ['A', 'B', 'C', 'D'],
  subject: ['All', 'Mathematics', 'Science', 'English', 'Hindi', 'Social Science'],
  examination: ['Annual Exam', 'Half Yearly', 'Unit Test'],
} as const;

/** The one student the design shows. Their marks are the same as the class numbers below. */
export const STUDENT_MOCK = {
  name: 'Aarav Sharma',
  roll: 14,
  className: '10th',
  section: 'A',
  year: '2024-25',
  attendance: 96,
  schoolId: 'EDU-2024-1002',
};

export type SubjectIcon = 'maths' | 'science' | 'english' | 'hindi' | 'social';

export const CLASS_PERFORMANCE_MOCK = {
  totalMarks: 500,
  obtainedMarks: 438,
  passPercentage: 87.6,
  status: 'Passed',
  rank: { number: 1, suffix: 'st' },
  subjects: [
    { name: 'Mathematics', icon: 'maths', marks: 95, outOf: 100 },
    { name: 'Science', icon: 'science', marks: 88, outOf: 100 },
    { name: 'English', icon: 'english', marks: 85, outOf: 100 },
    { name: 'Hindi', icon: 'hindi', marks: 90, outOf: 100 },
    { name: 'Social Science', icon: 'social', marks: 80, outOf: 100 },
  ] satisfies readonly { name: string; icon: SubjectIcon; marks: number; outOf: number }[],
};
