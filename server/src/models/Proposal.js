// backend/models/Proposal.js
const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  tenderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tender', 
    required: true 
  },
  freelancerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bidAmount: { 
    type: Number, 
    required: true,
    min: [0, 'Bid amount cannot be negative']
  },
  proposalText: { 
    type: String, 
    required: true,
    minlength: [50, 'Proposal text must be at least 50 characters'],
    maxlength: [5000, 'Proposal text cannot exceed 5000 characters']
  },
  estimatedTimeline: {
    type: String,
    enum: ['1-2 weeks', '2-4 weeks', '1-2 months', '2-3 months', '3+ months'],
    required: true
  },
  attachments: [{ 
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+\..+$/.test(url);
      },
      message: 'Invalid attachment URL'
    }
  }],
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'],
    default: 'submitted'
  },
  companyNotes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual population
proposalSchema.virtual('freelancer', {
  ref: 'User',
  localField: 'freelancerId',
  foreignField: '_id',
  justOne: true
});

proposalSchema.virtual('tender', {
  ref: 'Tender',
  localField: 'tenderId',
  foreignField: '_id',
  justOne: true
});

// Index for better performance
proposalSchema.index({ tenderId: 1, freelancerId: 1 }, { unique: true });
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdAt: -1 });

// Pre-save middleware
proposalSchema.pre('save', function (next) {
  if (this.isModified('bidAmount') && this.bidAmount < 0) {
    next(new Error('Bid amount cannot be negative'));
  }
  next();
});

module.exports = mongoose.model('Proposal', proposalSchema);