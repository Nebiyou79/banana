const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Notification = require('../../../src/models/Notification');

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
});
