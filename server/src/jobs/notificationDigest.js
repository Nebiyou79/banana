// server/src/jobs/notificationDigest.js
/**
 * Sends daily email digest to users who opted in.
 * Run via cron: "0 8 * * *" (8 AM daily)
 */
const NotificationPreference = require('../models/NotificationPreference');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const User = require('../models/User');

exports.run = async () => {
  try {
    const digestUsers = await NotificationPreference.find({
      'emailDigest.enabled': true,
      'emailDigest.frequency': 'daily'
    }).lean();

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let sentCount = 0;

    for (const pref of digestUsers) {
      const notifications = await Notification.find({
        recipient: pref.user,
        createdAt: { $gte: yesterday },
        deleted: false
      })
        .populate('actor', 'name')
        .sort({ priority: 1, createdAt: -1 })
        .limit(20)
        .lean();

      if (notifications.length === 0) continue;

      const user = await User.findById(pref.user).select('email name').lean();
      if (!user?.email) continue;

      await emailService.sendDigestEmail({
        to: user.email,
        recipientName: user.name,
        notifications,
        period: 'yesterday'
      });

      sentCount++;
    }

    console.log(`✅ Digest emails sent: ${sentCount}`);
  } catch (err) {
    console.error('❌ Digest job failed:', err.message);
  }
};