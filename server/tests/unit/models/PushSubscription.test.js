const mongoose = require('mongoose');
const PushSubscription = require('../../../src/models/PushSubscription');
const { createUser } = require('../../helpers/auth');

describe('PushSubscription model', () => {
  it('rejects invalid platform values', async () => {
    const user = await createUser();

    await expect(
      PushSubscription.create({ user: user._id, platform: 'windows' })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const user = await createUser();

    const sub = await PushSubscription.create({
      user: user._id,
      platform: 'web',
    });

    expect(sub.active).toBe(true);
    expect(sub.lastUsedAt).toBeInstanceOf(Date);
  });

  it('stores web push endpoint and keys', async () => {
    const user = await createUser();

    const sub = await PushSubscription.create({
      user: user._id,
      platform: 'web',
      webPushSubscription: {
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'key1', auth: 'key2' },
      },
    });

    expect(sub.webPushSubscription.endpoint).toContain('push.example');
  });
});
