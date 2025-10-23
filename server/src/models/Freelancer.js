const mongoose = require('mongoose');

const freelancerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Professional Information
  headline: {
    type: String,
    trim: true,
    maxlength: 200
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  hourlyRate: {
    type: Number,
    min: 0,
    max: 1000,
    default: 0
  },
  availability: {
    type: String,
    enum: ['available', 'not-available', 'part-time'],
    default: 'available'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    default: 'intermediate'
  },
  englishProficiency: {
    type: String,
    enum: ['basic', 'conversational', 'fluent', 'native'],
    default: 'basic'
  },
  timezone: {
    type: String,
    trim: true
  },
  
  // Specialization & Services
  specialization: [{
    type: String,
    trim: true
  }],
  services: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    price: {
      type: Number,
      min: 0
    },
    deliveryTime: {
      type: Number, // in days
      min: 1
    },
    category: {
      type: String,
      trim: true
    }
  }],
  
  // ADDED: Certifications for freelancers
  certifications: [{
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 200 
    },
    issuer: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 200 
    },
    issueDate: { 
      type: Date, 
      required: true 
    },
    expiryDate: { 
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value > this.issueDate;
        },
        message: 'Expiry date must be after issue date'
      }
    },
    credentialId: { 
      type: String, 
      trim: true, 
      maxlength: 100 
    },
    credentialUrl: { 
      type: String, 
      trim: true,
      validate: {
        validator: function(value) {
          return !value || /^https?:\/\/.+\..+/.test(value);
        },
        message: 'Invalid credential URL'
      }
    },
    description: { 
      type: String, 
      trim: true, 
      maxlength: 500 
    },
    skills: [{ 
      type: String, 
      trim: true 
    }] // Skills gained from this certification
  }],
  
  // Verification & Status
  verified: {
    type: Boolean,
    default: false
  },
  profileCompletion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Professional Stats
  totalEarnings: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  onTimeDelivery: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  responseRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Ratings & Reviews
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      communication: { type: Number, default: 0 },
      quality: { type: Number, default: 0 },
      deadlines: { type: Number, default: 0 },
      professionalism: { type: Number, default: 0 }
    }
  },
  
  // Professional Badges
  badges: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  
  // Business Information
  businessSize: {
    type: String,
    enum: ['individual', 'agency', 'small-team'],
    default: 'individual'
  },
  teamMembers: [{
    name: String,
    role: String,
    experience: String
  }],
  
  // Availability & Preferences
  workingHours: {
    start: String, // "09:00"
    end: String,   // "17:00"
    timezone: String
  },
  responseTime: {
    type: Number, // in hours
    default: 24
  },
  preferredPaymentMethods: [{
    type: String,
    enum: ['hourly', 'fixed', 'milestone']
  }],
  
  // Analytics
  profileViews: {
    type: Number,
    default: 0
  },
  profileImpressions: {
    type: Number,
    default: 0
  },
  proposalViews: {
    type: Number,
    default: 0
  },
  
  // Settings
  profileVisibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  
  // Membership & Subscriptions
  membership: {
    type: String,
    enum: ['basic', 'professional', 'premium'],
    default: 'basic'
  },
  membershipExpires: Date

}, {
  timestamps: true
});

// Indexes for better performance
freelancerProfileSchema.index({ user: 1 });
freelancerProfileSchema.index({ specialization: 1 });
freelancerProfileSchema.index({ hourlyRate: 1 });
freelancerProfileSchema.index({ experienceLevel: 1 });
freelancerProfileSchema.index({ verified: 1 });
freelancerProfileSchema.index({ featured: 1 });
freelancerProfileSchema.index({ 'ratings.average': -1 });
freelancerProfileSchema.index({ 'certifications.issueDate': -1 }); // NEW: Index for certifications

// Virtual for isProfileComplete
freelancerProfileSchema.virtual('isProfileComplete').get(function() {
  return this.profileCompletion >= 80;
});

// ENHANCED: Calculate profile completion with certifications and projects
freelancerProfileSchema.methods.calculateProfileCompletion = function(user) {
  const fields = [
    // Basic Info (20%)
    { condition: user.name && user.name.trim().length > 0, weight: 5 },
    { condition: user.email, weight: 5 },
    { condition: user.avatar, weight: 5 },
    { condition: user.location && user.location.trim().length > 0, weight: 5 },
    
    // Professional Info (30%)
    { condition: this.headline && this.headline.trim().length > 0, weight: 10 },
    { condition: this.bio && this.bio.trim().length > 100, weight: 10 },
    { condition: this.hourlyRate > 0, weight: 5 },
    { condition: this.experienceLevel && this.experienceLevel !== 'intermediate', weight: 5 },
    
    // Skills & Portfolio (25%)
    { condition: user.skills && user.skills.length >= 5, weight: 10 },
    { condition: user.portfolio && user.portfolio.length >= 3, weight: 10 },
    { condition: this.specialization && this.specialization.length > 0, weight: 5 },
    
    // Experience & Education (15%)
    { condition: user.experience && user.experience.length > 0, weight: 8 },
    { condition: user.education && user.education.length > 0, weight: 7 },
    
    // Certifications & Additional Info (10%)
    { condition: this.certifications && this.certifications.length > 0, weight: 5 }, // NEW
    { condition: user.website || (user.socialLinks && Object.values(user.socialLinks).some(link => link)), weight: 5 }
  ];

  let totalScore = 0;
  let maxPossibleScore = fields.reduce((sum, field) => sum + field.weight, 0);

  fields.forEach(field => {
    if (field.condition) {
      totalScore += field.weight;
    }
  });

  return Math.round((totalScore / maxPossibleScore) * 100);
};

// Update profile completion before save
freelancerProfileSchema.pre('save', function(next) {
  // We'll calculate this in the controller where we have access to user data
  next();
});

// Static method to find by user ID
freelancerProfileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ user: userId }).populate('user');
};

// NEW: Method to add certification
freelancerProfileSchema.methods.addCertification = function(certificationData) {
  this.certifications.push(certificationData);
  return this.save();
};

// NEW: Method to remove certification
freelancerProfileSchema.methods.removeCertification = function(certificationId) {
  this.certifications.id(certificationId).remove();
  return this.save();
};

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);