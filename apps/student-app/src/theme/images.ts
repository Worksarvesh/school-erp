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

/** Puzzle module artwork, cut from the approved Puzzle design (assets/puzzle). */
export const puzzleImages = {
  hero: require('../../assets/puzzle/hero.png'),
  word: require('../../assets/puzzle/word.png'),
  sudoku: require('../../assets/puzzle/sudoku.png'),
  math: require('../../assets/puzzle/math.png'),
  jigsaw: require('../../assets/puzzle/jigsaw.png'),
  logic: require('../../assets/puzzle/logic.png'),
  crossword: require('../../assets/puzzle/crossword.png'),
} satisfies Record<string, ImageSourcePropType>;
