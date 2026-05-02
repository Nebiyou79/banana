// mobile/src/social/services/conversationService.ts
import api from '../../lib/api';

export interface ConversationListParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'request' | 'declined';
  filter?: string;       // kept for backwards compat in callers; not sent if undefined
  q?: string;
}

const cleanParams = (p: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ''));

export const conversationService = {
  // POST /api/v1/conversations/with/:userId
  // Body: { initialMessage? } — userId is in the path. The backend ignores unknown body fields.
  getOrCreateWith: (userId: string, initialMessage?: string) =>
    api.post(`/conversations/with/${userId}`, initialMessage ? { initialMessage } : {}),

  // GET /api/v1/conversations?page=&limit=&status=
  getMyConversations: (params: ConversationListParams = {}) =>
    api.get('/conversations', {
      params: cleanParams({ page: 1, limit: 20, status: 'active', ...params }),
    }),

  // GET /api/v1/conversations/requests?page=&limit=
  getMessageRequests: (params: ConversationListParams = {}) =>
    api.get('/conversations/requests', {
      params: cleanParams({ page: 1, limit: 20, ...params }),
    }),

  // GET /api/v1/conversations/:id
  getById: (conversationId: string) =>
    api.get(`/conversations/${conversationId}`),

  // PUT /api/v1/conversations/:id/accept
  acceptRequest: (conversationId: string) =>
    api.put(`/conversations/${conversationId}/accept`),

  // PUT /api/v1/conversations/:id/decline
  declineRequest: (conversationId: string) =>
    api.put(`/conversations/${conversationId}/decline`),

  // PUT /api/v1/conversations/:id/read   (body optional: { messageId })
  markAsRead: (conversationId: string, messageId?: string) =>
    api.put(`/conversations/${conversationId}/read`, messageId ? { messageId } : {}),

  // DELETE /api/v1/conversations/:id   (soft delete for me)
  deleteConversation: (conversationId: string) =>
    api.delete(`/conversations/${conversationId}`),

  // GET /api/v1/conversations/contacts/online
  getOnlineContacts: () => api.get('/conversations/contacts/online'),
};

export default conversationService;