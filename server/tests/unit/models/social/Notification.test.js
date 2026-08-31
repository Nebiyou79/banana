const mongoose = require('mongoose');
const { createUser } = require('../../../helpers/auth');

function loadSocialNotificationModel() {
  delete mongoose.models.Notification;
  delete require.cache[require.resolve('../../../../src/models/social/Notification')];
  delete require.cache[require.resolve('../../../../src/models/Notification')];
  return require('../../../../src/models/social/Notification');
}

describe('Notification model (social)', () => {
  let SocialNotification;

  beforeAll(() => {
    SocialNotification = loadSocialNotificationModel();
  });

  it('requires title because validation runs before pre-save hooks', async () => {
    const recipient = await createUser();

    await expect(
      SocialNotification.create({
        recipient: recipient._id,
        type: 'follow',
        message: 'Someone started following you',
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with explicit title and message', async () => {
    const recipient = await createUser();

    const notification = await SocialNotification.create({
      recipient: recipient._id,
      type: 'comment',
      title: 'Custom Title',
      message: 'You received a comment',
    });

    expect(notification.read).toBe(false);
    expect(notification.title).toBe('Custom Title');
  });

  it('markAllAsRead marks unread notifications for user', async () => {
    const recipient = await createUser();

    await SocialNotification.create({
      recipient: recipient._id,
      type: 'like',
      title: 'New Like',
      message: 'Like 1',
    });
    await SocialNotification.create({
      recipient: recipient._id,
      type: 'like',
      title: 'New Like',
      message: 'Like 2',
    });

    await SocialNotification.markAllAsRead(recipient._id);

    const unread = await SocialNotification.countDocuments({
      recipient: recipient._id,
      read: false,
    });

    expect(unread).toBe(0);
  });

  it('getUnreadCount returns number of unread notifications', async () => {
    const recipient = await createUser();

    await SocialNotification.create({
      recipient: recipient._id,
      type: 'mention',
      title: 'You were mentioned',
      message: 'Check your mention',
    });

    const count = await SocialNotification.getUnreadCount(recipient._id);

    expect(count).toBe(1);
  });
});
