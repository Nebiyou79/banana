// src/utils/color.ts

// Base color definitions
export const colors = {
  // Primary Colors
  gold: '#FFD700',
  darkNavy: '#0A2540',
  goldenMustard: '#F1BB03',

  // Neutral Colors
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D1D5DB',
  gray400: '#A0A0A0',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#333333',
  gray900: '#111827',

  // Supporting Colors
  teal: '#2AA198',
  teal700: '#0F766E',
  orange: '#FF8C42',
  blue: '#4DA6FF',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  green: '#10B981',
  red: '#EF4444',
  red700: '#B91C1C',
  purple: '#8B5CF6',
  purple700: '#7C3AED',
  emerald: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  indigo: '#6366F1',
  indigo700: '#4338CA',
  slate: '#64748B',
  rose: '#F43F5E',
  amber: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',
  amber800: '#92400E',

  // Light variants
  emerald100: '#D1FAE5',
  blue100: '#DBEAFE',
  red100: '#FEE2E2',
  purple100: '#EDE9FE',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',
  rose100: '#FFE4E6',
  pink100: '#FCE7F3',
  indigo100: '#E0E7FF',
  teal100: '#CCFBF1',
  orange100: '#FFEDD5',
  green100: '#D1FAE5',

  // Dark variants for dark mode backgrounds
  emeraldDark: '#064E3B',
  blueDark: '#1E3A8A',
  redDark: '#7F1D1D',
  purpleDark: '#4C1D95',
  amberDark: '#78350F',
  tealDark: '#115E59',
  orangeDark: '#7B341E',
  indigoDark: '#1E1B4B',
};

// Light mode colors (default)
export const lightTheme = {
  text: {
    primary: colors.darkNavy,
    secondary: colors.gray800,
    muted: colors.gray400,
    inverse: colors.white,
    gold: colors.gold,
    goldenMustard: colors.goldenMustard,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: colors.green,
    background: colors.darkNavy,
    surface: colors.gray100,
    foreground: colors.gray800,
    border: colors.gray400,
    primaryForeground: colors.white,
    secondaryForeground: colors.white,
    success: colors.green,
    warning: colors.amber,
    error: colors.red,
    info: colors.blue,
    gray100: colors.gray100,
    gray400: colors.gray400,
    gray600: colors.gray600,
    gray800: colors.gray800,
    white: colors.white,
    darkNavy: colors.darkNavy,
  },
  bg: {
    primary: colors.white,
    secondary: colors.gray100,
    muted: colors.gray400,
    surface: colors.gray100,
    gold: colors.gold,
    darkNavy: colors.darkNavy,
    goldenMustard: colors.goldenMustard,
    white: colors.white,
    gray100: colors.gray100,
    gray200: colors.gray200,
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: colors.green,
    emeraldLight: colors.emerald100,
    blueLight: colors.blue100,
    redLight: colors.red100,
    purpleLight: colors.purple100,
    amberLight: colors.amber100,
    tealLight: colors.teal100,
    orangeLight: colors.orange100,
    indigoLight: colors.indigo100,
  },
  border: {
    primary: colors.gray400,
    secondary: colors.gray100,
    gold: colors.gold,
    darkNavy: colors.darkNavy,
    goldenMustard: colors.goldenMustard,
    white: colors.white,
    gray100: colors.gray100,
    gray200: colors.gray200,
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: colors.green,
  },
};

// Dark mode colors
export const darkTheme = {
  text: {
    primary: colors.white,
    secondary: colors.gray100,
    muted: colors.gray400,
    inverse: colors.darkNavy,
    gold: colors.gold,
    goldenMustard: colors.goldenMustard,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: colors.green,
    background: colors.white,
    surface: colors.gray800,
    foreground: colors.gray100,
    border: colors.gray400,
    primaryForeground: colors.darkNavy,
    secondaryForeground: colors.darkNavy,
    success: colors.green,
    warning: colors.amber,
    error: colors.red,
    info: colors.blue,
    gray100: colors.gray100,
    gray400: colors.gray400,
    gray600: colors.gray600,
    gray800: colors.gray800,
    white: colors.white,
    darkNavy: colors.darkNavy,
  },
  bg: {
    primary: colors.darkNavy,
    secondary: colors.gray800,
    muted: colors.gray400,
    surface: colors.gray800,
    gold: colors.gold,
    darkNavy: colors.darkNavy,
    goldenMustard: colors.goldenMustard,
    white: colors.white,
    gray100: colors.gray100,
    gray200: colors.gray200,
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: colors.green,
    emeraldLight: colors.emeraldDark,
    blueLight: colors.blueDark,
    redLight: colors.redDark,
    purpleLight: colors.purpleDark,
    amberLight: colors.amberDark,
    tealLight: colors.tealDark,
    orangeLight: colors.orangeDark,
    indigoLight: colors.indigoDark,
  },
  border: {
    primary: colors.gray800,
    secondary: colors.gray400,
    gold: colors.gold,
    darkNavy: colors.darkNavy,
    goldenMustard: colors.goldenMustard,
    white: colors.white,
    gray100: colors.gray100,
    gray200: colors.gray200,
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: colors.green,
  },
};

// Theme modes
export type ThemeMode = 'light' | 'dark';

// Helper function to get current theme
export const getTheme = (mode: ThemeMode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPATIBLE colorClasses — full Tailwind class strings for both
// light and dark modes. Used throughout all components.
// ─────────────────────────────────────────────────────────────────────────────
export const colorClasses = {
  // ── Text ──────────────────────────────────────────────────────────────────
  text: {
    // Semantic
    primary: 'text-[#0A2540] dark:text-white',
    secondary: 'text-[#333333] dark:text-[#F5F5F5]',
    muted: 'text-[#A0A0A0] dark:text-[#6B7280]',
    inverse: 'text-white dark:text-[#0A2540]',
    error: 'text-[#EF4444] dark:text-[#EF4444]',
    warning: 'text-[#F59E0B] dark:text-[#F59E0B]',
    success: 'text-[#10B981] dark:text-[#10B981]',
    info: 'text-[#4DA6FF] dark:text-[#4DA6FF]',

    // Brand
    gold: 'text-[#FFD700] dark:text-[#FFD700]',
    darkNavy: 'text-[#0A2540] dark:text-white',
    goldenMustard: 'text-[#F1BB03] dark:text-[#F1BB03]',
    white: 'text-white dark:text-[#0A2540]',

    // Grays
    gray50: 'text-[#F9FAFB] dark:text-[#374151]',
    gray100: 'text-[#F5F5F5] dark:text-[#333333]',
    gray200: 'text-[#E5E5E5] dark:text-[#4B5563]',
    gray300: 'text-[#D1D5DB] dark:text-[#6B7280]',
    gray400: 'text-[#A0A0A0] dark:text-[#A0A0A0]',
    gray500: 'text-[#6B7280] dark:text-[#9CA3AF]',
    gray600: 'text-[#4B5563] dark:text-[#D1D5DB]',
    gray700: 'text-[#374151] dark:text-[#E5E5E5]',
    gray800: 'text-[#333333] dark:text-[#F5F5F5]',
    gray900: 'text-[#111827] dark:text-white',
    // Legacy alias
    gray1000: 'text-[#6B7280] dark:text-[#D1D5DB]',

    // Accent colors
    teal: 'text-[#2AA198] dark:text-[#2AA198]',
    orange: 'text-[#FF8C42] dark:text-[#FF8C42]',
    blue: 'text-[#4DA6FF] dark:text-[#60B4FF]',
    blue600: 'text-[#2563EB] dark:text-[#60A5FA]',
    blue700: 'text-[#1D4ED8] dark:text-[#93C5FD]',
    green: 'text-[#10B981] dark:text-[#34D399]',
    red: 'text-[#EF4444] dark:text-[#F87171]',
    red700: 'text-[#B91C1C] dark:text-[#FCA5A5]',
    purple: 'text-[#8B5CF6] dark:text-[#A78BFA]',
    purple700: 'text-[#7C3AED] dark:text-[#C4B5FD]',
    emerald: 'text-[#10B981] dark:text-[#34D399]',
    emerald600: 'text-[#059669] dark:text-[#10B981]',
    emerald700: 'text-[#047857] dark:text-[#059669]',
    indigo: 'text-[#6366F1] dark:text-[#818CF8]',
    indigo700: 'text-[#4338CA] dark:text-[#A5B4FC]',
    slate: 'text-[#64748B] dark:text-[#94A3B8]',
    rose: 'text-[#F43F5E] dark:text-[#FB7185]',
    amber: 'text-[#F59E0B] dark:text-[#FCD34D]',
    amber600: 'text-[#D97706] dark:text-[#F59E0B]',
    amber700: 'text-[#B45309] dark:text-[#D97706]',
    amber800: 'text-[#92400E] dark:text-[#B45309]',
  },

  // ── Backgrounds ───────────────────────────────────────────────────────────
  bg: {
    // Semantic
    primary: 'bg-white dark:bg-[#0A2540]',
    secondary: 'bg-[#F5F5F5] dark:bg-[#333333]',
    surface: 'bg-[#F9FAFB] dark:bg-[#1C3558]',
    muted: 'bg-[#A0A0A0] dark:bg-[#666666]',
    white: 'bg-white dark:bg-[#0A2540]',

    // Brand
    gold: 'bg-[#FFD700] dark:bg-[#FFD700]',
    darkNavy: 'bg-[#0A2540] dark:bg-[#0A2540]',
    goldenMustard: 'bg-[#F1BB03] dark:bg-[#F1BB03]',

    // Grays
    gray50: 'bg-[#F9FAFB] dark:bg-[#1E2D3D]',
    gray100: 'bg-[#F5F5F5] dark:bg-[#333333]',
    gray200: 'bg-[#E5E5E5] dark:bg-[#4B5563]',
    gray300: 'bg-[#D1D5DB] dark:bg-[#6B7280]',
    gray400: 'bg-[#A0A0A0] dark:bg-[#666666]',
    gray600: 'bg-[#4B5563] dark:bg-[#9CA3AF]',
    gray700: 'bg-[#374151] dark:bg-[#D1D5DB]',
    gray800: 'bg-[#333333] dark:bg-[#F5F5F5]',
    gray900: 'bg-[#111827] dark:bg-white',
    // Legacy alias
    gray1000: 'bg-[#6B7280] dark:bg-[#9CA3AF]',

    // Accent solids
    teal: 'bg-[#2AA198] dark:bg-[#2AA198]',
    orange: 'bg-[#FF8C42] dark:bg-[#FF8C42]',
    blue: 'bg-[#4DA6FF] dark:bg-[#4DA6FF]',
    blue600: 'bg-[#2563EB] dark:bg-[#3B82F6]',
    green: 'bg-[#10B981] dark:bg-[#10B981]',
    red: 'bg-[#EF4444] dark:bg-[#EF4444]',
    purple: 'bg-[#8B5CF6] dark:bg-[#8B5CF6]',
    emerald: 'bg-[#10B981] dark:bg-[#10B981]',
    emerald600: 'bg-[#059669] dark:bg-[#059669]',
    emerald700: 'bg-[#047857] dark:bg-[#047857]',
    indigo: 'bg-[#6366F1] dark:bg-[#6366F1]',
    slate: 'bg-[#64748B] dark:bg-[#94A3B8]',
    rose: 'bg-[#F43F5E] dark:bg-[#F43F5E]',
    amber: 'bg-[#F59E0B] dark:bg-[#F59E0B]',
    amber600: 'bg-[#D97706] dark:bg-[#D97706]',
    amber700: 'bg-[#B45309] dark:bg-[#B45309]',
    amber800: 'bg-[#92400E] dark:bg-[#92400E]',

    // Light/tinted background variants (status chips, badges, etc.)
    emeraldLight: 'bg-[#D1FAE5] dark:bg-[#064E3B]',
    blueLight: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]',
    redLight: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]',
    purpleLight: 'bg-[#EDE9FE] dark:bg-[#3B1F6B]',
    amberLight: 'bg-[#FEF3C7] dark:bg-[#78350F]',
    amber50Light: 'bg-[#FFFBEB] dark:bg-[#422006]',
    tealLight: 'bg-[#CCFBF1] dark:bg-[#115E59]',
    orangeLight: 'bg-[#FFEDD5] dark:bg-[#7B341E]',
    greenLight: 'bg-[#D1FAE5] dark:bg-[#064E3B]',
    roseLight: 'bg-[#FFE4E6] dark:bg-[#7F1D1D]',
    pinkLight: 'bg-[#FCE7F3] dark:bg-[#831843]',
    indigoLight: 'bg-[#E0E7FF] dark:bg-[#1E1B4B]',
    grayLight: 'bg-[#F3F4F6] dark:bg-[#1F2937]',
  },

  // ── Borders ───────────────────────────────────────────────────────────────
  border: {
    // Semantic
    primary: 'border-[#A0A0A0] dark:border-[#2D4A6B]',
    secondary: 'border-[#E5E5E5] dark:border-[#4B5563]',
    muted: 'border-[#D1D5DB] dark:border-[#374151]',

    // Brand
    gold: 'border-[#FFD700] dark:border-[#FFD700]',
    darkNavy: 'border-[#0A2540] dark:border-white',
    goldenMustard: 'border-[#F1BB03] dark:border-[#F1BB03]',
    white: 'border-white dark:border-[#0A2540]',

    // Grays
    gray100: 'border-[#F5F5F5] dark:border-[#333333]',
    gray200: 'border-[#E5E5E5] dark:border-[#4B5563]',
    gray300: 'border-[#D1D5DB] dark:border-[#4B5563]',
    gray400: 'border-[#A0A0A0] dark:border-[#4B5563]',
    gray600: 'border-[#4B5563] dark:border-[#9CA3AF]',
    gray700: 'border-[#374151] dark:border-[#D1D5DB]',
    gray800: 'border-[#333333] dark:border-[#F5F5F5]',
    // Legacy alias
    gray1000: 'border-[#6B7280] dark:border-[#9CA3AF]',

    // Accent
    teal: 'border-[#2AA198] dark:border-[#2AA198]',
    orange: 'border-[#FF8C42] dark:border-[#FF8C42]',
    blue: 'border-[#4DA6FF] dark:border-[#60B4FF]',
    blue600: 'border-[#2563EB] dark:border-[#3B82F6]',
    green: 'border-[#10B981] dark:border-[#34D399]',
    red: 'border-[#EF4444] dark:border-[#F87171]',
    purple: 'border-[#8B5CF6] dark:border-[#A78BFA]',
    emerald: 'border-[#10B981] dark:border-[#34D399]',
    emerald600: 'border-[#059669] dark:border-[#059669]',
    indigo: 'border-[#6366F1] dark:border-[#818CF8]',
    slate: 'border-[#64748B] dark:border-[#94A3B8]',
    rose: 'border-[#F43F5E] dark:border-[#FB7185]',
    amber: 'border-[#F59E0B] dark:border-[#FCD34D]',
    amber600: 'border-[#D97706] dark:border-[#D97706]',
  },

  // ── Ring ──────────────────────────────────────────────────────────────────
  ring: {
    gold: 'ring-[#FFD700] dark:ring-[#FFD700]',
    darkNavy: 'ring-[#0A2540] dark:ring-[#0A2540]',
    goldenMustard: 'ring-[#F1BB03] dark:ring-[#F1BB03]',
    white: 'ring-white dark:ring-[#0A2540]',
    gray100: 'ring-[#F5F5F5] dark:ring-[#333333]',
    gray400: 'ring-[#A0A0A0] dark:ring-[#666666]',
    gray600: 'ring-[#4B5563] dark:ring-[#A0A0A0]',
    gray800: 'ring-[#333333] dark:ring-[#F5F5F5]',
    teal: 'ring-[#2AA198] dark:ring-[#2AA198]',
    orange: 'ring-[#FF8C42] dark:ring-[#FF8C42]',
    blue: 'ring-[#4DA6FF] dark:ring-[#60B4FF]',
    blue600: 'ring-[#2563EB] dark:ring-[#3B82F6]',
    green: 'ring-[#10B981] dark:ring-[#34D399]',
    red: 'ring-[#EF4444] dark:ring-[#F87171]',
    purple: 'ring-[#8B5CF6] dark:ring-[#A78BFA]',
    emerald: 'ring-[#10B981] dark:ring-[#34D399]',
    indigo: 'ring-[#6366F1] dark:ring-[#818CF8]',
    slate: 'ring-[#64748B] dark:ring-[#94A3B8]',
    rose: 'ring-[#F43F5E] dark:ring-[#FB7185]',
    amber: 'ring-[#F59E0B] dark:ring-[#FCD34D]',
  },

  // ── Status (alias used by TenderStatusBadge, etc.) ────────────────────────
  status: {
    gold: 'text-[#FFD700] dark:text-[#FFD700]',
    darkNavy: 'text-[#0A2540] dark:text-white',
    goldenMustard: 'text-[#F1BB03] dark:text-[#F1BB03]',
    white: 'text-white dark:text-[#0A2540]',
    gray100: 'text-[#F5F5F5] dark:text-[#333333]',
    gray300: 'text-[#D1D5DB] dark:text-[#6B7280]',
    gray400: 'text-[#A0A0A0] dark:text-[#A0A0A0]',
    gray600: 'text-[#4B5563] dark:text-[#D1D5DB]',
    gray700: 'text-[#374151] dark:text-[#E5E5E5]',
    gray800: 'text-[#333333] dark:text-[#F5F5F5]',
    teal: 'text-[#2AA198] dark:text-[#2AA198]',
    orange: 'text-[#FF8C42] dark:text-[#FF8C42]',
    blue: 'text-[#4DA6FF] dark:text-[#60B4FF]',
    green: 'text-[#10B981] dark:text-[#34D399]',
    red: 'text-[#EF4444] dark:text-[#F87171]',
    purple: 'text-[#8B5CF6] dark:text-[#A78BFA]',
    emerald: 'text-[#10B981] dark:text-[#34D399]',
    indigo: 'text-[#6366F1] dark:text-[#818CF8]',
    slate: 'text-[#64748B] dark:text-[#94A3B8]',
    rose: 'text-[#F43F5E] dark:text-[#FB7185]',
    amber: 'text-[#F59E0B] dark:text-[#FCD34D]',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible helper functions
// ─────────────────────────────────────────────────────────────────────────────
export const applyColor = (colorName: keyof typeof colors) => {
  return { color: colors[colorName] };
};

export const applyBgColor = (colorName: keyof typeof colors) => {
  return { backgroundColor: colors[colorName] };
};

export const applyBorderColor = (colorName: keyof typeof colors) => {
  return { borderColor: colors[colorName] };
};

export const applyThemeColor = (
  type: 'text' | 'bg' | 'border',
  colorKey: string,
  mode: ThemeMode = 'light'
) => {
  const theme = getTheme(mode);
  if (type === 'text' && colorKey in theme.text) {
    return { color: theme.text[colorKey as keyof typeof theme.text] };
  }
  if (type === 'bg' && colorKey in theme.bg) {
    return { backgroundColor: theme.bg[colorKey as keyof typeof theme.bg] };
  }
  if (type === 'border' && colorKey in theme.border) {
    return { borderColor: theme.border[colorKey as keyof typeof theme.border] };
  }
  return {};
};

// For styled-components or emotion
export const colorThemes = {
  light: lightTheme,
  dark: darkTheme,
  base: {
    primary: {
      main: colors.goldenMustard,
      light: '#F8D568',
      dark: '#D99E00',
    },
    secondary: {
      main: colors.darkNavy,
      light: '#1A365D',
      dark: '#061224',
    },
    neutral: {
      white: colors.white,
      gray100: colors.gray100,
      gray400: colors.gray400,
      gray800: colors.gray800,
    },
    accent: {
      teal: colors.teal,
      orange: colors.orange,
      blue: colors.blue,
      emerald: colors.emerald,
    },
  },
};

// Export types
export type ColorClasses = typeof colorClasses;
export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;