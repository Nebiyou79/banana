const User = require('../models/User');
const FreelancerProfile = require('../models/Freelancer');
const { getFileUrl } = require('../middleware/fileUploadMiddleware');
const Tender = require('../models/Tender');

// UPDATED: Profile completeness calculation with age and gender
const calculateProfileCompleteness = (user, freelancerProfile) => {
  const completenessWeights = {
    basicInfo: {
      weight: 25, // Increased weight for basic info
      checks: [
        { condition: user.name && user.name.trim().length > 0, points: 20 },
        { condition: user.email, points: 20 },
        { condition: user.avatar, points: 20 },
        { condition: user.dateOfBirth, points: 20 }, // NEW: Date of birth
        { condition: user.gender && user.gender !== 'prefer-not-to-say', points: 20 } // NEW: Gender
      ]
    },
    professionalInfo: {
      weight: 30,
      checks: [
        { condition: freelancerProfile.headline && freelancerProfile.headline.trim().length > 0, points: 25 },
        { condition: freelancerProfile.bio && freelancerProfile.bio.trim().length > 50, points: 25 },
        { condition: freelancerProfile.hourlyRate > 0, points: 25 },
        { condition: freelancerProfile.specialization && freelancerProfile.specialization.length > 0, points: 25 }
      ]
    },
    skillsPortfolio: {
      weight: 25,
      checks: [
        { condition: user.skills && user.skills.length >= 3, points: 50 },
        { condition: user.portfolio && user.portfolio.length >= 2, points: 50 }
      ]
    },
    experienceEducation: {
      weight: 15,
      checks: [
        { condition: user.experience && user.experience.length > 0, points: 50 },
        { condition: user.education && user.education.length > 0, points: 50 }
      ]
    },
    contactDetails: {
      weight: 5, // Reduced weight since basic info now includes age/gender
      checks: [
        { condition: user.location && user.location.trim().length > 0, points: 25 },
        { condition: user.website || (user.socialLinks && Object.values(user.socialLinks).some(link => link)), points: 25 },
        { condition: user.socialLinks && Object.values(user.socialLinks).filter(link => link).length >= 2, points: 25 },
        { condition: user.phone && user.phone.trim().length > 0, points: 25 }
      ]
    }
  };

  let totalScore = 0;
  let maxPossibleScore = 0;

  Object.values(completenessWeights).forEach(category => {
    const categoryMaxScore = category.weight;
    maxPossibleScore += categoryMaxScore;
    
    let categoryScore = 0;
    let categoryTotalPoints = 0;
    
    category.checks.forEach(check => {
      categoryTotalPoints += check.points;
      if (check.condition) {
        categoryScore += check.points;
      }
    });
    
    const categoryPercentage = categoryTotalPoints > 0 ? (categoryScore / categoryTotalPoints) : 0;
    totalScore += categoryPercentage * category.weight;
  });

  return Math.round((totalScore / maxPossibleScore) * 100);
};

// Enhanced getOrCreateFreelancerProfile
const getOrCreateFreelancerProfile = async (userId) => {
  try {
    let freelancerProfile = await FreelancerProfile.findOne({ user: userId });
    
    if (!freelancerProfile) {
      console.log('🆕 Creating new freelancer profile for user:', userId);
      freelancerProfile = new FreelancerProfile({
        user: userId,
        profileCompletion: 0
      });
      await freelancerProfile.save();
      
      // Update user's role if not already freelancer
      await User.findByIdAndUpdate(userId, { 
        $set: { role: 'freelancer' }
      });
    }
    
    return freelancerProfile;
  } catch (error) {
    console.error('❌ Error in getOrCreateFreelancerProfile:', error);
    throw error;
  }
};

// Get freelancer dashboard overview - FIXED
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📊 Fetching dashboard for user:', userId);

    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user with portfolio and skills
    const user = await User.findById(userId).select('portfolio skills name email avatar experience education socialLinks dateOfBirth gender');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create freelancer profile
    const freelancerProfile = await getOrCreateFreelancerProfile(userId);

    console.log('✅ Found freelancer profile:', freelancerProfile._id);

    // Calculate real profile completeness
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

    // Safe data extraction with defaults
    const stats = {
      profile: {
        completion: profileCompletion,
        views: freelancerProfile.profileViews || 0,
        verified: freelancerProfile.verified || false
      },
      portfolio: {
        total: user.portfolio ? user.portfolio.length : 0,
        featured: user.portfolio ? user.portfolio.filter(item => item.featured).length : 0
      },
      skills: {
        total: user.skills ? user.skills.length : 0,
        categories: user.skills ? [...new Set(user.skills)] : []
      },
      earnings: {
        total: freelancerProfile.totalEarnings || 0,
        successRate: freelancerProfile.successRate || 0
      },
      ratings: freelancerProfile.ratings || { average: 0, count: 0 },
      proposals: {
        sent: 0,
        accepted: 0,
        pending: 0
      },
      socialLinks: {
        total: user.socialLinks ? Object.values(user.socialLinks).filter(link => link).length : 0
      },
      // NEW: Age and gender stats
      demographics: {
        age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
        gender: user.gender || 'prefer-not-to-say'
      }
    };

    console.log('📈 Dashboard stats calculated:', stats);

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentActivities: await getRecentActivities(userId),
        profileStrength: {
          score: profileCompletion,
          strengths: getProfileStrengths(freelancerProfile, user),
          suggestions: getProfileSuggestions(freelancerProfile, user)
        }
      }
    });

  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Professional freelancer stats (Like Upwork/Fiverr)
exports.getFreelancerStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const freelancerProfile = await FreelancerProfile.findOne({ user: userId })
      .populate('user', 'name avatar portfolio skills experience education socialLinks dateOfBirth gender');
    
    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Calculate professional stats (like Upwork)
    const user = freelancerProfile.user;
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    const stats = {
      profileStrength: profileCompletion,
      jobSuccessScore: freelancerProfile.successRate || 0,
      onTimeDelivery: freelancerProfile.onTimeDelivery || 0,
      responseRate: freelancerProfile.responseRate || 0,
      totalEarnings: freelancerProfile.totalEarnings || 0,
      totalJobs: await getTotalJobs(userId),
      activeProposals: await getActiveProposals(userId),
      profileViews: freelancerProfile.profileViews || 0,
      clientReviews: freelancerProfile.ratings?.count || 0,
      averageRating: freelancerProfile.ratings?.average || 0,
      socialLinksCount: user.socialLinks ? Object.values(user.socialLinks).filter(link => link).length : 0,
      // NEW: Age and gender
      age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
      gender: user.gender || 'prefer-not-to-say'
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get freelancer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching freelancer stats',
      error: error.message
    });
  }
};

// Get complete freelancer profile - FIXED
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('👤 Fetching profile for user:', userId);

    // Get user data
    const user = await User.findById(userId).select('-passwordHash -loginAttempts -lockUntil');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create freelancer profile
    const freelancerProfile = await getOrCreateFreelancerProfile(userId);

    console.log('✅ Found user and freelancer profile');

    // Calculate real profile completeness
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

    // Update profile completion in database
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    // Prepare profile data
    const profileData = await prepareProfileData(user, freelancerProfile);

    console.log('✅ Profile data prepared successfully');

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message
    });
  }
};

// Update freelancer profile - FIXED with social links handling and age/gender
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    console.log('🔄 Updating profile for user:', userId);
    console.log('📝 Update data:', updateData);

    // Validate date of birth if provided
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      
      if (dob > maxDate) {
        return res.status(400).json({
          success: false,
          message: 'You must be at least 16 years old'
        });
      }
      if (dob < minDate) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid date of birth'
        });
      }
    }

    // Validate gender if provided
    if (updateData.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(updateData.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid gender option'
      });
    }

    // Transform skills if they're in object format
    if (updateData.skills && Array.isArray(updateData.skills)) {
      updateData.skills = updateData.skills.map(skill => 
        typeof skill === 'object' ? skill.name : skill
      );
    }

    // Clean social links - remove empty strings and null values
    if (updateData.socialLinks) {
      Object.keys(updateData.socialLinks).forEach(key => {
        if (!updateData.socialLinks[key] || updateData.socialLinks[key].trim() === '') {
          updateData.socialLinks[key] = undefined;
        }
      });
    }

    // Get user and freelancer profile
    const user = await User.findById(userId);
    let freelancerProfile = await getOrCreateFreelancerProfile(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Separate user data and freelancer profile data
    const userUpdateData = {};
    const freelancerUpdateData = {};

    // UPDATED: Include dateOfBirth and gender in user fields
    const userFields = ['name', 'bio', 'location', 'phone', 'website', 'avatar', 'socialLinks', 'skills', 'experience', 'education', 'dateOfBirth', 'gender'];
    const freelancerFields = ['headline', 'hourlyRate', 'availability', 'experienceLevel', 'englishProficiency', 'timezone', 'specialization', 'services'];

    Object.keys(updateData).forEach(key => {
      if (userFields.includes(key)) {
        userUpdateData[key] = updateData[key];
      } else if (freelancerFields.includes(key)) {
        freelancerUpdateData[key] = updateData[key];
      } else if (key === 'freelancerProfile' && typeof updateData[key] === 'object') {
        // Handle nested freelancer profile data
        Object.keys(updateData[key]).forEach(profileKey => {
          if (freelancerFields.includes(profileKey)) {
            freelancerUpdateData[profileKey] = updateData[key][profileKey];
          }
        });
      }
    });

    console.log('👤 User update data:', userUpdateData);
    console.log('💼 Freelancer update data:', freelancerUpdateData);

    // Update user data
    let updatedUser;
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: userUpdateData },
        { runValidators: true, new: true }
      ).select('-passwordHash -loginAttempts -lockUntil');
    } else {
      updatedUser = await User.findById(userId).select('-passwordHash -loginAttempts -lockUntil');
    }

    // Update freelancer profile data
    let updatedFreelancerProfile;
    if (Object.keys(freelancerUpdateData).length > 0) {
      updatedFreelancerProfile = await FreelancerProfile.findOneAndUpdate(
        { user: userId },
        { $set: freelancerUpdateData },
        { new: true, runValidators: true }
      );
    } else {
      updatedFreelancerProfile = await FreelancerProfile.findOne({ user: userId });
    }

    if (!updatedUser || !updatedFreelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'User or freelancer profile not found'
      });
    }

    // Calculate REAL profile completeness
    const profileCompletion = calculateProfileCompleteness(updatedUser, updatedFreelancerProfile);
    
    // Update completion percentage
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    // Mark profile as completed if above 80%
    if (profileCompletion >= 80 && !updatedUser.profileCompleted) {
      await User.findByIdAndUpdate(userId, { 
        $set: { profileCompleted: true } 
      });
      updatedUser.profileCompleted = true;
    }

    // Prepare response data
    const profileData = await prepareProfileData(updatedUser, updatedFreelancerProfile);

    console.log('✅ Profile updated successfully. Completion:', profileCompletion + '%');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData,
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    // Handle validation errors for social links
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

// Portfolio Management (using User model's portfolio) - FIXED
exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, featured, category } = req.query;

    console.log('📁 Fetching portfolio for user:', userId);

    const user = await User.findById(userId).select('portfolio');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let portfolioItems = user.portfolio || [];

    // Transform data for frontend
    const transformedItems = portfolioItems.map(item => ({
      ...item.toObject(),
      mediaUrls: item.mediaUrl ? [item.mediaUrl] : []
    }));

    // Apply filters on transformed data
    let filteredItems = transformedItems;
    if (featured !== undefined) {
      filteredItems = filteredItems.filter(item => item.featured === (featured === 'true'));
    }

    if (category) {
      filteredItems = filteredItems.filter(item => 
        item.category && item.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    console.log('✅ Portfolio items fetched:', paginatedItems.length);

    res.status(200).json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(filteredItems.length / limit),
          total: filteredItems.length,
          hasNext: endIndex < filteredItems.length,
          hasPrev: startIndex > 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching portfolio',
      error: error.message
    });
  }
};

exports.addPortfolioItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolioData = req.body;

    console.log('➕ Adding portfolio item for user:', userId);

    // Transform mediaUrls to mediaUrl for backend compatibility
    const transformedData = {
      ...portfolioData,
      mediaUrl: portfolioData.mediaUrls && portfolioData.mediaUrls.length > 0 ? portfolioData.mediaUrls[0] : '',
    };
    delete transformedData.mediaUrls;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          portfolio: {
            ...transformedData,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Recalculate profile completeness
    const freelancerProfile = await getOrCreateFreelancerProfile(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    const newItem = user.portfolio[user.portfolio.length - 1];
    
    // Transform back for frontend compatibility
    const frontendItem = {
      ...newItem.toObject(),
      mediaUrls: newItem.mediaUrl ? [newItem.mediaUrl] : []
    };

    console.log('✅ Portfolio item added:', frontendItem._id);

    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      data: frontendItem,
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Add portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding portfolio item',
      error: error.message
    });
  }
};

exports.updatePortfolioItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    console.log('✏️ Updating portfolio item:', id);

    // Transform mediaUrls if provided
    const transformedData = { ...updateData };
    if (updateData.mediaUrls) {
      transformedData.mediaUrl = updateData.mediaUrls && updateData.mediaUrls.length > 0 ? updateData.mediaUrls[0] : '';
      delete transformedData.mediaUrls;
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, 'portfolio._id': id },
      {
        $set: Object.keys(transformedData).reduce((acc, key) => {
          acc[`portfolio.$.${key}`] = transformedData[key];
          return acc;
        }, {})
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found'
      });
    }

    const updatedItem = user.portfolio.id(id);
    
    // Transform back for frontend
    const frontendItem = {
      ...updatedItem.toObject(),
      mediaUrls: updatedItem.mediaUrl ? [updatedItem.mediaUrl] : []
    };

    console.log('✅ Portfolio item updated:', frontendItem._id);

    res.status(200).json({
      success: true,
      message: 'Portfolio item updated successfully',
      data: frontendItem
    });

  } catch (error) {
    console.error('❌ Update portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating portfolio item',
      error: error.message
    });
  }
};

exports.deletePortfolioItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    console.log('🗑️ Deleting portfolio item:', id);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          portfolio: { _id: id }
        }
      },
      { new: true }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Recalculate profile completeness
    const freelancerProfile = await getOrCreateFreelancerProfile(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    console.log('✅ Portfolio item deleted:', id);

    res.status(200).json({
      success: true,
      message: 'Portfolio item deleted successfully',
      data: user.portfolio,
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Delete portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting portfolio item',
      error: error.message
    });
  }
};

// Services Management
exports.addService = async (req, res) => {
  try {
    const userId = req.user._id;
    const serviceData = req.body;

    console.log('➕ Adding service for user:', userId);

    // Get or create freelancer profile first
    await getOrCreateFreelancerProfile(userId);

    const freelancerProfile = await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          services: serviceData
        }
      },
      { new: true, runValidators: true }
    );

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    const newService = freelancerProfile.services[freelancerProfile.services.length - 1];
    console.log('✅ Service added:', newService._id);

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: newService
    });

  } catch (error) {
    console.error('❌ Add service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding service',
      error: error.message
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('📋 Fetching services for user:', userId);

    // Get or create freelancer profile first
    await getOrCreateFreelancerProfile(userId);

    const freelancerProfile = await FreelancerProfile.findOne({ user: userId })
      .select('services');

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    console.log('✅ Services fetched:', freelancerProfile.services.length);

    res.status(200).json({
      success: true,
      data: freelancerProfile.services
    });

  } catch (error) {
    console.error('❌ Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services',
      error: error.message
    });
  }
};

// Get public freelancer profile
exports.getPublicProfile = async (req, res) => {
  try {
    const { usernameOrId } = req.params;

    console.log('🌐 Fetching public profile for:', usernameOrId);

    const freelancerProfile = await FreelancerProfile.findOne({
      $or: [
        { _id: usernameOrId },
        { user: usernameOrId }
      ]
    })
    .populate('user', 'name avatar bio location skills portfolio socialLinks website experience education dateOfBirth gender')
    .select('-user.passwordHash -user.loginAttempts -user.lockUntil');

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Transform portfolio items for public view
    const userData = freelancerProfile.user.toObject();
    if (userData.portfolio) {
      userData.portfolio = userData.portfolio.map(item => ({
        ...item,
        mediaUrls: item.mediaUrl ? [item.mediaUrl] : []
      }));
    }

    // Calculate age for public view
    if (userData.dateOfBirth) {
      userData.age = calculateAge(userData.dateOfBirth);
    }

    // Increment profile views
    await FreelancerProfile.findByIdAndUpdate(freelancerProfile._id, {
      $inc: { profileViews: 1 }
    });

    console.log('✅ Public profile fetched:', freelancerProfile._id);

    res.status(200).json({
      success: true,
      data: {
        ...freelancerProfile.toObject(),
        user: userData
      }
    });

  } catch (error) {
    console.error('❌ Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching public profile',
      error: error.message
    });
  }
};

// Upload portfolio files handler - FIXED
exports.uploadPortfolioFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log('📤 Uploading portfolio files:', req.files.length);

    const fileUrls = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: getFileUrl(file.filename, 'portfolio'),
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    console.log('✅ Portfolio files uploaded successfully');

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: fileUrls
    });

  } catch (error) {
    console.error('❌ Upload portfolio files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading files',
      error: error.message
    });
  }
};

// Upload avatar handler - FIXED
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📤 Uploading avatar for user:', req.user._id);

    const avatarUrl = getFileUrl(req.file.filename, 'avatars');

    // Update user's avatar in database
    await User.findByIdAndUpdate(req.user._id, {
      $set: { avatar: avatarUrl }
    });

    // Recalculate profile completeness
    const user = await User.findById(req.user._id);
    const freelancerProfile = await getOrCreateFreelancerProfile(req.user._id);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

    console.log('✅ Avatar uploaded successfully');

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
        filename: req.file.filename,
        size: req.file.size
      },
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading avatar',
      error: error.message
    });
  }
};

// @desc    Get tenders for freelancers with filters
// @route   GET /api/v1/freelancer/tenders
// @access  Private (Freelancer)
exports.getTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minBudget,
      maxBudget,
      skills,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('📋 Fetching tenders for freelancer:', req.user._id);

    // Build filter for published tenders that are still open
    const filter = {
      status: { $in: ['published', 'open'] },
      deadline: { $gt: new Date() }
    };

    // Apply filters
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.min = { $gte: Number(minBudget) };
      if (maxBudget) filter.budget.max = { $lte: Number(maxBudget) };
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      filter.skillsRequired = { 
        $in: skillsArray.map(skill => new RegExp(skill.trim(), 'i')) 
      };
    }

    // Execute query with pagination
    const tenders = await Tender.find(filter)
      .populate('company', 'name logo industry verified')
      .populate('organization', 'name logo industry verified')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Tender.countDocuments(filter);

    // Check which tenders are saved by this freelancer
    const tendersWithSaveStatus = tenders.map(tender => ({
      ...tender,
      isSaved: tender.metadata?.savedBy?.includes(req.user._id.toString()) || false
    }));

    console.log(`✅ Found ${tenders.length} tenders for freelancer`);

    res.json({
      success: true,
      data: tendersWithSaveStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tenders',
      error: error.message
    });
  }
};

// @desc    Get single tender details for freelancer
// @route   GET /api/v1/freelancer/tenders/:id
// @access  Private (Freelancer)
exports.getTenderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching tender details:', id);

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const tender = await Tender.findById(id)
      .populate('company', 'name logo industry description website verified')
      .populate('organization', 'name logo industry description website verified')
      .populate('createdBy', 'name email');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender is accessible to freelancer
    if (tender.status !== 'published' && tender.status !== 'open') {
      return res.status(403).json({
        success: false,
        message: 'This tender is not currently available'
      });
    }

    if (tender.deadline <= new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This tender has expired'
      });
    }

    // Increment views
    await tender.incrementViews();

    // Check if tender is saved by this freelancer
    const isSaved = tender.metadata.savedBy.includes(req.user._id.toString());

    // Prepare response data
    const tenderData = {
      ...tender.toObject(),
      isSaved,
      canSubmitProposal: tender.canSubmitProposal(req.user._id)
    };

    console.log('✅ Tender details fetched successfully');

    res.json({
      success: true,
      data: tenderData
    });

  } catch (error) {
    console.error('❌ Get tender details error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching tender details',
      error: error.message
    });
  }
};

// @desc    Toggle save/unsave tender
// @route   POST /api/v1/freelancer/tenders/:id/save
// @access  Private (Freelancer)
exports.toggleSaveTender = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('💾 Toggle save tender:', id);

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required'
      });
    }

    const tender = await Tender.findById(id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    // Check if tender is published and active
    if (tender.status !== 'published' && tender.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an inactive tender'
      });
    }

    if (tender.deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an expired tender'
      });
    }

    const isSaved = tender.metadata.savedBy.includes(req.user._id.toString());

    if (isSaved) {
      // Unsaved tender
      tender.metadata.savedBy.pull(req.user._id);
    } else {
      // Save tender
      tender.metadata.savedBy.push(req.user._id);
    }

    await tender.save();

    console.log(`✅ Tender ${isSaved ? 'unsaved' : 'saved'} successfully`);

    res.json({
      success: true,
      message: isSaved ? 'Tender removed from saved list' : 'Tender saved successfully',
      data: { 
        saved: !isSaved,
        tenderId: tender._id,
        totalSaves: tender.metadata.savedBy.length 
      }
    });

  } catch (error) {
    console.error('❌ Toggle save tender error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error saving tender',
      error: error.message
    });
  }
};

// @desc    Get saved tenders
// @route   GET /api/v1/freelancer/tenders/saved/all
// @access  Private (Freelancer)
exports.getSavedTenders = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    console.log('📚 Fetching saved tenders for freelancer:', req.user._id);

    const tenders = await Tender.find({
      'metadata.savedBy': req.user._id,
      status: { $in: ['published', 'open'] },
      deadline: { $gt: new Date() }
    })
    .populate('company', 'name logo industry verified')
    .populate('organization', 'name logo industry verified')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

    const total = await Tender.countDocuments({
      'metadata.savedBy': req.user._id,
      status: { $in: ['published', 'open'] },
      deadline: { $gt: new Date() }
    });

    // Mark all as saved since they're from saved list
    const tendersWithSaveStatus = tenders.map(tender => ({
      ...tender,
      isSaved: true
    }));

    console.log(`✅ Found ${tenders.length} saved tenders`);

    res.json({
      success: true,
      data: tendersWithSaveStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get saved tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching saved tenders',
      error: error.message
    });
  }
};

// Certification Management - FIXED delete function
exports.getCertifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📜 Fetching certifications for user:', userId);

    const freelancerProfile = await FreelancerProfile.findOne({ user: userId })
      .select('certifications');

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    console.log('✅ Certifications fetched:', freelancerProfile.certifications.length);

    res.status(200).json({
      success: true,
      data: freelancerProfile.certifications
    });

  } catch (error) {
    console.error('❌ Get certifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching certifications',
      error: error.message
    });
  }
};

exports.addCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const certificationData = req.body;

    console.log('➕ Adding certification for user:', userId);

    // Get or create freelancer profile first
    await getOrCreateFreelancerProfile(userId);

    const freelancerProfile = await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          certifications: certificationData
        }
      },
      { new: true, runValidators: true }
    );

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Recalculate profile completeness
    const user = await User.findById(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    // Update completion percentage
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    const newCertification = freelancerProfile.certifications[freelancerProfile.certifications.length - 1];
    console.log('✅ Certification added:', newCertification._id);

    res.status(201).json({
      success: true,
      message: 'Certification added successfully',
      data: newCertification,
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Add certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding certification',
      error: error.message
    });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    console.log('✏️ Updating certification:', id);

    const freelancerProfile = await FreelancerProfile.findOne({ user: userId });

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    const certification = freelancerProfile.certifications.id(id);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }

    // Update certification fields
    Object.keys(updateData).forEach(key => {
      certification[key] = updateData[key];
    });

    await freelancerProfile.save();

    // Recalculate profile completeness
    const user = await User.findById(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    // Update completion percentage
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    console.log('✅ Certification updated:', id);

    res.status(200).json({
      success: true,
      message: 'Certification updated successfully',
      data: certification,
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Update certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating certification',
      error: error.message
    });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    console.log('🗑️ Deleting certification:', id);

    // FIXED: Use findOneAndUpdate with $pull instead of .remove()
    const freelancerProfile = await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { 
        $pull: { 
          certifications: { _id: id } 
        } 
      },
      { new: true }
    );

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

    // Check if certification was actually removed
    const certificationExists = freelancerProfile.certifications.some(cert => cert._id.toString() === id);
    if (certificationExists) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }

    // Recalculate profile completeness
    const user = await User.findById(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    // Update completion percentage
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    console.log('✅ Certification deleted:', id);

    res.status(200).json({
      success: true,
      message: 'Certification deleted successfully',
      profileCompletion
    });

  } catch (error) {
    console.error('❌ Delete certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting certification',
      error: error.message
    });
  }
};

// NEW: Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// UPDATED: Profile strengths with age and gender
function getProfileStrengths(freelancerProfile, user) {
  const strengths = [];
  if (freelancerProfile.headline) strengths.push('Professional headline');
  if (freelancerProfile.bio) strengths.push('Detailed bio');
  if (user.portfolio?.length >= 3) strengths.push('Portfolio with 3+ items');
  if (user.skills?.length >= 5) strengths.push('5+ skills listed');
  if (freelancerProfile.hourlyRate > 0) strengths.push('Hourly rate set');
  if (user.avatar) strengths.push('Profile photo');
  if (freelancerProfile.specialization?.length > 0) strengths.push('Specializations defined');
  if (freelancerProfile.services?.length > 0) strengths.push('Services defined');
  if (user.socialLinks && Object.values(user.socialLinks).filter(link => link).length >= 2) {
    strengths.push('Social profiles added');
  }
  // NEW: Age and gender strengths
  if (user.dateOfBirth) strengths.push('Date of birth provided');
  if (user.gender && user.gender !== 'prefer-not-to-say') strengths.push('Gender specified');
  return strengths;
}

// UPDATED: Profile suggestions with age and gender
function getProfileSuggestions(freelancerProfile, user) {
  const suggestions = [];
  if (!freelancerProfile.headline) suggestions.push('Add a professional headline');
  if (!freelancerProfile.bio) suggestions.push('Write a detailed bio about your services');
  if (user.portfolio?.length < 3) suggestions.push('Upload at least 3 portfolio items');
  if (user.skills?.length < 5) suggestions.push('List 5+ relevant skills');
  if (freelancerProfile.hourlyRate === 0) suggestions.push('Set your hourly rate');
  if (!user.avatar) suggestions.push('Upload a professional profile photo');
  if (freelancerProfile.specialization?.length === 0) suggestions.push('Define your specializations');
  if (freelancerProfile.services?.length === 0) suggestions.push('Define your services');
  if (!user.socialLinks || Object.values(user.socialLinks).filter(link => link).length < 2) {
    suggestions.push('Add at least 2 social media profiles');
  }
  // NEW: Age and gender suggestions
  if (!user.dateOfBirth) suggestions.push('Add your date of birth');
  if (!user.gender || user.gender === 'prefer-not-to-say') suggestions.push('Specify your gender');
  return suggestions;
}

// UPDATED: Prepare profile data with age and gender
async function prepareProfileData(user, freelancerProfile) {
  const transformedPortfolio = (user.portfolio || []).map(item => ({
    ...item.toObject(),
    mediaUrls: item.mediaUrl ? [item.mediaUrl] : []
  }));

  // Transform skills for frontend (convert strings to objects if needed)
  const transformedSkills = (user.skills || []).map(skill => 
    typeof skill === 'string' ? { name: skill, level: 'intermediate', yearsOfExperience: 1 } : skill
  );

  // Calculate real profile completeness
  const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

  // Calculate age
  const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : null;

  // Combine data according to your model structure
  const profileData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    location: user.location,
    phone: user.phone,
    website: user.website,
    avatar: user.avatar,
    dateOfBirth: user.dateOfBirth, // NEW
    gender: user.gender, // NEW
    age: age, // NEW: Calculated age
    skills: transformedSkills,
    experience: user.experience || [],
    education: user.education || [],
    profileCompleted: user.profileCompleted || false,
    verificationStatus: user.verificationStatus || 'none',
    portfolio: transformedPortfolio,
    socialLinks: user.socialLinks || {},
    freelancerProfile: {
      headline: freelancerProfile.headline,
      hourlyRate: freelancerProfile.hourlyRate,
      availability: freelancerProfile.availability,
      experienceLevel: freelancerProfile.experienceLevel,
      englishProficiency: freelancerProfile.englishProficiency,
      timezone: freelancerProfile.timezone,
      specialization: freelancerProfile.specialization || [],
      services: freelancerProfile.services || [],
      profileCompletion: profileCompletion,
      totalEarnings: freelancerProfile.totalEarnings || 0,
      successRate: freelancerProfile.successRate || 0,
      ratings: freelancerProfile.ratings || { average: 0, count: 0 },
      verified: freelancerProfile.verified || false,
      profileViews: freelancerProfile.profileViews || 0
    }
  };

  return profileData;
}

// Mock functions for job and proposal counts (you'll need to implement these based on your database)
async function getTotalJobs(userId) {
  // Implement based on your job/proposal model
  // For now, return mock data
  return Math.floor(Math.random() * 20);
}

async function getActiveProposals(userId) {
  // Implement based on your proposal model
  // For now, return mock data
  return Math.floor(Math.random() * 5);
}

// Helper functions
async function getRecentActivities(userId) {
  // This would fetch from an activities collection
  // For now, return mock data
  return [
    {
      id: '1',
      type: 'profile',
      title: 'Profile Updated',
      description: 'You updated your professional information',
      timestamp: new Date().toISOString(),
      status: 'success'
    },
    {
      id: '2',
      type: 'portfolio',
      title: 'Portfolio Item Added',
      description: 'You added a new project to your portfolio',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      status: 'success'
    }
  ];
}