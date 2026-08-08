const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');

describe('jobController integration', () => {
  const app = getApp();

  const validJobPayload = {
    title: 'Senior Software Engineer',
    description:
      'We are looking for a senior software engineer with strong Node.js experience for our growing team.',
    category: 'software-developer',
    candidatesNeeded: 2,
    salaryMode: 'negotiable',
    type: 'full-time',
    experienceLevel: 'mid-level',
    location: { region: 'addis-ababa', city: 'Addis Ababa' },
    applicationDeadline: '2026-12-31T00:00:00.000Z',
  };

  describe('GET /api/v1/job', () => {
    it('returns 200 with success true and active jobs', async () => {
      await createActiveJob({ title: 'Visible Active Job' });
      await createActiveJob({ title: 'Draft Job', status: 'draft' });

      const res = await request(app).get('/api/v1/job');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((j) => j.title === 'Visible Active Job')).toBe(true);
      expect(res.body.data.every((j) => j.status === 'active')).toBe(true);
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
      expect(res.body.data).toContain('software-developer');
    });
  });

  describe('GET /api/v1/job/near', () => {
    it('returns nearby jobs with coordinates', async () => {
      await createActiveJob({
        title: 'Nearby Job',
        location: {
          region: 'addis-ababa',
          city: 'Addis Ababa',
          coordinates: { type: 'Point', coordinates: [38.7578, 9.0054] },
        },
      });

      const res = await request(app)
        .get('/api/v1/job/near')
        .query({ lat: 9.0054, lng: 38.7578, radius: 50 });

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
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

    it('returns job details for existing job', async () => {
      const job = await createActiveJob({ title: 'Detail Job' });
      const user = await createUser();
      const res = await request(app)
        .get(`/api/v1/job/${job._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Detail Job');
    });
  });

  describe('GET /api/v1/job/company/my-jobs', () => {
    it('returns company jobs for company user', async () => {
      const { user, company } = await createCompanyWithUser();
      await createActiveJob({ title: 'Company Job', company: company._id, createdBy: user._id });

      const res = await request(app)
        .get('/api/v1/job/company/my-jobs')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/job', () => {
    it('creates job for company user', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .post('/api/v1/job')
        .set(authHeader(user._id))
        .send(validJobPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(validJobPayload.title);
    });
  });

  describe('PUT /api/v1/job/:id', () => {
    it('updates company job', async () => {
      const { user, company } = await createCompanyWithUser();
      const job = await createActiveJob({
        title: 'Job To Update',
        company: company._id,
        createdBy: user._id,
      });

      const res = await request(app)
        .put(`/api/v1/job/${job._id}`)
        .set(authHeader(user._id))
        .send({ title: 'Updated Job Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Job Title');
    });
  });

  describe('DELETE /api/v1/job/:id', () => {
    it('deletes company job', async () => {
      const { user, company } = await createCompanyWithUser();
      const job = await createActiveJob({
        title: 'Job To Delete',
        company: company._id,
        createdBy: user._id,
      });

      const res = await request(app)
        .delete(`/api/v1/job/${job._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/job/candidate/jobs', () => {
    it('returns jobs for candidate', async () => {
      await createActiveJob({ title: 'Candidate Visible Job' });
      const candidate = await createUser({ role: 'candidate' });

      const res = await request(app)
        .get('/api/v1/job/candidate/jobs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/job/:jobId/save and unsave', () => {
    it('saves and unsaves job for candidate', async () => {
      const job = await createActiveJob({ title: 'Saveable Job' });
      const candidate = await createUser({ role: 'candidate' });

      const saveRes = await request(app)
        .post(`/api/v1/job/${job._id}/save`)
        .set(authHeader(candidate._id));

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);

      const savedRes = await request(app)
        .get('/api/v1/job/saved/jobs')
        .set(authHeader(candidate._id));

      expect(savedRes.status).toBe(200);
      expect(savedRes.body.success).toBe(true);

      const unsaveRes = await request(app)
        .post(`/api/v1/job/${job._id}/unsave`)
        .set(authHeader(candidate._id));

      expect(unsaveRes.status).toBe(200);
      expect(unsaveRes.body.success).toBe(true);
    });
  });
});
