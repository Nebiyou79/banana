import { create } from 'zustand';
import { Appearance } from 'react-native';
import { lightTheme, darkTheme, Theme } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const getTheme = (mode: ThemeMode): Theme => {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  theme: getTheme('system'),

  setMode: (mode) => {
    set({ mode, theme: getTheme(mode) });
  },

  toggleMode: () => {
    const current = get().mode;
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    set({ mode: next, theme: getTheme(next) });
  },
}));

// Listen to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode, setMode } = useThemeStore.getState();
  if (mode === 'system') {
    useThemeStore.setState({ theme: colorScheme === 'dark' ? darkTheme : lightTheme });
  }
});