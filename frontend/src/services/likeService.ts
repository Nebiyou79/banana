/* eslint-disable @typescript-eslint/no-explicit-any */
// services/likeService.ts
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  headline?: string;
}

export interface Reaction {
  _id: string;
  user: User;
  targetType: 'Post' | 'Comment';
  targetId: string;
  reaction: ReactionType;
  reactionEmoji: string;
  reactionLabel: string;
  createdAt: string;
  updatedAt: string;
}

export type ReactionType =
  | 'like'
  | 'love'
  | 'laugh'
  | 'wow'
  | 'sad'
  | 'angry'
  | 'celebrate'
  | 'support';

export interface ReactionStats {
  total: number;
  hasReactions: boolean;
  breakdown: Array<{
    reaction: ReactionType;
    count: number;
    percentage: number;
    emoji: string;
    label: string;
  }>;
}

export interface AddReactionResponse {
  success: boolean;
  data: {
    reaction: Reaction;
    stats: ReactionStats;
  };
  message?: string;
  code?: string;
}

export interface RemoveReactionResponse {
  code: string;
  success: boolean;
  data: {
    removedReaction: {
      reaction: ReactionType;
      reactedAt: string;
    };
    stats: ReactionStats;
  };
  message?: string;
}

export interface ReactionsResponse {
  success: boolean;
  data: {
    reactions: Reaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: ReactionStats;
    userReaction: {
      reaction: ReactionType;
      reactionEmoji: string;
      reactionLabel: string;
      reactedAt: string;
    } | null;
  };
}

export interface BulkReactionStatus {
  success: boolean;
  data: {
    reactions: {
      [targetId: string]: {
        reaction: ReactionType;
        reactionEmoji: string;
        reactionLabel: string;
        reactedAt: string;
      };
    };
    totalQueried: number;
    totalFound: number;
  };
}

// Reaction configuration
export const REACTION_TYPES: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Like' },
  love: { emoji: '❤️', label: 'Love' },
  laugh: { emoji: '😂', label: 'Laugh' },
  wow: { emoji: '😮', label: 'Wow' },
  sad: { emoji: '😢', label: 'Sad' },
  angry: { emoji: '😠', label: 'Angry' },
  celebrate: { emoji: '🎉', label: 'Celebrate' },
  support: { emoji: '🤝', label: 'Support' }
};

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Like Service Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
    code: error.response?.data?.code
  });

  const errorMessage = error.response?.data?.message || error.message || defaultMessage;
  const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';

  handleError(errorMessage);
  throw new Error(`${errorCode}: ${errorMessage}`);
};

export const likeService = {
  // Add reaction to a target
  addReaction: async (
    targetId: string,
    data: {
      reaction?: ReactionType;
      targetType?: 'Post' | 'Comment';
    } = {}
  ): Promise<{ reaction: Reaction; stats: ReactionStats }> => {
    try {
      if (!targetId || targetId === 'undefined' || targetId === 'null') {
        throw new Error('INVALID_TARGET_ID: Valid target ID is required');
      }

      const response = await api.post<AddReactionResponse>(
        `/likes/${targetId}/react`,
        {
          reaction: data.reaction || 'like',
          targetType: data.targetType || 'Post'
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.code || 'FAILED_TO_ADD_REACTION');
      }

      handleSuccess(response.data.message || 'Reaction added successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to add reaction') as never;
    }
  },

  // Remove reaction from a target
  removeReaction: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{ removedReaction: { reaction: ReactionType; reactedAt: string }; stats: ReactionStats }> => {
    try {
      if (!targetId) {
        throw new Error('INVALID_TARGET_ID: Valid target ID is required');
      }

      const response = await api.delete<RemoveReactionResponse>(
        `/likes/${targetId}/react`,
        { data: { targetType } }
      );

      if (!response.data.success) {
        throw new Error(response.data.code || 'FAILED_TO_REMOVE_REACTION');
      }

      handleSuccess(response.data.message || 'Reaction removed successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to remove reaction') as never;
    }
  },

  // Update existing reaction
  updateReaction: async (
    targetId: string,
    data: {
      reaction: ReactionType;
      targetType?: 'Post' | 'Comment';
    }
  ): Promise<{ previousReaction: ReactionType; updatedReaction: Reaction; stats: ReactionStats }> => {
    try {
      const response = await api.put<AddReactionResponse>(
        `/likes/${targetId}/react`,
        {
          reaction: data.reaction,
          targetType: data.targetType || 'Post'
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.code || 'FAILED_TO_UPDATE_REACTION');
      }

      handleSuccess(response.data.message || 'Reaction updated successfully');
      return response.data.data as any;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update reaction') as never;
    }
  },

  // // Get reactions for a target
  // getTargetReactions: async (
  //   targetId: string, 
  //   params?: {
  //     page?: number;
  //     limit?: number;
  //     reaction?: ReactionType;
  //     targetType?: 'Post' | 'Comment';
  //     sortBy?: string;
  //     sortOrder?: 'asc' | 'desc';
  //   }
  // ): Promise<ReactionsResponse['data']> => {
  //   try {
  //     const response = await api.get<ReactionsResponse>(
  //       `/likes/${targetId}/reactions`, 
  //       { params }
  //     );
  //     return response.data.data;
  //   } catch (error: any) {
  //     return handleApiError(error, 'Failed to fetch reactions') as never;
  //   }
  // },

  // Get reaction statistics
  getReactionStats: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<ReactionStats> => {
    try {
      const response = await api.get<{ success: boolean; data: ReactionStats }>(
        `/likes/${targetId}/reactions/stats`,
        { params: { targetType } }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get reaction stats:', error);
      return {
        total: 0,
        hasReactions: false,
        breakdown: []
      };
    }
  },

  // Get bulk reaction status for multiple targets
  getBulkReactionStatus: async (
    targetIds: string[],
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<BulkReactionStatus['data']> => {
    try {
      const response = await api.post<BulkReactionStatus>('/likes/bulk/status', {
        targetType,
        targetIds
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get bulk reaction status:', error);
      return {
        reactions: {},
        totalQueried: targetIds.length,
        totalFound: 0
      };
    }
  },

  // services/likeService.ts

  // Update the getUserReaction function to handle errors better:
  getUserReaction: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{
    reaction: ReactionType;
    reactionEmoji: string;
    reactionLabel: string;
    reactedAt: string;
  } | null> => {
    try {
      // Check if we have a valid targetId first
      if (!targetId || targetId.trim() === '') {
        console.warn('Invalid targetId provided to getUserReaction');
        return null;
      }

      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const reactions = await likeService.getTargetReactions(targetId, {
        targetType,
        limit: 1,
        page: 1
      });

      clearTimeout(timeoutId);
      return reactions.userReaction;
    } catch (error: any) {
      // Don't throw error, just log and return null
      console.warn(`Failed to get user reaction for ${targetType} ${targetId}:`, error.message || error);

      // Check for specific error types
      if (error.message?.includes('INVALID_TARGET_ID') ||
        error.message?.includes('FETCH_REACTIONS_ERROR') ||
        error.message?.includes('404') ||
        error.message?.includes('AbortError')) {
        // These are expected errors, return null silently
        return null;
      }

      // For unexpected errors, still return null but log
      console.error('Unexpected error in getUserReaction:', error);
      return null;
    }
  },

  // Also, update the getTargetReactions function to not throw for 404 errors:
  getTargetReactions: async (
    targetId: string,
    params?: {
      page?: number;
      limit?: number;
      reaction?: ReactionType;
      targetType?: 'Post' | 'Comment';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ReactionsResponse['data']> => {
    try {
      const response = await api.get<ReactionsResponse>(
        `/likes/${targetId}/reactions`,
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      // Check if it's a 404 (not found) error
      if (error.response?.status === 404) {
        console.log(`No reactions found for target ${targetId}, returning empty data`);
        return {
          reactions: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: 0,
            pages: 0
          },
          stats: {
            total: 0,
            hasReactions: false,
            breakdown: []
          },
          userReaction: null
        };
      }

      // For other errors, use the handleApiError
      return handleApiError(error, 'Failed to fetch reactions') as never;
    }
  },

  // Helper functions
  getReactionEmoji: (reaction: ReactionType): string => {
    return REACTION_TYPES[reaction]?.emoji || '👍';
  },

  getReactionLabel: (reaction: ReactionType): string => {
    return REACTION_TYPES[reaction]?.label || 'Like';
  },

  getAllReactionTypes: (): Array<{ type: ReactionType; emoji: string; label: string }> => {
    return Object.entries(REACTION_TYPES).map(([type, config]) => ({
      type: type as ReactionType,
      emoji: config.emoji,
      label: config.label
    }));
  },

  // Utility to format reaction count
  formatReactionCount: (stats: ReactionStats): string => {
    if (stats.total === 0) return '';
    if (stats.total === 1) {
      const mainReaction = stats.breakdown[0];
      return `${mainReaction.emoji} ${mainReaction.label}`;
    }

    const topReactions = stats.breakdown.slice(0, 3);
    const emojis = topReactions.map(r => r.emoji).join('');
    return `${emojis} ${stats.total}`;
  }
};