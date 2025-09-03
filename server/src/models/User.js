const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  field: String,
  startDate: Date,
  endDate: Date,
  current: Boolean,
  description: String
});

const experienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  startDate: Date,
  endDate: Date,
  current: Boolean,
  description: String,
  skills: [String]
});

// Portfolio item schema
const portfolioItemSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  mediaUrl: { 
    type: String, 
    trim: true 
  }
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['candidate', 'freelancer', 'company', 'organization', 'admin'], default: 'candidate' },
  verificationStatus: { type: String, enum: ['none', 'partial', 'full'], default: 'none' },
  profileCompleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  skills: [{
    type: String,
    trim: true
  }],
  education: [educationSchema],
  experience: [experienceSchema],
  cvUrl: {
    type: String,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  // Updated portfolio field with proper schema
  portfolio: [portfolioItemSchema],
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  location: {
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
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String
  },
  hasCompanyProfile: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
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

// Remove passwordHash from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

userSchema.methods.isProfileComplete = function() {
  if (this.role === 'company') {
    return this.hasCompanyProfile && this.profileCompleted;
  }
  return this.profileCompleted;
};

module.exports = mongoose.model('User', userSchema);