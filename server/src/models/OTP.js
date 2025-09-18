const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['register', 'reset-password'],
    default: 'register',
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '10m' }, // Auto delete after 10 minutes
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 5,
  },
}, {
  timestamps: true,
});

// Method to check if OTP is valid
OTPSchema.methods.isValid = function() {
  return this.attempts < this.maxAttempts && this.expiresAt > new Date();
};

// Method to increment attempt count
OTPSchema.methods.incrementAttempt = function() {
  this.attempts += 1;
  return this.save();
};

module.exports = mongoose.model('OTP', OTPSchema);