import api from '../../lib/api';
import type { AddCommentData } from '../types';

export interface CommentListParams {
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export const commentService = {
  // POST /comments/posts/:id/comments
  addComment: (postId: string, data: AddCommentData) =>
    api.post(`/comments/posts/${postId}/comments`, {
      content: data.content,
      parentType: 'Post',
      mentions: data.mentions,
      hashtags: data.hashtags,
    }),

  // POST /comments/comments/:id/replies
  addReply: (commentId: string, data: AddCommentData) =>
    api.post(`/comments/comments/${commentId}/replies`, {
      content: data.content,
      parentType: 'Comment',
      mentions: data.mentions,
      hashtags: data.hashtags,
    }),

  // PUT /comments/:id
  updateComment: (id: string, content: string) =>
    api.put(`/comments/${id}`, { content }),

  // DELETE /comments/:id
  deleteComment: (id: string) => api.delete(`/comments/${id}`),

  // POST /comments/:id/like — toggles
  toggleCommentLike: (id: string) => api.post(`/comments/${id}/like`),

  // GET /comments/posts/:id/comments
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

  // GET /comments/comments/:id/replies
  getReplies: (commentId: string, params: CommentListParams = {}) =>
    api.get(`/comments/comments/${commentId}/replies`, {
      params: { page: 1, limit: 10, ...params },
    }),

  // GET /comments/user/:userId
  getUserComments: (
    userId: string,
    params: { page?: number; limit?: number } = {}
  ) =>
    api.get(`/comments/user/${userId}`, {
      params: { page: 1, limit: 20, ...params },
    }),

  // GET /comments/search
  searchComments: (params: {
    q: string;
    parentType?: 'Post' | 'Comment';
    parentId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/comments/search', { params }),
};

export default commentService;
