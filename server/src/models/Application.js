// backend/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, default: '' },
  resumeSnapshot: { type: String, default: '' }, // optional: text or URL
  status: {
    type: String,
    enum: ['applied', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected'],
    default: 'applied'
  },
  notes: { type: String, default: '' }, // internal company notes
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

applicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models && mongoose.models.Application
  ? mongoose.models.Application
  : mongoose.model('Application', applicationSchema);
