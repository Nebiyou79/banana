// server/src/models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  tin: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function (v) {
        // Must be exactly 10 digits
        return /^[0-9]{10}$/.test(v);
      },
      message: 'TIN number must be exactly 10 digits'
    }
  },
  industry: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    default: null
  },
  bannerUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        // Allow only digits, optional "+" at start
        return /^\+?[0-9]{7,15}$/.test(v);
      },
      message: 'Phone number must contain only digits (7–15 digits allowed)'
    }
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true; // allow empty
        // Allow valid URLs with or without protocol
        return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(v);
      },
      message: 'Please enter a valid website URL (e.g., https://example.com)'
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Virtual for getting full logo URL
companySchema.virtual('logoFullUrl').get(function () {
  if (!this.logoUrl) return null;
  if (this.logoUrl.startsWith('http')) return this.logoUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.logoUrl}`;
});

// Virtual for getting full banner URL
companySchema.virtual('bannerFullUrl').get(function () {
  if (!this.bannerUrl) return null;
  if (this.bannerUrl.startsWith('http')) return this.bannerUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.bannerUrl}`;
});

// Ensure virtual fields are serialized
companySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);
