const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('candidateController integration', () => {
  const app = getApp();

  describe('GET /api/v1/candidate/profile', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/candidate/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns candidate profile for authenticated user', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/candidate/profile')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/candidate/cvs', () => {
    it('returns CV list for candidate', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/candidate/cvs')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.cvs)).toBe(true);
    });
  });

  describe('GET /api/v1/candidate/public/:userId', () => {
    it('returns public candidate profile', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app).get(`/api/v1/candidate/public/${candidate._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
