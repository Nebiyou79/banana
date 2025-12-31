// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { colors, colorClasses, colorThemes } from '@/utils/color';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: typeof colors;
  colorClasses: typeof colorClasses;
  colorThemes: typeof colorThemes;
}

interface ThemeContextType extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as ThemeMode) || 'system';
};

const storeTheme = (theme: ThemeMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', theme);
  }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  // Initialize theme
  useEffect(() => {
    const storedTheme = getStoredTheme();
    setMode(storedTheme);
    updateResolvedMode(storedTheme);
  }, []);

  // Update resolved mode and apply to document
  const updateResolvedMode = (newMode: ThemeMode) => {
    const resolved = newMode === 'system' ? getSystemTheme() : newMode;
    setResolvedMode(resolved);
    
    // Apply to document
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    }
  };

  // Watch for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => updateResolvedMode('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    storeTheme(newMode);
    updateResolvedMode(newMode);
  };

  const toggleTheme = () => {
    const newMode = resolvedMode === 'light' ? 'dark' : 'light';
    setTheme(newMode);
  };

  const value: ThemeContextType = {
    mode,
    resolvedMode,
    colors,
    colorClasses,
    colorThemes,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware component hooks
export const useThemeColors = () => {
  const theme = useTheme();
  return theme.colors;
};

export const useThemeClasses = () => {
  const theme = useTheme();
  return theme.colorClasses;
};