/**
 * mobile/src/social/services/conversationService.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Conversation Service (mobile, NEW)
 *
 * Parity note: every method name, path, and body shape matches
 * frontend/src/services/conversationService.ts.
 * ────────────────────────────────────────────────────────────────────────────
 */
import api from '../../lib/api';

export type ConversationStatus = 'active' | 'request' | 'declined';

export interface ConversationParticipant {
  _id: string;
  name: string;
  avatar?: string | { url?: string; secure_url?: string };
  role?: string;
  headline?: string;
  lastSeen?: string;
  isOnline?: boolean;
  verificationStatus?: 'none' | 'partial' | 'full';
}

export interface LastMessagePreview {
  _id: string;
  content: string | null;
  type: 'text' | 'emoji' | 'image' | 'system' | 'deleted';
  sender: string | { _id: string; name: string };
  createdAt: string;
  readBy?: Array<{ user: string; readAt: string }>;
  deletedAt?: string | null;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  type: 'direct';
  status: ConversationStatus;
  requestedBy?: string | null;
  lastMessage?: LastMessagePreview | null;
  lastMessageAt: string;
  unreadCounts?: Record<string, number>;
  deletedFor?: string[];
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  otherParticipant: ConversationParticipant | null;
}

export interface ConversationListParams {
  page?: number;
  limit?: number;
  status?: ConversationStatus;
}

export const conversationService = {
  // GET /conversations
  getMyConversations: (params: ConversationListParams = {}) =>
    api.get('/conversations', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status ?? 'active',
      },
    }),

  // POST /conversations/with/:userId
  getOrCreate: (userId: string) =>
    api.post(`/conversations/with/${userId}`),

  // GET /conversations/requests
  getRequests: (params: { page?: number; limit?: number } = {}) =>
    api.get('/conversations/requests', {
      params: { page: params.page ?? 1, limit: params.limit ?? 20 },
    }),

  // GET /conversations/contacts/online
  getOnlineContacts: (limit = 30) =>
    api.get('/conversations/contacts/online', { params: { limit } }),

  // GET /conversations/:id
  getById: (id: string) => api.get(`/conversations/${id}`),

  // PUT /conversations/:id/accept
  accept: (id: string) => api.put(`/conversations/${id}/accept`),

  // PUT /conversations/:id/decline
  decline: (id: string) => api.put(`/conversations/${id}/decline`),

  // PUT /conversations/:id/read
  markRead: (id: string) => api.put(`/conversations/${id}/read`),

  // DELETE /conversations/:id
  delete: (id: string) => api.delete(`/conversations/${id}`),
};

export default conversationService;