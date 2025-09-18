const Company = require('../models/Company');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create company profile
// @route   POST /api/companies
// @access  Private (Company role only)
exports.createCompany = asyncHandler(async (req, res, next) => {
  try {
    console.log('User making request:', req.user);
    console.log('Request body received:', req.body);

    if (req.user.role !== 'company') {
      return next(new ErrorResponse('Not authorized to create company profile', 403));
    }

    // Check if user already has a company
    if (req.user.company) {
      return next(new ErrorResponse('Company profile already exists for this user', 400));
    }

    // Create company with user reference
    const companyData = {
      ...req.body,
      user: req.user.userId
    };

    console.log('Company data to create:', companyData);

    const company = await Company.create(companyData);

    // Update user with company reference
    await User.findByIdAndUpdate(req.user.userId, { 
      hasCompanyProfile: true,
      profileCompleted: true,
      company: company._id
    });

    console.log('Company created successfully:', company._id);

    res.status(201).json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Company creation error:', error);
    
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

// @desc    Get my company
// @route   GET /api/companies/
// @access  Private
exports.getMyCompany = asyncHandler(async (req, res, next) => {
  // Use req.user.company if available
  if (!req.user.company) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Company profile not found'
    });
  }

  const company = await Company.findById(req.user.company._id).populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: company
  });
});

// @desc    Update my company
// @route   PUT /api/companies/me
// @access  Private
exports.updateMyCompany = asyncHandler(async (req, res, next) => {
  if (!req.user.company) {
    return next(new ErrorResponse('Company profile not found', 404));
  }

  const updatedCompany = await Company.findByIdAndUpdate(req.user.company._id, req.body, {
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

// @desc    Update company by ID
// @route   PUT /api/companies/:id
// @access  Private
exports.updateCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(new ErrorResponse('Company not found', 404));
  }

  // Make sure user is company owner or admin
  if (company.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this company', 403));
  }

  const updatedCompany = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: updatedCompany
  });
});
