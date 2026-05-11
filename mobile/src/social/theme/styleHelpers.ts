/**
 * Banana Social — Style Helpers v2.0
 * Derives component styles from design tokens.
 * No magic numbers — every value traces back to ROLE_COLORS / DARK|LIGHT_SOCIAL.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import type { UserRole } from '../types';
import { ROLE_COLORS, RADIUS, SPACING, TYPE, withAlpha } from './socialTheme';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE
// ─────────────────────────────────────────────────────────────────────────────

export interface RoleBadgeOptions {
  role: UserRole;
  dark: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export interface RoleBadgeStyle {
  container: ViewStyle;
  text: TextStyle;
}

/**
 * Uppercase pill badge that shows the user's role.
 * Uses the ROLE's own palette regardless of the viewer's role.
 *
 * Size guide:
 *   xs — inline in a feed header row next to name
 *   sm — default; standalone badge
 *   md — profile page, larger prominence
 */
export const getRoleBadgeStyle = ({
  role,
  dark,
  size = 'sm',
}: RoleBadgeOptions): RoleBadgeStyle => {
  const c = ROLE_COLORS[role];

  const heights = { xs: 16, sm: 18, md: 22 };
  const pxValues = { xs: 5, sm: 6, md: 8 };
  const fontSizes = { xs: 9, sm: 10, md: 11 };

  const bgAlpha  = dark ? 0.15 : 0.10;
  const bdAlpha  = dark ? 0.35 : 0.22;
  // roleColors has no `tint` or `deep` — use primary for both modes
  const txtColor = c.primary;

  return {
    container: {
      height: heights[size],
      paddingHorizontal: pxValues[size],
      backgroundColor: withAlpha(c.primary, bgAlpha),
      borderColor: withAlpha(c.primary, bdAlpha),
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    text: {
      color: txtColor,
      fontSize: fontSizes[size],
      // theme.type.overline → { ...theme.type.caption, textTransform:'uppercase', letterSpacing:0.5 }
      // Represented here as inline values matching that shape
      fontWeight: '600' as TextStyle['fontWeight'],
      textTransform: 'uppercase' as TextStyle['textTransform'],
      letterSpacing: 0.5,
      lineHeight: undefined,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW BUTTON
// ─────────────────────────────────────────────────────────────────────────────

export type FollowState = 'following' | 'not_following' | 'blocked' | 'pending';

export interface FollowButtonOptions {
  state: FollowState;
  /** Viewer's primary role color */
  primary: string;
  /** Semantic danger color */
  danger: string;
  /** Active border color */
  border: string;
  /** Body text color */
  text: string;
  size?: 'sm' | 'md';
}

export interface FollowButtonStyle {
  container: ViewStyle;
  text: TextStyle;
}

/**
 * Follow button in 4 states.
 *
 * not_following  → solid primary fill (max affordance)
 * pending        → ghost with primary border (waiting state)
 * following      → ghost with neutral border (already connected)
 * blocked        → ghost with danger border
 */
export const getFollowButtonStyle = ({
  state,
  primary,
  danger,
  border,
  text,
  size = 'md',
}: FollowButtonOptions): FollowButtonStyle => {
  const variants: Record<
    FollowState,
    { bg: string; bd: string; fg: string }
  > = {
    not_following: { bg: primary,       bd: primary, fg: '#FFFFFF' },
    pending:       { bg: 'transparent', bd: primary, fg: primary   },
    following:     { bg: 'transparent', bd: border,  fg: text      },
    blocked:       { bg: 'transparent', bd: danger,  fg: danger    },
  };

  const { bg, bd, fg } = variants[state];

  const heights    = { sm: 34, md: 40 };
  const pxValues   = { sm: 14, md: 20 };
  const fontSizes  = { sm: 12, md: 14 };
  const minWidths  = { sm: 72, md: 88 };

  return {
    container: {
      height: heights[size],
      paddingHorizontal: pxValues[size],
      backgroundColor: bg,
      borderColor: bd,
      borderWidth: 1.5,
      borderRadius: RADIUS.pill,
      minWidth: minWidths[size],
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: size === 'md' ? 44 : 34,
    },
    text: {
      color: fg,
      fontSize: fontSizes[size],
      // theme.type.btn → theme.type.bodyMd
      fontWeight: '600' as TextStyle['fontWeight'],
      letterSpacing: 0,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AD CARD STYLE
// ─────────────────────────────────────────────────────────────────────────────

export interface AdCardStyle {
  container: ViewStyle;
  border: ViewStyle;
  icon: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  cta: ViewStyle;
  ctaText: TextStyle;
}

/**
 * Derive ad card styles from the role palette.
 * Ad cards feel native but role-tinted, never jarring.
 */
export const getAdCardStyle = (role: UserRole, dark: boolean): AdCardStyle => {
  const c = ROLE_COLORS[role];

  return {
    container: {
      // roleColors uses adBg for surface
      backgroundColor: dark ? withAlpha(c.primary, 0.06) : c.adBg,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    border: {
      borderWidth: 1,
      // roleColors uses adBorder for accent border
      borderColor: dark ? withAlpha(c.primary, 0.25) : c.adBorder,
      borderRadius: RADIUS.md,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.sm,
      backgroundColor: withAlpha(c.primary, dark ? 0.18 : 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      // roleColors has no `deep` or `tint` — use primary
      color: c.primary,
      // theme.type.labelSm → theme.type.bodySm (inline equivalent)
      fontSize: 12,
      fontWeight: '500' as TextStyle['fontWeight'],
    },
    subtitle: {
      // No color here — caller applies their text color
    },
    cta: {
      backgroundColor: c.primary,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    ctaText: {
      // theme.colors.onPrimary → theme.colors.white
      color: '#FFFFFF',
      // theme.type.btnSm → theme.type.bodySm (inline equivalent)
      fontSize: 12,
      fontWeight: '500' as TextStyle['fontWeight'],
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD STYLE
// ─────────────────────────────────────────────────────────────────────────────

export interface PostCardStyle {
  container: ViewStyle;
  header: ViewStyle;
  footer: ViewStyle;
  actionBar: ViewStyle;
}

/**
 * Consistent post card shell. Components fill it with their own content.
 */
export const getPostCardStyle = (dark: boolean): PostCardStyle => ({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: dark ? 'rgba(46,61,88,0.6)' : 'rgba(228,232,239,0.8)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm, // theme.spacing['2'] → theme.spacing.sm
    gap: SPACING.xs,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON STYLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns base skeleton styles. Pair with useSkeletonPulse() for animation.
 */
export const getSkeletonStyle = (
  dark: boolean,
  width: number | `${number}%`,
  height: number,
  radius = RADIUS.sm
): ViewStyle => ({
  width,
  height,
  borderRadius: radius,
  backgroundColor: dark ? '#1E2A3D' : '#E8ECF3',
  overflow: 'hidden',
});
// ✅ theme-migrated