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
        if (!v) return true;
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
  },
  
  // NEW: Social & Engagement Fields
  headline: {
    type: String,
    trim: true,
    maxlength: 200
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
  
  // NEW: Social Stats for Company
  socialStats: {
    followerCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },
  
  // NEW: Company Details
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  foundedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  companyType: {
    type: String,
    enum: ['startup', 'sme', 'enterprise', 'agency', 'other'],
    default: 'sme'
  },
  
  // NEW: Social Links
  socialLinks: {
    linkedin: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || /^(https?:\/\/)?(www\.)?linkedin\.com\/company\/[a-zA-Z0-9-]+(\/)?$/i.test(value);
        },
        message: 'Invalid LinkedIn Company URL'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || /^(https?:\/\/)?(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+(\/)?$/i.test(value);
        },
        message: 'Invalid Twitter/X URL'
      }
    },
    facebook: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+(\/)?$/i.test(value);
        },
        message: 'Invalid Facebook URL'
      }
    },
    instagram: {
      type: String,
      validate: {
        validator: function(value) {
          return !value || /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]+(\/)?$/i.test(value);
        },
        message: 'Invalid Instagram URL'
      }
    }
  },
  
  // NEW: Privacy & Settings
  settings: {
    allowMessages: { type: Boolean, default: true },
    showContactInfo: { type: Boolean, default: true },
    allowFollows: { type: Boolean, default: true },
    profileVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    }
  },
  
  // NEW: Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],
  
  // NEW: Featured status
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date
  
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

// NEW: Virtual for job count
companySchema.virtual('jobCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// NEW: Virtual for active job count
companySchema.virtual('activeJobCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { status: 'active' }
});

// NEW: Method to update social stats
companySchema.methods.updateSocialStats = async function() {
  const Follow = mongoose.model('Follow');
  const Post = mongoose.model('Post');
  
  const followerCount = await Follow.countDocuments({ followingId: this._id, followingModel: 'Company' });
  const postCount = await Post.countDocuments({ companyId: this._id });
  
  this.socialStats.followerCount = followerCount;
  this.socialStats.postCount = postCount;
  
  return this.save();
};

// Ensure virtual fields are serialized
companySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);