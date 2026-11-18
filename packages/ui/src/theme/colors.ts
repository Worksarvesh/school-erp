export const lightPalette = {
  // Brand colors
  primary: '#1E40AF', // Deep Royal Blue (Primary Brand)
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  primaryForeground: '#FFFFFF',

  // Surface & backgrounds
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9', // Slate 100
  border: '#E2E8F0', // Slate 200
  borderFocus: '#2563EB',

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
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',
  primaryForeground: '#0F172A',

  // Surface & backgrounds
  background: '#0B0F19', // Dark Slate
  surface: '#151D2F',
  surfaceSubtle: '#1E293B',
  border: '#334155',
  borderFocus: '#60A5FA',

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
