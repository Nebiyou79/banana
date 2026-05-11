// server/src/controllers/organizationController.js

const Organization = require('../models/Organization');
const User = require('../models/User');
const mongoose = require('mongoose'); // ← ADD THIS LINE
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
    const organization = await Organization.findOne({ user: req.user.userId });

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
    console.log('👤 User making request:', {
      userId: req.user.userId,
      name: req.user.name,
      role: req.user.role
    });
    console.log('📦 Request body:', req.body);

    // Check if user has organization role
    if (req.user.role !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'Only users with organization role can create organization profiles'
      });
    }

    // Check if user already has an organization - use native query to avoid middleware
    const db = mongoose.connection.db;
    const organizationsCollection = db.collection('organizations');
    
    const existingOrg = await organizationsCollection.findOne({ 
      user: new mongoose.Types.ObjectId(req.user.userId) 
    });
    
    if (existingOrg) {
      console.log('⚠️ Organization already exists:', existingOrg._id);
      
      // Update user reference if needed
      await User.findByIdAndUpdate(req.user.userId, { 
        hasOrganizationProfile: true,
        profileCompleted: true,
        organization: existingOrg._id
      });
      
      // Fetch the org through Mongoose to get virtuals
      const org = await Organization.findById(existingOrg._id);
      
      return res.status(200).json({
        success: true,
        message: 'Organization profile already exists',
        data: org
      });
    }

    // Create organization document manually to avoid middleware
    const now = new Date();
    const orgDoc = {
      name: req.body.name || 'My Organization',
      organizationType: req.body.organizationType || 'non-profit',
      user: new mongoose.Types.ObjectId(req.user.userId),
      verified: false,
      verificationStatus: 'pending',
      isActive: true,
      settings: {
        allowMessages: true,
        showContactInfo: true,
        jobAlerts: true
      },
      createdAt: now,
      updatedAt: now
    };

    // Add optional fields only if they have values
    if (req.body.description) orgDoc.description = req.body.description;
    if (req.body.industry) orgDoc.industry = req.body.industry;
    if (req.body.mission) orgDoc.mission = req.body.mission;
    if (req.body.website) orgDoc.website = req.body.website;
    if (req.body.phone) orgDoc.phone = req.body.phone;
    if (req.body.secondaryPhone) orgDoc.secondaryPhone = req.body.secondaryPhone;
    if (req.body.registrationNumber) orgDoc.registrationNumber = req.body.registrationNumber;
    if (req.body.email) orgDoc.email = req.body.email;

    console.log('🏢 Creating organization with data:', orgDoc);

    // Insert directly into MongoDB - bypass all Mongoose middleware
    const result = await organizationsCollection.insertOne(orgDoc);
    
    console.log('✅ Organization created successfully:', result.insertedId);

    // Update user with organization reference
    await User.findByIdAndUpdate(req.user.userId, { 
      hasOrganizationProfile: true,
      profileCompleted: true,
      organization: result.insertedId
    });

    // Fetch the created organization through Mongoose to get proper formatting
    const organization = await Organization.findById(result.insertedId);

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
    
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// @desc    Update my organization profile
// @route   PUT /api/v1/organization/me
// @access  Private
exports.updateMyOrganization = asyncHandler(async (req, res, next) => {
  try {
    // First check if organization exists using native query
    const db = mongoose.connection.db;
    const organizationsCollection = db.collection('organizations');
    
    const existingOrg = await organizationsCollection.findOne({ 
      user: new mongoose.Types.ObjectId(req.user.userId) 
    });

    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    // Build update data - only include allowed fields
    const updateData = {};
    const allowedFields = [
      'name', 'description', 'industry', 'organizationType', 
      'mission', 'website', 'phone', 'secondaryPhone', 
      'registrationNumber', 'email', 'size', 'foundedYear',
      'socialMedia', 'settings', 'address'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    updateData.updatedAt = new Date();

    console.log('🔄 Updating organization with data:', updateData);

    // Update directly in MongoDB - bypass middleware
    await organizationsCollection.updateOne(
      { _id: existingOrg._id },
      { $set: updateData }
    );

    console.log('✅ Organization updated successfully');

    // Fetch updated organization through Mongoose
    const updatedOrganization = await Organization.findById(existingOrg._id);

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
      message: 'Failed to update organization profile: ' + error.message
    });
  }
});

// @desc    Get organization by ID
// @route   GET /api/v1/organization/:id
// @access  Public
exports.getOrganization = asyncHandler(async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);

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
    );

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

/**
 * @desc    Get public organization profile (NO AUTH REQUIRED)
 * @route   GET /api/v1/organization/public/:id
 * @access  Public
 */
exports.getPublicOrganization = asyncHandler(async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id).lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        code: 'ORGANIZATION_NOT_FOUND'
      });
    }

    // Remove sensitive data
    delete organization.registrationNumber;
    delete organization.__v;

    res.status(200).json({
      success: true,
      data: organization,
      code: 'PUBLIC_ORGANIZATION_RETRIEVED'
    });
  } catch (error) {
    console.error('❌ Get public organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
      code: 'SERVER_ERROR'
    });
  }
});