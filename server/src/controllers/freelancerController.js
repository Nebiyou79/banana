const User = require('../models/User');
const FreelancerProfile = require('../models/Freelancer');
const { uploadConfig, processFileInfo } = require('../middleware/fileUploadMiddleware');
const Tender = require('../models/Tender');

// Helper function to ensure Cloudinary URLs
const ensureCloudinaryUrl = (url) => {
  if (!url) return '';
  // If it's already a Cloudinary URL, return it
  if (url.includes('cloudinary.com')) {
    return url;
  }
  // If it's a local URL, return empty string (we won't serve local files)
  return '';
};

// Transform portfolio item for frontend
const transformPortfolioItem = (item) => {
  const itemObj = item.toObject ? item.toObject() : item;
  const mediaUrl = itemObj.mediaUrl || '';
  const cloudinaryUrl = ensureCloudinaryUrl(mediaUrl);
  
  return {
    ...itemObj,
    mediaUrl: cloudinaryUrl,
    mediaUrls: cloudinaryUrl ? [cloudinaryUrl] : [],
    isCloudinary: !!cloudinaryUrl
  };
};

// Profile completeness calculation
const calculateProfileCompleteness = (user, freelancerProfile) => {
  const completenessWeights = {
    basicInfo: {
      weight: 25,
      checks: [
        { condition: user.name && user.name.trim().length > 0, points: 20 },
        { condition: user.email, points: 20 },
        { condition: user.avatar && user.avatar.includes('cloudinary.com'), points: 20 },
        { condition: user.dateOfBirth, points: 20 },
        { condition: user.gender && user.gender !== 'prefer-not-to-say', points: 20 }
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
        { condition: user.portfolio && user.portfolio.filter(p => p.mediaUrl && p.mediaUrl.includes('cloudinary.com')).length >= 2, points: 50 }
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
      weight: 5,
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

// Get or create freelancer profile
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

// Get freelancer dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    console.log('📊 Fetching dashboard for user:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        code: 'USER_ID_REQUIRED'
      });
    }

    const user = await User.findById(userId).select('portfolio skills name email avatar experience education socialLinks dateOfBirth gender');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const freelancerProfile = await getOrCreateFreelancerProfile(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

    // Filter portfolio to only include Cloudinary URLs
    const cloudinaryPortfolio = user.portfolio ? user.portfolio.filter(item => 
      item.mediaUrl && item.mediaUrl.includes('cloudinary.com')
    ) : [];

    const stats = {
      profile: {
        completion: profileCompletion,
        views: freelancerProfile.profileViews || 0,
        verified: freelancerProfile.verified || false
      },
      portfolio: {
        total: cloudinaryPortfolio.length,
        featured: cloudinaryPortfolio.filter(item => item.featured).length
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
      demographics: {
        age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
        gender: user.gender || 'prefer-not-to-say'
      }
    };

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
      },
      code: 'DASHBOARD_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      code: 'DASHBOARD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Professional freelancer stats
exports.getFreelancerStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    const freelancerProfile = await FreelancerProfile.findOne({ user: userId })
      .populate('user', 'name avatar portfolio skills experience education socialLinks dateOfBirth gender');
    
    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    const user = freelancerProfile.user;
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    // Filter portfolio to only include Cloudinary URLs
    const cloudinaryPortfolio = user.portfolio ? user.portfolio.filter(item => 
      item.mediaUrl && item.mediaUrl.includes('cloudinary.com')
    ) : [];
    
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
      age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : null,
      gender: user.gender || 'prefer-not-to-say',
      portfolioCount: cloudinaryPortfolio.length
    };

    res.status(200).json({
      success: true,
      data: stats,
      code: 'STATS_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get freelancer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching freelancer stats',
      code: 'STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get complete freelancer profile - CLOUDINARY ONLY
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    console.log('👤 Fetching profile for user:', userId);

    const user = await User.findById(userId).select('-passwordHash -loginAttempts -lockUntil');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const freelancerProfile = await getOrCreateFreelancerProfile(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    const profileData = await prepareProfileData(user, freelancerProfile);

    res.status(200).json({
      success: true,
      data: profileData,
      code: 'PROFILE_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      code: 'PROFILE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update the updateProfile function to handle socialLinks
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const updateData = req.body;

    console.log('🔄 Updating profile for user:', userId);

    // Validate date of birth
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      
      if (dob > maxDate) {
        return res.status(400).json({
          success: false,
          message: 'You must be at least 16 years old',
          code: 'INVALID_DOB'
        });
      }
      if (dob < minDate) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid date of birth',
          code: 'INVALID_DOB'
        });
      }
    }

    // Validate gender
    if (updateData.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(updateData.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid gender option',
        code: 'INVALID_GENDER'
      });
    }

    // Transform skills
    if (updateData.skills && Array.isArray(updateData.skills)) {
      updateData.skills = updateData.skills.map(skill => 
        typeof skill === 'object' ? skill.name : skill
      );
    }

    // Clean social links - NEW
    if (updateData.socialLinks) {
      Object.keys(updateData.socialLinks).forEach(key => {
        if (!updateData.socialLinks[key] || updateData.socialLinks[key].trim() === '') {
          updateData.socialLinks[key] = undefined;
        }
      });
    }

    const user = await User.findById(userId);
    let freelancerProfile = await getOrCreateFreelancerProfile(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Separate update data
    const userUpdateData = {};
    const freelancerUpdateData = {};

    const userFields = ['name', 'bio', 'location', 'phone', 'website', 'avatar', 'skills', 'experience', 'education', 'dateOfBirth', 'gender'];
    const freelancerFields = ['headline', 'hourlyRate', 'availability', 'experienceLevel', 'englishProficiency', 'timezone', 'specialization', 'services', 'socialLinks']; // ADDED socialLinks

    Object.keys(updateData).forEach(key => {
      if (userFields.includes(key)) {
        userUpdateData[key] = updateData[key];
      } else if (freelancerFields.includes(key)) {
        freelancerUpdateData[key] = updateData[key];
      } else if (key === 'freelancerProfile' && typeof updateData[key] === 'object') {
        Object.keys(updateData[key]).forEach(profileKey => {
          if (freelancerFields.includes(profileKey)) {
            freelancerUpdateData[profileKey] = updateData[key][profileKey];
          }
        });
      }
    });

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
        message: 'User or freelancer profile not found',
        code: 'UPDATE_FAILED'
      });
    }

    // Calculate age
    const age = updatedUser.dateOfBirth ? calculateAge(updatedUser.dateOfBirth) : null;

    // Calculate profile completeness
    const profileCompletion = calculateProfileCompleteness(updatedUser, updatedFreelancerProfile);
    
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

    const profileData = await prepareProfileData(updatedUser, updatedFreelancerProfile);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData,
      profileCompletion,
      age, // Return age
      code: 'PROFILE_UPDATED'
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      code: 'PROFILE_UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update prepareProfileData function
async function prepareProfileData(user, freelancerProfile) {
  // Only include Cloudinary portfolio items
  const cloudinaryPortfolio = (user.portfolio || []).filter(item => 
    item.mediaUrl && item.mediaUrl.includes('cloudinary.com')
  );
  
  const transformedPortfolio = cloudinaryPortfolio.map(item => transformPortfolioItem(item));

  const transformedSkills = (user.skills || []).map(skill => 
    typeof skill === 'string' ? { name: skill, level: 'intermediate', yearsOfExperience: 1 } : skill
  );

  const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
  const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : null;

  const profileData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    location: user.location,
    phone: user.phone,
    website: user.website,
    avatar: user.avatar && user.avatar.includes('cloudinary.com') ? user.avatar : '',
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    age: age, // Make sure age is included
    skills: transformedSkills,
    experience: user.experience || [],
    education: user.education || [],
    profileCompleted: user.profileCompleted || false,
    verificationStatus: user.verificationStatus || 'none',
    portfolio: transformedPortfolio,
    socialLinks: freelancerProfile.socialLinks || {}, // Use freelancerProfile socialLinks
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
      profileViews: freelancerProfile.profileViews || 0,
      socialLinks: freelancerProfile.socialLinks || {} // Include socialLinks here too
    }
  };

  return profileData;
}

// Portfolio Management - CLOUDINARY ONLY
exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { page = 1, limit = 10, featured, category } = req.query;

    console.log('📁 Fetching portfolio for user:', userId);

    const user = await User.findById(userId).select('portfolio');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get all portfolio items
    let portfolioItems = user.portfolio || [];
    
    // Filter to only include items with Cloudinary URLs
    const cloudinaryItems = portfolioItems.filter(item => 
      item.mediaUrl && item.mediaUrl.includes('cloudinary.com')
    );
    
    // Transform each item for frontend
    const transformedItems = cloudinaryItems.map(item => {
      const itemObj = item.toObject ? item.toObject() : item;
      return {
        ...itemObj,
        // Use stored mediaUrls array if available, otherwise create from mediaUrl
        mediaUrls: itemObj.mediaUrls || (itemObj.mediaUrl ? [itemObj.mediaUrl] : []),
        isCloudinary: true
      };
    });

    // Apply filters
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
    filteredItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    console.log(`📊 Returning ${paginatedItems.length} of ${filteredItems.length} portfolio items`);

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
      },
      code: 'PORTFOLIO_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching portfolio',
      code: 'PORTFOLIO_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Get single portfolio item by ID
exports.getPortfolioItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;

    console.log('🔍 Fetching portfolio item:', id, 'for user:', userId);

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Portfolio item ID is required',
        code: 'INVALID_PORTFOLIO_ID'
      });
    }

    const user = await User.findById(userId).select('portfolio');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Find the specific portfolio item
    const portfolioItem = user.portfolio.id(id);
    
    if (!portfolioItem) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found',
        code: 'PORTFOLIO_ITEM_NOT_FOUND'
      });
    }

    // Transform the item for frontend
    const itemObj = portfolioItem.toObject();
    const transformedItem = {
      ...itemObj,
      mediaUrls: itemObj.mediaUrls || (itemObj.mediaUrl ? [itemObj.mediaUrl] : []),
      isCloudinary: true
    };

    console.log('✅ Portfolio item found:', transformedItem.title);

    res.status(200).json({
      success: true,
      data: transformedItem,
      code: 'PORTFOLIO_ITEM_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get portfolio item error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid portfolio item ID',
        code: 'INVALID_PORTFOLIO_ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching portfolio item',
      code: 'PORTFOLIO_ITEM_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Portfolio Management - CLOUDINARY ONLY - FIXED for multiple images
exports.addPortfolioItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const portfolioData = req.body;

    console.log('➕ Adding portfolio item for user:', userId);
    console.log('📦 Received data:', portfolioData);

    // Handle multiple media URLs - now expecting an array
    let mediaUrls = [];
    
    if (portfolioData.mediaUrls && Array.isArray(portfolioData.mediaUrls)) {
      mediaUrls = portfolioData.mediaUrls.filter(url => url && url.includes('cloudinary.com'));
    } else if (portfolioData.mediaUrl) {
      // Backward compatibility - single URL
      mediaUrls = [portfolioData.mediaUrl].filter(url => url && url.includes('cloudinary.com'));
    }
    
    if (mediaUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid Cloudinary URL is required',
        code: 'MEDIA_URL_REQUIRED'
      });
    }

    // Validate all URLs are from Cloudinary
    const invalidUrls = mediaUrls.filter(url => !url.includes('cloudinary.com'));
    if (invalidUrls.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Only Cloudinary URLs are allowed. Please upload via Cloudinary first.',
        code: 'INVALID_MEDIA_URL'
      });
    }

    // Prepare data for database - store first URL as mediaUrl for backward compatibility
    // but also store all URLs in a new field
    const transformedData = {
      title: portfolioData.title,
      description: portfolioData.description,
      mediaUrl: mediaUrls[0], // Keep first for backward compatibility
      mediaUrls: mediaUrls, // Store all URLs in an array
      projectUrl: portfolioData.projectUrl || '',
      category: portfolioData.category || '',
      technologies: portfolioData.technologies || [],
      budget: portfolioData.budget || undefined,
      budgetType: portfolioData.budgetType || 'fixed',
      duration: portfolioData.duration || '',
      client: portfolioData.client || '',
      completionDate: portfolioData.completionDate || '',
      featured: portfolioData.featured || false,
      visibility: portfolioData.visibility || 'public'
    };

    console.log('💾 Saving portfolio item with multiple images:', mediaUrls.length);

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
        message: 'User not found',
        code: 'USER_NOT_FOUND'
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
      mediaUrls: newItem.mediaUrls || (newItem.mediaUrl ? [newItem.mediaUrl] : []),
      isCloudinary: true
    };

    console.log('✅ Portfolio item added successfully with', frontendItem.mediaUrls.length, 'images');

    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      data: frontendItem,
      profileCompletion,
      code: 'PORTFOLIO_ITEM_ADDED'
    });

  } catch (error) {
    console.error('❌ Add portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding portfolio item',
      code: 'PORTFOLIO_ADD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updatePortfolioItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    console.log('✏️ Updating portfolio item:', id);
    console.log('📦 Update data:', updateData);

    // Handle multiple media URLs
    let mediaUrls = [];
    if (updateData.mediaUrls && Array.isArray(updateData.mediaUrls)) {
      mediaUrls = updateData.mediaUrls.filter(url => url && url.includes('cloudinary.com'));
    }

    // Validate Cloudinary URLs if media is being updated
    if (mediaUrls.length > 0) {
      const invalidUrls = mediaUrls.filter(url => !url.includes('cloudinary.com'));
      if (invalidUrls.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Only Cloudinary URLs are allowed. Please upload via Cloudinary first.',
          code: 'INVALID_MEDIA_URL'
        });
      }
    }

    // Build update object
    const updateFields = {};
    
    if (updateData.title) updateFields['portfolio.$.title'] = updateData.title;
    if (updateData.description) updateFields['portfolio.$.description'] = updateData.description;
    if (mediaUrls.length > 0) {
      updateFields['portfolio.$.mediaUrl'] = mediaUrls[0]; // Keep first for backward compatibility
      updateFields['portfolio.$.mediaUrls'] = mediaUrls; // Store all URLs
    }
    if (updateData.projectUrl !== undefined) updateFields['portfolio.$.projectUrl'] = updateData.projectUrl;
    if (updateData.category !== undefined) updateFields['portfolio.$.category'] = updateData.category;
    if (updateData.technologies) updateFields['portfolio.$.technologies'] = updateData.technologies;
    if (updateData.budget !== undefined) updateFields['portfolio.$.budget'] = updateData.budget;
    if (updateData.budgetType) updateFields['portfolio.$.budgetType'] = updateData.budgetType;
    if (updateData.duration !== undefined) updateFields['portfolio.$.duration'] = updateData.duration;
    if (updateData.client !== undefined) updateFields['portfolio.$.client'] = updateData.client;
    if (updateData.completionDate !== undefined) updateFields['portfolio.$.completionDate'] = updateData.completionDate;
    if (updateData.featured !== undefined) updateFields['portfolio.$.featured'] = updateData.featured;
    if (updateData.visibility) updateFields['portfolio.$.visibility'] = updateData.visibility;
    
    updateFields['portfolio.$.updatedAt'] = new Date();

    const user = await User.findOneAndUpdate(
      { _id: userId, 'portfolio._id': id },
      {
        $set: updateFields
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('portfolio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio item not found',
        code: 'PORTFOLIO_ITEM_NOT_FOUND'
      });
    }

    const updatedItem = user.portfolio.id(id);
    
    // Transform back for frontend
    const frontendItem = {
      ...updatedItem.toObject(),
      mediaUrls: updatedItem.mediaUrls || (updatedItem.mediaUrl ? [updatedItem.mediaUrl] : []),
      isCloudinary: true
    };

    console.log('✅ Portfolio item updated successfully with', frontendItem.mediaUrls.length, 'images');

    res.status(200).json({
      success: true,
      message: 'Portfolio item updated successfully',
      data: frontendItem,
      code: 'PORTFOLIO_ITEM_UPDATED'
    });

  } catch (error) {
    console.error('❌ Update portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating portfolio item',
      code: 'PORTFOLIO_UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deletePortfolioItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
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
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Recalculate profile completeness
    const freelancerProfile = await getOrCreateFreelancerProfile(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    res.status(200).json({
      success: true,
      message: 'Portfolio item deleted successfully',
      data: user.portfolio,
      profileCompletion,
      code: 'PORTFOLIO_ITEM_DELETED'
    });

  } catch (error) {
    console.error('❌ Delete portfolio item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting portfolio item',
      code: 'PORTFOLIO_DELETE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Services Management
exports.addService = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const serviceData = req.body;

    console.log('➕ Adding service for user:', userId);

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
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    const newService = freelancerProfile.services[freelancerProfile.services.length - 1];

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: newService,
      code: 'SERVICE_ADDED'
    });

  } catch (error) {
    console.error('❌ Add service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding service',
      code: 'SERVICE_ADD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    console.log('📋 Fetching services for user:', userId);

    await getOrCreateFreelancerProfile(userId);

    const freelancerProfile = await FreelancerProfile.findOne({ user: userId })
      .select('services');

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: freelancerProfile.services,
      code: 'SERVICES_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services',
      code: 'SERVICES_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    const userData = freelancerProfile.user.toObject();
    
    // Only include Cloudinary portfolio items
    if (userData.portfolio) {
      userData.portfolio = userData.portfolio
        .filter(item => item.mediaUrl && item.mediaUrl.includes('cloudinary.com'))
        .map(item => transformPortfolioItem(item));
    }

    if (userData.avatar && !userData.avatar.includes('cloudinary.com')) {
      userData.avatar = '';
    }

    if (userData.dateOfBirth) {
      userData.age = calculateAge(userData.dateOfBirth);
    }

    await FreelancerProfile.findByIdAndUpdate(freelancerProfile._id, {
      $inc: { profileViews: 1 }
    });

    res.status(200).json({
      success: true,
      data: {
        ...freelancerProfile.toObject(),
        user: userData
      },
      code: 'PUBLIC_PROFILE_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching public profile',
      code: 'PUBLIC_PROFILE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Upload portfolio files handler - CLOUDINARY ONLY - FIXED
exports.uploadPortfolioFiles = async (req, res) => {
  try {
    console.log('📤 [Controller] UploadPortfolioFiles called');
    console.log('📦 [Controller] req.cloudinaryMedia:', req.cloudinaryMedia ? 'Present' : 'Not present');
    console.log('📦 [Controller] req.files:', req.files ? `${req.files.length} files` : 'No files');
    console.log('📦 [Controller] req.file:', req.file ? 'Single file' : 'No single file');
    
    // Check if Cloudinary middleware attached data
    if (!req.cloudinaryMedia) {
      console.error('❌ [Controller] No cloudinaryMedia object found in request');
      
      // If we have req.files but no cloudinaryMedia, something went wrong with the middleware
      if (req.files && req.files.length > 0) {
        console.error('❌ [Controller] Files present but no cloudinaryMedia. Middleware may not be configured correctly.');
        return res.status(500).json({
          success: false,
          message: 'Cloudinary upload middleware failed to process files',
          code: 'CLOUDINARY_MIDDLEWARE_FAILED',
          debug: {
            filesCount: req.files.length,
            hasCloudinaryMedia: false
          }
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'No files uploaded or Cloudinary upload failed',
        code: 'CLOUDINARY_MIDDLEWARE_MISSING'
      });
    }

    const { media, successful, failed } = req.cloudinaryMedia;
    
    console.log('📊 [Controller] Cloudinary upload results:', {
      total: media?.length || 0,
      successful,
      failed,
      hasMedia: !!media
    });

    if (!media || media.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded successfully',
        code: 'NO_FILES_UPLOADED'
      });
    }

    // Extract successful uploads with Cloudinary URLs
    const fileUrls = media
      .filter(item => item.success !== false && item.cloudinary?.secure_url)
      .map(item => {
        const cloudinaryUrl = item.cloudinary.secure_url;
        console.log('✅ [Controller] Cloudinary URL:', cloudinaryUrl);
        
        return {
          filename: item.cloudinary.public_id || `portfolio-${Date.now()}`,
          originalName: item.originalName,
          url: cloudinaryUrl,
          path: cloudinaryUrl,
          size: item.size,
          mimetype: item.mimetype,
          uploadedAt: new Date().toISOString(),
          isCloudinary: true,
          cloudinary: {
            public_id: item.cloudinary.public_id,
            secure_url: item.cloudinary.secure_url,
            format: item.cloudinary.format,
            width: item.cloudinary.width,
            height: item.cloudinary.height
          }
        };
      });

    if (fileUrls.length === 0) {
      console.error('❌ [Controller] No valid Cloudinary URLs found in upload results');
      return res.status(500).json({
        success: false,
        message: 'No valid Cloudinary URLs generated',
        code: 'NO_CLOUDINARY_URLS',
        debug: {
          mediaItems: media.map(m => ({
            hasCloudinary: !!m.cloudinary,
            hasSecureUrl: !!(m.cloudinary && m.cloudinary.secure_url),
            success: m.success
          }))
        }
      });
    }

    console.log(`✅ [Controller] Successfully processed ${fileUrls.length} Cloudinary URLs`);
    console.log('📎 [Controller] First URL:', fileUrls[0]?.url);

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully to Cloudinary',
      data: fileUrls,
      code: 'FILES_UPLOADED'
    });

  } catch (error) {
    console.error('❌ [Controller] Upload portfolio files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading files to Cloudinary',
      code: 'FILE_UPLOAD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Upload avatar handler - CLOUDINARY ONLY
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    console.log('📤 Uploading avatar to Cloudinary for user:', req.user.userId || req.user._id);

    const fileInfo = processFileInfo(req.file, 'avatars');

    // Only save Cloudinary URLs
    if (!fileInfo.url.includes('cloudinary.com')) {
      throw new Error('Avatar must be uploaded to Cloudinary');
    }

    await User.findByIdAndUpdate(req.user.userId || req.user._id, {
      $set: { avatar: fileInfo.url }
    });

    const user = await User.findById(req.user.userId || req.user._id);
    const freelancerProfile = await getOrCreateFreelancerProfile(req.user.userId || req.user._id);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);

    console.log('✅ Avatar uploaded to Cloudinary successfully');

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully to Cloudinary',
      data: {
        avatarUrl: fileInfo.url,
        filename: req.file.filename,
        size: req.file.size,
        path: fileInfo.path
      },
      profileCompletion,
      code: 'AVATAR_UPLOADED'
    });

  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading avatar to Cloudinary',
      code: 'AVATAR_UPLOAD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get tenders for freelancers
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

    console.log('📋 Fetching tenders for freelancer:', req.user.userId || req.user._id);

    const filter = {
      status: { $in: ['published', 'open'] },
      deadline: { $gt: new Date() }
    };

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

    const tenders = await Tender.find(filter)
      .populate('company', 'name logo industry verified')
      .populate('organization', 'name logo industry verified')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Tender.countDocuments(filter);

    const tendersWithSaveStatus = tenders.map(tender => ({
      ...tender,
      isSaved: tender.metadata?.savedBy?.includes(req.user.userId?.toString() || req.user._id?.toString()) || false
    }));

    res.json({
      success: true,
      data: tendersWithSaveStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      code: 'TENDERS_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tenders',
      code: 'TENDERS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single tender details for freelancer
exports.getTenderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching tender details:', id);

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required',
        code: 'INVALID_TENDER_ID'
      });
    }

    const tender = await Tender.findById(id)
      .populate('company', 'name logo industry description website verified')
      .populate('organization', 'name logo industry description website verified')
      .populate('createdBy', 'name email');

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found',
        code: 'TENDER_NOT_FOUND'
      });
    }

    if (tender.status !== 'published' && tender.status !== 'open') {
      return res.status(403).json({
        success: false,
        message: 'This tender is not currently available',
        code: 'TENDER_UNAVAILABLE'
      });
    }

    if (tender.deadline <= new Date()) {
      return res.status(403).json({
        success: false,
        message: 'This tender has expired',
        code: 'TENDER_EXPIRED'
      });
    }

    await tender.incrementViews();

    const isSaved = tender.metadata.savedBy.includes(req.user.userId?.toString() || req.user._id?.toString());

    const tenderData = {
      ...tender.toObject(),
      isSaved,
      canSubmitProposal: tender.canSubmitProposal(req.user.userId || req.user._id)
    };

    res.json({
      success: true,
      data: tenderData,
      code: 'TENDER_DETAILS_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get tender details error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID',
        code: 'INVALID_TENDER_ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching tender details',
      code: 'TENDER_DETAILS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle save/unsave tender
exports.toggleSaveTender = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;

    console.log('💾 Toggle save tender:', id);

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Valid tender ID is required',
        code: 'INVALID_TENDER_ID'
      });
    }

    const tender = await Tender.findById(id);

    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found',
        code: 'TENDER_NOT_FOUND'
      });
    }

    if (tender.status !== 'published' && tender.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an inactive tender',
        code: 'TENDER_INACTIVE'
      });
    }

    if (tender.deadline <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an expired tender',
        code: 'TENDER_EXPIRED'
      });
    }

    const isSaved = tender.metadata.savedBy.includes(userId.toString());

    if (isSaved) {
      tender.metadata.savedBy.pull(userId);
    } else {
      tender.metadata.savedBy.push(userId);
    }

    await tender.save();

    res.json({
      success: true,
      message: isSaved ? 'Tender removed from saved list' : 'Tender saved successfully',
      data: { 
        saved: !isSaved,
        tenderId: tender._id,
        totalSaves: tender.metadata.savedBy.length 
      },
      code: isSaved ? 'TENDER_UNSAVED' : 'TENDER_SAVED'
    });

  } catch (error) {
    console.error('❌ Toggle save tender error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender ID',
        code: 'INVALID_TENDER_ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error saving tender',
      code: 'TENDER_SAVE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get saved tenders
exports.getSavedTenders = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.user.userId || req.user._id;

    console.log('📚 Fetching saved tenders for freelancer:', userId);

    const tenders = await Tender.find({
      'metadata.savedBy': userId,
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
      'metadata.savedBy': userId,
      status: { $in: ['published', 'open'] },
      deadline: { $gt: new Date() }
    });

    const tendersWithSaveStatus = tenders.map(tender => ({
      ...tender,
      isSaved: true
    }));

    res.json({
      success: true,
      data: tendersWithSaveStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      code: 'SAVED_TENDERS_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get saved tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching saved tenders',
      code: 'SAVED_TENDERS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Certification Management
exports.getCertifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    console.log('📜 Fetching certifications for user:', userId);

    const freelancerProfile = await FreelancerProfile.findOne({ user: userId })
      .select('certifications');

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: freelancerProfile.certifications,
      code: 'CERTIFICATIONS_RETRIEVED'
    });

  } catch (error) {
    console.error('❌ Get certifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching certifications',
      code: 'CERTIFICATIONS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.addCertification = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const certificationData = req.body;

    console.log('➕ Adding certification for user:', userId);

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
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    const user = await User.findById(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    const newCertification = freelancerProfile.certifications[freelancerProfile.certifications.length - 1];

    res.status(201).json({
      success: true,
      message: 'Certification added successfully',
      data: newCertification,
      profileCompletion,
      code: 'CERTIFICATION_ADDED'
    });

  } catch (error) {
    console.error('❌ Add certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding certification',
      code: 'CERTIFICATION_ADD_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    console.log('✏️ Updating certification:', id);

    const freelancerProfile = await FreelancerProfile.findOne({ user: userId });

    if (!freelancerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    const certification = freelancerProfile.certifications.id(id);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found',
        code: 'CERTIFICATION_NOT_FOUND'
      });
    }

    Object.keys(updateData).forEach(key => {
      certification[key] = updateData[key];
    });

    await freelancerProfile.save();

    const user = await User.findById(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    res.status(200).json({
      success: true,
      message: 'Certification updated successfully',
      data: certification,
      profileCompletion,
      code: 'CERTIFICATION_UPDATED'
    });

  } catch (error) {
    console.error('❌ Update certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating certification',
      code: 'CERTIFICATION_UPDATE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { id } = req.params;

    console.log('🗑️ Deleting certification:', id);

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
        message: 'Freelancer profile not found',
        code: 'FREELANCER_NOT_FOUND'
      });
    }

    const certificationExists = freelancerProfile.certifications.some(cert => cert._id.toString() === id);
    if (certificationExists) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found',
        code: 'CERTIFICATION_NOT_FOUND'
      });
    }

    const user = await User.findById(userId);
    const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
    
    await FreelancerProfile.findOneAndUpdate(
      { user: userId },
      { $set: { profileCompletion } }
    );

    res.status(200).json({
      success: true,
      message: 'Certification deleted successfully',
      profileCompletion,
      code: 'CERTIFICATION_DELETED'
    });

  } catch (error) {
    console.error('❌ Delete certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting certification',
      code: 'CERTIFICATION_DELETE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get upload statistics
exports.getUploadStats = async (req, res) => {
  try {
    const stats = uploadConfig.getStats();
    
    const freelancerStats = {
      'portfolio': stats['portfolio'] || { files: 0, size: '0 Bytes', sizeBytes: 0 },
      'avatars': stats['avatars'] || { files: 0, size: '0 Bytes', sizeBytes: 0 }
    };

    res.status(200).json({
      success: true,
      data: {
        freelancerStats,
        totalStats: stats.total,
        environment: stats.environment,
        baseDirectory: stats.baseDirectory
      },
      code: 'UPLOAD_STATS_RETRIEVED'
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving upload statistics',
      code: 'UPLOAD_STATS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =====================
// HELPER FUNCTIONS
// =====================

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

function getProfileStrengths(freelancerProfile, user) {
  const strengths = [];
  if (freelancerProfile.headline) strengths.push('Professional headline');
  if (freelancerProfile.bio) strengths.push('Detailed bio');
  
  const cloudinaryPortfolio = user.portfolio ? user.portfolio.filter(p => 
    p.mediaUrl && p.mediaUrl.includes('cloudinary.com')
  ) : [];
  if (cloudinaryPortfolio.length >= 3) strengths.push('Portfolio with 3+ Cloudinary items');
  
  if (user.skills?.length >= 5) strengths.push('5+ skills listed');
  if (freelancerProfile.hourlyRate > 0) strengths.push('Hourly rate set');
  if (user.avatar && user.avatar.includes('cloudinary.com')) strengths.push('Cloudinary profile photo');
  if (freelancerProfile.specialization?.length > 0) strengths.push('Specializations defined');
  if (freelancerProfile.services?.length > 0) strengths.push('Services defined');
  if (user.socialLinks && Object.values(user.socialLinks).filter(link => link).length >= 2) {
    strengths.push('Social profiles added');
  }
  if (user.dateOfBirth) strengths.push('Date of birth provided');
  if (user.gender && user.gender !== 'prefer-not-to-say') strengths.push('Gender specified');
  return strengths;
}

function getProfileSuggestions(freelancerProfile, user) {
  const suggestions = [];
  if (!freelancerProfile.headline) suggestions.push('Add a professional headline');
  if (!freelancerProfile.bio) suggestions.push('Write a detailed bio about your services');
  
  const cloudinaryPortfolio = user.portfolio ? user.portfolio.filter(p => 
    p.mediaUrl && p.mediaUrl.includes('cloudinary.com')
  ) : [];
  if (cloudinaryPortfolio.length < 3) suggestions.push('Upload at least 3 portfolio items to Cloudinary');
  
  if (user.skills?.length < 5) suggestions.push('List 5+ relevant skills');
  if (freelancerProfile.hourlyRate === 0) suggestions.push('Set your hourly rate');
  if (!user.avatar || !user.avatar.includes('cloudinary.com')) suggestions.push('Upload a professional profile photo to Cloudinary');
  if (freelancerProfile.specialization?.length === 0) suggestions.push('Define your specializations');
  if (freelancerProfile.services?.length === 0) suggestions.push('Define your services');
  if (!user.socialLinks || Object.values(user.socialLinks).filter(link => link).length < 2) {
    suggestions.push('Add at least 2 social media profiles');
  }
  if (!user.dateOfBirth) suggestions.push('Add your date of birth');
  if (!user.gender || user.gender === 'prefer-not-to-say') suggestions.push('Specify your gender');
  return suggestions;
}

async function prepareProfileData(user, freelancerProfile) {
  // Only include Cloudinary portfolio items
  const cloudinaryPortfolio = (user.portfolio || []).filter(item => 
    item.mediaUrl && item.mediaUrl.includes('cloudinary.com')
  );
  
  const transformedPortfolio = cloudinaryPortfolio.map(item => transformPortfolioItem(item));

  const transformedSkills = (user.skills || []).map(skill => 
    typeof skill === 'string' ? { name: skill, level: 'intermediate', yearsOfExperience: 1 } : skill
  );

  const profileCompletion = calculateProfileCompleteness(user, freelancerProfile);
  const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : null;

  const profileData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    location: user.location,
    phone: user.phone,
    website: user.website,
    avatar: user.avatar && user.avatar.includes('cloudinary.com') ? user.avatar : '',
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    age: age,
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

async function getTotalJobs(userId) {
  return Math.floor(Math.random() * 20);
}

async function getActiveProposals(userId) {
  return Math.floor(Math.random() * 5);
}

async function getRecentActivities(userId) {
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
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'success'
    }
  ];
}