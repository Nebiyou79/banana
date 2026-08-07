const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Company = require('../../../src/models/Company');

describe('companyController integration', () => {
  const app = getApp();

  describe('GET /api/v1/company/public/:id', () => {
    it('returns 404 for unknown company', async () => {
      const res = await request(app).get('/api/v1/company/public/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns public company profile', async () => {
      const user = await createUser({ role: 'company' });
      const company = await Company.create({
        user: user._id,
        name: 'Test Company Ltd',
        industry: 'technology',
      });

      const res = await request(app).get(`/api/v1/company/public/${company._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Company Ltd');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/company', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/company');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns success with null data when company profile not found', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/company')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });
  });
});
