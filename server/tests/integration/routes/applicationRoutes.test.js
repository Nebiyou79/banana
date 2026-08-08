const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const Application = require('../../../src/models/Application');

async function seedApplicationForRoutes() {
  const { user: companyUser, company } = await createCompanyWithUser();
  const candidate = await createUser({ role: 'candidate' });
  candidate.cvs.push({
    fileName: 'routes-cv.pdf',
    originalName: 'Routes CV.pdf',
    filePath: '/uploads/cv/routes-cv.pdf',
    fileUrl: '/api/v1/uploads/cv/routes-cv.pdf',
    downloadUrl: '/api/v1/uploads/cv/routes-cv.pdf',
    fileExtension: 'pdf',
    size: 1024,
    mimetype: 'application/pdf',
    isPrimary: true,
  });
  await candidate.save();

  const job = await createActiveJob({ company: company._id, createdBy: companyUser._id });
  const application = await Application.create({
    job: job._id,
    candidate: candidate._id,
    userInfo: { name: candidate.name, email: candidate.email },
    coverLetter: 'Routes application cover letter text.',
    selectedCVs: [{ cvId: candidate.cvs[0]._id, filename: candidate.cvs[0].fileName }],
    contactInfo: { email: candidate.email, phone: '0911223344' },
  });

  return { application, candidate, companyUser, company, job };
}

describe('applicationRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/applications/my-applications', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/applications/my-applications');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns applications for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/applications/my-applications')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });

    it('returns 403 for non-candidate role', async () => {
      const company = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/applications/my-applications')
        .set(authHeader(company._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/applications/statistics/overview', () => {
    it('returns statistics for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/applications/statistics/overview')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/applications/my-cvs', () => {
    it('returns CV list for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/applications/my-cvs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.cvs)).toBe(true);
    });

    it('returns 403 for company role', async () => {
      const company = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/applications/my-cvs')
        .set(authHeader(company._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/applications/company/applications', () => {
    it('returns company applications for company role', async () => {
      const { user: companyUser } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/applications/company/applications')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/v1/applications/:applicationId/company-response', () => {
    it('returns 400 when status missing', async () => {
      const { application, companyUser } = await seedApplicationForRoutes();
      const res = await request(app)
        .put(`/api/v1/applications/${application._id}/company-response`)
        .set(authHeader(companyUser._id))
        .send({ message: 'No status' });

      expect(res.status).toBe(400);
    });

    it('adds company response', async () => {
      const { application, companyUser } = await seedApplicationForRoutes();
      const res = await request(app)
        .put(`/api/v1/applications/${application._id}/company-response`)
        .set(authHeader(companyUser._id))
        .send({ status: 'active-consideration', message: 'Good fit' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/applications/company/:applicationId', () => {
    it('returns company application details', async () => {
      const { application, companyUser } = await seedApplicationForRoutes();
      const res = await request(app)
        .get(`/api/v1/applications/company/${application._id}`)
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/applications/cv/:cvId/download', () => {
    it('returns 404 for unknown cv', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/applications/cv/${fakeId}/download`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(404);
    });
  });
});
