import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  postService,
  type SavedPostsParams,
} from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS } from './queryKeys';
import { updateAllPostCaches } from './_cacheHelpers';
import type { Post } from '../types';

export const useSavedPosts = (filters: SavedPostsParams = {}) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.savedPosts(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await postService.getSavedPosts({
        ...filters,
        page: pageParam as number,
        limit: 10,
      });
      const raw = res.data;
      const data: Post[] = sanitizeSocialData
        .posts(raw?.data ?? [])
        .map(postService.fixPostMediaUrls)
        .map((p) => ({ ...p, isSaved: true }));
      return { data, pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60,
    select: (data) => ({
      ...data,
      posts: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

/**
 * Save / unsave a post. `isSaved` is the CURRENT state — we flip it.
 * Optimistically updates every post cache + rolls back on failure.
 */
export const useToggleSavePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) =>
      isSaved ? postService.unsavePost(id) : postService.savePost(id),
    onMutate: async ({ id, isSaved }) => {
      await qc.cancelQueries({ queryKey: ['social'] });

      // Snapshot savedPosts so we can reinsert on error
      const savedSnapshots = qc
        .getQueriesData({ queryKey: ['social', 'savedPosts'] })
        .map(([k, v]) => ({ key: k as unknown[], value: v }));

      // Flip isSaved + adjust count across caches
      updateAllPostCaches(qc, id, (p: Post) => ({
        ...p,
        isSaved: !isSaved,
        stats: {
          ...p.stats,
          saves: Math.max(0, (p.stats?.saves ?? 0) + (isSaved ? -1 : 1)),
        },
      }));

      // If unsaving, remove from savedPosts cache pages
      if (isSaved) {
        qc.setQueriesData(
          { queryKey: ['social', 'savedPosts'] },
          (old: any) => {
            if (!old) return old;
            if (old.pages) {
              return {
                ...old,
                pages: old.pages.map((pg: any) => ({
                  ...pg,
                  data: Array.isArray(pg?.data)
                    ? pg.data.filter((p: Post) => p?._id !== id)
                    : pg?.data,
                })),
              };
            }
            return old;
          }
        );
      }

      return { savedSnapshots };
    },
    onError: (err: any, { id, isSaved }, ctx) => {
      // Revert the flip
      updateAllPostCaches(qc, id, (p: Post) => ({
        ...p,
        isSaved,
        stats: {
          ...p.stats,
          saves: Math.max(0, (p.stats?.saves ?? 0) + (isSaved ? 1 : -1)),
        },
      }));
      ctx?.savedSnapshots?.forEach(({ key, value }) =>
        qc.setQueryData(key, value)
      );
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Save failed',
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['social', 'savedPosts'] });
    },
  });
};
