// src/hooks/useTheme.ts
// ─── Unified theme hook ────────────────────────────────────────────────────────
//
// USAGE:
//   const { colors, radius, type, shadows, isDark, spacing } = useTheme();
//
// COMPATIBILITY BRIDGE:
//   - Components that call useTheme() continue to work unchanged.
//   - Components that call useThemeStore() also continue to work unchanged.
//   - Both hooks now read from the same underlying themeStore.
//
// FIELD MAP (useTheme API → themeStore fields):
//   colors.accent          → theme.colors.primary  (gold)
//   colors.accentBg        → theme.colors.primaryBg
//   colors.bgCard          → theme.colors.bgCard
//   colors.bgSecondary     → theme.colors.surface
//   colors.bgPrimary       → theme.colors.bg
//   colors.borderPrimary   → theme.colors.border
//   colors.textPrimary     → theme.colors.text
//   colors.textInverse     → '#FFFFFF' (dark) | '#0A1628' (light)
//   colors.textMuted       → theme.colors.textMuted
//   colors.success         → theme.colors.success
//   colors.error           → theme.colors.danger
//   colors.warning         → theme.colors.warning
//   radius.md              → 12
//   radius.full            → 9999
//   shadows.sm             → platform-appropriate shadow
//   type.caption           → { fontSize: 11, lineHeight: 14 }
//   type.bodySm            → { fontSize: 13, lineHeight: 18 }
//   type.body              → { fontSize: 15, lineHeight: 22 }
//   isDark                 → theme.isDark

import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useThemeStore } from '../store/themeStores';
import { RADIUS, SPACING } from '../theme/tokens';

// ─── Shadow tokens ────────────────────────────────────────────────────────────
const makeShadows = (shadowColor: string) => ({
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor,
      shadowOpacity: 0.10,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
  }) ?? {},
  md: Platform.select({
    ios: {
      shadowColor,
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 4 },
  }) ?? {},
  lg: Platform.select({
    ios: {
      shadowColor,
      shadowOpacity: 0.20,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 8 },
  }) ?? {},
});

// ─── Typography tokens ────────────────────────────────────────────────────────
const TYPE = {
  caption:  { fontSize: 11, lineHeight: 14 },
  bodySm:   { fontSize: 13, lineHeight: 18 },
  body:     { fontSize: 15, lineHeight: 22 },
  bodyMd:   { fontSize: 16, lineHeight: 22 },
  label:    { fontSize: 12, lineHeight: 16 },
  h3:       { fontSize: 18, lineHeight: 24 },
  h2:       { fontSize: 22, lineHeight: 28 },
  h1:       { fontSize: 28, lineHeight: 34 },
} as const;

// ─── Radius tokens ─────────────────────────────────────────────────────────────
const RADIUS_TOKENS = {
  xs:   4,
  sm:   RADIUS.sm,
  md:   RADIUS.md,
  lg:   RADIUS.lg,
  xl:   RADIUS.xl,
  full: RADIUS.full,
} as const;

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useTheme = () => {
  const { theme } = useThemeStore();
  const tc = theme.colors; // themeStore color shape

  return useMemo(() => {
    const shadows = makeShadows(tc.shadowColor ?? '#000');

    // ── Compatibility color layer ──────────────────────────────────────────
    // Exposes both the "old" useTheme API names AND the "themeStore" names.
    // Any property accessed by existing components will be found here.
    const colors = {
      // ─ themeStore-shaped names (used by newer code) ──────────────────────
      bg:              tc.bg,
      bgCard:          tc.bgCard,
      bgElevated:      tc.bgElevated,
      surface:         tc.surface,
      border:          tc.border,
      borderAccent:    tc.borderAccent ?? tc.border,
      primary:         tc.primary,
      primaryDark:     tc.primaryDark,
      primaryBg:       tc.primaryBg,
      text:            tc.text,
      textSecondary:   tc.textSecondary ?? tc.text,
      textMuted:       tc.textMuted,
      textDisabled:    tc.textDisabled,
      textInverse:     tc.textInverse,
      candidate:       tc.candidate,
      freelancer:      tc.freelancer,
      company:         tc.company,
      organization:    tc.organization,
      success:         tc.success,
      successBg:       tc.successBg,
      warning:         tc.warning,
      warningBg:       tc.warningBg,
      danger:          tc.danger,
      dangerBg:        tc.dangerBg,
      info:            tc.info,
      infoBg:          tc.infoBg,
      overlay:         tc.overlay,
      skeleton:        tc.skeleton,
      shadowColor:     tc.shadowColor ?? '#000',
      tabBar:          tc.tabBar,
      tabActive:       tc.tabActive,
      tabInactive:     tc.tabInactive,
      tabBarBorder:    tc.tabBarBorder,
      inputBg:         tc.inputBg,
      inputBorder:     tc.inputBorder,
      inputBorderFocus:tc.inputBorderFocus,
      inputPlaceholder:tc.inputPlaceholder,

      // ─ Legacy useTheme API names (used by older components) ─────────────
      // Map to matching themeStore values so nothing breaks.
      accent:          tc.primary,
      accentDark:      tc.primaryDark,
      accentBg:        tc.primaryBg,
      bgPrimary:       tc.bg,
      bgSecondary:     tc.surface,
      borderPrimary:   tc.border,
      borderSecondary: tc.border,
      textPrimary:     tc.text,
      error:           tc.danger,
      errorBg:         tc.dangerBg,

      // Also bridge gold-specific names used in constants/theme/colors.ts
      // so legacy components that read theme.colors.accent still work:
      ...(tc as any),
    } as const;

    return {
      colors,
      radius: RADIUS_TOKENS,
      spacing: SPACING,
      type: TYPE,
      shadows,
      isDark: theme.isDark ?? false,
    };
  }, [theme]); // Properly depends on the entire theme object
};

export type Theme = ReturnType<typeof useTheme>;
export type ThemeColors = Theme['colors'];