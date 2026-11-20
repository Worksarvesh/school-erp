/* eslint-disable @typescript-eslint/no-require-imports -- React Native image assets are loaded with require() */
import type { Href } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';

export interface QuickAction {
  key: string;
  label: string;
  /** 3D icon artwork from the approved design (assets/images/home). */
  image: ImageSourcePropType;
  /** Screen to open; undefined while the module has no screen yet. */
  href?: Href;
}

/** Placeholder screen for items in the designs that are not built in V1.2. */
export function comingSoon(title: string): Href {
  return { pathname: '/coming-soon', params: { title } };
}

/**
 * Home quick actions, in the approved design order (4 per row). Sports has no screen yet, so
 * its tile does nothing for now.
 */
export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    key: 'timetable',
    label: 'Time Table',
    image: require('../../../assets/images/home/timetable.png'),
    href: '/timetable',
  },
  {
    key: 'homework',
    label: 'Home Work',
    image: require('../../../assets/images/home/homework.png'),
    href: '/homework',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    image: require('../../../assets/images/home/attendance.png'),
    href: '/attendance',
  },
  {
    key: 'assignments',
    label: 'Assignments',
    image: require('../../../assets/images/home/assignments.png'),
    href: '/assignments',
  },
  { key: 'sports', label: 'Sports', image: require('../../../assets/images/home/sports.png') },
  {
    key: 'syllabus',
    label: 'Syllabus',
    image: require('../../../assets/images/home/syllabus.png'),
    href: '/syllabus',
  },
  {
    key: 'puzzle',
    label: 'Puzzle',
    image: require('../../../assets/images/home/puzzle.png'),
    href: '/puzzle',
  },
  {
    key: 'exam',
    label: 'Exam',
    image: require('../../../assets/images/home/exam.png'),
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
