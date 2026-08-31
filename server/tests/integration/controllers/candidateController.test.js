const request = require('supertest');
const mongoose = require('mongoose');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCandidate } = require('../../helpers/factories/userFactory');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const { runController } = require('../../helpers/runController');
const candidateController = require('../../../src/controllers/candidateController');
const User = require('../../../src/models/User');

const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

describe('candidateController integration', () => {
  const app = getApp();

  describe('GET /api/v1/candidate/profile', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/candidate/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('requires candidate role', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/candidate/profile')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns candidate profile for authenticated user', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .get('/api/v1/candidate/profile')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(candidate._id.toString());
      assertNoPassword(res.body);
    });
  });

  describe('PUT /api/v1/candidate/profile', () => {
    it('returns 400 for invalid gender value', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .put('/api/v1/candidate/profile')
        .set(authHeader(candidate._id))
        .send({ gender: 'invalid-gender' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });

    it('updates profile and persists to database', async () => {
      const candidate = await createCandidate({ bio: 'Original bio' });
      const res = await request(app)
        .put('/api/v1/candidate/profile')
        .set(authHeader(candidate._id))
        .send({ bio: 'Updated integration bio' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.bio).toBe('Updated integration bio');
      assertNoPassword(res.body);

      const updated = await User.findById(candidate._id);
      expect(updated.bio).toBe('Updated integration bio');
    });
  });

  describe('GET /api/v1/candidate/cvs', () => {
    it('returns CV list for candidate', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .get('/api/v1/candidate/cvs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.cvs)).toBe(true);
    });
  });

  describe('GET /api/v1/candidate/jobs', () => {
    it('returns active jobs for candidate', async () => {
      const candidate = await createCandidate();
      await createActiveJob({
        title: 'Candidate Visible Job',
        applicationDeadline: futureDeadline,
      });

      const res = await request(app)
        .get('/api/v1/candidate/jobs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/candidate/job/:jobId/save', () => {
    it('returns 404 for unknown job', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .post('/api/v1/candidate/job/507f1f77bcf86cd799439011/save')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('saves job and persists to user savedJobs', async () => {
      const candidate = await createCandidate();
      const job = await createActiveJob({
        title: 'Saveable Job',
        applicationDeadline: futureDeadline,
      });

      const res = await request(app)
        .post(`/api/v1/candidate/job/${job._id}/save`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await User.findById(candidate._id);
      expect(updated.savedJobs.map((id) => id.toString())).toContain(job._id.toString());
    });
  });

  describe('GET /api/v1/candidate/jobs/saved', () => {
    it('returns saved jobs list', async () => {
      const candidate = await createCandidate();
      const job = await createActiveJob({ applicationDeadline: futureDeadline });
      await User.findByIdAndUpdate(candidate._id, { $push: { savedJobs: job._id } });

      const res = await request(app)
        .get('/api/v1/candidate/jobs/saved')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/candidate/public/:userId', () => {
    it('returns 400 for invalid user id', async () => {
      const res = await request(app).get('/api/v1/candidate/public/not-valid-id');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for unknown user', async () => {
      const res = await request(app).get('/api/v1/candidate/public/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns public candidate profile', async () => {
      const candidate = await createCandidate({ name: 'Public Candidate' });
      const res = await request(app).get(`/api/v1/candidate/public/${candidate._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Public Candidate');
      assertNoPassword(res.body);
    });
  });

  describe('candidateController direct calls', () => {
    it('getAllCVs returns empty list for candidate without uploads', async () => {
      const candidate = await createCandidate();
      const { res } = await runController(candidateController.getAllCVs, {
        req: { user: { userId: candidate._id, role: 'candidate' } },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.cvs)).toBe(true);
    });

    it('getCV returns 404 for unknown cv id', async () => {
      const candidate = await createCandidate();
      const { res } = await runController(candidateController.getCV, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          params: { cvId: new mongoose.Types.ObjectId().toString() },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('deleteCV returns 404 for unknown cv id', async () => {
      const candidate = await createCandidate();
      const { res } = await runController(candidateController.deleteCV, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          params: { cvId: new mongoose.Types.ObjectId().toString() },
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('deleteCV returns 400 for invalid cv id format', async () => {
      const candidate = await createCandidate();
      const { res } = await runController(candidateController.deleteCV, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          params: { cvId: 'not-valid' },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('unsaveJob returns 400 when job is not saved', async () => {
      const candidate = await createCandidate();
      const job = await createActiveJob({ applicationDeadline: futureDeadline });
      const { res } = await runController(candidateController.unsaveJob, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          params: { jobId: job._id.toString() },
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('unsaveJob removes saved job', async () => {
      const candidate = await createCandidate();
      const job = await createActiveJob({ applicationDeadline: futureDeadline });
      await User.findByIdAndUpdate(candidate._id, { $push: { savedJobs: job._id } });
      const { res } = await runController(candidateController.unsaveJob, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          params: { jobId: job._id.toString() },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.saved).toBe(false);
    });

    it('uploadCV returns 400 when no file provided', async () => {
      const candidate = await createCandidate();
      const { res } = await runController(candidateController.uploadCV, {
        req: { user: { userId: candidate._id, role: 'candidate' }, file: null },
      });
      expect(res.statusCode).toBe(400);
    });

    it('viewCV returns 404 for unknown cv id', async () => {
      const candidate = await createCandidate();
      const { res } = await runController(candidateController.viewCV, {
        req: {
          user: { userId: candidate._id, role: 'candidate' },
          params: { cvId: new mongoose.Types.ObjectId().toString() },
        },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/candidate/job/:jobId/unsave', () => {
    it('returns 404 for unknown job', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .post(`/api/v1/candidate/job/${new mongoose.Types.ObjectId()}/unsave`)
        .set(authHeader(candidate._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
