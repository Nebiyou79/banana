const request = require('supertest');
const notificationController = require('../../../src/controllers/notificationController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const Notification = require('../../../src/models/Notification');
const NotificationPreference = require('../../../src/models/NotificationPreference');

describe('notificationController integration', () => {
  const app = getApp();

  describe('GET /api/v1/notifications', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Access denied. No token provided.',
      });
    });

    it('returns notifications for authenticated user', async () => {
      const user = await createUser();
      const actor = await createUser({ name: 'Actor User' });

      await Notification.create({
        recipient: user._id,
        actor: actor._id,
        type: 'new_follower',
        title: 'New follower',
        body: 'Someone followed you',
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.unreadCount).toBe(1);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/notifications/count', () => {
    it('returns unread count for authenticated user', async () => {
      const user = await createUser();
      await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Welcome',
        body: 'Welcome to the platform',
        read: false,
      });

      const res = await request(app)
        .get('/api/v1/notifications/count')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: { count: 1 },
      });
    });
  });

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('marks notification as read', async () => {
      const user = await createUser();
      const notification = await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Read me',
        body: 'Notification body',
        read: false,
      });

      const res = await request(app)
        .put(`/api/v1/notifications/${notification._id}/read`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Notification.findById(notification._id);
      expect(updated.read).toBe(true);
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      const user = await createUser();
      await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'One',
        body: 'First',
        read: false,
      });
      await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Two',
        body: 'Second',
        read: false,
      });

      const res = await request(app)
        .put('/api/v1/notifications/read-all')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const unread = await Notification.countDocuments({ recipient: user._id, read: false });
      expect(unread).toBe(0);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('deletes a notification', async () => {
      const user = await createUser();
      const notification = await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Delete me',
        body: 'To be deleted',
      });

      const res = await request(app)
        .delete(`/api/v1/notifications/${notification._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/notifications/clear', () => {
    it('clears all notifications', async () => {
      const user = await createUser();
      await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Clear me',
        body: 'Clear test',
      });

      const res = await request(app)
        .delete('/api/v1/notifications/clear')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const remaining = await Notification.countDocuments({ recipient: user._id, deleted: { $ne: true } });
      expect(remaining).toBe(0);
    });
  });

  describe('POST /api/v1/notifications/push/subscribe', () => {
    it('subscribes to push notifications', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/notifications/push/subscribe')
        .set(authHeader(user._id))
        .send({
          subscription: {
            endpoint: 'https://push.example.com/subscription',
            keys: { p256dh: 'key', auth: 'auth' },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/notifications/push/unsubscribe', () => {
    it('unsubscribes from push notifications', async () => {
      const user = await createUser();
      const res = await request(app)
        .delete('/api/v1/notifications/push/unsubscribe')
        .set(authHeader(user._id))
        .send({ endpoint: 'https://push.example.com/subscription' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/notifications/push/test', () => {
    it('sends test push notification', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/notifications/push/test')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/preferences', () => {
    it('returns notification preferences', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/notifications/preferences', () => {
    it('updates notification preferences', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/notifications/preferences')
        .set(authHeader(user._id))
        .send({ email: { newFollower: false }, push: { newMessage: true } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const prefs = await NotificationPreference.findOne({ user: user._id });
      expect(prefs).toBeTruthy();
    });
  });

  describe('getUnreadCount (direct)', () => {
    it('returns count via controller', async () => {
      const user = await createUser();
      await Notification.create({
        recipient: user._id,
        type: 'system_announcement',
        title: 'Direct count',
        body: 'Body',
        read: false,
      });

      const req = mockReq({ user: { userId: user._id } });
      const res = mockRes();

      await notificationController.getUnreadCount(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.count).toBe(1);
    });
  });
});
