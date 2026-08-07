const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('freelanceTenderController integration', () => {
  const app = getApp();

  describe('GET /api/v1/freelance-tenders/categories', () => {
    it('returns categories without authentication', async () => {
      const res = await request(app).get('/api/v1/freelance-tenders/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/freelance-tenders', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelance-tenders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns tenders list for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelance-tenders')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/freelance-tenders/saved', () => {
    it('returns saved tenders for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelance-tenders/saved')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
