// models/Job.js - UPDATED CATEGORIES
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
    required: [true, 'Job title is required'],
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
      
      // Other
      'ngo-development', 'social-work', 'community-development', 'religious', 'security',
      'driving-delivery', 'cleaning-maintenance', 'beauty-wellness', 'sports-fitness',
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

// Indexes
jobSchema.index({ company: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ 'location.region': 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ featured: -1, createdAt: -1 });

// Virtual for checking if job is active
jobSchema.virtual('isActive').get(function() {
  return this.status === 'active' && 
    (!this.applicationDeadline || this.applicationDeadline > new Date());
});

module.exports = mongoose.model('Job', jobSchema);