// server/src/models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  registrationNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  organizationType: {
    type: String,
    trim: true,
    enum: ['non-profit', 'government', 'educational', 'healthcare', 'other']
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
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  mission: {
    type: String,
    trim: true,
    maxlength: [500, 'Mission statement cannot exceed 500 characters']
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
organizationSchema.virtual('logoFullUrl').get(function() {
  if (!this.logoUrl) return null;
  if (this.logoUrl.startsWith('http')) return this.logoUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.logoUrl}`;
});

// Virtual for getting full banner URL
organizationSchema.virtual('bannerFullUrl').get(function() {
  if (!this.bannerUrl) return null;
  if (this.bannerUrl.startsWith('http')) return this.bannerUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.bannerUrl}`;
});

// Ensure virtual fields are serialized
organizationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Organization', organizationSchema);