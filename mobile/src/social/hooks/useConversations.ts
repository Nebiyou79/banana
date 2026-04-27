/**
 * useConversations — conversation list, requests, and per-conversation actions.
 * -----------------------------------------------------------------------------
 * Hooks exported:
 *   - useConversations(filter?)        → list with optional tab filter
 *   - useMessageRequests()             → pending requests list
 *   - useConversation(id)              → single conversation (for chat header)
 *   - useGetOrCreateConversation()     → opens / creates DM with a user
 *   - useAcceptRequest()
 *   - useDeclineRequest()
 *   - useMarkConversationRead()
 *   - useDeleteConversation()
 *   - useOnlineContacts()
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { conversationService } from '../services/conversationService';
import type { Conversation, ConversationListResponse } from '../types/chat';
import { SOCIAL_KEYS } from './queryKeys';

// ──────────────────────────────────────────────────────────────────────────────
// Lists
// ──────────────────────────────────────────────────────────────────────────────

export const useConversations = (filter?: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.conversations(filter),
    queryFn: ({ pageParam = 1 }) =>
      conversationService
        .getMyConversations({ page: pageParam, filter })
        .then((r) => r.data as ConversationListResponse),
    getNextPageParam: (last) => {
      const { page, pages } = last?.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => ({
      ...data,
      list: data.pages.flatMap((p) => p?.data ?? []) as Conversation[],
      // Surface requestsCount from the first page so the banner can render.
      requestsCount: data.pages[0]?.requestsCount ?? 0,
    }),
    staleTime: 15_000,
  });

export const useMessageRequests = () =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.messageRequests,
    queryFn: ({ pageParam = 1 }) =>
      conversationService
        .getMessageRequests({ page: pageParam })
        .then((r) => r.data as ConversationListResponse),
    getNextPageParam: (last) => {
      const { page, pages } = last?.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => ({
      ...data,
      list: data.pages.flatMap((p) => p?.data ?? []) as Conversation[],
    }),
    staleTime: 15_000,
  });

export const useConversation = (conversationId?: string) =>
  useQuery<Conversation>({
    queryKey: SOCIAL_KEYS.conversation(conversationId ?? ''),
    queryFn: () =>
      conversationService
        .getById(conversationId as string)
        .then((r) => r.data?.data),
    enabled: Boolean(conversationId),
    staleTime: 15_000,
  });

export const useOnlineContacts = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.onlineContacts,
    queryFn: () =>
      conversationService.getOnlineContacts().then((r) => r.data?.data ?? []),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

// ──────────────────────────────────────────────────────────────────────────────
// Get-or-create — the workhorse behind "Start Chat" and "Send Message Request"
// ──────────────────────────────────────────────────────────────────────────────

export interface GetOrCreateArgs {
  userId: string;
  initialMessage?: string;
}

export const useGetOrCreateConversation = () => {
  const qc = useQueryClient();

  return useMutation<Conversation, unknown, GetOrCreateArgs>({
    mutationFn: ({ userId, initialMessage }) =>
      conversationService
        .getOrCreateWith(userId, initialMessage)
        .then((r) => r.data?.data as Conversation),

    onSuccess: (conv) => {
      // Seed caches so the Chat screen doesn't need a second round-trip.
      qc.setQueryData(SOCIAL_KEYS.conversation(conv._id), conv);
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      if (conv.status === 'request') {
        qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      }
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not open chat',
      });
    },
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Request flow
// ──────────────────────────────────────────────────────────────────────────────

export const useAcceptRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.acceptRequest(conversationId),
    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.conversation(conversationId),
      });
      Toast.show({ type: 'success', text1: 'Request accepted' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not accept request',
      });
    },
  });
};

export const useDeclineRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.declineRequest(conversationId),
    onMutate: async (conversationId) => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      const prev = qc.getQueryData(SOCIAL_KEYS.messageRequests);
      // Optimistically remove from requests list.
      qc.setQueryData(SOCIAL_KEYS.messageRequests, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p: any) => ({
            ...p,
            data: (p.data ?? []).filter(
              (c: Conversation) => c._id !== conversationId,
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (err: any, _, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(SOCIAL_KEYS.messageRequests, ctx.prev);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not decline request',
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
    },
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Read / delete
// ──────────────────────────────────────────────────────────────────────────────

export interface MarkReadArgs {
  conversationId: string;
  messageId?: string;
}

export const useMarkConversationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }: MarkReadArgs) =>
      conversationService.markAsRead(conversationId, messageId),
    onSuccess: (_, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.conversation(conversationId),
      });
    },
  });
};

export const useDeleteConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.deleteConversation(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      Toast.show({ type: 'success', text1: 'Conversation deleted' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not delete conversation',
      });
    },
  });
};