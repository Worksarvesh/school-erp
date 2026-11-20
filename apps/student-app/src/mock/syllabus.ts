/**
 * MOCK DATA ONLY for the Syllabus screens. No API exists yet. Progress is worked out from the
 * chapter list, so the subject cards and the chapter page always agree.
 */

export type ChapterStatus = 'completed' | 'in_progress' | 'upcoming';

export interface MockChapter {
  id: string;
  title: string;
  topics: number;
  status: ChapterStatus;
}

export interface MockSyllabusSubject {
  id: string;
  name: string;
  teacher: string;
  chapters: MockChapter[];
}

const chapters = (
  subjectId: string,
  list: readonly [title: string, topics: number][],
  completed: number,
): MockChapter[] =>
  list.map(([title, topics], i) => ({
    id: `${subjectId}-ch${i + 1}`,
    title: `Chapter ${i + 1} - ${title}`,
    topics,
    status: i < completed ? 'completed' : i === completed ? 'in_progress' : 'upcoming',
  }));

export const mockSyllabusSubjects: readonly MockSyllabusSubject[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    teacher: 'Mrs. Sharma',
    chapters: chapters(
      'mathematics',
      [
        ['Real Numbers', 6],
        ['Polynomials', 5],
        ['Linear Equations', 7],
        ['Quadratic Equations', 6],
        ['Arithmetic Progressions', 5],
        ['Triangles', 8],
        ['Coordinate Geometry', 5],
        ['Trigonometry', 7],
        ['Circles', 4],
        ['Areas Related to Circles', 4],
        ['Surface Areas and Volumes', 6],
        ['Statistics', 5],
        ['Probability', 4],
      ],
      9,
    ),
  },
  {
    id: 'science',
    name: 'Science',
    teacher: 'Mr. Patel',
    chapters: chapters(
      'science',
      [
        ['Chemical Reactions', 6],
        ['Acids, Bases and Salts', 5],
        ['Metals and Non-metals', 6],
        ['Carbon Compounds', 7],
        ['Life Processes', 8],
        ['Control and Coordination', 5],
        ['Reproduction', 6],
        ['Heredity', 4],
        ['Light', 7],
        ['Human Eye', 4],
        ['Electricity', 6],
        ['Magnetic Effects', 5],
      ],
      6,
    ),
  },
  {
    id: 'english',
    name: 'English',
    teacher: 'Ms. Verma',
    chapters: chapters(
      'english',
      [
        ['Prose', 8],
        ['Poem', 8],
        ['Grammar', 6],
        ['Literature', 5],
        ['Literature', 5],
        ['Literature', 4],
        ['Writing Skills', 6],
        ['Reading', 4],
      ],
      6,
    ),
  },
  {
    id: 'social-science',
    name: 'Social Science',
    teacher: 'Mr. Deshmukh',
    chapters: chapters(
      'social-science',
      [
        ['Rise of Nationalism', 6],
        ['Nationalism in India', 7],
        ['The Making of a Global World', 5],
        ['Resources and Development', 6],
        ['Water Resources', 4],
        ['Agriculture', 5],
        ['Power Sharing', 4],
        ['Federalism', 5],
        ['Development', 4],
        ['Money and Credit', 5],
      ],
      4,
    ),
  },
  {
    id: 'computer',
    name: 'Computer',
    teacher: 'Ms. Khan',
    chapters: chapters(
      'computer',
      [
        ['Networking', 5],
        ['HTML Basics', 6],
        ['CSS Styling', 5],
        ['Cyber Ethics', 3],
        ['Python Basics', 7],
      ],
      4,
    ),
  },
];

export function syllabusProgress(subject: MockSyllabusSubject): {
  done: number;
  total: number;
  percent: number;
} {
  const total = subject.chapters.length;
  const done = subject.chapters.filter((c) => c.status === 'completed').length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}
