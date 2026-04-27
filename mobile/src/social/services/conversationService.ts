// src/social/services/conversationService.ts
/**
 * conversationService
 * -----------------------------------------------------------------------------
 * Endpoints (per latest spec):
 *
 *   POST   /messages/conversations              start or get conversation
 *   GET    /messages/conversations              list active conversations
 *   GET    /messages/conversations/:id          get one conversation
 *   GET    /messages/requests                   list message requests
 *   PUT    /messages/requests/:id/accept        accept a request
 *   PUT    /messages/requests/:id/decline       decline a request
 *   PUT    /messages/conversations/:id/read     mark as read
 *   DELETE /messages/conversations/:id          soft delete (my view)
 *   GET    /messages/contacts/online            online contacts
 *
 * Backend gating before creating a conversation:
 *   • Mutual follow → status: 'active'
 *   • One-way follow → status: 'request'
 *   • No follow → 403 Forbidden
 */

import api from '../../lib/api';

export interface ConversationListParams {
  page?: number;
  limit?: number;
  filter?: string;
  q?: string;
}

export const conversationService = {
  /**
   * Start a conversation with another user, or fetch the existing one.
   * Idempotent. Backend enforces follow-status gating.
   *
   * Body: { userId, initialMessage? }
   */
  getOrCreateWith: (userId: string, initialMessage?: string) =>
    api.post('/messages/conversations', { userId, initialMessage }),

  // ── Lists ──────────────────────────────────────────────────────────────
  getMyConversations: (params: ConversationListParams = {}) =>
    api.get('/messages/conversations', {
      params: { page: 1, limit: 20, ...params },
    }),

  getMessageRequests: (params: ConversationListParams = {}) =>
    api.get('/messages/requests', {
      params: { page: 1, limit: 20, ...params },
    }),

  getById: (conversationId: string) =>
    api.get(`/messages/conversations/${conversationId}`),

  // ── Request flow ───────────────────────────────────────────────────────
  acceptRequest: (conversationId: string) =>
    api.put(`/messages/requests/${conversationId}/accept`),

  declineRequest: (conversationId: string) =>
    api.put(`/messages/requests/${conversationId}/decline`),

  // ── Housekeeping ───────────────────────────────────────────────────────
  markAsRead: (conversationId: string, messageId?: string) =>
    api.put(`/messages/conversations/${conversationId}/read`, { messageId }),

  /** Soft delete — removes the conversation from my view only. */
  deleteConversation: (conversationId: string) =>
    api.delete(`/messages/conversations/${conversationId}`),

  getOnlineContacts: () => api.get('/messages/contacts/online'),
};

export default conversationService;