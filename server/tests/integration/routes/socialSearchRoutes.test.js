const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('socialSearchRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/social-search/profiles', () => {
    it('returns profile search results without auth', async () => {
      await createUser({ name: 'Social Search User' });

      const res = await request(app)
        .get('/api/v1/social-search/profiles')
        .query({ q: 'Social Search' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });

    it('returns profile search results with optional auth', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/social-search/profiles')
        .set(authHeader(user._id))
        .query({ q: 'test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/social-search/trending', () => {
    it('returns trending hashtags publicly', async () => {
      const res = await request(app).get('/api/v1/social-search/trending');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
