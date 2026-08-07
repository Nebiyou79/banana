jest.mock('../../../src/services/socketService', () => ({
  getIo: jest.fn(),
  setIo: jest.fn(),
}));

jest.mock('../../../src/services/pushService', () => ({
  sendToUser: jest.fn().mockResolvedValue({ sent: 1 }),
}));

jest.mock('../../../src/services/emailService', () => ({
  sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const socketService = require('../../../src/services/socketService');
const pushService = require('../../../src/services/pushService');
const emailService = require('../../../src/services/emailService');
const notificationService = require('../../../src/services/notificationService');
const Notification = require('../../../src/models/Notification');
const NotificationPreference = require('../../../src/models/NotificationPreference');
const User = require('../../../src/models/User');
const { createUser } = require('../../helpers/auth');

describe('notificationService', () => {
  let mockEmit;
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmit = jest.fn();
    mockIo = {
      to: jest.fn().mockReturnValue({ emit: mockEmit }),
    };
    socketService.getIo.mockReturnValue(mockIo);
  });

  it('create persists notification and emits in-app event', async () => {
    const recipient = await createUser();
    const actor = await createUser({ email: 'actor@test.com', name: 'Actor User' });

    const notification = await notificationService.create({
      recipient: recipient._id,
      actor: actor._id,
      type: 'new_follower',
      title: 'New follower',
      body: '{actorName} started following you',
      data: { screen: 'Profile', entityId: actor._id.toString() },
      channels: { inApp: true, push: false, email: false },
    });

    expect(notification).toBeTruthy();
    expect(notification.recipient.toString()).toBe(recipient._id.toString());
    expect(notification.body).toContain('Actor User');

    const stored = await Notification.findById(notification._id);
    expect(stored).toBeTruthy();
    expect(stored.type).toBe('new_follower');

    await new Promise((resolve) => setImmediate(resolve));
    expect(mockIo.to).toHaveBeenCalledWith(`user:${recipient._id}`);
    expect(mockEmit).toHaveBeenCalledWith('notification:new', expect.any(Object));

    const updatedRecipient = await User.findById(recipient._id);
    expect(updatedRecipient.unreadNotificationCount).toBe(1);
  });

  it('create returns null when user has notifications globally disabled', async () => {
    const recipient = await createUser();
    await NotificationPreference.create({
      user: recipient._id,
      globalEnabled: false,
    });

    const result = await notificationService.create({
      recipient: recipient._id,
      type: 'system_announcement',
      title: 'Maintenance',
      body: 'Scheduled downtime tonight',
    });

    expect(result).toBeNull();
    const count = await Notification.countDocuments({ recipient: recipient._id });
    expect(count).toBe(0);
  });

  it('dismissGrouped marks grouped notifications as deleted', async () => {
    const recipient = await createUser();
    const actor = await createUser({ email: 'liker@test.com' });
    const groupKey = `post_liked:${recipient._id}:post-1`;

    await Notification.create({
      recipient: recipient._id,
      actor: actor._id,
      type: 'post_liked',
      title: 'Post liked',
      body: 'Someone liked your post',
      groupKey,
      channels: { inApp: true, push: false, email: false },
    });

    await notificationService.dismissGrouped(groupKey, actor._id);

    const remaining = await Notification.findOne({ groupKey, deleted: false });
    expect(remaining).toBeNull();
  });

  it('broadcast inserts system announcements for active users', async () => {
    const userOne = await createUser({ email: 'u1@test.com' });
    const userTwo = await createUser({ email: 'u2@test.com' });

    await notificationService.broadcast({
      title: 'Platform update',
      body: 'New features are live',
      data: { screen: 'Home' },
    });

    const notifications = await Notification.find({
      type: 'system_announcement',
      title: 'Platform update',
    });

    expect(notifications.length).toBeGreaterThanOrEqual(2);
    const recipientIds = notifications.map((n) => n.recipient.toString());
    expect(recipientIds).toEqual(
      expect.arrayContaining([userOne._id.toString(), userTwo._id.toString()])
    );
    expect(pushService.sendToUser).not.toHaveBeenCalled();
    expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
  });
});
