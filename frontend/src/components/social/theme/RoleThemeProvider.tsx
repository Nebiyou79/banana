/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/theme/RoleThemeProvider.tsx
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';

export type RoleType = 'candidate' | 'company' | 'freelancer' | 'organization' | 'admin';

// Role-specific color enhancements on top of base color system
export interface RoleThemeColors {
  // Primary brand colors for each role
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary/accent colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Secondary/accent colors
  accent: string;
  accentLight: string;
  accentDark: string;

  // Background gradients
  bgGradientLight: string;
  bgGradientDark: string;

  // Card styles
  cardBgLight: string;
  cardBgDark: string;
  cardBorderLight: string;
  cardBorderDark: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Define role-specific themes that enhance the base color system
const ROLE_THEMES: Record<RoleType, RoleThemeColors> = {
  candidate: {
    primary: '#2B1D1A',
    primaryLight: '#6E3B2E',
    primaryDark: '#1A0E0C',

    secondary: '#C2410C',
    secondaryLight: '#FB923C',
    secondaryDark: '#9A3412',

    accent: '#EAB308',
    accentLight: '#FDE047',
    accentDark: '#A16207',

    bgGradientLight: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
    bgGradientDark: 'linear-gradient(135deg, #140B08 0%, #1F120D 100%)',

    cardBgLight: 'rgba(255, 255, 255, 0.97)',
    cardBgDark: 'rgba(31, 18, 13, 0.97)',

    cardBorderLight: 'rgba(194, 65, 12, 0.25)',
    cardBorderDark: 'rgba(234, 179, 8, 0.25)',

    success: '#16A34A',
    warning: '#D97706',
    error: '#B91C1C',
    info: '#92400E'
  },
  company: {
    primary: '#4361EE', // Professional blue
    primaryLight: '#6C8AFF',
    primaryDark: '#3A56D4',
    secondary: '#7209B7', // Vibrant purple
    secondaryLight: '#9D4EDD',
    secondaryDark: '#5A189A',
    accent: '#4CC9F0', // Light blue accent
    accentLight: '#80DDFF',
    accentDark: '#00A8E8',
    bgGradientLight: 'linear-gradient(135deg, #F8F9FF 0%, #F0F2FF 100%)',
    bgGradientDark: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    cardBgLight: 'rgba(248, 249, 255, 0.95)',
    cardBgDark: 'rgba(30, 41, 59, 0.95)',
    cardBorderLight: 'rgba(67, 97, 238, 0.2)',
    cardBorderDark: 'rgba(108, 138, 255, 0.3)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  freelancer: {
    primary: '#3A2E2A',
    primaryLight: '#5A4A42',
    primaryDark: '#241B17',
    secondary: '#8D6E63',
    secondaryLight: '#A1887F',
    secondaryDark: '#5D4037',
    accent: '#D4A373',
    accentLight: '#E9CBA7',
    accentDark: '#B08968',
    bgGradientLight: 'linear-gradient(135deg, #FAF8F5 0%, #F1ECE6 100%)',
    bgGradientDark: 'linear-gradient(135deg, #17110E 0%, #241B17 100%)',
    cardBgLight: 'rgba(255, 255, 255, 0.96)',
    cardBgDark: 'rgba(36, 27, 23, 0.96)',
    cardBorderLight: 'rgba(141, 110, 99, 0.18)',
    cardBorderDark: 'rgba(212, 163, 115, 0.25)',
    success: '#6A994E',
    warning: '#BC6C25',
    error: '#9B2226',
    info: '#8D6E63'
  }
  ,
  organization: {
    primary: '#3A86FF', // Organization blue
    primaryLight: '#5FA0FF',
    primaryDark: '#2B6CD9',
    secondary: '#FB5607', // Warm orange
    secondaryLight: '#FF7B3D',
    secondaryDark: '#D94805',
    accent: '#8338EC', // Purple accent
    accentLight: '#9D4EDD',
    accentDark: '#6A1B9A',
    bgGradientLight: 'linear-gradient(135deg, #F0F5FF 0%, #F8F0FF 100%)',
    bgGradientDark: 'linear-gradient(135deg, #0F1F3A 0%, #1A2F4A 100%)',
    cardBgLight: 'rgba(240, 245, 255, 0.95)',
    cardBgDark: 'rgba(26, 47, 74, 0.95)',
    cardBorderLight: 'rgba(58, 134, 255, 0.2)',
    cardBorderDark: 'rgba(95, 160, 255, 0.3)',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3'
  },
  admin: {
    primary: '#7C3AED', // Admin purple
    primaryLight: '#A78BFA',
    primaryDark: '#5B21B6',
    secondary: '#10B981', // Success green
    secondaryLight: '#34D399',
    secondaryDark: '#059669',
    accent: '#C084FC', // Light purple accent
    accentLight: '#D8B4FE',
    accentDark: '#9333EA',
    bgGradientLight: 'linear-gradient(135deg, #F5F3FF 0%, #FDF4FF 100%)',
    bgGradientDark: 'linear-gradient(135deg, #1F0A3A 0%, #2A1A4A 100%)',
    cardBgLight: 'rgba(245, 243, 255, 0.95)',
    cardBgDark: 'rgba(42, 26, 74, 0.95)',
    cardBorderLight: 'rgba(124, 58, 237, 0.2)',
    cardBorderDark: 'rgba(167, 139, 250, 0.3)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8B5CF6'
  }
};

interface ThemeContextType {
  role: RoleType;
  mode: ThemeMode;
  colors: RoleThemeColors;
  baseColors: ReturnType<typeof getTheme>;

  // Helper functions
  getButtonClasses: (variant?: 'primary' | 'secondary' | 'outline' | 'ghost') => string;
  getTextClasses: (variant?: 'primary' | 'secondary' | 'muted' | 'accent' | 'inverse') => string;
  getBorderClasses: (variant?: 'primary' | 'secondary' | 'accent') => string;
  getBgClasses: (variant?: 'page' | 'card' | 'header') => string;

  // Style objects for inline styles
  getPageBgStyle: () => React.CSSProperties;
  getCardStyle: () => React.CSSProperties;

  // Role-based color utilities
  getRoleColor: (type: 'primary' | 'secondary') => string;
  getRoleGradient: () => string;
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
  overrideMode?: ThemeMode;
}

export const RoleThemeProvider: React.FC<RoleThemeProviderProps> = ({
  children,
  overrideRole,
  overrideMode
}) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<ThemeMode>('light');
  const role = (overrideRole || user?.role || 'candidate') as RoleType;

  // Get role-specific colors
  const roleColors = ROLE_THEMES[role];
  // Get base theme colors for light/dark mode
  const baseColors = getTheme(mode);

  // Detect system preference and update mode
  useEffect(() => {
    const detectSystemTheme = () => {
      if (overrideMode) {
        setMode(overrideMode);
        return;
      }

      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedMode = localStorage.getItem('theme-mode') as ThemeMode;

        if (storedMode) {
          setMode(storedMode);
        } else {
          setMode(prefersDark ? 'dark' : 'light');
        }
      }
    };

    detectSystemTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme-mode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [overrideMode]);

  // Helper function to combine Tailwind classes with role-specific styles
  const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
    const baseClasses = 'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const isDark = mode === 'dark';

    switch (variant) {
      case 'primary':
        return `${baseClasses} ${isDark
          ? `bg-[${roleColors.primaryDark}] hover:bg-[${roleColors.primary}] text-white focus:ring-[${roleColors.primaryLight}]`
          : `bg-[${roleColors.primary}] hover:bg-[${roleColors.primaryDark}] text-white focus:ring-[${roleColors.primaryLight}]`
          }`;
      case 'secondary':
        return `${baseClasses} ${isDark
          ? `bg-[${roleColors.secondaryDark}] hover:bg-[${roleColors.secondary}] text-white focus:ring-[${roleColors.secondaryLight}]`
          : `bg-[${roleColors.secondary}] hover:bg-[${roleColors.secondaryDark}] text-white focus:ring-[${roleColors.secondaryLight}]`
          }`;
      case 'outline':
        return `${baseClasses} border ${isDark
          ? `border-[${roleColors.primaryLight}] text-[${roleColors.primaryLight}] hover:bg-[${roleColors.primary}] hover:text-white focus:ring-[${roleColors.primary}]`
          : `border-[${roleColors.primary}] text-[${roleColors.primary}] hover:bg-[${roleColors.primary}] hover:text-white focus:ring-[${roleColors.primary}]`
          }`;
      case 'ghost':
        return `${baseClasses} ${isDark
          ? `text-[${roleColors.primaryLight}] hover:bg-gray-800 focus:ring-gray-700`
          : `text-[${roleColors.primary}] hover:bg-gray-100 focus:ring-gray-300`
          }`;
      default:
        return baseClasses;
    }
  };

  const getTextClasses = (variant: 'primary' | 'secondary' | 'muted' | 'accent' | 'inverse' = 'primary') => {
    switch (variant) {
      case 'primary':
        return mode === 'dark' ? colorClasses.text.white : `text-[${roleColors.primary}]`;
      case 'secondary':
        return mode === 'dark' ? `text-[${roleColors.secondaryLight}]` : `text-[${roleColors.secondary}]`;
      case 'muted':
        return mode === 'dark' ? colorClasses.text.gray400 : colorClasses.text.gray600;
      case 'accent':
        return mode === 'dark' ? colorClasses.text.goldenMustard : colorClasses.text.orange;
      case 'inverse':
        return mode === 'dark' ? colorClasses.text.darkNavy : colorClasses.text.white;
      default:
        return '';
    }
  };

  const getBorderClasses = (variant: 'primary' | 'secondary' | 'accent' = 'primary') => {
    const isDark = mode === 'dark';

    switch (variant) {
      case 'primary':
        return isDark ? `border-[${roleColors.primaryDark}]` : `border-[${roleColors.primaryLight}]`;
      case 'secondary':
        return isDark ? `border-[${roleColors.secondaryDark}]` : `border-[${roleColors.secondaryLight}]`;
      case 'accent':
        return isDark ? colorClasses.border.goldenMustard : colorClasses.border.orange;
      default:
        return '';
    }
  };

  const getBgClasses = (variant: 'page' | 'card' | 'header' = 'page') => {
    const isDark = mode === 'dark';

    switch (variant) {
      case 'page':
        return isDark ? 'bg-gray-900' : 'bg-gray-50';
      case 'card':
        return isDark ? 'bg-gray-800' : 'bg-white';
      case 'header':
        return isDark ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm';
      default:
        return '';
    }
  };

  const getPageBgStyle = (): React.CSSProperties => {
    return {
      background: mode === 'dark' ? roleColors.bgGradientDark : roleColors.bgGradientLight,
      minHeight: '100vh'
    };
  };

  const getCardStyle = (): React.CSSProperties => {
    return {
      background: mode === 'dark' ? roleColors.cardBgDark : roleColors.cardBgLight,
      borderColor: mode === 'dark' ? roleColors.cardBorderDark : roleColors.cardBorderLight,
      backdropFilter: 'blur(10px)'
    };
  };

  const getRoleColor = (type: 'primary' | 'secondary' = 'primary'): string => {
    const isDark = mode === 'dark';
    return type === 'primary'
      ? (isDark ? roleColors.primaryLight : roleColors.primary)
      : (isDark ? roleColors.secondaryLight : roleColors.secondary);
  };

  const getRoleGradient = (): string => {
    return mode === 'dark' ? roleColors.bgGradientDark : roleColors.bgGradientLight;
  };

  return (
    <ThemeContext.Provider value={{
      role,
      mode,
      colors: roleColors,
      baseColors,
      getButtonClasses,
      getTextClasses,
      getBorderClasses,
      getBgClasses,
      getPageBgStyle,
      getCardStyle,
      getRoleColor,
      getRoleGradient
    }}>
      <div
        className="min-h-screen transition-colors duration-300"
        style={getPageBgStyle()}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Utility function to get theme classes by role and mode
export const getThemeClasses = (role: RoleType = 'candidate', mode: ThemeMode = 'light') => {
  const colors = ROLE_THEMES[role];
  const isDark = mode === 'dark';

  return {
    button: {
      primary: isDark
        ? `bg-[${colors.primaryDark}] hover:bg-[${colors.primary}] text-white`
        : `bg-[${colors.primary}] hover:bg-[${colors.primaryDark}] text-white`,
      secondary: isDark
        ? `bg-[${colors.secondaryDark}] hover:bg-[${colors.secondary}] text-white`
        : `bg-[${colors.secondary}] hover:bg-[${colors.secondaryDark}] text-white`,
      outline: isDark
        ? `border border-[${colors.primaryLight}] text-[${colors.primaryLight}] hover:bg-[${colors.primary}] hover:text-white`
        : `border border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white`
    },
    text: {
      primary: isDark ? 'text-white' : `text-[${colors.primary}]`,
      secondary: isDark ? `text-[${colors.secondaryLight}]` : `text-[${colors.secondary}]`,
      muted: isDark ? 'text-gray-400' : 'text-gray-600'
    },
    border: isDark ? `border-[${colors.primaryDark}]` : `border-[${colors.primaryLight}]`,
    bg: {
      page: isDark ? colors.bgGradientDark : colors.bgGradientLight,
      card: isDark ? colors.cardBgDark : colors.cardBgLight
    },
    colors: {
      primary: isDark ? colors.primaryLight : colors.primary,
      secondary: isDark ? colors.secondaryLight : colors.secondary
    }
  };
};

// HOC for applying theme to components
export const withTheme = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithTheme: React.FC<P> = (props) => {
    const theme = useTheme();
    return <WrappedComponent {...props} theme={theme} />;
  };

  WithTheme.displayName = `WithTheme(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithTheme;
};