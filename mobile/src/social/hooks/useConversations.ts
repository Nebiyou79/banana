// src/social/hooks/useConversations.ts
/**
 * Conversations list hooks + socket-driven cache invalidation.
 *
 * Provides:
 *  - useConversations(status)            → paginated inbox
 *  - useMessageRequests()                → paginated requests list
 *  - useMessageRequestsCount()           → just the count, for the banner
 *  - useOrCreateConversation()           → mutation: open / create DM
 *  - useMarkConversationRead()           → mutation: zero unread
 *  - useDeleteConversation()             → mutation: soft-delete for me
 *  - useAcceptConversation() / decline   → request accept/decline
 *  - useSocketConversationUpdates()      → registers socket listeners that
 *                                           invalidate list caches
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
  conversationService,
  type ConversationStatus,
} from '../services/conversationService';
import { useSocket } from './useSocket';

const KEY_ACTIVE = ['social', 'conversations', 'active'] as const;
const KEY_REQUEST = ['social', 'conversations', 'request'] as const;
const KEY_REQUESTS_COUNT = [
  'social',
  'conversations',
  'requestsCount',
] as const;

/* ── List: inbox ──────────────────────────────────────────────────── */
export const useConversations = (
  status: ConversationStatus = 'active'
) =>
  useInfiniteQuery({
    queryKey: ['social', 'conversations', status] as const,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await conversationService.getMyConversations({
        page: pageParam as number,
        limit: 20,
        status,
      });
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? ({} as any);
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 30,
    select: (data) => ({
      ...data,
      conversations: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

/* ── List: requests ───────────────────────────────────────────────── */
export const useMessageRequests = () =>
  useInfiniteQuery({
    queryKey: KEY_REQUEST,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await conversationService.getRequests({
        page: pageParam as number,
        limit: 20,
      });
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? ({} as any);
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 30,
    select: (data) => ({
      ...data,
      requests: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

/* ── Just the count, cheap poll for the banner ───────────────────── */
export const useMessageRequestsCount = () =>
  useQuery({
    queryKey: KEY_REQUESTS_COUNT,
    queryFn: async () => {
      const res = await conversationService.getRequests({
        page: 1,
        limit: 1,
      });
      return (res.data?.pagination?.total as number) ?? 0;
    },
    staleTime: 1000 * 30,
  });

/* ── Online contacts (mutual-follow, active in last 5min) ────────── */
export const useOnlineContacts = () =>
  useQuery({
    queryKey: ['social', 'conversations', 'onlineContacts'] as const,
    queryFn: async () => {
      const res = await conversationService.getOnlineContacts(30);
      return (res.data?.data as any[]) ?? [];
    },
    staleTime: 1000 * 30,
  });

/* ── Open or create a DM ──────────────────────────────────────────── */
export const useOrCreateConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => conversationService.getOrCreate(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ACTIVE });
      qc.invalidateQueries({ queryKey: KEY_REQUEST });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not open chat',
      });
    },
  });
};

/* ── Read receipts ────────────────────────────────────────────────── */
export const useMarkConversationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ACTIVE });
      qc.invalidateQueries({ queryKey: KEY_REQUESTS_COUNT });
    },
  });
};

/* ── Delete (soft, for me) ────────────────────────────────────────── */
export const useDeleteConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ACTIVE });
      qc.invalidateQueries({ queryKey: KEY_REQUEST });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Delete failed',
      });
    },
  });
};

/* ── Accept / decline request ─────────────────────────────────────── */
export const useAcceptConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationService.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_ACTIVE });
      qc.invalidateQueries({ queryKey: KEY_REQUEST });
      qc.invalidateQueries({ queryKey: KEY_REQUESTS_COUNT });
    },
  });
};

export const useDeclineConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationService.decline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_REQUEST });
      qc.invalidateQueries({ queryKey: KEY_REQUESTS_COUNT });
    },
  });
};

/* ── Socket-driven list invalidation ──────────────────────────────── *
 * Call this ONCE at a top-level screen (MessagesScreen). When a new
 * message arrives for any conversation, we refresh the inbox so unread
 * counts & last-message previews stay fresh.                          */
export const useSocketConversationUpdates = () => {
  const qc = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: ['social', 'conversations'] });
    };

    socket.on('chat:new_message', invalidateAll);
    socket.on('chat:conversation_created', invalidateAll);
    socket.on('chat:conversation_updated', invalidateAll);
    socket.on('chat:request_accepted', invalidateAll);
    socket.on('chat:message_deleted', invalidateAll);

    return () => {
      socket.off('chat:new_message', invalidateAll);
      socket.off('chat:conversation_created', invalidateAll);
      socket.off('chat:conversation_updated', invalidateAll);
      socket.off('chat:request_accepted', invalidateAll);
      socket.off('chat:message_deleted', invalidateAll);
    };
  }, [socket, qc]);
};