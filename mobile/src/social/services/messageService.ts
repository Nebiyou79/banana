// src/social/services/messageService.ts
/**
 * messageService
 * -----------------------------------------------------------------------------
 * Endpoints (per latest spec):
 *
 *   POST   /messages/conversations/:id/messages   send a message
 *   GET    /messages/conversations/:id/messages   list messages
 *   DELETE /messages/conversations/:id/messages/:messageId
 */

import api from '../../lib/api';
import type { MessageType, SendMessagePayload } from '../types/chat';

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  before?: string;
}

export const messageService = {
  send: (payload: SendMessagePayload) =>
    api.post(`/messages/conversations/${payload.conversationId}/messages`, {
      content: payload.content,
      type: payload.type ?? 'text',
      replyTo: payload.replyTo,
    }),

  getMessages: (conversationId: string, params: GetMessagesParams = {}) =>
    api.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page: 1, limit: 30, ...params },
    }),

  deleteMessage: (
    conversationId: string,
    messageId: string,
    forEveryone = false,
  ) =>
    api.delete(
      `/messages/conversations/${conversationId}/messages/${messageId}`,
      { params: { forEveryone: forEveryone ? 1 : 0 } },
    ),
};

export type { MessageType };
export default messageService;