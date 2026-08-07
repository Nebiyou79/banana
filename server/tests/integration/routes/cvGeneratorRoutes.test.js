const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('cvGeneratorRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/candidate/cv-generator/templates', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/candidate/cv-generator/templates');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns templates for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/candidate/cv-generator/templates')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      assertNoPassword(res.body);
    });

    it('returns 403 for company role', async () => {
      const company = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/candidate/cv-generator/templates')
        .set(authHeader(company._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
