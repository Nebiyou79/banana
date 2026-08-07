const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('verificationRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/verification/status/:userId', () => {
    it('returns verification status publicly', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/v1/verification/status/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/verification/my-status', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/verification/my-status');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns own verification status when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/verification/my-status')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
