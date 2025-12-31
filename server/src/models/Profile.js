const mongoose = require('mongoose');
const User = require('./User');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },

  // Personal Information
  headline: {
    type: String,
    trim: true,
    maxlength: [200, 'Headline cannot exceed 200 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return !v || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return !v || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Invalid website URL'
    }
  },

  // Social Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/.test(v);
        },
        message: 'Invalid LinkedIn URL'
      }
    },
    github: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?github\.com\/.+/.test(v);
        },
        message: 'Invalid GitHub URL'
      }
    },
    twitter: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?(twitter|x)\.com\/.+/.test(v);
        },
        message: 'Invalid Twitter URL'
      }
    },
    facebook: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?facebook\.com\/.+/.test(v);
        },
        message: 'Invalid Facebook URL'
      }
    },
    instagram: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?instagram\.com\/.+/.test(v);
        },
        message: 'Invalid Instagram URL'
      }
    },
    tiktok: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/.test(v);
        },
        message: 'Invalid TikTok URL'
      }
    },
    telegram: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?t\.me\/.+/.test(v);
        },
        message: 'Invalid Telegram URL'
      }
    },
    youtube: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: 'Invalid YouTube URL'
      }
    }
  },

  // Role-specific fields
  roleSpecific: {
    // For candidates/freelancers
    skills: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    education: [{
      institution: {
        type: String,
        required: [true, 'Institution name is required'],
        trim: true,
        maxlength: 200
      },
      degree: {
        type: String,
        required: [true, 'Degree is required'],
        trim: true,
        maxlength: 100
      },
      field: {
        type: String,
        required: [true, 'Field of study is required'],
        trim: true,
        maxlength: 100
      },
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      endDate: Date,
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      grade: {
        type: String,
        trim: true,
        maxlength: 20
      }
    }],
    experience: [{
      company: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: 200
      },
      position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true,
        maxlength: 100
      },
      location: {
        type: String,
        trim: true,
        maxlength: 100
      },
      employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'self-employed']
      },
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      endDate: Date,
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000
      },
      skills: [{
        type: String,
        trim: true,
        maxlength: 50
      }],
      achievements: [{
        type: String,
        trim: true,
        maxlength: 500
      }]
    }],
    certifications: [{
      name: {
        type: String,
        required: [true, 'Certification name is required'],
        trim: true,
        maxlength: 200
      },
      issuer: {
        type: String,
        required: [true, 'Issuer is required'],
        trim: true,
        maxlength: 200
      },
      issueDate: {
        type: Date,
        required: [true, 'Issue date is required']
      },
      expiryDate: Date,
      credentialId: {
        type: String,
        trim: true,
        maxlength: 100
      },
      credentialUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+\..+/.test(v);
          },
          message: 'Invalid credential URL'
        }
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      }
    }],
    portfolio: [{
      title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: 200
      },
      description: {
        type: String,
        trim: true,
        maxlength: 1000
      },
      mediaUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+\..+/.test(v);
          },
          message: 'Invalid media URL'
        }
      },
      projectUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+\..+/.test(v);
          },
          message: 'Invalid project URL'
        }
      },
      category: {
        type: String,
        trim: true,
        maxlength: 100
      },
      technologies: [{
        type: String,
        trim: true,
        maxlength: 50
      }],
      budget: {
        type: Number,
        min: 0
      },
      duration: {
        type: String,
        trim: true,
        maxlength: 50
      },
      client: {
        type: String,
        trim: true,
        maxlength: 200
      },
      completionDate: Date,
      teamSize: Number,
      role: {
        type: String,
        trim: true,
        maxlength: 100
      }
    }],

    // For companies/organizations
    companyInfo: {
      size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
      },
      foundedYear: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear()
      },
      companyType: {
        type: String,
        enum: ['startup', 'small-business', 'medium-business', 'large-enterprise', 'multinational', 'non-profit', 'government']
      },
      industry: {
        type: String,
        trim: true,
        maxlength: 100
      },
      mission: {
        type: String,
        trim: true,
        maxlength: 500
      },
      values: [{
        type: String,
        trim: true,
        maxlength: 100
      }],
      culture: {
        type: String,
        trim: true,
        maxlength: 1000
      },
      specialties: [{
        type: String,
        trim: true,
        maxlength: 100
      }]
    }
  },

  // Social Statistics
  socialStats: {
    followerCount: {
      type: Number,
      default: 0,
      min: 0
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    postCount: {
      type: Number,
      default: 0,
      min: 0
    },
    profileViews: {
      type: Number,
      default: 0,
      min: 0
    },
    connectionCount: {
      type: Number,
      default: 0,
      min: 0
    },
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    endorsementCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Verification
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none'
  },
  verificationDetails: {
    submittedAt: Date,
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      documentType: {
        type: String,
        required: true,
        enum: ['government_id', 'passport', 'driver_license', 'proof_of_address', 'company_registration', 'tax_certificate', 'other']
      },
      url: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^https?:\/\/.+\..+/.test(v);
          },
          message: 'Invalid document URL'
        }
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      remarks: String,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Privacy & Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
    },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showAge: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
    allowConnections: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    showLastSeen: { type: Boolean, default: true },
    showProfileViews: { type: Boolean, default: true }
  },

  // Notification Preferences
  notificationPreferences: {
    email: {
      messages: { type: Boolean, default: true },
      connectionRequests: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true },
      jobMatches: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true }
    },
    push: {
      messages: { type: Boolean, default: true },
      connectionRequests: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: true }
    },
    inApp: {
      messages: { type: Boolean, default: true },
      connectionRequests: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      jobMatches: { type: Boolean, default: true }
    }
  },

  // Profile Completion
  profileCompletion: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedSections: [{
      type: String,
      enum: ['basic', 'skills', 'education', 'experience', 'certifications', 'portfolio', 'company', 'social', 'verification', 'media']
    }],
    lastUpdated: Date,
    requiredFields: [String],
    completedFields: [String]
  },

  // Featured status
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  featuredReason: String,

  // Premium features
  premium: {
    isPremium: { type: Boolean, default: false },
    tier: {
      type: String,
      enum: ['basic', 'professional', 'business', 'enterprise'],
      default: 'basic'
    },
    validUntil: Date,
    features: [String]
  },

  // Additional metadata
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'professional', 'fluent', 'native'],
      required: true
    }
  }],

  interests: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  awards: [{
    title: {
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
    date: Date,
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    url: String
  }],

  volunteerExperience: [{
    organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    cause: {
      type: String,
      trim: true,
      maxlength: 100
    },
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    hoursPerWeek: Number,
    totalHours: Number
  }],

  // Activity tracking
  lastActive: Date,
  lastProfileUpdate: Date,
  lastJobSearch: Date,
  lastConnectionActivity: Date,

  // SEO metadata
  metaKeywords: [String],
  metaDescription: String,

  // Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isComplete: {
    type: Boolean,
    default: false
  },

  // Analytics
  analytics: {
    monthlyViews: {
      type: Map,
      of: Number,
      default: {}
    },
    topCountries: [{
      country: String,
      views: Number
    }],
    trafficSources: {
      direct: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      referral: { type: Number, default: 0 }
    }
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      delete ret.id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
profileSchema.index({ user: 1 }, { unique: true });
profileSchema.index({ 'roleSpecific.skills': 1 });
profileSchema.index({ location: 1 });
profileSchema.index({ verificationStatus: 1 });
profileSchema.index({ featured: 1 });
profileSchema.index({ 'socialStats.followerCount': -1 });
profileSchema.index({ 'socialStats.profileViews': -1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ 'roleSpecific.companyInfo.industry': 1 });
profileSchema.index({ 'roleSpecific.companyInfo.size': 1 });
profileSchema.index({ 'profileCompletion.percentage': -1 });
profileSchema.index({ lastActive: -1 });
profileSchema.index({ headline: 'text', bio: 'text', 'roleSpecific.skills': 'text', location: 'text' });

// Virtual for avatar and cover photo
profileSchema.virtual('avatar').get(function () {
  return this.user?.avatar || null;
});

profileSchema.virtual('coverPhoto').get(function () {
  return this.user?.coverPhoto || null;
});

profileSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update completion percentage and timestamps
profileSchema.pre('save', async function (next) {
  try {
    // Update timestamps
    this.lastProfileUpdate = new Date();

    // Calculate completion if fields are modified
    if (this.isModified()) {
      const user = await User.findById(this.user);
      if (user) {
        await this.calculateCompletion(user);
      }
    }

    // Set isComplete flag
    this.isComplete = this.profileCompletion.percentage >= 80;

    next();
  } catch (error) {
    console.error('Error in profile pre-save:', error);
    // Don't fail the save on completion calculation errors
    next();
  }
});

// Method to calculate profile completion
profileSchema.methods.calculateCompletion = async function (user) {
  let completedFields = 0;
  let totalFields = 0;
  const completedSections = new Set();
  const requiredFields = [];
  const completedFieldsList = [];

  // Basic info section (25%)
  const basicFields = [
    { field: 'headline', weight: 5 },
    { field: 'bio', weight: 5 },
    { field: 'location', weight: 5 },
    { field: 'phone', weight: 2 },
    { field: 'website', weight: 2 }
  ];

  basicFields.forEach(({ field, weight }) => {
    totalFields += weight;
    if (this[field] && this[field].toString().trim().length > 0) {
      completedFields += weight;
      completedFieldsList.push(field);
    }
    requiredFields.push(field);
  });

  if (completedFields > 0) completedSections.add('basic');

  // Role-specific fields (40%)
  if (user.role === 'candidate' || user.role === 'freelancer') {
    const roleFields = [
      { field: 'roleSpecific.skills', weight: 10 },
      { field: 'roleSpecific.education', weight: 10 },
      { field: 'roleSpecific.experience', weight: 15 },
      { field: 'roleSpecific.certifications', weight: 5 }
    ];

    roleFields.forEach(({ field, weight }) => {
      totalFields += weight;
      const [parent, child] = field.split('.');
      const value = parent === 'roleSpecific' ? this.roleSpecific[child] : this[parent];

      if (Array.isArray(value) && value.length > 0) {
        completedFields += weight;
        completedFieldsList.push(field);
        if (child) completedSections.add(child);
      }
      requiredFields.push(field);
    });
  } else if (user.role === 'company' || user.role === 'organization') {
    const companyFields = [
      { field: 'roleSpecific.companyInfo.size', weight: 5 },
      { field: 'roleSpecific.companyInfo.industry', weight: 10 },
      { field: 'roleSpecific.companyInfo.mission', weight: 10 },
      { field: 'roleSpecific.companyInfo.foundedYear', weight: 5 },
      { field: 'roleSpecific.companyInfo.companyType', weight: 10 }
    ];

    companyFields.forEach(({ field, weight }) => {
      totalFields += weight;
      const [parent, child, grandchild] = field.split('.');
      const value = parent === 'roleSpecific' ? (this.roleSpecific[child] && this.roleSpecific[child][grandchild]) : this[parent];

      if (value !== undefined && value !== null && value !== '') {
        completedFields += weight;
        completedFieldsList.push(field);
        completedSections.add('company');
      }
      requiredFields.push(field);
    });
  }

  // Media section (15%) - FIXED: Use 'social' instead of 'media'
  const mediaFields = ['avatar', 'coverPhoto'];
  mediaFields.forEach(field => {
    totalFields += 5;
    if (user[field]) {
      completedFields += 5;
      completedFieldsList.push(field);
    }
    requiredFields.push(field);
  });

  // Add 'social' section if avatar exists instead of 'media'
  if (user.avatar) {
    completedSections.add('social');
  }

  // Social links section (10%)
  const socialLinksCount = Object.values(this.socialLinks || {}).filter(link =>
    link && link.trim().length > 0
  ).length;
  totalFields += 10;
  if (socialLinksCount >= 2) {
    completedFields += 10;
    completedFieldsList.push('socialLinks');
    completedSections.add('social');
  } else {
    completedFields += (socialLinksCount / 2) * 10;
  }
  requiredFields.push('socialLinks');

  // Skills section (10% for candidates/freelancers)
  if ((user.role === 'candidate' || user.role === 'freelancer') && this.roleSpecific.skills && this.roleSpecific.skills.length > 0) {
    totalFields += 10;
    completedFields += 10;
    completedFieldsList.push('skills');
    completedSections.add('skills');
  }

  const percentage = Math.round((completedFields / totalFields) * 100);

  // Convert Set to Array and filter out any invalid enum values
  const validCompletedSections = Array.from(completedSections).filter(section =>
    ['basic', 'skills', 'education', 'experience', 'certifications', 'portfolio', 'company', 'social', 'verification'].includes(section)
  );

  this.profileCompletion = {
    percentage: Math.min(percentage, 100),
    completedSections: validCompletedSections,
    lastUpdated: new Date(),
    requiredFields,
    completedFields: completedFieldsList
  };

  return this.profileCompletion.percentage;
};

// Method to get public profile data
profileSchema.methods.getPublicProfile = function () {
  const publicProfile = {
    _id: this._id,
    user: {
      _id: this.user?._id || this.user,
      name: this.user?.name,
      avatar: this.user?.avatar,
      role: this.user?.role,
      verificationStatus: this.verificationStatus
    },
    headline: this.headline,
    bio: this.bio,
    location: this.location,
    website: this.website,
    socialLinks: this.socialLinks,
    roleSpecific: {
      skills: this.roleSpecific.skills || []
    },
    socialStats: {
      followerCount: this.socialStats.followerCount,
      followingCount: this.socialStats.followingCount,
      postCount: this.socialStats.postCount,
      profileViews: this.socialStats.profileViews,
      connectionCount: this.socialStats.connectionCount
    },
    verificationStatus: this.verificationStatus,
    featured: this.featured,
    profileCompletion: this.profileCompletion.percentage,
    createdAt: this.createdAt,
    lastActive: this.lastActive
  };

  // Add role-specific public data
  if (this.user?.role === 'company' || this.user?.role === 'organization') {
    publicProfile.roleSpecific.companyInfo = {
      size: this.roleSpecific.companyInfo?.size,
      industry: this.roleSpecific.companyInfo?.industry,
      companyType: this.roleSpecific.companyInfo?.companyType,
      foundedYear: this.roleSpecific.companyInfo?.foundedYear,
      mission: this.roleSpecific.companyInfo?.mission
    };
  }

  return publicProfile;
};

// Method to get detailed profile for connections
profileSchema.methods.getDetailedProfile = function () {
  const detailedProfile = this.getPublicProfile();

  // Add additional details for connections
  detailedProfile.experience = this.roleSpecific.experience || [];
  detailedProfile.education = this.roleSpecific.education || [];
  detailedProfile.certifications = this.roleSpecific.certifications || [];
  detailedProfile.languages = this.languages || [];
  detailedProfile.interests = this.interests || [];

  return detailedProfile;
};

// Static method to find by user ID with population
profileSchema.statics.findByUserId = function (userId, populateOptions = []) {
  const query = this.findOne({ user: userId });

  if (populateOptions.length > 0) {
    return query.populate(populateOptions);
  }

  return query.populate('user', 'name email role avatar coverPhoto dateOfBirth gender');
};

// Static method to get popular profiles
profileSchema.statics.getPopularProfiles = function (limit = 10, role = null) {
  let query = this.find({ isActive: true, 'privacySettings.profileVisibility': 'public' });

  if (role) {
    query = query.populate({
      path: 'user',
      match: { role },
      select: 'name avatar role verificationStatus'
    });
  } else {
    query = query.populate('user', 'name avatar role verificationStatus');
  }

  return query
    .sort({ 'socialStats.followerCount': -1, 'socialStats.profileViews': -1 })
    .limit(limit);
};

// Static method to search profiles
profileSchema.statics.searchProfiles = function (searchTerm, filters = {}, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  let query = {
    isActive: true,
    'privacySettings.profileVisibility': 'public'
  };

  // Text search
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  // Apply filters
  if (filters.location) {
    query.location = new RegExp(filters.location, 'i');
  }

  if (filters.skills && filters.skills.length > 0) {
    query['roleSpecific.skills'] = { $in: filters.skills };
  }

  if (filters.role) {
    query = this.find(query).populate({
      path: 'user',
      match: { role: filters.role },
      select: 'name avatar role verificationStatus'
    });
  } else {
    query = this.find(query).populate('user', 'name avatar role verificationStatus');
  }

  return query
    .skip(skip)
    .limit(limit)
    .sort({ 'profileCompletion.percentage': -1, 'socialStats.profileViews': -1 });
};

// Update social stats method
profileSchema.methods.updateSocialStats = async function () {
  try {
    const Follow = mongoose.model('Follow');
    const Post = mongoose.model('Post');
    const Connection = mongoose.model('Connection');

    const [followerCount, followingCount, postCount, connectionCount] = await Promise.all([
      Follow.countDocuments({ targetId: this.user, status: 'accepted' }),
      Follow.countDocuments({ followerId: this.user, status: 'accepted' }),
      Post.countDocuments({ author: this.user, status: 'active' }),
      Connection.countDocuments({
        $or: [
          { user1: this.user, status: 'connected' },
          { user2: this.user, status: 'connected' }
        ]
      })
    ]);

    this.socialStats.followerCount = followerCount;
    this.socialStats.followingCount = followingCount;
    this.socialStats.postCount = postCount;
    this.socialStats.connectionCount = connectionCount;

    // Calculate engagement rate
    if (this.socialStats.followerCount > 0) {
      const engagement = (this.socialStats.postCount * 0.1) +
        (this.socialStats.profileViews * 0.01) +
        (this.socialStats.connectionCount * 0.05);
      this.socialStats.engagementRate = Math.min(Math.round(engagement), 100);
    }

    await this.save();
    return this;
  } catch (error) {
    console.error('Error updating social stats:', error);
    throw error;
  }
};

// Method to update analytics
profileSchema.methods.updateAnalytics = function (country = null, source = 'direct') {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Update monthly views
  const currentMonthlyViews = this.analytics.monthlyViews.get(monthKey) || 0;
  this.analytics.monthlyViews.set(monthKey, currentMonthlyViews + 1);

  // Update traffic sources
  if (this.analytics.trafficSources[source] !== undefined) {
    this.analytics.trafficSources[source] += 1;
  }

  // Update top countries
  if (country) {
    const countryIndex = this.analytics.topCountries.findIndex(c => c.country === country);
    if (countryIndex > -1) {
      this.analytics.topCountries[countryIndex].views += 1;
    } else {
      this.analytics.topCountries.push({ country, views: 1 });
    }

    // Sort and keep top 10
    this.analytics.topCountries.sort((a, b) => b.views - a.views);
    this.analytics.topCountries = this.analytics.topCountries.slice(0, 10);
  }

  return this.save();
};

// Method to increment profile views
profileSchema.methods.incrementProfileViews = async function () {
  this.socialStats.profileViews += 1;
  this.lastActive = new Date();
  return this.save();
};

// Method to get profile summary
profileSchema.methods.getProfileSummary = function () {
  return {
    _id: this._id,
    userId: this.user,
    headline: this.headline,
    location: this.location,
    skills: this.roleSpecific.skills.slice(0, 5),
    experienceYears: this.calculateExperienceYears(),
    profileCompletion: this.profileCompletion.percentage,
    isVerified: this.verificationStatus === 'verified',
    isFeatured: this.featured,
    lastActive: this.lastActive
  };
};

// Helper method to calculate total experience years
profileSchema.methods.calculateExperienceYears = function () {
  const experiences = this.roleSpecific.experience || [];
  let totalYears = 0;

  experiences.forEach(exp => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate);
    const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
    totalYears += Math.max(0, years);
  });

  return Math.round(totalYears * 10) / 10; // Round to 1 decimal place
};

// Create or update profile method
profileSchema.statics.createOrUpdate = async function (userId, data) {
  try {
    let profile = await this.findOne({ user: userId });

    if (!profile) {
      profile = new this({ user: userId });
    }

    // Update fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        // Handle nested object updates
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          profile[key] = { ...profile[key], ...data[key] };
        } else {
          profile[key] = data[key];
        }
      }
    });

    await profile.save();
    await profile.populate('user', 'name email role avatar coverPhoto dateOfBirth gender');

    return profile;
  } catch (error) {
    console.error('Error in createOrUpdate:', error);
    throw error;
  }
};

module.exports = mongoose.model('Profile', profileSchema);