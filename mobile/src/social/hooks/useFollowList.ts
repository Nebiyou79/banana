import { useInfiniteQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { SOCIAL_KEYS } from './queryKeys';

/**
 * Followers list. If `userId` is provided, fetches that user's public
 * followers; otherwise the current user's followers.
 */
export const useFollowers = (userId?: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.followers(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number;
      const res = userId
        ? await followService.getPublicFollowers(userId, { page })
        : await followService.getFollowers({ page });
      const raw = res.data;
      return { data: raw?.data ?? [], pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60,
    select: (data) => ({
      ...data,
      list: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

/**
 * Following list. If `userId` provided, fetches that user's public following;
 * otherwise the current user's following.
 */
export const useFollowing = (userId?: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.following(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const page = pageParam as number;
      const res = userId
        ? await followService.getPublicFollowing(userId, { page })
        : await followService.getFollowing({ page });
      const raw = res.data;
      return { data: raw?.data ?? [], pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60,
    select: (data) => ({
      ...data,
      list: data.pages.flatMap((p) => p.data ?? []),
    }),
  });
