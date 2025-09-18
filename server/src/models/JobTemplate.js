const mongoose = require('mongoose');

const JobTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  salaryRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  location: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('JobTemplate', JobTemplateSchema);