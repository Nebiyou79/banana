const mongoose = require('mongoose');

const AdminActivityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetModel: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

module.exports = mongoose.model('AdminActivityLog', AdminActivityLogSchema);