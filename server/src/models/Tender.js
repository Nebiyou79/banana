const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  proposalText: {
    type: String,
    required: true,
    maxlength: 5000
  },
  deliveryTime: {
    type: Number, // in days
    required: true,
    min: 1
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'accepted', 'rejected'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  companyNotes: String
}, { timestamps: true });

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tender title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Tender description is required'],
    maxlength: [10000, 'Description cannot exceed 10000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      // Construction & Engineering
      'construction', 'civil_engineering', 'architecture', 'electrical_works', 'mechanical_works',
      'plumbing', 'road_construction', 'building_construction', 'renovation',
      
      // IT & Technology
      'software_development', 'web_development', 'mobile_development', 'it_consulting',
      'network_security', 'data_science', 'ai_ml', 'cloud_computing', 'cybersecurity',
      
      // Goods & Supplies
      'office_supplies', 'medical_supplies', 'educational_materials', 'agricultural_supplies',
      'construction_materials', 'electrical_equipment', 'furniture', 'vehicles',
      
      // Services
      'consulting', 'cleaning_services', 'security_services', 'transport_services',
      'catering_services', 'maintenance_services', 'training_services', 'marketing_services',
      
      // Other Categories
      'healthcare', 'education', 'agriculture', 'manufacturing', 'mining',
      'telecommunications', 'energy', 'water_sanitation', 'environmental_services',
      'research_development', 'other'
    ]
  },
  skillsRequired: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  budget: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'ETB',
      enum: ['USD', 'EUR', 'GBP', 'ETB']
    },
    isNegotiable: {
      type: Boolean,
      default: false
    }
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'invite_only'],
    default: 'public'
  },
  invitedFreelancers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  proposals: [proposalSchema],
  deadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  duration: {
    type: Number, // in days
    default: 30,
    min: 1,
    max: 365
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  requirements: {
    experienceLevel: {
      type: String,
      enum: ['entry', 'intermediate', 'expert'],
      default: 'intermediate'
    },
    location: {
      type: String,
      enum: ['anywhere', 'specific_country', 'specific_city'],
      default: 'anywhere'
    },
    specificLocation: String,
    languageRequirements: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['basic', 'conversational', 'fluent', 'native']
      }
    }]
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    proposalCount: {
      type: Number,
      default: 0
    },
    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
tenderSchema.index({ company: 1, status: 1 });
tenderSchema.index({ category: 1, status: 1 });
tenderSchema.index({ deadline: 1 });
tenderSchema.index({ 'budget.min': 1, 'budget.max': 1 });
tenderSchema.index({ skillsRequired: 1 });
tenderSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if tender is open
tenderSchema.virtual('isOpen').get(function() {
  return this.status === 'published' && this.deadline > new Date();
});

// Virtual for days remaining
tenderSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const diffTime = this.deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods
tenderSchema.methods.canSubmitProposal = function(freelancerId) {
  if (this.status !== 'published') return false;
  if (this.deadline <= new Date()) return false;
  if (this.visibility === 'invite_only' && 
      !this.invitedFreelancers.includes(freelancerId)) return false;
  
  return !this.proposals.some(proposal => 
    proposal.freelancer.toString() === freelancerId.toString()
  );
};

tenderSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

// Static methods
tenderSchema.statics.getActiveTenders = function() {
  return this.find({
    status: 'published',
    deadline: { $gt: new Date() }
  }).populate('company', 'name logo industry verified');
};

tenderSchema.statics.getCompanyTenders = function(companyId) {
  return this.find({ company: companyId })
    .populate('company', 'name logo industry verified')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Tender', tenderSchema);