import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { likeService } from '../services/likeService';
import { REACTION_EMOJI } from '../theme/socialTheme';
import {
  snapshotAllPostCaches,
  restoreAllPostCaches,
  updateAllPostCaches,
} from './_cacheHelpers';
import type { Post, ReactionType } from '../types';

/**
 * Add or update a reaction on a post. Passes `hasInteraction` so we know
 * whether to POST (new) or PUT (update) against /likes/:id/react.
 *
 * Optimistic model:
 *   - If the user had no interaction, likes++.
 *   - If the user had a dislike, dislikes-- and likes++.
 *   - If the user had a different reaction, counts don't change.
 */
export const useReact = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      reaction,
      hasInteraction,
    }: {
      postId: string;
      reaction: ReactionType;
      hasInteraction: boolean;
    }) =>
      hasInteraction
        ? likeService.updateReaction(postId, 'Post', reaction)
        : likeService.addReaction(postId, 'Post', reaction),

    onMutate: async ({ postId, reaction }) => {
      await qc.cancelQueries({ queryKey: ['social'] });
      const snapshot = snapshotAllPostCaches(qc);

      updateAllPostCaches(qc, postId, (p: Post) => {
        const wasLike = !!p.hasLiked;
        const wasDislike = !!p.hasDisliked;
        return {
          ...p,
          userReaction: reaction,
          userInteraction: {
            interactionType: 'reaction',
            value: reaction,
            emoji: REACTION_EMOJI[reaction],
          },
          hasLiked: true,
          hasDisliked: false,
          stats: {
            ...p.stats,
            likes: wasLike ? p.stats.likes : p.stats.likes + 1,
            dislikes: wasDislike
              ? Math.max(0, p.stats.dislikes - 1)
              : p.stats.dislikes,
          },
        };
      });

      return { snapshot };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.snapshot) restoreAllPostCaches(qc, ctx.snapshot);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Reaction failed',
      });
    },
    onSettled: (_d, _e, { postId }) => {
      qc.invalidateQueries({ queryKey: ['social', 'post', postId] });
    },
  });
};

/**
 * Dislike a post. Mirror logic to useReact.
 */
export const useDislike = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: { postId: string }) =>
      likeService.addDislike(postId, 'Post'),

    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ['social'] });
      const snapshot = snapshotAllPostCaches(qc);

      updateAllPostCaches(qc, postId, (p: Post) => {
        const wasLike = !!p.hasLiked;
        const wasDislike = !!p.hasDisliked;
        return {
          ...p,
          userReaction: undefined,
          userInteraction: {
            interactionType: 'dislike',
            value: 'dislike',
          },
          hasLiked: false,
          hasDisliked: true,
          stats: {
            ...p.stats,
            likes: wasLike ? Math.max(0, p.stats.likes - 1) : p.stats.likes,
            dislikes: wasDislike ? p.stats.dislikes : p.stats.dislikes + 1,
          },
        };
      });

      return { snapshot };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.snapshot) restoreAllPostCaches(qc, ctx.snapshot);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Dislike failed',
      });
    },
  });
};

/**
 * Remove ANY interaction (reaction or dislike) from a post.
 */
export const useRemoveInteraction = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      likeService.removeInteraction(postId, 'Post'),

    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['social'] });
      const snapshot = snapshotAllPostCaches(qc);

      updateAllPostCaches(qc, postId, (p: Post) => ({
        ...p,
        userReaction: undefined,
        userInteraction: undefined,
        hasLiked: false,
        hasDisliked: false,
        stats: {
          ...p.stats,
          likes: p.hasLiked ? Math.max(0, p.stats.likes - 1) : p.stats.likes,
          dislikes: p.hasDisliked
            ? Math.max(0, p.stats.dislikes - 1)
            : p.stats.dislikes,
        },
      }));

      return { snapshot };
    },
    onError: (err: any, _postId, ctx) => {
      if (ctx?.snapshot) restoreAllPostCaches(qc, ctx.snapshot);
      Toast.show({
        type: 'error',
        text1: err?.response?.data?.message ?? 'Failed to remove reaction',
      });
    },
  });
};
