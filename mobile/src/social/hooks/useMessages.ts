// =============================================================================
// FILE 6: mobile/src/social/hooks/useMessages.ts — UPDATED
// =============================================================================

/**
 * useMessages — messages for a single conversation
 * ─────────────────────────────────────────────────────────────────────────────
 * Aligns with messageController.js v4:
 * - Paginated history, newest-first (server order)
 * - Optimistic send with temp ID rollback
 * - Delete for me / delete for everyone with proper cache updates
 * - Service interface updated (deleteMessage signature simplified)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { messageService } from '../services/messageService';
import { useAuthStore } from '../../store/authStore';
import { SOCIAL_KEYS } from './queryKeys';
import type { Message, SendMessagePayload } from '../types/chat';

// ─── Messages list ────────────────────────────────────────────────────────────

export const useMessages = (conversationId?: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.messages(conversationId ?? ''),
    queryFn: ({ pageParam = 1 }) =>
      messageService
        .getMessages(conversationId as string, {
          page: Number(pageParam),
          limit: 30,
        })
        .then((r) => r.data),
    getNextPageParam: (last) => {
      const { page, pages } = last?.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: Boolean(conversationId),
    select: (data) => ({
      ...data,
      // Newest-first across all pages (maintains server order)
      list: data.pages.flatMap((p) => p?.data ?? []) as Message[],
    }),
    staleTime: 10_000,
  });

// ─── Send message — optimistic ────────────────────────────────────────────────

interface OptimisticContext {
  tempId: string;
  prev: unknown;
}

export const useSendMessage = () => {
  const qc = useQueryClient();
  const myUser = useAuthStore((s) => s.user);

  return useMutation<
    Message,
    unknown,
    SendMessagePayload,
    OptimisticContext
  >({
    mutationFn: (payload) => {
      // ─── DEBUG ───────────────────────────────────────────────────────
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[useSendMessage] mutationFn CALLED');
      console.log('[useSendMessage] payload:', JSON.stringify(payload, null, 2));
      console.log('[useSendMessage] payload.conversationId:', payload.conversationId);
      console.log('[useSendMessage] payload.conversationId type:', typeof payload.conversationId);
      console.log('[useSendMessage] payload.conversationId length:', payload.conversationId?.length);
      console.log('[useSendMessage] payload.content type:', typeof payload.content);
      console.log('[useSendMessage] payload.content length:', payload.content?.length);
      console.log('[useSendMessage] Calling messageService.send...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return messageService.send(payload).then((r) => {
        console.log('[useSendMessage] SUCCESS — status:', r.status);
        console.log('[useSendMessage] SUCCESS — data:', JSON.stringify(r.data).substring(0, 200));
        return r.data?.data as Message;
      }).catch((err) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[useSendMessage] ERROR — status:', err?.response?.status);
        console.log('[useSendMessage] ERROR — statusText:', err?.response?.statusText);
        console.log('[useSendMessage] ERROR — response data:', JSON.stringify(err?.response?.data));
        console.log('[useSendMessage] ERROR — response headers:', JSON.stringify(err?.response?.headers));
        console.log('[useSendMessage] ERROR — request config URL:', err?.config?.baseURL + err?.config?.url);
        console.log('[useSendMessage] ERROR — request config method:', err?.config?.method);
        console.log('[useSendMessage] ERROR — request body:', JSON.stringify(err?.config?.data));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        throw err;
      });
    },

    onMutate: async (payload) => {
      const key = SOCIAL_KEYS.messages(payload.conversationId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const optimistic: Message = {
        _id: tempId,
        conversationId: payload.conversationId,
        sender: myUser?._id ?? '',
        content: payload.content,
        type: payload.type ?? 'text',
        status: 'sent',
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      qc.setQueryData(key, (old: any) => {
        if (!old) {
          return {
            pages: [{ data: [optimistic], pagination: { page: 1 } }],
            pageParams: [1],
          };
        }
        const pages = [...old.pages];
        if (pages[0]) {
          pages[0] = {
            ...pages[0],
            data: [optimistic, ...(pages[0].data ?? [])],
          };
        }
        return { ...old, pages };
      });

      return { tempId, prev };
    },

    onError: (_err, payload, ctx) => {
      console.log('[useSendMessage] onError — rolling back optimistic message');
      if (ctx?.prev) {
        qc.setQueryData(SOCIAL_KEYS.messages(payload.conversationId), ctx.prev);
      }
      Toast.show({
        type: 'error',
        text1: 'Message failed to send',
        text2: 'Please try again',
      });
    },

    onSuccess: (real, payload, ctx) => {
      console.log('[useSendMessage] onSuccess — replacing temp:', ctx?.tempId, 'with real:', real._id);
      qc.setQueryData(SOCIAL_KEYS.messages(payload.conversationId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: any) => ({
            ...p,
            data: (p.data ?? []).map((m: Message) =>
              m._id === ctx?.tempId ? real : m
            ),
          })),
        };
      });
    },

    onSettled: (_, __, payload) => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversation(payload.conversationId) });
    },
  });
};

// ─── Delete message ───────────────────────────────────────────────────────────

export interface DeleteMessageArgs {
  messageId: string;
  conversationId: string;
  forEveryone?: boolean;
}

export const useDeleteMessage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      forEveryone = false,
    }: DeleteMessageArgs) =>
      messageService.deleteMessage(
        messageId,
        forEveryone ? 'everyone' : 'me'
      ),

    onMutate: async ({ messageId, conversationId, forEveryone }) => {
      const key = SOCIAL_KEYS.messages(conversationId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      qc.setQueryData(key, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: (page.data ?? [])
              .map((m: Message) => {
                if (m._id !== messageId) return m;
                if (forEveryone) {
                  // Replace content with deleted placeholder
                  return {
                    ...m,
                    type: 'deleted' as const,
                    content: null,
                    deletedAt: new Date().toISOString(),
                  };
                }
                // "Delete for me": remove from array entirely
                return null;
              })
              .filter(Boolean),
          })),
        };
      });

      return { prev };
    },

    onError: (err: any, { conversationId }, ctx: any) => {
      if (ctx?.prev) {
        qc.setQueryData(SOCIAL_KEYS.messages(conversationId), ctx.prev);
      }
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not delete message',
      });
    },

    onSettled: (_, __, { conversationId }) => {
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.messages(conversationId),
      });
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    },
  });
};