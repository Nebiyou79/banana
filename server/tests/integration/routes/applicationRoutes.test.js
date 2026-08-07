const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

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
});
