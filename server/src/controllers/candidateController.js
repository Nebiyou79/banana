const User = require('../models/User');
const { upload, handleUploadError } = require('../middleware/cvUploadMiddleware');
const path = require('path');
const fs = require('fs');
const Tender = require('../models/Tender');
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('name email role verificationStatus profileCompleted skills education experience cvUrl portfolio bio location phone website socialLinks');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return the CV URL as stored (relative path)
    // Frontend will handle converting to absolute URL
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

exports.updateProfile = async (req, res) => {
  try {
    const {
      skills,
      education,
      experience,
      bio,
      location,
      phone,
      website,
      socialLinks
    } = req.body;

    const updateData = {
      ...(skills !== undefined && { skills }),
      ...(education !== undefined && { education }),
      ...(experience !== undefined && { experience }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(phone !== undefined && { phone }),
      ...(website !== undefined && { website }),
      ...(socialLinks !== undefined && { socialLinks }),
      profileCompleted: true
    };

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('name email role verificationStatus profileCompleted skills education experience cvUrl portfolio bio location phone website socialLinks');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Separate middleware for CV upload
exports.uploadCV = [
  upload.single('cv'),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CV file is required'
        });
      }

      // Store relative path (consistent format)
      const cvUrl = `/uploads/cv/${req.file.filename}`;

      // Get current user to check if they have an existing CV
      const currentUser = await User.findById(req.user.userId);
      
      // Delete old CV file if it exists
      if (currentUser && currentUser.cvUrl) {
        try {
          // Handle both /api/v1/... and /uploads/... formats
          let oldFilePath = currentUser.cvUrl;
          if (oldFilePath.startsWith('/api/v1/')) {
            oldFilePath = oldFilePath.replace('/api/v1', '');
          }
          
          const fullOldPath = path.join(process.cwd(), 'public', oldFilePath);
          if (fs.existsSync(fullOldPath)) {
            fs.unlinkSync(fullOldPath);
            console.log('Deleted old CV file:', fullOldPath);
          }
        } catch (deleteError) {
          console.log('Could not delete old file:', deleteError.message);
        }
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { cvUrl },
        { new: true }
      ).select('name email cvUrl');

      res.json({
        success: true,
        message: 'CV uploaded successfully',
        data: { 
          user: {
            cvUrl: cvUrl // Return relative path
          }
        }
      });

    } catch (error) {
      console.error('Upload CV error:', error);
      
      // Clean up uploaded file if error occurred
      if (req.file) {
        try {
          const filePath = path.join(req.file.destination, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.log('Could not clean up file:', cleanupError.message);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
];


// Get all open tenders for candidates
exports.getOpenTenders = async (req, res) => {
  try {
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

    const filter = {
      status: 'open',
      deadline: { $gt: new Date() },
      moderated: false
    };

    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    const tenders = await Tender.find(filter)
      .populate('company', 'name logo industry')
      .populate('createdBy', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tender.countDocuments(filter);

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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save/unsave tender for candidate
exports.toggleSaveTender = async (req, res) => {
  try {
    const { tenderId } = req.params;
    const userId = req.user._id;

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const user = await User.findById(userId);
    const isSaved = user.savedTenders.includes(tenderId);

    if (isSaved) {
      // Remove from saved
      user.savedTenders.pull(tenderId);
      tender.savedBy.pull(userId);
    } else {
      // Add to saved
      user.savedTenders.push(tenderId);
      tender.savedBy.push(userId);
    }

    await Promise.all([user.save(), tender.save()]);

    res.json({
      success: true,
      message: isSaved ? 'Tender removed from saved' : 'Tender saved successfully',
      data: { saved: !isSaved }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get saved tenders for candidate
exports.getSavedTenders = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedTenders',
      populate: [
        { path: 'company', select: 'name logo industry' },
        { path: 'createdBy', select: 'name' }
      ]
    });

    res.json({
      success: true,
      data: user.savedTenders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};