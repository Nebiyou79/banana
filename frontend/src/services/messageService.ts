/**
 * frontend/src/services/messageService.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Message Service (web, NEW)
 * ────────────────────────────────────────────────────────────────────────────
 */
import api from '@/lib/axios';
import type { Pagination } from './conversationService';

export type MessageType = 'text' | 'emoji' | 'image' | 'system' | 'deleted';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageSender {
  _id: string;
  name: string;
  avatar?: string | { url?: string; secure_url?: string };
  role?: string;
}

export interface ReplyToPreview {
  _id: string;
  content: string | null;
  type: MessageType;
  sender: MessageSender;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: MessageSender;
  content: string | null;
  type: MessageType;
  status: MessageStatus;
  readBy: Array<{ user: string; readAt: string }>;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedFor?: string[];
  canDeleteUntil?: string | null;
  replyTo?: ReplyToPreview | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
  pagination: Pagination;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyTo?: string | null;
}

export const messageService = {
  // POST /messages
  send: (data: SendMessagePayload) =>
    api.post<{ success: boolean; data: Message }>('/messages', data),

  // GET /messages/:conversationId
  getMessages: (
    conversationId: string,
    params?: { page?: number; limit?: number; before?: string }
  ) =>
    api.get<MessagesResponse>(`/messages/${conversationId}`, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 30,
        ...(params?.before ? { before: params.before } : {}),
      },
    }),

  // DELETE /messages/:messageId
  delete: (messageId: string, deleteFor: 'me' | 'everyone' = 'me') =>
    api.delete<{ success: boolean }>(`/messages/${messageId}`, {
      data: { deleteFor },
    }),
};

export default messageService;