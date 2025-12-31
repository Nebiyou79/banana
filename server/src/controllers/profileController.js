const Profile = require('../models/Profile');
const User = require('../models/User');
const Connection = require('../models/Connection');
const { uploadToCloudinary } = require('../middleware/upload');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// ========== HELPER FUNCTIONS (DEFINED OUTSIDE THE CLASS) ==========

// Sanitize social links
const sanitizeSocialLinks = (links) => {
  if (!links || typeof links !== 'object') return {};
  const sanitized = { ...links };
  Object.keys(sanitized).forEach(platform => {
    if (sanitized[platform] && typeof sanitized[platform] === 'string') {
      sanitized[platform] = sanitized[platform].trim();
    } else {
      sanitized[platform] = '';
    }
  });
  return sanitized;
};

// Merge notification preferences
const mergeNotificationPreferences = (current, updates) => {
  const merged = {
    email: { ...(current?.email || {}) },
    push: { ...(current?.push || {}) },
    inApp: { ...(current?.inApp || {}) }
  };

  if (updates.email) {
    merged.email = { ...merged.email, ...updates.email };
  }

  if (updates.push) {
    merged.push = { ...merged.push, ...updates.push };
  }

  if (updates.inApp) {
    merged.inApp = { ...merged.inApp, ...updates.inApp };
  }

  return merged;
};

// Update role-specific fields
const updateRoleSpecificFields = (profile, roleSpecific, userRole) => {
  if (!roleSpecific) return;

  // Handle skills
  if (roleSpecific.skills !== undefined) {
    profile.roleSpecific.skills = Array.isArray(roleSpecific.skills)
      ? roleSpecific.skills.slice(0, 50).filter(skill => skill && skill.trim().length > 0)
      : [];
  }

  // Handle education, experience, certifications, portfolio
  const collections = ['education', 'experience', 'certifications', 'portfolio'];
  collections.forEach(collection => {
    if (roleSpecific[collection] !== undefined) {
      if (Array.isArray(roleSpecific[collection])) {
        profile.roleSpecific[collection] = roleSpecific[collection];
      }
    }
  });

  // Handle company info (only for companies/organizations)
  if (roleSpecific.companyInfo !== undefined && ['company', 'organization'].includes(userRole)) {
    profile.roleSpecific.companyInfo = {
      ...profile.roleSpecific.companyInfo,
      ...roleSpecific.companyInfo
    };
  }
};

// Validate education
const validateEducation = (education) => {
  if (!Array.isArray(education)) return [];

  return education.map(edu => ({
    institution: edu.institution?.trim() || '',
    degree: edu.degree?.trim() || '',
    field: edu.field?.trim() || '',
    startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
    endDate: edu.endDate ? new Date(edu.endDate) : null,
    current: edu.current || false,
    description: edu.description?.trim().substring(0, 500) || '',
    grade: edu.grade?.trim() || ''
  })).filter(edu => edu.institution && edu.degree);
};

// Validate experience
const validateExperience = (experience) => {
  if (!Array.isArray(experience)) return [];

  return experience.map(exp => ({
    company: exp.company?.trim() || '',
    position: exp.position?.trim() || '',
    location: exp.location?.trim() || '',
    employmentType: exp.employmentType || 'full-time',
    startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
    endDate: exp.endDate ? new Date(exp.endDate) : null,
    current: exp.current || false,
    description: exp.description?.trim().substring(0, 1000) || '',
    skills: Array.isArray(exp.skills) ? exp.skills.filter(skill => skill && skill.trim()) : [],
    achievements: Array.isArray(exp.achievements) ? exp.achievements.filter(achievement => achievement && achievement.trim()) : []
  })).filter(exp => exp.company && exp.position);
};

// Validate certifications
const validateCertifications = (certifications) => {
  if (!Array.isArray(certifications)) return [];

  return certifications.map(cert => ({
    name: cert.name?.trim() || '',
    issuer: cert.issuer?.trim() || '',
    issueDate: cert.issueDate ? new Date(cert.issueDate) : new Date(),
    expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
    credentialId: cert.credentialId?.trim() || '',
    credentialUrl: cert.credentialUrl?.trim() || '',
    description: cert.description?.trim().substring(0, 500) || ''
  })).filter(cert => cert.name && cert.issuer);
};

// Validate portfolio
const validatePortfolio = (portfolio) => {
  if (!Array.isArray(portfolio)) return [];

  return portfolio.map(project => ({
    title: project.title?.trim() || '',
    description: project.description?.trim().substring(0, 1000) || '',
    mediaUrl: project.mediaUrl?.trim() || '',
    projectUrl: project.projectUrl?.trim() || '',
    category: project.category?.trim() || '',
    technologies: Array.isArray(project.technologies) ? project.technologies.filter(tech => tech && tech.trim()) : [],
    budget: typeof project.budget === 'number' ? Math.max(0, project.budget) : 0,
    duration: project.duration?.trim() || '',
    client: project.client?.trim() || '',
    completionDate: project.completionDate ? new Date(project.completionDate) : null,
    teamSize: typeof project.teamSize === 'number' ? Math.max(1, project.teamSize) : 1,
    role: project.role?.trim() || ''
  })).filter(project => project.title);
};

// Validate languages
const validateLanguages = (languages) => {
  if (!Array.isArray(languages)) return [];

  return languages.map(lang => ({
    language: lang.language?.trim() || '',
    proficiency: lang.proficiency || 'conversational'
  })).filter(lang => lang.language);
};

// Validate awards
const validateAwards = (awards) => {
  if (!Array.isArray(awards)) return [];

  return awards.map(award => ({
    title: award.title?.trim() || '',
    issuer: award.issuer?.trim() || '',
    date: award.date ? new Date(award.date) : null,
    description: award.description?.trim().substring(0, 500) || '',
    url: award.url?.trim() || ''
  })).filter(award => award.title && award.issuer);
};

// Validate volunteer experience
const validateVolunteerExperience = (volunteerExperience) => {
  if (!Array.isArray(volunteerExperience)) return [];

  return volunteerExperience.map(vol => ({
    organization: vol.organization?.trim() || '',
    role: vol.role?.trim() || '',
    cause: vol.cause?.trim() || '',
    startDate: vol.startDate ? new Date(vol.startDate) : null,
    endDate: vol.endDate ? new Date(vol.endDate) : null,
    current: vol.current || false,
    description: vol.description?.trim().substring(0, 1000) || '',
    hoursPerWeek: typeof vol.hoursPerWeek === 'number' ? Math.max(0, vol.hoursPerWeek) : 0,
    totalHours: typeof vol.totalHours === 'number' ? Math.max(0, vol.totalHours) : 0
  })).filter(vol => vol.organization && vol.role);
};

// Check connection between users
const checkConnection = async (userId, targetUserId) => {
  try {
    // Check if users are the same
    if (userId.toString() === targetUserId.toString()) {
      return true;
    }

    // TODO: Implement actual connection check logic
    // For now, using a mock implementation
    const Connection = mongoose.models.Connection || mongoose.model('Connection');

    if (Connection) {
      const connection = await Connection.findOne({
        $or: [
          { user1: userId, user2: targetUserId, status: 'connected' },
          { user1: targetUserId, user2: userId, status: 'connected' }
        ]
      });

      return !!connection;
    }

    return false;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
};

// Determine traffic source
const determineTrafficSource = (req) => {
  const referer = req.headers.referer || '';

  if (referer.includes('google.com') || referer.includes('bing.com') || referer.includes('yahoo.com')) {
    return 'search';
  } else if (referer.includes('facebook.com') || referer.includes('twitter.com') || referer.includes('linkedin.com')) {
    return 'social';
  } else if (referer) {
    return 'referral';
  } else {
    return 'direct';
  }
};

// Generate profile suggestions
const generateProfileSuggestions = (profile, user) => {
  const suggestions = [];

  if (!user.avatar) {
    suggestions.push({
      type: 'avatar',
      message: 'Add a profile picture to increase visibility by 40%',
      priority: 'high'
    });
  }

  if (!profile.headline || profile.headline.trim().length === 0) {
    suggestions.push({
      type: 'headline',
      message: 'Add a headline to showcase your expertise',
      priority: 'high'
    });
  }

  if (!profile.bio || profile.bio.trim().length === 0) {
    suggestions.push({
      type: 'bio',
      message: 'Write a bio to tell your story and attract opportunities',
      priority: 'medium'
    });
  }

  if (!profile.location || profile.location.trim().length === 0) {
    suggestions.push({
      type: 'location',
      message: 'Add your location to connect with local opportunities',
      priority: 'medium'
    });
  }

  if (profile.roleSpecific.skills.length === 0) {
    suggestions.push({
      type: 'skills',
      message: 'Add your skills to attract relevant opportunities',
      priority: 'high'
    });
  }

  const socialLinksCount = Object.values(profile.socialLinks || {}).filter(link => link && link.trim().length > 0).length;
  if (socialLinksCount < 2) {
    suggestions.push({
      type: 'social_links',
      message: 'Add at least 2 social links to build credibility',
      priority: 'medium'
    });
  }

  if (['candidate', 'freelancer'].includes(user.role)) {
    if (profile.roleSpecific.experience.length === 0) {
      suggestions.push({
        type: 'experience',
        message: 'Add your work experience to showcase your background',
        priority: 'high'
      });
    }

    if (profile.roleSpecific.education.length === 0) {
      suggestions.push({
        type: 'education',
        message: 'Add your education history to complete your profile',
        priority: 'medium'
      });
    }
  }

  if (['company', 'organization'].includes(user.role)) {
    if (!profile.roleSpecific.companyInfo || !profile.roleSpecific.companyInfo.industry) {
      suggestions.push({
        type: 'company_info',
        message: 'Add your company industry information',
        priority: 'high'
      });
    }

    if (!profile.roleSpecific.companyInfo || !profile.roleSpecific.companyInfo.mission) {
      suggestions.push({
        type: 'company_mission',
        message: 'Add your company mission statement',
        priority: 'medium'
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions.slice(0, 5);
};

// ========== PROFILE CONTROLLER CLASS ==========

class ProfileController {
  // Get current user's complete profile
  // Update the getProfile method (around line 50)
  async getProfile(req, res) {
    try {
      console.log('Getting profile for user:', req.user.userId);

      // Use lean() to avoid mongoose validation during fetch
      let profile = await Profile.findOne({ user: req.user.userId })
        .populate('user', 'name email role avatar coverPhoto dateOfBirth gender isActive')
        .lean();  // Add .lean() here

      if (!profile) {
        // Create default profile if doesn't exist
        const defaultProfile = await Profile.create({
          user: req.user.userId,
          headline: 'Welcome to my profile!',
          bio: 'Tell us about yourself...',
          privacySettings: {
            profileVisibility: 'public',
            allowMessages: true,
            allowConnections: true
          },
          notificationPreferences: {
            email: {
              messages: true,
              connectionRequests: true,
              jobMatches: true,
              newFollowers: true
            },
            push: {
              messages: true,
              connectionRequests: true
            }
          }
        });

        await defaultProfile.populate('user', 'name email role avatar coverPhoto');

        return res.status(201).json({
          success: true,
          data: defaultProfile,
          message: 'Default profile created successfully',
          code: 'PROFILE_CREATED'
        });
      }

      // Clean up invalid education records before returning
      if (profile.roleSpecific && profile.roleSpecific.education) {
        profile.roleSpecific.education = profile.roleSpecific.education
          .filter(edu => edu && edu.startDate && edu.startDate !== 'Invalid Date')
          .map(edu => ({
            ...edu,
            startDate: edu.startDate || new Date('2000-01-01'),
            endDate: edu.endDate || null,
            current: edu.current || false
          }));
      }

      // Update last active timestamp
      await Profile.findByIdAndUpdate(profile._id, { lastActive: new Date() });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile retrieved successfully',
        code: 'PROFILE_RETRIEVED'
      });
    } catch (error) {
      console.error('Get profile error:', error);

      // Handle validation errors gracefully
      if (error.name === 'ValidationError') {
        console.warn('Profile validation error, creating safe response');

        // Return a safe profile without validation
        const safeProfile = await Profile.findOne({ user: req.user.userId })
          .populate('user', 'name email role avatar coverPhoto dateOfBirth gender isActive')
          .lean();

        // Clean the data
        if (safeProfile && safeProfile.roleSpecific && safeProfile.roleSpecific.education) {
          safeProfile.roleSpecific.education = [];
        }

        return res.status(200).json({
          success: true,
          data: safeProfile,
          message: 'Profile retrieved (validation issues fixed)',
          code: 'PROFILE_RETRIEVED_WITH_FIXES'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create or update profile information
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const {
        headline,
        bio,
        location,
        phone,
        website,
        socialLinks,
        privacySettings,
        notificationPreferences,
        roleSpecific,
        languages,
        interests,
        awards,
        volunteerExperience
      } = req.body;

      // Validate user exists
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Find or create profile
      let profile = await Profile.findOne({ user: req.user.userId });
      const isNewProfile = !profile;

      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Update basic fields
      const basicFields = ['headline', 'bio', 'location', 'phone', 'website'];
      basicFields.forEach(field => {
        if (req.body[field] !== undefined) {
          profile[field] = req.body[field];
        }
      });

      // Update social links
      if (socialLinks) {
        profile.socialLinks = sanitizeSocialLinks(
          { ...profile.socialLinks, ...socialLinks }
        );
      }

      // Update privacy settings
      if (privacySettings) {
        profile.privacySettings = {
          ...profile.privacySettings,
          ...privacySettings
        };
      }

      // Update notification preferences
      if (notificationPreferences) {
        profile.notificationPreferences = mergeNotificationPreferences(
          profile.notificationPreferences,
          notificationPreferences
        );
      }

      // Update role-specific fields
      if (roleSpecific) {
        updateRoleSpecificFields(profile, roleSpecific, user.role);
      }

      // Update additional fields
      if (languages !== undefined) {
        profile.languages = validateLanguages(languages);
      }

      if (interests !== undefined) {
        profile.interests = Array.isArray(interests)
          ? interests.filter(interest => interest && interest.trim()).slice(0, 20)
          : [];
      }

      if (awards !== undefined) {
        profile.awards = validateAwards(awards);
      }

      if (volunteerExperience !== undefined) {
        profile.volunteerExperience = validateVolunteerExperience(volunteerExperience);
      }

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();

      // Sync specific fields to User model for lightweight access
      const userUpdates = {};
      if (headline !== undefined) userUpdates.headline = headline;
      if (bio !== undefined) userUpdates.bio = bio;
      if (location !== undefined) userUpdates.location = location;
      if (phone !== undefined) userUpdates.phone = phone;
      if (website !== undefined) userUpdates.website = website;
      if (socialLinks) {
        userUpdates.socialLinks = {
          ...(user.socialLinks || {}),
          ...profile.socialLinks
        };
      }
      if (privacySettings) {
        userUpdates.privacySettings = {
          ...(user.privacySettings || {}),
          ...profile.privacySettings
        };
      }
      if (notificationPreferences) {
        userUpdates.notificationPreferences = {
          ...(user.notificationPreferences || {}),
          ...profile.notificationPreferences
        };
      }
      // Handle cvUrl if provided (it sits on User model)
      if (req.body.cvUrl !== undefined) {
        userUpdates.cvUrl = req.body.cvUrl;
      }

      // Update role specific fields on user if needed (e.g. skills)
      if (roleSpecific && roleSpecific.skills && Array.isArray(roleSpecific.skills)) {
        userUpdates.skills = roleSpecific.skills.slice(0, 50).filter(skill => skill && skill.trim().length > 0);
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(req.user.userId, { $set: userUpdates });
      }

      // Populate user data
      await profile.populate('user', 'name email role avatar coverPhoto dateOfBirth gender headline bio socialLinks');

      res.status(200).json({
        success: true,
        message: isNewProfile ? 'Profile created successfully' : 'Profile updated successfully',
        data: profile,
        code: isNewProfile ? 'PROFILE_CREATED' : 'PROFILE_UPDATED'
      });
    } catch (error) {
      console.error('Update profile error:', error);

      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Profile already exists for this user',
          code: 'PROFILE_EXISTS'
        });
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid data format',
          code: 'INVALID_DATA_FORMAT'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get public profile data for any user
  async getPublicProfile(req, res) {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          code: 'INVALID_USER_ID'
        });
      }

      const profile = await Profile.findOne({ user: id })
        .populate('user', 'name avatar role verificationStatus isActive')
        .populate('verificationDetails.verifiedBy', 'name avatar');

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!profile.user?.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Profile is not active',
          code: 'PROFILE_INACTIVE'
        });
      }

      // Check privacy settings
      if (profile.privacySettings.profileVisibility === 'private') {
        return res.status(403).json({
          success: false,
          message: 'This profile is private',
          code: 'PROFILE_PRIVATE'
        });
      }

      // If profile is for connections only, check connection status
      if (profile.privacySettings.profileVisibility === 'connections') {
        const isConnected = await checkConnection(req.user.userId, id);
        const isSelf = req.user.userId === id;

        if (!isConnected && !isSelf) {
          return res.status(403).json({
            success: false,
            message: 'You must be connected to view this profile',
            code: 'CONNECTION_REQUIRED'
          });
        }
      }

      let profileData;
      const isSelf = req.user.userId === id;
      const isConnected = await checkConnection(req.user.userId, id);

      if (isSelf || isConnected) {
        // Return detailed profile for self or connections
        profileData = profile.getDetailedProfile();
      } else {
        // Return public profile for others
        profileData = profile.getPublicProfile();
      }

      // Increment profile views if viewing someone else's profile
      if (!isSelf) {
        await profile.incrementProfileViews();

        // Update analytics
        const country = req.headers['cf-ipcountry'] || req.headers['x-country'] || null;
        const source = determineTrafficSource(req);
        await profile.updateAnalytics(country, source);
      }

      res.status(200).json({
        success: true,
        data: profileData,
        message: 'Profile retrieved successfully',
        code: 'PROFILE_RETRIEVED'
      });
    } catch (error) {
      console.error('Get public profile error:', error);

      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          code: 'NO_FILE_UPLOADED'
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
          code: 'INVALID_FILE_TYPE'
        });
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB',
          code: 'FILE_TOO_LARGE'
        });
      }

      // Get user to ensure they exist
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const uploadResult = await uploadToCloudinary(req.file, 'avatars');

      if (!uploadResult || !uploadResult.url) {
        throw new Error('Failed to upload to cloud storage');
      }

      // Update user's avatar
      user.avatar = uploadResult.url;
      user.updatedAt = new Date();
      await user.save();

      // Update profile's last update timestamp
      await Profile.findOneAndUpdate(
        { user: req.user.userId },
        { lastProfileUpdate: new Date(), lastActive: new Date() },
        { upsert: true }
      );

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: uploadResult.url,
          publicId: uploadResult.public_id
        },
        code: 'AVATAR_UPLOADED'
      });
    } catch (error) {
      console.error('Upload avatar error:', error);

      if (error.message.includes('cloud storage') || error.message.includes('Cloudinary')) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to storage service',
          code: 'STORAGE_UPLOAD_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while uploading avatar',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload cover photo
  async uploadCoverPhoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          code: 'NO_FILE_UPLOADED'
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
          code: 'INVALID_FILE_TYPE'
        });
      }

      // Validate file size (max 10MB for cover photos)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB',
          code: 'FILE_TOO_LARGE'
        });
      }

      // Get user to ensure they exist
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const uploadResult = await uploadToCloudinary(req.file, 'covers');

      if (!uploadResult || !uploadResult.url) {
        throw new Error('Failed to upload to cloud storage');
      }

      user.coverPhoto = uploadResult.url;
      user.updatedAt = new Date();
      await user.save();

      // Update profile's last update timestamp
      await Profile.findOneAndUpdate(
        { user: req.user.userId },
        { lastProfileUpdate: new Date(), lastActive: new Date() },
        { upsert: true }
      );

      res.status(200).json({
        success: true,
        message: 'Cover photo uploaded successfully',
        data: {
          coverPhotoUrl: uploadResult.url,
          publicId: uploadResult.public_id
        },
        code: 'COVER_PHOTO_UPLOADED'
      });
    } catch (error) {
      console.error('Upload cover photo error:', error);

      if (error.message.includes('cloud storage') || error.message.includes('Cloudinary')) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to storage service',
          code: 'STORAGE_UPLOAD_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while uploading cover photo',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update professional information
  async updateProfessionalInfo(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { skills, education, experience, certifications, portfolio, companyInfo } = req.body;

      // Get user to check role
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Find or create profile
      let profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Update role-specific fields with validation
      if (skills !== undefined) {
        profile.roleSpecific.skills = Array.isArray(skills)
          ? skills.slice(0, 50).filter(skill => skill && skill.trim().length > 0)
          : [];
      }

      if (education !== undefined) {
        profile.roleSpecific.education = validateEducation(education);
      }

      if (experience !== undefined) {
        profile.roleSpecific.experience = validateExperience(experience);
      }

      if (certifications !== undefined) {
        profile.roleSpecific.certifications = validateCertifications(certifications);
      }

      if (portfolio !== undefined) {
        profile.roleSpecific.portfolio = validatePortfolio(portfolio);
      }

      if (companyInfo !== undefined && ['company', 'organization'].includes(user.role)) {
        profile.roleSpecific.companyInfo = {
          ...profile.roleSpecific.companyInfo,
          ...companyInfo
        };
      }

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();
      await profile.populate('user', 'name email role avatar');

      res.status(200).json({
        success: true,
        message: 'Professional information updated successfully',
        data: {
          roleSpecific: profile.roleSpecific,
          profileCompletion: profile.profileCompletion
        },
        code: 'PROFESSIONAL_INFO_UPDATED'
      });
    } catch (error) {
      console.error('Update professional info error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating professional information',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update social links
  async updateSocialLinks(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { socialLinks } = req.body;

      if (!socialLinks || typeof socialLinks !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Social links must be an object',
          code: 'INVALID_SOCIAL_LINKS'
        });
      }

      let profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      profile.socialLinks = sanitizeSocialLinks(
        { ...profile.socialLinks, ...socialLinks }
      );

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();

      res.status(200).json({
        success: true,
        message: 'Social links updated successfully',
        data: profile.socialLinks,
        code: 'SOCIAL_LINKS_UPDATED'
      });
    } catch (error) {
      console.error('Update social links error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating social links',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get profile completion
  async getProfileCompletion(req, res) {
    try {
      let profile = await Profile.findOne({ user: req.user.userId });
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Create default profile if doesn't exist
      if (!profile) {
        profile = await Profile.create({ user: req.user.userId });
      }

      // Calculate completion percentage
      const percentage = await profile.calculateCompletion(user);

      // Generate suggestions based on missing fields
      const suggestions = generateProfileSuggestions(profile, user);

      res.status(200).json({
        success: true,
        data: {
          percentage,
          completedSections: profile.profileCompletion.completedSections || [],
          suggestions,
          requiredFields: profile.profileCompletion.requiredFields || [],
          completedFields: profile.profileCompletion.completedFields || []
        },
        message: 'Profile completion calculated successfully',
        code: 'PROFILE_COMPLETION_RETRIEVED'
      });
    } catch (error) {
      console.error('Get profile completion error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while calculating profile completion',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Submit verification
  async submitVerification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { documents } = req.body;

      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one document is required for verification',
          code: 'DOCUMENTS_REQUIRED'
        });
      }

      // Validate documents array
      for (const doc of documents) {
        if (!doc.documentType || !doc.url) {
          return res.status(400).json({
            success: false,
            message: 'Each document must have documentType and url',
            code: 'INVALID_DOCUMENT_FORMAT'
          });
        }

        // Validate URL format
        const urlRegex = /^https?:\/\/.+\..+/;
        if (!urlRegex.test(doc.url)) {
          return res.status(400).json({
            success: false,
            message: `Invalid URL format for document: ${doc.documentType}`,
            code: 'INVALID_URL'
          });
        }
      }

      let profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      // Check if verification is already pending or approved
      if (profile.verificationStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Verification request is already pending',
          code: 'VERIFICATION_PENDING'
        });
      }

      if (profile.verificationStatus === 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Profile is already verified',
          code: 'ALREADY_VERIFIED'
        });
      }

      profile.verificationStatus = 'pending';
      profile.verificationDetails = {
        submittedAt: new Date(),
        documents: documents.map(doc => ({
          documentType: doc.documentType,
          url: doc.url,
          uploadedAt: new Date(),
          status: 'pending',
          remarks: doc.remarks || ''
        }))
      };

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();

      // TODO: Send notification to admins
      // await notificationService.sendVerificationSubmission(profile);

      res.status(200).json({
        success: true,
        message: 'Verification submitted successfully. Our team will review it within 24-48 hours.',
        data: {
          status: profile.verificationStatus,
          submittedAt: profile.verificationDetails.submittedAt,
          documentsCount: documents.length
        },
        code: 'VERIFICATION_SUBMITTED'
      });
    } catch (error) {
      console.error('Submit verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while submitting verification',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get popular profiles
  async getPopularProfiles(req, res) {
    try {
      const { limit = 10, role } = req.query;

      const profiles = await Profile.getPopularProfiles(parseInt(limit), role);

      res.status(200).json({
        success: true,
        data: profiles.map(profile => profile.getPublicProfile()),
        message: 'Popular profiles retrieved successfully',
        code: 'POPULAR_PROFILES_RETRIEVED',
        count: profiles.length
      });
    } catch (error) {
      console.error('Get popular profiles error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching popular profiles',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Search profiles
  async searchProfiles(req, res) {
    try {
      const {
        q: searchTerm,
        location,
        skills,
        role,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {};

      if (location) filters.location = location;
      if (skills) {
        filters.skills = Array.isArray(skills) ? skills : skills.split(',');
      }
      if (role) filters.role = role;

      const profiles = await Profile.searchProfiles(
        searchTerm,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: profiles.map(profile => profile.getPublicProfile()),
        message: 'Profiles search completed successfully',
        code: 'PROFILES_SEARCH_COMPLETED',
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: profiles.length,
          hasMore: profiles.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Search profiles error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while searching profiles',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update privacy settings
  async updatePrivacySettings(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { privacySettings } = req.body;

      if (!privacySettings || typeof privacySettings !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Privacy settings must be an object',
          code: 'INVALID_PRIVACY_SETTINGS'
        });
      }

      let profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      profile.privacySettings = {
        ...profile.privacySettings,
        ...privacySettings
      };

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();

      res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully',
        data: profile.privacySettings,
        code: 'PRIVACY_SETTINGS_UPDATED'
      });
    } catch (error) {
      console.error('Update privacy settings error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating privacy settings',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { notificationPreferences } = req.body;

      if (!notificationPreferences || typeof notificationPreferences !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Notification preferences must be an object',
          code: 'INVALID_NOTIFICATION_PREFERENCES'
        });
      }

      let profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        profile = new Profile({ user: req.user.userId });
      }

      profile.notificationPreferences = mergeNotificationPreferences(
        profile.notificationPreferences,
        notificationPreferences
      );

      // Update timestamps
      profile.lastProfileUpdate = new Date();
      profile.lastActive = new Date();

      await profile.save();

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: profile.notificationPreferences,
        code: 'NOTIFICATION_PREFERENCES_UPDATED'
      });
    } catch (error) {
      console.error('Update notification preferences error:', error);

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error while updating notification preferences',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get profile summary
  async getProfileSummary(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      const summary = profile.getProfileSummary();

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Profile summary retrieved successfully',
        code: 'PROFILE_SUMMARY_RETRIEVED'
      });
    } catch (error) {
      console.error('Get profile summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile summary',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update social stats (admin/internal use)
  async updateSocialStats(req, res) {
    try {
      const profile = await Profile.findOne({ user: req.user.userId });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      await profile.updateSocialStats();

      res.status(200).json({
        success: true,
        data: profile.socialStats,
        message: 'Social stats updated successfully',
        code: 'SOCIAL_STATS_UPDATED'
      });
    } catch (error) {
      console.error('Update social stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating social stats',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Note: All helper methods have been moved outside the class
  // They are now regular functions that can be called directly
}

module.exports = new ProfileController();