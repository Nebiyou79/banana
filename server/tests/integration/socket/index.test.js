const { createUser, signToken } = require('../../helpers/auth');
const Notification = require('../../../src/models/Notification');
const User = require('../../../src/models/User');
const { startSocketServer, connectClient, stopSocketServer } = require('../../helpers/socket');

describe('socket index integration', () => {
  beforeAll(async () => {
    await startSocketServer();
  });

  afterAll(async () => {
    await stopSocketServer();
  });

  it('rejects connection without token', (done) => {
    const client = connectClient('', { reconnection: false });

    client.on('connect_error', (err) => {
      expect(err.message).toMatch(/authentication error/i);
      client.close();
      done();
    });
  });

  it('connects with valid token and emits initial notification count', async () => {
    const user = await createUser();
    await Notification.create({
      recipient: user._id,
      type: 'system_announcement',
      title: 'Socket test',
      body: 'Unread notification',
      read: false,
    });

    const token = signToken(user._id);
    const client = connectClient(token);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connect timeout')), 5000);

      client.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const countPayload = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('notification:count timeout')), 5000);
      client.on('notification:count', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    expect(countPayload.count).toBe(1);

    const dbUser = await User.findById(user._id);
    expect(dbUser.isOnline).toBe(true);

    client.close();
  });

  it('marks user online in DB on connect', async () => {
    const user = await createUser({ isOnline: false });
    const client = connectClient(signToken(user._id));

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('connect timeout')), 5000);
      client.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client.on('connect_error', reject);
    });

    const dbUser = await User.findById(user._id);
    expect(dbUser.isOnline).toBe(true);

    client.close();
  });
});
