/**
 * mobile/src/social/services/followService.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Follow Service (mobile)
 *
 * Phase 0 fix: ValidFollowSource now includes 'network' and 'manual' — so the
 * NetworkScreen's `source: 'network'` no longer fails backend enum validation.
 *
 * Phase 1 additions (parity with web):
 *  - getConnections
 *  - isConnected
 *  - blockUser
 * ────────────────────────────────────────────────────────────────────────────
 */
import api from '../../lib/api';
import type { FollowTargetType } from '../types';

export type ValidFollowSource =
  | 'profile'
  | 'search'
  | 'suggestion'
  | 'feed'
  | 'network'
  | 'manual';

export interface FollowListParams {
  page?: number;
  limit?: number;
}

export const followService = {
  // POST /follow/:targetId
  toggleFollow: (
    targetId: string,
    targetType: FollowTargetType = 'User',
    followSource: ValidFollowSource = 'profile'
  ) => api.post(`/follow/${targetId}`, { targetType, followSource }),

  // GET /follow/:targetId/status
  getFollowStatus: (targetId: string, targetType: FollowTargetType = 'User') =>
    api.get(`/follow/${targetId}/status`, { params: { targetType } }),

  // POST /follow/bulk-status
  getBulkFollowStatus: (
    userIds: string[],
    targetType: FollowTargetType = 'User'
  ) => api.post('/follow/bulk-status', { userIds, targetType }),

  // GET /follow/followers
  getFollowers: (params: FollowListParams = {}) =>
    api.get('/follow/followers', { params: { page: 1, limit: 20, ...params } }),

  // GET /follow/following
  getFollowing: (params: FollowListParams = {}) =>
    api.get('/follow/following', { params: { page: 1, limit: 20, ...params } }),

  // GET /follow/connections  (NEW in v2)
  getConnections: (params: FollowListParams = {}) =>
    api.get('/follow/connections', {
      params: { page: 1, limit: 20, ...params },
    }),

  // GET /follow/:userId/is-connected  (NEW in v2)
  isConnected: (userId: string) =>
    api.get(`/follow/${userId}/is-connected`),

  // POST /follow/:targetId/block  (NEW in v2)
  blockUser: (targetId: string) => api.post(`/follow/${targetId}/block`),

  // GET /follow/stats
  getFollowStats: () => api.get('/follow/stats'),

  // GET /follow/suggestions
  getFollowSuggestions: (
    limit = 10,
    algorithm: 'popular' | 'skills' | 'connections' | 'hybrid' = 'hybrid'
  ) => api.get('/follow/suggestions', { params: { limit, algorithm } }),

  // GET /follow/pending — legacy, kept for FE compatibility (always empty).
  getPendingRequests: () => api.get('/follow/pending'),

  // PUT /follow/:followId/accept — legacy no-op.
  acceptFollowRequest: (followId: string) =>
    api.put(`/follow/${followId}/accept`),

  // PUT /follow/:followId/reject — legacy no-op.
  rejectFollowRequest: (followId: string) =>
    api.put(`/follow/${followId}/reject`),

  // GET /follow/public/followers/:targetId
  getPublicFollowers: (targetId: string, params: FollowListParams = {}) =>
    api.get(`/follow/public/followers/${targetId}`, {
      params: { page: 1, limit: 20, ...params },
    }),

  // GET /follow/public/following/:targetId
  getPublicFollowing: (targetId: string, params: FollowListParams = {}) =>
    api.get(`/follow/public/following/${targetId}`, {
      params: { page: 1, limit: 20, ...params },
    }),
};

export default followService;