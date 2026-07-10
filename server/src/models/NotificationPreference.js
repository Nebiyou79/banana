// server/src/models/NotificationPreference.js
const mongoose = require('mongoose');

const channelSettingsSchema = new mongoose.Schema({
  inApp: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  email: { type: Boolean, default: false }
}, { _id: false });

const NotificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  globalEnabled: { type: Boolean, default: true },

  categories: {
    social:       { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: false }) },
    messaging:    { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: false }) },
    jobs:         { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: true }) },
    tenders:      { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: true }) },
    proposals:    { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: true }) },
    verification: { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: true }) },
    appointments: { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: true }) },
    referrals:    { type: channelSettingsSchema, default: () => ({ inApp: true, push: false, email: false }) },
    system:       { type: channelSettingsSchema, default: () => ({ inApp: true, push: true, email: false }) }
  },

  quietHours: {
    enabled: { type: Boolean, default: false },
    startHour: { type: Number, min: 0, max: 23, default: 22 },
    endHour: { type: Number, min: 0, max: 23, default: 8 },
    timezone: { type: String, default: 'Africa/Addis_Ababa' }
  },

  emailDigest: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    hour: { type: Number, default: 8 }
  }

}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);