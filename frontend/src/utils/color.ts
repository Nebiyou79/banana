// src/utils/color.ts

// Base color definitions
export const colors = {
  // Primary Colors
  gold: '#FFD700',
  darkNavy: '#0A2540',
  goldenMustard: '#F1BB03',

  // Neutral Colors
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray400: '#A0A0A0',
  gray800: '#333333',

  // Supporting Colors
  teal: '#2AA198',
  orange: '#FF8C42',
  blue: '#4DA6FF',
  green: '#10B981',
};

// Light mode colors (default)
export const lightTheme = {
  // Text colors
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
    green: '#10B981',
    background: colors.darkNavy,
    surface: colors.gray100,
    foreground: colors.gray800,
    border: colors.gray400,
    primaryForeground: colors.white,
    secondaryForeground: colors.white,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: colors.blue,
    gray100: colors.gray100,
    gray400: colors.gray400,
    gray800: colors.gray800,
    white: colors.white,
    darkNavy: colors.darkNavy,
  },

  // Background colors
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
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: '#10B981',
  },

  // Border colors
  border: {
    primary: colors.gray400,
    secondary: colors.gray100,
    gold: colors.gold,
    darkNavy: colors.darkNavy,
    goldenMustard: colors.goldenMustard,
    white: colors.white,
    gray100: colors.gray100,
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: '#10B981',
  }
};

// Dark mode colors
export const darkTheme = {
  // Text colors
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
    green: '#10B981',
    background: colors.white,
    surface: colors.gray800,
    foreground: colors.gray100,
    border: colors.gray400,
    primaryForeground: colors.darkNavy,
    secondaryForeground: colors.darkNavy,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: colors.blue,
    gray100: colors.gray100,
    gray400: colors.gray400,
    gray800: colors.gray800,
    white: colors.white,
    darkNavy: colors.darkNavy,
  },

  // Background colors
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
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: '#10B981',
  },

  // Border colors
  border: {
    primary: colors.gray800,
    secondary: colors.gray400,
    gold: colors.gold,
    darkNavy: colors.darkNavy,
    goldenMustard: colors.goldenMustard,
    white: colors.white,
    gray100: colors.gray100,
    gray400: colors.gray400,
    gray800: colors.gray800,
    teal: colors.teal,
    orange: colors.orange,
    blue: colors.blue,
    green: '#10B981',
  }
};

// Theme modes
export type ThemeMode = 'light' | 'dark';

// Helper function to get current theme
export const getTheme = (mode: ThemeMode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// BACKWARD COMPATIBLE: Your original colorClasses (single theme)
// This maintains compatibility with existing code
export const colorClasses = {
  text: {
    gold: 'text-[#FFD700] dark:text-[#FFD700]',
    darkNavy: 'text-[#0A2540] dark:text-[#FFFFFF]',
    goldenMustard: 'text-[#F1BB03] dark:text-[#F1BB03]',
    white: 'text-[#FFFFFF] dark:text-[#0A2540]',
    gray100: 'text-[#F5F5F5] dark:text-[#333333]',
    gray300: 'text-[#A0A0A0] dark:text-[#A0A0A0]',
    gray400: 'text-[#A0A0A0] dark:text-[#A0A0A0]',
    gray600: 'text-[#666666] dark:text-[#A0A0A0]',
    gray700: 'text-[#333333] dark:text-[#F5F5F5]',
    gray800: 'text-[#333333] dark:text-[#F5F5F5]',
    teal: 'text-[#2AA198] dark:text-[#2AA198]',
    orange: 'text-[#FF8C42] dark:text-[#FF8C42]',
    blue: 'text-[#4DA6FF] dark:text-[#4DA6FF]',
    green: 'text-[#10B981] dark:text-[#10B981]',
    red: 'text-[#EF4444] dark:text-[#EF4444]',
  },
  bg: {
    gold: 'bg-[#FFD700] dark:bg-[#FFD700]',
    darkNavy: 'bg-[#0A2540] dark:bg-[#0A2540]',
    goldenMustard: 'bg-[#F1BB03] dark:bg-[#F1BB03]',
    white: 'bg-[#FFFFFF] dark:bg-[#0A2540]',
    gray100: 'bg-[#F5F5F5] dark:bg-[#333333]',
    gray400: 'bg-[#A0A0A0] dark:bg-[#666666]',
    gray600: 'bg-[#666666] dark:bg-[#A0A0A0]',
    gray800: 'bg-[#333333] dark:bg-[#F5F5F5]',
    teal: 'bg-[#2AA198] dark:bg-[#2AA198]',
    orange: 'bg-[#FF8C42] dark:bg-[#FF8C42]',
    blue: 'bg-[#4DA6FF] dark:bg-[#4DA6FF]',
    green: 'bg-[#10B981] dark:bg-[#10B981]',
    red: 'bg-[#EF4444] dark:bg-[#EF4444]',
  },
  border: {
    gold: 'border-[#FFD700] dark:border-[#FFD700]',
    darkNavy: 'border-[#0A2540] dark:border-[#FFFFFF]',
    goldenMustard: 'border-[#F1BB03] dark:border-[#F1BB03]',
    white: 'border-[#FFFFFF] dark:border-[#0A2540]',
    gray100: 'border-[#F5F5F5] dark:border-[#333333]',
    gray400: 'border-[#A0A0A0] dark:border-[#666666]',
    gray700: 'border-[#333333] dark:border-[#F5F5F5]',
    gray800: 'border-[#333333] dark:border-[#F5F5F5]',
    teal: 'border-[#2AA198] dark:border-[#2AA198]',
    orange: 'border-[#FF8C42] dark:border-[#FF8C42]',
    blue: 'border-[#4DA6FF] dark:border-[#4DA6FF]',
    green: 'border-[#10B981] dark:border-[#10B981]',
    red: 'border-[#EF4444] dark:border-[#EF4444]',
  },
};

// BACKWARD COMPATIBLE: Your original helper functions
export const applyColor = (colorName: keyof typeof colors) => {
  return { color: colors[colorName] };
};

export const applyBgColor = (colorName: keyof typeof colors) => {
  return { backgroundColor: colors[colorName] };
};

export const applyBorderColor = (colorName: keyof typeof colors) => {
  return { borderColor: colors[colorName] };
};

// New helper functions for theme-based colors
export const applyThemeColor = (
  type: 'text' | 'bg' | 'border',
  colorKey: keyof typeof lightTheme.text | keyof typeof lightTheme.bg | keyof typeof lightTheme.border,
  mode: ThemeMode = 'light'
) => {
  const theme = getTheme(mode);
  if (type === 'text' && colorKey in theme.text) {
    return type === 'text' ? { color: theme.text[colorKey as keyof typeof theme.text] } :
      type === 'bg' ? { backgroundColor: theme.bg[colorKey as keyof typeof theme.bg] } :
        { borderColor: theme.border[colorKey as keyof typeof theme.border] };
  }
  return {};
};

// For styled-components or emotion
export const colorThemes = {
  light: lightTheme,
  dark: darkTheme,
  base: {
    // Your existing colorThemes structure for backward compatibility
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
    },
  },
};

// Export types for better TypeScript support
export type ColorClasses = typeof colorClasses;
export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;