// server/src/services/notificationService.js
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');

const TYPE_CATEGORY_MAP = {
  new_follower: 'social', new_connection: 'social',
  post_liked: 'social', post_reacted: 'social', post_comment: 'social',
  comment_reply: 'social', post_mentioned: 'social', comment_mentioned: 'social', post_shared: 'social',

  new_message: 'messaging', message_request: 'messaging', message_request_accepted: 'messaging',

  new_job_match: 'jobs', application_received: 'jobs', application_status: 'jobs',
  application_shortlisted: 'jobs', application_rejected: 'jobs', offer_made: 'jobs',

  bid_received: 'tenders', bid_status_changed: 'tenders', bid_shortlisted: 'tenders',
  bid_awarded: 'tenders', bid_rejected: 'tenders', bid_revealed: 'tenders',
  tender_addendum: 'tenders', tender_invited: 'tenders',

  proposal_received: 'proposals', proposal_status: 'proposals', proposal_shortlisted: 'proposals',
  proposal_awarded: 'proposals', proposal_rejected: 'proposals',

  verification_submitted: 'verification', verification_status: 'verification',
  verification_approved: 'verification', verification_rejected: 'verification',

  appointment_confirmed: 'appointments', appointment_reminder: 'appointments',
  appointment_cancelled: 'appointments', new_appointment_admin: 'appointments',

  referral_signup: 'referrals', referral_completed: 'referrals', reward_earned: 'referrals',

  system_announcement: 'system', profile_view: 'system'
};

/**
 * Main function to create and deliver a notification.
 */
exports.create = async (params) => {
  try {
    const {
      recipient,
      actor = null,
      type,
      title,
      body,
      data = {},
      channels = { inApp: true, push: false, email: false },
      priority = 'normal',
      groupKey = null,
      expiresAt = null
    } = params;

    const category = TYPE_CATEGORY_MAP[type] || 'system';
    const prefs = await NotificationPreference.findOne({ user: recipient }).lean();

    // 1. Global disable check
    if (prefs && !prefs.globalEnabled) return null;

    // 2. Resolve channel permissions
    const categoryPrefs = prefs?.categories?.[category] || { inApp: true, push: true, email: false };
    const resolvedChannels = {
      inApp: channels.inApp && (categoryPrefs.inApp !== false),
      push: channels.push && (categoryPrefs.push !== false),
      email: channels.email && (categoryPrefs.email !== false)
    };

    // 3. Dedup grouped notifications within 1 minute
    if (groupKey) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const existing = await Notification.findOne({
        recipient,
        groupKey,
        createdAt: { $gte: oneMinuteAgo },
        deleted: false
      });
      if (existing) {
        await Notification.findByIdAndUpdate(existing._id, {
          $set: { body: updateGroupBody(existing.body) }
        });
        return existing;
      }
    }

    // 4. Resolve actor name for body
    let resolvedBody = body;
    if (actor && body.includes('{actorName}')) {
      const actorUser = await User.findById(actor).select('name').lean();
      resolvedBody = body.replace('{actorName}', actorUser?.name || 'Someone');
    }

    // 5. Create notification record
    const notification = await Notification.create({
      recipient,
      actor,
      type,
      title,
      body: resolvedBody,
      data,
      channels: resolvedChannels,
      priority,
      groupKey,
      expiresAt
    });

    // 6. Deliver in-app via Socket.IO
    if (resolvedChannels.inApp) {
      deliverInApp(notification).catch(err => console.warn('In-app notification delivery failed:', err.message));
    }

    // 7. Deliver push (fire-and-forget)
    if (resolvedChannels.push) {
      deliverPush(notification, resolvedBody).catch(err => console.warn('Push delivery failed:', err.message));
    }

    // 8. Deliver email (non-critical, fire-and-forget)
    if (resolvedChannels.email) {
      deliverEmail(notification, recipient).catch(err => console.warn('Email delivery failed:', err.message));
    }

    // 9. Increment unread count
    await User.findByIdAndUpdate(recipient, { $inc: { unreadNotificationCount: 1 } });

    return notification;
  } catch (err) {
    console.error('notificationService.create error:', err.message);
    return null;
  }
};

// ── Socket.IO Delivery ────────────────────────────────────────────────
async function deliverInApp(notification) {
  try {
    const { getIo } = require('./socketService');
    const io = getIo();
    if (!io) return;

    const populated = await Notification.findById(notification._id)
      .populate('actor', 'name avatar role')
      .lean();

    io.to(`user:${notification.recipient}`).emit('notification:new', populated);
  } catch (err) {
    console.warn('deliverInApp failed:', err.message);
  }
}

// ── Push Notification Delivery ────────────────────────────────────────
async function deliverPush(notification, body) {
  const pushService = require('./pushService');
  await pushService.sendToUser(notification.recipient, {
    title: notification.title,
    body,
    data: notification.data,
    notificationId: notification._id.toString()
  });
  await Notification.findByIdAndUpdate(notification._id, {
    'delivered.push': true,
    'deliveredAt.push': new Date()
  });
}

// ── Email Delivery ────────────────────────────────────────────────────
async function deliverEmail(notification, recipientId) {
  const emailService = require('./emailService');
  const user = await User.findById(recipientId).select('email name').lean();
  if (!user?.email) return;

  await emailService.sendNotificationEmail({
    to: user.email,
    recipientName: user.name,
    notification
  });

  await Notification.findByIdAndUpdate(notification._id, {
    'delivered.email': true,
    'deliveredAt.email': new Date()
  });
}

// ── Helpers ───────────────────────────────────────────────────────────
function updateGroupBody(currentBody) {
  const match = currentBody.match(/and (\d+) others/);
  if (match) {
    const count = parseInt(match[1]) + 1;
    return currentBody.replace(/and \d+ others/, `and ${count} others`);
  }
  return currentBody + ' and others';
}

exports.dismissGrouped = async (groupKey, actorId) => {
  try {
    await Notification.updateMany(
      { groupKey, 'actor': actorId },
      { deleted: true }
    );
  } catch (err) {
    console.warn('dismissGrouped error:', err.message);
  }
};

exports.notifyMatchingCandidates = async (job) => {
  try {
    const candidates = await User.find({
      role: 'candidate',
      isActive: true,
      'location.region': job.location?.region,
      skills: { $in: job.skills || [] }
    }).select('_id').limit(500).lean();

    for (const candidate of candidates) {
      await exports.create({
        recipient: candidate._id,
        actor: null,
        type: 'new_job_match',
        title: 'New job match',
        body: `New job: "${job.title}" matches your profile`,
        data: {
          entityType: 'Job',
          entityId: job._id.toString(),
          screen: 'JobDetail',
          params: { jobId: job._id }
        },
        priority: 'normal',
        groupKey: `new_job_match:${candidate._id}`,
        channels: { inApp: true, push: false, email: false }
      });
    }
  } catch (err) {
    console.error('notifyMatchingCandidates error:', err.message);
  }
};

exports.broadcast = async ({ title, body, data = {}, roles = [] }) => {
  try {
    const filter = { isActive: true };
    if (roles.length > 0) filter.role = { $in: roles };

    const users = await User.find(filter).select('_id').lean();
    const chunkSize = 100;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      const docs = chunk.map(user => ({
        recipient: user._id,
        type: 'system_announcement',
        title,
        body,
        data,
        priority: 'high',
        channels: { inApp: true, push: false, email: false }
      }));
      await Notification.insertMany(docs, { ordered: false });
    }
  } catch (err) {
    console.error('broadcast error:', err.message);
  }
};