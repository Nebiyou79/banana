// server/src/models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters'],
    index: true
  },
  registrationNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    index: true,
     validate: {
      validator: function (v) {
        // Must be exactly 10 digits
        return /^[0-9]{10}$/.test(v);
      },
      message: 'TIN number must be exactly 10 digits'
    }
  },
  organizationType: {
    type: String,
    trim: true,
    enum: {
      values: ['non-profit', 'government', 'educational', 'healthcare', 'other'],
      message: '{VALUE} is not a valid organization type'
    }
  },
  industry: {
    type: String,
    trim: true,
    index: true
  },
  logoUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || v.startsWith('/uploads/') || v.startsWith('http');
      },
      message: 'Logo URL must be a valid upload path or HTTP URL'
    }
  },
  bannerUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || v.startsWith('/uploads/') || v.startsWith('http');
      },
      message: 'Banner URL must be a valid upload path or HTTP URL'
    }
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
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
  },  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  secondaryPhone: {
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
  mission: {
    type: String,
    trim: true,
    maxlength: [500, 'Mission statement cannot exceed 500 characters']
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  foundedYear: {
    type: Number,
    min: [1800, 'Founded year must be after 1800'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDetails: {
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    verifiedAt: Date,
    rejectionReason: String,
    documents: [{
      type: { type: String }, // registration, tax, license
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  settings: {
    allowMessages: { type: Boolean, default: true },
    showContactInfo: { type: Boolean, default: true },
    jobAlerts: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
organizationSchema.index({ createdAt: -1 });
organizationSchema.index({ 'address.country': 1, 'address.state': 1 });
organizationSchema.index({ organizationType: 1, industry: 1 });

// Virtual for job count
organizationSchema.virtual('jobCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'organization',
  count: true
});

// Virtual for active job count
organizationSchema.virtual('activeJobCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'organization',
  count: true,
  match: { status: 'active' }
});

// Virtual for full logo URL
organizationSchema.virtual('logoFullUrl').get(function() {
  if (!this.logoUrl) return null;
  if (this.logoUrl.startsWith('http')) return this.logoUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.logoUrl}`;
});

// Virtual for full banner URL
organizationSchema.virtual('bannerFullUrl').get(function() {
  if (!this.bannerUrl) return null;
  if (this.bannerUrl.startsWith('http')) return this.bannerUrl;
  return `${process.env.BASE_URL || 'http://localhost:4000'}${this.bannerUrl}`;
});

// Instance method to check if organization can post jobs
organizationSchema.methods.canPostJobs = function() {
  return this.verified && this.isActive;
};

// Instance method to get public profile
organizationSchema.methods.getPublicProfile = function() {
  const publicFields = [
    '_id', 'name', 'organizationType', 'industry', 'logoUrl', 'bannerUrl',
    'description', 'mission', 'size', 'foundedYear', 'verified',
    'socialMedia', 'address', 'contact', 'createdAt'
  ];
  
  const profile = {};
  publicFields.forEach(field => {
    if (this[field] !== undefined) {
      profile[field] = this[field];
    }
  });
  
  return profile;
};

// Static method to find active organizations
organizationSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find verified organizations
organizationSchema.statics.findVerified = function() {
  return this.find({ verified: true, isActive: true });
};

// Middleware to update verification timestamp
organizationSchema.pre('save', function(next) {
  if (this.isModified('verified') && this.verified) {
    this.verificationDetails.verifiedAt = new Date();
    this.verificationStatus = 'verified';
  }
  next();
});

// Middleware to handle verification status changes
organizationSchema.pre('save', function(next) {
  if (this.isModified('verificationStatus') && this.verificationStatus === 'rejected') {
    this.verified = false;
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);