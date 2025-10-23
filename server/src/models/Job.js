// models/Job.js - COMPLETE WITH ORGANIZATION SUPPORT
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary', 'volunteer', 'remote', 'hybrid'],
    default: 'full-time'
  },
  location: {
    region: {
      type: String,
      enum: [
        'addis-ababa', 'afar', 'amhara', 'benishangul-gumuz', 'dire-dawa',
        'gambela', 'harari', 'oromia', 'sidama', 'snnpr', 'somali', 
        'south-west-ethiopia', 'tigray', 'international'
      ]
    },
    city: {
      type: String,
      trim: true
    },
    subCity: {
      type: String,
      trim: true
    },
    woreda: {
      type: String,
      trim: true
    },
    specificLocation: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Ethiopia'
    }
  },
  salary: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      enum: ['ETB', 'USD', 'EUR', 'GBP'],
      default: 'ETB'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    isNegotiable: {
      type: Boolean,
      default: false
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Technology & IT
      'software-development', 'web-development', 'mobile-development', 'frontend-development',
      'backend-development', 'full-stack-development', 'devops', 'cloud-computing',
      'data-science', 'machine-learning', 'artificial-intelligence', 'cybersecurity',
      'it-support', 'network-administration', 'database-administration', 'system-administration',
      
      // Business & Management
      'accounting-finance', 'banking-insurance', 'management', 'project-management',
      'product-management', 'business-development', 'strategy-consulting', 'operations',
      
      // Sales & Marketing
      'sales', 'marketing', 'digital-marketing', 'social-media-marketing', 'content-marketing',
      'seo-sem', 'brand-management', 'public-relations', 'market-research',
      
      // Creative & Design
      'graphic-design', 'ui-ux-design', 'web-design', 'motion-graphics', 'video-production',
      'photography', 'content-writing', 'copywriting', 'translation',
      
      // Engineering
      'civil-engineering', 'electrical-engineering', 'mechanical-engineering', 'chemical-engineering',
      'industrial-engineering', 'automotive-engineering', 'aerospace-engineering',
      
      // Healthcare
      'medical-doctor', 'nursing', 'pharmacy', 'dentistry', 'medical-laboratory',
      'public-health', 'healthcare-administration', 'physiotherapy',
      
      // Education
      'teaching', 'lecturing', 'academic-research', 'educational-administration', 'tutoring',
      'curriculum-development', 'special-education',
      
      // Other Professional
      'human-resources', 'recruitment', 'legal', 'logistics', 'supply-chain',
      'procurement', 'quality-control', 'hospitality-tourism', 'customer-service',
      'administrative', 'secretarial', 'receptionist',
      
      // Trades & Services
      'construction', 'architecture', 'interior-design', 'real-estate', 'property-management',
      'agriculture', 'agribusiness', 'farming', 'veterinary', 'environmental',
      
      // Creative Arts & Media
      'journalism', 'broadcasting', 'publishing', 'music', 'performing-arts', 'fashion',
      
      // NGO & Development (Important for organizations)
      'ngo-development', 'social-work', 'community-development', 'humanitarian-aid', 
      'international-development', 'public-policy', 'advocacy', 'grant-writing',
      'fundraising', 'volunteer-coordination', 'program-management',
      
      // Religious & Faith-based
      'religious', 'faith-based', 'pastoral', 'theological',
      
      // Other
      'security', 'driving-delivery', 'cleaning-maintenance', 'beauty-wellness', 'sports-fitness',
      'other'
    ]
  },
  experienceLevel: {
    type: String,
    enum: ['fresh-graduate', 'entry-level', 'mid-level', 'senior-level', 'managerial', 'director', 'executive'],
    default: 'mid-level'
  },
  educationLevel: {
    type: String,
    enum: [
      'high-school', 'diploma', 'bachelors', 'masters', 'phd', 'none-required'
    ]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'archived'],
    default: 'draft'
  },
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Application deadline must be in the future'
    }
  },
  remote: {
    type: String,
    enum: ['remote', 'hybrid', 'on-site'],
    default: 'on-site'
  },
  
  // Company fields
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.jobType === 'company';
    }
  },
  
  // Organization fields
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.jobType === 'organization';
    }
  },
  
  jobType: {
    type: String,
    enum: ['company', 'organization'],
    default: 'company',
    required: true
  },
  
  // Opportunity-specific fields for organizations
  opportunityType: {
    type: String,
    enum: ['job', 'volunteer', 'internship', 'fellowship', 'training', 'grant', 'other'],
    default: 'job'
  },
  
  // Duration for opportunities (useful for volunteer positions, internships, etc.)
  duration: {
    value: {
      type: Number,
      min: 1
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years']
    },
    isOngoing: {
      type: Boolean,
      default: false
    }
  },
  
  // Specific fields for volunteer opportunities
  volunteerInfo: {
    hoursPerWeek: {
      type: Number,
      min: 1,
      max: 40
    },
    commitmentLevel: {
      type: String,
      enum: ['casual', 'regular', 'intensive']
    },
    providesAccommodation: {
      type: Boolean,
      default: false
    },
    providesStipend: {
      type: Boolean,
      default: false
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  saveCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  urgent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
jobSchema.index({ company: 1, createdAt: -1 });
jobSchema.index({ organization: 1, createdAt: -1 });
jobSchema.index({ jobType: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ 'location.region': 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ featured: -1, createdAt: -1 });
jobSchema.index({ urgent: -1, createdAt: -1 });
jobSchema.index({ opportunityType: 1 });
jobSchema.index({ applicationDeadline: 1 });

// Compound indexes for common queries
jobSchema.index({ jobType: 1, status: 1, category: 1 });
jobSchema.index({ jobType: 1, status: 1, 'location.region': 1 });
jobSchema.index({ jobType: 1, status: 1, opportunityType: 1 });

// Virtual for checking if job is active
jobSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
    (!this.applicationDeadline || this.applicationDeadline > now);
});

// Virtual for checking if job is expired
jobSchema.virtual('isExpired').get(function() {
  return this.applicationDeadline && this.applicationDeadline < new Date();
});

// Virtual for getting the owner (company or organization)
jobSchema.virtual('owner').get(function() {
  return this.jobType === 'company' ? this.company : this.organization;
});

// Virtual for getting owner type
jobSchema.virtual('ownerType').get(function() {
  return this.jobType === 'company' ? 'Company' : 'Organization';
});

// Virtual for display title based on job type
jobSchema.virtual('displayType').get(function() {
  if (this.jobType === 'organization') {
    const opportunityTypes = {
      'job': 'Job Opportunity',
      'volunteer': 'Volunteer Position',
      'internship': 'Internship',
      'fellowship': 'Fellowship',
      'training': 'Training Program',
      'grant': 'Grant Opportunity',
      'other': 'Opportunity'
    };
    return opportunityTypes[this.opportunityType] || 'Opportunity';
  }
  return 'Job';
});

// Pre-save middleware to validate that either company or organization is set
jobSchema.pre('save', function(next) {
  if (this.jobType === 'company' && !this.company) {
    return next(new Error('Company is required for company jobs'));
  }
  
  if (this.jobType === 'organization' && !this.organization) {
    return next(new Error('Organization is required for organization opportunities'));
  }
  
  // Set default values for organization opportunities
  if (this.jobType === 'organization') {
    if (this.opportunityType === 'volunteer' && !this.salary.isPublic) {
      this.salary.isPublic = false; // Volunteer positions typically don't show salary
    }
  }
  
  next();
});

// Pre-find middleware to auto-populate based on jobType
jobSchema.pre(/^find/, function(next) {
  if (this.options.populateOwner !== false) {
    const populatePath = this._conditions.jobType === 'organization' ? 'organization' : 'company';
    this.populate(populatePath, 'name logoUrl verified industry organizationType mission');
  }
  next();
});

// Static method to get jobs by owner (company or organization)
jobSchema.statics.findByOwner = function(ownerId, jobType, options = {}) {
  const query = { 
    [jobType === 'organization' ? 'organization' : 'company']: ownerId 
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate(jobType === 'organization' ? 'organization' : 'company', 'name logoUrl verified industry organizationType')
    .sort({ createdAt: -1 });
};

// Static method to get active opportunities (for organizations)
jobSchema.statics.getActiveOpportunities = function(filters = {}) {
  const query = { 
    jobType: 'organization',
    status: 'active'
  };
  
  // Apply filters
  if (filters.opportunityType) {
    query.opportunityType = filters.opportunityType;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.region) {
    query['location.region'] = filters.region;
  }
  
  return this.find(query)
    .populate('organization', 'name logoUrl verified organizationType mission')
    .sort({ featured: -1, urgent: -1, createdAt: -1 });
};

// Instance method to check if user can apply
jobSchema.methods.canApply = function() {
  return this.isActive && !this.isExpired;
};

// Instance method to increment application count
jobSchema.methods.incrementApplicationCount = function() {
  this.applicationCount += 1;
  return this.save();
};

// Instance method to increment view count
jobSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('Job', jobSchema);