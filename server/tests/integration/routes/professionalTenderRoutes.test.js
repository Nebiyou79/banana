const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('professionalTenderRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/professional-tenders/categories', () => {
    it('returns categories publicly', async () => {
      const res = await request(app).get('/api/v1/professional-tenders/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/professional-tenders', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/professional-tenders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns tenders for authenticated company user', async () => {
      const company = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/professional-tenders')
        .set(authHeader(company._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
