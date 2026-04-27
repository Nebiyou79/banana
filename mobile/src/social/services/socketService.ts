/**
 * socketService — Socket.IO client singleton.
 * -----------------------------------------------------------------------------
 * One socket per app session. Use `getSocket()` anywhere; it's lazy and
 * reuses the same instance. Call `connectSocket(token)` after auth.
 *
 * All event names match blueprint §5.4.
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

// The socket server is mounted on the API origin (no path prefix).
// `API_URL` is expected to look like `https://api.example.com/api/v1`;
// we strip `/api/v1` for the socket connection.
const stripApiPath = (url: string) => url.replace(/\/api\/v\d+\/?$/, '');

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
// Client → Server event helpers (thin wrappers so components don't touch
// raw event names).
// ──────────────────────────────────────────────────────────────────────────────

export const socketEmit = {
  joinRoom: (conversationId: string) =>
    socket?.emit('chat:join_room', { conversationId }),

  leaveRoom: (conversationId: string) =>
    socket?.emit('chat:leave_room', { conversationId }),

  sendMessage: (payload: {
    conversationId: string;
    content: string;
    type?: string;
    replyTo?: string;
  }) => socket?.emit('chat:send_message', payload),

  typingStart: (conversationId: string) =>
    socket?.emit('chat:typing_start', { conversationId }),

  typingStop: (conversationId: string) =>
    socket?.emit('chat:typing_stop', { conversationId }),

  markRead: (conversationId: string, messageId: string) =>
    socket?.emit('chat:mark_read', { conversationId, messageId }),

  deleteMessage: (messageId: string) =>
    socket?.emit('chat:delete_message', { messageId }),

  presenceHeartbeat: () => socket?.emit('presence:update', {}),
};

// ──────────────────────────────────────────────────────────────────────────────
// Event name constants (used by useSocket hook for type-safety).
// ──────────────────────────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  newMessage: 'chat:new_message',
  messageDeleted: 'chat:message_deleted',
  typing: 'chat:typing',
  messageRead: 'chat:message_read',
  conversationUpdate: 'chat:conversation_update',
  presenceChanged: 'presence:changed',
  requestReceived: 'chat:request_received',
} as const;

export type {
  Conversation,
  Message,
  SocketNewMessageEvent,
  SocketPresenceEvent,
  SocketTypingEvent,
  SocketMessageReadEvent,
};