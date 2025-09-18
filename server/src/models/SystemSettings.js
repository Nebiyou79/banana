const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Banana Jobs Platform' },
  siteLogo: { type: String, default: '' },
  adminEmail: { type: String, default: 'admin@example.com' },
  allowRegistrations: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: false },
  jobPostingFee: { type: Number, default: 49.99 },
  featuredJobFee: { type: Number, default: 99.99 },
  currency: { type: String, default: 'USD' },
  smtpConfig: {
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    auth: {
      user: { type: String, default: '' },
      pass: { type: String, default: '' }
    }
  },
  paymentGateway: { type: String, default: 'stripe' },
  stripeSecret: { type: String, default: '' },
  stripePublishable: { type: String, default: '' },
  paypalClientId: { type: String, default: '' },
  paypalSecret: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);