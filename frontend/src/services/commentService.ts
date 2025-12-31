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
  isOnline?: boolean;
  lastSeen?: string;
}

export interface CommentEngagement {
  likes: number;
  replies: number;
  shares: number;
  views: number;
}

export interface CommentModeration {
  status: 'active' | 'hidden' | 'deleted' | 'flagged' | 'pending';
  reportedCount: number;
  reportedBy: Array<{
    user: string;
    reason: string;
    reportedAt: string;
  }>;
  moderatedBy?: CommentAuthor;
  moderationNotes?: string;
  moderatedAt?: string;
}

export interface CommentMetadata {
  depth: number;
  path: string;
  edited: {
    isEdited: boolean;
    editedAt?: string;
    editHistory: Array<{
      content: string;
      editedAt: string;
      reason?: string;
    }>;
  };
  language: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  mentionsCount: number;
  wordCount: number;
}

export interface Comment {
  _id: string;
  id: string;
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
  userReaction?: string;
  hasLiked?: boolean;
  replies?: Comment[];
  isCollapsed?: boolean;
  isReplyLoading?: boolean;
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

export interface SearchCommentsParams {
  q: string;
  page?: number;
  limit?: number;
  parentType?: 'Post' | 'Comment';
  parentId?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetCommentsParams {
  page?: number;
  limit?: number;
  depth?: number;
  sortBy?: 'createdAt' | 'engagement.likes' | 'updatedAt' | 'metadata.depth';
  sortOrder?: 'asc' | 'desc';
  includeReplies?: boolean;
  includeDeleted?: boolean;
  includeHidden?: boolean;
  authorId?: string;
  excludePinned?: boolean;
}

export interface LikeResponse {
  liked: boolean;
  likes: number;
  like?: {
    _id: string;
    user: string;
    targetType: string;
    targetId: string;
    reaction: string;
    createdAt: string;
  };
}

export interface ReportResponse {
  reportedCount: number;
  status: string;
  message: string;
}

// Cache implementation
const commentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cacheComment = (key: string, data: any) => {
  commentCache.set(key, { data, timestamp: Date.now() });
};

const getCachedComment = (key: string) => {
  const cached = commentCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return undefined;
};

// Error handling utility
const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Comment Service Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
    config: error.config
  });

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

  if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors
      .map((err: any) => err.msg || err.message)
      .join(', ');
    handleError(validationErrors);
    throw new Error(validationErrors);
  }

  handleError(errorMessage);
  throw new Error(errorMessage);
};

export const commentService = {
  /**
   * Add comment or reply
   * Unified method that handles both top-level comments and replies
   */
  addComment: async (
    postId: string,
    data: CreateCommentData
  ): Promise<Comment> => {
    try {
      // Validate input
      if (!data.content?.trim()) {
        throw new Error('Comment content is required');
      }

      if (data.content.length > 2000) {
        throw new Error('Comment cannot exceed 2000 characters');
      }

      let endpoint: string;
      let payload: any;

      console.log('Adding comment with data:', {
        postId,
        parentType: data.parentType,
        parentId: data.parentId,
        contentLength: data.content.length
      });

      // Determine if this is a reply or top-level comment
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
        console.log('Creating reply to comment:', payload);
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
        console.log('Creating comment on post:', payload);
      }

      const response = await api.post<CommentResponse>(endpoint, payload);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to add comment');
      }

      // Clear relevant cache entries
      const cacheKeys = Array.from(commentCache.keys());
      cacheKeys.forEach(key => {
        if (key.includes(`post:${postId}`) || key.includes(`comment:`)) {
          commentCache.delete(key);
        }
      });

      handleSuccess(response.data.message || 'Comment added successfully');

      // FIX: Ensure the response has proper structure
      const commentData = response.data.data;
      return {
        ...commentData,
        replies: commentData.replies || [],
        userReaction: commentData.userReaction || undefined,
        hasLiked: commentData.hasLiked || false
      };
    } catch (error: any) {
      console.error('Add comment error:', error);
      return handleApiError(error, 'Failed to add comment');
    }
  },

  /**
   * Get post comments with proper tree structure
   */
  getComments: async (
    postId: string,
    params?: GetCommentsParams
  ): Promise<CommentsResponse> => {
    try {
      const cacheKey = `comments:post:${postId}:${JSON.stringify(params)}`;
      const cached = getCachedComment(cacheKey);

      if (cached) {
        console.log('Using cached comments');
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

      // Build comment tree from the response
      if (response.data.data && Array.isArray(response.data.data)) {
        const commentTree = commentService.utils.buildCommentTree(response.data.data);
        response.data.data = commentTree;

        // Cache the result
        cacheComment(cacheKey, response.data);
      }

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
        limit: 50,
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

      // Clear cache for this comment and its parent
      const cacheKeys = Array.from(commentCache.keys());
      cacheKeys.forEach(key => {
        if (key.includes(`comment:${commentId}`) || key.includes('comments:post:')) {
          commentCache.delete(key);
        }
      });

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
      const cacheKeys = Array.from(commentCache.keys());
      cacheKeys.forEach(key => {
        if (key.includes(`comment:${commentId}`) || key.includes('comments:post:')) {
          commentCache.delete(key);
        }
      });

      handleSuccess(response.data.message || 'Comment deleted successfully');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete comment');
    }
  },

  /**
   * Toggle comment like
   */
  toggleCommentLike: async (commentId: string): Promise<{ liked: boolean; likes: number }> => {
    try {
      console.log('Toggling like for comment:', commentId);

      const response = await api.post<{
        success: boolean;
        data: {
          liked: boolean;
          likes: number;
          action?: string;
          like?: any;
        };
        message?: string;
      }>(`/comments/comments/${commentId}/like`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to toggle comment like');
      }

      const message = response.data.data.liked ? 'Liked comment' : 'Removed like';
      handleSuccess(message);

      // Clear cache for this comment and its parent
      const cacheKeys = Array.from(commentCache.keys());
      cacheKeys.forEach(key => {
        if (key.includes(`comment:${commentId}`) || key.includes('comments:post:')) {
          commentCache.delete(key);
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Toggle comment like error:', error);
      return handleApiError(error, 'Failed to toggle comment like');
    }
  },

  /**
   * Report comment
   */
  reportComment: async (commentId: string, reason?: string): Promise<ReportResponse> => {
    try {
      const response = await api.post<{ success: boolean; data: ReportResponse; message?: string }>(
        `/comments/comments/${commentId}/report`,
        { reason: reason || 'Inappropriate content' }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to report comment');
      }

      handleSuccess(response.data.message || 'Comment reported successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to report comment');
    }
  },

  /**
   * Get user's comments
   */
  getUserComments: async (
    userId: string,
    params?: GetCommentsParams
  ): Promise<CommentsResponse> => {
    try {
      const cacheKey = `comments:user:${userId}:${JSON.stringify(params)}`;
      const cached = getCachedComment(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await api.get<CommentsResponse>(
        `/comments/user/${userId}`,
        { params }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user comments');
      }

      cacheComment(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user comments');
    }
  },

  /**
   * Pin/unpin comment
   */
  pinComment: async (commentId: string, pin: boolean = true): Promise<Comment> => {
    try {
      const response = await api.patch<CommentResponse>(
        `/comments/comments/${commentId}/pin`,
        { pin }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to pin comment');
      }

      handleSuccess(pin ? 'Comment pinned' : 'Comment unpinned');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to pin comment');
    }
  },

  /**
   * Clear comment cache
   */
  clearCache: (): void => {
    commentCache.clear();
    console.log('Comment cache cleared');
  },

  // Utility functions
  utils: {
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
     * Build nested comment structure from flat list
     */
    buildCommentTree: (comments: Comment[]): Comment[] => {
      if (!comments || !Array.isArray(comments)) return [];

      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create map of all comments
      comments.forEach(comment => {
        // Ensure replies array exists
        const commentWithReplies = {
          ...comment,
          replies: []
        };
        commentMap.set(comment._id, commentWithReplies);
      });

      // Second pass: build tree structure
      comments.forEach(comment => {
        const mappedComment = commentMap.get(comment._id)!;

        if (comment.parentType === 'Comment' && comment.parentId) {
          // This is a reply, find its parent
          const parentComment = commentMap.get(comment.parentId);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.push(mappedComment);
          }
        } else {
          // This is a root comment
          rootComments.push(mappedComment);
        }
      });

      // Sort root comments by creation date (newest first)
      return rootComments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },

    /**
     * Validate comment content
     */
    validateContent: (content: string): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!content || content.trim().length === 0) {
        errors.push('Comment cannot be empty');
      }

      if (content.trim().length < 1) {
        errors.push('Comment must be at least 1 character long');
      }

      if (content.length > 2000) {
        errors.push('Comment cannot exceed 2000 characters');
      }

      // Check for excessive newlines
      const newlineCount = (content.match(/\n/g) || []).length;
      if (newlineCount > 10) {
        errors.push('Too many line breaks');
      }

      // Check for excessive special characters
      const specialCharCount = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g) || []).length;
      if (specialCharCount > content.length * 0.3) {
        errors.push('Too many special characters');
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
     * Calculate reading time for comment
     */
    calculateReadingTime: (content: string): number => {
      const wordsPerMinute = 200;
      const wordCount = content.trim().split(/\s+/).length;
      return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    },

    /**
     * Get comment preview
     */
    getContentPreview: (content: string, maxLength: number = 120): string => {
      if (content.length <= maxLength) return content;

      const trimmed = content.substring(0, maxLength);
      const lastSpace = trimmed.lastIndexOf(' ');

      return lastSpace > 0
        ? trimmed.substring(0, lastSpace) + '...'
        : trimmed + '...';
    },

    /**
     * Check if comment is visible to user
     */
    isCommentVisible: (comment: Comment, currentUserId?: string): boolean => {
      if (comment.moderation.status === 'active') return true;
      if (comment.moderation.status === 'deleted') return false;

      // For hidden/flagged comments, check permissions
      if (currentUserId) {
        const isOwner = comment.author._id === currentUserId;
        const isModerator = comment.author.role === 'admin' || comment.author.role === 'moderator';
        return isOwner || isModerator;
      }

      return false;
    },

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
     * Flatten comment tree to array
     */
    flattenCommentTree: (comments: Comment[]): Comment[] => {
      const flattened: Comment[] = [];

      const flatten = (comment: Comment) => {
        flattened.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(flatten);
        }
      };

      comments.forEach(flatten);
      return flattened;
    },

    /**
     * Get total engagement count
     */
    getTotalEngagement: (comment: Comment): number => {
      return comment.engagement.likes + comment.engagement.replies + comment.engagement.shares;
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
    }
  }
};