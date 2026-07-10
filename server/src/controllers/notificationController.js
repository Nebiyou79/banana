// server/src/controllers/notificationController.js
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushService');

// ── GET /api/v1/notifications ────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type, read } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { recipient: userId, deleted: false };
    if (type) filter.type = type;
    if (read !== undefined) filter.read = read === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'name avatar role headline verificationStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, read: false, deleted: false })
    ]);

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// ── GET /api/v1/notifications/count ──────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.userId,
      read: false,
      deleted: false
    });
    return res.json({ success: true, data: { count } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get count' });
  }
};

// ── PUT /api/v1/notifications/:id/read ───────────────────────────────
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { read: true, readAt: new Date() }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
};

// ── PUT /api/v1/notifications/read-all ───────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    await require('../models/User').findByIdAndUpdate(userId, { unreadNotificationCount: 0 });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to mark all read' });
  }
};

// ── DELETE /api/v1/notifications/:id ─────────────────────────────────
exports.deleteOne = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { deleted: true }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};

// ── DELETE /api/v1/notifications/clear ───────────────────────────────
exports.clearAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    await Notification.updateMany(
      { recipient: userId },
      { deleted: true }
    );
    await require('../models/User').findByIdAndUpdate(userId, { unreadNotificationCount: 0 });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to clear' });
  }
};

// ── POST /api/v1/notifications/push/subscribe ────────────────────────
exports.subscribePush = async (req, res) => {
  try {
    const { platform, subscription, fcmToken, deviceId, deviceName, appVersion } = req.body;
    const userId = req.user.userId;

    const update = {
      user: userId,
      platform: platform || 'web',
      active: true,
      lastUsedAt: new Date(),
      failureCount: 0,
      deviceId,
      deviceName,
      appVersion
    };

    if ((platform === 'web' || !platform) && subscription) {
      update.webPushSubscription = subscription;
    }
    if (fcmToken) {
      update.fcmToken = fcmToken;
    }

    await PushSubscription.findOneAndUpdate(
      { user: userId, deviceId: deviceId || 'unknown' },
      { $set: update },
      { upsert: true, new: true }
    );

    return res.json({ success: true, message: 'Push subscription saved' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
};

// ── DELETE /api/v1/notifications/push/unsubscribe ────────────────────
exports.unsubscribePush = async (req, res) => {
  try {
    const { deviceId } = req.body;
    await PushSubscription.findOneAndUpdate(
      { user: req.user.userId, deviceId: deviceId || 'unknown' },
      { active: false }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to unsubscribe' });
  }
};

// ── POST /api/v1/notifications/push/test ─────────────────────────────
exports.testPush = async (req, res) => {
  try {
    const result = await pushService.sendToUser(req.user.userId, {
      title: 'Test Notification 🍌',
      body: 'Your push notifications are working!',
      data: { screen: 'Home' }
    });
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Test push failed' });
  }
};

// ── GET /api/v1/notifications/preferences ────────────────────────────
exports.getPreferences = async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ user: req.user.userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: req.user.userId });
    }
    return res.json({ success: true, data: prefs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get preferences' });
  }
};

// ── PUT /api/v1/notifications/preferences ────────────────────────────
exports.updatePreferences = async (req, res) => {
  try {
    const allowedFields = ['globalEnabled', 'categories', 'quietHours', 'emailDigest'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const prefs = await NotificationPreference.findOneAndUpdate(
      { user: req.user.userId },
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json({ success: true, data: prefs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};