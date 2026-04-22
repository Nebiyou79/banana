// src/social/services/commentService.ts
import api from '../../lib/api';
import type { AddCommentData } from '../types';

export interface CommentListParams {
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export const commentService = {
  addComment: (postId: string, data: AddCommentData) =>
    api.post(`/comments/posts/${postId}/comments`, {
      content: data.content,
      parentType: 'Post',
      mentions: data.mentions,
      hashtags: data.hashtags,
    }),

  addReply: (commentId: string, data: AddCommentData) =>
    api.post(`/comments/comments/${commentId}/replies`, {
      content: data.content,
      parentType: 'Comment',
      mentions: data.mentions,
      hashtags: data.hashtags,
    }),

  updateComment: (id: string, content: string) =>
    api.put(`/comments/${id}`, { content }),

  deleteComment: (id: string) => api.delete(`/comments/${id}`),

  // Nested path matches the pattern used by addReply (/comments/comments/:id/...)
  toggleCommentLike: (id: string) => api.post(`/comments/comments/${id}/like`),

  getComments: (postId: string, params: CommentListParams = {}) =>
    api.get(`/comments/posts/${postId}/comments`, {
      params: {
        page: 1,
        limit: 15,
        sort: 'createdAt',
        sortOrder: 'asc',
        ...params,
      },
    }),

  getReplies: (commentId: string, params: CommentListParams = {}) =>
    api.get(`/comments/comments/${commentId}/replies`, {
      params: { page: 1, limit: 10, ...params },
    }),

  getUserComments: (
    userId: string,
    params: { page?: number; limit?: number } = {}
  ) =>
    api.get(`/comments/user/${userId}`, {
      params: { page: 1, limit: 20, ...params },
    }),

  searchComments: (params: {
    q: string;
    parentType?: 'Post' | 'Comment';
    parentId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/comments/search', { params }),
};

export default commentService;