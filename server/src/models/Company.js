// server/src/models/Company.js - Update the logoUrl and bannerUrl fields
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
    sparse: true
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
companySchema.virtual('logoFullUrl').get(function() {
  if (!this.logoUrl) return null;
  if (this.logoUrl.startsWith('http')) return this.logoUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.logoUrl}`;
});

// Virtual for getting full banner URL
companySchema.virtual('bannerFullUrl').get(function() {
  if (!this.bannerUrl) return null;
  if (this.bannerUrl.startsWith('http')) return this.bannerUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.bannerUrl}`;
});

// Ensure virtual fields are serialized
companySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);