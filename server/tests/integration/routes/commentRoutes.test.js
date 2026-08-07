const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Post = require('../../../src/models/Post');

describe('commentRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/comments/posts/:id/comments', () => {
    it('returns comments for a post when authenticated', async () => {
      const author = await createUser();
      const viewer = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Route test post for comments',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/comments/posts/${post._id}/comments`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });

    it('returns 404 when post does not exist', async () => {
      const viewer = await createUser();
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
  });
});
