jest.mock('../../../src/services/emailService', () => ({
  sendDigestEmail: jest.fn().mockResolvedValue(undefined),
}));

const emailService = require('../../../src/services/emailService');
const notificationDigest = require('../../../src/jobs/notificationDigest');
const NotificationPreference = require('../../../src/models/NotificationPreference');
const Notification = require('../../../src/models/Notification');
const User = require('../../../src/models/User');

describe('notificationDigest job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends digest email to users with daily digest enabled and recent notifications', async () => {
    const user = await User.create({
      name: 'Digest User',
      email: `digest-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    await NotificationPreference.create({
      user: user._id,
      emailDigest: { enabled: true, frequency: 'daily' },
    });

    const actor = await User.create({
      name: 'Actor User',
      email: `actor-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    await Notification.create({
      recipient: user._id,
      actor: actor._id,
      type: 'post_liked',
      title: 'Post liked',
      body: 'Someone liked your post',
      deleted: false,
      createdAt: new Date(),
    });

    await notificationDigest.run();

    expect(emailService.sendDigestEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        recipientName: user.name,
        period: 'yesterday',
        notifications: expect.arrayContaining([
          expect.objectContaining({ title: 'Post liked' }),
        ]),
      })
    );
  });

  it('skips users with no notifications in the last 24 hours', async () => {
    const user = await User.create({
      name: 'Quiet User',
      email: `quiet-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    await NotificationPreference.create({
      user: user._id,
      emailDigest: { enabled: true, frequency: 'daily' },
    });

    await notificationDigest.run();

    expect(emailService.sendDigestEmail).not.toHaveBeenCalled();
  });

  it('skips users without email addresses', async () => {
    const user = await User.create({
      name: 'No Email User',
      email: `temp-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    await User.collection.updateOne({ _id: user._id }, { $set: { email: '' } });

    await NotificationPreference.create({
      user: user._id,
      emailDigest: { enabled: true, frequency: 'daily' },
    });

    await Notification.create({
      recipient: user._id,
      type: 'system_announcement',
      title: 'Update',
      body: 'System update',
      deleted: false,
      createdAt: new Date(),
    });

    await notificationDigest.run();

    expect(emailService.sendDigestEmail).not.toHaveBeenCalled();
  });

  it('handles email service errors without throwing', async () => {
    emailService.sendDigestEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const user = await User.create({
      name: 'Error User',
      email: `error-${Date.now()}@test.com`,
      passwordHash: 'Password123!',
      role: 'candidate',
      isActive: true,
    });

    await NotificationPreference.create({
      user: user._id,
      emailDigest: { enabled: true, frequency: 'daily' },
    });

    await Notification.create({
      recipient: user._id,
      type: 'system_announcement',
      title: 'Alert',
      body: 'Something happened',
      deleted: false,
      createdAt: new Date(),
    });

    await expect(notificationDigest.run()).resolves.toBeUndefined();
  });
});
