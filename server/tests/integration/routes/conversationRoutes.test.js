const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('conversationRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/conversations', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/conversations');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns conversations list for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/conversations')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/conversations/requests', () => {
    it('returns message requests for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/conversations/requests')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
