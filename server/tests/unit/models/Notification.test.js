const mongoose = require('mongoose');
const Notification = require('../../../src/models/Notification');
const { createUser } = require('../../helpers/auth');

describe('Notification model (platform)', () => {
  it('rejects invalid notification type', async () => {
    const recipient = await createUser();

    await expect(
      Notification.create({
        recipient: recipient._id,
        type: 'invalid_type',
        title: 'Bad Type',
        body: 'Should fail validation',
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const recipient = await createUser();

    const notification = await Notification.create({
      recipient: recipient._id,
      type: 'new_follower',
      title: 'New follower',
      body: 'Someone followed you',
    });

    expect(notification.read).toBe(false);
    expect(notification.priority).toBe('normal');
  });

  it('isExpired virtual is true when expiresAt is in the past', () => {
    const notification = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      type: 'system_announcement',
      title: 'Expired',
      body: 'Old notice',
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(notification.isExpired).toBe(true);
  });

  it('isExpired virtual is false when expiresAt is unset or future', () => {
    const active = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      type: 'new_message',
      title: 'Active',
      body: 'Still valid',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    expect(active.isExpired).toBe(false);
  });
});
