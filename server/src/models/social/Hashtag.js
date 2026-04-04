const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minLength: 2,
    maxLength: 50,
    match: [/^[a-z0-9_]+$/, 'Hashtag can only contain letters, numbers and underscores']
  },
  postCount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  trendingScore: {
    type: Number,
    default: 0,
    min: 0
  },
  relatedHashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for better performance
hashtagSchema.index({ trendingScore: -1, lastUsed: -1 });
hashtagSchema.index({ isBanned: 1, trendingScore: -1 });

// Add text search index
hashtagSchema.index({ name: 'text' });

// Add validation for trending score calculation
hashtagSchema.methods.calculateTrendingScore = function() {
  const now = new Date();
  const hoursSinceLastUse = (now - this.lastUsed) / (1000 * 60 * 60);
  const recencyFactor = Math.max(0, 1 - (hoursSinceLastUse / 168));
  
  const score = (this.postCount * 0.7) + (this.usageCount * 0.3) * recencyFactor;
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};