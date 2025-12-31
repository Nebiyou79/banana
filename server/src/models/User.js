const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true, maxlength: 200 },
  degree: { type: String, required: true, trim: true, maxlength: 100 },
  field: { type: String, trim: true, maxlength: 100 },
  startDate: { type: Date, required: true },
  endDate: {
    type: Date, validate: {
      validator: function (value) {
        return !this.current || value > this.startDate;
      },
      message: 'End date must be after start date for completed education'
    }
  },
  current: { type: Boolean, default: false },
  description: { type: String, trim: true, maxlength: 500 }
});

const certificationSchema = new mongoose.Schema({
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
      validator: function (value) {
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
      validator: function (value) {
        return !value || validator.isURL(value, { protocols: ['http', 'https'], require_protocol: true });
      },
      message: 'Invalid credential URL'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, maxlength: 200 },
  position: { type: String, required: true, trim: true, maxlength: 100 },
  startDate: { type: Date, required: true },
  endDate: {
    type: Date, validate: {
      validator: function (value) {
        return !this.current || value > this.startDate;
      },
      message: 'End date must be after start date for completed experience'
    }
  },
  current: { type: Boolean, default: false },
  description: { type: String, trim: true, maxlength: 1000 },
  skills: [{ type: String, trim: true }]
});

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  mediaUrl: {
    type: String,
    trim: true,
  },
  projectUrl: {
    type: String,
    trim: true,
  },
  category: { type: String, trim: true, maxlength: 100 },
  technologies: [{ type: String, trim: true }],
  budget: { type: Number, min: 0 },
  duration: { type: String, trim: true, maxlength: 50 },
  client: { type: String, trim: true, maxlength: 200 },
  completionDate: { type: Date }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (value) {
        return validator.isEmail(value);
      },
      message: 'Invalid email address'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
      message: 'Invalid user role'
    },
    default: 'candidate'
  },
  // NEW: Age and Gender fields for candidates and freelancers
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function (value) {
        if (!value) return true; // Allow empty
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()); // 100 years ago
        const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()); // 16 years ago (minimum working age)
        return value >= minDate && value <= maxDate;
      },
      message: 'Date of birth must be valid and you must be at least 16 years old'
    }
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'prefer-not-to-say'],
      message: 'Invalid gender selection'
    },
    default: 'prefer-not-to-say'
  },

  verificationStatus: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'none'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  hasOrganizationProfile: {
    type: Boolean,
    default: false
  },
  profileCompleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },

  // NEW: Social Profile Fields
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

  skills: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  education: [educationSchema],
  experience: [experienceSchema],
  certifications: [certificationSchema],
  cvUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        return !value || validator.isURL(value, { protocols: ['http', 'https'], require_protocol: true });
      },
      message: 'Invalid CV URL'
    }
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  cvs: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  portfolio: [portfolioItemSchema],

  avatar: {
    type: String,
  },
  coverPhoto: {
    type: String,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (!value) return true;
        return /^\+?[1-9]\d{7,14}$/.test(value);
      },
      message: 'Invalid phone number'
    }
  },
  website: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/.test(v);
      },
      message: 'Invalid website URL format'
    }
  },

  // NEW: Enhanced Social Links
  socialLinks: {
    linkedin: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+(\/)?$/i.test(value);
        },
        message: 'Invalid LinkedIn URL format. Use: https://linkedin.com/in/username'
      }
    },
    github: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9-]+(\/)?$/i.test(value);
        },
        message: 'Invalid GitHub URL format. Use: https://github.com/username'
      }
    },
    tiktok: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+(\/)?$/i.test(value);
        },
        message: 'Invalid TikTok URL format. Use: https://tiktok.com/@username'
      }
    },
    telegram: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || /^(https?:\/\/)?(www\.)?t\.me\/[a-zA-Z0-9_]+(\/)?$/i.test(value);
        },
        message: 'Invalid Telegram URL format. Use: https://t.me/username'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || /^(https?:\/\/)?(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+(\/)?$/i.test(value);
        },
        message: 'Invalid Twitter/X URL format. Use: https://twitter.com/username or https://x.com/username'
      }
    }
  },

  // NEW: Social Stats
  socialStats: {
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    connectionCount: { type: Number, default: 0 }
  },

  // NEW: Privacy & Visibility Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
    },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showAge: { type: Boolean, default: false },
    allowMessages: { type: Boolean, default: true },
    allowConnections: { type: Boolean, default: true }
  },

  // NEW: Notification Preferences
  notificationPreferences: {
    email: {
      messages: { type: Boolean, default: true },
      connectionRequests: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true },
      jobMatches: { type: Boolean, default: true }
    },
    push: {
      messages: { type: Boolean, default: true },
      connectionRequests: { type: Boolean, default: true },
      postInteractions: { type: Boolean, default: true }
    }
  },

  hasCompanyProfile: {
    type: Boolean,
    default: false
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  emailVerified: {
    type: Boolean,
    default: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  lockUntil: {
    type: Date,
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'none'
  },

  // NEW: Add verification details
  verificationDetails: {
    profileVerified: { type: Boolean, default: false },
    socialVerified: { type: Boolean, default: false },
    documentsVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    lastVerified: { type: Date },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who verified
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.passwordHash;
      // Calculate age from dateOfBirth
      if (ret.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(ret.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        ret.age = age;
      }
      return ret;
    }
  }
});

// Virtual for age calculation
userSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error("Password hash is missing for this user.");
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.isProfileComplete = function () {
  if (this.role === 'company') {
    return this.hasCompanyProfile && this.profileCompleted;
  }
  return this.profileCompleted;
};

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Add method to increment login attempts
userSchema.methods.incrementLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 minutes
  }

  return this.updateOne(updates);
};

// NEW: Method to update social stats
userSchema.methods.updateSocialStats = async function () {
  const Follow = mongoose.model('Follow');
  const Post = mongoose.model('Post');

  const followerCount = await Follow.countDocuments({ followingId: this._id });
  const followingCount = await Follow.countDocuments({ followerId: this._id });
  const postCount = await Post.countDocuments({ userId: this._id });

  this.socialStats.followerCount = followerCount;
  this.socialStats.followingCount = followingCount;
  this.socialStats.postCount = postCount;

  return this.save();
};
// Add method to check verification status
userSchema.methods.updateVerificationStatus = function () {
  const { profileVerified, socialVerified, documentsVerified } = this.verificationDetails;

  if (profileVerified && socialVerified && documentsVerified) {
    this.verificationStatus = 'full';
  } else if (profileVerified || socialVerified || documentsVerified) {
    this.verificationStatus = 'partial';
  } else {
    this.verificationStatus = 'none';
  }

  return this.save();
};

// Add method to get verification message
userSchema.methods.getVerificationMessage = function () {
  const { profileVerified, socialVerified } = this.verificationDetails;

  switch (this.verificationStatus) {
    case 'full':
      return 'Your Profile is fully Verified';
    case 'partial':
      if (profileVerified && !socialVerified) {
        return 'Your Profile is verified but not your social Profile. Complete your Verification';
      } else if (!profileVerified && socialVerified) {
        return 'Your Social Profile is verified but not your main Profile. Complete your Verification';
      } else {
        return 'Partially Verified. Complete your Verification';
      }
    case 'none':
    default:
      return 'Both The Profile and SocialProfile are not verified. Complete your Verification';
  }
};
module.exports = mongoose.model('User', userSchema);