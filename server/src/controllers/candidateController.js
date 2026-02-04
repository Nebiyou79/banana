const User = require('../models/User');
const Job = require('../models/Job');
const path = require('path');
const fs = require('fs'); // Added for local file operations
const { validationResult } = require('express-validator');
const localFileUpload = require('../middleware/localFileUpload'); // Added for local uploads

// Enhanced error handler
const handleControllerError = (error, res, customMessage = 'Internal server error') => {
  console.error('Controller Error:', error);

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);

    // Check if it's a CV validation error
    const isCVError = errors.some(err =>
      err.includes('cvs') || err.includes('mimetype')
    );

    if (isCVError) {
      return res.status(400).json({
        success: false,
        message: 'CV validation failed',
        errors: errors,
        code: 'CV_VALIDATION_ERROR'
      });
    }

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
      message: 'Invalid ID format. Please provide a valid MongoDB ObjectId.'
    });
  }

  // MongoDB duplicate key errors
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }

  // File system errors
  if (error.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      message: 'File not found on server'
    });
  }

  // Custom error messages
  if (error.message && error.message.includes('Maximum')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: customMessage
  });
};

// Validate profile data
const validateProfileData = (updateData) => {
  const errors = [];

  // Validate date of birth
  if (updateData.dateOfBirth) {
    const dob = new Date(updateData.dateOfBirth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

    if (dob > maxDate) {
      errors.push('You must be at least 16 years old');
    }
    if (dob < minDate) {
      errors.push('Please enter a valid date of birth');
    }
  }

  // Validate gender
  if (updateData.gender && !['male', 'female', 'prefer-not-to-say'].includes(updateData.gender)) {
    errors.push('Please select a valid gender option');
  }

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
  if (updateData.bio && updateData.bio.length > 2000) {
    errors.push('Bio cannot exceed 2000 characters');
  }

  return errors;
};

// Helper: Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * @desc    Update candidate profile
 * @route   PUT /api/v1/candidate/profile
 * @access  Private (Candidate)
 */
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
    delete updateData.cvs; // CVs should be managed separately

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
    ).select('-passwordHash -loginAttempts -lockUntil');

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

/**
 * @desc    Get candidate profile
 * @route   GET /api/v1/candidate/profile
 * @access  Private (Candidate)
 */
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
      .select('-passwordHash -loginAttempts -lockUntil')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format CVs for response
    if (user.cvs && Array.isArray(user.cvs)) {
      user.cvs = user.cvs.map(cv => ({
        _id: cv._id,
        fileName: cv.fileName,
        originalName: cv.originalName,
        size: cv.size,
        uploadedAt: cv.uploadedAt,
        isPrimary: cv.isPrimary,
        mimetype: cv.mimetype,
        fileExtension: cv.fileExtension,
        description: cv.description,
        fileUrl: cv.fileUrl,
        downloadUrl: cv.downloadUrl,
        downloadCount: cv.downloadCount || 0,
        viewCount: cv.viewCount || 0
      }));
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    handleControllerError(error, res, 'Error fetching profile');
  }
};

/**
 * @desc    Upload CV(s) to Local Storage
 * @route   POST /api/v1/candidate/cv
 * @access  Private (Candidate)
 */
exports.uploadCV = async (req, res) => {
  try {
    console.log('=== CV UPLOAD START (LOCAL STORAGE) ===');

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if file was uploaded via localFileUpload middleware
    if (!req.uploadedFile) {
      console.log('No file uploaded via localFileUpload middleware');
      return res.status(400).json({
        success: false,
        message: 'No CV file uploaded'
      });
    }

    console.log('File uploaded successfully via middleware:', req.uploadedFile.file.originalName);

    // Check max CV limit using model method
    if (!user.canAddCV()) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 CVs allowed per user'
      });
    }

    const uploadedFile = req.uploadedFile.file;

    // Create CV data for database
    const cvData = {
      fileName: uploadedFile.fileName,
      originalName: uploadedFile.originalName,
      filePath: uploadedFile.path,
      fileUrl: uploadedFile.url,
      downloadUrl: uploadedFile.downloadUrl,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      fileExtension: uploadedFile.originalName.split('.').pop().toLowerCase(),
      uploadedAt: new Date(),
      isPrimary: user.cvs.length === 0, // First CV is primary
      description: req.body.description || `CV uploaded on ${new Date().toLocaleDateString()}`,
      downloadCount: 0,
      viewCount: 0
    };

    // Add CV to user
    await user.addCV(cvData);

    // Get the newly added CV
    const newCV = user.cvs[user.cvs.length - 1];

    console.log('CV saved to database:', newCV._id);

    res.status(201).json({
      success: true,
      message: 'CV uploaded successfully',
      data: {
        cv: {
          _id: newCV._id,
          fileName: newCV.fileName,
          originalName: newCV.originalName,
          size: newCV.size,
          uploadedAt: newCV.uploadedAt,
          isPrimary: newCV.isPrimary,
          mimetype: newCV.mimetype,
          fileExtension: newCV.fileExtension,
          description: newCV.description,
          fileUrl: newCV.fileUrl,
          downloadUrl: newCV.downloadUrl
        },
        totalCVs: user.cvs.length,
        primaryCVId: user.cvs.find(cv => cv.isPrimary)?._id?.toString()
      }
    });

  } catch (error) {
    console.error('CV upload error:', error);
    handleControllerError(error, res, 'Error uploading CV');
  }
};
/**
 * @desc    Upload Multiple CVs to Local Storage
 * @route   POST /api/v1/candidate/cvs/multiple
 * @access  Private (Candidate)
 */
exports.uploadMultipleCVs = async (req, res) => {
  try {
    console.log('=== MULTIPLE CV UPLOAD START (LOCAL STORAGE) ===');
    console.log('Files received:', req.files ? req.files.length : 0);

    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if files were uploaded via localFileUpload middleware
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded via localFileUpload middleware');
      return res.status(400).json({
        success: false,
        message: 'No CV files uploaded'
      });
    }

    console.log(`Processing ${req.files.length} files`);

    // Calculate available slots
    const availableSlots = Math.max(0, 10 - user.cvs.length); // Max 10 CVs
    const filesToProcess = req.files.slice(0, availableSlots);

    if (filesToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Maximum 10 CVs allowed per user. You already have ${user.cvs.length} CVs.`
      });
    }

    // Process each file
    const uploadedCVs = [];
    const errors = [];

    for (const file of filesToProcess) {
      try {
        // Check if user can add more CVs
        if (!user.canAddCV()) {
          errors.push({
            fileName: file.originalname,
            error: 'Maximum 10 CVs allowed per user'
          });
          continue;
        }

        // Create CV data for database
        const cvData = {
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileUrl: `/uploads/cv/${file.filename}`,
          downloadUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/download/cv/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size,
          fileExtension: file.originalname.split('.').pop().toLowerCase(),
          uploadedAt: new Date(),
          isPrimary: user.cvs.length === 0 && uploadedCVs.length === 0, // First CV is primary
          description: `CV uploaded on ${new Date().toLocaleDateString()}`,
          downloadCount: 0,
          viewCount: 0
        };

        // Add CV to user
        await user.addCV(cvData);

        // Get the newly added CV
        const newCV = user.cvs[user.cvs.length - 1];
        uploadedCVs.push(newCV);

        console.log(`CV saved to database: ${newCV._id} - ${file.originalname}`);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push({
          fileName: file.originalname,
          error: fileError.message || 'Failed to process file'
        });
      }
    }

    // Refresh user data
    await user.save();

    // Format response
    const formattedCVs = uploadedCVs.map(cv => ({
      _id: cv._id,
      fileName: cv.fileName,
      originalName: cv.originalName,
      size: cv.size,
      uploadedAt: cv.uploadedAt,
      isPrimary: cv.isPrimary,
      mimetype: cv.mimetype,
      fileExtension: cv.fileExtension,
      description: cv.description,
      fileUrl: cv.fileUrl,
      downloadUrl: cv.downloadUrl
    }));

    // Get primary CV
    const primaryCV = user.cvs.find(cv => cv.isPrimary);

    const response = {
      success: true,
      message: uploadedCVs.length === filesToProcess.length ?
        `Successfully uploaded ${uploadedCVs.length} CV(s)` :
        `Uploaded ${uploadedCVs.length} out of ${filesToProcess.length} CV(s)`,
      data: {
        cvs: formattedCVs,
        totalCVs: user.cvs.length,
        primaryCVId: primaryCV?._id?.toString(),
        errors: errors.length > 0 ? errors : undefined
      }
    };

    // Add warning if there were errors
    if (errors.length > 0) {
      response.message += ` (${errors.length} failed)`;
    }

    res.status(201).json(response);

  } catch (error) {
    console.error('Multiple CV upload error:', error);
    handleControllerError(error, res, 'Error uploading CVs');
  }
};
/**
 * @desc    Get all CVs for candidate
 * @route   GET /api/v1/candidate/cvs
 * @access  Private (Candidate)
 */
exports.getAllCVs = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId).select('cvs');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const formattedCVs = user.formatCVsForResponse();

    res.json({
      success: true,
      data: {
        cvs: formattedCVs,
        count: formattedCVs.length,
        primaryCV: formattedCVs.find(cv => cv.isPrimary)
      }
    });

  } catch (error) {
    handleControllerError(error, res, 'Error fetching CVs');
  }
};

/**
 * @desc    Get single CV metadata
 * @route   GET /api/v1/candidate/cv/:cvId
 * @access  Private (Candidate)
 */
exports.getCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(cvId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cv = user.getCVById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    const cvData = user.getCVByIdWithUrls(cvId);

    res.json({
      success: true,
      data: cvData
    });

  } catch (error) {
    handleControllerError(error, res, 'Error fetching CV');
  }
};

/**
 * @desc    View CV (redirect to file URL)
 * @route   GET /api/v1/candidate/cv/:cvId/view
 * @access  Private (Candidate)
 */
exports.viewCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(cvId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cv = user.getCVById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    if (!cv.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'CV file URL not found'
      });
    }

    // Increment view count
    await user.incrementCVViewCount(cvId);

    console.log(`Redirecting to view CV: ${cv.fileUrl}`);

    // Redirect to the file URL (served by express.static)
    res.redirect(cv.fileUrl);

  } catch (error) {
    handleControllerError(error, res, 'Error viewing CV');
  }
};

/**
 * @desc    Download CV (serves file directly with proper headers)
 * @route   GET /api/v1/candidate/cv/:cvId/download
 * @access  Private (Candidate)
 */
exports.downloadCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(cvId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cv = user.getCVById(cvId);
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    if (!cv.filePath) {
      return res.status(404).json({
        success: false,
        message: 'CV file path not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(cv.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'CV file not found on server'
      });
    }

    // Increment download count
    await user.incrementCVDownloadCount(cvId);

    // Set headers for download
    res.set({
      'Content-Disposition': `attachment; filename="${encodeURIComponent(cv.originalName)}"`,
      'Content-Type': cv.mimetype || 'application/octet-stream',
      'Content-Length': cv.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Stream the file
    const fileStream = fs.createReadStream(cv.filePath);
    fileStream.pipe(res);

    console.log(`Downloading CV: ${cv.originalName} (${cv.size} bytes)`);

  } catch (error) {
    console.error('CV download error:', error);
    handleControllerError(error, res, 'Error downloading CV');
  }
};

/**
 * @desc    Delete CV from local storage and database
 * @route   DELETE /api/v1/candidate/cv/:cvId
 * @access  Private (Candidate)
 */
exports.deleteCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(cvId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format. Must be a valid MongoDB ObjectId.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the CV in user's CV array
    const cvIndex = user.cvs.findIndex(cv => cv._id.toString() === cvId);
    if (cvIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    const cvToDelete = user.cvs[cvIndex];
    const wasPrimary = cvToDelete.isPrimary;
    const filePath = cvToDelete.filePath;

    // Delete file from local storage if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted CV file from local storage: ${filePath}`);
      } catch (fileError) {
        console.warn('Local file deletion warning:', fileError.message);
        // Continue with database removal even if file deletion fails
      }
    }

    // Remove CV from user's CVs array using model method
    await user.removeCV(cvId);

    res.json({
      success: true,
      message: 'CV deleted successfully',
      data: {
        deletedCVId: cvId,
        newPrimaryCVId: user.cvs.length > 0 ? user.cvs.find(cv => cv.isPrimary)?._id?.toString() : null,
        remainingCVs: user.cvs.length
      }
    });

  } catch (error) {
    console.error('Delete CV error:', error);
    handleControllerError(error, res, 'Error deleting CV');
  }
};

/**
 * @desc    Set primary CV
 * @route   PATCH /api/v1/candidate/cv/:cvId/primary
 * @access  Private (Candidate)
 */
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

    if (!isValidObjectId(cvId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format. Must be a valid MongoDB ObjectId.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if CV exists
    const cvExists = user.cvs.some(cv => cv._id.toString() === cvId);
    if (!cvExists) {
      return res.status(404).json({
        success: false,
        message: 'CV not found in your profile'
      });
    }

    // Set primary CV using model method
    await user.setPrimaryCV(cvId);

    res.json({
      success: true,
      message: 'Primary CV updated successfully',
      data: {
        primaryCVId: cvId
      }
    });

  } catch (error) {
    handleControllerError(error, res, 'Error setting primary CV');
  }
};

/**
 * @desc    Get jobs for candidate
 * @route   GET /api/v1/candidate/jobs
 * @access  Private (Candidate)
 */
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
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

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

/**
 * @desc    Save job for candidate
 * @route   POST /api/v1/candidate/job/:jobId/save
 * @access  Private (Candidate)
 */
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

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Job ID format'
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

/**
 * @desc    Unsave job for candidate
 * @route   POST /api/v1/candidate/job/:jobId/unsave
 * @access  Private (Candidate)
 */
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

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Job ID format'
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

/**
 * @desc    Get saved jobs
 * @route   GET /api/v1/candidate/jobs/saved
 * @access  Private (Candidate)
 */
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
