// =============================================================================
// FILE 1: mobile/src/social/types/chat.ts — COMPLETE TYPES DEFINITION
// =============================================================================

/**
 * mobile/src/social/types/chat.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Chat Types v4 — Complete type definitions for chat system
 * 
 * Aligns with backend models:
 * - Conversation model (Conversation.js)
 * - Message model (Message.js)
 * - Controller response shapes
 * - Socket event payloads
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── User (minimal participant info) ─────────────────────────────────────────

export interface ChatUser {
  _id: string;
  name: string;
  avatar?: string | null;
  role?: string;
  headline?: string | null;
  lastSeen?: string | null;
  isOnline?: boolean;
  verificationStatus?: 'none' | 'partial' | 'full';
  socialStats?: {
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
  };
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export type ConversationStatus = 'active' | 'request' | 'declined';
export type ConversationType = 'direct';

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  type: ConversationType;
  status: ConversationStatus;
  requestedBy?: string | null;
  lastMessage?: Message | null;
  lastMessageAt: string;
  unreadCounts?: Record<string, number>;
  unreadCount?: number;        // Computed for viewer (injected by enrichForViewer)
  deletedFor?: string[];
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  // ─── Viewer-specific fields (injected by enrichForViewer) ───────────
  otherUser?: ChatUser | null;
  viewerRole?: 'requester' | 'recipient';
}

// ─── Message ──────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'emoji' | 'image' | 'system' | 'deleted';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ReadReceipt {
  user: string;
  readAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string | ChatUser;
  content: string | null;
  type: MessageType;
  status: MessageStatus;
  readBy: ReadReceipt[];
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedFor?: string[];
  replyTo?: Message | string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ConversationResponse {
  success: boolean;
  data: Conversation;
  created?: boolean;
}

export interface ConversationListResponse {
  success: boolean;
  data: Conversation[];
  requestsCount?: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MessageResponse {
  success: boolean;
  data: Message;
}

export interface MessageListResponse {
  success: boolean;
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OnlineContact {
  _id: string;
  name: string;
  avatar?: string | null;
  isOnline: boolean;
  lastSeen?: string | null;
  headline?: string | null;
  role?: string;
  verificationStatus?: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  conversationId: string;
  deleteFor: 'me' | 'everyone';
}

// ─── Socket Event Types ───────────────────────────────────────────────────────

export interface SocketNewMessageEvent {
  message: Message;
  conversationId: string;
}

export interface SocketMessageDeletedEvent {
  messageId: string;
  conversationId: string;
  deletedFor: 'me' | 'everyone';
}

export interface SocketTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface SocketMessageReadEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface SocketPresenceEvent {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export interface SocketConversationUpdateEvent {
  conversationId: string;
  status?: ConversationStatus;
}

// ─── Presence Types ───────────────────────────────────────────────────────────

export type PresenceLevel =
  | 'active_now'   // Online right now (socket connected or last seen < 1 min)
  | 'recently'     // Last seen 1-59 min ago
  | 'today'        // Last seen 1-23 hours ago
  | 'this_week'    // Last seen 1-6 days ago
  | 'two_weeks'    // Last seen 7-13 days ago
  | 'inactive';    // Last seen 14+ days ago or unknown
  
export interface PresenceData {
  isOnline: boolean;
  lastSeen?: string;
}