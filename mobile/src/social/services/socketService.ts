/**
 * socketService — Socket.IO client singleton.
 * -----------------------------------------------------------------------------
 * One socket per app session. Use `getSocket()` anywhere; it's lazy and
 * reuses the same instance. Call `connectSocket(token)` after auth.
 *
 * FIXES v4:
 *   - BUG 1 FIX: SOCKET_EVENTS.presenceUpdate now correctly uses 'presence:update'
 *     (was 'presence:changed' which the server never emits)
 *   - Added SOCKET_EVENTS.conversationCreated for real-time new convs
 *   - Added SOCKET_EVENTS.requestAccepted / requestDeclined for banner updates
 *   - socketEmit.markRead simplified to just conversationId
 *   - Added socketEmit.presenceQuery for batch presence
 */

import { io, Socket } from 'socket.io-client';

import API_URL from '../../lib/api';
import type {
  Conversation,
  Message,
  SocketNewMessageEvent,
  SocketPresenceEvent,
  SocketTypingEvent,
  SocketMessageReadEvent,
} from '../types/chat';

// ─── URL helper ──────────────────────────────────────────────────────────────

/**
 * Strip the API path so the socket connects to the root origin.
 * e.g. 'https://api.example.com/api/v1' → 'https://api.example.com'
 */
const stripApiPath = (url: string): string => url.replace(/\/api\/v\d+\/?$/, '');

// ─── Singleton socket instance ───────────────────────────────────────────────

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  const baseURL = API_URL.defaults.baseURL;
  if (!baseURL) {
    throw new Error('API base URL is not configured');
  }

  socket = io(stripApiPath(baseURL), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 10_000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

// ──────────────────────────────────────────────────────────────────────────────
// Client → Server event helpers (thin wrappers)
// ──────────────────────────────────────────────────────────────────────────────

export const socketEmit = {
  /** Join a conversation room to receive live messages */
  joinRoom: (conversationId: string) =>
    socket?.emit('chat:join_room', { conversationId }),

  /** Leave a conversation room */
  leaveRoom: (conversationId: string) =>
    socket?.emit('chat:leave_room', { conversationId }),

  /** Send a message via socket (alternative to REST) */
  sendMessage: (payload: {
    conversationId: string;
    content: string;
    type?: string;
    replyTo?: string;
  }) => socket?.emit('chat:send_message', payload),

  /** Start typing indicator */
  typingStart: (conversationId: string) =>
    socket?.emit('chat:typing_start', { conversationId }),

  /** Stop typing indicator */
  typingStop: (conversationId: string) =>
    socket?.emit('chat:typing_stop', { conversationId }),

  /** Mark conversation as read (marks all messages) */
  markRead: (conversationId: string) =>
    socket?.emit('chat:mark_read', { conversationId }),

  /** Delete a message (server will broadcast) */
  deleteMessage: (messageId: string) =>
    socket?.emit('chat:delete_message', { messageId }),

  /** Heartbeat to keep presence fresh */
  presenceHeartbeat: () => socket?.emit('presence:heartbeat'),

  /** Request presence status for a batch of users */
  presenceQuery: (userIds: string[]) =>
    socket?.emit('presence:query', { userIds }),
};

// ──────────────────────────────────────────────────────────────────────────────
// Event name constants (used by useSocket hook for type-safety)
// ──────────────────────────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  /** Server emits when a new message is sent to a conversation */
  newMessage: 'chat:new_message',

  /** Server emits when a message is deleted */
  messageDeleted: 'chat:message_deleted',

  /** Server emits when someone starts/stops typing */
  typing: 'chat:typing',

  /** Server emits when messages are marked as read */
  messageRead: 'chat:messages_read',

  /** Server emits when messages are delivered (acknowledged by recipient) */
  messageDelivered: 'chat:message_delivered',

  /** Server emits when a conversation is updated (status change, etc.) */
  conversationUpdate: 'chat:conversation_updated',

  /** Server emits when a new conversation is created */
  conversationCreated: 'chat:conversation_created',

  /** Server emits when a message request is accepted */
  requestAccepted: 'chat:request_accepted',

  /** Server emits when a message request is declined */
  requestDeclined: 'chat:request_declined',

  /**
   * BUG 1 FIX: Server emits 'presence:update' — was incorrectly set to
   * 'presence:changed' which the server never sends, so presence events
   * were silently dropped and the cache was never updated.
   */
  presenceUpdate: 'presence:update',

  /** Server emits batch presence data */
  presenceBatch: 'presence:batch',

  /** Server emits when a new message request is received */
  requestReceived: 'chat:request_received',
} as const;

// ─── Re-export types ─────────────────────────────────────────────────────────

export type {
  Conversation,
  Message,
  SocketNewMessageEvent,
  SocketPresenceEvent,
  SocketTypingEvent,
  SocketMessageReadEvent,
};