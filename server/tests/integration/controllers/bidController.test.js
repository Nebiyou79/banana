const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('bidController integration', () => {
  const app = getApp();

  describe('GET /api/v1/bids/my-bids', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/bids/my-bids');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns bids list for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/bids/my-bids')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/bids/:tenderId', () => {
    it('returns 404 for unknown tender', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/bids/507f1f77bcf86cd799439011')
        .set(authHeader(companyUser._id));

      expect([404, 400]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});
