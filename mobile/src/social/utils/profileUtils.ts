// src/social/utils/profileUtils.ts

/**
 * Resolve a cover-photo URL from a profile object that can come back from
 * the API in any of several shapes:
 *   profile.coverPhoto.secure_url
 *   profile.coverPhoto                 (plain string)
 *   profile.cover.secure_url
 *   profile.cover                      (plain string)
 *   profile.user.coverPhoto
 */
export const getCoverUrl = (profile: any): string | null => {
  if (!profile) return null;
  return (
    profile?.coverPhoto?.secure_url ||
    (typeof profile?.coverPhoto === 'string' ? profile.coverPhoto : null) ||
    profile?.cover?.secure_url ||
    (typeof profile?.cover === 'string' ? profile.cover : null) ||
    profile?.user?.coverPhoto?.secure_url ||
    (typeof profile?.user?.coverPhoto === 'string'
      ? profile.user.coverPhoto
      : null) ||
    null
  );
};

/**
 * Resolve the avatar URL the same way — multiple fallback keys.
 */
export const getAvatarUrl = (profile: any): string | null => {
  if (!profile) return null;
  return (
    profile?.avatar?.secure_url ||
    (typeof profile?.avatar === 'string' ? profile.avatar : null) ||
    profile?.user?.avatar?.secure_url ||
    (typeof profile?.user?.avatar === 'string'
      ? profile.user.avatar
      : null) ||
    null
  );
};