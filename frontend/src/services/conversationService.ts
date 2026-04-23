/**
 * frontend/src/services/conversationService.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Conversation Service (web, NEW)
 *
 * Signatures mirror mobile/src/social/services/conversationService.ts so both
 * clients call the same contract.
 * ────────────────────────────────────────────────────────────────────────────
 */
import api from '@/lib/axios';

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
  // Enriched by the backend for the current viewer:
  unreadCount: number;
  otherParticipant: ConversationParticipant | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination: Pagination;
}

export interface ConversationResponse {
  success: boolean;
  data: Conversation;
  created?: boolean;
}

export const conversationService = {
  // GET /conversations
  getMyConversations: (params?: {
    page?: number;
    limit?: number;
    status?: ConversationStatus;
  }) =>
    api.get<ConversationsResponse>('/conversations', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        status: params?.status ?? 'active',
      },
    }),

  // POST /conversations/with/:userId
  getOrCreate: (userId: string) =>
    api.post<ConversationResponse>(`/conversations/with/${userId}`),

  // GET /conversations/requests
  getRequests: (params?: { page?: number; limit?: number }) =>
    api.get<ConversationsResponse>('/conversations/requests', { params }),

  // GET /conversations/contacts/online
  getOnlineContacts: (params?: { limit?: number }) =>
    api.get<{ success: boolean; data: ConversationParticipant[] }>(
      '/conversations/contacts/online',
      { params }
    ),

  // GET /conversations/:id
  getById: (id: string) =>
    api.get<ConversationResponse>(`/conversations/${id}`),

  // PUT /conversations/:id/accept
  accept: (id: string) =>
    api.put<{ success: boolean; data: Conversation }>(
      `/conversations/${id}/accept`
    ),

  // PUT /conversations/:id/decline
  decline: (id: string) =>
    api.put<{ success: boolean; data: Conversation }>(
      `/conversations/${id}/decline`
    ),

  // PUT /conversations/:id/read
  markRead: (id: string) =>
    api.put<{ success: boolean }>(`/conversations/${id}/read`),

  // DELETE /conversations/:id
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/conversations/${id}`),
};

export default conversationService;