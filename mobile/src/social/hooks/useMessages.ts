// src/social/hooks/useMessages.ts
/**
 * Message hooks for a single conversation.
 *
 * Exports:
 *  - useMessages(conversationId)
 *  - useSendMessage(conversationId)
 *  - useDeleteMessage()
 */
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  messageService,
  type Message,
  type MessageType,
} from '../services/messageService';

/* ── List (paged, newest first from backend; UI reverses) ────────── */
export const useMessages = (conversationId: string) =>
  useInfiniteQuery({
    queryKey: ['social', 'messages', conversationId] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await messageService.getMessages(conversationId, {
        page: pageParam as number,
        limit: 30,
      });
      return {
        data: (res.data?.data as Message[]) ?? [],
        pagination: res.data?.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? ({} as any);
      return page && pages && page < pages ? page + 1 : undefined;
    },
    enabled: Boolean(conversationId),
    staleTime: 0,
    // UI consumes oldest-first (scroll down = newer).
    select: (data) => ({
      ...data,
      // Backend returns newest-first per page. Concat pages then reverse.
      messages: [...data.pages.flatMap((p) => p.data ?? [])].reverse(),
    }),
  });

/* ── Send ────────────────────────────────────────────────────────── */
export const useSendMessage = (conversationId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      content: string;
      type?: MessageType;
      replyTo?: string | null;
    }) =>
      messageService.send({
        conversationId,
        content: args.content,
        type: args.type ?? 'text',
        replyTo: args.replyTo ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['social', 'messages', conversationId],
      });
      // Refresh inbox so the other party's last-message preview updates.
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Send failed',
      });
    },
  });
};

/* ── Delete (me / everyone) ──────────────────────────────────────── */
export const useDeleteMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      messageId: string;
      deleteFor: 'me' | 'everyone';
    }) => messageService.delete(args.messageId, args.deleteFor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social', 'messages'] });
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Delete failed',
      });
    },
  });
};