/**
 * followService — v2
 * -----------------------------------------------------------------------------
 * Aligns with backend Follow model v2:
 *   - status: 'active' | 'blocked'   (no more pending/accepted/rejected)
 *   - followSource enum extended with 'network', 'profile', 'feed'
 *
 * Surface: every web method exists with the same signature + body shape.
 */

import api from '../../lib/api';
import type { FollowTargetType } from '../types';
import type {
  ValidFollowSource,
  FollowListParams,
  IsConnectedResponse,
} from '../types/follow';

export type { ValidFollowSource };

export const followService = {
  // ────────────────────────────────────────────────────────────────────────
  // Toggle follow/unfollow — returns { following, isConnected, follow }
  // POST /follow/:targetId  body: { targetType, followSource }
  // ────────────────────────────────────────────────────────────────────────
  toggleFollow: (
    targetId: string,
    targetType: FollowTargetType = 'User',
    followSource: ValidFollowSource = 'profile',
  ) => api.post(`/follow/${targetId}`, { targetType, followSource }),

  // GET /follow/:targetId/status?targetType=User
  getFollowStatus: (targetId: string, targetType: FollowTargetType = 'User') =>
    api.get(`/follow/${targetId}/status`, { params: { targetType } }),

  // POST /follow/bulk-status  body: { userIds, targetType }
  getBulkFollowStatus: (
    userIds: string[],
    targetType: FollowTargetType = 'User',
  ) => api.post('/follow/bulk-status', { userIds, targetType }),

  // ────────────────────────────────────────────────────────────────────────
  // Lists
  // ────────────────────────────────────────────────────────────────────────
  getFollowers: (params: FollowListParams = {}) =>
    api.get('/follow/followers', { params: { page: 1, limit: 20, ...params } }),

  getFollowing: (params: FollowListParams = {}) =>
    api.get('/follow/following', { params: { page: 1, limit: 20, ...params } }),

  getPublicFollowers: (userId: string, params: FollowListParams = {}) =>
    api.get(`/follow/public/followers/${userId}`, {
      params: { page: 1, limit: 20, ...params },
    }),

  getPublicFollowing: (userId: string, params: FollowListParams = {}) =>
    api.get(`/follow/public/following/${userId}`, {
      params: { page: 1, limit: 20, ...params },
    }),

  // ────────────────────────────────────────────────────────────────────────
  // Connections (NEW) — mutual follows
  // ────────────────────────────────────────────────────────────────────────
  getConnections: (params: FollowListParams = {}) =>
    api.get('/follow/connections', {
      params: { page: 1, limit: 20, ...params },
    }),

  // GET /follow/:userId/is-connected
  isConnected: (userId: string) =>
    api.get<{ success: boolean; data: IsConnectedResponse }>(
      `/follow/${userId}/is-connected`,
    ),

  // ────────────────────────────────────────────────────────────────────────
  // Stats & discovery
  // ────────────────────────────────────────────────────────────────────────
  getFollowStats: () => api.get('/follow/stats'),

  getFollowSuggestions: (
    limit = 10,
    algorithm: 'popular' | 'skills' | 'connections' | 'hybrid' = 'hybrid',
  ) => api.get('/follow/suggestions', { params: { limit, algorithm } }),

  // ────────────────────────────────────────────────────────────────────────
  // Moderation
  // ────────────────────────────────────────────────────────────────────────
  blockUser: (targetId: string) => api.post(`/follow/${targetId}/block`),
};

export default followService;