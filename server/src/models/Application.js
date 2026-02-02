// models/Application.js - UPDATED FOR LOCAL FILE UPLOAD
const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    maxlength: 200
  }
}, {
  _id: true,
  id: true
});

const referenceSchema = new mongoose.Schema({
  // Option 1: Upload PDF document
  document: {
    type: attachmentSchema,
    required: false
  },

  // Option 2: Fill form
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Invalid email address'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  relationship: {
    type: String,
    trim: true,
    maxlength: 100
  },
  allowsContact: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 500
  },

  // Track which option was used
  providedAsDocument: {
    type: Boolean,
    default: false
  }
}, {
  _id: true,
  id: true
});

const workExperienceSchema = new mongoose.Schema({
  // Option 1: Upload PDF document
  document: {
    type: attachmentSchema,
    required: false
  },

  // Option 2: Fill form
  company: {
    type: String,
    trim: true,
    maxlength: 200
  },
  position: {
    type: String,
    trim: true,
    maxlength: 100
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !this.current || !value || value > this.startDate;
      },
      message: 'End date must be after start date for completed experience'
    }
  },
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
    trim: true
  }],
  supervisor: {
    name: String,
    position: String,
    contact: String
  },

  // Track which option was used
  providedAsDocument: {
    type: Boolean,
    default: false
  }
}, {
  _id: true,
  id: true
});

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },

  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // User information (attached from user profile)
  userInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    location: { type: String },
    avatar: { type: String },
    bio: { type: String },
    website: { type: String },
    socialLinks: {
      linkedin: { type: String },
      github: { type: String },
      twitter: { type: String }
    }
  },

  // Candidate's selected CVs
  selectedCVs: [{
    cvId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    filename: String,
    originalName: String,
    url: String,
    downloadUrl: String,
    size: Number,
    mimetype: String,
    uploadedAt: Date
  }],

  // Professional cover letter
  coverLetter: {
    type: String,
    required: true,
    maxlength: 5000
  },

  // Skills the candidate has
  skills: [{
    type: String,
    trim: true,
    required: true
  }],

  // References (either document or form)
  references: [referenceSchema],

  // Work experience (either document or form)
  workExperience: [workExperienceSchema],

  // Contact information
  contactInfo: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    telegram: { type: String, trim: true },
    location: { type: String, trim: true }
  },

  // Additional attachments
  attachments: {
    referenceDocuments: [attachmentSchema],
    experienceDocuments: [attachmentSchema],
    portfolioFiles: [attachmentSchema],
    otherDocuments: [attachmentSchema]
  },

  // Application status and tracking
  status: {
    type: String,
    enum: [
      'applied',
      'under-review',
      'shortlisted',
      'interview-scheduled',
      'interviewed',
      'offer-pending',
      'offer-made',
      'offer-accepted',
      'offer-rejected',
      'on-hold',
      'rejected',
      'withdrawn'
    ],
    default: 'applied'
  },

  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    message: String,
    interviewDetails: {
      date: Date,
      location: String,
      type: {
        type: String,
        enum: ['phone', 'video', 'in-person', 'technical']
      },
      interviewer: String,
      notes: String
    }
  }],

  // Company response options
  companyResponse: {
    status: {
      type: String,
      enum: ['active-consideration', 'on-hold', 'rejected', 'selected-for-interview', null],
      default: null
    },
    message: String,
    interviewLocation: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }],

  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ status: 1, updatedAt: -1 });
applicationSchema.index({ 'statusHistory.changedAt': -1 });
applicationSchema.index({ 'companyResponse.status': 1 });

// Virtual for application age
applicationSchema.virtual('daysSinceApplied').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Instance method to get all attachments
applicationSchema.methods.getAllAttachments = function () {
  const attachments = [
    ...this.attachments.referenceDocuments,
    ...this.attachments.experienceDocuments,
    ...this.attachments.portfolioFiles,
    ...this.attachments.otherDocuments
  ];

  // Add documents from references
  this.references.forEach(ref => {
    if (ref.document) {
      attachments.push(ref.document);
    }
  });

  // Add documents from work experience
  this.workExperience.forEach(exp => {
    if (exp.document) {
      attachments.push(exp.document);
    }
  });

  return attachments;
};

// Instance method to cleanup files if application is deleted
applicationSchema.methods.cleanupFiles = async function () {
  const fs = require('fs').promises;
  const allAttachments = this.getAllAttachments();

  for (const attachment of allAttachments) {
    try {
      await fs.access(attachment.path);
      await fs.unlink(attachment.path);
    } catch (error) {
      console.warn(`Could not delete file ${attachment.filename}:`, error.message);
    }
  }
};

// Static method to get applications by job with pagination
applicationSchema.statics.getByJob = function (jobId, page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  const query = { job: jobId, ...filters };

  return this.find(query)
    .populate('candidate', 'name email avatar skills education experience certifications cvs bio location phone socialLinks website')
    .populate('statusHistory.changedBy', 'name email')
    .populate('companyResponse.respondedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get candidate applications
applicationSchema.statics.getByCandidate = function (candidateId, page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  const query = { candidate: candidateId, ...filters };

  return this.find(query)
    .populate('job')
    .populate({
      path: 'job',
      populate: [
        { path: 'company', select: 'name logoUrl verified industry' },
        { path: 'organization', select: 'name logoUrl verified industry organizationType' }
      ]
    })
    .populate('companyResponse.respondedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Instance method to update status with history
applicationSchema.methods.updateStatus = function (newStatus, changedBy, message = '', interviewDetails = null) {
  this.statusHistory.push({
    status: newStatus,
    changedBy: changedBy,
    message: message,
    interviewDetails: interviewDetails
  });

  this.status = newStatus;
  return this.save();
};

// Instance method to add company response
applicationSchema.methods.addCompanyResponse = function (responseStatus, respondedBy, message = '', interviewLocation = null) {
  this.companyResponse = {
    status: responseStatus,
    message: message,
    interviewLocation: interviewLocation,
    respondedAt: new Date(),
    respondedBy: respondedBy
  };

  return this.save();
};

// Pre-remove middleware to cleanup files
applicationSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  await this.cleanupFiles();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);