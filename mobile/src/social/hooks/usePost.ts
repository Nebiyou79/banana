import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { postService } from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS } from './queryKeys';
import { updateAllPostCaches } from './_cacheHelpers';
import type { Post } from '../types';

/**
 * Fetch a single post with full engagement context.
 */
export const usePost = (id: string) =>
  useQuery({
    queryKey: SOCIAL_KEYS.post(id),
    queryFn: async () => {
      const res = await postService.getPost(id);
      const raw = res.data?.data ?? res.data;
      if (!raw) return null;
      return postService.fixPostMediaUrls(sanitizeSocialData.post(raw));
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

/**
 * Share a post. Optimistically bumps the `shares` stat across all caches.
 */
export const useSharePost = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.sharePost(postId),
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: ['social'] });
      updateAllPostCaches(qc, postId, (p: Post) => ({
        ...p,
        stats: { ...p.stats, shares: (p.stats?.shares ?? 0) + 1 },
      }));
    },
    onError: (err: any, postId) => {
      // Roll back the share bump
      updateAllPostCaches(qc, postId, (p: Post) => ({
        ...p,
        stats: {
          ...p.stats,
          shares: Math.max(0, (p.stats?.shares ?? 0) - 1),
        },
      }));
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Share failed',
      });
    },
    onSettled: (_, __, postId) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.post(postId) });
    },
  });
};
