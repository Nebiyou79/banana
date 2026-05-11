// =============================================================================
// FILE 3: mobile/src/social/services/messageService.ts — UPDATED
// =============================================================================

/**
 * mobile/src/social/services/messageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Message Service v4
 * 
 * Aligns with messageController.js v4:
 * - sendMessage enforces request acceptance for recipients
 * - deleteMessage supports 'me' and 'everyone' delete modes
 * - Proper content length limit (2000 chars, matches model)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api from '../../lib/api';
import type {
  Message,
  MessageResponse,
  MessageListResponse,
  SendMessagePayload,
} from '../types/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

/** Remove undefined / empty params */
const cleanParams = (p: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== '')
  );

// ─── Service ──────────────────────────────────────────────────────────────────

export const messageService = {
  /**
   * POST /api/v1/messages
   * Sends a new message in a conversation.
   * 
   * Backend enforces:
   * - 403 if recipient tries to reply before accepting
   * - 403 if conversation is declined
   * - Content max 2000 chars
   */
send: (payload: SendMessagePayload) => {
  // ─── DEBUG ───────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[messageService.send] CALLED');
  console.log('[messageService.send] payload.conversationId:', payload.conversationId);
  console.log('[messageService.send] payload.content:', payload.content?.substring(0, 50));
  console.log('[messageService.send] payload.type:', payload.type);
  console.log('[messageService.send] payload.replyTo:', payload.replyTo);
  console.log('[messageService.send] POST URL will be: /messages');
  console.log('[messageService.send] Full body:', JSON.stringify({
    conversationId: payload.conversationId,
    content: payload.content?.substring(0, 50),
    type: payload.type ?? 'text',
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
  }));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return api.post<MessageResponse>('/messages', {
    conversationId: payload.conversationId,
    content: payload.content,
    type: payload.type ?? 'text',
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
  });
},

  /**
   * GET /api/v1/messages/:conversationId
   * Returns paginated messages, newest-first.
   */
  getMessages: (conversationId: string, params: GetMessagesParams = {}) =>
    api.get<MessageListResponse>(`/messages/${conversationId}`, {
      params: cleanParams({ page: params.page ?? 1, limit: params.limit ?? 30 }),
    }),

  /**
   * DELETE /api/v1/messages/:messageId
   * Body: { deleteFor: 'me' | 'everyone' }
   * 
   * 'everyone' only works within 10 minutes and only for the sender.
   * 'me' soft-deletes only for the current user.
   */
  deleteMessage: (
    messageId: string,
    deleteFor: 'me' | 'everyone' = 'me'
  ) =>
    api.delete<{ success: boolean; message: string }>(`/messages/${messageId}`, {
      data: { deleteFor },
    }),
};

export default messageService;