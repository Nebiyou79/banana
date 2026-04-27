/**
 * useSocket — wires socket events into TanStack Query cache.
 * -----------------------------------------------------------------------------
 * Mount this ONCE near the root of the Social module (e.g. in SocialEntry).
 * All other hooks/screens read from the query cache; the socket is plumbing.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { useAuthStore } from '../../store/authStore';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
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

  useEffect(() => {
    if (!token || !userId) return;
    const socket = connectSocket(token);

    // ── chat:new_message ─────────────────────────────────────────────────
    const onNewMessage = ({ message, conversation }: SocketNewMessageEvent) => {
      // Append to messages cache (newest-first).
      qc.setQueryData(
        SOCIAL_KEYS.messages(message.conversationId),
        (old: any) => {
          if (!old) {
            return {
              pages: [{ data: [message], pagination: {} }],
              pageParams: [1],
            };
          }
          const [first, ...rest] = old.pages;
          // De-dupe: if optimistic message already landed, skip.
          if (first?.data?.some((m: Message) => m._id === message._id)) {
            return old;
          }
          return {
            ...old,
            pages: [
              { ...first, data: [message, ...(first?.data ?? [])] },
              ...rest,
            ],
          };
        },
      );

      // Update the conversation's last-message preview.
      qc.setQueryData(SOCIAL_KEYS.conversation(conversation._id), conversation);
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
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
                ? { ...m, type: 'deleted', content: null }
                : m,
            ),
          })),
        };
      });
    };

    // ── chat:typing ──────────────────────────────────────────────────────
    const onTyping = (evt: SocketTypingEvent) => {
      qc.setQueryData(
        ['social', 'typing', evt.conversationId, evt.userId],
        evt.isTyping,
      );
    };

    // ── chat:message_read ────────────────────────────────────────────────
    const onMessageRead = ({
      messageId,
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
            data: (page.data ?? []).map((m: Message) =>
              m._id === messageId
                ? {
                    ...m,
                    status: 'read',
                    readBy: [
                      ...(m.readBy ?? []).filter((r) => r.user !== readerId),
                      { user: readerId, readAt },
                    ],
                  }
                : m,
            ),
          })),
        };
      });
    };

    // ── chat:conversation_update ─────────────────────────────────────────
    const onConversationUpdate = (conversation: Conversation) => {
      qc.setQueryData(SOCIAL_KEYS.conversation(conversation._id), conversation);
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    };

    // ── presence:changed ─────────────────────────────────────────────────
    const onPresence = (evt: SocketPresenceEvent) => {
      qc.setQueryData(SOCIAL_KEYS.presence(evt.userId), {
        isOnline: evt.status === 'online',
        lastSeen: evt.lastSeen,
      });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.onlineContacts });
    };

    // ── chat:request_received ────────────────────────────────────────────
    const onRequestReceived = () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    };

    socket.on(SOCKET_EVENTS.newMessage, onNewMessage);
    socket.on(SOCKET_EVENTS.messageDeleted, onMessageDeleted);
    socket.on(SOCKET_EVENTS.typing, onTyping);
    socket.on(SOCKET_EVENTS.messageRead, onMessageRead);
    socket.on(SOCKET_EVENTS.conversationUpdate, onConversationUpdate);
    socket.on(SOCKET_EVENTS.presenceChanged, onPresence);
    socket.on(SOCKET_EVENTS.requestReceived, onRequestReceived);

    // Reconnect when app returns to foreground.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !socket.connected) socket.connect();
    });

    return () => {
      socket.off(SOCKET_EVENTS.newMessage, onNewMessage);
      socket.off(SOCKET_EVENTS.messageDeleted, onMessageDeleted);
      socket.off(SOCKET_EVENTS.typing, onTyping);
      socket.off(SOCKET_EVENTS.messageRead, onMessageRead);
      socket.off(SOCKET_EVENTS.conversationUpdate, onConversationUpdate);
      socket.off(SOCKET_EVENTS.presenceChanged, onPresence);
      socket.off(SOCKET_EVENTS.requestReceived, onRequestReceived);
      sub.remove();
    };
  }, [token, userId, qc]);

  // Clean up on logout.
  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);
};

/** Read the live socket instance from any component. */
export const useSocket = () => getSocket();