// src/constants/theme/colors.ts
// MASTER color tokens. Never hardcode hex in components — always use useTheme().colors

export const palette = {
  // Brand Gold
  gold:        '#F1BB03',
  goldDark:    '#B45309',
  goldLight:   '#FEF3C7',
  goldSubtle:  'rgba(241,187,3,0.12)',

  // Navy scale — dark mode backgrounds
  navy900: '#050D1A',
  navy800: '#0A1628',
  navy700: '#0F2040',
  navy600: '#162035',
  navy500: '#1C2B45',
  navy400: '#243352',
  navy300: '#2E3F60',

  // Slate scale — light mode
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
  blueLight:    '#EFF6FF',
  blueDark:     '#1D4ED8',
  emerald:      '#10B981',
  emeraldLight: '#ECFDF5',
  emeraldDark:  '#059669',
  violet:       '#8B5CF6',
  violetLight:  '#F5F3FF',
  violetDark:   '#7C3AED',

  // Status
  success:   '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  warning:   '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  error:     '#EF4444',
  errorBg:   'rgba(239,68,68,0.12)',
  info:      '#3B82F6',
  infoBg:    'rgba(59,130,246,0.12)',

  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;

// ─── Dark Mode ────────────────────────────────────────────────────────────────
export const darkColors = {
  bgPrimary:   palette.navy800,
  bgSecondary: palette.navy700,
  bgCard:      palette.navy600,
  bgElevated:  palette.navy500,
  bgSurface:   palette.navy400,

  textPrimary:   '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted:     '#64748B',
  textDisabled:  '#334155',
  textInverse:   palette.navy800,

  borderPrimary:   'rgba(255,255,255,0.08)',
  borderSecondary: 'rgba(255,255,255,0.05)',
  borderAccent:    'rgba(241,187,3,0.30)',

  accent:    palette.gold,
  accentDark:palette.goldDark,
  accentBg:  palette.goldSubtle,

  candidate:    palette.blue,
  freelancer:   palette.emerald,
  company:      palette.gold,
  organization: palette.violet,

  success:   palette.success,
  successBg: palette.successBg,
  warning:   palette.warning,
  warningBg: palette.warningBg,
  error:     palette.error,
  errorBg:   palette.errorBg,
  info:      palette.info,
  infoBg:    palette.infoBg,

  overlay:      'rgba(0,0,0,0.60)',
  overlayLight: 'rgba(0,0,0,0.30)',

  tabBar:       palette.navy700,
  tabBarBorder: 'rgba(255,255,255,0.06)',
  tabActive:    palette.gold,
  tabInactive:  '#475569',

  inputBg:          palette.navy600,
  inputBorder:      'rgba(255,255,255,0.10)',
  inputBorderFocus: 'rgba(241,187,3,0.50)',
  inputPlaceholder: '#475569',

  skeleton:    palette.navy500,
  shadowColor: '#000000',
} as const;

// ─── Light Mode ───────────────────────────────────────────────────────────────
export const lightColors = {
  bgPrimary:   palette.slate50,
  bgSecondary: palette.slate100,
  bgCard:      palette.white,
  bgElevated:  palette.white,
  bgSurface:   palette.slate200,

  textPrimary:   palette.slate900,
  textSecondary: palette.slate700,
  textMuted:     palette.slate500,
  textDisabled:  palette.slate400,
  textInverse:   palette.white,

  borderPrimary:   'rgba(0,0,0,0.08)',
  borderSecondary: 'rgba(0,0,0,0.05)',
  borderAccent:    'rgba(241,187,3,0.40)',

  accent:    palette.gold,
  accentDark:palette.goldDark,
  accentBg:  'rgba(241,187,3,0.08)',

  candidate:    palette.blue,
  freelancer:   palette.emerald,
  company:      palette.goldDark,
  organization: palette.violet,

  success:   palette.success,
  successBg: 'rgba(16,185,129,0.08)',
  warning:   palette.warning,
  warningBg: 'rgba(245,158,11,0.08)',
  error:     palette.error,
  errorBg:   'rgba(239,68,68,0.08)',
  info:      palette.info,
  infoBg:    'rgba(59,130,246,0.08)',

  overlay:      'rgba(0,0,0,0.40)',
  overlayLight: 'rgba(0,0,0,0.15)',

  tabBar:       palette.white,
  tabBarBorder: 'rgba(0,0,0,0.08)',
  tabActive:    palette.goldDark,
  tabInactive:  palette.slate400,

  inputBg:          palette.white,
  inputBorder:      'rgba(0,0,0,0.12)',
  inputBorderFocus: 'rgba(241,187,3,0.60)',
  inputPlaceholder: palette.slate400,

  skeleton:    palette.slate200,
  shadowColor: '#0A2540',
} as const;

export type AppColors = Readonly<{
  [K in keyof typeof darkColors]: string;
}>;
export type ColorKey  = keyof AppColors;