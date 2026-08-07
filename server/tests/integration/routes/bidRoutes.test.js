const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('bidRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/bids/my-bids', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/bids/my-bids');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns bids for company role', async () => {
      const company = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/bids/my-bids')
        .set(authHeader(company._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });

    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/bids/my-bids')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
