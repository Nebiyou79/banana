// src/utils/userGuards.ts
// ─── Type guards and user predicates ─────────────────────────────────────────

export const isVerified = (u?: { verificationStatus?: string }): boolean =>
  u?.verificationStatus === 'verified';

export const isBlocked = (u?: { relationshipStatus?: string }): boolean =>
  u?.relationshipStatus === 'blocked';

export const isFollowing = (u?: { isFollowing?: boolean }): boolean =>
  u?.isFollowing === true;