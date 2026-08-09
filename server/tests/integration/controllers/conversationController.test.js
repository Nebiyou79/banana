const request = require('supertest');
const conversationController = require('../../../src/controllers/conversationController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Conversation = require('../../../src/models/Conversation');

describe('conversationController integration', () => {
  const app = getApp();

  describe('getOrCreateConversation (direct)', () => {
    it('returns 400 when messaging yourself', async () => {
      const user = await createUser();
      const req = {
        user: { userId: user._id.toString() },
        params: { userId: user._id.toString() },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
      };

      await conversationController.getOrCreateConversation(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot start a conversation with yourself/i);
    });
  });

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
    });
  });

  describe('GET /api/v1/conversations/contacts/online', () => {
    it('returns online contacts', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/conversations/contacts/online')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/conversations/with/:userId', () => {
    it('creates conversation with another user', async () => {
      const user = await createUser();
      const other = await createUser();

      const res = await request(app)
        .post(`/api/v1/conversations/with/${other._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.created).toBe(true);
      expect(res.body.data.participants.length).toBe(2);
    });

    it('returns existing conversation without creating a duplicate', async () => {
      const user = await createUser();
      const other = await createUser();

      const createRes = await request(app)
        .post(`/api/v1/conversations/with/${other._id}`)
        .set(authHeader(user._id));
      expect(createRes.status).toBe(201);

      const res = await request(app)
        .post(`/api/v1/conversations/with/${other._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.created).toBe(false);
      expect(res.body.data._id).toBe(createRes.body.data._id);
    });
  });

  describe('GET /api/v1/conversations/:id', () => {
    it('returns conversation by id', async () => {
      const user = await createUser();
      const other = await createUser();
      const conversation = await Conversation.create({
        participants: [user._id, other._id],
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/conversations/${conversation._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/conversations/:id/read', () => {
    it('marks conversation as read', async () => {
      const user = await createUser();
      const other = await createUser();
      const conversation = await Conversation.create({
        participants: [user._id, other._id],
        status: 'active',
        unreadCounts: new Map([[user._id.toString(), 2]]),
      });

      const res = await request(app)
        .put(`/api/v1/conversations/${conversation._id}/read`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('message request lifecycle', () => {
    it('accepts and declines message requests', async () => {
      const requester = await createUser();
      const target = await createUser();
      const conversation = await Conversation.create({
        participants: [requester._id, target._id],
        status: 'request',
        requestedBy: requester._id,
      });

      const acceptRes = await request(app)
        .put(`/api/v1/conversations/${conversation._id}/accept`)
        .set(authHeader(target._id));

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);

      const declineConversation = await Conversation.create({
        participants: [requester._id, target._id],
        status: 'request',
        requestedBy: requester._id,
      });

      const declineRes = await request(app)
        .put(`/api/v1/conversations/${declineConversation._id}/decline`)
        .set(authHeader(target._id));

      expect(declineRes.status).toBe(200);
      expect(declineRes.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/conversations/:id', () => {
    it('deletes conversation for user', async () => {
      const user = await createUser();
      const other = await createUser();
      const conversation = await Conversation.create({
        participants: [user._id, other._id],
        status: 'active',
      });

      const res = await request(app)
        .delete(`/api/v1/conversations/${conversation._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
