/* eslint-disable @typescript-eslint/no-explicit-any */
// services/postService.ts - COMPLETELY FIXED VERSION
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { ReactionType } from './likeService';

// In your postService.ts, update the Media interface:
export interface Media {
  duration: string;
  _id?: string;
  url: string;
  type: 'image' | 'video' | 'document';
  thumbnail?: string;
  description?: string;
  order?: number;
  filename?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
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

export interface Post {
  _id: string;
  author: PostAuthor;
  authorModel: 'User' | 'Company' | 'Organization';
  content: string;
  type: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement';
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
  hasLiked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  content: string;
  type?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement';
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
}

export interface PostResponse {
  success: boolean;
  data: Post;
  message?: string;
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
  // Get professional feed posts - FIXED
  getFeedPosts: async (params?: FeedParams): Promise<PostsResponse> => {
    try {
      console.log('🚀 getFeedPosts called with params:', params);

      const response = await api.get<any>('/posts/feed', { params });

      console.log('📨 Raw API Response:', {
        success: response.data.success,
        data: response.data.data,
        dataLength: response.data.data?.length,
        pagination: response.data.pagination
      });

      // FIX: Handle the response structure properly
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch feed posts');
      }

      // Ensure data is an array and fix media URLs
      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      const result: PostsResponse = {
        success: true,
        data: fixedPosts,
        pagination: response.data.pagination
      };

      console.log('✅ Processed Posts Response:', {
        postCount: result.data.length,
        hasPagination: !!result.pagination
      });

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch feed posts') as never;
    }
  },

  // Get user's own posts for professional dashboard - FIXED
  getMyPosts: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PostsResponse> => {
    try {
      console.log('🚀 getMyPosts called with params:', params);

      const response = await api.get<any>('/posts/my/posts', { params });

      console.log('📨 Raw My Posts API Response:', {
        success: response.data.success,
        data: response.data.data,
        dataLength: response.data.data?.length,
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
        pagination: response.data.pagination
      };

      console.log('✅ Processed My Posts Response:', {
        postCount: result.data.length,
        hasPagination: !!result.pagination
      });

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch your posts') as never;
    }
  },

  getUserPosts: async (userId: string, params?: ProfilePostsParams): Promise<PostsResponse> => {
    try {
      console.log('🚀 getUserPosts called for user:', userId);

      const response = await api.get<any>(`/posts/profile/${userId}`, { params });

      console.log('📨 Raw User Posts API Response:', {
        success: response.data.success,
        data: response.data.data,
        dataLength: response.data.data?.length,
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
        pagination: response.data.pagination
      };

      console.log('✅ Processed User Posts Response:', {
        postCount: result.data.length,
        hasPagination: !!result.pagination
      });

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user posts') as never;
    }
  },

  // Create post with professional media handling
  createPost: async (data: CreatePostData): Promise<Post> => {
    try {
      const formData = new FormData();

      // Append text fields professionally
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

      // Append complex objects as JSON strings
      if (data.media && data.media.length > 0) {
        formData.append('media', JSON.stringify(data.media));
      }

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

      // Append media files professionally
      if (data.mediaFiles) {
        data.mediaFiles.forEach(file => {
          formData.append('media', file);
        });
      }

      const response = await api.post<PostResponse>('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create post');
      }

      // FIX: Ensure media URLs are properly formatted
      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);

      handleSuccess('Post created successfully');
      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to create post') as never;
    }
  },

  // Get specific post with professional access control
  getPost: async (id: string): Promise<Post> => {
    try {
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Post ID is required');
      }

      const response = await api.get<PostResponse>(`/posts/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch post');
      }

      // FIX: Ensure media URLs are properly formatted
      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);

      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch post') as never;
    }
  },

  // Update post professionally - COMPLETELY FIXED
  // In your postService.ts, update the updatePost function to prevent auto-save:

  updatePost: async (id: string, data: UpdatePostData): Promise<Post> => {
    try {
      if (!id) {
        throw new Error('Post ID is required');
      }

      const formData = new FormData();

      // Append basic fields only if they exist
      if (data.content !== undefined) formData.append('content', data.content);
      if (data.visibility !== undefined) formData.append('visibility', data.visibility);
      if (data.allowComments !== undefined) formData.append('allowComments', data.allowComments.toString());
      if (data.allowSharing !== undefined) formData.append('allowSharing', data.allowSharing.toString());
      if (data.pinned !== undefined) formData.append('pinned', data.pinned.toString());
      if (data.hashtags !== undefined) formData.append('hashtags', JSON.stringify(data.hashtags));

      // IMPORTANT: Only send mediaToRemove if explicitly provided
      if (data.mediaToRemove && data.mediaToRemove.length > 0) {
        console.log('🗑️ Removing media IDs:', data.mediaToRemove);
        formData.append('mediaToRemove', JSON.stringify(data.mediaToRemove));
      }

      // Append new media files only if provided
      if (data.mediaFiles && data.mediaFiles.length > 0) {
        console.log('📁 Adding new media files:', data.mediaFiles.length);
        data.mediaFiles.forEach(file => {
          formData.append('media', file);
        });
      } else if (data.media) {
        // If media array is provided (for reordering), send it as JSON
        const cleanedMedia = data.media
          .filter(item => !item.url.startsWith('blob:')) // Don't send blob URLs
          .map(item => ({
            _id: item._id,
            description: item.description,
            order: item.order
          }));

        if (cleanedMedia.length > 0) {
          formData.append('media', JSON.stringify(cleanedMedia));
        }
      }

      console.log('🔄 Updating post with:', {
        contentLength: data.content?.length || 0,
        mediaToRemove: data.mediaToRemove?.length || 0,
        mediaFiles: data.mediaFiles?.length || 0,
        hasMediaArray: !!data.media
      });

      const response = await api.put<PostResponse>(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update post');
      }

      // Fix media URLs
      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);

      handleSuccess('Post updated successfully');
      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update post') as never;
    }
  },

  // Delete post professionally
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

  // Get profile posts with professional privacy
  getProfilePosts: async (profileId: string, params?: ProfilePostsParams): Promise<PostsResponse> => {
    try {
      const response = await api.get<any>(`/posts/profile/${profileId}`, { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch profile posts');
      }

      // Ensure data is an array and fix media URLs
      const postsData = Array.isArray(response.data.data) ? response.data.data : [];
      const fixedPosts = postsData.map((post: any) => postService.fixPostMediaUrls(post));

      const result: PostsResponse = {
        success: true,
        data: fixedPosts,
        pagination: response.data.pagination
      };

      return result;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch profile posts') as never;
    }
  },

  // Share post professionally
  sharePost: async (id: string, data: {
    content?: string;
    visibility?: 'public' | 'connections' | 'private';
  }): Promise<Post> => {
    try {
      const response = await api.post<PostResponse>(`/posts/${id}/share`, data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to share post');
      }

      // FIX: Ensure media URLs are properly formatted
      const postWithFixedUrls = postService.fixPostMediaUrls(response.data.data);

      handleSuccess('Post shared successfully');
      return postWithFixedUrls;
    } catch (error: any) {
      return handleApiError(error, 'Failed to share post') as never;
    }
  },

  // Function to fix media URLs in posts
  fixPostMediaUrls: (post: Post): Post => {
    if (!post.media || post.media.length === 0) return post;

    const fixedMedia = post.media.map(mediaItem => ({
      ...mediaItem,
      url: postService.getFullImageUrl(mediaItem.url),
      thumbnail: mediaItem.thumbnail ? postService.getFullImageUrl(mediaItem.thumbnail) : undefined
    }));

    return {
      ...post,
      media: fixedMedia
    };
  },

  // Helper to get full image URL
  getFullImageUrl: (url: string): string => {
    if (!url) return '';

    // If it's already a full URL (starts with http), return as is
    if (url.startsWith('http')) return url;

    // If it's a relative path starting with /uploads or /thumbnails
    // Prepend the backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    // Handle both /uploads/filename and uploads/filename cases
    if (url.startsWith('/')) {
      return `${backendUrl}${url}`;
    } else {
      return `${backendUrl}/${url}`;
    }
  },

  // Professional helper functions
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
    // In real implementation, this would generate optimized image URLs
    // For Cloudinary: return url.replace('/upload/', `/upload/w_${width},q_${quality}/`);
    return url;
  },

  // New function to handle location data
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

  // Helper to prepare media for update (remove blob URLs and temporary fields)
  prepareMediaForUpdate: (media: Media[]): Media[] => {
    return media.map(item => {
      const { _id, url, type, thumbnail, description, order, filename, originalName, size, mimeType, dimensions } = item;

      // Remove any blob URLs or temporary data
      const cleanItem: Media = {
        url: url.startsWith('blob:') ? '' : url, // Don't send blob URLs to server
        type,
        thumbnail: thumbnail?.startsWith('blob:') ? '' : thumbnail,
        duration: ''
      };

      // Only include other fields if they exist
      if (_id) cleanItem._id = _id;
      if (description) cleanItem.description = description;
      if (order !== undefined) cleanItem.order = order;
      if (filename) cleanItem.filename = filename;
      if (originalName) cleanItem.originalName = originalName;
      if (size) cleanItem.size = size;
      if (mimeType) cleanItem.mimeType = mimeType;
      if (dimensions) cleanItem.dimensions = dimensions;

      return cleanItem;
    }).filter(item => item.url); // Remove items without valid URLs
  }
};