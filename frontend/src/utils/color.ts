// src/utils/colors.ts
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
};

// Helper function to apply colors as inline styles
export const applyColor = (colorName: keyof typeof colors) => {
  return { color: colors[colorName] };
};

export const applyBgColor = (colorName: keyof typeof colors) => {
  return { backgroundColor: colors[colorName] };
};

export const applyBorderColor = (colorName: keyof typeof colors) => {
  return { borderColor: colors[colorName] };
};

// CSS classes for Tailwind-like usage
export const colorClasses = {
  text: {
    gold: 'text-[#FFD700]',
    darkNavy: 'text-[#0A2540]',
    goldenMustard: 'text-[#F1BB03]',
    white: 'text-[#FFFFFF]',
    gray100: 'text-[#F5F5F5]',
    gray400: 'text-[#A0A0A0]',
    gray800: 'text-[#333333]',
    teal: 'text-[#2AA198]',
    orange: 'text-[#FF8C42]',
    blue: 'text-[#4DA6FF]',
  },
  bg: {
    gold: 'bg-[#FFD700]',
    darkNavy: 'bg-[#0A2540]',
    goldenMustard: 'bg-[#F1BB03]',
    white: 'bg-[#FFFFFF]',
    gray100: 'bg-[#F5F5F5]',
    gray400: 'bg-[#A0A0A0]',
    gray800: 'bg-[#333333]',
    teal: 'bg-[#2AA198]',
    orange: 'bg-[#FF8C42]',
    blue: 'bg-[#4DA6FF]',
  },
  border: {
    gold: 'border-[#FFD700]',
    darkNavy: 'border-[#0A2540]',
    goldenMustard: 'border-[#F1BB03]',
    white: 'border-[#FFFFFF]',
    gray100: 'border-[#F5F5F5]',
    gray400: 'border-[#A0A0A0]',
    gray800: 'border-[#333333]',
    teal: 'border-[#2AA198]',
    orange: 'border-[#FF8C42]',
    blue: 'border-[#4DA6FF]',
  },
};

// For styled-components or emotion
export const colorThemes = {
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
};