// models/Tender.js - Enhanced version
const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tender must have a title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Tender must have a description'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    enum: ['construction', 'IT', 'consulting', 'supplies', 'design', 'writing', 'marketing', 'other'],
    default: 'other'
  },
  budget: {
    type: Number,
    required: true,
    min: [0, 'Budget cannot be negative']
  },
  deadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  location: {
    type: String,
    default: 'Remote'
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
    enum: ['draft', 'open', 'closed', 'awarded', 'completed'],
    default: 'draft'
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  // For candidate bookmarking
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For company to duplicate tenders
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    default: null
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  proposalCount: {
    type: Number,
    default: 0
  },
  // Moderation
  moderated: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if tender is active
tenderSchema.virtual('isActive').get(function() {
  return this.status === 'open' && this.deadline > new Date();
});

// Indexes
tenderSchema.index({ company: 1 });
tenderSchema.index({ createdBy: 1 });
tenderSchema.index({ status: 1 });
tenderSchema.index({ category: 1 });
tenderSchema.index({ deadline: 1 });
tenderSchema.index({ budget: 1 });
tenderSchema.index({ savedBy: 1 });

// Pre-save middleware to update status based on deadline
tenderSchema.pre('save', function(next) {
  if (this.isModified('deadline') || this.isModified('status')) {
    if (this.status === 'open' && this.deadline <= new Date()) {
      this.status = 'closed';
    }
  }
  next();
});

module.exports = mongoose.model('Tender', tenderSchema);