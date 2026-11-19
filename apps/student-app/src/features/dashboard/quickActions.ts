import type { Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  Book,
  Calendar,
  ChartColumn,
  FileText,
  Megaphone,
  PenLine,
  SquareCheck,
} from 'lucide-react-native';

export interface QuickAction {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Href;
}

/**
 * Home quick actions: exactly the 7 approved V1.2 tiles. Homework includes assignments (one
 * module). Not in V1: Sports, Puzzle, Career Guidance, Events, Focus, Fees.
 * Each tile opens the existing academic screens in the root stack.
 */
export const QUICK_ACTIONS: readonly QuickAction[] = [
  { key: 'timetable', label: 'Time Table', icon: Calendar, href: '/timetable' },
  { key: 'homework', label: 'Homework', icon: PenLine, href: '/homework' },
  { key: 'attendance', label: 'Attendance', icon: SquareCheck, href: '/attendance' },
  { key: 'exams', label: 'Exams', icon: FileText, href: '/examinations' },
  { key: 'results', label: 'Results', icon: ChartColumn, href: '/examinations/results' },
  { key: 'syllabus', label: 'Syllabus', icon: Book, href: '/syllabus' },
  { key: 'notices', label: 'Notices', icon: Megaphone, href: '/notices' },
];

/** Greeting by local time of day. */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** "Thursday, October 24" with fixed English names (no locale dependence). */
export function formatLongDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}
