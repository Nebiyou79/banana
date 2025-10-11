const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  console.log('--- [verifyToken] called ---');
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // Get full user object including company
    const user = await User.findById(decoded.userId).populate('company');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid'
      });
    }
    // Attach user to req with populated company
    req.user = {
      _id: user._id,
      userId: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
};

// Optional authentication (for public routes)
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('company');
        if (user && user.isActive) {
          req.user = {
            _id: user._id,
            userId: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company
          };
        }
      } catch (error) {
        console.log('Optional auth token error:', error.message);
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

// Restrict access to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check if user is the owner of the resource or has admin role
exports.isOwnerOrAdmin = (resourceOwnerIdPath = 'params.id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource owner ID from the specified path
    const pathParts = resourceOwnerIdPath.split('.');
    let resourceOwnerId = req;
    for (const key of pathParts) {
      resourceOwnerId = resourceOwnerId && resourceOwnerId[key];
    }

    // Check if user is the owner of the resource
    if (req.user.userId !== resourceOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};