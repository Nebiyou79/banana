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

export interface Interaction {
  _id: string;
  user: User;
  targetType: 'Post' | 'Comment';
  targetId: string;
  interactionType: 'reaction' | 'dislike';
  value: ReactionType | DislikeType;
  emoji: string;
  label: string;
  isDisliked?: boolean;
  createdAt: string;
  updatedAt: string;
  reaction?: ReactionType;
  dislike?: DislikeType;
}

export type ReactionType =
  | 'like'
  | 'heart'
  | 'celebrate'
  | 'percent_100'
  | 'clap';

export type DislikeType = 'dislike';

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

export interface DislikeStats {
  total: number;
  hasDislikes: boolean;
  breakdown: Array<{
    dislike: DislikeType;
    count: number;
    emoji: string;
    label: string;
  }>;
}

export interface InteractionStats {
  reactions: ReactionStats;
  dislikes: DislikeStats;
  totalInteractions: number;
  hasInteractions: boolean;
}

export interface AddReactionResponse {
  success: boolean;
  data: {
    interaction: Interaction;
    stats: InteractionStats;
  };
  message?: string;
  code?: string;
}

export interface AddDislikeResponse {
  success: boolean;
  data: {
    interaction: Interaction;
    stats: InteractionStats;
  };
  message?: string;
  code?: string;
}

export interface RemoveInteractionResponse {
  code: string;
  success: boolean;
  data: {
    removedCount: number;
    removedType?: 'reaction' | 'dislike';
    removedValue?: string;
    stats: InteractionStats;
  };
  message?: string;
}

export interface UpdateReactionResponse {
  success: boolean;
  data: {
    previousReaction: ReactionType;
    updatedReaction: ReactionType;
    interaction: Interaction;
    stats: InteractionStats;
  };
  message?: string;
  code?: string;
}

export interface ToggleInteractionResponse {
  success: boolean;
  data: {
    previousInteraction: Interaction;
    newInteraction: Interaction;
    stats: InteractionStats;
  };
  message?: string;
  code?: string;
}

export interface ReactionsResponse {
  success: boolean;
  data: {
    reactions: Interaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: InteractionStats;
    userInteraction: {
      interactionType: 'reaction' | 'dislike';
      value: ReactionType | DislikeType;
      emoji: string;
      reactedAt: string;
      isDisliked: boolean;
    } | null;
  };
}

export interface DislikesResponse {
  success: boolean;
  data: {
    dislikes: Interaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: InteractionStats;
    userInteraction: {
      interactionType: 'reaction' | 'dislike';
      value: ReactionType | DislikeType;
      emoji: string;
      reactedAt: string;
      isDisliked: boolean;
    } | null;
  };
}

export interface InteractionResponse {
  success: boolean;
  data: {
    hasInteraction: boolean;
    interaction: {
      interactionType: 'reaction' | 'dislike';
      value: ReactionType | DislikeType;
      emoji: string;
      label: string;
      reactedAt: string;
      isDisliked: boolean;
    } | null;
  };
}

export interface BulkInteractionStatus {
  success: boolean;
  data: {
    interactions: {
      [targetId: string]: {
        interactionType: 'reaction' | 'dislike';
        value: ReactionType | DislikeType;
        emoji: string;
        reactedAt: string;
        isDisliked: boolean;
      };
    };
    totalQueried: number;
    totalFound: number;
  };
}

// Reaction configuration
export const REACTION_TYPES: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Like' },
  heart: { emoji: '❤️', label: 'Heart' },
  celebrate: { emoji: '🎉', label: 'Celebrate' },
  percent_100: { emoji: '💯', label: '100%' },
  clap: { emoji: '👏', label: 'Clap' }
};

// Dislike configuration
export const DISLIKE_TYPES: Record<DislikeType, { emoji: string; label: string }> = {
  dislike: { emoji: '👎', label: 'Dislike' }
};

// All interaction types
export const INTERACTION_TYPES = {
  ...REACTION_TYPES,
  ...DISLIKE_TYPES
};

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Interaction Service Error:', {
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
  ): Promise<{ interaction: Interaction; stats: InteractionStats }> => {
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

  // Add dislike to a target
  addDislike: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{ interaction: Interaction; stats: InteractionStats }> => {
    try {
      if (!targetId || targetId === 'undefined' || targetId === 'null') {
        throw new Error('INVALID_TARGET_ID: Valid target ID is required');
      }

      const response = await api.post<AddDislikeResponse>(
        `/likes/${targetId}/dislike`,
        { targetType }
      );

      if (!response.data.success) {
        throw new Error(response.data.code || 'FAILED_TO_ADD_DISLIKE');
      }

      handleSuccess(response.data.message || 'Dislike added successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to add dislike') as never;
    }
  },

  // Remove interaction (both reaction and dislike) from a target
  removeInteraction: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{
    removedCount: number;
    removedType?: 'reaction' | 'dislike';
    removedValue?: string;
    stats: InteractionStats
  }> => {
    try {
      if (!targetId) {
        throw new Error('INVALID_TARGET_ID: Valid target ID is required');
      }

      const response = await api.delete<RemoveInteractionResponse>(
        `/likes/${targetId}/interact`,
        { data: { targetType } }
      );

      if (!response.data.success) {
        throw new Error(response.data.code || 'FAILED_TO_REMOVE_INTERACTION');
      }

      handleSuccess(response.data.message || 'Interaction removed successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to remove interaction') as never;
    }
  },

  // Update existing reaction
  updateReaction: async (
    targetId: string,
    data: {
      reaction: ReactionType;
      targetType?: 'Post' | 'Comment';
    }
  ): Promise<{
    previousReaction: ReactionType;
    updatedReaction: ReactionType;
    interaction: Interaction;
    stats: InteractionStats
  }> => {
    try {
      const response = await api.put<UpdateReactionResponse>(
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
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update reaction') as never;
    }
  },

  // Toggle between reaction and dislike
  toggleInteraction: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{
    previousInteraction: Interaction;
    newInteraction: Interaction;
    stats: InteractionStats;
  }> => {
    try {
      const response = await api.post<ToggleInteractionResponse>(
        `/likes/${targetId}/toggle`,
        { targetType }
      );

      if (!response.data.success) {
        throw new Error(response.data.code || 'FAILED_TO_TOGGLE_INTERACTION');
      }

      handleSuccess(response.data.message || 'Interaction toggled successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to toggle interaction') as never;
    }
  },

  // Get reactions for a target
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
            reactions: {
              total: 0,
              hasReactions: false,
              breakdown: []
            },
            dislikes: {
              total: 0,
              hasDislikes: false,
              breakdown: []
            },
            totalInteractions: 0,
            hasInteractions: false
          },
          userInteraction: null
        };
      }

      // For other errors, use the handleApiError
      return handleApiError(error, 'Failed to fetch reactions') as never;
    }
  },

  // Get dislikes for a target
  getTargetDislikes: async (
    targetId: string,
    params?: {
      page?: number;
      limit?: number;
      targetType?: 'Post' | 'Comment';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<DislikesResponse['data']> => {
    try {
      const response = await api.get<DislikesResponse>(
        `/likes/${targetId}/dislikes`,
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      // Check if it's a 404 (not found) error
      if (error.response?.status === 404) {
        console.log(`No dislikes found for target ${targetId}, returning empty data`);
        return {
          dislikes: [],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            total: 0,
            pages: 0
          },
          stats: {
            reactions: {
              total: 0,
              hasReactions: false,
              breakdown: []
            },
            dislikes: {
              total: 0,
              hasDislikes: false,
              breakdown: []
            },
            totalInteractions: 0,
            hasInteractions: false
          },
          userInteraction: null
        };
      }

      // For other errors, use the handleApiError
      return handleApiError(error, 'Failed to fetch dislikes') as never;
    }
  },

  // Get interaction statistics
  getInteractionStats: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<InteractionStats> => {
    try {
      const response = await api.get<{ success: boolean; data: InteractionStats }>(
        `/likes/${targetId}/stats`,
        { params: { targetType } }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get interaction stats:', error);
      return {
        reactions: {
          total: 0,
          hasReactions: false,
          breakdown: []
        },
        dislikes: {
          total: 0,
          hasDislikes: false,
          breakdown: []
        },
        totalInteractions: 0,
        hasInteractions: false
      };
    }
  },

  // Get bulk interaction status for multiple targets
  getBulkInteractionStatus: async (
    targetIds: string[],
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<BulkInteractionStatus['data']> => {
    try {
      const response = await api.post<BulkInteractionStatus>('/likes/bulk/status', {
        targetType,
        targetIds
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get bulk interaction status:', error);
      return {
        interactions: {},
        totalQueried: targetIds.length,
        totalFound: 0
      };
    }
  },

getUserInteraction: async (
  targetId: string,
  targetType: 'Post' | 'Comment' = 'Post'
): Promise<{
  hasInteraction: boolean;
  interaction: {
    interactionType: 'reaction' | 'dislike';
    value: ReactionType | DislikeType;
    emoji: string;
    label: string;
    reactedAt: string;
    isDisliked: boolean;
  } | null;
}> => {
  try {
    // Validate targetId more strictly
    if (!targetId || 
        targetId.trim() === '' || 
        targetId === 'undefined' || 
        targetId === 'null' ||
        targetId.length < 10) { // Added length check for MongoDB IDs
      return { hasInteraction: false, interaction: null };
    }

    // Create abort controller with shorter timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced to 2 seconds

    try {
      const response = await api.get<InteractionResponse>(
        `/likes/${targetId}/user-interaction`,
        {
          params: { targetType },
          signal: controller.signal,
          timeout: 2000 // Axios timeout
        }
      );

      clearTimeout(timeoutId);

      if (!response.data.success) {
        return { hasInteraction: false, interaction: null };
      }

      const data = response.data.data;
      return {
        hasInteraction: data.hasInteraction,
        interaction: data.interaction ? {
          ...data.interaction,
          isDisliked: data.interaction.interactionType === 'dislike'
        } : null
      };
    } catch (apiError: any) {
      clearTimeout(timeoutId);
      throw apiError;
    }
  } catch (error: any) {
    // Don't throw error, just log and return null
    // Check for abort error specifically
    if (error.name === 'AbortError' || 
        error.code === 'ERR_CANCELED' || 
        error.message?.includes('canceled') ||
        error.message?.includes('timeout')) {
      return { hasInteraction: false, interaction: null };
    }

    // Check for network errors
    if (error.message?.includes('Network Error') ||
        error.message?.includes('Failed to fetch') ||
        error.code === 'ERR_NETWORK') {
      return { hasInteraction: false, interaction: null };
    }

    // Check for specific error types
    if (error.response?.status === 404 ||
        error.message?.includes('INVALID_TARGET_ID') ||
        error.message?.includes('FETCH_USER_INTERACTION_ERROR')) {
      return { hasInteraction: false, interaction: null };
    }

    // For 400/500 errors, return empty but don't log as error
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return { hasInteraction: false, interaction: null };
    }

    // For unexpected errors, log but return empty
    console.warn('Unexpected error in getUserInteraction:', {
      targetId,
      targetType,
      error: error.message || error
    });
    
    return { hasInteraction: false, interaction: null };
  }
},

  // Helper functions
  getReactionEmoji: (reaction: ReactionType): string => {
    return REACTION_TYPES[reaction]?.emoji || '👍';
  },

  getReactionLabel: (reaction: ReactionType): string => {
    return REACTION_TYPES[reaction]?.label || 'Like';
  },

  getDislikeEmoji: (): string => {
    return DISLIKE_TYPES.dislike.emoji;
  },

  getDislikeLabel: (): string => {
    return DISLIKE_TYPES.dislike.label;
  },

  getEmojiForValue: (value: ReactionType | DislikeType): string => {
    if (value === 'dislike') {
      return DISLIKE_TYPES.dislike.emoji;
    }
    return REACTION_TYPES[value as ReactionType]?.emoji || '👍';
  },

  getLabelForValue: (value: ReactionType | DislikeType): string => {
    if (value === 'dislike') {
      return DISLIKE_TYPES.dislike.label;
    }
    return REACTION_TYPES[value as ReactionType]?.label || 'Like';
  },

  getAllReactionTypes: (): Array<{ type: ReactionType; emoji: string; label: string }> => {
    return Object.entries(REACTION_TYPES).map(([type, config]) => ({
      type: type as ReactionType,
      emoji: config.emoji,
      label: config.label
    }));
  },

  getAllInteractionTypes: (): Array<{
    type: ReactionType | DislikeType;
    interactionType: 'reaction' | 'dislike';
    emoji: string;
    label: string;
  }> => {
    const reactions = Object.entries(REACTION_TYPES).map(([type, config]) => ({
      type: type as ReactionType,
      interactionType: 'reaction' as const,
      emoji: config.emoji,
      label: config.label
    }));

    const dislikes = Object.entries(DISLIKE_TYPES).map(([type, config]) => ({
      type: type as DislikeType,
      interactionType: 'dislike' as const,
      emoji: config.emoji,
      label: config.label
    }));

    return [...reactions, ...dislikes];
  },

  // Utility to format reaction count
  formatReactionCount: (stats: InteractionStats): string => {
    const totalReactions = stats.reactions.total;
    if (totalReactions === 0) return '';

    if (totalReactions === 1) {
      const mainReaction = stats.reactions.breakdown[0];
      if (mainReaction) {
        return `${mainReaction.emoji} ${mainReaction.label}`;
      }
    }

    const topReactions = stats.reactions.breakdown.slice(0, 3);
    const emojis = topReactions.map(r => r.emoji).join('');
    return `${emojis} ${totalReactions}`;
  },

  // Utility to format dislike count
  formatDislikeCount: (stats: InteractionStats): string => {
    const totalDislikes = stats.dislikes.total;
    if (totalDislikes === 0) return '';

    return `${DISLIKE_TYPES.dislike.emoji} ${totalDislikes}`;
  },

  // Utility to get the main interaction (reaction with highest count)
  getMainInteraction: (stats: InteractionStats): { type: 'reaction' | 'dislike'; value: string; emoji: string } | null => {
    if (!stats.hasInteractions) return null;

    const topReaction = stats.reactions.breakdown[0];
    const hasDislikes = stats.dislikes.total > 0;

    if (topReaction && topReaction.count >= stats.dislikes.total) {
      return {
        type: 'reaction',
        value: topReaction.reaction,
        emoji: topReaction.emoji
      };
    } else if (hasDislikes) {
      return {
        type: 'dislike',
        value: 'dislike',
        emoji: DISLIKE_TYPES.dislike.emoji
      };
    }

    return null;
  },

  // Check if user has liked (any reaction) the target
  hasUserReacted: async (targetId: string, targetType: 'Post' | 'Comment' = 'Post'): Promise<boolean> => {
    try {
      const result = await likeService.getUserInteraction(targetId, targetType);
      return result.hasInteraction && result.interaction?.interactionType === 'reaction';
    } catch (error) {
      console.error('Error checking user reaction:', error);
      return false;
    }
  },

  // Check if user has disliked the target
  hasUserDisliked: async (targetId: string, targetType: 'Post' | 'Comment' = 'Post'): Promise<boolean> => {
    try {
      const result = await likeService.getUserInteraction(targetId, targetType);
      return result.hasInteraction && result.interaction?.interactionType === 'dislike';
    } catch (error) {
      console.error('Error checking user dislike:', error);
      return false;
    }
  },

  // Quick reaction function (like/dislike with default reaction)
  quickReact: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{ interaction: Interaction; stats: InteractionStats }> => {
    try {
      // Check current interaction
      const current = await likeService.getUserInteraction(targetId, targetType);

      if (current.hasInteraction) {
        if (current.interaction?.interactionType === 'reaction') {
          // Already has a reaction, remove it
          const result = await likeService.removeInteraction(targetId, targetType);
          return {
            interaction: null as any,
            stats: result.stats
          };
        } else {
          // Has a dislike, change to like reaction (toggle)
          const toggleResult = await likeService.toggleInteraction(targetId, targetType);
          return {
            interaction: toggleResult.newInteraction,
            stats: toggleResult.stats
          };
        }
      } else {
        // No interaction, add like
        return likeService.addReaction(targetId, { reaction: 'like', targetType });
      }
    } catch (error) {
      return handleApiError(error, 'Failed to quick react') as never;
    }
  },

  // Quick dislike function
  quickDislike: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{ interaction: Interaction; stats: InteractionStats }> => {
    try {
      // Check current interaction
      const current = await likeService.getUserInteraction(targetId, targetType);

      if (current.hasInteraction) {
        if (current.interaction?.interactionType === 'dislike') {
          // Already has a dislike, remove it
          const result = await likeService.removeInteraction(targetId, targetType);
          return {
            interaction: null as any,
            stats: result.stats
          };
        } else {
          // Has a reaction, change to dislike (toggle)
          const toggleResult = await likeService.toggleInteraction(targetId, targetType);
          return {
            interaction: toggleResult.newInteraction,
            stats: toggleResult.stats
          };
        }
      } else {
        // No interaction, add dislike
        return likeService.addDislike(targetId, targetType);
      }
    } catch (error) {
      return handleApiError(error, 'Failed to quick dislike') as never;
    }
  },

  // Check if user has any interaction
  hasUserInteracted: async (targetId: string, targetType: 'Post' | 'Comment' = 'Post'): Promise<boolean> => {
    try {
      const result = await likeService.getUserInteraction(targetId, targetType);
      return result.hasInteraction;
    } catch (error) {
      console.error('Error checking user interaction:', error);
      return false;
    }
  },

  // Get user's current reaction type (if any)
  getUserReactionType: async (targetId: string, targetType: 'Post' | 'Comment' = 'Post'): Promise<ReactionType | null> => {
    try {
      const result = await likeService.getUserInteraction(targetId, targetType);
      if (result.hasInteraction && result.interaction?.interactionType === 'reaction') {
        return result.interaction.value as ReactionType;
      }
      return null;
    } catch (error) {
      console.error('Error getting user reaction type:', error);
      return null;
    }
  },

  // Determine next action based on current state
  getNextAction: async (
    targetId: string,
    targetType: 'Post' | 'Comment' = 'Post'
  ): Promise<{
    action: 'add_reaction' | 'add_dislike' | 'remove_interaction' | 'toggle';
    currentState: 'none' | 'reaction' | 'dislike';
  }> => {
    try {
      const current = await likeService.getUserInteraction(targetId, targetType);

      if (!current.hasInteraction) {
        return { action: 'add_reaction', currentState: 'none' };
      }

      if (current.interaction?.interactionType === 'reaction') {
        return { action: 'add_dislike', currentState: 'reaction' };
      } else {
        return { action: 'add_reaction', currentState: 'dislike' };
      }
    } catch (error) {
      console.error('Error getting next action:', error);
      return { action: 'add_reaction', currentState: 'none' };
    }
  }
};

// Export constants for direct use
export const REACTION_CONSTANTS = REACTION_TYPES;
export const DISLIKE_CONSTANTS = DISLIKE_TYPES;
export const INTERACTION_CONSTANTS = INTERACTION_TYPES;