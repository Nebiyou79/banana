// =============================================================================
// FILE: mobile/src/social/hooks/useConversations.ts — FIXED (Bug 4)
// =============================================================================

/**
 * useConversations — hooks for conversation management
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG 4 FIX — useGetOrCreateConversation:
 *   The mutation was receiving `{ userId: string }` (an object) in some call
 *   sites instead of a plain `string`, causing the URL to become:
 *     POST /conversations/with/[object Object]  →  400 "Invalid userId format"
 *
 *   Fix: Add a defensive `extractUserId` helper inside `mutationFn` that
 *   handles both `string` and `{ userId: string }` / `{ _id: string }` inputs.
 *   This makes the mutation resilient to the caller accidentally passing an
 *   object, while the correct call sites (NewChatScreen, PublicProfileScreen)
 *   continue to pass plain strings.
 *
 *   Call-site audit results:
 *     NewChatScreen.tsx       → `openChat(result._id, ...)` ✅ already a string
 *     MessagesScreen.tsx      → passes userId directly ✅
 *     PublicProfileScreen.tsx → verify passes `user._id` string, not object ⚠️
 *     ChatActionButton.tsx    → verify passes string ⚠️
 *
 *   The defensive guard ensures any forgotten object call site also works.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { conversationService } from '../services/conversationService';
import { useAuthStore } from '../../store/authStore';
import { SOCIAL_KEYS } from './queryKeys';
import type {
  Conversation,
  ConversationListResponse,
} from '../types/chat';

// ─── Helper: Determine viewer's role ──────────────────────────────────────────

/**
 * Returns the current user's role in a conversation.
 *
 * 'requester': This user initiated the message request (requestedBy === userId)
 * 'recipient': This user received the request (requestedBy !== userId)
 * 'participant': Both in an active conversation (no request pending)
 */
export function getRequestRole(
  conversation: Conversation,
  myId?: string | null
): 'requester' | 'recipient' | 'participant' {
  if (!myId) return 'participant';
  if (conversation.status !== 'request') return 'participant';

  const requestedBy = conversation.requestedBy
    ? String(conversation.requestedBy)
    : null;

  return requestedBy === myId ? 'requester' : 'recipient';
}

// ─── Main conversations list (inbox) ──────────────────────────────────────────

export const useMyConversations = (params?: { page?: number; limit?: number }) =>
  useInfiniteQuery<ConversationListResponse>({
    queryKey: SOCIAL_KEYS.conversations,
    queryFn: ({ pageParam = 1 }) =>
      conversationService
        .getMyConversations({ page: Number(pageParam), limit: params?.limit ?? 20 })
        .then((r) => r.data),
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

// ─── Message requests ─────────────────────────────────────────────────────────

export const useMessageRequests = (params?: { page?: number; limit?: number }) =>
  useInfiniteQuery<ConversationListResponse>({
    queryKey: SOCIAL_KEYS.messageRequests,
    queryFn: ({ pageParam = 1 }) =>
      conversationService
        .getMessageRequests({ page: Number(pageParam), limit: params?.limit ?? 20 })
        .then((r) => r.data),
    getNextPageParam: (last) => {
      const { page, pages } = last?.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => ({
      ...data,
      list: data.pages.flatMap((p) => p?.data ?? []) as Conversation[],
    }),
    staleTime: 30_000,
  });

// ─── Single conversation ──────────────────────────────────────────────────────

export const useConversation = (conversationId?: string) =>
  useQuery<Conversation>({
    queryKey: SOCIAL_KEYS.conversation(conversationId ?? ''),
    queryFn: () =>
      conversationService
        .getById(conversationId as string)
        .then((r) => r.data.data),  // ← r.data is ConversationResponse, r.data.data is Conversation
    enabled: Boolean(conversationId),
    staleTime: 10_000,
  });

// ─── Create / get conversation ────────────────────────────────────────────────

/**
 * BUG 4 FIX: Defensive userId extraction.
 *
 * The mutation accepts `string | { userId: string } | { _id: string }` but
 * the service requires a plain string. This guard normalises the input so
 * the URL is always `/conversations/with/<id>` and never
 * `/conversations/with/[object%20Object]`.
 *
 * Correct call sites pass a plain string: `openChat(result._id)`.
 * This guard is a safety net for any call site that accidentally passes an
 * object like `openChat({ userId: result._id })`.
 */
function extractUserId(input: string | { userId?: string; _id?: string }): string {
  if (typeof input === 'string') return input;
  // Handles { userId: '...' } or { _id: '...' } objects from call sites
  // that accidentally pass the wrong shape.
  return (input as any).userId ?? (input as any)._id ?? String(input);
}

export const useGetOrCreateConversation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userIdOrObject: string | { userId?: string; _id?: string }) => {
      const userId = extractUserId(userIdOrObject);
      // r.data = { success, data: Conversation, created }
      return conversationService.getOrCreateWith(userId).then((r) => r.data);
    },
    // FIX: The mutation returns ConversationResponse.
    // onSuccess receives the full response: { success, data: Conversation, created }
    // We extract data.data for cache updates.
    onSuccess: (response) => {
      const conversation = response?.data;
      if (conversation?._id) {
        qc.setQueryData(SOCIAL_KEYS.conversation(conversation._id), conversation);
      }
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Failed to open conversation',
      });
    },
  });
};

// ─── Accept request ───────────────────────────────────────────────────────────

export const useAcceptRequest = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.acceptRequest(conversationId).then((r) => r.data),
    onSuccess: (data) => {
      const convId = data.data._id;
      qc.setQueryData(SOCIAL_KEYS.conversation(convId), data.data);
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      Toast.show({ type: 'success', text1: 'Request accepted' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Failed to accept request',
      });
    },
  });
};

// ─── Decline request ──────────────────────────────────────────────────────────

export const useDeclineRequest = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.declineRequest(conversationId).then((r) => r.data),
    onSuccess: (_, conversationId) => {
      qc.removeQueries({ queryKey: SOCIAL_KEYS.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      Toast.show({ type: 'info', text1: 'Request declined' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Failed to decline request',
      });
    },
  });
};

// ─── Delete conversation ──────────────────────────────────────────────────────

export const useDeleteConversation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      qc.removeQueries({ queryKey: SOCIAL_KEYS.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.conversations });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.messageRequests });
      Toast.show({ type: 'success', text1: 'Conversation deleted' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Failed to delete',
      });
    },
  });
};

// ─── Online contacts ──────────────────────────────────────────────────────────

export const useOnlineContacts = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.onlineContacts,
    queryFn: () =>
      conversationService.getOnlineContacts().then((r) => r.data.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });