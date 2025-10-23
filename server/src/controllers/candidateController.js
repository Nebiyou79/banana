// candidateController.js
const User = require('../models/User');
const Job = require('../models/Job');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Enhanced error handler
const handleControllerError = (error, res, customMessage = 'Internal server error') => {
  console.error('Controller Error:', error);
  
  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  // Mongoose cast errors (invalid ID)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  // MongoDB duplicate key errors
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: customMessage
  });
};

// Enhanced validation helper
const validateProfileData = (updateData) => {
  const errors = [];

  // Validate education dates
  if (updateData.education) {
    updateData.education.forEach((edu, index) => {
      if (!edu.institution?.trim()) {
        errors.push(`Education ${index + 1}: Institution is required`);
      }
      if (!edu.degree?.trim()) {
        errors.push(`Education ${index + 1}: Degree is required`);
      }
      if (!edu.startDate) {
        errors.push(`Education ${index + 1}: Start date is required`);
      }
      if (edu.endDate && new Date(edu.endDate) <= new Date(edu.startDate)) {
        errors.push(`Education ${index + 1}: End date must be after start date`);
      }
    });
  }

  // Validate experience dates
  if (updateData.experience) {
    updateData.experience.forEach((exp, index) => {
      if (!exp.company?.trim()) {
        errors.push(`Experience ${index + 1}: Company is required`);
      }
      if (!exp.position?.trim()) {
        errors.push(`Experience ${index + 1}: Position is required`);
      }
      if (!exp.startDate) {
        errors.push(`Experience ${index + 1}: Start date is required`);
      }
      if (exp.endDate && new Date(exp.endDate) <= new Date(exp.startDate)) {
        errors.push(`Experience ${index + 1}: End date must be after start date`);
      }
    });
  }

  // Validate certification dates
  if (updateData.certifications) {
    updateData.certifications.forEach((cert, index) => {
      if (!cert.name?.trim()) {
        errors.push(`Certification ${index + 1}: Name is required`);
      }
      if (!cert.issuer?.trim()) {
        errors.push(`Certification ${index + 1}: Issuer is required`);
      }
      if (!cert.issueDate) {
        errors.push(`Certification ${index + 1}: Issue date is required`);
      }
      if (cert.expiryDate && new Date(cert.expiryDate) <= new Date(cert.issueDate)) {
        errors.push(`Certification ${index + 1}: Expiry date must be after issue date`);
      }
    });
  }

  // Validate array limits
  if (updateData.skills && updateData.skills.length > 50) {
    errors.push('Maximum 50 skills allowed');
  }
  if (updateData.education && updateData.education.length > 10) {
    errors.push('Maximum 10 education entries allowed');
  }
  if (updateData.experience && updateData.experience.length > 15) {
    errors.push('Maximum 15 experience entries allowed');
  }
  if (updateData.certifications && updateData.certifications.length > 20) {
    errors.push('Maximum 20 certification entries allowed');
  }

  // Validate text field lengths
  if (updateData.bio && updateData.bio.length > 1000) {
    errors.push('Bio cannot exceed 1000 characters');
  }

  return errors;
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const updateData = { ...req.body, updatedAt: new Date() };

    // Remove protected fields
    delete updateData._id;
    delete updateData.email;
    delete updateData.role;
    delete updateData.password;

    // Validate input data
    const validationErrors = validateProfileData(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    ).select('name email role verificationStatus profileCompleted skills education experience certifications cvs portfolio bio location phone website socialLinks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    handleControllerError(error, res, 'Server error during profile update');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId)
      .select('name email role verificationStatus profileCompleted skills education experience certifications cvs portfolio bio location phone website socialLinks lastLogin')
      .lean();

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
    handleControllerError(error, res, 'Error fetching profile');
  }
};

exports.uploadCV = async (req, res) => {
  let uploadedFiles = [];
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const userId = req.user.userId;
    
    if (!userId) {
      // Clean up uploaded files if authentication fails
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (cleanupError) {}
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (cleanupError) {}
      });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate file types and sizes (updated to 5MB)
    const invalidFiles = [];
    req.files.forEach(file => {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB (updated from 10MB)
      
      if (!allowedTypes.includes(file.mimetype)) {
        invalidFiles.push(`File "${file.originalname}" must be PDF, DOC, or DOCX`);
      }
      
      if (file.size > maxSize) {
        invalidFiles.push(`File "${file.originalname}" must be less than 5MB`);
      }
    });

    if (invalidFiles.length > 0) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (cleanupError) {}
      });
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: invalidFiles
      });
    }

    // Check CV limit - Maximum 10 CVs total per user (updated from 5)
    const maxCVsPerUser = 10;
    if (user.cvs.length + req.files.length > maxCVsPerUser) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (cleanupError) {}
      });
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxCVsPerUser} CVs allowed. You currently have ${user.cvs.length} CVs and tried to upload ${req.files.length} more.`
      });
    }

    uploadedFiles = req.files.map((file, index) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/cv/${file.filename}`,
      uploadedAt: new Date(),
      isPrimary: user.cvs.length === 0 && index === 0 // Set first uploaded CV as primary if no CVs exist
    }));

    user.cvs.push(...uploadedFiles);
    await user.save();

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} CV(s)`,
      data: { cvs: uploadedFiles }
    });

  } catch (error) {
    // Clean up any uploaded files on error
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(cv => {
        try {
          const filePath = path.join(process.cwd(), 'public', cv.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      });
    }
    
    handleControllerError(error, res, 'Error during CV upload');
  }
};

exports.setPrimaryCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!cvId) {
      return res.status(400).json({
        success: false,
        message: 'CV ID is required'
      });
    }

    // First, set all CVs to non-primary
    await User.updateOne(
      { _id: userId },
      { $set: { 'cvs.$[].isPrimary': false } }
    );

    // Then set the specified CV as primary
    const result = await User.updateOne(
      { _id: userId, 'cvs._id': cvId },
      { $set: { 'cvs.$.isPrimary': true } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'CV not found or you do not have permission to access it'
      });
    }

    res.json({
      success: true,
      message: 'Primary CV updated successfully'
    });

  } catch (error) {
    handleControllerError(error, res, 'Error setting primary CV');
  }
};

exports.deleteCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!cvId) {
      return res.status(400).json({
        success: false,
        message: 'CV ID is required'
      });
    }

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
      console.warn('File deletion warning:', fileError.message);
      // Continue with database deletion even if file deletion fails
    }

    user.cvs.pull(cvId);
    
    // Set a new primary CV if the deleted one was primary
    if (cvToDelete.isPrimary && user.cvs.length > 0) {
      user.cvs[0].isPrimary = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'CV deleted successfully'
    });

  } catch (error) {
    handleControllerError(error, res, 'Error deleting CV');
  }
};

exports.getJobsForCandidate = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      region,
      category,
      type,
      experienceLevel,
      minSalary,
      maxSalary
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Cap at 50 for performance

    const filter = { 
      status: 'active',
      applicationDeadline: { $gt: new Date() }
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (region) filter['location.region'] = region;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    if (minSalary || maxSalary) {
      filter.$and = filter.$and || [];
      if (minSalary) {
        const minSalaryNum = parseInt(minSalary);
        if (!isNaN(minSalaryNum)) {
          filter.$and.push({
            $or: [
              { 'salary.min': { $gte: minSalaryNum } },
              { 'salary.max': { $gte: minSalaryNum } }
            ]
          });
        }
      }
      if (maxSalary) {
        const maxSalaryNum = parseInt(maxSalary);
        if (!isNaN(maxSalaryNum)) {
          filter.$and.push({
            $or: [
              { 'salary.max': { $lte: maxSalaryNum } },
              { 'salary.min': { $lte: maxSalaryNum } }
            ]
          });
        }
      }
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logoUrl verified industry')
        .populate('organization', 'name logoUrl verified industry organizationType')
        .sort({ featured: -1, createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Job.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    handleControllerError(error, res, 'Error fetching jobs');
  }
};

// candidateController.js - ADD THESE TWO NEW FUNCTIONS

// @desc    Save job for candidate
// @route   POST /api/v1/job/:jobId/save
// @access  Private (Candidate)
exports.saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const user = await User.findById(userId);
    const isAlreadySaved = user.savedJobs.includes(jobId);

    if (isAlreadySaved) {
      return res.status(400).json({
        success: false,
        message: 'Job is already saved'
      });
    }

    user.savedJobs.push(jobId);
    job.saveCount = (job.saveCount || 0) + 1;

    await Promise.all([user.save(), job.save()]);

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
      data: { saved: true }
    });

  } catch (error) {
    handleControllerError(error, res, 'Error saving job');
  }
};

// @desc    Unsave job for candidate
// @route   POST /api/v1/job/:jobId/unsave
// @access  Private (Candidate)
exports.unsaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const user = await User.findById(userId);
    const isSaved = user.savedJobs.includes(jobId);

    if (!isSaved) {
      return res.status(400).json({
        success: false,
        message: 'Job is not saved'
      });
    }

    user.savedJobs.pull(jobId);
    job.saveCount = Math.max(0, (job.saveCount || 1) - 1);

    await Promise.all([user.save(), job.save()]);

    res.status(200).json({
      success: true,
      message: 'Job removed from saved',
      data: { saved: false }
    });

  } catch (error) {
    handleControllerError(error, res, 'Error unsaving job');
  }
};

exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId)
      .populate({
        path: 'savedJobs',
        match: { 
          status: 'active',
          applicationDeadline: { $gt: new Date() }
        },
        populate: [
          { path: 'company', select: 'name logoUrl verified industry' },
          { path: 'organization', select: 'name logoUrl verified industry organizationType' }
        ]
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.savedJobs || []
    });

  } catch (error) {
    handleControllerError(error, res, 'Error fetching saved jobs');
  }
};