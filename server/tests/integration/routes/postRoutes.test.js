const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Post = require('../../../src/models/Post');

describe('postRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/posts/feed', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/posts/feed');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns feed for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/feed')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/posts/my-posts', () => {
    it('returns authenticated user posts', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/my-posts')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/posts', () => {
    it('creates a post and persists to DB', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/posts')
        .set(authHeader(user._id))
        .send({ content: 'Route integration post content' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Route integration post content');

      const post = await Post.findById(res.body.data._id);
      expect(post).toBeTruthy();
      expect(post.author.toString()).toBe(user._id.toString());
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('returns 404 for unknown post', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/posts/health', () => {
    it('returns error when health path is captured by :id route', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/health')
        .set(authHeader(user._id));
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
