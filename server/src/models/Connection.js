// src/models/Connection.js
const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetType',
        required: true
    },
    targetType: {
        type: String,
        required: true,
        enum: ['User', 'Company'],
        default: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'connected', 'blocked', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Optional metadata
    connectionStrength: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
    },
    tags: [{
        type: String,
        trim: true
    }],
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Compound index to ensure unique connections
connectionSchema.index({ follower: 1, following: 1, targetType: 1 }, { unique: true });

// Index for faster queries on following user
connectionSchema.index({ following: 1, targetType: 1, status: 1 });

// Index for getting all connections of a user
connectionSchema.index({ follower: 1, status: 1 });

// Virtual for connection duration
connectionSchema.virtual('connectionDurationDays').get(function () {
    if (!this.createdAt) return 0;
    const diffTime = Math.abs(new Date() - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to format connection
connectionSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.connectionDurationDays = this.connectionDurationDays;
    delete obj.__v;
    return obj;
};

// Static method to check if connection exists
connectionSchema.statics.connectionExists = async function (followerId, followingId, targetType = 'User') {
    return await this.findOne({
        follower: followerId,
        following: followingId,
        targetType: targetType,
        status: 'connected'
    });
};

// Static method to get all connections for a user
connectionSchema.statics.getUserConnections = async function (userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const connections = await this.find({
        $or: [
            { follower: userId, status: 'connected' },
            { following: userId, targetType: 'User', status: 'connected' }
        ]
    })
        .populate('follower', 'name avatar role')
        .populate('following', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await this.countDocuments({
        $or: [
            { follower: userId, status: 'connected' },
            { following: userId, targetType: 'User', status: 'connected' }
        ]
    });

    return { connections, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection;