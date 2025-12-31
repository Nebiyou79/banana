// components/social/theme/RoleThemeProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type RoleType = 'candidate' | 'company' | 'freelancer' | 'organization' | 'admin';

export interface ThemeColors {
  secondary: any;
  light: BackgroundColor | undefined;
  dark: Color | undefined;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  bgGradient: string;
  text: string;
  border: string;
}

const THEMES: Record<RoleType, ThemeColors> = {
  candidate: {
    primary: '#6366F1',
    primaryLight: '#A5B4FC',
    primaryDark: '#4F46E5',
    accent: '#818CF8',
    accentLight: '#C7D2FE',
    accentDark: '#3730A3',
    bgGradient: 'from-indigo-50 via-purple-50 to-blue-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  company: {
    primary: '#0F766E',
    primaryLight: '#5EEAD4',
    primaryDark: '#0D4D4A',
    accent: '#14B8A6',
    accentLight: '#99F6E4',
    accentDark: '#0F766E',
    bgGradient: 'from-teal-50 via-emerald-50 to-cyan-50',
    text: 'text-teal-700',
    border: 'border-teal-200'
  },
  freelancer: {
    primary: '#D97706',
    primaryLight: '#FDE68A',
    primaryDark: '#B45309',
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    accentDark: '#92400E',
    bgGradient: 'from-amber-50 via-yellow-50 to-orange-50',
    text: 'text-amber-600',
    border: 'border-amber-300'
  },
  organization: {
    primary: '#0F766E',
    primaryLight: '#5EEAD4',
    primaryDark: '#0D4D4A',
    accent: '#14B8A6',
    accentLight: '#99F6E4',
    accentDark: '#0F766E',
    bgGradient: 'from-teal-50 via-emerald-50 to-cyan-50',
    text: 'text-teal-700',
    border: 'border-teal-200'
  },
  admin: {
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#5B21B6',
    accent: '#8B5CF6',
    accentLight: '#DDD6FE',
    accentDark: '#4C1D95',
    bgGradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
    text: 'text-purple-700',
    border: 'border-purple-200'
  }
};

interface ThemeContextType {
  colors: ThemeColors;
  role: RoleType;
  getButtonClasses: (variant?: 'primary' | 'secondary' | 'outline') => string;
  getTextClasses: (variant?: 'primary' | 'muted' | 'accent') => string;
  getBorderClasses: () => string;
  getBgClasses: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a RoleThemeProvider');
  }
  return context;
};

interface RoleThemeProviderProps {
  children: ReactNode;
  overrideRole?: RoleType;
}

export const RoleThemeProvider: React.FC<RoleThemeProviderProps> = ({
  children,
  overrideRole
}) => {
  const { user } = useAuth();
  const role = (overrideRole || user?.role || 'candidate') as RoleType;
  const colors = THEMES[role];

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const baseClasses = 'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-[${colors.primary}] hover:bg-[${colors.primaryDark}] text-white focus:ring-[${colors.primaryLight}]`;
      case 'secondary':
        return `${baseClasses} bg-[${colors.accentLight}] hover:bg-[${colors.accent}] text-[${colors.accentDark}] focus:ring-[${colors.accentLight}]`;
      case 'outline':
        return `${baseClasses} border border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white focus:ring-[${colors.primaryLight}]`;
      default:
        return baseClasses;
    }
  };

  const getTextClasses = (variant: 'primary' | 'muted' | 'accent' = 'primary') => {
    switch (variant) {
      case 'primary':
        return `text-[${colors.primary}]`;
      case 'muted':
        return `text-[${colors.primaryLight}]`;
      case 'accent':
        return `text-[${colors.accent}]`;
      default:
        return '';
    }
  };

  const getBorderClasses = () => {
    return `border-[${colors.primaryLight}]`;
  };

  const getBgClasses = () => {
    return `bg-gradient-to-br ${colors.bgGradient}`;
  };

  return (
    <ThemeContext.Provider value={{
      colors,
      role,
      getButtonClasses,
      getTextClasses,
      getBorderClasses,
      getBgClasses
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Utility function to get theme classes by role
export const getThemeClasses = (role: RoleType = 'candidate') => {
  const colors = THEMES[role];

  return {
    button: {
      primary: `bg-[${colors.primary}] hover:bg-[${colors.primaryDark}] text-white`,
      secondary: `bg-[${colors.accentLight}] hover:bg-[${colors.accent}] text-[${colors.accentDark}]`,
      outline: `border border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white`
    },
    text: {
      primary: `text-[${colors.primary}]`,
      muted: `text-[${colors.primaryLight}]`,
      accent: `text-[${colors.accent}]`
    },
    border: `border-[${colors.primaryLight}]`,
    bg: `bg-gradient-to-br ${colors.bgGradient}`
  };
};