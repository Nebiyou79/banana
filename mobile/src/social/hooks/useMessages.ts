/**
 * useMessages — messages for a single conversation.
 * -----------------------------------------------------------------------------
 *   - useMessages(conversationId)     → paginated history, newest-first
 *   - useSendMessage()                → optimistic send with rollback
 *   - useDeleteMessage()              → soft delete (for me / for everyone)
 *
 * NOTE on ordering: the server returns newest-first. The ChatScreen renders
 * an inverted FlashList, so `data.list` is kept newest-first and the list
 * component inverts visually.
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
import type {
  Message,
  MessageListResponse,
  SendMessagePayload,
} from '../types/chat';

// ──────────────────────────────────────────────────────────────────────────────
// Messages list
// ──────────────────────────────────────────────────────────────────────────────

export const useMessages = (conversationId?: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.messages(conversationId ?? ''),
    queryFn: ({ pageParam = 1 }) =>
      messageService
        .getMessages(conversationId as string, { page: pageParam, limit: 30 })
        .then((r) => r.data as MessageListResponse),
    getNextPageParam: (last) => {
      const { page, pages } = last?.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: Boolean(conversationId),
    select: (data) => ({
      ...data,
      // Newest-first across all pages.
      list: data.pages.flatMap((p) => p?.data ?? []) as Message[],
    }),
    staleTime: 10_000,
  });

// ──────────────────────────────────────────────────────────────────────────────
// Send message — optimistic
// ──────────────────────────────────────────────────────────────────────────────

interface OptimisticContext {
  tempId: string;
  prev: unknown;
}

export const useSendMessage = () => {
  const qc = useQueryClient();
  const myUser = useAuthStore((s) => s.user);

  return useMutation<Message, unknown, SendMessagePayload, OptimisticContext>({
    mutationFn: (payload) =>
      messageService.send(payload).then((r) => r.data?.data as Message),

    onMutate: async (payload) => {
      const key = SOCIAL_KEYS.messages(payload.conversationId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);

      const tempId = `tmp_${Date.now()}`;
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

      // Prepend to the first page (newest-first).
      qc.setQueryData(key, (old: any) => {
        if (!old) {
          return {
            pages: [{ data: [optimistic], pagination: {} }],
            pageParams: [1],
          };
        }
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [
            { ...first, data: [optimistic, ...(first?.data ?? [])] },
            ...rest,
          ],
        };
      });

      return { tempId, prev };
    },

    onError: (err: any, payload, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(SOCIAL_KEYS.messages(payload.conversationId), ctx.prev);
      }
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Message failed to send',
      });
    },

    onSuccess: (serverMsg, payload, ctx) => {
      // Replace the temp message with the real server-issued one.
      const key = SOCIAL_KEYS.messages(payload.conversationId);
      qc.setQueryData(key, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) => {
            if (i !== 0) return page;
            return {
              ...page,
              data: (page.data ?? []).map((m: Message) =>
                m._id === ctx?.tempId ? serverMsg : m,
              ),
            };
          }),
        };
      });
    },

    onSettled: (_, __, payload) => {
      // Refresh the conversations list so last-message preview updates.
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.conversation(payload.conversationId),
      });
    },
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Delete message
// ──────────────────────────────────────────────────────────────────────────────

export interface DeleteMessageArgs {
  messageId: string;
  conversationId: string;
  forEveryone?: boolean;
}

export const useDeleteMessage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, conversationId, forEveryone }: DeleteMessageArgs) =>
      messageService.deleteMessage(conversationId, messageId, forEveryone),

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
            data: (page.data ?? []).map((m: Message) => {
              if (m._id !== messageId) return m;
              if (forEveryone) {
                return {
                  ...m,
                  type: 'deleted' as const,
                  content: null,
                  deletedAt: new Date().toISOString(),
                };
              }
              // "Delete for me" removes from my view only.
              return m;
            }),
            // Also strip out "delete for me" entries.
            ...(forEveryone
              ? {}
              : {
                  data: (page.data ?? []).filter(
                    (m: Message) => m._id !== messageId,
                  ),
                }),
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