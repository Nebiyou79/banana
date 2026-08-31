const request = require('supertest');
const messageController = require('../../../src/controllers/messageController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Conversation = require('../../../src/models/Conversation');
const Message = require('../../../src/models/Message');

describe('messageController integration', () => {
  const app = getApp();

  async function createConversationBetween(userA, userB) {
    return Conversation.create({
      participants: [userA._id, userB._id],
      type: 'direct',
      status: 'active',
    });
  }

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

    it('returns 400 when content is empty', async () => {
      const user = await createUser();
      const other = await createUser();
      const conversation = await createConversationBetween(user, other);

      const res = await request(app)
        .post('/api/v1/messages')
        .set(authHeader(user._id))
        .send({ conversationId: conversation._id.toString(), content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/content is required/i);
    });

    it('sends message in active conversation', async () => {
      const sender = await createUser();
      const recipient = await createUser();
      const conversation = await createConversationBetween(sender, recipient);

      const res = await request(app)
        .post('/api/v1/messages')
        .set(authHeader(sender._id))
        .send({ conversationId: conversation._id.toString(), content: 'Hello there!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello there!');
      assertNoPassword(res.body);
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

    it('returns messages for conversation', async () => {
      const user = await createUser();
      const other = await createUser();
      const conversation = await createConversationBetween(user, other);
      await Message.create({
        conversationId: conversation._id,
        sender: user._id,
        content: 'Existing message',
        type: 'text',
      });

      const res = await request(app)
        .get(`/api/v1/messages/${conversation._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/v1/messages/:messageId', () => {
    it('returns 400 for invalid message id', async () => {
      const user = await createUser();
      const res = await request(app)
        .delete('/api/v1/messages/not-valid')
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deletes own message', async () => {
      const user = await createUser();
      const other = await createUser();
      const conversation = await createConversationBetween(user, other);
      const message = await Message.create({
        conversationId: conversation._id,
        sender: user._id,
        content: 'Message to delete',
        type: 'text',
      });

      const res = await request(app)
        .delete(`/api/v1/messages/${message._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('sendMessage (direct)', () => {
    it('returns 404 when conversation not found', async () => {
      const user = await createUser();
      const req = {
        user: { userId: user._id },
        body: {
          conversationId: '507f1f77bcf86cd799439011',
          content: 'Hello',
        },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
      };

      await messageController.sendMessage(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
