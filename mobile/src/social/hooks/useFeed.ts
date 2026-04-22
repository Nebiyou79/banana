// src/social/hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { postService, type FeedParams } from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import type { Post } from '../types';
import { SOCIAL_KEYS } from './queryKeys';

const trendingScore = (p: Post): number => {
  const s = p.stats ?? ({} as any);
  return (
    (s.likes ?? 0) +
    (s.comments ?? 0) +
    (s.shares ?? 0) +
    (s.saves ?? 0) +
    Math.floor((s.views ?? 0) / 10)
  );
};

export const useFeed = (filters: FeedParams = {}) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.feed(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await postService.getFeedPosts({
        ...filters,
        page: pageParam as number,
        limit: 10,
      });
      const raw = res.data;
      const data: Post[] = sanitizeSocialData
        .posts(raw?.data ?? [])
        .map(postService.fixPostMediaUrls);
      return { data, pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 30,
    select: (d) => {
      const flat = d.pages.flatMap((p) => p.data ?? []);
      // Client-side trending fallback when the backend doesn't sort
      const posts =
        filters.sortBy === 'trending'
          ? [...flat].sort((a, b) => trendingScore(b) - trendingScore(a))
          : flat;
      return { ...d, posts };
    },
  });