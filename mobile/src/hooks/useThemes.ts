// src/hooks/useTheme.ts
// The single source of truth for all visual tokens in the app.
// Usage: const { colors, isDark, type, spacing, radius, shadows } = useTheme();

import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStores';
import { darkColors, lightColors, type AppColors } from '../constants/theme/colors';
import { type, fonts }    from '../constants/theme/typography';
import { spacing, radius } from '../constants/theme/spacing';
import { shadows }         from '../constants/theme/shadows';

export function useTheme() {
  const { mode }      = useThemeStore();
  const systemScheme  = useColorScheme();

  const isDark =
    mode === 'dark' ||
    (mode === 'system' && systemScheme === 'dark');

  const colors: AppColors = isDark ? darkColors : lightColors;

  return { colors, isDark, mode, type, fonts, spacing, radius, shadows };
}

export default useTheme;