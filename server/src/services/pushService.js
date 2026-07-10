// server/src/services/pushService.js
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT || 'admin@getbananalink.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push (VAPID) configured');
} else {
  console.warn('⚠️ VAPID keys not set — push notifications disabled');
}

exports.sendToUser = async (userId, payload) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return { sent: 0, message: 'Push services not configured' };
    }

    const subscriptions = await PushSubscription.find({
      user: userId,
      active: true,
      failureCount: { $lt: 5 }
    }).lean();

    if (subscriptions.length === 0) return { sent: 0 };

    const results = await Promise.allSettled(
      subscriptions.map(sub => sendToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = subscriptions.length - sent;
    
    return { sent, total: subscriptions.length, failed };
  } catch (err) {
    console.error('pushService.sendToUser error:', err.message);
    return { sent: 0, error: err.message };
  }
};

async function sendToSubscription(sub, payload) {
  try {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: payload.data || {},
      notificationId: payload.notificationId
    });

    if (sub.platform === 'web' && sub.webPushSubscription?.endpoint) {
      await webpush.sendNotification(sub.webPushSubscription, notificationPayload);
    } else if (['ios', 'android'].includes(sub.platform) && sub.fcmToken) {
      try {
        const firebaseService = require('./firebaseService');
        await firebaseService.send(sub.fcmToken, payload);
      } catch (fcmErr) {
        console.warn('FCM send failed:', fcmErr.message);
        throw fcmErr;
      }
    }

    await PushSubscription.findByIdAndUpdate(sub._id, {
      lastUsedAt: new Date(),
      $set: { failureCount: 0 }
    });
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.findByIdAndUpdate(sub._id, { active: false });
    } else {
      await PushSubscription.findByIdAndUpdate(sub._id, {
        $inc: { failureCount: 1 }
      });
      const updated = await PushSubscription.findById(sub._id);
      if (updated?.failureCount >= 5) {
        await PushSubscription.findByIdAndUpdate(sub._id, { active: false });
        console.log(`Deactivated push subscription ${sub._id} after 5 failures`);
      }
    }
    return false;
  }
}