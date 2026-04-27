/**
 * Chat & Presence Types
 * -----------------------------------------------------------------------------
 * Backend models: server/src/models/Conversation.js, server/src/models/Message.js
 * Keep these shapes in sync with the backend — do NOT invent fields.
 */

import type { UserRole, VerificationStatus } from './index';

// ──────────────────────────────────────────────────────────────────────────────
// Presence
// ──────────────────────────────────────────────────────────────────────────────

export type PresenceLevel =
  | 'active_now'
  | 'recently'
  | 'today'
  | 'this_week'
  | 'two_weeks'
  | 'inactive';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: string; // ISO date
}

// ──────────────────────────────────────────────────────────────────────────────
// Chat participant (lightweight user embed)
// ──────────────────────────────────────────────────────────────────────────────

export interface ChatUser {
  _id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  headline?: string;
  verificationStatus?: VerificationStatus;
  isOnline?: boolean;
  lastSeen?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Conversation
// ──────────────────────────────────────────────────────────────────────────────

export type ConversationStatus = 'active' | 'request' | 'declined';
export type ConversationType = 'direct'; // future: 'group'

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  type: ConversationType;
  status: ConversationStatus;
  requestedBy?: string;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number; // derived for current user
  otherUser: ChatUser; // derived for current user (the non-self participant)
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Message
// ──────────────────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'emoji' | 'deleted';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageReadReceipt {
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
  readBy: MessageReadReceipt[];
  deletedAt?: string;
  deletedBy?: string;
  canDeleteUntil?: string;
  replyTo?: string | Message;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// API payload shapes
// ──────────────────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
}

export interface ConversationListResponse {
  success: boolean;
  data: Conversation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  requestsCount?: number;
}

export interface MessageListResponse {
  success: boolean;
  data: Message[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Socket events (typed)
// ──────────────────────────────────────────────────────────────────────────────

export interface SocketTypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface SocketPresenceEvent {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export interface SocketMessageReadEvent {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface SocketNewMessageEvent {
  message: Message;
  conversation: Conversation;
}