// src/theme/tokens.ts
// ─── Single source of truth for spacing, radius, typography, sizing ───────────
// DO NOT hardcode any of these values in components — always import from here.

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  hero: 34,
} as const;

export const FONT_WEIGHT = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const BUTTON_HEIGHT = {
  sm: 36,
  md: 44,
  lg: 52,
} as const;

export const MIN_TOUCH_TARGET = 44;

// Brand palette — used by theme files, never imported directly in components
export const PALETTE = {
  // Gold (primary brand)
  gold:        '#F1BB03',
  goldDark:    '#B45309',
  goldLight:   '#FEF3C7',
  goldSubtle:  'rgba(241,187,3,0.12)',

  // Navy (dark mode base)
  navy900: '#050D1A',
  navy800: '#0A1628',
  navy700: '#0F2040',
  navy600: '#162035',
  navy500: '#1C2B45',
  navy400: '#243352',
  navy300: '#2E3F60',

  // Slate (light mode base)
  slate50:  '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0A2540',

  // Role accents
  blue:         '#3B82F6',
  blueDark:     '#1D4ED8',
  emerald:      '#10B981',
  emeraldDark:  '#059669',
  violet:       '#8B5CF6',
  violetDark:   '#7C3AED',

  // Status
  success:   '#10B981',
  warning:   '#F59E0B',
  error:     '#EF4444',
  danger: '#EF4444',
  info:      '#3B82F6',

  white: '#FFFFFF',
  black: '#000000',
} as const;