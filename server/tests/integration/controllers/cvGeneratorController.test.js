const request = require('supertest');
const cvGeneratorController = require('../../../src/controllers/cvGeneratorController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

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

    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/candidate/cv-generator/templates');
      expect(res.status).toBe(401);
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

    it('returns 400 for invalid template', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/candidate/cv-generator/preview')
        .set(authHeader(candidate._id))
        .send({ templateId: 'nonexistent-template' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/candidate/cv-generator/generate', () => {
    it('generates CV pdf for candidate', async () => {
      const candidate = await createUser({ role: 'candidate', name: 'CV Generate User' });
      const res = await request(app)
        .post('/api/v1/candidate/cv-generator/generate')
        .set(authHeader(candidate._id))
        .send({ templateId: 'modern', description: 'Generated in integration test' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cv).toBeDefined();
    });
  });

  describe('POST /api/v1/candidate/cv-generator/regenerate/:cvId', () => {
    it('regenerates existing CV', async () => {
      const candidate = await createUser({ role: 'candidate', name: 'CV Regen User' });
      const generateRes = await request(app)
        .post('/api/v1/candidate/cv-generator/generate')
        .set(authHeader(candidate._id))
        .send({ templateId: 'modern' });

      const cvId = generateRes.body.data.cv._id;
      const res = await request(app)
        .post(`/api/v1/candidate/cv-generator/regenerate/${cvId}`)
        .set(authHeader(candidate._id))
        .send({ templateId: 'modern' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/candidate/cv-generator/download/:cvId', () => {
    it('downloads generated CV', async () => {
      const candidate = await createUser({ role: 'candidate', name: 'CV Download User' });
      const generateRes = await request(app)
        .post('/api/v1/candidate/cv-generator/generate')
        .set(authHeader(candidate._id))
        .send({ templateId: 'modern' });

      const cvId = generateRes.body.data.cv._id;
      const res = await request(app)
        .get(`/api/v1/candidate/cv-generator/download/${cvId}`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/i);
    });
  });

  describe('getTemplates (direct)', () => {
    it('returns templates via controller', () => {
      const req = mockReq();
      const res = mockRes();

      cvGeneratorController.getTemplates(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('listGeneratedCVs (direct)', () => {
    it('lists CVs via controller', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const req = mockReq({ user: { userId: candidate._id } });
      const res = mockRes();

      await cvGeneratorController.listGeneratedCVs(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
