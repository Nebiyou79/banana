import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { commentService } from '../services/commentService';
import { SOCIAL_KEYS } from './queryKeys';
import { updateAllPostCaches } from './_cacheHelpers';
import type { AddCommentData, Comment, Post } from '../types';

/**
 * Paginated comments for a post.
 */
export const useComments = (postId: string) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.comments(postId),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await commentService.getComments(postId, {
        page: pageParam as number,
        limit: 15,
      });
      const raw = res.data;
      return { data: (raw?.data ?? []) as Comment[], pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    enabled: Boolean(postId),
    staleTime: 1000 * 30,
    select: (data) => ({
      ...data,
      comments: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

/**
 * Paginated replies for a parent comment.
 */
export const useReplies = (commentId: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: SOCIAL_KEYS.replies(commentId),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await commentService.getReplies(commentId, {
        page: pageParam as number,
        limit: 10,
      });
      const raw = res.data;
      return { data: (raw?.data ?? []) as Comment[], pagination: raw?.pagination };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination ?? {};
      return page && pages && page < pages ? page + 1 : undefined;
    },
    enabled: Boolean(commentId) && enabled,
    staleTime: 1000 * 30,
    select: (data) => ({
      ...data,
      replies: data.pages.flatMap((p) => p.data ?? []),
    }),
  });

/**
 * Add a top-level comment. Optimistically bumps comment count on the post.
 */
export const useAddComment = (postId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentData) =>
      commentService.addComment(postId, data),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['social'] });
      updateAllPostCaches(qc, postId, (p: Post) => ({
        ...p,
        stats: { ...p.stats, comments: (p.stats?.comments ?? 0) + 1 },
      }));
    },
    onError: (err: any) => {
      updateAllPostCaches(qc, postId, (p: Post) => ({
        ...p,
        stats: {
          ...p.stats,
          comments: Math.max(0, (p.stats?.comments ?? 0) - 1),
        },
      }));
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Comment failed',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_KEYS.comments(postId) });
    },
  });
};

/**
 * Reply to a comment. Invalidates the parent's replies list.
 */
export const useAddReply = (parentCommentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentData) =>
      commentService.addReply(parentCommentId, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: SOCIAL_KEYS.replies(parentCommentId),
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Reply failed',
      });
    },
  });
};

export const useUpdateComment = (postId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentService.updateComment(id, content),
    onSuccess: () => {
      if (postId) {
        qc.invalidateQueries({ queryKey: SOCIAL_KEYS.comments(postId) });
      } else {
        qc.invalidateQueries({ queryKey: ['social', 'comments'] });
      }
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Edit failed',
      });
    },
  });
};

/**
 * Delete a comment. Optimistically decrements the post's comment count.
 */
export const useDeleteComment = (postId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentService.deleteComment(id),
    onMutate: async () => {
      if (!postId) return;
      await qc.cancelQueries({ queryKey: ['social'] });
      updateAllPostCaches(qc, postId, (p: Post) => ({
        ...p,
        stats: {
          ...p.stats,
          comments: Math.max(0, (p.stats?.comments ?? 0) - 1),
        },
      }));
    },
    onError: (err: any) => {
      if (postId) {
        updateAllPostCaches(qc, postId, (p: Post) => ({
          ...p,
          stats: { ...p.stats, comments: (p.stats?.comments ?? 0) + 1 },
        }));
      }
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Delete failed',
      });
    },
    onSuccess: () => {
      if (postId) qc.invalidateQueries({ queryKey: SOCIAL_KEYS.comments(postId) });
    },
  });
};

/**
 * Toggle like on a comment. Optimistically flips `isLiked` + adjusts count
 * across the comments and replies caches.
 */
export const useToggleCommentLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      commentService.toggleCommentLike(commentId),
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: ['social'] });
      const snapshots: Array<{ key: unknown[]; value: unknown }> = [];
      const flip = (c: Comment) =>
        c._id !== commentId
          ? c
          : {
              ...c,
              isLiked: !c.isLiked,
              likes: Math.max(0, (c.likes ?? 0) + (c.isLiked ? -1 : 1)),
            };

      ['comments', 'replies'].forEach((section) => {
        qc.getQueriesData({ queryKey: ['social', section] }).forEach(([k, v]) => {
          snapshots.push({ key: k as unknown[], value: v });
        });
        qc.setQueriesData({ queryKey: ['social', section] }, (old: any) => {
          if (!old) return old;
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((pg: any) => ({
                ...pg,
                data: Array.isArray(pg?.data) ? pg.data.map(flip) : pg?.data,
              })),
            };
          }
          return old;
        });
      });

      return { snapshots };
    },
    onError: (err: any, _commentId, ctx) => {
      ctx?.snapshots?.forEach(({ key, value }) =>
        qc.setQueryData(key, value)
      );
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Like failed',
      });
    },
  });
};
