// server/src/controllers/organizationController.js
const Organization = require('../models/Organization');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get my organization profile
// @route   GET /api/v1/organization
// @access  Private
exports.getMyOrganization = asyncHandler(async (req, res, next) => {
  try {
    console.log('🔍 Getting organization for user:', req.user.userId);
    
    // Find organization by user ID
    const organization = await Organization.findOne({ user: req.user.userId })
      .populate('user', 'name email role');

    if (!organization) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No organization profile found'
      });
    }

    console.log('✅ Organization found:', organization._id);
    
    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('❌ Get my organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization profile'
    });
  }
});

// @desc    Create organization profile
// @route   POST /api/v1/organization
// @access  Private (Organization role only)
exports.createOrganization = asyncHandler(async (req, res, next) => {
  try {
    console.log('👤 User making request:', req.user);
    console.log('📦 Request body:', req.body);

    // Check if user has organization role
    if (req.user.role !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Only users with organization role can create organization profiles'
      });
    }

    // Check if user already has an organization
    const existingOrganization = await Organization.findOne({ user: req.user.userId });
    if (existingOrganization) {
      return res.status(400).json({
        success: false,
        message: 'Organization profile already exists for this user'
      });
    }

    // Create organization data
    const organizationData = {
      ...req.body,
      user: req.user.userId
    };

    console.log('🏢 Creating organization with data:', organizationData);

    // Create organization
    const organization = await Organization.create(organizationData);

    // Update user with organization reference
    await User.findByIdAndUpdate(req.user.userId, { 
      hasOrganizationProfile: true,
      profileCompleted: true,
      organization: organization._id
    });

    console.log('✅ Organization created successfully:', organization._id);

    res.status(201).json({
      success: true,
      message: 'Organization profile created successfully',
      data: organization
    });

  } catch (error) {
    console.error('❌ Organization creation error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field === 'registrationNumber' ? 'Registration number' : 'Organization name'} already exists`
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

// @desc    Update my organization profile
// @route   PUT /api/v1/organization/me
// @access  Private
exports.updateMyOrganization = asyncHandler(async (req, res, next) => {
  try {
    const organization = await Organization.findOne({ user: req.user.userId });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      organization._id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Organization profile updated successfully',
      data: updatedOrganization
    });
  } catch (error) {
    console.error('❌ Update organization error:', error);
    
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
      message: 'Failed to update organization profile'
    });
  }
});

// @desc    Get organization by ID
// @route   GET /api/v1/organization/:id
// @access  Public
exports.getOrganization = asyncHandler(async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('user', 'name email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('❌ Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
});

// @desc    Update organization by ID
// @route   PUT /api/v1/organization/:id
// @access  Private
exports.updateOrganization = asyncHandler(async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check authorization
    if (organization.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this organization'
      });
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: updatedOrganization
    });
  } catch (error) {
    console.error('❌ Update organization error:', error);
    
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
      message: 'Failed to update organization'
    });
  }
});

// File upload controllers
exports.uploadLogo = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a logo file'
      });
    }

    const organization = await Organization.findOne({ user: req.user.userId });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    const logoFile = req.files.logo[0];
    const logoUrl = `/uploads/organization/logos/${logoFile.filename}`;

    // Delete old logo if exists
    if (organization.logoUrl && !organization.logoUrl.startsWith('http')) {
      try {
        const oldLogoPath = path.join(process.cwd(), 'public', organization.logoUrl);
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log('ℹ️ Old logo not found:', error.message);
      }
    }

    // Update organization
    organization.logoUrl = logoUrl;
    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl: organization.logoFullUrl,
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

    const organization = await Organization.findOne({ user: req.user.userId });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    const bannerFile = req.files.banner[0];
    const bannerUrl = `/uploads/organization/banners/${bannerFile.filename}`;

    // Delete old banner if exists
    if (organization.bannerUrl && !organization.bannerUrl.startsWith('http')) {
      try {
        const oldBannerPath = path.join(process.cwd(), 'public', organization.bannerUrl);
        await fs.unlink(oldBannerPath);
      } catch (error) {
        console.log('ℹ️ Old banner not found:', error.message);
      }
    }

    // Update organization
    organization.bannerUrl = bannerUrl;
    await organization.save();

    res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        bannerUrl: organization.bannerFullUrl,
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

// Delete controllers
exports.deleteLogo = asyncHandler(async (req, res, next) => {
  try {
    const organization = await Organization.findOne({ user: req.user.userId });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    if (!organization.logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'No logo to delete'
      });
    }

    // Delete file from server
    if (!organization.logoUrl.startsWith('http')) {
      try {
        const logoPath = path.join(process.cwd(), 'public', organization.logoUrl);
        await fs.unlink(logoPath);
      } catch (error) {
        console.log('ℹ️ Logo file not found:', error.message);
      }
    }

    // Remove logo URL
    organization.logoUrl = null;
    await organization.save();

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
    const organization = await Organization.findOne({ user: req.user.userId });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    if (!organization.bannerUrl) {
      return res.status(400).json({
        success: false,
        message: 'No banner to delete'
      });
    }

    // Delete file from server
    if (!organization.bannerUrl.startsWith('http')) {
      try {
        const bannerPath = path.join(process.cwd(), 'public', organization.bannerUrl);
        await fs.unlink(bannerPath);
      } catch (error) {
        console.log('ℹ️ Banner file not found:', error.message);
      }
    }

    // Remove banner URL
    organization.bannerUrl = null;
    await organization.save();

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