const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCandidate, createAdmin } = require('../../helpers/factories/userFactory');
const { runController } = require('../../helpers/runController');
const commentController = require('../../../src/controllers/commentController');
const Post = require('../../../src/models/Post');
const Comment = require('../../../src/models/Comment');

async function createTestPost(authorId, overrides = {}) {
  return Post.create({
    author: authorId,
    content: 'Post for comment integration test',
    status: 'active',
    allowComments: true,
    ...overrides,
  });
}

describe('commentController integration', () => {
  const app = getApp();

  describe('GET /api/v1/comments/posts/:id/comments', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/v1/comments/posts/507f1f77bcf86cd799439011/comments');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns comments for a post when authenticated', async () => {
      const author = await createCandidate();
      const viewer = await createCandidate();
      const post = await createTestPost(author._id);

      const res = await request(app)
        .get(`/api/v1/comments/posts/${post._id}/comments`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });

    it('returns 404 when post does not exist', async () => {
      const viewer = await createCandidate();
      const res = await request(app)
        .get('/api/v1/comments/posts/507f1f77bcf86cd799439011/comments')
        .set(authHeader(viewer._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Post not found' });
    });
  });

  describe('POST /api/v1/comments/posts/:id/comments', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/comments/posts/507f1f77bcf86cd799439011/comments')
        .send({ content: 'Unauthorized comment' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when content is empty', async () => {
      const author = await createCandidate();
      const commenter = await createCandidate();
      const post = await createTestPost(author._id);

      const res = await request(app)
        .post(`/api/v1/comments/posts/${post._id}/comments`)
        .set(authHeader(commenter._id))
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/v1/comments/comments/:id', () => {
    it('returns 403 when non-author tries to update', async () => {
      const author = await createCandidate();
      const other = await createCandidate();
      const post = await createTestPost(author._id);
      const comment = await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: 'Original comment',
      });

      const res = await request(app)
        .put(`/api/v1/comments/comments/${comment._id}`)
        .set(authHeader(other._id))
        .send({ content: 'Hijacked update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('updates own comment in database', async () => {
      const author = await createCandidate();
      const post = await createTestPost(author._id);
      const comment = await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: 'Before edit',
      });

      const res = await request(app)
        .put(`/api/v1/comments/comments/${comment._id}`)
        .set(authHeader(author._id))
        .send({ content: 'After edit' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('After edit');

      const updated = await Comment.findById(comment._id);
      expect(updated.content).toBe('After edit');
    });
  });

  describe('GET /api/v1/comments/comments/user/:userId', () => {
    it('returns 404 for unknown user', async () => {
      const viewer = await createCandidate();
      const res = await request(app)
        .get('/api/v1/comments/comments/user/507f1f77bcf86cd799439011')
        .set(authHeader(viewer._id));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('returns comments for a user', async () => {
      const author = await createCandidate();
      const viewer = await createCandidate();
      const post = await createTestPost(author._id);
      await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: 'User comment listing test',
      });

      const res = await request(app)
        .get(`/api/v1/comments/comments/user/${author._id}`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/comments/comments/search', () => {
    it('returns 400 when query is too short', async () => {
      const viewer = await createCandidate();
      const res = await request(app)
        .get('/api/v1/comments/comments/search?q=a')
        .set(authHeader(viewer._id));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 2 characters');
    });

    it('finds comments matching search query', async () => {
      const author = await createCandidate();
      const viewer = await createCandidate();
      const post = await createTestPost(author._id);
      const uniqueTerm = `uniquecomment${Date.now()}`;
      await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: `Searchable ${uniqueTerm} content`,
      });

      const res = await request(app)
        .get(`/api/v1/comments/comments/search?q=${uniqueTerm}`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /api/v1/comments/admin/comments/:id/moderate', () => {
    it('returns 403 for non-admin users', async () => {
      const author = await createCandidate();
      const post = await createTestPost(author._id);
      const comment = await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: 'Moderation target',
      });

      const res = await request(app)
        .patch(`/api/v1/comments/admin/comments/${comment._id}/moderate`)
        .set(authHeader(author._id))
        .send({ status: 'hidden' });

      expect(res.status).toBe(403);
    });
  });

  describe('commentController direct calls', () => {
    function authReq(user, extra = {}) {
      return {
        user: { userId: user._id, role: user.role, _id: user._id },
        ...extra,
      };
    }

    it('getComments returns paginated comments with sort', async () => {
      const author = await createCandidate();
      const viewer = await createCandidate();
      const post = await createTestPost(author._id);
      await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: 'First comment via controller',
      });

      const { res } = await runController(commentController.getComments, {
        req: authReq(viewer, {
          params: { id: post._id.toString() },
          query: { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
        }),
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('getCommentReplies returns replies for parent comment', async () => {
      const author = await createCandidate();
      const viewer = await createCandidate();
      const post = await createTestPost(author._id);
      const parent = await Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: post._id,
        content: 'Parent comment',
      });
      await Comment.create({
        author: author._id,
        parentType: 'Comment',
        parentId: parent._id,
        content: 'Reply comment',
      });

      const { res } = await runController(commentController.getCommentReplies, {
        req: authReq(viewer, {
          params: { id: parent._id.toString() },
          query: { page: 1, limit: 10 },
        }),
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
