/**
 * mobile/src/social/components/publicProfile/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Public-facing barrel export for all publicProfile components.
 * Import from this file rather than the individual paths so refactors
 * only need to touch one place.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { default as PublicProfileHeader }  from './PublicProfileHeader';
export type { PublicProfileHeaderProps }   from './PublicProfileHeader';

export {
  default as PublicProfileTabBar,
  usePublicTabs,
  TABS_BY_ROLE,
}                                          from './PublicProfileTabs';
export type { PublicTabKey }               from './PublicProfileTabs';

export { default as SocialDataTab }        from './SocialDataTab';
export type { SocialStats }                from './SocialDataTab';

export { default as VisibilitySheet }      from './VisibilitySheet';
export type { VisibilityState }            from './VisibilitySheet';

/**
 * HOOK BARREL ADDITIONS
 * ─────────────────────────────────────────────────────────────────────────────
 * Add the following exports to your existing
 *   mobile/src/social/hooks/index.ts
 * (paste alongside the existing exports — do NOT replace the file):
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // Public Profile (new dedicated backend)
 * export {
 *   PUB_PROFILE_KEYS,
 *   useMyPublicProfile,
 *   useUpdatePublicProfile,
 *   useTogglePublicVisibility,
 *   useSyncPublicProfile,
 *   usePublicProfileById,
 *   usePublicProfileByUsername,
 *   usePublicProfileSearch,
 *   useFeaturedPublicProfiles,
 * } from './usePublicProfileNew';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVICE BARREL ADDITIONS
 * ─────────────────────────────────────────────────────────────────────────────
 * Add to mobile/src/social/services/index.ts:
 *
 * export { publicProfileService }       from './publicProfileService';
 * export type {
 *   PublicProfileUpdateData,
 *   VisibilityUpdate,
 *   PublicProfileSearchParams,
 * }                                     from './publicProfileService';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */