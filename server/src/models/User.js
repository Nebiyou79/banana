const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true, maxlength: 200 },
  degree: { type: String, required: true, trim: true, maxlength: 100 },
  field: { type: String, trim: true, maxlength: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, validate: {
    validator: function(value) {
      return !this.current || value > this.startDate;
    },
    message: 'End date must be after start date for completed education'
  }},
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
  endDate: { type: Date, validate: {
    validator: function(value) {
      return !this.current || value > this.startDate;
    },
    message: 'End date must be after start date for completed experience'
  }},
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
      validator: function(value) {
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
      validator: function(value) {
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
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
avatar: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i.test(v);
      },
      message: 'Invalid avatar URL'
    }
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
      validator: function(value) {
        return !value || validator.isMobilePhone(value, 'any', { strictMode: false });
      },
      message: 'Invalid phone number'
    }
  },
website: {
  type: String,
  validate: {
    validator: function(v) {
      if (!v) return true; // Allow empty
      // Allow both with and without protocol
      return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/.test(v);
    },
    message: 'Invalid website URL format'
  }
},
  socialLinks: {
    linkedin: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || validator.isURL(value, { protocols: ['http', 'https'], require_protocol: true });
        },
        message: 'Invalid LinkedIn URL'
      }
    },
    github: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || validator.isURL(value, { protocols: ['http', 'https'], require_protocol: true });
        },
        message: 'Invalid GitHub URL'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || validator.isURL(value, { protocols: ['http', 'https'], require_protocol: true });
        },
        message: 'Invalid Twitter URL'
      }
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
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) {
    throw new Error("Password hash is missing for this user.");
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.isProfileComplete = function() {
  if (this.role === 'company') {
    return this.hasCompanyProfile && this.profileCompleted;
  }
  return this.profileCompleted;
};

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Add method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
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

module.exports = mongoose.model('User', userSchema);