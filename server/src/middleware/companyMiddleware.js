const Company = require('../models/Company');

// Check if company user has a company profile
exports.checkCompanyProfile = async (req, res, next) => {
  if (req.user.role !== 'company') {
    return next();
  }

  try {
    const company = await Company.findOne({ user: req.user.id });
    
    // If company user doesn't have a profile, redirect to create one
    if (!company && !req.originalUrl.includes('/company/profile')) {
      return res.status(302).json({
        success: false,
        redirect: '/dashboard/company/profile',
        message: 'Please complete your company profile first'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};