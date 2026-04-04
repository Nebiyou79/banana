// server/src/middleware/organizationMiddleware.js
const Organization = require('../models/Organization');

// Check if organization user has an organization profile
exports.checkOrganizationProfile = async (req, res, next) => {
  if (req.user.role !== 'organization') {
    return next();
  }

  try {
    const organization = await Organization.findOne({ user: req.user.id });
    
    // If organization user doesn't have a profile, redirect to create one
    if (!organization && !req.originalUrl.includes('/organization/profile')) {
      return res.status(302).json({
        success: false,
        redirect: '/dashboard/organization/profile',
        message: 'Please complete your organization profile first'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};