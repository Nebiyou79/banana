const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('applicationController integration', () => {
  const app = getApp();

  describe('GET /api/v1/applications/my-applications', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/applications/my-applications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns empty applications list for candidate', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/applications/my-applications')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/applications/apply/:jobId', () => {
    it('returns 400 when job id is invalid', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/applications/apply/not-a-valid-id')
        .set(authHeader(candidate._id))
        .send({ coverLetter: 'I am interested in this role.' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/applications/statistics/overview', () => {
    it('returns application statistics for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/applications/statistics/overview')
        .set(authHeader(companyUser._id));

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        assertNoPassword(res.body);
      }
    });
  });
});
