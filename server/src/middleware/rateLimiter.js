// /server/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Safe key generator for IPv6 support
const getSafeKey = (req) => {
  // Use the built-in ipKeyGenerator helper for IPv6 support
  const { ipKeyGenerator } = require('express-rate-limit');
  const ip = ipKeyGenerator(req);
  
  // Add user ID if available for more granularity
  if (req.user?.userId) {
    return `${req.user.userId}-${ip}`;
  }
  
  return ip;
};

// Different rate limits for different routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests toward limit
  keyGenerator: getSafeKey,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getSafeKey,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getSafeKey,
});

// MORE PERMISSIVE LIMITER FOR SOCIAL/FOLLOW ROUTES
const socialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for social interactions (200 per 15 min)
  message: {
    success: false,
    message: 'Too many social requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: getSafeKey,
});

// EVEN MORE PERMISSIVE FOR FOLLOW LISTS
const followListLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes for list endpoints
  message: {
    success: false,
    message: 'Too many follow list requests, please try again in a few minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  keyGenerator: getSafeKey,
});

// VERY PERMISSIVE FOR FOLLOW STATUS CHECKS
const followStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes for status checks
  message: {
    success: false,
    message: 'Too many status checks, please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: getSafeKey,
});

module.exports = {
  generalLimiter,
  authLimiter,
  adminLimiter,
  socialLimiter,
  followListLimiter,
  followStatusLimiter
};