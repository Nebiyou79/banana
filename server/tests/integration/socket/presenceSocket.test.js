const { createUser, signToken } = require('../../helpers/auth');
const User = require('../../../src/models/User');
const { startSocketServer, connectClient, stopSocketServer } = require('../../helpers/socket');

describe('presenceSocket integration', () => {
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

  it('returns presence batch for queried user ids', async () => {
    const viewer = await createUser({ isOnline: true });
    const target = await createUser({ isOnline: false });
    const client = await connectUser(viewer);

    const batch = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('presence:batch timeout')), 5000);
      client.on('presence:batch', (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
      client.emit('presence:query', { userIds: [target._id.toString()] });
    });

    expect(batch[target._id.toString()]).toBeDefined();
    expect(batch[target._id.toString()].isOnline).toBe(false);
    client.close();
  });

  it('updates lastSeen on presence:heartbeat', async () => {
    const user = await createUser({ isOnline: false });
    const before = user.lastSeen;
    const client = await connectUser(user);

    await new Promise((resolve) => {
      client.emit('presence:heartbeat');
      setTimeout(resolve, 300);
    });

    const dbUser = await User.findById(user._id);
    expect(dbUser.isOnline).toBe(true);
    expect(new Date(dbUser.lastSeen).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());

    client.close();
  });

  it('broadcasts manual presence:update', async () => {
    const user = await createUser();
    const client = await connectUser(user);

    const update = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('presence:update timeout')), 5000);
      client.on('presence:update', (payload) => {
        if (payload.userId === user._id.toString() && payload.isOnline === false) {
          clearTimeout(timeout);
          resolve(payload);
        }
      });
      client.emit('presence:update', { isOnline: false });
    });

    expect(update.isOnline).toBe(false);

    const dbUser = await User.findById(user._id);
    expect(dbUser.isOnline).toBe(false);

    client.close();
  });
});
