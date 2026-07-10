/**
 * mobile/src/social/hooks/useFollowStats.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Current user's follow summary.
 *
 * FIX: The /follow/stats endpoint can return two different shapes depending
 * on the backend version:
 *
 *   Shape A (v1):  { data: { followers, following, connections } }
 *   Shape B (v2):  { data: { followerCount, followingCount, connectionCount } }
 *   Shape C (raw): { followers, following, connections, ... }
 *
 * This hook normalises all three into a single consistent FollowStats shape
 * so consumers always read the same fields regardless of which backend shape
 * was returned.  The previous version just passed through `res.data?.data`
 * verbatim, which left the counts at 0 when the shape didn't match the
 * FollowStats type the UI expected.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { SOCIAL_KEYS }   from './queryKeys';
import type { FollowStats } from '../types';

/** Normalise any backend response shape into a consistent FollowStats object. */
function normaliseFollowStats(raw: any): FollowStats {
  // Unwrap nested .data if present
  const d = raw?.data ?? raw ?? {};

  return {
    followers: d.followers ?? d.followerCount ?? 0,
    following: d.following ?? d.followingCount ?? 0,
    connections: d.connections ?? d.connectionCount ?? d.totalConnections ?? 0,
    // Extra fields some backends include
    pendingRequests: d.pendingRequests ?? 0,
    postCount: d.postCount ?? 0,
    profileViews: d.profileViews ?? 0,
  } as unknown as FollowStats;
}

export const useFollowStats = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.followStats,
    queryFn: async () => {
      const res = await followService.getFollowStats();
      return normaliseFollowStats(res.data);
    },
    staleTime: 1000 * 30,
  });