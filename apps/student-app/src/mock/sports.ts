import type { sportsImages } from '@/theme/images';

/** MOCK data only: no sports API exists yet. */
export interface SportCategory {
  key: keyof typeof sportsImages;
  label: string;
  /** Tile background, sampled from the approved design. */
  tint: string;
  /** Icon size in points, as drawn in the design. */
  size: readonly [number, number];
}

export const SPORT_CATEGORIES: readonly SportCategory[] = [
  { key: 'cricket', label: 'Cricket', tint: '#E6EEFF', size: [33, 37] },
  { key: 'football', label: 'Football', tint: '#E7F6EE', size: [42, 37] },
  { key: 'basketball', label: 'Basketball', tint: '#FEEFE6', size: [44, 37] },
  { key: 'badminton', label: 'Badminton', tint: '#ECE9FF', size: [35, 37] },
  { key: 'volleyball', label: 'Volleyball', tint: '#FDF9E6', size: [44, 44] },
  { key: 'tabletennis', label: 'Table Tennis', tint: '#FFE9EC', size: [30, 37] },
  { key: 'athletics', label: 'Athletics', tint: '#E1F7FB', size: [33, 28] },
  { key: 'other', label: 'Other', tint: '#ECE9FF', size: [49, 47] },
];

export interface SportsEvent {
  id: string;
  day: string;
  month: string;
  title: string;
  place: string;
  time: string;
  status: 'Upcoming';
  /** Date box colours (background, text). */
  box: readonly [string, string];
}

export const SPORTS_EVENTS: readonly SportsEvent[] = [
  {
    id: 'ev-1',
    day: '12',
    month: 'SEP',
    title: 'Inter House Cricket Match',
    place: 'School Ground',
    time: '8:00 AM - 4:00 PM',
    status: 'Upcoming',
    box: ['#E6EEFF', '#1D4ED8'],
  },
  {
    id: 'ev-2',
    day: '16',
    month: 'SEP',
    title: 'Annual Sports Day Practice',
    place: 'Playground',
    time: '3:00 PM - 5:00 PM',
    status: 'Upcoming',
    box: ['#EDE9FE', '#6D28D9'],
  },
];
