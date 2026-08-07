const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('messageController integration', () => {
  const app = getApp();

  describe('POST /api/v1/messages', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .send({ conversationId: '507f1f77bcf86cd799439011', content: 'Hello' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid conversation id', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/messages')
        .set(authHeader(user._id))
        .send({ conversationId: 'invalid-id', content: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/messages/:conversationId', () => {
    it('returns 400 for invalid conversation id', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/messages/not-a-valid-id')
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
