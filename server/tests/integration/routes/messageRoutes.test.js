const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Conversation = require('../../../src/models/Conversation');

describe('messageRoutes integration', () => {
  const app = getApp();

  describe('POST /api/v1/messages', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/messages')
        .send({ conversationId: '507f1f77bcf86cd799439011', content: 'Hello' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/messages/:conversationId', () => {
    it('returns messages for conversation participant', async () => {
      const userA = await createUser();
      const userB = await createUser();
      const conversation = await Conversation.create({
        participants: [userA._id, userB._id],
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/messages/${conversation._id}`)
        .set(authHeader(userA._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
