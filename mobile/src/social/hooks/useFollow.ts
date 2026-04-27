/**
 * useFollow — v2 (no pending flow)
 * -----------------------------------------------------------------------------
 * All hooks for the follow system and the derived connection UI state.
 *   - useFollowStats()         → { followers, following, connections, pendingRequests:0 }
 *   - useFollowStatus(id)      → { following, status }
 *   - useBulkFollowStatus(ids) → map keyed by targetId
 *   - useToggleFollow()        → mutation, optimistic, invalidates connection keys
 *   - useConnections()         → paginated mutual follows
 *   - useIsConnected(userId)   → { isConnected, iFollow, theyFollow }
 *   - useConnectionStatus(...) → derived ConnectionStatus enum for UI
 *   - useFollowSuggestions()
 *   - useBlockUser()
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '../../store/authStore';
import { followService } from '../services/followService';
import { SOCIAL_KEYS } from './queryKeys';
import type { FollowTargetType } from '../types';
import type {
  ConnectionStatus,
  FollowStats,
  FollowStatus,
  IsConnectedResponse,
  ToggleFollowResponse,
  ValidFollowSource,
} from '../types/follow';
import { deriveConnectionStatus } from '../utils/connectionStatus';

// ──────────────────────────────────────────────────────────────────────────────
// Stats / suggestions
// ──────────────────────────────────────────────────────────────────────────────

export const useFollowStats = () =>
  useQuery<FollowStats>({
    queryKey: SOCIAL_KEYS.followStats,
    queryFn: () => followService.getFollowStats().then((r) => r.data?.data),
    staleTime: 30_000,
  });

export const useFollowSuggestions = (
  limit = 10,
  algorithm: 'popular' | 'skills' | 'connections' | 'hybrid' = 'hybrid',
) =>
  useQuery({
    queryKey: [...SOCIAL_KEYS.suggestions, algorithm, limit] as const,
    queryFn: () =>
      followService
        .getFollowSuggestions(limit, algorithm)
        .then((r) => r.data?.data ?? []),
    staleTime: 5 * 60_000,
  });

// ──────────────────────────────────────────────────────────────────────────────
// Follow status
// ──────────────────────────────────────────────────────────────────────────────

export const useFollowStatus = (
  targetId: string | undefined,
  targetType: FollowTargetType = 'User',
) =>
  useQuery<FollowStatus>({
    queryKey: SOCIAL_KEYS.followStatus(targetId ?? ''),
    queryFn: () =>
      followService
        .getFollowStatus(targetId as string, targetType)
        .then((r) => r.data?.data),
    enabled: Boolean(targetId),
    staleTime: 60_000,
  });

/**
 * Bulk follow status — used in search results and lists.
 * Pass an array of targetIds; receive a map keyed by targetId.
 */
export const useBulkFollowStatus = (
  userIds: string[],
  targetType: FollowTargetType = 'User',
) =>
  useQuery({
    queryKey: ['social', 'bulkFollowStatus', userIds.sort().join(',')],
    queryFn: () =>
      followService
        .getBulkFollowStatus(userIds, targetType)
        .then((r) => r.data?.data ?? {}),
    enabled: userIds.length > 0,
    staleTime: 30_000,
  });

// ──────────────────────────────────────────────────────────────────────────────
// Toggle follow — optimistic, invalidates connection caches
// ──────────────────────────────────────────────────────────────────────────────

export interface ToggleFollowArgs {
  targetId: string;
  targetType?: FollowTargetType;
  /** Where the action was initiated — used for analytics. */
  source?: ValidFollowSource;
}

export const useToggleFollow = () => {
  const qc = useQueryClient();

  return useMutation<ToggleFollowResponse, unknown, ToggleFollowArgs>({
    mutationFn: ({ targetId, targetType = 'User', source = 'profile' }) =>
      followService
        .toggleFollow(targetId, targetType, source)
        .then((r) => r.data?.data as ToggleFollowResponse),

    onMutate: async ({ targetId }) => {
      await qc.cancelQueries({
        queryKey: SOCIAL_KEYS.followStatus(targetId),
      });
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.isConnected(targetId) });

      const prevStatus = qc.getQueryData<FollowStatus>(
        SOCIAL_KEYS.followStatus(targetId),
      );
      const prevConn = qc.getQueryData<IsConnectedResponse>(
        SOCIAL_KEYS.isConnected(targetId),
      );

      // Optimistic: flip `following`; flip `iFollow`; recompute isConnected.
      qc.setQueryData<FollowStatus>(
        SOCIAL_KEYS.followStatus(targetId),
        (old) => ({
          following: !old?.following,
          status: !old?.following ? 'active' : undefined,
        }),
      );

      if (prevConn) {
        const iFollow = !prevConn.iFollow;
        qc.setQueryData<IsConnectedResponse>(
          SOCIAL_KEYS.isConnected(targetId),
          {
            ...prevConn,
            iFollow,
            isConnected: iFollow && prevConn.theyFollow,
          },
        );
      }

      return { prevStatus, prevConn };
    },

    onError: (err: any, { targetId }, ctx: any) => {
      if (ctx?.prevStatus) {
        qc.setQueryData(SOCIAL_KEYS.followStatus(targetId), ctx.prevStatus);
      }
      if (ctx?.prevConn) {
        qc.setQueryData(SOCIAL_KEYS.isConnected(targetId), ctx.prevConn);
      }
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not update follow',
      });
    },

    onSuccess: (data, { targetId }) => {
      // Server truth overrides optimistic guess.
      qc.setQueryData<FollowStatus>(SOCIAL_KEYS.followStatus(targetId), {
        following: data.following,
        status: data.following ? 'active' : undefined,
      });
      qc.setQueryData<IsConnectedResponse>(SOCIAL_KEYS.isConnected(targetId), {
        isConnected: data.isConnected,
        iFollow: data.following,
        // theyFollow unchanged — server handles that side independently.
        theyFollow: data.isConnected && data.following ? true : false,
      });
    },

    onSettled: (_, __, { targetId }) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.followStats });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.connections });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.followStatus(targetId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.isConnected(targetId) });
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.publicProfile(targetId),
      });
    },
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Connections — paginated mutual follows
// ──────────────────────────────────────────────────────────────────────────────

export const useConnections = () =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.connections,
    queryFn: ({ pageParam = 1 }) =>
      followService.getConnections({ page: pageParam }).then((r) => r.data),
    getNextPageParam: (last: any) => {
      const { page, pages } = last?.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => ({
      ...data,
      list: data.pages.flatMap((p: any) => p?.data ?? []),
    }),
  });

// ──────────────────────────────────────────────────────────────────────────────
// isConnected — single user
// ──────────────────────────────────────────────────────────────────────────────

export const useIsConnected = (userId?: string) =>
  useQuery<IsConnectedResponse>({
    queryKey: SOCIAL_KEYS.isConnected(userId ?? ''),
    queryFn: () =>
      followService.isConnected(userId as string).then((r) => r.data?.data),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

// ──────────────────────────────────────────────────────────────────────────────
// useConnectionStatus — THE derived state the UI actually renders from
// ──────────────────────────────────────────────────────────────────────────────

export interface UseConnectionStatusResult {
  status: ConnectionStatus;
  iFollow: boolean;
  theyFollow: boolean;
  isConnected: boolean;
  isSelf: boolean;
  isLoading: boolean;
}

/**
 * Resolves the FollowButton state for a given user by combining:
 *   - auth store (is it me?)
 *   - useIsConnected (server truth for both directions)
 *
 * Prefer this hook over reading `useFollowStatus` directly when you need to
 * render the 4-state Follow button.
 */
export const useConnectionStatus = (
  targetUserId?: string,
): UseConnectionStatusResult => {
  const myId = useAuthStore((s) => s.user?._id);
  const isSelf = Boolean(myId && targetUserId && myId === targetUserId);

  const { data, isLoading } = useIsConnected(
    isSelf ? undefined : targetUserId,
  );

  return useMemo(() => {
    const iFollow = data?.iFollow ?? false;
    const theyFollow = data?.theyFollow ?? false;
    const isConnected = data?.isConnected ?? false;
    const status = deriveConnectionStatus({
      isSelf,
      iFollow,
      theyFollow,
      // Block status is not surfaced by /is-connected today. When the backend
      // begins returning it, wire it through the response and pass it here.
      isBlocked: false,
    });
    return { status, iFollow, theyFollow, isConnected, isSelf, isLoading };
  }, [data, isSelf, isLoading]);
};

// ──────────────────────────────────────────────────────────────────────────────
// Bulk connection status — for search results / user lists
// ──────────────────────────────────────────────────────────────────────────────

/**
 * For each id, runs useIsConnected in parallel with useQueries. Returns a map
 * `{ [userId]: ConnectionStatus }`. Used by SearchScreen and any list that
 * shows a per-row FollowButton.
 */
export const useBulkConnectionStatus = (userIds: string[]) => {
  const myId = useAuthStore((s) => s.user?._id);

  const queries = useQueries({
    queries: userIds.map((uid) => ({
      queryKey: SOCIAL_KEYS.isConnected(uid),
      queryFn: () =>
        followService.isConnected(uid).then((r) => r.data?.data),
      enabled: Boolean(uid) && uid !== myId,
      staleTime: 30_000,
    })),
  });

  return useMemo(() => {
    const map: Record<string, ConnectionStatus> = {};
    userIds.forEach((uid, i) => {
      const q = queries[i];
      const d = q?.data as IsConnectedResponse | undefined;
      map[uid] = deriveConnectionStatus({
        isSelf: uid === myId,
        iFollow: d?.iFollow ?? false,
        theyFollow: d?.theyFollow ?? false,
      });
    });
    return {
      statusMap: map,
      isLoading: queries.some((q) => q.isLoading),
    };
  }, [userIds, queries, myId]);
};

// ──────────────────────────────────────────────────────────────────────────────
// Block user
// ──────────────────────────────────────────────────────────────────────────────

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetId: string) => followService.blockUser(targetId),
    onSuccess: (_, targetId) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.followStatus(targetId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.isConnected(targetId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.connections });
      Toast.show({ type: 'success', text1: 'User blocked' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Could not block user',
      });
    },
  });
};