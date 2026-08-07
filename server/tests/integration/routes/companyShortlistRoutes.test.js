const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Company = require('../../../src/models/Company');

describe('companyShortlistRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/company/shortlist', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/company/shortlist');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns shortlist for company with company profile', async () => {
      const companyUser = await createUser({ role: 'company' });
      await Company.create({
        user: companyUser._id,
        name: 'Shortlist Route Company',
        industry: 'technology',
      });

      const res = await request(app)
        .get('/api/v1/company/shortlist')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });

    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/company/shortlist')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
