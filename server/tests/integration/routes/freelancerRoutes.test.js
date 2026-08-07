const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('freelancerRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/freelancer/dashboard/overview', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelancer/dashboard/overview');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns dashboard for authenticated freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelancer/dashboard/overview')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/freelancer/profile', () => {
    it('returns profile for authenticated freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelancer/profile')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
