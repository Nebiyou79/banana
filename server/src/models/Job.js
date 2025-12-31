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
  demographicRequirements: {
    sex: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any'
    },
    age: {
      min: {
        type: Number,
        min: 18,
        max: 70
      },
      max: {
        type: Number,
        min: 18,
        max: 70
      }
    }
  },  
  jobNumber: {
    type: String,
    trim: true,
  },
category: {
  type: String,
  required: true,
  enum: [
    // Technology & IT (Expanded)
    'software-developer', 'web-developer', 'mobile-app-developer', 'ai-engineer',
    'machine-learning-specialist', 'data-analyst', 'data-scientist', 'cybersecurity-analyst',
    'network-administrator', 'database-administrator', 'cloud-engineer', 'devops-engineer',
    'ui-ux-designer', 'game-developer', 'it-project-manager', 'blockchain-developer',
    'ar-vr-specialist', 'computer-hardware-technician', 'it-support-specialist', 'systems-analyst',
    
    // Engineering & Construction (Expanded)
    'civil-engineer', 'mechanical-engineer', 'electrical-engineer', 'chemical-engineer',
    'industrial-engineer', 'structural-engineer', 'architect', 'construction-manager',
    'surveyor', 'urban-planner', 'quantity-surveyor', 'environmental-engineer',
    'mining-engineer', 'geotechnical-engineer', 'water-resource-engineer', 'road-construction-technician',
    'site-supervisor', 'building-inspector', 'mason', 'carpenter',
    
    // Healthcare (Expanded)
    'medical-doctor', 'nurse', 'midwife', 'pharmacist', 'medical-laboratory-technician',
    'radiologist', 'physiotherapist', 'dentist', 'public-health-officer', 'nutritionist',
    'health-extension-worker', 'community-health-nurse', 'emergency-medical-technician',
    'optometrist', 'biomedical-engineer', 'psychologist', 'clinical-officer', 'hospital-administrator',
    'veterinarian', 'health-information-technician',
    
    // Education (Expanded)
    'kindergarten-teacher', 'primary-school-teacher', 'secondary-school-teacher', 'university-lecturer',
    'professor', 'teacher-trainer', 'curriculum-developer', 'educational-researcher',
    'school-administrator', 'librarian', 'special-needs-educator', 'language-instructor',
    'online-tutor', 'tvet-trainer', 'education-policy-analyst', 'academic-advisor',
    'exam-coordinator', 'school-counselor', 'education-technologist', 'instructional-designer',
    
    // Business & Finance (Expanded)
    'accountant', 'auditor', 'financial-analyst', 'bank-teller', 'loan-officer',
    'insurance-agent', 'tax-consultant', 'investment-advisor', 'business-consultant',
    'entrepreneur', 'procurement-officer', 'human-resource-manager', 'marketing-specialist',
    'sales-executive', 'administrative-assistant', 'customer-service-representative',
    'project-manager', 'management-consultant', 'data-entry-clerk', 'operations-manager',
    
    // Agriculture & Environment (Expanded)
    'agronomist', 'livestock-expert', 'horticulturist', 'forestry-technician',
    'soil-scientist', 'irrigation-technician', 'agricultural-economist', 'farm-manager',
    'beekeeper', 'fisheries-officer', 'veterinary-assistant', 'agricultural-extension-worker',
    'hydrologist', 'environmental-scientist', 'climate-change-specialist', 'wildlife-conservationist',
    'organic-farmer', 'agricultural-engineer', 'greenhouse-technician', 'agro-processing-specialist',
    
    // Creative & Media (Expanded)
    'graphic-designer', 'photographer', 'videographer', 'film-director', 'sound-engineer',
    'animator', 'fashion-designer', 'interior-designer', 'journalist', 'news-anchor',
    'social-media-manager', 'public-relations-officer', 'copywriter', 'content-creator',
    'digital-marketer', 'editor', 'musician', 'actor', 'painter', 'cultural-heritage-specialist',
    
    // Legal & Public Service (Expanded)
    'lawyer', 'judge', 'legal-assistant', 'prosecutor', 'court-clerk',
    'police-officer', 'customs-officer', 'immigration-officer', 'public-administrator',
    'policy-analyst', 'diplomat', 'foreign-service-officer', 'urban-governance-expert',
    'elected-official', 'civil-registrar', 'social-worker', 'human-rights-advocate',
    'mediator', 'compliance-officer', 'anti-corruption-officer',
    
    // Hospitality & Tourism (Expanded)
    'hotel-manager', 'tour-guide', 'chef', 'waiter', 'bartender',
    'housekeeper', 'event-planner', 'travel-agent', 'front-desk-officer',
    'concierge', 'restaurant-manager', 'baker', 'pastry-chef', 'resort-manager',
    'catering-manager', 'cruise-staff', 'tourism-development-officer', 'sommelier',
    'barista', 'food-beverage-supervisor',
    
    // Manufacturing & Production (Expanded)
    'factory-worker', 'production-supervisor', 'quality-control-inspector', 'machinist',
    'welder', 'textile-worker', 'garment-designer', 'plastic-production-operator',
    'metal-fabricator', 'packaging-technician', 'maintenance-technician', 'tool-maker',
    'machine-operator', 'industrial-electrician', 'production-engineer', 'leather-technician',
    'furniture-maker', 'ceramics-artist', 'printing-technician', 'toy-manufacturer',
    
    // Transportation & Logistics (Expanded)
    'driver', 'truck-operator', 'logistics-coordinator', 'transport-manager',
    'warehouse-officer', 'forklift-operator', 'ship-captain', 'flight-attendant',
    'air-traffic-controller', 'pilot', 'aviation-maintenance-technician', 'railway-engineer',
    'delivery-driver', 'fleet-manager', 'transport-planner', 'maritime-officer',
    'cargo-handler', 'port-operations-manager', 'customs-broker', 'dispatcher',
    
    // Energy & Utilities (Expanded)
    'renewable-energy-technician', 'solar-panel-installer', 'wind-turbine-technician',
    'hydropower-engineer', 'energy-auditor', 'electric-power-line-technician',
    'water-treatment-operator', 'waste-management-officer', 'environmental-engineer',
    'utility-manager', 'petroleum-engineer', 'gas-plant-operator', 'chemical-plant-technician',
    'recycling-specialist', 'nuclear-safety-technician', 'meter-reader', 'electricity-distribution-engineer',
    'boiler-operator', 'maintenance-planner', 'energy-policy-analyst',
    
    // Emerging & Specialized Roles
    'ai-ethics-specialist', 'sustainability-officer', 'e-commerce-manager',
    'digital-transformation-consultant', 'remote-work-coordinator', 'drone-operator',
    '3d-printing-technician', 'robotics-engineer', 'climate-data-analyst', 'social-impact-consultant',
    'health-data-analyst', 'cybercrime-investigator', 'it-policy-advisor', 'open-data-specialist',
    'data-governance-officer', 'innovation-manager', 'creative-director', 'startup-founder',
    'community-development-specialist', 'nonprofit-manager',
    
    // Keep existing categories for backward compatibility
    'software-development', 'web-development', 'mobile-development', 'frontend-development',
    'backend-development', 'full-stack-development', 'devops', 'cloud-computing',
    'data-science', 'machine-learning', 'artificial-intelligence', 'cybersecurity',
    'it-support', 'network-administration', 'database-administration', 'system-administration',
    
    // Other existing categories...
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
      'primary-education',
      'secondary-education', 
      'tvet-level-i',
      'tvet-level-ii',
      'tvet-level-iii',
      'tvet-level-iv',
      'tvet-level-v',
      'undergraduate-bachelors',
      'postgraduate-masters',
      'doctoral-phd',
      'lecturer',
      'professor',
      'none-required',
      
      // Backward compatibility
      'high-school',
      'diploma',
      'bachelors',
      'masters',
      'phd'
    ],
    default: 'none-required'
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