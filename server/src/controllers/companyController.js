const Company = require('../models/Company');
const User = require('../models/User'); // ADD THIS IMPORT
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create company profile
// @route   POST /api/companies
// @access  Private (Company role only)
exports.createCompany = asyncHandler(async (req, res, next) => {
  try {
    console.log('User making request:', req.user);
    console.log('Request body received:', req.body);

    // Check if user has company role
    if (req.user.role !== 'company') {
      return next(new ErrorResponse('Not authorized to create company profile', 403));
    }

    // Check if company already exists for this user
    const existingCompany = await Company.findOne({ user: req.user.userId });
    if (existingCompany) {
      return next(new ErrorResponse('Company profile already exists for this user', 400));
    }

    // Create company data with user reference - FIXED: Use req.user.userId
    const companyData = {
      ...req.body,
      user: req.user.userId // Use userId from JWT payload
    };

    console.log('Company data to create:', companyData);

    const company = await Company.create(companyData);

    // Update user's company profile status
    await User.findByIdAndUpdate(req.user.userId, { 
      hasCompanyProfile: true,
      profileCompleted: true
    });

    console.log('Company created successfully:', company._id);

    res.status(201).json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Company creation error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return next(new ErrorResponse('Company name or TIN already exists', 400));
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    
    next(error);
  }
});

// Also update the getMyCompany function to use userId:
exports.getMyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ user: req.user.userId }).populate('user', 'name email');
      console.log('User from token:', req.user);
    console.log('User ID:', req.user.id);
    console.log('User ID (alternative):', req.user.userId);
  // Return null data instead of error for better frontend handling
  if (!company) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Company profile not found'
    });
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

// Update updateMyCompany function as well:
exports.updateMyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ user: req.user.userId });

  if (!company) {
    return next(new ErrorResponse('Company profile not found', 404));
  }

  const updatedCompany = await Company.findByIdAndUpdate(company._id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: updatedCompany
  });
});

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Public
exports.getCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id).populate('user', 'name email');

  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

// @desc    Update company profile
// @route   PUT /api/companies/:id
// @access  Private
exports.updateCompany = asyncHandler(async (req, res, next) => {
  let company = await Company.findById(req.params.id);

  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  // Make sure user is company owner or admin
  if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this company', 403));
  }

  company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: company
  });
});
