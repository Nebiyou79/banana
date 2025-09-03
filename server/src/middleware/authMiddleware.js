const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user still exists and is active - FIXED: Get full user object
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is no longer valid' 
      });
    }

    // FIX: Set req.user to the actual user object from database, not just decoded token
    req.user = {
      _id: user._id,
      userId: user._id, // Add userId for compatibility
      id: user._id, // Add id for compatibility
      name: user.name,
      email: user.email,
      role: user.role,
      // Add other user properties as needed
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

// Optional authentication (for public routes that might have authenticated users)
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          // FIX: Set full user object, not just decoded token
          req.user = {
            _id: user._id,
            userId: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
      } catch (error) {
        // Silently ignore invalid tokens for optional auth
        console.log('Optional auth token error:', error.message);
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};