const rateLimit = require('express-rate-limit');

// General rate limiter
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Strict rate limiter for auth endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.'
});

// Admin endpoint rate limiter
exports.adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 200 requests per windowMs
  message: 'Too many admin requests from this IP, please try again later.'
});