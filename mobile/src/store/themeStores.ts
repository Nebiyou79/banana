// src/store/themeStore.ts
// Only stores the user preference. Actual colors are resolved in useTheme().

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode:    (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',

  setMode: (mode) => set({ mode }),

  toggleMode: () => {
    const current = get().mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    set({ mode: next });
  },
}));