import { TextStyle, ViewStyle } from 'react-native';

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  white: string;
  black: string;
  overlay: string;
  banana: string;
  bananaLight: string;
  bananaDark: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  placeholder: string;
  skeleton: string;
}

export interface TypographyScale {
  xs: number;
  sm: number;
  base: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface SpacingScale {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  10: number;
  12: number;
  16: number;
  20: number;
  24: number;
}

export interface BorderRadiusScale {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Theme {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: {
    sm: ShadowPreset;
    md: ShadowPreset;
    lg: ShadowPreset;
  };
  isDark: boolean;
}

const baseTypography: TypographyScale = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

const baseSpacing: SpacingScale = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

const baseBorderRadius: BorderRadiusScale = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryDark: '#1D4ED8',
    secondary: '#FBBF24',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: '#059669',
    successLight: '#D1FAE5',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    info: '#0EA5E9',
    infoLight: '#E0F2FE',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.5)',
    banana: '#FBBF24',
    bananaLight: '#FEF3C7',
    bananaDark: '#D97706',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    inputBg: '#F8FAFC',
    placeholder: '#94A3B8',
    skeleton: '#E2E8F0',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    primaryDark: '#60A5FA',
    secondary: '#FBBF24',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
    success: '#10B981',
    successLight: '#064E3B',
    error: '#F87171',
    errorLight: '#450A0A',
    warning: '#FCD34D',
    warningLight: '#451A03',
    info: '#38BDF8',
    infoLight: '#0C4A6E',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0,0,0,0.7)',
    banana: '#FBBF24',
    bananaLight: '#451A03',
    bananaDark: '#FCD34D',
    tabBar: '#1E293B',
    tabBarBorder: '#334155',
    inputBg: '#1E293B',
    placeholder: '#64748B',
    skeleton: '#334155',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};