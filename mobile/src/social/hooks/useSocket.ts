/**
 * useSocket — wires socket events into TanStack Query cache.
 * -----------------------------------------------------------------------------
 * Mount this ONCE near the root of the Social module (e.g. in SocialEntry).
 * All other hooks/screens read from the query cache; the socket is plumbing.
 *
 * FIXES v4:
 *   - Presence event name matched to server: 'presence:update'
 *   - Typing cache key format unified: ['social', 'typing', convId, userId]
 *   - Message read event sets status to 'read' on individual messages
 *   - Conversation created/updated events properly invalidate lists
 *   - Heartbeat sent every 30s to keep presence fresh
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';

import { useAuthStore } from '../../store/authStore';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  socketEmit,
  SOCKET_EVENTS,
} from '../services/socketService';
import type {
  Conversation,
  Message,
  SocketMessageReadEvent,
  SocketNewMessageEvent,
  SocketPresenceEvent,
  SocketTypingEvent,
} from '../types/chat';
import { SOCIAL_KEYS } from './queryKeys';

/**
 * Bootstrap the socket once per authenticated session and keep the query
 * cache in sync with server-pushed events.
 */
export const useSocketBootstrap = () => {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?._id);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token || !userId) return;

    const socket = connectSocket(token);

    // ── chat:new_message ─────────────────────────────────────────────────
    const onNewMessage = ({ message, conversationId }: SocketNewMessageEvent) => {
      // Append to messages cache (newest-first)
      qc.setQueryData(
        SOCIAL_KEYS.messages(conversationId ?? message.conversationId),
        (old: any) => {
          if (!old) {
            return {
              pages: [{ data: [message], pagination: { page: 1 } }],
              pageParams: [1],
            };
          }
          const pages = [...old.pages];
          const first = pages[0];
          // De-dupe: skip if optimistic message already landed
          if (first?.data?.some((m: Message) => m._id === message._id)) {
            return old;
          }
          pages[0] = {
            ...first,
            data: [message, ...(first?.data ?? [])],
          };
          return { ...old, pages };
        },
      );

      // Invalidate conversations list for last-message preview
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
    };

    // ── chat:message_deleted ─────────────────────────────────────────────
    const onMessageDeleted = ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      qc.setQueryData(SOCIAL_KEYS.messages(conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).map((m: Message) =>
              m._id === messageId
                ? { ...m, type: 'deleted', content: null, deletedAt: new Date().toISOString() }
                : m,
            ),
          })),
        };
      });
    };

    // ── chat:typing ──────────────────────────────────────────────────────
    const onTyping = (evt: SocketTypingEvent) => {
      // FIXED: Use consistent cache key format
      qc.setQueryData(
        ['social', 'typing', evt.conversationId, evt.userId],
        evt.isTyping,
      );
    };

    // ── chat:messages_read ────────────────────────────────────────────────
    const onMessageRead = ({
      conversationId,
      userId: readerId,
      readAt,
    }: SocketMessageReadEvent) => {
      qc.setQueryData(SOCIAL_KEYS.messages(conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).map((m: Message) => {
              // Mark all messages from other senders as read
              const senderId = typeof m.sender === 'string' ? m.sender : m.sender?._id;
              if (senderId !== readerId && m.status !== 'read') {
                return {
                  ...m,
                  status: 'read' as const,
                  readBy: [
                    ...(m.readBy ?? []).filter((r) => r.user !== readerId),
                    { user: readerId, readAt },
                  ],
                };
              }
              return m;
            }),
          })),
        };
      });
    };

    // ── chat:message_delivered ───────────────────────────────────────────
    const onMessageDelivered = ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      qc.setQueryData(SOCIAL_KEYS.messages(conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? []).map((m: Message) =>
              m._id === messageId && m.status === 'sent'
                ? { ...m, status: 'delivered' as const }
                : m,
            ),
          })),
        };
      });
    };

    // ── chat:conversation_updated ─────────────────────────────────────────
    const onConversationUpdate = (conversation: Conversation) => {
      qc.setQueryData(SOCIAL_KEYS.conversation(conversation._id), conversation);
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
    };

    // ── chat:conversation_created ─────────────────────────────────────────
    const onConversationCreated = ({
      conversation,
    }: {
      conversation: Conversation;
    }) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
    };

    // ── chat:request_accepted / chat:request_declined ────────────────────
    const onRequestAccepted = ({ conversationId }: { conversationId: string }) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
    };

    const onRequestDeclined = ({ conversationId }: { conversationId: string }) => {
      qc.removeQueries({ queryKey: SOCIAL_KEYS.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
    };

    // ── presence:update ──────────────────────────────────────────────────
    // FIXED: Listen for the correct event name
    const onPresenceUpdate = (evt: SocketPresenceEvent) => {
      qc.setQueryData(SOCIAL_KEYS.presence(evt.userId), {
        isOnline: evt.status === 'online',
        lastSeen: evt.lastSeen,
      });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.onlineContacts });
    };

    // ── presence:batch ───────────────────────────────────────────────────
    const onPresenceBatch = (batch: Record<string, { isOnline: boolean; lastSeen: string }>) => {
      Object.entries(batch).forEach(([uid, data]) => {
        qc.setQueryData(SOCIAL_KEYS.presence(uid), {
          isOnline: data.isOnline,
          lastSeen: data.lastSeen,
        });
      });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.onlineContacts });
    };

    // ── chat:request_received ────────────────────────────────────────────
    const onRequestReceived = () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
    };

    // ── Register all listeners ───────────────────────────────────────────
    socket.on(SOCKET_EVENTS.newMessage, onNewMessage);
    socket.on(SOCKET_EVENTS.messageDeleted, onMessageDeleted);
    socket.on(SOCKET_EVENTS.typing, onTyping);
    socket.on(SOCKET_EVENTS.messageRead, onMessageRead);
    socket.on(SOCKET_EVENTS.messageDelivered, onMessageDelivered);
    socket.on(SOCKET_EVENTS.conversationUpdate, onConversationUpdate);
    socket.on(SOCKET_EVENTS.conversationCreated, onConversationCreated);
    socket.on(SOCKET_EVENTS.requestAccepted, onRequestAccepted);
    socket.on(SOCKET_EVENTS.requestDeclined, onRequestDeclined);
    socket.on(SOCKET_EVENTS.presenceUpdate, onPresenceUpdate);
    socket.on(SOCKET_EVENTS.presenceBatch, onPresenceBatch);
    socket.on(SOCKET_EVENTS.requestReceived, onRequestReceived);

    // ── Heartbeat: keep presence fresh ───────────────────────────────────
    heartbeatRef.current = setInterval(() => {
      socketEmit.presenceHeartbeat();
    }, 30_000);

    // ── App state: reconnect on foreground ───────────────────────────────
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && !socket.connected) {
        socket.connect();
        // Refresh presence on reconnect
        socketEmit.presenceHeartbeat();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      socket.off(SOCKET_EVENTS.newMessage, onNewMessage);
      socket.off(SOCKET_EVENTS.messageDeleted, onMessageDeleted);
      socket.off(SOCKET_EVENTS.typing, onTyping);
      socket.off(SOCKET_EVENTS.messageRead, onMessageRead);
      socket.off(SOCKET_EVENTS.messageDelivered, onMessageDelivered);
      socket.off(SOCKET_EVENTS.conversationUpdate, onConversationUpdate);
      socket.off(SOCKET_EVENTS.conversationCreated, onConversationCreated);
      socket.off(SOCKET_EVENTS.requestAccepted, onRequestAccepted);
      socket.off(SOCKET_EVENTS.requestDeclined, onRequestDeclined);
      socket.off(SOCKET_EVENTS.presenceUpdate, onPresenceUpdate);
      socket.off(SOCKET_EVENTS.presenceBatch, onPresenceBatch);
      socket.off(SOCKET_EVENTS.requestReceived, onRequestReceived);
      appStateSub.remove();
    };
  }, [token, userId, qc]);

  // Clean up on logout
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }
  }, [token]);
};

/** Read the live socket instance from any component. */
export const useSocket = () => getSocket();