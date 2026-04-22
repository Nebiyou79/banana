// src/social/services/postService.ts
import api from '../../lib/api';
import type {
  CreatePostData,
  PostMedia,
  PostVisibility,
  UpdatePostData,
} from '../types';

export interface FeedParams {
  page?: number;
  limit?: number;
  sortBy?: 'latest' | 'trending' | 'following' | 'popular';
  type?: string;
  hashtag?: string;
  followingOnly?: boolean;
}

export interface MyPostsParams {
  page?: number;
  limit?: number;
  visibility?: PostVisibility;
  type?: string;
}

export interface ProfilePostsParams {
  page?: number;
  limit?: number;
}

// Build multipart FormData for create / update with media files.
const buildPostFormData = (data: CreatePostData | UpdatePostData): FormData => {
  const fd = new FormData();
  if (data.content !== undefined) fd.append('content', data.content);
  if (data.type) fd.append('type', data.type);
  if (data.visibility) fd.append('visibility', data.visibility);
  if (data.allowComments !== undefined)
    fd.append('allowComments', String(data.allowComments));
  if (data.allowSharing !== undefined)
    fd.append('allowSharing', String(data.allowSharing));
  if (data.pinned !== undefined) fd.append('pinned', String(data.pinned));
  if (data.location) fd.append('location', JSON.stringify(data.location));
  if (data.expiresAt) fd.append('expiresAt', data.expiresAt);
  if (data.linkPreview)
    fd.append('linkPreview', JSON.stringify(data.linkPreview));
  if (data.poll) fd.append('poll', JSON.stringify(data.poll));
  if ((data as any).job) fd.append('job', (data as any).job);
  if ((data as UpdatePostData).hashtags)
    fd.append('hashtags', JSON.stringify((data as UpdatePostData).hashtags));
  if ((data as UpdatePostData).mediaToRemove)
    fd.append(
      'mediaToRemove',
      JSON.stringify((data as UpdatePostData).mediaToRemove)
    );
  if ((data as UpdatePostData).media)
    fd.append('media', JSON.stringify((data as UpdatePostData).media));

  if (data.mediaFiles && data.mediaFiles.length > 0) {
    data.mediaFiles.forEach((file) => {
      fd.append('media', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });
  }

  return fd;
};

/**
 * Ensure every PostMedia.url points at a playable asset. The backend
 * occasionally returns the video public_id with an image extension;
 * we normalise here.
 */
const fixPostMediaUrls = <T extends { media?: PostMedia[] }>(post: T): T => {
  if (!post.media || !Array.isArray(post.media)) return post;
  const fixed = post.media.map((m): PostMedia => {
    const next: PostMedia = { ...m };
    next.url = next.secure_url ?? next.url ?? '';
    if (!next.thumbnail && m.resource_type === 'video' && next.url) {
      // Cloudinary: first-second frame as JPG thumbnail
      next.thumbnail = next.url.includes('cloudinary.com')
        ? next.url
            .replace('/upload/', '/upload/w_600,h_400,c_fill,so_0/')
            .replace(/\.(mp4|mov|avi|webm)$/i, '.jpg')
        : next.url;
    }
    return next;
  });
  return { ...post, media: fixed };
};

export const postService = {
  // FEED --------------------------------------------------------------
  getFeedPosts: (params: FeedParams = {}) =>
    api.get('/posts/feed', {
      params: { page: 1, limit: 10, sortBy: 'latest', ...params },
    }),

  getMyPosts: (params: MyPostsParams = {}) =>
    api.get('/posts/my-posts', { params: { page: 1, limit: 10, ...params } }),

  getSavedPosts: (params: { page?: number; limit?: number } = {}) =>
    api.get('/posts/saved', { params: { page: 1, limit: 10, ...params } }),

  getProfilePosts: (userId: string, params: ProfilePostsParams = {}) =>
    api.get(`/posts/profile/${userId}`, {
      params: { page: 1, limit: 10, ...params },
    }),

  // CRUD --------------------------------------------------------------
  createPost: (data: CreatePostData) =>
    api.post('/posts', buildPostFormData(data), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getPost: (id: string) => api.get(`/posts/${id}`),

  updatePost: (id: string, data: UpdatePostData) =>
    api.put(`/posts/${id}`, buildPostFormData(data), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deletePost: (id: string) => api.delete(`/posts/${id}`),

  // SAVE / SHARE ------------------------------------------------------
  savePost: (id: string) => api.post(`/posts/${id}/save`),
  unsavePost: (id: string) => api.delete(`/posts/${id}/save`),
  sharePost: (id: string) => api.post(`/posts/${id}/share`),

  // Helpers -----------------------------------------------------------
  fixPostMediaUrls,
};

export default postService;