import { useInfiniteQuery } from '@tanstack/react-query';
import { postService, type FeedParams } from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS } from './queryKeys';
import type { Post } from '../types';

/**
 * Paginated, infinite-scroll feed. Returns the raw query object along with a
 * flattened `posts` array in `data.posts` via `select`.
 *
 *   const { data, fetchNextPage, hasNextPage, isFetching, refetch } = useFeed();
 *   const posts = data?.posts ?? [];
 */
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
      return {
        data,
        pagination: raw?.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2,
    select: (data) => ({
      ...data,
      posts: data.pages.flatMap((p) => p.data ?? []),
    }),
  });
