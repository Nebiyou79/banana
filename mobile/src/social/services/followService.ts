// src/social/services/followService.ts
import api from '../../lib/api';
import type { FollowTargetType } from '../types';

export type ValidFollowSource = 'profile' | 'search' | 'suggestion' | 'feed';

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

  // GET /follow/stats
  getFollowStats: () => api.get('/follow/stats'),

  // GET /follow/suggestions
  getFollowSuggestions: (limit = 10) =>
    api.get('/follow/suggestions', { params: { limit } }),

  // GET /follow/pending
  getPendingRequests: () => api.get('/follow/pending'),

  // PUT /follow/:followId/accept
  acceptFollowRequest: (followId: string) =>
    api.put(`/follow/${followId}/accept`),

  // PUT /follow/:followId/reject
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