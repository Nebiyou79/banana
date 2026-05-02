// mobile/src/social/services/messageService.ts
import api from '../../lib/api';
import type { MessageType, SendMessagePayload } from '../types/chat';

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  before?: string; // cursor: messageId
}

const cleanParams = (p: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ''));

export const messageService = {
  // POST /api/v1/messages   body: { conversationId, content, type?, replyTo? }
  send: (payload: SendMessagePayload) =>
    api.post('/messages', {
      conversationId: payload.conversationId,
      content: payload.content,
      type: payload.type ?? 'text',
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    }),

  // GET /api/v1/messages/:conversationId?page=&limit=&before=
  getMessages: (conversationId: string, params: GetMessagesParams = {}) =>
    api.get(`/messages/${conversationId}`, {
      params: cleanParams({ page: 1, limit: 30, ...params }),
    }),

  // DELETE /api/v1/messages/:messageId   body: { deleteFor: 'me' | 'everyone' }
  deleteMessage: (
    _conversationId: string,   // kept in signature so existing callers don't break
    messageId: string,
    forEveryone = false,
  ) =>
    api.delete(`/messages/${messageId}`, {
      data: { deleteFor: forEveryone ? 'everyone' : 'me' },
    }),
};

export type { MessageType };
export default messageService;