/**
 * MOCK DATA ONLY for the Assignment screen. No API exists yet; dates are set relative to today so
 * the Upcoming and Past tabs always have items.
 */

export interface MockAssignment {
  id: string;
  subject: string;
  title: string;
  description: string;
  assignedOn: Date;
  dueOn: Date;
  totalMarks: number;
}

const SAMPLE_TEXT =
  'Out of 8,500 students at JNU, 82 per cent of students have cleared their hostel dues for winter. Write a short report on how the remaining dues can be collected, with a table of the data and your conclusions.';

export function mockAssignments(today: Date = new Date()): MockAssignment[] {
  const day = (offset: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  const a = (
    id: string,
    subject: string,
    title: string,
    assigned: number,
    due: number,
    totalMarks = 10,
    description = SAMPLE_TEXT,
  ): MockAssignment => ({
    id,
    subject,
    title,
    description,
    assignedOn: day(assigned),
    dueOn: day(due),
    totalMarks,
  });

  return [
    a('as-1', 'Mathematics', 'Statistics data report', -2, 0),
    a('as-2', 'Social Science', 'Hostel dues survey', -2, 1),
    a('as-3', 'English', 'Report writing', -1, 2),
    a('as-4', 'Physics', 'Motion graphs worksheet', -1, 3, 20),
    a('as-5', 'Chemistry', 'Chemical reactions chart', 0, 5, 15),
    a('as-6', 'Hindi', 'Nibandh lekhan', -9, -3),
    a('as-7', 'Biology', 'Cell structure diagram', -12, -5, 20),
    a('as-8', 'Geography', 'Map work: rivers of India', -15, -8),
  ];
}
