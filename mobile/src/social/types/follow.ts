/**
 * Follow Types — v2 (no pending system)
 * -----------------------------------------------------------------------------
 * Status is simplified to 'active' | 'blocked'. There is NO pending/approval
 * flow. A "Connection" is derived (mutual follow) — not stored.
 *
 * Replaces the legacy Follow interface in types/index.ts. Import from here:
 *   import type { Follow, FollowStatus, ConnectionStatus } from '../types/follow';
 */

import type { UserRole, VerificationStatus, FollowTargetType } from './index';

export type FollowStatusValue = 'active' | 'blocked';

export type ValidFollowSource =
  | 'profile'
  | 'search'
  | 'suggestion'
  | 'feed'
  | 'network'
  | 'manual';

export interface FollowTarget {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  role?: UserRole;
  verificationStatus?: VerificationStatus;
}

/** Mongoose Follow document as returned from the API */
export interface Follow {
  _id: string;
  follower: string | FollowTarget;
  targetType: FollowTargetType;
  targetId: string | FollowTarget;
  followSource?: ValidFollowSource;
  status: FollowStatusValue;
  notifications?: boolean;
  followedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Follow status returned by GET /follow/:targetId/status */
export interface FollowStatus {
  following: boolean;
  followId?: string;
  status?: FollowStatusValue;
}

/** Bulk status map — keyed by targetId */
export interface BulkFollowStatus {
  [userId: string]: FollowStatus;
}

/** Toggle follow response */
export interface ToggleFollowResponse {
  following: boolean;
  isConnected: boolean;
  follow?: Follow;
}

/**
 * Derived relationship state used to render the FollowButton.
 * Order of precedence when multiple apply: blocked > connected > following >
 * follow_back > none.
 */
export type ConnectionStatus =
  | 'none' // Neither follows the other
  | 'following' // I follow them, they don't follow me
  | 'follow_back' // They follow me, I don't follow them
  | 'connected' // Mutual follow
  | 'blocked' // Either side is blocked
  | 'self'; // Looking at own profile

export interface IsConnectedResponse {
  isConnected: boolean; // mutual
  iFollow: boolean; // me → target
  theyFollow: boolean; // target → me
}

export interface FollowStats {
  followers: number;
  following: number;
  connections: number;
  /** Always 0 in the new system — kept for backward compatibility. */
  pendingRequests: 0;
}

export interface FollowListParams {
  page?: number;
  limit?: number;
}