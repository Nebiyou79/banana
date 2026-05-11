// src/store/themeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from '../theme/color';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppTheme {
  isDark: boolean;
  mode: ThemeMode; // Add mode tracking
  colors: ThemeColors & {
    background: string;
    card: string;
  };
}

interface ThemeState {
  theme: AppTheme;
  setDark: () => void;
  setLight: () => void;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void; // Add mode setter
}

// ─── Color mapping ────────────────────────────────────────────────────────────

const buildTheme = (dark: boolean, mode: ThemeMode = 'system'): AppTheme => {
  const base = dark ? { ...DARK_COLORS } : { ...LIGHT_COLORS };
  return {
    isDark: dark,
    mode: mode,
    colors: {
      ...base,
      background: base.bg,
      card: base.bgCard,
    },
  };
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: buildTheme(true, 'system'),

      setDark: () => set({ theme: buildTheme(true, 'dark') }),
      setLight: () => set({ theme: buildTheme(false, 'light') }),
      toggle: () => {
        const current = get().theme;
        const newIsDark = !current.isDark;
        set({ 
          theme: buildTheme(newIsDark, newIsDark ? 'dark' : 'light') 
        });
      },
      setMode: (mode: ThemeMode) => {
        set({ theme: { ...get().theme, mode } });
      },
    }),
    {
      name: 'bananalink-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: {
          isDark: state.theme.isDark,
          mode: state.theme.mode,
          colors: {} as any,
        },
      }),
      merge: (persisted: any, current) => {
        const isDark = persisted?.theme?.isDark ?? true;
        const mode = persisted?.theme?.mode ?? 'system';
        return {
          ...current,
          theme: buildTheme(isDark, mode),
        };
      },
    },
  ),
);