/**
 * Design tokens for the Student App. Every screen and component styles itself from these values
 * only: no raw colours, font sizes or spacing numbers elsewhere.
 */

export const colors = {
  primary: '#7B00FF',
  primaryPressed: '#6600D6',
  primaryDisabled: '#C9A6FF',
  primaryDark: '#4B1FA8',
  primarySoft: '#F3ECFF',
  primarySoftBorder: '#E2D1FF',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  inputFill: '#F6F7F9',
  lockedFill: '#F1F2F5',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: '#E4D6FF',

  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  notificationDot: '#EF4444',

  placeholderBlock: '#D9D9D9',
  overlay: 'rgba(17, 24, 39, 0.4)',
  shadow: '#000000',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  input: 12,
  button: 12,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

/** Minimum touch target (accessibility). */
export const touch = {
  minTarget: 44,
  buttonHeight: 52,
  inputHeight: 52,
  tabBarHeight: 64,
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30 },
  title: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 26 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  subtitle: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 15 },
  captionStrong: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 15 },
  button: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20 },
  tab: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14 },
} as const;

export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  hero: 40,
} as const;

export const borderWidth = {
  thin: 1,
  selected: 1.5,
} as const;

/** Fixed sizes of decorative elements, kept here so screens hold no magic numbers. */
export const sizes = {
  splashLogo: 96,
  avatar: 40,
  notificationDot: 8,
  checkBadge: 22,
  illustration: 72,
  heroIllustration: 64,
  contactIllustration: 88,
  quickActionIcon: 48,
  bigCardArrow: 32,
  progressHeight: 8,
  contentMaxWidth: 520,
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  button: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

/** Pressed-state feedback. */
export const opacity = {
  pressed: 0.6,
  pressedCard: 0.9,
} as const;

/** Timing used by the splash screen. */
export const timing = {
  splashMs: 1500,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  touch,
  fontFamily,
  typography,
  iconSize,
  borderWidth,
  sizes,
  shadows,
  opacity,
  timing,
};
export type Theme = typeof theme;
