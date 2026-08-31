jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

jest.mock('../../../src/services/firebaseService', () => ({
  send: jest.fn(),
}));

const webpush = require('web-push');
const firebaseService = require('../../../src/services/firebaseService');
const PushSubscription = require('../../../src/models/PushSubscription');
const pushService = require('../../../src/services/pushService');
const { createUser } = require('../../helpers/auth');

describe('pushService', () => {
  const originalVapidPublic = process.env.VAPID_PUBLIC_KEY;
  const originalVapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const originalFirebaseJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    webpush.sendNotification.mockResolvedValue(undefined);
    firebaseService.send.mockResolvedValue({ success: true, messageId: 'fcm-1' });
  });

  afterEach(() => {
    process.env.VAPID_PUBLIC_KEY = originalVapidPublic;
    process.env.VAPID_PRIVATE_KEY = originalVapidPrivate;
    if (originalFirebaseJson) {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalFirebaseJson;
    } else {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    }
  });

  it('sendToUser returns not configured when push services are unavailable', async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const result = await pushService.sendToUser('user-id', {
      title: 'Test',
      body: 'Hello',
    });

    expect(result).toEqual({ sent: 0, message: 'Push services not configured' });
  });

  it('sendToUser returns zero sent when user has no active subscriptions', async () => {
    const user = await createUser();

    const result = await pushService.sendToUser(user._id, {
      title: 'Test',
      body: 'No devices',
    });

    expect(result).toEqual({ sent: 0 });
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('sendToUser delivers to web push subscriptions', async () => {
    const user = await createUser();
    await PushSubscription.create({
      user: user._id,
      platform: 'web',
      webPushSubscription: {
        endpoint: 'https://push.example.com/sub/1',
        keys: { p256dh: 'key', auth: 'auth' },
      },
      active: true,
      failureCount: 0,
    });

    const result = await pushService.sendToUser(user._id, {
      title: 'New message',
      body: 'You have mail',
      notificationId: 'notif-1',
    });

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(1);
    expect(result.total).toBe(1);
  });

  it('sendToUser delivers to FCM tokens for mobile subscriptions', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({ project_id: 'test' });
    const user = await createUser();
    await PushSubscription.create({
      user: user._id,
      platform: 'android',
      fcmToken: 'android-fcm-token',
      active: true,
      failureCount: 0,
    });

    const result = await pushService.sendToUser(user._id, {
      title: 'Bid update',
      body: 'Your bid status changed',
    });

    expect(firebaseService.send).toHaveBeenCalledWith(
      'android-fcm-token',
      expect.objectContaining({ title: 'Bid update', body: 'Your bid status changed' })
    );
    expect(result.sent).toBe(1);
  });
});
