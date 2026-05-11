// =============================================================================
// FILE 2: mobile/src/social/services/conversationService.ts — UPDATED
// =============================================================================

/**
 * mobile/src/social/services/conversationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Conversation Service v4
 * 
 * Aligns with conversationController.js v4:
 * - getAll returns active + request conversations with requestsCount
 * - getRequests returns RECIPIENT-only requests (backend enforces)
 * - markAsRead maps to PUT /conversations/:id/read
 * - Proper URL construction with clean params
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api from '../../lib/api';
import type {
  ConversationResponse,
  ConversationListResponse,
  OnlineContact,
} from '../types/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationListParams {
  page?: number;
  limit?: number;
}

/** Remove undefined / empty-string params so axios doesn't send ?q=&filter= */
const cleanParams = (p: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== '')
  );

// ─── Service ──────────────────────────────────────────────────────────────────

export const conversationService = {
  /**
   * POST /api/v1/conversations/with/:userId
   * Creates or retrieves a DM conversation with the target user.
   * Returns { success, data: Conversation, created: boolean }
   */
getOrCreateWith: (userId: string) => {
  // ─── DEBUG ───────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[conversationService.getOrCreateWith] CALLED');
  console.log('[conversationService.getOrCreateWith] userId:', userId);
  console.log('[conversationService.getOrCreateWith] userId type:', typeof userId);
  console.log('[conversationService.getOrCreateWith] userId length:', userId?.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return api.post(`/conversations/with/${userId}`);
},

  /**
   * GET /api/v1/conversations
   * Returns all non-declined conversations (active + request).
   * Includes requestsCount inline for badge display.
   */
  getMyConversations: (params: ConversationListParams = {}) =>
    api.get<ConversationListResponse>('/conversations', {
      params: cleanParams({ page: params.page ?? 1, limit: params.limit ?? 20 }),
    }),

  /**
   * GET /api/v1/conversations/requests
   * Returns ONLY conversations where the user is the RECIPIENT of a
   * message request (backend enforces requestedBy !== userId).
   */
  getMessageRequests: (params: ConversationListParams = {}) =>
    api.get<ConversationListResponse>('/conversations/requests', {
      params: cleanParams({ page: params.page ?? 1, limit: params.limit ?? 20 }),
    }),

  /**
   * GET /api/v1/conversations/:id
   */
  getById: (conversationId: string) =>
    api.get<ConversationResponse>(`/conversations/${conversationId}`),

  /**
   * PUT /api/v1/conversations/:id/accept
   * Accepts a pending message request. Only the RECIPIENT can accept.
   */
  acceptRequest: (conversationId: string) =>
    api.put<ConversationResponse>(`/conversations/${conversationId}/accept`),

  /**
   * PUT /api/v1/conversations/:id/decline
   * Declines a pending message request. Only the RECIPIENT can decline.
   */
  declineRequest: (conversationId: string) =>
    api.put<{ success: boolean; message: string }>(
      `/conversations/${conversationId}/decline`
    ),

  /**
   * PUT /api/v1/conversations/:id/read
   * Marks conversation as read — resets unreadCount and marks all
   * messages as read for the current user.
   */
  markAsRead: (conversationId: string) =>
    api.put<{ success: boolean; readAt: string }>(
      `/conversations/${conversationId}/read`
    ),

  /**
   * DELETE /api/v1/conversations/:id
   * Soft-deletes the conversation for the current user only.
   */
  deleteConversation: (conversationId: string) =>
    api.delete<{ success: boolean; message: string }>(
      `/conversations/${conversationId}`
    ),

  /**
   * GET /api/v1/conversations/contacts/online
   * Returns online users from the current user's conversations.
   */
  getOnlineContacts: () =>
    api.get<{ success: boolean; data: OnlineContact[] }>(
      '/conversations/contacts/online'
    ),
};

export default conversationService;