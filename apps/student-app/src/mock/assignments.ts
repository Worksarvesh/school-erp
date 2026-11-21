/**
 * MOCK DATA ONLY for the Assignment screens. No API exists yet; dates are set relative to today so
 * the Upcoming, Past and Submitted tabs always have items.
 */

export interface MockAssignment {
  id: string;
  subject: string;
  chapter: string;
  title: string;
  description: string;
  assignedOn: Date;
  dueOn: Date;
  totalMarks: number;
}

/** A submission already made before the app opened (Submitted tab sample). */
export interface MockSubmission {
  assignmentId: string;
  answer: string;
  driveLink: string;
  submittedOn: Date;
}

const SAMPLE_TEXT =
  'Out of 8,500 students at JNU, 82 per cent of students have cleared their hostel dues for winter. Write a short report on how the remaining dues can be collected, with a table of the data and your conclusions.';

function dayFrom(today: Date, offset: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
}

export function mockAssignments(today: Date = new Date()): MockAssignment[] {
  const a = (
    id: string,
    subject: string,
    chapter: string,
    title: string,
    assigned: number,
    due: number,
    totalMarks = 10,
    description = SAMPLE_TEXT,
  ): MockAssignment => ({
    id,
    subject,
    chapter,
    title,
    description,
    assignedOn: dayFrom(today, assigned),
    dueOn: dayFrom(today, due),
    totalMarks,
  });

  return [
    a('as-1', 'Mathematics', 'Statistics', 'Statistics data report', -2, 0),
    a('as-2', 'Social Science', 'Money and Credit', 'Hostel dues survey', -2, 1),
    a('as-3', 'English', 'Writing Skills', 'Report writing', -1, 2),
    a('as-4', 'Physics', 'Motion', 'Motion graphs worksheet', -1, 3, 20),
    a('as-5', 'Chemistry', 'Chemical Reactions', 'Chemical reactions chart', 0, 5, 15),
    a('as-9', 'Mathematics', 'Probability', 'Probability practice set', 0, 9, 20),
    a('as-6', 'Hindi', 'Nibandh Lekhan', 'Nibandh lekhan', -9, -3),
    a('as-7', 'Biology', 'Life Processes', 'Cell structure diagram', -12, -5, 20),
    a('as-8', 'Geography', 'Water Resources', 'Map work: rivers of India', -15, -8),
    a('as-10', 'English', 'Prose', 'Character sketch', -14, -6),
    a('as-11', 'Mathematics', 'Polynomials', 'Polynomials worksheet', -18, -11, 20),
  ];
}

/** Assignments the student had already submitted (as-10 and as-11). */
export function mockSubmissions(today: Date = new Date()): MockSubmission[] {
  return [
    {
      assignmentId: 'as-10',
      answer: 'Character sketch of the narrator, covering courage, honesty and growth.',
      driveLink: 'https://drive.google.com/file/d/sample-character-sketch/view',
      submittedOn: dayFrom(today, -7),
    },
    {
      assignmentId: 'as-11',
      answer: 'All 12 questions solved; working shown on the attached sheets.',
      driveLink: 'https://drive.google.com/drive/folders/sample-polynomials',
      submittedOn: dayFrom(today, -12),
    },
  ];
}
