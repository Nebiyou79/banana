const User = require('../models/User');
const cvUpload = require('../middleware/cvUploadMiddleware');

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

exports.uploadCV = async (req, res) => {
  try {
    // Use multer middleware for file upload
    cvUpload.single('cv')(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CV file is required'
        });
      }

      const cvUrl = `/uploads/cv/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { cvUrl },
        { new: true }
      ).select('name email cvUrl');

      res.json({
        success: true,
        message: 'CV uploaded successfully',
        data: { user }
      });
    });
  } catch (error) {
    console.error('Upload CV error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};