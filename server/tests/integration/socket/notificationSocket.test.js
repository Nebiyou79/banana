const { createUser, signToken } = require('../../helpers/auth');
const Notification = require('../../../src/models/Notification');
const { startSocketServer, connectClient, stopSocketServer } = require('../../helpers/socket');

describe('notificationSocket integration', () => {
  beforeAll(async () => {
    await startSocketServer();
  });

  afterAll(async () => {
    await stopSocketServer();
  });

  async function connectUser(user) {
    const client = connectClient(signToken(user._id));
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('connect timeout')), 5000);
      client.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return client;
  }

  it('returns unread count on notification:get_count', async () => {
    const user = await createUser();
    await Notification.create({
      recipient: user._id,
      type: 'new_follower',
      title: 'Follower',
      body: 'New follower',
      read: false,
    });
    await Notification.create({
      recipient: user._id,
      type: 'system_announcement',
      title: 'Read',
      body: 'Already read',
      read: true,
    });

    const client = await connectUser(user);

    const countPayload = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('notification:count timeout')), 5000);
      client.emit('notification:get_count');
      client.on('notification:count', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    expect(countPayload.count).toBe(1);
    client.close();
  });

  it('marks notification read and updates count in DB', async () => {
    const user = await createUser();
    const notification = await Notification.create({
      recipient: user._id,
      type: 'post_liked',
      title: 'Like',
      body: 'Someone liked your post',
      read: false,
    });

    const client = await connectUser(user);

    const updatedCount = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('mark_read timeout')), 5000);
      client.on('notification:count', (payload) => {
        if (payload.count === 0) {
          clearTimeout(timeout);
          resolve(payload);
        }
      });
      client.emit('notification:mark_read', { notificationId: notification._id.toString() });
    });

    expect(updatedCount.count).toBe(0);

    const dbNotification = await Notification.findById(notification._id);
    expect(dbNotification.read).toBe(true);

    client.close();
  });

  it('marks all notifications read on notification:mark_all_read', async () => {
    const user = await createUser();
    await Notification.create({
      recipient: user._id,
      type: 'new_message',
      title: 'Message',
      body: 'You have a message',
      read: false,
    });

    const client = await connectUser(user);

    const cleared = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('mark_all_read timeout')), 5000);
      client.on('notification:count', (payload) => {
        if (payload.count === 0) {
          clearTimeout(timeout);
          resolve(payload);
        }
      });
      client.emit('notification:mark_all_read');
    });

    expect(cleared.count).toBe(0);

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      read: false,
      deleted: false,
    });
    expect(unreadCount).toBe(0);

    client.close();
  });
});
