const request = require('supertest');
const jobTemplateController = require('../../../src/controllers/jobTemplateController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const JobTemplate = require('../../../src/models/JobTemplate');

describe('jobTemplateController integration', () => {
  const app = getApp();

  const templatePayload = {
    title: 'Software Engineer Template',
    description: 'Template description for software engineering roles in integration tests.',
    requirements: ['Node.js', 'MongoDB'],
    salaryRange: { min: 50000, max: 90000, currency: 'USD' },
    location: 'Remote',
    category: 'software-developer',
    tags: ['backend'],
    isActive: true,
  };

  describe('GET /api/v1/admin/templates', () => {
    it('requires admin authentication', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/admin/templates')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
    });

    it('returns templates for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/admin/templates')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.templates)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/admin/templates', () => {
    it('creates template for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .post('/api/v1/admin/templates')
        .set(authHeader(admin._id))
        .send(templatePayload);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(templatePayload.title);
    });
  });

  describe('GET /api/v1/admin/templates/:id', () => {
    it('returns 404 for unknown template', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/admin/templates/507f1f77bcf86cd799439011')
        .set(authHeader(admin._id));

      expect(res.status).toBe(404);
    });

    it('returns template by id', async () => {
      const admin = await createUser({ role: 'admin' });
      const template = await JobTemplate.create({
        ...templatePayload,
        createdBy: admin._id,
      });

      const res = await request(app)
        .get(`/api/v1/admin/templates/${template._id}`)
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.title).toBe(templatePayload.title);
    });
  });

  describe('PUT /api/v1/admin/templates/:id', () => {
    it('updates template', async () => {
      const admin = await createUser({ role: 'admin' });
      const template = await JobTemplate.create({
        ...templatePayload,
        createdBy: admin._id,
      });

      const res = await request(app)
        .put(`/api/v1/admin/templates/${template._id}`)
        .set(authHeader(admin._id))
        .send({ title: 'Updated Template Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Template Title');
    });
  });

  describe('POST /api/v1/admin/templates/:id/duplicate', () => {
    it('duplicates template', async () => {
      const admin = await createUser({ role: 'admin' });
      const template = await JobTemplate.create({
        ...templatePayload,
        createdBy: admin._id,
      });

      const res = await request(app)
        .post(`/api/v1/admin/templates/${template._id}/duplicate`)
        .set(authHeader(admin._id));

      expect(res.status).toBe(201);
      expect(res.body.title).toMatch(/copy/i);
    });
  });

  describe('GET /api/v1/admin/templates/export/csv', () => {
    it('exports templates as csv', async () => {
      const admin = await createUser({ role: 'admin' });
      await JobTemplate.create({ ...templatePayload, createdBy: admin._id });

      const res = await request(app)
        .get('/api/v1/admin/templates/export/csv')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/csv|text/);
    });
  });

  describe('DELETE /api/v1/admin/templates/:id', () => {
    it('deletes template', async () => {
      const admin = await createUser({ role: 'admin' });
      const template = await JobTemplate.create({
        ...templatePayload,
        createdBy: admin._id,
      });

      const res = await request(app)
        .delete(`/api/v1/admin/templates/${template._id}`)
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);

      const deleted = await JobTemplate.findById(template._id);
      expect(deleted).toBeNull();
    });
  });

  describe('getJobTemplates (direct)', () => {
    it('returns templates with pagination', async () => {
      const admin = await createUser({ role: 'admin' });
      await JobTemplate.create({ ...templatePayload, createdBy: admin._id });

      const req = mockReq({ query: { page: '1', limit: '10' }, user: admin });
      const res = mockRes();

      await jobTemplateController.getJobTemplates(req, res);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.templates)).toBe(true);
    });
  });
});
