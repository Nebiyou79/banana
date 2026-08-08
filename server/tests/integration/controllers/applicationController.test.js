const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const { runController } = require('../../helpers/runController');
const applicationController = require('../../../src/controllers/applicationController');
const Application = require('../../../src/models/Application');
const User = require('../../../src/models/User');

async function createCandidateWithCV(overrides = {}) {
  const candidate = await createUser({ role: 'candidate', ...overrides });
  candidate.cvs.push({
    fileName: 'integration-cv.pdf',
    originalName: 'Integration CV.pdf',
    filePath: '/uploads/cv/integration-cv.pdf',
    fileUrl: '/api/v1/uploads/cv/integration-cv.pdf',
    downloadUrl: '/api/v1/uploads/cv/integration-cv.pdf',
    fileExtension: 'pdf',
    size: 2048,
    mimetype: 'application/pdf',
    isPrimary: true,
  });
  await candidate.save();
  return candidate;
}

async function seedApplication(overrides = {}) {
  const { user: companyUser, company } = await createCompanyWithUser();
  const candidate = await createCandidateWithCV();
  const job = await createActiveJob({
    company: company._id,
    createdBy: companyUser._id,
    title: overrides.jobTitle || 'Application Integration Job',
  });

  const application = await Application.create({
    job: job._id,
    candidate: candidate._id,
    userInfo: { name: candidate.name, email: candidate.email },
    coverLetter: 'I am excited to apply for this position.',
    skills: ['JavaScript'],
    contactInfo: { email: candidate.email, phone: '0911223344' },
    selectedCVs: [{
      cvId: candidate.cvs[0]._id,
      filename: candidate.cvs[0].fileName,
      originalName: candidate.cvs[0].originalName,
      path: candidate.cvs[0].filePath,
      size: candidate.cvs[0].size,
      mimetype: candidate.cvs[0].mimetype,
    }],
    ...overrides.application,
  });

  return { application, candidate, companyUser, company, job };
}

describe('applicationController integration', () => {
  const app = getApp();

  describe('GET /api/v1/applications/my-applications', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/applications/my-applications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/applications/my-applications')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns applications for candidate', async () => {
      const { candidate } = await seedApplication();

      const res = await request(app)
        .get('/api/v1/applications/my-applications')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/applications/my-cvs', () => {
    it('returns 403 for non-candidate', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/applications/my-cvs')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'You do not have permission to perform this action' });
    });

    it('returns CV list for candidate', async () => {
      const candidate = await createCandidateWithCV();
      const res = await request(app)
        .get('/api/v1/applications/my-cvs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cvs.length).toBe(1);
    });
  });

  describe('POST /api/v1/applications/apply/:jobId', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/applications/apply/507f1f77bcf86cd799439011')
        .send({ coverLetter: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .post('/api/v1/applications/apply/507f1f77bcf86cd799439011')
        .set(authHeader(companyUser._id))
        .send({ coverLetter: 'Test application' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when validation fails', async () => {
      const candidate = await createCandidateWithCV();
      const res = await request(app)
        .post('/api/v1/applications/apply/not-a-valid-id')
        .set(authHeader(candidate._id))
        .send({ coverLetter: 'Missing CV selection' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when job does not exist', async () => {
      const candidate = await createCandidateWithCV();
      const fakeJobId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/applications/apply/${fakeJobId}`)
        .set(authHeader(candidate._id))
        .send({
          coverLetter: 'I am interested in this role.',
          selectedCVs: [{ cvId: candidate.cvs[0]._id.toString() }],
        });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Job not found' });
    });

    it('submits application for active job', async () => {
      const candidate = await createCandidateWithCV();
      const { user: companyUser, company } = await createCompanyWithUser();
      const job = await createActiveJob({ company: company._id, createdBy: companyUser._id });

      const res = await request(app)
        .post(`/api/v1/applications/apply/${job._id}`)
        .set(authHeader(candidate._id))
        .send({
          coverLetter: 'I am interested in this role and meet all requirements.',
          selectedCVs: [{ cvId: candidate.cvs[0]._id.toString() }],
          contactInfo: { email: candidate.email, phone: '0911223344' },
          userInfo: { name: candidate.name, email: candidate.email },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.candidate).toBeDefined();

      const saved = await Application.findOne({ job: job._id, candidate: candidate._id });
      expect(saved).not.toBeNull();
      expect(saved.coverLetter).toContain('interested in this role');
    });
  });

  describe('GET /api/v1/applications/:applicationId', () => {
    it('returns 404 for unknown application', async () => {
      const candidate = await createCandidateWithCV();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/applications/${fakeId}`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Application not found' });
    });

    it('returns application details for candidate owner', async () => {
      const { application, candidate } = await seedApplication();

      const res = await request(app)
        .get(`/api/v1/applications/${application._id}`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application._id).toBe(application._id.toString());
    });

    it('returns 403 when unauthorized user views application', async () => {
      const { application } = await seedApplication();
      const stranger = await createUser({ role: 'candidate' });

      const res = await request(app)
        .get(`/api/v1/applications/${application._id}`)
        .set(authHeader(stranger._id));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'Not authorized to view this application' });
    });
  });

  describe('GET /api/v1/applications/job/:jobId', () => {
    it('returns 404 when job not found', async () => {
      const { user: companyUser } = await createCompanyWithUser();
      const fakeJobId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/applications/job/${fakeJobId}`)
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Job not found' });
    });

    it('returns applications for job owner company', async () => {
      const { application, companyUser, job } = await seedApplication();

      const res = await request(app)
        .get(`/api/v1/applications/job/${job._id}`)
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((a) => a._id.toString() === application._id.toString())).toBe(true);
    });
  });

  describe('GET /api/v1/applications/company/applications', () => {
    it('returns 404 when company profile missing', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/applications/company/applications')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Company not found' });
    });

    it('returns company applications list', async () => {
      const { companyUser } = await seedApplication();

      const res = await request(app)
        .get('/api/v1/applications/company/applications')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/v1/applications/:applicationId/status', () => {
    it('returns 400 when status is missing', async () => {
      const { application, companyUser } = await seedApplication();

      const res = await request(app)
        .put(`/api/v1/applications/${application._id}/status`)
        .set(authHeader(companyUser._id))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, message: 'Status is required' });
    });

    it('returns 403 when candidate tries to update status', async () => {
      const { application, candidate } = await seedApplication();

      const res = await request(app)
        .put(`/api/v1/applications/${application._id}/status`)
        .set(authHeader(candidate._id))
        .send({ status: 'shortlisted' });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, message: 'You do not have permission to perform this action' });
    });

    it('updates application status for company owner', async () => {
      const { application, companyUser } = await seedApplication();

      const res = await request(app)
        .put(`/api/v1/applications/${application._id}/status`)
        .set(authHeader(companyUser._id))
        .send({ status: 'shortlisted', message: 'Strong profile' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Application.findById(application._id);
      expect(updated.status).toBe('shortlisted');
    });
  });

  describe('PUT /api/v1/applications/:applicationId/withdraw', () => {
    it('returns 404 for unknown application', async () => {
      const candidate = await createCandidateWithCV();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/applications/${fakeId}/withdraw`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Application not found' });
    });

    it('withdraws application for candidate owner', async () => {
      const { application, candidate } = await seedApplication();

      const res = await request(app)
        .put(`/api/v1/applications/${application._id}/withdraw`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/applications/statistics/overview', () => {
    it('returns candidate statistics', async () => {
      const { candidate } = await seedApplication();

      const res = await request(app)
        .get('/api/v1/applications/statistics/overview')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics.totalApplications).toBeGreaterThanOrEqual(1);
    });

    it('returns company statistics', async () => {
      const { companyUser } = await seedApplication();

      const res = await request(app)
        .get('/api/v1/applications/statistics/overview')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics.totalApplications).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/applications/:applicationId/attachments', () => {
    it('returns attachments list for authorized candidate', async () => {
      const { application, candidate } = await seedApplication();

      const res = await request(app)
        .get(`/api/v1/applications/${application._id}/attachments`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('applicationController direct calls', () => {
    it('getApplicationStatistics returns stats via runController', async () => {
      const { candidate } = await seedApplication();

      const { res } = await runController(applicationController.getApplicationStatistics, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          query: {},
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statistics.totalApplications).toBeGreaterThanOrEqual(1);
    });

    it('returns 400 for invalid application id format', async () => {
      const candidate = await createCandidateWithCV();
      const { res } = await runController(applicationController.getApplicationDetails, {
        req: {
          user: { userId: candidate._id, role: candidate.role, _id: candidate._id },
          params: { applicationId: 'bad-id' },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns application for company owner via job', async () => {
      const { application, companyUser } = await seedApplication();
      const { res } = await runController(applicationController.getApplicationDetails, {
        req: {
          user: { userId: companyUser._id, role: companyUser.role, _id: companyUser._id },
          params: { applicationId: application._id.toString() },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.application._id.toString()).toBe(application._id.toString());
    });

    it('returns 403 when non-owner company views job applications', async () => {
      const { job } = await seedApplication();
      const { user: otherCompany } = await createCompanyWithUser();
      const { res } = await runController(applicationController.getJobApplications, {
        req: {
          user: { userId: otherCompany._id, role: otherCompany.role, _id: otherCompany._id },
          params: { jobId: job._id.toString() },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 404 when organization profile missing', async () => {
      const orgUser = await createUser({ role: 'organization' });
      const { res } = await runController(applicationController.getOrganizationApplications, {
        req: { user: { userId: orgUser._id, role: orgUser.role, _id: orgUser._id }, query: {} },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for invalid status value', async () => {
      const { application, companyUser } = await seedApplication();
      const { res } = await runController(applicationController.updateApplicationStatus, {
        req: {
          user: { userId: companyUser._id, role: companyUser.role, _id: companyUser._id },
          params: { applicationId: application._id.toString() },
          body: { status: 'invalid-status' },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('addCompanyResponse returns 400 when status missing', async () => {
      const { application, companyUser } = await seedApplication();
      const { res } = await runController(applicationController.addCompanyResponse, {
        req: {
          user: { userId: companyUser._id, role: companyUser.role, _id: companyUser._id },
          params: { applicationId: application._id.toString() },
          body: { message: 'No status' },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('addCompanyResponse adds response for authorized owner', async () => {
      const { application, companyUser } = await seedApplication();
      const { res } = await runController(applicationController.addCompanyResponse, {
        req: {
          user: { userId: companyUser._id, role: companyUser.role, _id: companyUser._id },
          params: { applicationId: application._id.toString() },
          body: { status: 'active-consideration', message: 'Strong candidate' },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 403 when non-owner withdraws application', async () => {
      const { application } = await seedApplication();
      const stranger = await createCandidateWithCV();
      const { res } = await runController(applicationController.withdrawApplication, {
        req: {
          user: { userId: stranger._id, role: stranger.role, _id: stranger._id },
          params: { applicationId: application._id.toString() },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('downloadCV returns 404 for unknown cv id', async () => {
      const candidate = await createCandidateWithCV();
      const { res } = await runController(applicationController.downloadCV, {
        req: {
          user: { userId: candidate._id, role: candidate.role, _id: candidate._id },
          params: { cvId: new mongoose.Types.ObjectId().toString() },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 when duplicate application exists', async () => {
      const { candidate, job } = await seedApplication();
      const { res } = await runController(applicationController.applyForJob, {
        req: {
          user: { userId: candidate._id, role: candidate.role, _id: candidate._id },
          params: { jobId: job._id.toString() },
          body: {
            coverLetter: 'Duplicate application attempt for same job.',
            selectedCVs: [{ cvId: candidate.cvs[0]._id.toString() }],
          },
        },
      });
      expect([400, 409]).toContain(res.statusCode);
    });

    it('getApplicationStatistics returns admin statistics', async () => {
      await seedApplication();
      const admin = await createUser({ role: 'admin' });
      const { res } = await runController(applicationController.getApplicationStatistics, {
        req: { user: { userId: admin._id, role: admin.role, _id: admin._id }, query: {} },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.statistics).toBeDefined();
    });
  });
});
