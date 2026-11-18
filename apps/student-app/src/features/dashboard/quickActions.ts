import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

export interface QuickAction {
  key: string;
  label: string;
  icon: FeatherName;
}

/**
 * Home quick actions, limited to the approved V1 Academic scope. Homework and Assignments are one
 * combined module. Not in V1 (removed from the Figma): Sports, Puzzle, separate Assignments.
 */
export const QUICK_ACTIONS: readonly QuickAction[] = [
  { key: 'timetable', label: 'Time Table', icon: 'calendar' },
  { key: 'homework', label: 'Homework', icon: 'edit-3' },
  { key: 'attendance', label: 'Attendance', icon: 'check-square' },
  { key: 'exams', label: 'Exams', icon: 'file-text' },
  { key: 'results', label: 'Results', icon: 'bar-chart-2' },
  { key: 'report-card', label: 'Report Card', icon: 'award' },
  { key: 'syllabus', label: 'Syllabus', icon: 'book' },
  { key: 'chapter-progress', label: 'Chapter Progress', icon: 'trending-up' },
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
