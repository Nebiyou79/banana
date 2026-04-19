import api from '../../lib/api';
import type { ReactionType, TargetType } from '../types';

/**
 * Like / Interaction service. The backend treats reactions (like/love/etc.) and
 * dislikes as two branches of a single Interaction model. A user can only have
 * one active interaction per target at a time.
 */
export const likeService = {
  // POST /likes/:id/react
  addReaction: (
    targetId: string,
    targetType: TargetType,
    reaction: ReactionType
  ) => api.post(`/likes/${targetId}/react`, { targetType, reaction }),

  // POST /likes/:id/dislike
  addDislike: (targetId: string, targetType: TargetType) =>
    api.post(`/likes/${targetId}/dislike`, { targetType }),

  // DELETE /likes/:id/interact
  removeInteraction: (targetId: string, targetType: TargetType) =>
    api.delete(`/likes/${targetId}/interact`, { data: { targetType } }),

  // PUT /likes/:id/react (switch reaction e.g. like → love)
  updateReaction: (
    targetId: string,
    targetType: TargetType,
    reaction: ReactionType
  ) => api.put(`/likes/${targetId}/react`, { targetType, reaction }),

  // POST /likes/:id/toggle
  toggleReaction: (
    targetId: string,
    targetType: TargetType,
    reaction?: ReactionType
  ) => api.post(`/likes/${targetId}/toggle`, { targetType, reaction }),

  // GET /likes/:id/reactions
  getReactions: (targetId: string, targetType: TargetType) =>
    api.get(`/likes/${targetId}/reactions`, { params: { targetType } }),

  // GET /likes/:id/dislikes
  getDislikes: (targetId: string, targetType: TargetType) =>
    api.get(`/likes/${targetId}/dislikes`, { params: { targetType } }),

  // GET /likes/:id/stats
  getInteractionStats: (targetId: string, targetType: TargetType) =>
    api.get(`/likes/${targetId}/stats`, { params: { targetType } }),

  // GET /likes/:id/user-interaction
  getUserInteraction: (targetId: string, targetType: TargetType) =>
    api.get(`/likes/${targetId}/user-interaction`, { params: { targetType } }),

  // POST /likes/bulk/status
  getBulkInteractionStatus: (targetIds: string[], targetType: TargetType) =>
    api.post('/likes/bulk/status', { targetIds, targetType }),
};

export default likeService;
