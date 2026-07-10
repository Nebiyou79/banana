// server/src/models/PushSubscription.js
const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  platform: {
    type: String,
    enum: ['web', 'ios', 'android'],
    required: true
  },

  webPushSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  },

  fcmToken: { type: String, default: null },

  deviceId: { type: String, default: null },
  deviceName: { type: String, default: null },
  appVersion: { type: String, default: null },

  active: { type: Boolean, default: true, index: true },
  lastUsedAt: { type: Date, default: Date.now },
  failureCount: { type: Number, default: 0 }

}, { timestamps: true });

PushSubscriptionSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
PushSubscriptionSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);