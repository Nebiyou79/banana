const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('proposalRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/proposals/my-proposals', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/proposals/my-proposals');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns proposals for authenticated freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/proposals/my-proposals')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/proposals/:proposalId', () => {
    it('returns 404 for unknown proposal', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/proposals/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
