const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');

describe('jobRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/job', () => {
    it('returns 200 with active jobs publicly', async () => {
      await createActiveJob({ title: 'Route Visible Job' });

      const res = await request(app).get('/api/v1/job');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/job/categories', () => {
    it('returns job categories list', async () => {
      const res = await request(app).get('/api/v1/job/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/job/:id', () => {
    it('returns 404 for unknown job when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/job/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Job not found' });
    });

    it('returns job details for existing active job', async () => {
      const job = await createActiveJob({ title: 'Detail Route Job' });
      const user = await createUser();

      const res = await request(app)
        .get(`/api/v1/job/${job._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Detail Route Job');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/job/company/my-jobs', () => {
    it('returns company jobs for company role', async () => {
      const { user: companyUser } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/job/company/my-jobs')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/job/company/my-jobs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
