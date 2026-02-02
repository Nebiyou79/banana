// models/Job.js - UPDATED WITH ALL NEW FEATURES
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
    maxlength: [50000, 'Description cannot exceed 50000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // NEW: Number of candidates needed
  candidatesNeeded: {
    type: Number,
    required: [true, 'Number of candidates needed is required'],
    min: [1, 'At least 1 candidate is required'],
    default: 1
  },
  
  // UPDATED: Salary mode system (replaces old logic)
  salaryMode: {
    type: String,
    enum: ['range', 'hidden', 'negotiable', 'company-scale'],
    default: 'range'
  },
  
  salary: {
    min: {
      type: Number,
      min: 0,
      required: function() {
        return this.salaryMode === 'range';
      }
    },
    max: {
      type: Number,
      min: 0,
      required: function() {
        return this.salaryMode === 'range';
      },
      validate: {
        validator: function(value) {
          if (this.salaryMode === 'range') {
            return value >= (this.salary.min || 0);
          }
          return true;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      enum: ['ETB', 'USD', 'EUR', 'GBP'],
      default: 'ETB',
      required: function() {
        return this.salaryMode === 'range';
      }
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
  
  // UPDATED: Job categories with new comprehensive list
  category: {
    type: String,
    required: true,
    enum: [
      /* =========================
         TECHNOLOGY & ICT
      ========================== */
      'software-developer','frontend-developer','backend-developer','fullstack-developer',
      'web-developer','mobile-app-developer','android-developer','ios-developer',
      'ai-engineer','machine-learning-engineer','data-scientist','data-analyst',
      'business-intelligence-analyst','database-administrator','system-administrator',
      'network-engineer','network-administrator','cloud-engineer','devops-engineer',
      'site-reliability-engineer','cybersecurity-analyst','soc-analyst','penetration-tester',
      'it-support-officer','it-support-technician','helpdesk-officer',
      'ui-designer','ux-designer','product-designer','product-manager',
      'scrum-master','it-project-manager','qa-engineer','software-tester',
      'automation-tester','erp-consultant','sap-consultant','odoo-developer',
      'crm-administrator','digital-transformation-specialist','fintech-specialist',
      'blockchain-developer','web3-developer','it-policy-advisor',
      'ict-trainer','computer-lab-technician',

      /* NGO / UN / DEVELOPMENT */
      'project-officer','project-manager','program-officer','program-manager',
      'me-officer','me-manager','wash-officer','wash-specialist',
      'livelihood-officer','food-security-officer','nutrition-officer',
      'protection-officer','child-protection-officer','gender-officer',
      'gbv-officer','peacebuilding-officer','resilience-officer',
      'community-mobilizer','community-development-officer',
      'social-development-officer','humanitarian-officer',
      'emergency-response-officer','disaster-risk-reduction-officer',
      'refugee-program-officer','migration-officer','durable-solutions-officer',
      'case-management-officer','psychosocial-support-officer',
      'grant-officer','grant-manager','proposal-writer','resource-mobilization-officer',
      'partnership-officer','advocacy-officer','policy-officer',
      'enumerator','field-officer','monitoring-assistant',

      /* FINANCE */
      'accountant','junior-accountant','senior-accountant',
      'auditor','internal-auditor','external-auditor',
      'bank-teller','customer-service-officer-banking',
      'relationship-manager','branch-manager','operations-manager-banking',
      'credit-officer','loan-officer','credit-analyst',
      'risk-officer','compliance-officer-banking',
      'forex-officer','trade-finance-officer',
      'interest-free-banking-officer','sharia-compliance-officer',
      'treasury-officer','cashier','microfinance-officer',
      'insurance-officer','insurance-underwriter',
      'claims-officer','actuarial-analyst',
      'financial-analyst','investment-officer',
      'tax-officer','tax-consultant','revenue-officer',

      /* ENGINEERING */
      'civil-engineer','site-engineer','office-engineer',
      'resident-engineer','structural-engineer','geotechnical-engineer',
      'transport-engineer','highway-engineer',
      'water-engineer','hydraulic-engineer','sanitary-engineer',
      'electrical-engineer','power-engineer','mechanical-engineer',
      'electromechanical-engineer','industrial-engineer',
      'architect','landscape-architect','urban-planner',
      'quantity-surveyor','cost-engineer',
      'construction-manager','project-engineer',
      'site-supervisor','foreman',
      'draftsman','autocad-operator',
      'survey-engineer','land-surveyor',
      'building-inspector','material-engineer',

      /* AGRICULTURE */
      'agronomist','assistant-agronomist','crop-production-officer',
      'soil-scientist','irrigation-engineer','irrigation-technician',
      'horticulturist','plant-protection-officer',
      'livestock-production-officer','animal-health-officer',
      'veterinarian','assistant-veterinarian',
      'fisheries-officer','aquaculture-specialist',
      'beekeeper','apiculture-officer',
      'forestry-officer','natural-resource-management-officer',
      'environmental-officer','environmental-scientist',
      'climate-change-officer','climate-adaptation-specialist',
      'agricultural-economist','rural-development-officer',
      'extension-agent','agricultural-extension-worker',
      'seed-production-officer','fertilizer-marketing-officer',
      'agro-processing-officer','cooperative-officer',

      /* HEALTH */
      'general-practitioner','medical-doctor','specialist-physician',
      'surgeon','pediatrician','gynecologist',
      'nurse','staff-nurse','clinical-nurse',
      'midwife','anesthetist','pharmacist','druggist',
      'medical-laboratory-technologist','lab-technician',
      'radiographer','radiologist',
      'public-health-officer','epidemiologist',
      'health-extension-worker','health-education-officer',
      'hospital-administrator','health-information-officer',
      'biomedical-engineer','biomedical-technician',
      'physiotherapist','occupational-therapist',
      'nutritionist','dietitian',
      'mental-health-officer','psychologist',
      'psychiatric-nurse','emergency-medical-technician',

      /* EDUCATION */
      'kindergarten-teacher','primary-teacher','secondary-teacher',
      'high-school-teacher','university-lecturer','assistant-lecturer',
      'professor','academic-researcher',
      'tvet-trainer','technical-instructor',
      'language-teacher','english-instructor',
      'math-teacher','physics-teacher','chemistry-teacher',
      'school-director','school-principal',
      'academic-coordinator','education-officer',
      'curriculum-developer','education-planner',
      'school-supervisor','exam-officer',
      'guidance-counselor','special-needs-teacher',
      'librarian','e-learning-specialist',

      /* ADMIN */
      'administrative-assistant','office-assistant',
      'executive-secretary','secretary',
      'hr-officer','hr-manager','recruitment-officer',
      'training-officer','performance-management-officer',
      'personnel-officer','organizational-development-officer',
      'general-manager','operations-manager',
      'business-development-officer','strategy-officer',
      'customer-service-representative','call-center-agent',
      'sales-representative','sales-manager',
      'marketing-officer','brand-manager',
      'procurement-officer','procurement-manager',
      'supply-chain-officer','storekeeper',
      'inventory-controller','logistics-officer',

      /* DRIVERS */
      'driver','personal-driver','truck-driver',
      'bus-driver','heavy-truck-driver',
      'forklift-operator','machine-operator',
      'auto-mechanic','diesel-mechanic',
      'vehicle-electrician','garage-supervisor',
      'fleet-manager','transport-coordinator',
      'dispatch-officer','customs-clearing-officer',
      'port-officer','cargo-handler',
      'aviation-technician','aircraft-mechanic',

      /* HOSPITALITY */
      'hotel-manager','assistant-hotel-manager',
      'front-desk-officer','receptionist',
      'waiter','waitress','chef','assistant-chef',
      'cook','baker','pastry-chef',
      'housekeeping-supervisor','housekeeper',
      'barista','bartender',
      'tour-guide','travel-consultant',
      'event-coordinator','catering-supervisor',
      'restaurant-manager',

      /* SECURITY */
      'security-guard','chief-security-officer',
      'safety-officer','fire-safety-officer',
      'occupational-health-officer',
      'cleaner','janitor',
      'messenger','office-runner',
      'groundskeeper','maintenance-worker',
      'caretaker','store-assistant',
      'night-guard','loss-prevention-officer',

      /* GRADUATE */
      'graduate-trainee','intern','internship',
      'apprentice','volunteer','national-service',

      'other'
    ]
  },
  
  // EXISTING: Application toggle (already exists but we'll ensure it's properly implemented)
  isApplyEnabled: {
    type: Boolean,
    default: true
  },
  
  // Rest of the existing schema remains the same...
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
  
  // Keep existing demographic requirements
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
      validator: function (value) {
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
    required: function () {
      return this.jobType === 'company';
    }
  },

  // Organization fields
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function () {
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

  // Duration for opportunities
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes remain the same...
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
jobSchema.index({ isApplyEnabled: 1, status: 1 });
jobSchema.index({ salaryMode: 1 });
jobSchema.index({ candidatesNeeded: 1 });
// Compound indexes for common queries
jobSchema.index({ jobType: 1, status: 1, category: 1 });
jobSchema.index({ jobType: 1, status: 1, 'location.region': 1 });
jobSchema.index({ jobType: 1, status: 1, opportunityType: 1 });

// VIRTUAL FIELDS

// Virtual for checking if job is active
jobSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' &&
    (!this.applicationDeadline || this.applicationDeadline > now);
});

// Virtual for checking if job is expired
jobSchema.virtual('isExpired').get(function () {
  return this.applicationDeadline && this.applicationDeadline < new Date();
});

// Virtual for getting the owner (company or organization)
jobSchema.virtual('owner').get(function () {
  return this.jobType === 'company' ? this.company : this.organization;
});

// Virtual for getting owner type
jobSchema.virtual('ownerType').get(function () {
  return this.jobType === 'company' ? 'Company' : 'Organization';
});

// Virtual for display title based on job type
jobSchema.virtual('displayType').get(function () {
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

// NEW: Virtual for computed salary display based on salaryMode
jobSchema.virtual('salaryDisplay').get(function () {
  switch (this.salaryMode) {
    case 'range':
      if (this.salary?.min && this.salary?.max) {
        const formattedMin = this.salary.min.toLocaleString();
        const formattedMax = this.salary.max.toLocaleString();
        return `${this.salary.currency} ${formattedMin} - ${formattedMax} ${this.salary.period === 'monthly' ? 'per month' : this.salary.period}`;
      } else if (this.salary?.min) {
        const formattedMin = this.salary.min.toLocaleString();
        return `${this.salary.currency} ${formattedMin}+ ${this.salary.period === 'monthly' ? 'per month' : this.salary.period}`;
      } else if (this.salary?.max) {
        const formattedMax = this.salary.max.toLocaleString();
        return `${this.salary.currency} Up to ${formattedMax} ${this.salary.period === 'monthly' ? 'per month' : this.salary.period}`;
      }
      return 'Salary not specified';
    
    case 'hidden':
      return 'Salary hidden';
    
    case 'negotiable':
      return 'Negotiable';
    
    case 'company-scale':
      return 'As per company scale';
    
    default:
      return 'Salary not specified';
  }
});

// NEW: Virtual for checking if salary is visible
jobSchema.virtual('isSalaryVisible').get(function () {
  return this.salaryMode === 'range' && this.salary?.isPublic !== false;
});

// Virtual for checking application status (updated with isApplyEnabled)
jobSchema.virtual('canAcceptApplications').get(function () {
  return this.isApplyEnabled !== false &&
    this.status === 'active' &&
    (!this.applicationDeadline || this.applicationDeadline > new Date());
});

// NEW: Virtual for application status display
jobSchema.virtual('applicationStatus').get(function () {
  if (!this.isApplyEnabled) {
    return { 
      canApply: false, 
      message: 'Applications are currently closed for this position',
      reason: 'disabled'
    };
  }
  
  if (this.status !== 'active') {
    return { 
      canApply: false, 
      message: 'This position is not currently active',
      reason: 'inactive'
    };
  }
  
  if (this.isExpired) {
    return { 
      canApply: false, 
      message: 'Application deadline has passed',
      reason: 'expired'
    };
  }
  
  return { 
    canApply: true, 
    message: 'Accepting applications',
    reason: 'open'
  };
});

// PRE-SAVE MIDDLEWARE

jobSchema.pre('save', function (next) {
  // Validate candidatesNeeded
  if (this.candidatesNeeded < 1) {
    return next(new Error('At least 1 candidate is required'));
  }

  // Validate salary based on salaryMode
  if (this.salaryMode === 'range') {
    if (!this.salary?.currency) {
      return next(new Error('Currency is required when salary mode is "range"'));
    }
    
    if (this.salary?.min && this.salary?.max && this.salary.min > this.salary.max) {
      return next(new Error('Minimum salary cannot be greater than maximum salary'));
    }
  } else {
    // For non-range modes, clear ALL salary range fields
    if (this.salary) {
      this.salary.min = undefined;
      this.salary.max = undefined;
      this.salary.currency = undefined;
      this.salary.period = undefined; // Also clear period
      this.salary.isNegotiable = undefined; // Clear negotiable flag
    }
  }

  next();
});

// Pre-find middleware to auto-populate based on jobType
jobSchema.pre(/^find/, function (next) {
  if (this.options.populateOwner !== false) {
    const populatePath = this._conditions.jobType === 'organization' ? 'organization' : 'company';
    this.populate(populatePath, 'name logoUrl verified industry organizationType mission');
  }
  next();
});

// STATIC METHODS

// Static method to get jobs by owner (company or organization)
jobSchema.statics.findByOwner = function (ownerId, jobType, options = {}) {
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
jobSchema.statics.getActiveOpportunities = function (filters = {}) {
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

// INSTANCE METHODS

// Instance method to check if user can apply
jobSchema.methods.canApply = function () {
  return this.isApplyEnabled && this.isActive && !this.isExpired;
};

// Instance method to increment application count
jobSchema.methods.incrementApplicationCount = function () {
  this.applicationCount += 1;
  return this.save();
};

// Instance method to increment view count
jobSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

// NEW: Instance method to format salary for display
jobSchema.methods.getFormattedSalary = function () {
  return {
    display: this.salaryDisplay,
    mode: this.salaryMode,
    details: this.salaryMode === 'range' ? {
      min: this.salary?.min,
      max: this.salary?.max,
      currency: this.salary?.currency,
      period: this.salary?.period,
      isNegotiable: this.salary?.isNegotiable,
      isPublic: this.salary?.isPublic
    } : null,
    isVisible: this.isSalaryVisible
  };
};

// NEW: Instance method to get application info
jobSchema.methods.getApplicationInfo = function () {
  return {
    isApplyEnabled: this.isApplyEnabled,
    canApply: this.canApply(),
    candidatesNeeded: this.candidatesNeeded,
    candidatesRemaining: Math.max(0, this.candidatesNeeded - this.applicationCount),
    applicationCount: this.applicationCount,
    status: this.applicationStatus
  };
};

module.exports = mongoose.model('Job', jobSchema);