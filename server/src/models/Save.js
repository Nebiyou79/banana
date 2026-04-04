// models/Save.js (NEW FILE - if needed)
const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    enum: ['Post', 'Job', 'Article'],
    default: 'Post',
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicates
saveSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

module.exports = mongoose.model('Save', saveSchema);