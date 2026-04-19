/**
 * Shared spacing, sizing, and radius constants for the social module.
 * Pull from here instead of hardcoding pixel values in components.
 */
export const SOCIAL_LAYOUT = {
  postCardPadding: 16,
  avatarSm: 36, // comment avatars
  avatarMd: 44, // post header avatars
  avatarLg: 80, // profile page avatar
  coverHeight: 200,
  tabBarHeight: 60,
  bottomSheetBg: 'rgba(0,0,0,0.5)',
  postMediaMaxHeight: 400,
  postCardRadius: 12,
  chipRadius: 20,
  buttonRadius: 8,
  inputRadius: 10,
  minTouchTarget: 44,
} as const;

export type SocialLayout = typeof SOCIAL_LAYOUT;
