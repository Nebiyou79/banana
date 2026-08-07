const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('cvGeneratorController integration', () => {
  const app = getApp();

  describe('GET /api/v1/candidate/cv-generator/templates', () => {
    it('returns CV templates list', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/candidate/cv-generator/templates')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.templates.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/candidate/cv-generator/list', () => {
    it('returns generated CVs for authenticated candidate', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/candidate/cv-generator/list')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.cvs)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/candidate/cv-generator/preview', () => {
    it('returns HTML preview for valid template', async () => {
      const candidate = await createUser({ role: 'candidate', name: 'CV Preview User' });
      const res = await request(app)
        .post('/api/v1/candidate/cv-generator/preview')
        .set(authHeader(candidate._id))
        .send({ templateId: 'modern' });

      expect(res.status).toBe(200);
      expect(res.text).toMatch(/html/i);
    });
  });
});
