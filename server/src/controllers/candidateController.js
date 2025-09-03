const User = require('../models/User');
const { upload, handleUploadError } = require('../middleware/cvUploadMiddleware');
const path = require('path');
const fs = require('fs');

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