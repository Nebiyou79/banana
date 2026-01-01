// /server/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

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
  keyGenerator: (req) => {
    // Use user ID + IP for more granular rate limiting
    return req.user?.userId ? `${req.user.userId}-${req.ip}` : req.ip;
  }
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
});

module.exports = {
  generalLimiter,
  authLimiter,
  adminLimiter,
  socialLimiter,
  followListLimiter,
  followStatusLimiter
};