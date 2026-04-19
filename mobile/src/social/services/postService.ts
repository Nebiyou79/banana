import api from '../../lib/api';
import type {
  CreatePostData,
  UpdatePostData,
  Post,
  PostMedia,
} from '../types';

export interface FeedParams {
  page?: number;
  limit?: number;
  type?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement';
  hashtag?: string;
  sortBy?: 'latest' | 'trending' | 'following';
  author?: string;
}

export interface MyPostsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'hidden' | 'deleted';
  type?: string;
}

export interface SavedPostsParams {
  page?: number;
  limit?: number;
}

export interface ProfilePostsParams {
  page?: number;
  limit?: number;
}

type RNFile = { uri: string; type: string; name: string };

/**
 * Normalize Cloudinary media URLs. The backend stores `secure_url` and may
 * omit `url`/`thumbnail`. We fill those for UI convenience.
 */
const fixPostMediaUrls = (post: Post): Post => {
  if (!post?.media?.length) return post;
  return {
    ...post,
    media: post.media.map((m: PostMedia) => ({
      ...m,
      url: m.url || m.secure_url || '',
      thumbnail:
        m.thumbnail ||
        (m.type === 'image'
          ? m.secure_url
          : m.secure_url?.replace('/upload/', '/upload/w_600,h_400,c_fill/')),
    })),
  };
};

export const postService = {
  // ---------- QUERIES ----------
  getFeedPosts: (params: FeedParams = {}) =>
    api.get('/posts/feed', { params: { page: 1, limit: 10, ...params } }),

  getMyPosts: (params: MyPostsParams = {}) =>
    api.get('/posts/my-posts', { params: { page: 1, limit: 10, ...params } }),

  getSavedPosts: (params: SavedPostsParams = {}) =>
    api.get('/posts/saved', { params: { page: 1, limit: 10, ...params } }),

  getProfilePosts: (userId: string, params: ProfilePostsParams = {}) =>
    api.get(`/posts/profile/${userId}`, {
      params: { page: 1, limit: 10, ...params },
    }),

  getPost: (id: string) => api.get(`/posts/${id}`),

  // ---------- MUTATIONS ----------
  deletePost: (id: string) => api.delete(`/posts/${id}`),

  savePost: (id: string) => api.post(`/posts/${id}/save`),

  unsavePost: (id: string) => api.delete(`/posts/${id}/save`),

  sharePost: (id: string) => api.post(`/posts/${id}/share`),

  /**
   * Create a post. If no `mediaFiles`, sends JSON. With media, sends
   * multipart/form-data with the field name "media" per backend contract.
   */
  createPost: async (data: CreatePostData) => {
    if (!data.mediaFiles || data.mediaFiles.length === 0) {
      return api.post('/posts', {
        content: data.content,
        type: data.type ?? 'text',
        visibility: data.visibility ?? 'public',
        allowComments: data.allowComments ?? true,
        allowSharing: data.allowSharing ?? true,
        pinned: data.pinned ?? false,
        location: data.location,
        expiresAt: data.expiresAt,
        linkPreview: data.linkPreview,
        poll: data.poll,
      });
    }

    const form = new FormData();
    form.append('content', data.content ?? '');
    form.append('type', data.type ?? 'text');
    form.append('visibility', data.visibility ?? 'public');
    form.append('allowComments', String(data.allowComments ?? true));
    form.append('allowSharing', String(data.allowSharing ?? true));
    form.append('pinned', String(data.pinned ?? false));
    if (data.location) form.append('location', JSON.stringify(data.location));
    if (data.linkPreview)
      form.append('linkPreview', JSON.stringify(data.linkPreview));
    if (data.poll) form.append('poll', JSON.stringify(data.poll));
    if (data.mediaDescription)
      form.append('mediaDescription', data.mediaDescription);

    data.mediaFiles.forEach((file: RNFile) => {
      form.append('media', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    return api.post('/posts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Update a post. Uses multipart/form-data because media can change.
   * `mediaToRemove` is an array of Cloudinary public_ids to delete.
   * `data.media` contains existing media items (reorder/description edits).
   * `data.mediaFiles` contains newly picked files.
   */
  updatePost: async (id: string, data: UpdatePostData) => {
    const form = new FormData();
    if (data.content !== undefined) form.append('content', data.content);
    if (data.visibility) form.append('visibility', data.visibility);
    if (data.allowComments !== undefined)
      form.append('allowComments', String(data.allowComments));
    if (data.allowSharing !== undefined)
      form.append('allowSharing', String(data.allowSharing));
    if (data.pinned !== undefined) form.append('pinned', String(data.pinned));
    if (data.location) form.append('location', JSON.stringify(data.location));
    if (data.mediaDescription)
      form.append('mediaDescription', data.mediaDescription);
    if (data.mediaToRemove?.length)
      form.append('mediaToRemove', JSON.stringify(data.mediaToRemove));

    const existingMedia = (data.media ?? []).filter((m) => m._id);
    if (existingMedia.length)
      form.append('media', JSON.stringify(existingMedia));

    data.mediaFiles?.forEach((file: RNFile) => {
      form.append('media', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    return api.put(`/posts/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ---------- UTILS ----------
  fixPostMediaUrls,
};

export default postService;
