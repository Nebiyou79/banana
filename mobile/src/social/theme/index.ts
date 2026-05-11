// src/social/theme/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central barrel for the social theme system.
// Updated to match the new role-based coloring architecture in socialTheme.ts
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Design tokens
  ROLE_COLORS,
  DARK_SOCIAL,
  LIGHT_SOCIAL,
  ROLE_SPLASH_LABELS,
  REACTION_EMOJI,
  SPACING,
  RADIUS,
  TYPE,
  withAlpha,
  // Hook
  useSocialTheme,
} from './socialTheme';

export type {
  SocialTheme,
  RoleType,
  RoleSurface,
  RolePalette,
  RoleTypography,
  RoleColors,
} from './socialTheme';

export {
  useFadeIn,
  useSlideUp,
  useStaggeredEntry,
  usePressScale,
  useLikeBurst,
  useSkeletonPulse,
  useSkeletonShimmer,
  useTabIndicator,
  useHeaderCollapse,
  useNotificationBounce,
  useSplashEntrance,
} from './animations';

export {
  ADS_CONFIG,
  getAdForPlacement,
  injectAdsIntoFeed,
} from './adsConfig';

export {
  getRoleBadgeStyle,
  getFollowButtonStyle,
  getAdCardStyle,
  getPostCardStyle,
  getSkeletonStyle,
} from './styleHelpers';

export type {
  RoleBadgeOptions,
  RoleBadgeStyle,
  FollowButtonOptions,
  FollowButtonStyle,
  AdCardStyle,
  PostCardStyle,
} from './styleHelpers';

export { SOCIAL_LAYOUT } from './layout';
export type { SocialLayout } from './layout';