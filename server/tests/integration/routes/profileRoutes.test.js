const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('profileRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/profile', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns profile for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile')
        .set(authHeader(user._id));

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/profile/completion', () => {
    it('returns profile completion for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile/completion')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
