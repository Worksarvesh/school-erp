/* eslint-disable @typescript-eslint/no-require-imports -- Metro bundles static images only through require(). */
import type { ImageSourcePropType } from 'react-native';

/**
 * 3D icons for the Home screen and tab bar (Microsoft Fluent Emoji, MIT, see
 * assets/home/LICENSE.md). Keep every image require in this one file.
 */
export const homeImages = {
  timetable: require('../../assets/home/timetable.png'),
  homework: require('../../assets/home/homework.png'),
  attendance: require('../../assets/home/attendance.png'),
  assignments: require('../../assets/home/assignments.png'),
  sports: require('../../assets/home/sports.png'),
  syllabus: require('../../assets/home/syllabus.png'),
  puzzle: require('../../assets/home/puzzle.png'),
  exam: require('../../assets/home/exam.png'),
  notices: require('../../assets/home/notices.png'),
  career: require('../../assets/home/career.png'),
  events: require('../../assets/home/events.png'),
  avatar: require('../../assets/home/avatar.png'),
  star: require('../../assets/home/star.png'),
  books: require('../../assets/home/books.png'),
  gradcap: require('../../assets/home/gradcap.png'),
  tabHome: require('../../assets/home/tab-home.png'),
  tabMessages: require('../../assets/home/tab-messages.png'),
  tabFees: require('../../assets/home/tab-fees.png'),
  tabProfile: require('../../assets/home/tab-profile.png'),
} satisfies Record<string, ImageSourcePropType>;

/** Sports screen artwork, cropped from the approved design (assets/sports). */
export const sportsImages = {
  banner: require('../../assets/sports/banner.png'),
  avatar: require('../../assets/sports/avatar.png'),
  cricket: require('../../assets/sports/cricket.png'),
  football: require('../../assets/sports/football.png'),
  basketball: require('../../assets/sports/basketball.png'),
  badminton: require('../../assets/sports/badminton.png'),
  volleyball: require('../../assets/sports/volleyball.png'),
  tabletennis: require('../../assets/sports/tabletennis.png'),
  athletics: require('../../assets/sports/athletics.png'),
  other: require('../../assets/sports/other.png'),
} satisfies Record<string, ImageSourcePropType>;

/** Safety screen avatars, cropped from the approved design (assets/safety). */
export const safetyImages = {
  sarah: require('../../assets/safety/sarah.png'),
  man: require('../../assets/safety/man.png'),
  elena: require('../../assets/safety/elena.png'),
} satisfies Record<string, ImageSourcePropType>;

/** Community screen avatars, cropped from the approved design (assets/community). */
export const communityImages = {
  announcements: require('../../assets/community/announcements.png'),
  teacher: require('../../assets/community/teacher.png'),
  sports: require('../../assets/community/sports.png'),
  sportsHead: require('../../assets/community/sports_head.png'),
  coordinator: require('../../assets/community/coordinator.png'),
  coach: require('../../assets/community/coach.png'),
} satisfies Record<string, ImageSourcePropType>;
