import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { followService } from '../services/followService';
import { SOCIAL_KEYS } from './queryKeys';
import type { BulkFollowStatus, FollowStatus, FollowTargetType } from '../types';

/**
 * Is the current user following `targetId`?
 */
export const useFollowStatus = (
  targetId: string,
  targetType: FollowTargetType = 'User'
) =>
  useQuery({
    queryKey: SOCIAL_KEYS.followStatus(targetId),
    queryFn: async () => {
      const res = await followService.getFollowStatus(targetId, targetType);
      return (res.data?.data ?? res.data) as FollowStatus;
    },
    enabled: Boolean(targetId),
    staleTime: 1000 * 60,
  });

/**
 * Check follow status for many users at once. Useful for list screens
 * (Network, Search results) to avoid N+1 calls.
 */
export const useBulkFollowStatus = (
  userIds: string[],
  targetType: FollowTargetType = 'User',
  enabled = true
) =>
  useQuery({
    queryKey: SOCIAL_KEYS.bulkFollowStatus(userIds),
    queryFn: async () => {
      const res = await followService.getBulkFollowStatus(userIds, targetType);
      return (res.data?.data ?? res.data) as BulkFollowStatus;
    },
    enabled: enabled && userIds.length > 0,
    staleTime: 1000 * 30,
  });

/**
 * Toggle follow/unfollow. Optimistically flips `following` on the status
 * cache, bumps stats cache, and adjusts isFollowing on public profile.
 */
export const useToggleFollow = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetId,
      targetType = 'User',
      source = 'profile',
    }: {
      targetId: string;
      targetType?: FollowTargetType;
      source?: string;
    }) => followService.toggleFollow(targetId, targetType, source),

    onMutate: async ({ targetId }) => {
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.followStatus(targetId) });
      await qc.cancelQueries({ queryKey: SOCIAL_KEYS.followStats });

      // Snapshots for rollback
      const prevStatus = qc.getQueryData<FollowStatus>(
        SOCIAL_KEYS.followStatus(targetId)
      );
      const prevStats = qc.getQueryData<any>(SOCIAL_KEYS.followStats);
      const prevPublic = qc.getQueryData<any>(
        SOCIAL_KEYS.publicProfile(targetId)
      );

      const wasFollowing = !!prevStatus?.following;

      // Flip status
      qc.setQueryData<FollowStatus>(
        SOCIAL_KEYS.followStatus(targetId),
        (old) => ({ ...(old ?? {}), following: !wasFollowing })
      );

      // Adjust my stats (I gain/lose one followed account)
      if (prevStats) {
        qc.setQueryData(SOCIAL_KEYS.followStats, {
          ...prevStats,
          following: Math.max(
            0,
            (prevStats.following ?? 0) + (wasFollowing ? -1 : 1)
          ),
        });
      }

      // Reflect on public profile
      if (prevPublic) {
        qc.setQueryData(SOCIAL_KEYS.publicProfile(targetId), {
          ...prevPublic,
          isFollowing: !wasFollowing,
          socialStats: prevPublic.socialStats
            ? {
                ...prevPublic.socialStats,
                followerCount: Math.max(
                  0,
                  (prevPublic.socialStats.followerCount ?? 0) +
                    (wasFollowing ? -1 : 1)
                ),
              }
            : prevPublic.socialStats,
        });
      }

      return { prevStatus, prevStats, prevPublic };
    },

    onError: (err: any, { targetId }, ctx) => {
      if (ctx?.prevStatus !== undefined)
        qc.setQueryData(SOCIAL_KEYS.followStatus(targetId), ctx.prevStatus);
      if (ctx?.prevStats !== undefined)
        qc.setQueryData(SOCIAL_KEYS.followStats, ctx.prevStats);
      if (ctx?.prevPublic !== undefined)
        qc.setQueryData(SOCIAL_KEYS.publicProfile(targetId), ctx.prevPublic);

      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Follow failed',
      });
    },

    onSettled: (_d, _e, { targetId }) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.followStatus(targetId) });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.followStats });
      qc.invalidateQueries({ queryKey: ['social', 'followers'] });
      qc.invalidateQueries({ queryKey: ['social', 'following'] });
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.publicProfile(targetId),
      });
    },
  });
};

/**
 * Pending follow requests (for approval flows, e.g. private profiles).
 */
export const usePendingRequests = () =>
  useQuery({
    queryKey: SOCIAL_KEYS.pending,
    queryFn: async () => {
      const res = await followService.getPendingRequests();
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 1000 * 30,
  });

export const useAcceptFollowRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followId: string) =>
      followService.acceptFollowRequest(followId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.pending });
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.followStats });
      qc.invalidateQueries({ queryKey: ['social', 'followers'] });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Accept failed',
      });
    },
  });
};

export const useRejectFollowRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followId: string) =>
      followService.rejectFollowRequest(followId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.pending });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Reject failed',
      });
    },
  });
};
