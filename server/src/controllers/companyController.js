// server/src/controllers/companyController.js - UPDATED
const Company = require('../models/Company');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get my company profile
// @route   GET /api/v1/company
// @access  Private
exports.getMyCompany = asyncHandler(async (req, res, next) => {
  try {
    console.log('🔍 Getting company for user:', req.user.userId);
    
    // Find company by user ID
    const company = await Company.findOne({ user: req.user.userId })
      .populate('user', 'name email role');

    if (!company) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No company profile found'
      });
    }

    console.log('✅ Company found:', company._id);
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('❌ Get my company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company profile'
    });
  }
});

// @desc    Create company profile
// @route   POST /api/v1/company
// @access  Private (Company role only)
exports.createCompany = asyncHandler(async (req, res, next) => {
  try {
    console.log('👤 User making request:', req.user);
    console.log('📦 Request body:', req.body);

    // Check if user has company role
    if (req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Only users with company role can create company profiles'
      });
    }

    // Check if user already has a company
    const existingCompany = await Company.findOne({ user: req.user.userId });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company profile already exists for this user'
      });
    }

    // Create company data
    const companyData = {
      ...req.body,
      user: req.user.userId
    };

    console.log('🏢 Creating company with data:', companyData);

    // Create company
    const company = await Company.create(companyData);

    // Update user with company reference
    await User.findByIdAndUpdate(req.user.userId, { 
      hasCompanyProfile: true,
      profileCompleted: true,
      company: company._id
    });

    console.log('✅ Company created successfully:', company._id);

    res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      data: company
    });

  } catch (error) {
    console.error('❌ Company creation error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field === 'tin' ? 'TIN' : 'Company name'} already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @desc    Update my company profile
// @route   PUT /api/v1/company/me
// @access  Private
exports.updateMyCompany = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user.userId });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      company._id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('❌ Update company error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update company profile'
    });
  }
});

// @desc    Get company by ID
// @route   GET /api/v1/company/:id
// @access  Public
exports.getCompany = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('user', 'name email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('❌ Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company'
    });
  }
});

// @desc    Update company by ID
// @route   PUT /api/v1/company/:id
// @access  Private
exports.updateCompany = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check authorization
    if (company.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this company'
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('❌ Update company error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update company'
    });
  }
});

// File upload controllers remain the same...
exports.uploadLogo = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a logo file'
      });
    }

    const company = await Company.findOne({ user: req.user.userId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const logoFile = req.files.logo[0];
    const logoUrl = `/uploads/company/logos/${logoFile.filename}`;

    // Delete old logo if exists
    if (company.logoUrl && !company.logoUrl.startsWith('http')) {
      try {
        const oldLogoPath = path.join(process.cwd(), 'public', company.logoUrl);
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log('ℹ️ Old logo not found:', error.message);
      }
    }

    // Update company
    company.logoUrl = logoUrl;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl: company.logoFullUrl,
        logoPath: logoUrl
      }
    });

  } catch (error) {
    console.error('❌ Logo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
});

exports.uploadBanner = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || !req.files.banner) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a banner file'
      });
    }

    const company = await Company.findOne({ user: req.user.userId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const bannerFile = req.files.banner[0];
    const bannerUrl = `/uploads/company/banners/${bannerFile.filename}`;

    // Delete old banner if exists
    if (company.bannerUrl && !company.bannerUrl.startsWith('http')) {
      try {
        const oldBannerPath = path.join(process.cwd(), 'public', company.bannerUrl);
        await fs.unlink(oldBannerPath);
      } catch (error) {
        console.log('ℹ️ Old banner not found:', error.message);
      }
    }

    // Update company
    company.bannerUrl = bannerUrl;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        bannerUrl: company.bannerFullUrl,
        bannerPath: bannerUrl
      }
    });

  } catch (error) {
    console.error('❌ Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload banner'
    });
  }
});

// Delete controllers remain the same...
exports.deleteLogo = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user.userId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    if (!company.logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'No logo to delete'
      });
    }

    // Delete file from server
    if (!company.logoUrl.startsWith('http')) {
      try {
        const logoPath = path.join(process.cwd(), 'public', company.logoUrl);
        await fs.unlink(logoPath);
      } catch (error) {
        console.log('ℹ️ Logo file not found:', error.message);
      }
    }

    // Remove logo URL
    company.logoUrl = null;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Logo deleted successfully'
    });

  } catch (error) {
    console.error('❌ Logo deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete logo'
    });
  }
});

exports.deleteBanner = asyncHandler(async (req, res, next) => {
  try {
    const company = await Company.findOne({ user: req.user.userId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    if (!company.bannerUrl) {
      return res.status(400).json({
        success: false,
        message: 'No banner to delete'
      });
    }

    // Delete file from server
    if (!company.bannerUrl.startsWith('http')) {
      try {
        const bannerPath = path.join(process.cwd(), 'public', company.bannerUrl);
        await fs.unlink(bannerPath);
      } catch (error) {
        console.log('ℹ️ Banner file not found:', error.message);
      }
    }

    // Remove banner URL
    company.bannerUrl = null;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('❌ Banner deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner'
    });
  }
});