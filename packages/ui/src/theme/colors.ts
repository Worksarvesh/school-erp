export const lightPalette = {
  // Brand colors
  primary: '#5016A8', // Royal Purple (Primary Brand, Home design)
  primaryLight: '#7C4DDB',
  primaryDark: '#3F0F8C',
  primaryForeground: '#FFFFFF',

  // Surface & backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4EFFB', // Lavender 50 (tile backgrounds)
  border: '#E7E1F2',
  borderFocus: '#6D28D9',

  // Typography
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  // Semantic Status colors (WCAG AA Compliant)
  success: '#15803D', // Green 700
  successBg: '#DCFCE7', // Green 100
  warning: '#B45309', // Amber 700
  warningBg: '#FEF3C7', // Amber 100
  error: '#B91C1C', // Red 700
  errorBg: '#FEE2E2', // Red 100
  info: '#0369A1', // Sky 700
  infoBg: '#E0F2FE', // Sky 100
  neutral: '#475569',
  neutralBg: '#F1F5F9',
};

export const darkPalette = {
  // Brand colors
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryForeground: '#FFFFFF',

  // Surface & backgrounds
  background: '#0B0F19', // Dark Slate
  surface: '#151D2F',
  surfaceSubtle: '#241B3A',
  border: '#3A2F55',
  borderFocus: '#A78BFA',

  // Typography
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Semantic Status colors
  success: '#4ADE80',
  successBg: '#052E16',
  warning: '#FBBF24',
  warningBg: '#451A03',
  error: '#F87171',
  errorBg: '#450A0A',
  info: '#38BDF8',
  infoBg: '#082F49',
  neutral: '#94A3B8',
  neutralBg: '#1E293B',
};

export type ThemeColors = typeof lightPalette;
