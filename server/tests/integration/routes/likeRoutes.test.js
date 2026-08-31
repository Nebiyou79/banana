const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Post = require('../../../src/models/Post');

describe('likeRoutes integration', () => {
  const app = getApp();

  describe('POST /api/v1/likes/:id/react', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/likes/507f1f77bcf86cd799439011/react')
        .send({ reactionType: 'like' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('adds reaction when authenticated', async () => {
      const author = await createUser();
      const reactor = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Post for like route test',
        status: 'active',
      });

      const res = await request(app)
        .post(`/api/v1/likes/${post._id}/react`)
        .set(authHeader(reactor._id))
        .send({ reactionType: 'like', targetType: 'Post' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/likes/:id/stats', () => {
    it('returns interaction stats for authenticated user', async () => {
      const author = await createUser();
      const viewer = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Post for stats route test',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/likes/${post._id}/stats`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
