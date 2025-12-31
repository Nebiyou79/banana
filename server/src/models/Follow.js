// models/Follow.js
const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  targetType: {
    type: String,
    enum: ['User', 'Company', 'Organization'],
    required: true
  },
  
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'accepted'
  },
  
  notifications: {
    type: Boolean,
    default: true
  },
  
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  acceptedAt: Date,
  lastInteracted: Date,
  
  // Additional fields for better tracking
  followSource: {
    type: String,
    enum: ['search', 'suggestion', 'connection', 'manual'],
    default: 'manual'
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
followSchema.index({ follower: 1, targetType: 1, targetId: 1 }, { 
  unique: true,
  partialFilterExpression: { status: { $in: ['pending', 'accepted'] } }
});

followSchema.index({ targetType: 1, targetId: 1, status: 1 });
followSchema.index({ status: 1, requestedAt: -1 });
followSchema.index({ follower: 1, status: 1, createdAt: -1 });

// Virtuals
followSchema.virtual('isActive').get(function() {
  return this.status === 'accepted';
});

followSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Pre-save middleware
followSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'accepted' && !this.acceptedAt) {
    this.acceptedAt = new Date();
  }
  
  if (this.isModified('status') && ['accepted', 'rejected'].includes(this.status)) {
    this.lastInteracted = new Date();
  }
  next();
});

// Static methods
followSchema.statics.getFollowers = async function(targetType, targetId, options = {}) {
  const { 
    page = 1, 
    limit = 50, 
    status = 'accepted',
    populateFields = 'name avatar headline role verificationStatus'
  } = options;
  
  const skip = (page - 1) * limit;
  
  const query = { targetType, targetId, status };
  
  return await this.find(query)
    .populate('follower', populateFields)
    .sort({ acceptedAt: -1, requestedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

followSchema.statics.getFollowing = async function(followerId, options = {}) {
  const { 
    page = 1, 
    limit = 50, 
    status = 'accepted', 
    targetType,
    populateFields = 'name avatar headline verificationStatus'
  } = options;
  
  const skip = (page - 1) * limit;
  
  const query = { follower: followerId, status };
  if (targetType) query.targetType = targetType;
  
  return await this.find(query)
    .populate('targetId', populateFields)
    .sort({ acceptedAt: -1, requestedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

followSchema.statics.getFollowStatus = function(followerId, targetType, targetId) {
  return this.findOne({ 
    follower: followerId, 
    targetType, 
    targetId 
  });
};

followSchema.statics.getFollowCounts = async function(targetType, targetId) {
  const [followers, following] = await Promise.all([
    this.countDocuments({ 
      targetType, 
      targetId, 
      status: 'accepted' 
    }),
    this.countDocuments({ 
      follower: targetId, 
      status: 'accepted' 
    })
  ]);
  
  return { followers, following };
};

followSchema.statics.getPendingRequests = async function(targetType, targetId, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;
  
  return await this.find({ 
    targetType, 
    targetId, 
    status: 'pending' 
  })
  .populate('follower', 'name avatar headline role verificationStatus')
  .sort({ requestedAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
};

// Instance methods
followSchema.methods.accept = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.lastInteracted = new Date();
  return this.save();
};

followSchema.methods.reject = function() {
  this.status = 'rejected';
  this.lastInteracted = new Date();
  return this.save();
};

followSchema.methods.block = function() {
  this.status = 'blocked';
  this.lastInteracted = new Date();
  return this.save();
};

module.exports = mongoose.model('Follow', followSchema);