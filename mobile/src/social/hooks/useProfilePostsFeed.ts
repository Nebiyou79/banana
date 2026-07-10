/**
 * mobile/src/social/hooks/useProfilePostsFeed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Infinite-query hook that fetches the public posts for a given user.
 * Used by PublicProfileScreen's Posts tab.
 *
 * Wraps postService.getProfilePosts() which hits GET /posts/profile/:userId.
 * Mirrors the exact pattern used by useFeed and useMyPosts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { postService }      from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS }      from './queryKeys';
import type { Post }        from '../types';

export const useProfilePostsFeed = (userId: string | undefined) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.profilePosts(userId ?? ''),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await postService.getProfilePosts(userId as string, {
        page:  pageParam as number,
        limit: 10,
      });
      const raw  = res.data;
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
    enabled:   Boolean(userId),
    staleTime: 1000 * 60,
    select: (d) => ({
      ...d,
      posts: d.pages.flatMap((p) => p.data ?? []),
    }),
  });