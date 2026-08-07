const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('postController integration', () => {
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
    it('returns user posts', async () => {
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
    it('creates a post', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/posts')
        .set(authHeader(user._id))
        .send({ content: 'Integration test post content' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Integration test post content');
      assertNoPassword(res.body);
    });
  });
});
