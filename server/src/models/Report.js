const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  filters: { type: mongoose.Schema.Types.Mixed },
  data: { type: mongoose.Schema.Types.Mixed },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);