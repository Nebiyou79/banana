/* eslint-disable @typescript-eslint/no-explicit-any */
// services/commentService.ts
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface CommentMedia {
  url: string;
  type: 'image' | 'video' | 'gif';
  thumbnail?: string;
  publicId?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface CommentAuthor {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  headline?: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  role?: string;
}

export interface CommentEngagement {
  likes: number;
  replies: number;
}

export interface CommentModeration {
  status: 'active' | 'hidden' | 'deleted' | 'flagged' | 'pending';
  reportedCount: number;
}

export interface CommentMetadata {
  depth: number;
  path: string;
  edited: {
    isEdited: boolean;
    editedAt?: string;
  };
  language: string;
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
}

export interface Comment {
  _id: string;
  author: CommentAuthor;
  parentType: 'Post' | 'Comment';
  parentId: string;
  content: string;
  media: CommentMedia[];
  mentions: CommentAuthor[];
  hashtags: string[];
  engagement: CommentEngagement;
  moderation: CommentModeration;
  metadata: CommentMetadata;
  hasLiked?: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponse {
  success: boolean;
  data: Comment;
  message?: string;
}

export interface CommentsResponse {
  message: string;
  success: boolean;
  data: Comment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateCommentData {
  content: string;
  parentType?: 'Post' | 'Comment';
  parentId?: string;
  media?: CommentMedia[];
  mentions?: string[];
  hashtags?: string[];
}

export interface UpdateCommentData {
  content?: string;
  media?: CommentMedia[];
  mentions?: string[];
  hashtags?: string[];
}

export interface GetCommentsParams {
  page?: number;
  limit?: number;
  depth?: number;
  sortBy?: 'createdAt' | 'engagement.likes';
  sortOrder?: 'asc' | 'desc';
  includeReplies?: boolean;
}

// Cache implementation with better tracking
const commentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0
};

const cacheComment = (key: string, data: any) => {
  commentCache.set(key, { data, timestamp: Date.now() });
  cacheStats.sets++;
};

const getCachedComment = (key: string) => {
  const cached = commentCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    cacheStats.hits++;
    return cached.data;
  }
  // Remove expired cache
  if (cached) {
    commentCache.delete(key);
  }
  cacheStats.misses++;
  return undefined;
};

const clearRelevantCache = (postId?: string, commentId?: string) => {
  const keysToDelete: string[] = [];

  for (const key of commentCache.keys()) {
    if (postId && key.includes(`post:${postId}`)) {
      keysToDelete.push(key);
    }
    if (commentId && key.includes(`comment:${commentId}`)) {
      keysToDelete.push(key);
    }
    if (key.includes('replies:')) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => commentCache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`🧹 Cleared ${keysToDelete.length} cache entries`);
  }
};

// Error handling utility
const handleApiError = (error: any, defaultMessage: string): never => {
  const errorMessage = error.response?.data?.message || error.message || defaultMessage;

  if (error.response?.status === 401) {
    handleError('Please login to continue');
    throw new Error('Authentication required');
  }

  if (error.response?.status === 403) {
    handleError('You don\'t have permission to perform this action');
    throw new Error('Permission denied');
  }

  if (error.response?.status === 404) {
    handleError('Comment not found');
    throw new Error('Comment not found');
  }

  if (error.response?.status === 429) {
    handleError('Too many requests. Please wait a moment.');
    throw new Error('Rate limit exceeded');
  }

  handleError(errorMessage);
  throw new Error(errorMessage);
};

export const commentService = {
  /**
   * Add comment or reply
   */
  addComment: async (
    postId: string,
    data: CreateCommentData
  ): Promise<Comment> => {
    try {
      if (!data.content?.trim()) {
        throw new Error('Comment content is required');
      }

      if (data.content.length > 2000) {
        throw new Error('Comment cannot exceed 2000 characters');
      }

      let endpoint: string;
      let payload: any;

      if (data.parentType === 'Comment' && data.parentId) {
        // It's a reply to a comment
        endpoint = `/comments/comments/${data.parentId}/replies`;
        payload = {
          content: data.content.trim(),
          media: data.media || [],
          mentions: data.mentions || [],
          hashtags: data.hashtags || [],
          parentType: 'Comment',
          parentId: data.parentId
        };
      } else {
        // It's a top-level comment on a post
        endpoint = `/comments/posts/${postId}/comments`;
        payload = {
          content: data.content.trim(),
          media: data.media || [],
          mentions: data.mentions || [],
          hashtags: data.hashtags || [],
          parentType: 'Post',
          parentId: postId
        };
      }

      const response = await api.post<CommentResponse>(endpoint, payload);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to add comment');
      }

      // Clear relevant cache entries
      clearRelevantCache(postId, data.parentId);

      handleSuccess(response.data.message || 'Comment added successfully');

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to add comment');
    }
  },

  /**
   * Get post comments
   */
  getComments: async (
    postId: string,
    params?: GetCommentsParams
  ): Promise<CommentsResponse> => {
    try {
      const cacheKey = `comments:post:${postId}:${JSON.stringify(params)}`;
      const cached = getCachedComment(cacheKey);

      if (cached) {
        return cached;
      }

      const defaultParams: GetCommentsParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeReplies: true,
        ...params
      };

      const response = await api.get<CommentsResponse>(
        `/comments/posts/${postId}/comments`,
        { params: defaultParams }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch comments');
      }

      // Cache the result
      cacheComment(cacheKey, response.data);

      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch comments');
    }
  },

  /**
   * Get comment replies
   */
  getCommentReplies: async (
    commentId: string,
    params?: Omit<GetCommentsParams, 'depth'>
  ): Promise<CommentsResponse> => {
    try {
      const cacheKey = `replies:comment:${commentId}:${JSON.stringify(params)}`;
      const cached = getCachedComment(cacheKey);

      if (cached) {
        return cached;
      }

      const defaultParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        ...params
      };

      const response = await api.get<CommentsResponse>(
        `/comments/comments/${commentId}/replies`,
        { params: defaultParams }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch comment replies');
      }

      cacheComment(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch comment replies');
    }
  },

  /**
   * Update comment
   */
  updateComment: async (
    commentId: string,
    data: UpdateCommentData
  ): Promise<Comment> => {
    try {
      if (data.content && data.content.length > 2000) {
        throw new Error('Comment cannot exceed 2000 characters');
      }

      const response = await api.put<CommentResponse>(
        `/comments/comments/${commentId}`,
        data
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update comment');
      }

      // Clear cache
      clearRelevantCache(undefined, commentId);

      handleSuccess(response.data.message || 'Comment updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update comment');
    }
  },

  /**
   * Delete comment
   */
  deleteComment: async (commentId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/comments/comments/${commentId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete comment');
      }

      // Clear cache
      clearRelevantCache(undefined, commentId);

      handleSuccess(response.data.message || 'Comment deleted successfully');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete comment');
    }
  },

  /**
   * Like comment
   */
  likeComment: async (commentId: string): Promise<{ hasLiked: boolean; likes: number }> => {
    try {
      const response = await api.post<{
        success: boolean;
        data: { liked: boolean; likes: number };
      }>(`/comments/comments/${commentId}/like`);

      if (!response.data.success) {
        throw new Error('Failed to like comment');
      }

      // Clear cache for this comment
      clearRelevantCache(undefined, commentId);

      return {
        hasLiked: response.data.data.liked,
        likes: response.data.data.likes
      };
    } catch (error: any) {
      return handleApiError(error, 'Failed to like comment');
    }
  },

  /**
   * Get user's like status for a comment
   */
  getUserLikeStatus: async (commentId: string): Promise<{ hasLiked: boolean }> => {
    try {
      // Note: This endpoint might need to be implemented in your backend
      const response = await api.get<{
        success: boolean;
        data: { hasLiked: boolean };
      }>(`/comments/comments/${commentId}/like-status`);

      if (!response.data.success) {
        throw new Error('Failed to get like status');
      }

      return response.data.data;
    } catch (error) {
      console.warn('Failed to get user like status:', error);
      return { hasLiked: false };
    }
  },

  /**
   * Report comment
   */
  reportComment: async (commentId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/comments/comments/${commentId}/report`,
        { reason: reason || 'Inappropriate content' }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to report comment');
      }

      handleSuccess(response.data.message || 'Comment reported successfully');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to report comment');
    }
  },

  /**
   * Clear comment cache
   */
  clearCache: (): void => {
    const previousSize = commentCache.size;
    commentCache.clear();
    console.log(`🗑️ Cleared ${previousSize} cache entries`);
  },

  // Utility functions
  utils: {
    /**
 * Sort comments by criteria
 */
    sortComments: (
      comments: Comment[],
      sortBy: 'createdAt' | 'engagement.likes' | 'engagement.replies' = 'createdAt',
      sortOrder: 'asc' | 'desc' = 'desc'
    ): Comment[] => {
      return [...comments].sort((a, b) => {
        let aValue: number, bValue: number;

        switch (sortBy) {
          case 'engagement.likes':
            aValue = a.engagement.likes;
            bValue = b.engagement.likes;
            break;
          case 'engagement.replies':
            aValue = a.engagement.replies;
            bValue = b.engagement.replies;
            break;
          case 'createdAt':
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
        }

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    },
    /**
     * Format comment date for display
     */
    formatCommentDate: (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

      // If within the same year, show month and day
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }

      // Otherwise show full date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    },

    /**
     * Check if user can edit comment
     */
    canUserEditComment: (comment: Comment, currentUserId?: string): boolean => {
      if (!currentUserId) return false;
      const isOwner = comment.author._id === currentUserId;
      const isActive = comment.moderation.status === 'active';
      const timeLimit = 30 * 60 * 1000; // 30 minutes
      const commentAge = Date.now() - new Date(comment.createdAt).getTime();

      return isOwner && isActive && commentAge < timeLimit;
    },

    /**
     * Check if user can delete comment
     */
    canUserDeleteComment: (comment: Comment, currentUserId?: string): boolean => {
      if (!currentUserId) return false;
      const isOwner = comment.author._id === currentUserId;
      const isAdmin = comment.author.role === 'admin' || comment.author.role === 'moderator';
      return isOwner || isAdmin;
    },

    /**
     * Validate comment content
     */
    validateContent: (content: string): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!content || content.trim().length === 0) {
        errors.push('Comment cannot be empty');
      }

      if (content.length > 2000) {
        errors.push('Comment cannot exceed 2000 characters');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    /**
     * Extract mentions from content
     */
    extractMentions: (content: string): string[] => {
      const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
      const matches = content.match(mentionRegex) || [];
      return [...new Set(matches.map(mention => mention.slice(1)))];
    },

    /**
     * Extract hashtags from content
     */
    extractHashtags: (content: string): string[] => {
      const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
      const matches = content.match(hashtagRegex) || [];
      return [...new Set(matches.map(tag => tag.slice(1)))];
    },

    /**
     * Format engagement numbers (1k, 1m, etc.)
     */
    formatEngagementNumber: (num: number): string => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return num.toString();
    },

    /**
     * Get cache statistics
     */
    getCacheStats: () => ({ ...cacheStats, size: commentCache.size })
  }
};