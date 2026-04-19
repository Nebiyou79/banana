import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { postService, type MyPostsParams } from '../services/postService';
import { sanitizeSocialData } from '../services/sanitize';
import { SOCIAL_KEYS } from './queryKeys';
import type { CreatePostData, Post, UpdatePostData } from '../types';

/**
 * Own posts list (paginated). Uses useInfiniteQuery so long lists paginate
 * without reloading from scratch.
 */
export const useMyPosts = (filters: MyPostsParams = {}) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.myPosts(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await postService.getMyPosts({
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
    staleTime: 1000 * 60,
    select: (data) => ({
      ...data,
      posts: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostData) => postService.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social', 'feed'] });
      qc.invalidateQueries({ queryKey: ['social', 'myPosts'] });
      Toast.show({ type: 'success', text1: 'Post published!' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Failed to create post',
      });
    },
  });
};

export const useUpdatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostData }) =>
      postService.updatePost(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.post(id) });
      qc.invalidateQueries({ queryKey: ['social', 'myPosts'] });
      qc.invalidateQueries({ queryKey: ['social', 'feed'] });
      Toast.show({ type: 'success', text1: 'Post updated' });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Update failed',
      });
    },
  });
};

/**
 * Delete a post. Optimistically removes it from every post cache with rollback
 * if the request fails.
 */
export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postService.deletePost(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['social'] });

      const snapshots: Array<{ key: unknown[]; value: unknown }> = [];
      const rootKeys: string[][] = [
        ['social', 'feed'],
        ['social', 'myPosts'],
        ['social', 'savedPosts'],
        ['social', 'profilePosts'],
      ];

      rootKeys.forEach((key) => {
        qc.getQueriesData({ queryKey: key }).forEach(([k, v]) => {
          snapshots.push({ key: k as unknown[], value: v });
        });
        qc.setQueriesData({ queryKey: key }, (old: any) => {
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
          if (Array.isArray(old)) return old.filter((p: Post) => p?._id !== id);
          return old;
        });
      });

      return { snapshots };
    },
    onError: (err: any, _id, ctx) => {
      ctx?.snapshots?.forEach(({ key, value }) => qc.setQueryData(key, value));
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Delete failed',
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Post deleted' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['social', 'myPosts'] });
      qc.invalidateQueries({ queryKey: ['social', 'feed'] });
      qc.invalidateQueries({ queryKey: ['social', 'savedPosts'] });
    },
  });
};
