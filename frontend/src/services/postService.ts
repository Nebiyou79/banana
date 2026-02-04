/* eslint-disable @typescript-eslint/no-explicit-any */
// services/postService.ts - UPDATED FOR CLOUDINARY AND ENHANCED INTERACTIONS
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { likeService, ReactionType, InteractionStats } from './likeService';

export interface Media {
  _id?: string;
  type: 'image' | 'video' | 'document';
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  created_at?: string;
  tags?: string[];

  // Backward compatibility fields
  url: string;
  thumbnail?: string;
  thumbnails?: Array<{ url: string; width: number; height: number; filename?: string }>;
  description?: string;
  order?: number;
  filename?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  dimensions?: {
    width?: number;
    height?: number;
    format?: string;
    duration?: number;
  };
  storagePath?: string;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

export interface PollOption {
  text: string;
  votes: number;
  voters: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
  endsAt?: string;
  multipleChoice: boolean;
  totalVotes: number;
}

export interface Location {
  name?: string;
  coordinates?: [number, number];
}

export interface PostStats {
  dislikes: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
}

export interface PostAuthor {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  role?: string;
  verificationStatus?: string;
  company?: string;
}

// In postService.ts - Update the Post interface
export interface Post {
  _id: string;
  author: PostAuthor;
  authorModel: 'User' | 'Company' | 'Organization';
  content: string;
  type: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'document' | 'achievement';
  media: Media[];
  linkPreview?: LinkPreview;
  poll?: Poll;
  job?: string;
  hashtags: string[];
  mentions: string[];
  stats: PostStats;
  visibility: 'public' | 'connections' | 'private';
  allowComments: boolean;
  allowSharing: boolean;
  sharedPost?: Post;
  originalAuthor?: PostAuthor;
  status: 'active' | 'hidden' | 'deleted' | 'under_review';
  location?: Location;
  expiresAt?: string;
  pinned: boolean;
  pinnedUntil?: string;
  userReaction?: ReactionType;
  userInteraction?: {
    interactionType: 'reaction' | 'dislike';
    value: ReactionType | 'dislike';
    emoji?: string;
  };
  hasLiked?: boolean;
  hasDisliked?: boolean;
  isSaved?: boolean; // ADD THIS LINE - Save status
  canEdit?: boolean;
  canDelete?: boolean;
  lastEditedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface SavePostResponse {
  success: boolean;
  message?: string;
  code?: string;
}

export interface SavedPostsResponse extends PostsResponse {
  data: (Post & { isSaved?: boolean })[];
}
export interface CreatePostData {
  content: string;
  type?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement' | 'document';
  media?: Media[];
  linkPreview?: LinkPreview;
  poll?: Omit<Poll, 'totalVotes'>;
  job?: string;
  visibility?: 'public' | 'connections' | 'private';
  allowComments?: boolean;
  allowSharing?: boolean;
  location?: Location;
  expiresAt?: string;
  pinned?: boolean;
  mediaFiles?: File[];
  mediaDescription?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  hashtags?: string[];
  mediaToRemove?: string[];
}

export interface PostsResponse {
  success: boolean;
  data: Post[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
  code?: string;
}

export interface PostResponse {
  success: boolean;
  data: Post;
  message?: string;
  code?: string;
}

export interface FeedParams {
  page?: number;
  limit?: number;
  type?: string;
  author?: string;
  hashtag?: string;
  sortBy?: string;
}

export interface ProfilePostsParams extends FeedParams {
  includeShared?: boolean;
}

export interface MyPostsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Post Service Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response?.data?.message) {
    handleError(error.response.data.message);
    throw new Error(error.response.data.message);
  } else if (error.message) {
    handleError(error.message);
    throw error;
  } else {
    handleError(defaultMessage);
    throw new Error(defaultMessage);
  }
};

export const postService = {
  // Load user interactions for multiple posts
  loadUserInteractionsForPosts: async (posts: Post[], currentUserId?: string): Promise<Post[]> => {
    if (!currentUserId || !posts.length) return posts;

    try {
      const postIds = posts.map(post => post._id);
      const bulkStatus = await likeService.getBulkInteractionStatus(postIds, 'Post');

      return posts.map(post => {
        const interaction = bulkStatus.interactions[post._id];
        if (interaction) {
          return {
            ...post,
            userInteraction: {
              interactionType: interaction.interactionType,
              value: interaction.value as ReactionType | 'dislike',
              emoji: interaction.emoji
            },
            hasLiked: interaction.interactionType === 'reaction',
            hasDisliked: interaction.interactionType === 'dislike',
            // Update stats from interaction data if available
            stats: {
              ...post.stats,
              likes: interaction.interactionType === 'reaction' ? Math.max(post.stats.likes, 1) : post.stats.likes,
              dislikes: interaction.interactionType === 'dislike' ? Math.max(post.stats.dislikes, 1) : post.stats.dislikes
            }
          };
        }
        return post;
      });
    } catch (error) {
      console.error('Failed to load user interactions for posts:', error);
      return posts;
    }
  },

  // Update post stats based on interaction response
  updatePostStatsFromInteraction: (
    post: Post,
    stats: InteractionStats,
    userInteraction?: { interactionType: 'reaction' | 'dislike'; value: ReactionType | 'dislike'; emoji?: string }
  ): Post => {
    return {
      ...post,
      stats: {
        ...post.stats,
        likes: stats.reactions.total,
        dislikes: stats.dislikes.total
      },
      userInteraction: userInteraction || post.userInteraction,
      hasLiked: userInteraction?.interactionType === 'reaction',
      hasDisliked: userInteraction?.interactionType === 'dislike'
    };
  },

  // Enhanced getFeedPosts with user interactions
  getFeedPosts: async (params?: FeedParams, currentUserId?: string): Promise<PostsResponse> => {
    try {
      console.log('🚀 getFeedPosts called with params:', params);

      const response = await api.get<any>('/posts/feed', { params });

      console.log('📨 Raw API Response:', {
        success: response.data.success,
        dataLength: response.data.data?.length,
        code: response.data.code,
        pagination: response.data.pagination
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch feed posts');
      }

      // Ensure data is an array and fix media URLs
      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      // Load user interactions if user is logged in
      const postsWithInteractions = currentUserId
        ? await postService.loadUserInteractionsForPosts(fixedPosts, currentUserId)
        : fixedPosts;

      const result: PostsResponse = {
        success: true,
        data: postsWithInteractions,
        pagination: response.data.pagination,
        code: response.data.code
      };

      console.log('✅ Processed Posts Response:', {
        postCount: result.data.length,
        hasPagination: !!result.pagination,
        code: result.code,
        withUserInteractions: !!currentUserId
      });

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch feed posts') as never;
    }
  },

  // Enhanced getPost with user interaction
  getPost: async (id: string, currentUserId?: string): Promise<Post> => {
    try {
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Post ID is required');
      }

      const response = await api.get<PostResponse>(`/posts/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch post');
      }

      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);

      // Load user interaction if user is logged in
      if (currentUserId) {
        try {
          const userInteraction = await likeService.getUserInteraction(id, 'Post');
          if (userInteraction.hasInteraction && userInteraction.interaction) {
            const interactionData = {
              interactionType: userInteraction.interaction.interactionType,
              value: userInteraction.interaction.value as ReactionType | 'dislike',
              emoji: userInteraction.interaction.emoji
            };

            // Also fetch updated stats to ensure consistency
            const stats = await likeService.getInteractionStats(id, 'Post');

            return postService.updatePostStatsFromInteraction(
              postWithFixedUrls,
              stats,
              interactionData
            );
          }
        } catch (error) {
          console.error('Failed to load user interaction:', error);
        }
      }

      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch post') as never;
    }
  },

  // Helper for handling post reaction
  handlePostReaction: async (
    postId: string,
    reaction: ReactionType,
    currentUserId?: string
  ): Promise<{ updatedPost: Post; stats: InteractionStats }> => {
    if (!currentUserId) {
      throw new Error('User must be logged in to react');
    }

    try {
      const response = await likeService.addReaction(postId, {
        reaction,
        targetType: 'Post'
      });

      // Create updated post object
      const userInteraction = {
        interactionType: 'reaction' as const,
        value: reaction,
        emoji: likeService.getReactionEmoji(reaction)
      };

      // Get current post to merge with updated data
      const currentPost = await postService.getPost(postId, currentUserId);

      const updatedPost = postService.updatePostStatsFromInteraction(
        currentPost,
        response.stats,
        userInteraction
      );

      return {
        updatedPost,
        stats: response.stats
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add reaction');
    }
  },

  // Helper for handling post dislike
  handlePostDislike: async (
    postId: string,
    currentUserId?: string
  ): Promise<{ updatedPost: Post; stats: InteractionStats }> => {
    if (!currentUserId) {
      throw new Error('User must be logged in to dislike');
    }

    try {
      const response = await likeService.addDislike(postId, 'Post');

      // Create updated post object
      const userInteraction = {
        interactionType: 'dislike' as const,
        value: 'dislike' as const,
        emoji: likeService.getDislikeEmoji()
      };

      // Get current post to merge with updated data
      const currentPost = await postService.getPost(postId, currentUserId);

      const updatedPost = postService.updatePostStatsFromInteraction(
        currentPost,
        response.stats,
        userInteraction
      );

      return {
        updatedPost,
        stats: response.stats
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add dislike');
    }
  },

  // Helper for removing post interaction
  handleRemovePostInteraction: async (
    postId: string,
    currentUserId?: string
  ): Promise<{ updatedPost: Post; stats: InteractionStats }> => {
    if (!currentUserId) {
      throw new Error('User must be logged in to remove interaction');
    }

    try {
      const response = await likeService.removeInteraction(postId, 'Post');

      // Get current post to merge with updated data
      const currentPost = await postService.getPost(postId, currentUserId);

      const updatedPost = postService.updatePostStatsFromInteraction(
        currentPost,
        response.stats,
        undefined // No user interaction after removal
      );

      return {
        updatedPost,
        stats: response.stats
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove interaction');
    }
  },

  // Helper for toggling interaction (reaction ↔ dislike)
  handleToggleInteraction: async (
    postId: string,
    currentUserId?: string
  ): Promise<{ updatedPost: Post; stats: InteractionStats }> => {
    if (!currentUserId) {
      throw new Error('User must be logged in to toggle interaction');
    }

    try {
      const response = await likeService.toggleInteraction(postId, 'Post');

      // Create updated post object based on new interaction
      const userInteraction = {
        interactionType: response.newInteraction.interactionType,
        value: response.newInteraction.value as ReactionType | 'dislike',
        emoji: response.newInteraction.emoji
      };

      // Get current post to merge with updated data
      const currentPost = await postService.getPost(postId, currentUserId);

      const updatedPost = postService.updatePostStatsFromInteraction(
        currentPost,
        response.stats,
        userInteraction
      );

      return {
        updatedPost,
        stats: response.stats
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle interaction');
    }
  },

  // Quick reaction toggle (like/dislike) with optimistic updates
  quickToggleReaction: async (
    postId: string,
    currentPost: Post,
    currentUserId?: string
  ): Promise<{ updatedPost: Post; stats: InteractionStats }> => {
    if (!currentUserId) {
      throw new Error('User must be logged in to react');
    }

    try {
      const currentInteraction = currentPost.userInteraction;

      if (!currentInteraction) {
        // No current interaction → add default like
        return postService.handlePostReaction(postId, 'like', currentUserId);
      } else if (currentInteraction.interactionType === 'reaction') {
        // Already has a reaction → remove it
        return postService.handleRemovePostInteraction(postId, currentUserId);
      } else {
        // Has a dislike → toggle to like
        return postService.handleToggleInteraction(postId, currentUserId);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle reaction');
    }
  },

  // Quick dislike toggle with optimistic updates
  quickToggleDislike: async (
    postId: string,
    currentPost: Post,
    currentUserId?: string
  ): Promise<{ updatedPost: Post; stats: InteractionStats }> => {
    if (!currentUserId) {
      throw new Error('User must be logged in to dislike');
    }

    try {
      const currentInteraction = currentPost.userInteraction;

      if (!currentInteraction) {
        // No current interaction → add dislike
        return postService.handlePostDislike(postId, currentUserId);
      } else if (currentInteraction.interactionType === 'dislike') {
        // Already has a dislike → remove it
        return postService.handleRemovePostInteraction(postId, currentUserId);
      } else {
        // Has a reaction → toggle to dislike
        return postService.handleToggleInteraction(postId, currentUserId);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle dislike');
    }
  },

  // Get user's own posts for professional dashboard
  getMyPosts: async (params?: MyPostsParams): Promise<PostsResponse> => {
    try {
      console.log('🚀 getMyPosts called with params:', params);

      const response = await api.get<any>('/posts/my-posts', { params });

      console.log('📨 Raw My Posts API Response:', {
        success: response.data.success,
        dataLength: response.data.data?.length,
        code: response.data.code,
        pagination: response.data.pagination
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch your posts');
      }

      // Ensure data is an array and fix media URLs
      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      const result: PostsResponse = {
        success: true,
        data: fixedPosts,
        pagination: response.data.pagination,
        code: response.data.code
      };

      console.log('✅ Processed My Posts Response:', {
        postCount: result.data.length,
        hasPagination: !!result.pagination,
        code: result.code
      });

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch your posts') as never;
    }
  },

  // Get user's posts by profile ID
  getUserPosts: async (userId: string, params?: ProfilePostsParams): Promise<PostsResponse> => {
    try {
      console.log('🚀 getUserPosts called for user:', userId);

      const response = await api.get<any>(`/posts/profile/${userId}`, { params });

      console.log('📨 Raw User Posts API Response:', {
        success: response.data.success,
        dataLength: response.data.data?.length,
        code: response.data.code,
        pagination: response.data.pagination
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user posts');
      }

      // Ensure data is an array and fix media URLs
      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      const result: PostsResponse = {
        success: true,
        data: fixedPosts,
        pagination: response.data.pagination,
        code: response.data.code
      };

      console.log('✅ Processed User Posts Response:', {
        postCount: result.data.length,
        hasPagination: !!result.pagination,
        code: result.code
      });

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user posts') as never;
    }
  },

  // Create post with Cloudinary media handling
  createPost: async (data: CreatePostData): Promise<Post> => {
    try {
      // For text-only posts, send as regular JSON
      if (!data.mediaFiles || data.mediaFiles.length === 0) {
        const payload = {
          content: data.content,
          type: data.type,
          visibility: data.visibility,
          allowComments: data.allowComments,
          allowSharing: data.allowSharing,
          location: data.location,
          expiresAt: data.expiresAt,
          pinned: data.pinned,
          linkPreview: data.linkPreview,
          poll: data.poll,
          job: data.job
        };

        console.log('📤 Creating text-only post with payload:', payload);

        const response = await api.post<PostResponse>('/posts', payload, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || 'Failed to create post');
        }

        const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);
        handleSuccess('Post created successfully');
        return postWithFixedUrls;
      }

      // For posts with media, use FormData
      const formData = new FormData();

      // Append text fields
      const textFields: (keyof CreatePostData)[] = [
        'content', 'type', 'visibility', 'allowComments', 'allowSharing',
        'expiresAt', 'pinned'
      ];

      textFields.forEach(key => {
        if (data[key] !== undefined) {
          const value = data[key];
          if (typeof value === 'boolean' || typeof value === 'number') {
            formData.append(key, value.toString());
          } else if (value) {
            formData.append(key, value as string);
          }
        }
      });

      // Append media description if provided
      if (data.mediaDescription) {
        formData.append('mediaDescription', data.mediaDescription);
      }

      // Append complex objects as JSON strings
      if (data.linkPreview) {
        formData.append('linkPreview', JSON.stringify(data.linkPreview));
      }

      if (data.poll) {
        formData.append('poll', JSON.stringify(data.poll));
      }

      if (data.job) {
        formData.append('job', data.job);
      }

      if (data.location) {
        formData.append('location', JSON.stringify(data.location));
      }

      // Append media files - IMPORTANT: Cloudinary middleware expects 'media' field
      data.mediaFiles.forEach(file => {
        formData.append('media', file);
      });

      console.log('📤 Creating post with media files:', {
        fileCount: data.mediaFiles.length,
        contentLength: data.content?.length || 0,
        hasMedia: !!data.mediaFiles
      });

      const response = await api.post<PostResponse>('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minute timeout for large video uploads
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create post');
      }

      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);
      handleSuccess('Post created successfully');
      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to create post') as never;
    }
  },

  // Update post with Cloudinary media handling
  updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      // For text-only updates without new media files, send as regular JSON
      if ((!data.mediaFiles || data.mediaFiles.length === 0) && !data.mediaToRemove) {
        const payload: any = {};

        if (data.content !== undefined) payload.content = data.content;
        if (data.visibility !== undefined) payload.visibility = data.visibility;
        if (data.allowComments !== undefined) payload.allowComments = data.allowComments;
        if (data.allowSharing !== undefined) payload.allowSharing = data.allowSharing;
        if (data.pinned !== undefined) payload.pinned = data.pinned;
        if (data.location !== undefined) payload.location = data.location;
        if (data.expiresAt !== undefined) payload.expiresAt = data.expiresAt;

        console.log('🔄 Updating post without media:', payload);

        const response = await api.put<PostResponse>(`/posts/${id}`, payload, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || 'Failed to update post');
        }

        const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);
        handleSuccess('Post updated successfully');
        return postWithFixedUrls;
      }

      // For updates with media changes, use FormData
      const formData = new FormData();

      // Append basic fields only if they exist
      if (data.content !== undefined) formData.append('content', data.content);
      if (data.visibility !== undefined) formData.append('visibility', data.visibility);
      if (data.allowComments !== undefined) formData.append('allowComments', data.allowComments.toString());
      if (data.allowSharing !== undefined) formData.append('allowSharing', data.allowSharing.toString());
      if (data.pinned !== undefined) formData.append('pinned', data.pinned.toString());
      if (data.location !== undefined) formData.append('location', JSON.stringify(data.location));
      if (data.expiresAt !== undefined) formData.append('expiresAt', data.expiresAt);

      // Append media description if provided
      if (data.mediaDescription) {
        formData.append('mediaDescription', data.mediaDescription);
      }

      // Handle media removal
      if (data.mediaToRemove && data.mediaToRemove.length > 0) {
        console.log('🗑️ Removing media:', data.mediaToRemove);
        formData.append('mediaToRemove', JSON.stringify(data.mediaToRemove));
      }

      // Handle existing media updates (for reordering, descriptions, etc.)
      if (data.media && data.media.length > 0) {
        const existingMedia = data.media
          .filter(item => item._id) // Only include existing media (has _id)
          .map(item => ({
            _id: item._id,
            description: item.description,
            order: item.order
          }));

        if (existingMedia.length > 0) {
          formData.append('media', JSON.stringify(existingMedia));
        }
      }

      // Append new media files
      if (data.mediaFiles && data.mediaFiles.length > 0) {
        console.log('📁 Adding new media files:', data.mediaFiles.length);
        data.mediaFiles.forEach(file => {
          formData.append('media', file); // Cloudinary middleware expects 'media' field
        });
      }

      console.log('🔄 Updating post with media changes:', {
        contentLength: data.content?.length || 0,
        mediaToRemove: data.mediaToRemove?.length || 0,
        mediaFiles: data.mediaFiles?.length || 0,
        hasMediaArray: !!data.media
      });

      const response = await api.put<PostResponse>(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minute timeout
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update post');
      }

      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);
      handleSuccess('Post updated successfully');
      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update post') as never;
    }
  },

  // Delete post
  deletePost: async (id: string, permanent: boolean = false): Promise<void> => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const response = await api.delete(`/posts/${id}`, {
        data: { permanent }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete post');
      }

      handleSuccess(permanent ? 'Post permanently deleted' : 'Post deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete post') as never;
    }
  },
  // In postService.ts - Add these methods to the postService object

  // Save post
  savePost: async (postId: string): Promise<{ success: boolean; message?: string; code?: string }> => {
    try {
      const response = await api.post<{ success: boolean; message?: string; code?: string }>(`/posts/${postId}/save`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save post');
      }

      handleSuccess('Post saved');
      return response.data;
    } catch (error: any) {
      console.error('🔴 Save post error:', error);
      if (error.response?.data?.message) {
        handleError(error.response.data.message);
        throw new Error(error.response.data.message);
      }
      handleError('Failed to save post');
      throw new Error('Failed to save post');
    }
  },

  // Unsave post
  unsavePost: async (postId: string): Promise<{ success: boolean; message?: string; code?: string }> => {
    try {
      const response = await api.delete<{ success: boolean; message?: string; code?: string }>(`/posts/${postId}/save`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to unsave post');
      }

      handleSuccess('Post unsaved');
      return response.data;
    } catch (error: any) {
      console.error('🔴 Unsave post error:', error);
      if (error.response?.data?.message) {
        handleError(error.response.data.message);
        throw new Error(error.response.data.message);
      }
      handleError('Failed to unsave post');
      throw new Error('Failed to unsave post');
    }
  },

  // Get saved posts
  getSavedPosts: async (params?: { page?: number; limit?: number }): Promise<PostsResponse> => {
    try {
      const response = await api.get<any>('/posts/saved', { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch saved posts');
      }

      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      const result: PostsResponse = {
        success: true,
        data: fixedPosts,
        pagination: response.data.pagination,
        code: response.data.code
      };

      return result;
    } catch (error: any) {
      console.error('🔴 Get saved posts error:', error);
      if (error.response?.data?.message) {
        handleError(error.response.data.message);
        throw new Error(error.response.data.message);
      }
      handleError('Failed to fetch saved posts');
      throw new Error('Failed to fetch saved posts');
    }
  },

  // Toggle save status
  toggleSavePost: async (postId: string, currentlySaved: boolean = false): Promise<{
    saved: boolean;
    message: string;
    success: boolean;
  }> => {
    try {
      if (currentlySaved) {
        const result = await postService.unsavePost(postId);
        return {
          saved: false,
          message: 'Post unsaved',
          success: result.success
        };
      } else {
        const result = await postService.savePost(postId);
        return {
          saved: true,
          message: 'Post saved',
          success: result.success
        };
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to toggle save status');
    }
  },

  // Update getCloudinaryThumbnailUrl method to fix video thumbnails:
  getCloudinaryThumbnailUrl: (mediaItem: Media, width: number = 300, height: number = 300): string => {
    if (!mediaItem.secure_url) return '';

    if (mediaItem.type === 'image') {
      // For images, generate thumbnail URL with Cloudinary transformations
      return mediaItem.secure_url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
    } else if (mediaItem.type === 'video') {
      // FIXED: For videos, use proper video thumbnail without .jpg extension
      // Cloudinary handles video thumbnails automatically
      if (mediaItem.secure_url.includes('/upload/')) {
        // Use video transformation for thumbnail
        return mediaItem.secure_url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
      }
      return mediaItem.secure_url;
    }

    return mediaItem.secure_url;
  },

  // Check if post is saved
  checkIfSaved: async (postId: string): Promise<boolean> => {
    try {
      // This is a helper that can be implemented by checking the saved posts endpoint
      // or by having a dedicated endpoint. For now, we'll use a simple approach.
      const response = await api.get<any>('/posts/saved', { params: { limit: 1 } });

      if (response.data.success && response.data.data) {
        return response.data.data.some((post: Post) => post._id === postId);
      }

      return false;
    } catch (error) {
      console.error('Failed to check saved status:', error);
      return false;
    }
  },

  // Get profile posts
  getProfilePosts: async (profileId: string, params?: ProfilePostsParams): Promise<PostsResponse> => {
    try {
      const response = await api.get<any>(`/posts/profile/${profileId}`, { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch profile posts');
      }

      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      const result: PostsResponse = {
        success: true,
        data: fixedPosts,
        pagination: response.data.pagination,
        code: response.data.code
      };

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch profile posts') as never;
    }
  },

  // Share post
  sharePost: async (id: string, data: {
    content?: string;
    visibility?: 'public' | 'connections' | 'private';
  }): Promise<Post> => {
    try {
      const response = await api.post<PostResponse>(`/posts/${id}/share`, data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to share post');
      }

      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);
      handleSuccess('Post shared successfully');
      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to share post') as never;
    }
  },

  // Function to fix media URLs in posts - UPDATED FOR CLOUDINARY
  fixPostMediaUrls: (post: Post): Post => {
    if (!post.media || post.media.length === 0) return post;

    const fixedMedia = post.media.map(mediaItem => {
      // For Cloudinary URLs, they're already full URLs, but ensure secure_url is used
      const cloudinaryUrl = mediaItem.secure_url || mediaItem.url;

      return {
        ...mediaItem,
        url: cloudinaryUrl,
        secure_url: cloudinaryUrl,
        thumbnail: mediaItem.thumbnail || postService.getCloudinaryThumbnailUrl(mediaItem),
        thumbnails: mediaItem.thumbnails?.map(thumb => ({
          ...thumb,
          url: postService.getCloudinaryThumbnailUrl(mediaItem, thumb.width, thumb.height)
        }))
      };
    });

    return {
      ...post,
      media: fixedMedia
    };
  },

  // Helper to get full media URL - SIMPLIFIED FOR CLOUDINARY
  getFullMediaUrl: (url: string): string => {
    if (!url) return '';

    // Cloudinary URLs are already full URLs
    if (url.startsWith('http')) return url;

    // For any non-Cloudinary URLs (backward compatibility), use backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    if (url.startsWith('/')) {
      return `${backendUrl}${url}`;
    }

    return `${backendUrl}/uploads/${url}`;
  },

  formatFileSize: (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  // Professional helper functions (unchanged)
  extractHashtags: (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  },

  extractMentions: (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map(mention => mention.slice(1)) : [];
  },

  formatPostDate: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  },

  canUserViewPost: (post: Post, currentUserId?: string, isAdmin: boolean = false): boolean => {
    if (post.status !== 'active' && !(isAdmin && post.author._id === currentUserId)) {
      return false;
    }

    if (post.visibility === 'public') return true;
    if (!currentUserId) return false;

    if (post.visibility === 'private') {
      return post.author._id === currentUserId || isAdmin;
    }

    if (post.visibility === 'connections') {
      // In real implementation, check connection status
      return post.author._id === currentUserId || isAdmin;
    }

    return false;
  },

  getMediaType: (mimeType: string): 'image' | 'video' | 'document' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  },

  optimizeImageUrl: (url: string, width: number = 800, quality: number = 80): string => {
    // For Cloudinary URLs, we can add transformation parameters
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/w_${width},q_${quality}/`);
    }
    return url;
  },

  parseLocation: (location: string | Location): Location | undefined => {
    if (!location) return undefined;

    if (typeof location === 'string') {
      try {
        return JSON.parse(location);
      } catch {
        return { name: location };
      }
    }

    return location;
  },

  // Helper to prepare media for update
  prepareMediaForUpdate: (media: Media[]): Media[] => {
    return media.map(item => {
      const { _id, url, secure_url, type, thumbnail, description, order, filename, originalName, size, mimeType, dimensions } = item;

      const cleanItem: Media = {
        type,
        public_id: item.public_id || '',
        secure_url: secure_url || url,
        resource_type: type === 'image' ? 'image' : type === 'video' ? 'video' : 'raw',
        url: secure_url || url,
        thumbnail: thumbnail?.startsWith('blob:') ? '' : thumbnail
      };

      if (_id) cleanItem._id = _id;
      if (description) cleanItem.description = description;
      if (order !== undefined) cleanItem.order = order;
      if (filename) cleanItem.filename = filename;
      if (originalName) cleanItem.originalName = originalName;
      if (size) cleanItem.size = size;
      if (mimeType) cleanItem.mimeType = mimeType;
      if (dimensions) cleanItem.dimensions = dimensions;
      if (item.format) cleanItem.format = item.format;
      if (item.bytes) cleanItem.bytes = item.bytes;
      if (item.width) cleanItem.width = item.width;
      if (item.height) cleanItem.height = item.height;
      if (item.duration) cleanItem.duration = item.duration;
      if (item.created_at) cleanItem.created_at = item.created_at;
      if (item.tags) cleanItem.tags = item.tags;

      return cleanItem;
    }).filter(item => item.url && item.public_id);
  },

  // New helper to validate post data before sending
  validatePostData: (data: CreatePostData | UpdatePostData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.content && !data.mediaFiles?.length && !data.media?.length) {
      errors.push('Post must contain either content or media');
    }

    if (data.content && data.content.length > 10000) {
      errors.push('Content cannot exceed 10000 characters');
    }

    if (data.mediaFiles && data.mediaFiles.length > 10) {
      errors.push('Cannot upload more than 10 files');
    }

    if (data.mediaFiles) {
      data.mediaFiles.forEach((file, index) => {
        // Cloudinary limits: images 20MB, videos 200MB
        const maxSize = file.type.startsWith('image/') ? 20 * 1024 * 1024 : 200 * 1024 * 1024;
        if (file.size > maxSize) {
          errors.push(`File ${file.name} exceeds ${maxSize / (1024 * 1024)}MB limit`);
        }

        // Validate file types
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];

        if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
          errors.push(`File ${file.name} has unsupported type: ${file.type}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // New helper functions for interaction management
  getReactionSummary: (stats: PostStats): string => {
    if (stats.likes === 0 && stats.dislikes === 0) return '';

    const total = stats.likes + stats.dislikes;
    if (stats.likes === 0) {
      return `${stats.dislikes} 👎`;
    } else if (stats.dislikes === 0) {
      return `${stats.likes} 👍`;
    } else {
      return `${stats.likes} 👍 • ${stats.dislikes} 👎`;
    }
  },

  getCurrentUserInteraction: (post: Post): {
    type: 'reaction' | 'dislike' | 'none';
    value?: ReactionType | 'dislike';
    emoji?: string;
  } => {
    if (!post.userInteraction) {
      return { type: 'none' };
    }

    return {
      type: post.userInteraction.interactionType,
      value: post.userInteraction.value,
      emoji: post.userInteraction.emoji
    };
  },

  // Optimistic update helper for UI
  getOptimisticPostUpdate: (
    currentPost: Post,
    action: 'add_reaction' | 'add_dislike' | 'remove_interaction' | 'toggle' | 'update_reaction' | 'save' | 'unsave',
    reaction?: ReactionType
  ): Post => {
    const currentStats = { ...currentPost.stats };
    let userInteraction = currentPost.userInteraction ? { ...currentPost.userInteraction } : undefined;
    let hasLiked = currentPost.hasLiked;
    let hasDisliked = currentPost.hasDisliked;
    let isSaved = currentPost.isSaved;

    switch (action) {
      case 'add_reaction':
        userInteraction = {
          interactionType: 'reaction' as const,
          value: reaction || 'like',
          emoji: likeService.getReactionEmoji(reaction || 'like')
        };
        hasLiked = true;
        hasDisliked = false;
        currentStats.likes = (currentStats.likes || 0) + 1;
        // If switching from dislike, decrement dislike count
        if (currentPost.hasDisliked) {
          currentStats.dislikes = Math.max(0, (currentStats.dislikes || 0) - 1);
        }
        break;

      case 'add_dislike':
        userInteraction = {
          interactionType: 'dislike' as const,
          value: 'dislike',
          emoji: likeService.getDislikeEmoji()
        };
        hasLiked = false;
        hasDisliked = true;
        currentStats.dislikes = (currentStats.dislikes || 0) + 1;
        // If switching from reaction, decrement like count
        if (currentPost.hasLiked) {
          currentStats.likes = Math.max(0, (currentStats.likes || 0) - 1);
        }
        break;

      case 'remove_interaction':
        userInteraction = undefined;
        hasLiked = false;
        hasDisliked = false;
        // Decrement appropriate count
        if (currentPost.hasLiked) {
          currentStats.likes = Math.max(0, (currentStats.likes || 0) - 1);
        } else if (currentPost.hasDisliked) {
          currentStats.dislikes = Math.max(0, (currentStats.dislikes || 0) - 1);
        }
        break;

      case 'toggle':
        if (currentPost.hasLiked) {
          // Toggle from reaction to dislike
          userInteraction = {
            interactionType: 'dislike' as const,
            value: 'dislike',
            emoji: likeService.getDislikeEmoji()
          };
          hasLiked = false;
          hasDisliked = true;
          currentStats.likes = Math.max(0, (currentStats.likes || 0) - 1);
          currentStats.dislikes = (currentStats.dislikes || 0) + 1;
        } else if (currentPost.hasDisliked) {
          // Toggle from dislike to reaction (default like)
          userInteraction = {
            interactionType: 'reaction' as const,
            value: 'like',
            emoji: likeService.getReactionEmoji('like')
          };
          hasLiked = true;
          hasDisliked = false;
          currentStats.dislikes = Math.max(0, (currentStats.dislikes || 0) - 1);
          currentStats.likes = (currentStats.likes || 0) + 1;
        }
        break;

      case 'update_reaction':
        if (currentPost.hasLiked && reaction) {
          userInteraction = {
            interactionType: 'reaction' as const,
            value: reaction,
            emoji: likeService.getReactionEmoji(reaction)
          };
          // No count change when updating reaction type
        }
        break;

      case 'save':
        if (!isSaved) {
          isSaved = true;
          currentStats.saves = (currentStats.saves || 0) + 1;
        }
        break;

      case 'unsave':
        if (isSaved) {
          isSaved = false;
          currentStats.saves = Math.max(0, (currentStats.saves || 0) - 1);
        }
        break;
    }

    return {
      ...currentPost,
      stats: currentStats,
      userInteraction,
      hasLiked,
      hasDisliked,
      isSaved
    };
  }
};