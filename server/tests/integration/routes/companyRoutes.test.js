const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Company = require('../../../src/models/Company');

describe('companyRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/company/public/:id', () => {
    it('returns public company profile without auth', async () => {
      const companyUser = await createUser({ role: 'company' });
      const company = await Company.create({
        user: companyUser._id,
        name: 'Route Test Company',
        industry: 'technology',
      });

      const res = await request(app).get(`/api/v1/company/public/${company._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/company', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/company');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns own company for authenticated company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      await Company.create({
        user: companyUser._id,
        name: 'My Company Route Test',
        industry: 'technology',
      });

      const res = await request(app)
        .get('/api/v1/company')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
