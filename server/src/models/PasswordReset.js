const mongoose = require('mongoose');
const crypto = require('crypto');

const PasswordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '1h' }, // Auto delete after 1 hour
  },
  used: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Generate reset token
PasswordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if token is valid
PasswordResetSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);