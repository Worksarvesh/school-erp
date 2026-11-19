import type { Href } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { homeImages } from '@/theme/images';

export interface QuickAction {
  key: string;
  label: string;
  /** 3D icon (Fluent Emoji, MIT, see assets/home/LICENSE.md). */
  image: ImageSourcePropType;
  href: Href;
}

/** Placeholder screen for items in the Home design that are not built in V1.2. */
export function comingSoon(title: string): Href {
  return { pathname: '/coming-soon', params: { title } };
}

/**
 * Home quick actions, in the order of the approved Home design (2 rows of 4).
 * Sports and Puzzle are not in V1.2 and open a
 * "Coming soon" placeholder (UI only, no backend).
 */
export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    key: 'timetable',
    label: 'Time Table',
    image: homeImages.timetable,
    href: '/timetable',
  },
  {
    key: 'homework',
    label: 'Home Work',
    image: homeImages.homework,
    href: '/homework',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    image: homeImages.attendance,
    href: '/attendance',
  },
  {
    key: 'assignments',
    label: 'Assignments',
    image: homeImages.assignments,
    href: '/assignments',
  },
  {
    key: 'sports',
    label: 'Sports',
    image: homeImages.sports,
    href: comingSoon('Sports'),
  },
  {
    key: 'syllabus',
    label: 'Syllabus',
    image: homeImages.syllabus,
    href: '/syllabus',
  },
  {
    key: 'puzzle',
    label: 'Puzzle',
    image: homeImages.puzzle,
    href: comingSoon('Puzzle'),
  },
  {
    key: 'exams',
    label: 'Exam',
    image: homeImages.exam,
    href: '/examinations',
  },
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
