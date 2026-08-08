const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createFreelancerProfile } = require('../../helpers/factories/freelancerFactory');

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

  describe('GET /api/v1/freelancer/stats', () => {
    it('returns stats for authenticated freelancer', async () => {
      const { user: freelancer } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/stats')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/portfolio', () => {
    it('returns portfolio list for authenticated freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelancer/portfolio')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/tenders', () => {
    it('returns tenders for authenticated freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelancer/tenders')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/health', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelancer/health');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
