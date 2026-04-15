/**
 * mobile/src/theme/index.ts
 * Centralized Design System — Mobile-UI-Architect Skill Applied
 * No hardcoded colors anywhere in the app. All values sourced here.
 */

import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Scale utility (responsive units) ────────────────────────────────────────

const BASE_W = 390; // iPhone 15 base
export const scale  = (n: number) => (SCREEN_W / BASE_W) * n;
export const vs     = (n: number) => (SCREEN_H / 844) * n;
export const ms     = (n: number, f = 0.5) => n + (scale(n) - n) * f;

// ─── Palette ──────────────────────────────────────────────────────────────────

const palette = {
  // Primary brand
  blue50:  '#EFF6FF', blue100: '#DBEAFE', blue200: '#BFDBFE',
  blue500: '#3B82F6', blue600: '#2563EB', blue700: '#1D4ED8', blue900: '#1E3A5F',

  // Success
  green50: '#F0FDF4', green100: '#D1FAE5', green500: '#22C55E',
  green600: '#16A34A', green700: '#15803D', green900: '#052E16',

  // Warning
  amber50: '#FFFBEB', amber100: '#FEF3C7', amber500: '#F59E0B',
  amber600: '#D97706', amber700: '#B45309', amber900: '#451A03',

  // Error
  red50: '#FEF2F2', red100: '#FEE2E2', red500: '#EF4444',
  red600: '#DC2626', red900: '#450A0A',

  // Purple
  purple50: '#FAF5FF', purple100: '#EDE9FE', purple500: '#A855F7',
  purple700: '#7E22CE', purple900: '#3B0764',

  // Neutral
  gray50:  '#F9FAFB', gray100: '#F3F4F6', gray200: '#E5E7EB',
  gray300: '#D1D5DB', gray400: '#9CA3AF', gray500: '#6B7280',
  gray600: '#4B5563', gray700: '#374151', gray800: '#1F2937',
  gray900: '#111827',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Light theme ──────────────────────────────────────────────────────────────

export const lightColors = {
  // Surfaces
  background:   '#F8FAFC',
  surface:      '#FFFFFF',
  card:         '#FFFFFF',
  inputBg:      '#F8FAFC',

  // Text
  text:         '#0F172A',
  textSecondary:'#334155',
  textMuted:    '#94A3B8',
  placeholder:  '#94A3B8',

  // Brand
  primary:      palette.blue600,
  primaryLight: palette.blue50,
  primaryDark:  palette.blue700,

  // Semantic
  success:      palette.green600,
  successLight: palette.green50,
  error:        palette.red600,
  errorLight:   palette.red50,
  warning:      palette.amber600,
  warningLight: palette.amber50,
  info:         palette.blue500,
  infoLight:    palette.blue50,

  // Structure
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',
  divider:      '#E2E8F0',

  // Misc
  skeleton:     '#E2E8F0',
  skeletonShine:'#F1F5F9',
  overlay:      'rgba(0,0,0,0.5)',
  tabBar:       '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  white:        '#FFFFFF',
  black:        '#000000',
} as const;

// ─── Dark theme ───────────────────────────────────────────────────────────────

export const darkColors = {
  background:   '#0F172A',
  surface:      '#1E293B',
  card:         '#1E293B',
  inputBg:      '#1E293B',

  text:         '#F1F5F9',
  textSecondary:'#CBD5E1',
  textMuted:    '#64748B',
  placeholder:  '#64748B',

  primary:      '#60A5FA',
  primaryLight: '#1E3A5F',
  primaryDark:  '#93C5FD',

  success:      '#34D399',
  successLight: '#022C22',
  error:        '#F87171',
  errorLight:   '#450A0A',
  warning:      '#FCD34D',
  warningLight: '#451A03',
  info:         '#38BDF8',
  infoLight:    '#0C4A6E',

  border:       '#334155',
  borderLight:  '#1E293B',
  divider:      '#334155',

  skeleton:     '#334155',
  skeletonShine:'#3F4F66',
  overlay:      'rgba(0,0,0,0.7)',
  tabBar:       '#1E293B',
  tabBarBorder: '#334155',
  white:        '#FFFFFF',
  black:        '#000000',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  // Sizes
  xs:   ms(11),
  sm:   ms(13),
  base: ms(15),
  md:   ms(16),
  lg:   ms(18),
  xl:   ms(20),
  '2xl': ms(24),
  '3xl': ms(30),

  // Weights
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight:  1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  0:  0,
  1:  scale(4),
  2:  scale(8),
  3:  scale(12),
  4:  scale(16),
  5:  scale(20),
  6:  scale(24),
  8:  scale(32),
  10: scale(40),
  12: scale(48),
  16: scale(64),
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

export const radius = {
  sm:   scale(6),
  md:   scale(10),
  lg:   scale(14),
  xl:   scale(18),
  '2xl': scale(24),
  full: 9999,
} as const;

// ─── Shadows — platform aware ─────────────────────────────────────────────────

export const shadows = {
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 8 },
    android: { elevation: 4 },
    default: {},
  })!,
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 16 },
    android: { elevation: 8 },
    default: {},
  })!,
  card: Platform.select({
    ios:     { shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  })!,
} as const;

// ─── Export type ──────────────────────────────────────────────────────────────

export type ThemeColors = typeof lightColors | typeof darkColors;
export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
};

export const buildTheme = (isDark: boolean): Theme => ({
  colors:     isDark ? darkColors : lightColors,
  isDark,
  typography,
  spacing,
  radius,
  shadows,
});