const User = require('../models/User');
const Tender = require('../models/Tender');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// SIMPLIFIED update function - no complex validation
exports.updateProfile = async (req, res) => {
  console.log('=== UPDATE PROFILE STARTED ===');
  console.log('Request body received:', Object.keys(req.body));
  
  try {
    // Set timeout for the request
    req.setTimeout(30000); // 30 seconds
    
    const userId = req.user.userId;
    const updateData = { ...req.body, updatedAt: new Date() };

    console.log('Update data:', Object.keys(updateData));

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.email;
    delete updateData.role;

    // SIMPLE update without complex validation
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true,
        runValidators: false, // Disable validators for performance
        lean: true
      }
    ).select('name email role verificationStatus profileCompleted skills education experience cvs portfolio bio location phone website socialLinks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('=== UPDATE PROFILE COMPLETED SUCCESSFULLY ===');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Keep your other methods but simplify getProfile too
exports.getProfile = async (req, res) => {
  try {
    console.log('=== GET PROFILE STARTED ===');
    
    const user = await User.findById(req.user.userId)
      .select('name email role verificationStatus profileCompleted skills education experience cvs portfolio bio location phone website socialLinks lastLogin')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('=== GET PROFILE COMPLETED ===');
    
    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.uploadCV = async (req, res) => {
  try {
    console.log('=== [uploadCV] called ===');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      // Clean up uploaded files
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.log('File cleanup error:', cleanupError.message);
        }
      });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check CV limit (max 5)
    if (user.cvs.length + req.files.length > 5) {
      // Clean up uploaded files
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.log('File cleanup error:', cleanupError.message);
        }
      });
      return res.status(400).json({
        success: false,
        message: `Maximum 5 CVs allowed. You currently have ${user.cvs.length} CVs.`
      });
    }

    // Process uploaded files
    const uploadedCVs = req.files.map((file, index) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/cv/${file.filename}`, // Correct path
      uploadedAt: new Date(),
      isPrimary: user.cvs.length === 0 && index === 0 // Set first as primary if no CVs exist
    }));

    // Add new CVs
    user.cvs.push(...uploadedCVs);
    await user.save();

    console.log('=== [uploadCV] successful - uploaded', uploadedCVs.length, 'files ===');
    
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedCVs.length} CV(s)`,
      data: { cvs: uploadedCVs }
    });

  } catch (error) {
    console.error('Upload CV error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupError) {
          console.log('File cleanup error:', cleanupError.message);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during CV upload: ' + error.message
    });
  }
};

exports.setPrimaryCV = async (req, res) => {
  try {
    console.log('--- [setPrimaryCV] called ---');
    
    const { cvId } = req.params;
    const userId = req.user.userId;

    // First, set all CVs to non-primary
    await User.updateOne(
      { _id: userId },
      { $set: { 'cvs.$[].isPrimary': false } }
    );

    // Then set the specific CV as primary
    const result = await User.updateOne(
      { _id: userId, 'cvs._id': cvId },
      { $set: { 'cvs.$.isPrimary': true } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    console.log('--- [setPrimaryCV] successful ---');
    
    res.json({
      success: true,
      message: 'Primary CV updated successfully'
    });

  } catch (error) {
    console.error('Set primary CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.deleteCV = async (req, res) => {
  try {
    console.log('--- [deleteCV] called ---');
    
    const { cvId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cvToDelete = user.cvs.id(cvId);
    if (!cvToDelete) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', cvToDelete.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.log('File deletion error:', fileError.message);
    }

    // Remove CV from user's CVs array
    user.cvs.pull(cvId);
    
    // If deleted CV was primary and other CVs exist, set first one as primary
    if (cvToDelete.isPrimary && user.cvs.length > 0) {
      user.cvs[0].isPrimary = true;
    }

    await user.save();

    console.log('--- [deleteCV] successful ---');
    
    res.json({
      success: true,
      message: 'CV deleted successfully'
    });

  } catch (error) {
    console.error('Delete CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getOpenTenders = async (req, res) => {
  try {
    console.log('--- [getOpenTenders] called ---');
    
    const {
      page = 1,
      limit = 12,
      category,
      minBudget,
      maxBudget,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {
      status: 'open',
      deadline: { $gt: new Date() }
    };

    if (category && category !== 'all') filter.category = category;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    // Parallel execution for better performance
    const [tenders, total] = await Promise.all([
      Tender.find(filter)
        .populate('company', 'name logo industry')
        .populate('createdBy', 'name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Tender.countDocuments(filter)
    ]);

    console.log('--- [getOpenTenders] successful ---');
    
    res.json({
      success: true,
      data: tenders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get open tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.toggleSaveTender = async (req, res) => {
  try {
    console.log('--- [toggleSaveTender] called ---');
    
    const { tenderId } = req.params;
    const userId = req.user.userId;

    if (!tenderId) {
      return res.status(400).json({
        success: false,
        message: 'Tender ID is required'
      });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const user = await User.findById(userId);
    const isSaved = user.savedJobs.includes(tenderId);

    if (isSaved) {
      // Remove from saved
      user.savedJobs.pull(tenderId);
      tender.savedBy.pull(userId);
    } else {
      // Add to saved
      user.savedJobs.push(tenderId);
      tender.savedBy.push(userId);
    }

    await Promise.all([user.save(), tender.save()]);

    console.log('--- [toggleSaveTender] successful ---');
    
    res.json({
      success: true,
      message: isSaved ? 'Tender removed from saved' : 'Tender saved successfully',
      data: { saved: !isSaved }
    });

  } catch (error) {
    console.error('Toggle save tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getSavedTenders = async (req, res) => {
  try {
    console.log('--- [getSavedTenders] called ---');
    
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'savedJobs',
        match: { status: 'open', deadline: { $gt: new Date() } },
        populate: [
          { path: 'company', select: 'name logo industry' },
          { path: 'createdBy', select: 'name' }
        ]
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('--- [getSavedTenders] successful ---');
    
    res.json({
      success: true,
      data: user.savedJobs || []
    });

  } catch (error) {
    console.error('Get saved tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};