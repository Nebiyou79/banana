const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Helper to detect Windows absolute paths
const isWindowsPath = (p) => Boolean(p && typeof p === 'string' && /^[A-Za-z]:\\/.test(p));

// Universal file formatter (handles local file uploads)
const formatFileDataUniversal = (file, folder = 'applications') => {
  if (!file) return null;

  // Handle MongoDB documents
  let fileObj;
  if (file.toObject) {
    fileObj = file.toObject();
  } else if (file._doc) {
    fileObj = { ...file._doc };
  } else {
    fileObj = { ...file };
  }

  // Get the backend URL (should be localhost:4000 in dev, getbananalink.com in prod)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
  const cleanBackendUrl = backendUrl.replace(/\/+$/, '');

  // Include cvId in the ID lookup
  const fileId = fileObj._id || fileObj.cvId || fileObj.fileId || fileObj.id;

  if (fileId) {
    // Generate URLs that use the authenticated API
    return {
      _id: (fileObj._id || fileObj.cvId)?.toString() || undefined,
      cvId: fileObj.cvId?.toString() || undefined,
      filename: fileObj.fileName || fileObj.filename,
      originalName: fileObj.originalName || fileObj.originalname || fileObj.fileName,
      path: fileObj.path || fileObj.filePath,
      size: fileObj.size || 0,
      mimetype: fileObj.mimetype || 'application/octet-stream',
      uploadedAt: fileObj.uploadedAt || fileObj.createdAt || new Date(),
      url: `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName || fileObj.filename}`,
      downloadUrl: `${cleanBackendUrl}/api/v1/uploads/download/${folder}/${fileObj.fileName || fileObj.filename}`,
      viewUrl: `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName || fileObj.filename}`
    };
  }

  // Fallback to direct URL if no fileId
  if (fileObj.fileName) {
    return {
      _id: (fileObj._id || fileObj.cvId)?.toString() || undefined,
      cvId: fileObj.cvId?.toString() || undefined,
      filename: fileObj.fileName || fileObj.filename,
      originalName: fileObj.originalName || fileObj.originalname || fileObj.fileName,
      path: fileObj.path || fileObj.filePath,
      size: fileObj.size || 0,
      mimetype: fileObj.mimetype || 'application/octet-stream',
      uploadedAt: fileObj.uploadedAt || fileObj.createdAt || new Date(),
      url: `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName}`,
      downloadUrl: `${cleanBackendUrl}/api/v1/uploads/download/${folder}/${fileObj.fileName}`,
      viewUrl: `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName}`
    };
  }

  // Legacy format
  if (!fileObj.filename && fileObj.originalName) {
    fileObj.filename = fileObj.originalName;
  }

  if (!fileObj.filename) {
    console.warn('⚠️ File missing filename:', fileObj);
    return null;
  }

  return {
    _id: (fileObj._id || fileObj.cvId)?.toString() || undefined,
    cvId: fileObj.cvId?.toString() || undefined,
    filename: fileObj.filename,
    originalName: fileObj.originalName || fileObj.filename,
    path: fileObj.path || fileObj.filePath,
    size: fileObj.size || 0,
    mimetype: fileObj.mimetype || 'application/octet-stream',
    uploadedAt: fileObj.uploadedAt || fileObj.createdAt || new Date(),
    url: `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.filename}`,
    downloadUrl: `${cleanBackendUrl}/api/v1/uploads/download/${folder}/${fileObj.filename}`,
    viewUrl: `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.filename}`
  };
};

// Cleanup function for uploaded files on error
const cleanupUploadedFiles = async (uploadedFiles) => {
  try {
    if (!uploadedFiles || !uploadedFiles.success) return;

    const fs = require('fs').promises;

    if (uploadedFiles.files && Array.isArray(uploadedFiles.files)) {
      for (const file of uploadedFiles.files) {
        if (file.path && file.path.startsWith('/')) {
          try {
            await fs.unlink(file.path);
            console.log(`🗑️  Cleaned up uploaded file: ${file.fileName}`);
          } catch (error) {
            console.warn(`Could not delete file ${file.fileName}:`, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up uploaded files:', error);
  }
};

exports.applyForJob = async (req, res) => {
  try {
    console.log('🔍 [Backend] ===== APPLICATION SUBMISSION STARTED =====');

    // Debug ALL request body fields
    console.log('📦 [Backend] ALL request body fields:', Object.keys(req.body));
    Object.keys(req.body).forEach(key => {
      if (key.includes('tempId') || key.includes('referencePdfs') || key.includes('experiencePdfs')) {
        console.log(`  ${key}: ${typeof req.body[key]} = ${req.body[key]}`);
      }
    });

    // Parse JSON fields
    const parsedBody = { ...req.body };
    const parseField = (fieldName) => {
      if (parsedBody[fieldName] && typeof parsedBody[fieldName] === 'string') {
        try {
          parsedBody[fieldName] = JSON.parse(parsedBody[fieldName]);
        } catch (error) {
          console.log(`⚠️ Failed to parse ${fieldName}:`, error.message);
        }
      }
    };

    ['selectedCVs', 'contactInfo', 'skills', 'references', 'workExperience', 'userInfo'].forEach(parseField);
    req.body = parsedBody;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [Backend] VALIDATION ERRORS:', errors.array());
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { jobId } = req.params;
    const userId = req.user.userId;

    console.log(`👤 [Backend] User ${userId} applying for job ${jobId}`);

    // Check if user is a candidate
    if (req.user.role !== 'candidate') {
      console.log('❌ [Backend] User is not a candidate');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(403).json({
        success: false,
        message: 'Only candidates can apply for jobs'
      });
    }

    // Check if job exists
    const job = await Job.findOne({
      _id: jobId,
      status: 'active'
    }).populate('company organization');

    if (!job) {
      console.log('❌ [Backend] Job not found:', jobId);
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log('✅ [Backend] Job found:', job.title);

    // Check deadline
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      console.log('❌ [Backend] Job deadline passed');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Check duplicate application
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: userId
    });

    if (existingApplication) {
      console.log('❌ [Backend] User already applied');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Get candidate profile
    const candidate = await User.findById(userId)
      .select('name email phone location avatar bio website socialLinks skills education experience certifications cvs')
      .lean();

    if (!candidate) {
      console.log('❌ [Backend] Candidate profile not found');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    console.log('✅ [Backend] Candidate profile found');

    // ===== SIMPLIFIED: Process uploaded files =====
    const uploadedFiles = {
      referenceFiles: {},
      experienceFiles: {}
    };

    console.log('📁 [Backend] Uploaded files by field:', Object.keys(req.uploadedFilesByField || {}));

    if (req.uploadedFilesByField) {
      Object.entries(req.uploadedFilesByField).forEach(([field, data]) => {
        console.log(`📁 [Backend] Processing ${field}: ${data.count} file(s)`);

        data.files.forEach((file, fileIndex) => {
          console.log(`  File ${fileIndex}: ${file.fileName}`);

          // SIMPLE METADATA PARSING
          let _tempId = null;

          // Try multiple metadata formats
          const possibleKeys = [
            `${field}_${fileIndex}_tempId`,  // referencePdfs_0_tempId
            `referencePdfs_${fileIndex}_tempId`,
            `experiencePdfs_${fileIndex}_tempId`,
            `${field}_metadata_${fileIndex}`, // JSON metadata
          ];

          for (const key of possibleKeys) {
            if (req.body[key]) {
              console.log(`  Found metadata at ${key}: ${req.body[key]}`);

              const value = req.body[key];
              if (typeof value === 'string') {
                if (value.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(value);
                    _tempId = parsed._tempId || parsed.tempId;
                  } catch (error) {
                    _tempId = value;
                  }
                } else {
                  _tempId = value;
                }
              }
              break;
            }
          }

          if (!_tempId) {
            // Try to extract from references/workExperience data
            const parsedData = parsedBody[field === 'referencePdfs' ? 'references' : 'workExperience'];
            if (parsedData && parsedData[fileIndex]) {
              _tempId = parsedData[fileIndex]._tempId;
            }
          }

          if (_tempId) {
            if (field === 'referencePdfs') {
              uploadedFiles.referenceFiles[_tempId] = { ...file, _tempId };
              console.log(`✅ [Backend] Matched reference file to tempId: ${_tempId}`);
            } else if (field === 'experiencePdfs') {
              uploadedFiles.experienceFiles[_tempId] = { ...file, _tempId };
              console.log(`✅ [Backend] Matched experience file to tempId: ${_tempId}`);
            }
          } else {
            console.log(`❌ [Backend] No metadata for ${field}[${fileIndex}]`);
          }
        });
      });
    }

    console.log('📊 [Backend] Uploaded files:', {
      referenceFiles: Object.keys(uploadedFiles.referenceFiles),
      experienceFiles: Object.keys(uploadedFiles.experienceFiles)
    });

    // Get form data
    const {
      coverLetter,
      skills: applicationSkills = [],
      references = [],
      workExperience = [],
      contactInfo = {},
      selectedCVs = [],
      userInfo = {}
    } = parsedBody;

    console.log('📝 [Backend] Data counts:', {
      coverLetter: coverLetter?.length,
      skills: applicationSkills.length,
      references: references.length,
      workExperience: workExperience.length,
      selectedCVs: selectedCVs.length
    });

    // Validate cover letter
    if (!coverLetter || coverLetter.trim().length === 0) {
      console.log('❌ [Backend] Cover letter missing');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Cover letter is required'
      });
    }

    if (coverLetter.length > 5000) {
      console.log('❌ [Backend] Cover letter too long');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Cover letter cannot exceed 5000 characters'
      });
    }

    // Validate CVs
    if (!selectedCVs || selectedCVs.length === 0) {
      console.log('❌ [Backend] No CVs selected');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'At least one CV must be selected'
      });
    }

    const userCVIds = candidate.cvs ? candidate.cvs.map(cv => cv._id.toString()) : [];
    const invalidCVs = selectedCVs.filter(cv => !userCVIds.includes(cv.cvId));

    if (invalidCVs.length > 0) {
      console.log('❌ [Backend] Invalid CV selection');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Invalid CV selection - CV does not belong to user'
      });
    }

    console.log('✅ [Backend] All validations passed');

    // Combine skills
    const profileSkills = candidate.skills || [];
    const skills = [...new Set([...profileSkills, ...applicationSkills])];

    // FIX 1: Prepare CVs with correct field names from User model
    const selectedCVsData = selectedCVs.map(cvData => {
      const userCV = candidate.cvs.find(cv => cv._id.toString() === cvData.cvId);
      if (!userCV) throw new Error(`CV not found: ${cvData.cvId}`);

      // User model stores: fileName, filePath, fileUrl, downloadUrl
      return {
        cvId: userCV._id,
        filename: userCV.fileName || userCV.filename,  // Check both field names
        originalName: userCV.originalName || userCV.fileName || userCV.filename,
        path: userCV.filePath || userCV.path || "",    // Check both field names
        size: userCV.size || 0,
        mimetype: userCV.mimetype || 'application/octet-stream',
        url: userCV.fileUrl || userCV.url || `/api/v1/uploads/cv/${userCV.fileName || userCV.filename}`,
        downloadUrl: userCV.downloadUrl || `/api/v1/uploads/cv/${userCV.fileName || userCV.filename}`,
        uploadedAt: userCV.uploadedAt || new Date()
      };
    });

    // Process references with files
    const processedReferences = references.map((ref, index) => {
      console.log(`🔍 [Backend] Processing reference ${index + 1}:`, {
        _tempId: ref._tempId,
        providedAsDocument: ref.providedAsDocument
      });

      let document = null;

      if (ref._tempId && uploadedFiles.referenceFiles[ref._tempId]) {
        const uploadedFile = uploadedFiles.referenceFiles[ref._tempId];
        console.log(`✅ [Backend] Attaching document to reference:`, uploadedFile.fileName);

        document = {
          filename: uploadedFile.fileName,
          originalName: uploadedFile.originalName,
          path: uploadedFile.path,
          size: uploadedFile.size,
          mimetype: uploadedFile.mimetype,
          url: uploadedFile.url,
          downloadUrl: uploadedFile.downloadUrl,
          uploadedAt: new Date()
        };

        delete uploadedFiles.referenceFiles[ref._tempId];
      }

      const { _tempId, ...refData } = ref;

      return {
        ...refData,
        document,
        providedAsDocument: !!document
      };
    });

    // Process work experience with files
    const processedWorkExperience = workExperience.map((exp, index) => {
      console.log(`🔍 [Backend] Processing work experience ${index + 1}:`, {
        _tempId: exp._tempId,
        providedAsDocument: exp.providedAsDocument
      });

      let document = null;

      if (exp._tempId && uploadedFiles.experienceFiles[exp._tempId]) {
        const uploadedFile = uploadedFiles.experienceFiles[exp._tempId];
        console.log(`✅ [Backend] Attaching document to experience:`, uploadedFile.fileName);

        document = {
          filename: uploadedFile.fileName,
          originalName: uploadedFile.originalName,
          path: uploadedFile.path,
          size: uploadedFile.size,
          mimetype: uploadedFile.mimetype,
          url: uploadedFile.url,
          downloadUrl: uploadedFile.downloadUrl,
          uploadedAt: new Date()
        };

        delete uploadedFiles.experienceFiles[exp._tempId];
      }

      const { _tempId, ...expData } = exp;

      return {
        ...expData,
        document,
        providedAsDocument: !!document
      };
    });

    // Create application
    const applicationData = {
      job: jobId,
      candidate: userId,
      userInfo: userInfo || {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        avatar: candidate.avatar,
        bio: candidate.bio,
        website: candidate.website,
        socialLinks: candidate.socialLinks
      },
      selectedCVs: selectedCVsData,
      coverLetter: coverLetter.trim(),
      skills: skills,
      references: processedReferences,
      workExperience: processedWorkExperience,
      contactInfo: {
        email: contactInfo?.email || candidate.email,
        phone: contactInfo?.phone || candidate.phone,
        telegram: contactInfo?.telegram || '',
        location: contactInfo?.location || candidate.location
      },
      attachments: {
        referenceDocuments: [],
        experienceDocuments: [],
        portfolioFiles: [],
        otherDocuments: []
      },
      statusHistory: [{
        status: 'applied',
        changedBy: userId,
        changedAt: new Date(),
        message: 'Application submitted'
      }]
    };

    console.log('📝 [Backend] Creating application with:', {
      referencesWithDocs: processedReferences.filter(ref => ref.document).length,
      experienceWithDocs: processedWorkExperience.filter(exp => exp.document).length
    });

    const application = await Application.create(applicationData);
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company organization jobType')
      .populate('candidate', 'name email')
      .lean();

    console.log('🎉 [Backend] Application created:', application._id);
    console.log('📊 [Backend] Final stats:', {
      referencesWithDocs: populatedApplication.references?.filter(ref => ref.document)?.length,
      experienceWithDocs: populatedApplication.workExperience?.filter(exp => exp.document)?.length
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application: populatedApplication }
    });

  } catch (error) {
    await cleanupUploadedFiles(req.uploadedFiles);
    console.error('❌ [Backend] Apply for job error:', error);

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
      message: 'Error submitting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get candidate's applications
// @route   GET /api/v1/applications/my-applications
// @access  Private (Candidate)
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`📋 Getting applications for user: ${userId}`);

    const filter = { candidate: userId };
    if (status) filter.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const applications = await Application.find(filter)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'company',
            select: 'name logoUrl verified industry',
            model: 'Company'
          },
          {
            path: 'organization',
            select: 'name logoUrl verified industry organizationType',
            model: 'Organization'
          }
        ]
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Application.countDocuments(filter);

    console.log(`✅ Found ${applications.length} applications for user ${userId}`);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get candidate's CVs for job application
// @route   GET /api/v1/applications/my-cvs
// @access  Private (Candidate)
exports.getMyCVs = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user is a candidate
    if (req.user.role !== 'candidate') {
      return res.status(403).json({
        success: false,
        message: 'Only candidates can access CVs'
      });
    }

    const candidate = await User.findById(userId)
      .select('cvs name email')
      .lean();

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    // FIX 2: Format CVs with correct field names from User model
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const baseUrl = `${backendUrl}/api/v1/uploads/cv`;

    const formattedCVs = (candidate.cvs || []).map(cv => {
      // User model stores: fileName, filePath, fileUrl
      const filename = cv.fileName || cv.filename;
      return {
        _id: cv._id,
        filename: filename,  // Use the resolved filename
        originalName: cv.originalName || filename,
        path: cv.filePath || cv.path,
        size: cv.size || 0,
        mimetype: cv.mimetype || 'application/octet-stream',
        uploadedAt: cv.uploadedAt,
        isDefault: cv.isPrimary || false,
        isPrimary: cv.isPrimary || false,
        url: cv.fileUrl || cv.url || `${baseUrl}/${filename}`,
        downloadUrl: cv.downloadUrl || `${baseUrl}/${filename}`,
        viewUrl: cv.viewUrl || `${baseUrl}/view/${filename}`
      };
    });

    res.status(200).json({
      success: true,
      data: {
        cvs: formattedCVs,
        candidateInfo: {
          name: candidate.name,
          email: candidate.email
        }
      }
    });

  } catch (error) {
    console.error('Get candidate CVs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CVs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get application details
// @route   GET /api/v1/applications/:applicationId
// @access  Private (Candidate, Company, Organization, Admin)
exports.getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`🔍 Getting application details for: ${applicationId}`);
    console.log(`👤 User: ${userId}, Role: ${userRole}`);

    // Validate if applicationId is a valid MongoDB ObjectId
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'company',
            model: 'Company',
            select: 'name logoUrl verified industry user'
          },
          {
            path: 'organization',
            model: 'Organization',
            select: 'name logoUrl verified industry organizationType user'
          }
        ]
      })
      .populate('candidate', 'name email avatar phone location')
      .populate('statusHistory.changedBy', 'name email')
      .populate('companyResponse.respondedBy', 'name email')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    console.log(`📄 Application found for job:`, application.job?._id);
    console.log(`👥 Candidate:`, application.candidate);
    console.log(`🏢 Job Type: ${application.job?.jobType}`);

    // Check permissions - COMPLETE AUTHORIZATION LOGIC
    let hasPermission = false;

    if (userRole === 'candidate') {
      const candidateId = application.candidate._id ?
        application.candidate._id.toString() :
        application.candidate?.toString();

      const userIdString = userId.toString ? userId.toString() : userId;

      hasPermission = candidateId === userIdString;

      console.log(`👤 Candidate permission check:`, {
        candidateId,
        userId: userIdString,
        hasPermission
      });
    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job && application.job.jobType === 'company') {
        const jobCompanyId = application.job.company?._id ?
          application.job.company._id.toString() :
          application.job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();

        console.log(`🏢 Company permission check:`, {
          jobCompanyId,
          companyId: company._id.toString(),
          hasPermission
        });
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job && application.job.jobType === 'organization') {
        const jobOrganizationId = application.job.organization?._id ?
          application.job.organization._id.toString() :
          application.job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();

        console.log(`🏛️ Organization permission check:`, {
          jobOrganizationId,
          organizationId: organization._id.toString(),
          hasPermission
        });
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log('❌ Authorization failed:', {
        userRole,
        userId: userId.toString ? userId.toString() : userId,
        applicationId,
        candidateId: application.candidate._id?.toString() || application.candidate?.toString(),
        jobOwner: application.job?.company?._id || application.job?.organization?._id,
        jobType: application.job?.jobType
      });

      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    console.log('✅ Authorization granted for application');

    // Format the response with properly structured file data using universal formatter
    const applicationResponse = {
      ...application,

      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        const formatted = formatFileDataUniversal(cv, 'cv');
        if (!formatted) return null;
        const resolvedId = cv.cvId?.toString() || cv._id?.toString();
        return {
          ...formatted,
          cvId: resolvedId || formatted.cvId,
          _id:  resolvedId || formatted._id,
        };
      }).filter(cv => cv !== null),

      attachments: {
        referenceDocuments: (application.attachments?.referenceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        portfolioFiles: (application.attachments?.portfolioFiles || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        otherDocuments: (application.attachments?.otherDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications'))
      },

      references: (application.references || []).map(ref => {
        if (!ref) return null;
        if (ref.document) {
          return {
            ...ref,
            document: formatFileDataUniversal(ref.document, 'applications')
          };
        }
        return ref;
      }).filter(ref => ref !== null),

      workExperience: (application.workExperience || []).map(exp => {
        if (!exp) return null;
        if (exp.document) {
          return {
            ...exp,
            document: formatFileDataUniversal(exp.document, 'applications')
          };
        }
        return exp;
      }).filter(exp => exp !== null)
    };

    console.log('✅ Application formatted with proper file URLs');
    console.log('📊 Final file counts:', {
      selectedCVs: applicationResponse.selectedCVs.length,
      cvIds: applicationResponse.selectedCVs.map(cv => ({ id: cv._id, cvId: cv.cvId, filename: cv.filename })),
      references: applicationResponse.references.length,
      referenceDocuments: applicationResponse.references.filter(ref => ref.document).length,
      workExperience: applicationResponse.workExperience.length,
      experienceDocuments: applicationResponse.workExperience.filter(exp => exp.document).length
    });

    res.status(200).json({
      success: true,
      data: { application: applicationResponse }
    });

  } catch (error) {
    console.error('❌ Get application details error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching application details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get applications for a job (Company/Organization)
// @route   GET /api/v1/applications/job/:jobId
// @access  Private (Company, Organization, Admin)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Verify job exists and user has permission
    const job = await Job.findById(jobId)
      .populate('company organization')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    let hasPermission = false;

    if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && job.jobType === 'company') {
        const jobCompanyId = job.company?._id ? job.company._id.toString() : job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && job.jobType === 'organization') {
        const jobOrganizationId = job.organization?._id ? job.organization._id.toString() : job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    const filter = { job: jobId };
    if (status) filter.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const applications = await Application.find(filter)
      .populate('candidate', 'name email avatar location phone skills education experience certifications')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job applications'
    });
  }
};

// @desc    Get all company applications (across all jobs)
// @route   GET /api/v1/applications/company/applications
// @access  Private (Company, Admin)
exports.getCompanyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`🏢 Getting all applications for company user: ${userId}`);

    // Find company
    const company = await Company.findOne({ user: userId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Find all jobs for this company
    const companyJobs = await Job.find({
      company: company._id,
      jobType: 'company'
    }).select('_id');

    const jobIds = companyJobs.map(job => job._id);

    const filter = { job: { $in: jobIds } };
    if (status) filter.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const applications = await Application.find(filter)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'company',
            select: 'name logoUrl verified industry',
            model: 'Company'
          }
        ]
      })
      .populate('candidate', 'name email avatar location phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Application.countDocuments(filter);

    console.log(`✅ Found ${applications.length} applications across ${jobIds.length} jobs for company ${company.name}`);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Get company applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all organization applications (across all jobs)
// @route   GET /api/v1/applications/organization/applications
// @access  Private (Organization, Admin)
exports.getOrganizationApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`🏛️ Getting all applications for organization user: ${userId}`);

    // Find organization
    const organization = await Organization.findOne({ user: userId });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Find all jobs for this organization
    const organizationJobs = await Job.find({
      organization: organization._id,
      jobType: 'organization'
    }).select('_id');

    const jobIds = organizationJobs.map(job => job._id);

    const filter = { job: { $in: jobIds } };
    if (status) filter.status = status;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const applications = await Application.find(filter)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'organization',
            select: 'name logoUrl verified industry organizationType',
            model: 'Organization'
          }
        ]
      })
      .populate('candidate', 'name email avatar location phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Application.countDocuments(filter);

    console.log(`✅ Found ${applications.length} applications across ${jobIds.length} opportunities for organization ${organization.name}`);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Get organization applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update application status (Company/Organization)
// @route   PUT /api/v1/applications/:applicationId/status
// @access  Private (Company, Organization, Admin)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, message, interviewDetails } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = [
      'applied', 'under-review', 'shortlisted', 'interview-scheduled',
      'interviewed', 'offer-pending', 'offer-made', 'offer-accepted',
      'offer-rejected', 'on-hold', 'rejected', 'withdrawn'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company' },
          { path: 'organization', model: 'Organization' }
        ]
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    let hasPermission = false;

    if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job && application.job.jobType === 'company') {
        const jobCompanyId = application.job.company?._id ? application.job.company._id.toString() : application.job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job && application.job.jobType === 'organization') {
        const jobOrganizationId = application.job.organization?._id ? application.job.organization._id.toString() : application.job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Update status with history
    await application.updateStatus(status, userId, message, interviewDetails);

    const updatedApplication = await Application.findById(applicationId)
      .populate('statusHistory.changedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status'
    });
  }
};

// @desc    Add company response to application
// @route   PUT /api/v1/applications/:applicationId/company-response
// @access  Private (Company, Organization, Admin)
exports.addCompanyResponse = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, message, interviewLocation } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Response status is required'
      });
    }

    const validStatuses = [
      'active-consideration', 'on-hold', 'rejected', 'selected-for-interview'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response status'
      });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company' },
          { path: 'organization', model: 'Organization' }
        ]
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    let hasPermission = false;

    if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job && application.job.jobType === 'company') {
        const jobCompanyId = application.job.company?._id ? application.job.company._id.toString() : application.job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job && application.job.jobType === 'organization') {
        const jobOrganizationId = application.job.organization?._id ? application.job.organization._id.toString() : application.job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this application'
      });
    }

    // Add company response
    await application.addCompanyResponse(status, userId, message, interviewLocation);

    const updatedApplication = await Application.findById(applicationId)
      .populate('companyResponse.respondedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    console.error('Add company response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding company response'
    });
  }
};

// @desc    Withdraw application
// @route   PUT /api/v1/applications/:applicationId/withdraw
// @access  Private (Candidate)
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns the application
    if (application.candidate.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application'
      });
    }

    // Check if application can be withdrawn
    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Application is already withdrawn'
      });
    }

    if (['offer-accepted', 'offer-made', 'interviewed'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application at this stage'
      });
    }

    // Update status to withdrawn
    await application.updateStatus('withdrawn', userId, 'Application withdrawn by candidate');

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application'
    });
  }
};

// @desc    Get application statistics
// @route   GET /api/v1/applications/statistics/overview
// @access  Private (Candidate, Company, Organization, Admin)
exports.getApplicationStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let statistics = {};

    if (userRole === 'candidate') {
      const totalApplications = await Application.countDocuments({ candidate: userId });
      const underReview = await Application.countDocuments({
        candidate: userId,
        status: 'under-review'
      });
      const shortlisted = await Application.countDocuments({
        candidate: userId,
        status: 'shortlisted'
      });
      const interviewScheduled = await Application.countDocuments({
        candidate: userId,
        status: 'interview-scheduled'
      });
      const rejected = await Application.countDocuments({
        candidate: userId,
        status: 'rejected'
      });
      const offerMade = await Application.countDocuments({
        candidate: userId,
        status: 'offer-made'
      });

      statistics = {
        totalApplications,
        underReview,
        shortlisted,
        interviewScheduled,
        rejected,
        offerMade,
        successRate: totalApplications > 0 ? ((shortlisted + interviewScheduled + offerMade) / totalApplications * 100).toFixed(1) : 0
      };

    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      const jobs = await Job.find({
        company: company._id,
        jobType: 'company'
      }).select('_id');

      const jobIds = jobs.map(job => job._id);

      const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
      const newApplications = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'applied'
      });
      const underReview = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'under-review'
      });
      const shortlisted = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'shortlisted'
      });
      const interviewScheduled = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'interview-scheduled'
      });
      const rejected = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'rejected'
      });
      const hired = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'offer-accepted'
      });

      statistics = {
        totalApplications,
        newApplications,
        underReview,
        shortlisted,
        interviewScheduled,
        rejected,
        hired,
        jobsPosted: jobs.length
      };

    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      const jobs = await Job.find({
        organization: organization._id,
        jobType: 'organization'
      }).select('_id');

      const jobIds = jobs.map(job => job._id);

      const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
      const newApplications = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'applied'
      });
      const underReview = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'under-review'
      });
      const shortlisted = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'shortlisted'
      });
      const interviewScheduled = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'interview-scheduled'
      });
      const rejected = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'rejected'
      });
      const hired = await Application.countDocuments({
        job: { $in: jobIds },
        status: 'offer-accepted'
      });

      statistics = {
        totalApplications,
        newApplications,
        underReview,
        shortlisted,
        interviewScheduled,
        rejected,
        hired,
        jobsPosted: jobs.length
      };
    }

    res.status(200).json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    console.error('Get application statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics'
    });
  }
};

// @desc    Get company-specific application details
// @route   GET /api/v1/applications/company/:applicationId
// @access  Private (Company, Admin)
exports.getCompanyApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;

    console.log(`🏢 Getting company-specific application: ${applicationId} for user: ${userId}`);

    // Validate applicationId
    if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Validate if applicationId is a valid MongoDB ObjectId
    if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'company',
            model: 'Company',
            select: 'name logoUrl verified industry user'
          }
        ]
      })
      .populate('candidate', 'name email avatar phone location')
      .populate('statusHistory.changedBy', 'name email')
      .populate('companyResponse.respondedBy', 'name email')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify company owns the job
    const company = await Company.findOne({ user: userId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const jobCompanyId = application.job?.company?._id ?
      application.job.company._id.toString() :
      application.job?.company?.toString();

    if (!jobCompanyId || jobCompanyId !== company._id.toString() || application.job?.jobType !== 'company') {
      console.log('❌ Company authorization failed:', {
        jobCompanyId,
        companyId: company._id.toString(),
        jobType: application.job?.jobType
      });

      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    console.log('✅ Company authorization granted');

    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        const formatted = formatFileDataUniversal(cv, 'cv');
        if (!formatted) return null;
        const resolvedId = cv.cvId?.toString() || cv._id?.toString();
        return {
          ...formatted,
          cvId: resolvedId || formatted.cvId,
          _id:  resolvedId || formatted._id,
        };
      }).filter(cv => cv !== null),
      attachments: {
        referenceDocuments: (application.attachments?.referenceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        portfolioFiles: (application.attachments?.portfolioFiles || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        otherDocuments: (application.attachments?.otherDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications'))
      },
      references: (application.references || []).map(ref => {
        if (!ref) return null;
        if (ref.document) {
          return {
            ...ref,
            document: formatFileDataUniversal(ref.document, 'applications')
          };
        }
        return ref;
      }).filter(ref => ref !== null),
      workExperience: (application.workExperience || []).map(exp => {
        if (!exp) return null;
        if (exp.document) {
          return {
            ...exp,
            document: formatFileDataUniversal(exp.document, 'applications')
          };
        }
        return exp;
      }).filter(exp => exp !== null)
    };

    res.status(200).json({
      success: true,
      data: { application: applicationResponse }
    });

  } catch (error) {
    console.error('❌ Get company application details error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching application details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get organization-specific application details
// @route   GET /api/v1/applications/organization/:applicationId
// @access  Private (Organization, Admin)
exports.getOrganizationApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;

    console.log(`🏛️ Getting organization-specific application: ${applicationId} for user: ${userId}`);

    // Validate applicationId
    if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Validate if applicationId is a valid MongoDB ObjectId
    if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          {
            path: 'organization',
            model: 'Organization',
            select: 'name logoUrl verified industry organizationType user'
          }
        ]
      })
      .populate('candidate', 'name email avatar phone location')
      .populate('statusHistory.changedBy', 'name email')
      .populate('companyResponse.respondedBy', 'name email')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify organization owns the job
    const organization = await Organization.findOne({ user: userId });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const jobOrganizationId = application.job?.organization?._id ?
      application.job.organization._id.toString() :
      application.job?.organization?.toString();

    if (!jobOrganizationId || jobOrganizationId !== organization._id.toString() || application.job?.jobType !== 'organization') {
      console.log('❌ Organization authorization failed:', {
        jobOrganizationId,
        organizationId: organization._id.toString(),
        jobType: application.job?.jobType
      });

      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    console.log('✅ Organization authorization granted');

    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        const formatted = formatFileDataUniversal(cv, 'cv');
        if (!formatted) return null;
        const resolvedId = cv.cvId?.toString() || cv._id?.toString();
        return {
          ...formatted,
          cvId: resolvedId || formatted.cvId,
          _id:  resolvedId || formatted._id,
        };
      }).filter(cv => cv !== null),
      attachments: {
        referenceDocuments: (application.attachments?.referenceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        portfolioFiles: (application.attachments?.portfolioFiles || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        otherDocuments: (application.attachments?.otherDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications'))
      },
      references: (application.references || []).map(ref => {
        if (!ref) return null;
        if (ref.document) {
          return {
            ...ref,
            document: formatFileDataUniversal(ref.document, 'applications')
          };
        }
        return ref;
      }).filter(ref => ref !== null),
      workExperience: (application.workExperience || []).map(exp => {
        if (!exp) return null;
        if (exp.document) {
          return {
            ...exp,
            document: formatFileDataUniversal(exp.document, 'applications')
          };
        }
        return exp;
      }).filter(exp => exp !== null)
    };

    res.status(200).json({
      success: true,
      data: { application: applicationResponse }
    });

  } catch (error) {
    console.error('❌ Get organization application details error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching application details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Download application file (authenticated)
// @route   GET /api/v1/applications/:applicationId/files/:fileId/download
// @access  Private (based on application ownership)
exports.downloadApplicationFile = async (req, res) => {
  try {
    const { applicationId, fileId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`📥 Download request: application=${applicationId}, file=${fileId}`);

    // Handle different ID formats (cv-xxx, ref-xxx, exp-xxx)
    const cleanFileId = fileId.replace(/^(cv-|ref-|exp-|att-)/, '');
    console.log(`🔄 Cleaned file ID: ${cleanFileId}`);

    // Validate IDs
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    // Get application with minimal data for permission check
    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company', select: 'name user' },
          { path: 'organization', model: 'Organization', select: 'name user' }
        ]
      })
      .populate('candidate', 'name')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    let hasPermission = false;

    if (userRole === 'candidate') {
      const candidateId = application.candidate._id ?
        application.candidate._id.toString() :
        application.candidate?.toString();
      hasPermission = candidateId === userId.toString();
    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job && application.job.jobType === 'company') {
        const jobCompanyId = application.job.company?._id ?
          application.job.company._id.toString() :
          application.job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job && application.job.jobType === 'organization') {
        const jobOrganizationId = application.job.organization?._id ?
          application.job.organization._id.toString() :
          application.job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log('❌ No permission to download file');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this file'
      });
    }

    console.log('✅ Permission granted, finding file...');

    // Find the file in the application
    let fileData = null;
    let filePath = null;
    let fileName = null;
    let foundIn = '';

    // Search in selected CVs (most common issue - CVs)
    if (application.selectedCVs && application.selectedCVs.length > 0) {
      console.log(`🔍 Searching in ${application.selectedCVs.length} CVs...`);

      for (const cv of application.selectedCVs) {
        // FIX 3A: Robust ID extraction with optional chaining and toString()
        const cvId = cv.cvId?.toString() || cv._id?.toString() || '';
        const filenameMatch = cv.filename === cleanFileId || cv.filename === fileId;

        console.log(`📋 CV: id=${cvId}, filename=${cv.filename}, matches=${cvId === cleanFileId || filenameMatch}`);

        if (cvId === cleanFileId || filenameMatch || cv._id?.toString() === cleanFileId) {
          fileData = cv;
          // FIX 3B: Check both filePath and path field names
          filePath = cv.filePath || cv.path;
          fileName = cv.originalName || cv.fileName || cv.filename || 'CV';
          foundIn = 'CVs';
          console.log(`✅ Found in CVs: ${fileName}`);
          break;
        }
      }
    }

    // Search in references
    if (!fileData && application.references && application.references.length > 0) {
      console.log(`🔍 Searching in ${application.references.length} references...`);

      for (const ref of application.references) {
        if (ref.document) {
          const docId = ref.document._id ? ref.document._id.toString() : '';
          const filenameMatch = ref.document.filename === cleanFileId || ref.document.filename === fileId;

          if ((docId && docId === cleanFileId) || filenameMatch) {
            fileData = ref.document;
            filePath = ref.document.path;
            fileName = ref.document.originalName || ref.document.filename;
            foundIn = 'references';
            console.log(`✅ Found in references: ${fileName}`);
            break;
          }
        }
      }
    }

    // Search in work experience
    if (!fileData && application.workExperience && application.workExperience.length > 0) {
      console.log(`🔍 Searching in ${application.workExperience.length} work experiences...`);

      for (const exp of application.workExperience) {
        if (exp.document) {
          const docId = exp.document._id ? exp.document._id.toString() : '';
          const filenameMatch = exp.document.filename === cleanFileId || exp.document.filename === fileId;

          if ((docId && docId === cleanFileId) || filenameMatch) {
            fileData = exp.document;
            filePath = exp.document.path;
            fileName = exp.document.originalName || exp.document.filename;
            foundIn = 'workExperience';
            console.log(`✅ Found in work experience: ${fileName}`);
            break;
          }
        }
      }
    }

    // Search in other attachments
    if (!fileData && application.attachments) {
      const allAttachments = [
        ...(application.attachments.referenceDocuments || []),
        ...(application.attachments.experienceDocuments || []),
        ...(application.attachments.portfolioFiles || []),
        ...(application.attachments.otherDocuments || [])
      ];

      console.log(`🔍 Searching in ${allAttachments.length} other attachments...`);

      for (const att of allAttachments) {
        if (att._id && att._id.toString() === cleanFileId) {
          fileData = att;
          filePath = att.path;
          fileName = att.originalName || att.filename;
          foundIn = 'attachments';
          console.log(`✅ Found in attachments: ${fileName}`);
          break;
        }
      }
    }

    if (!fileData) {
      console.log('❌ File not found in application:', {
        fileId,
        cleanFileId,
        searchedIn: ['CVs', 'references', 'workExperience', 'attachments']
      });
      return res.status(404).json({
        success: false,
        message: 'File not found in this application'
      });
    }

    console.log(`✅ File found in ${foundIn}: ${fileName}`);

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const folder = foundIn === 'CVs' ? 'cv' : 'applications';
    // FIX 3C: Check fileName first, then filename
    const filename = fileData.fileName || fileData.filename;

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: 'File has no filename'
      });
    }

    const possiblePaths = [
      path.join(uploadBase, folder, filename),                    // priority 1: UPLOAD_BASE_PATH + folder
      path.join('/app', 'uploads', folder, filename),             // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', folder, filename),      // priority 3: fallback
      path.join(uploadBase, 'applications', filename),            // priority 4: cross-folder fallback
      path.join('/app', 'uploads', 'applications', filename),     // priority 5: Docker cross-folder
      // FIX 3D: Add filePath as fallback with both field names
      (!isWindowsPath(fileData.filePath || filePath) ? (fileData.filePath || filePath) : null)
    ].filter(Boolean);

    console.log('🔍 Searching for file in paths:', possiblePaths);

    filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        console.log(`✅ Found file at: ${filePath}`);
        break;
      }
    }

    if (!filePath) {
      console.log('❌ File not found on server');
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    console.log(`✅ Serving file: ${fileName} from ${filePath}`);

    // Set headers for download
    res.setHeader('Content-Type', fileData.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

  } catch (error) {
    console.error('❌ Download application file error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// @desc    View application file inline (authenticated)
// @route   GET /api/v1/applications/:applicationId/files/:fileId/view
// @access  Private (based on application ownership)
exports.viewApplicationFile = async (req, res) => {
  try {
    const { applicationId, fileId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`👁️ View request: application=${applicationId}, file=${fileId}`);

    // Handle different ID formats
    const cleanFileId = fileId.replace(/^(cv-|ref-|exp-|att-)/, '');

    // Validate IDs
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    // Get application with minimal data for permission check
    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company', select: 'name user' },
          { path: 'organization', model: 'Organization', select: 'name user' }
        ]
      })
      .populate('candidate', 'name')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions (same as download)
    let hasPermission = false;

    if (userRole === 'candidate') {
      const candidateId = application.candidate._id ?
        application.candidate._id.toString() :
        application.candidate?.toString();
      hasPermission = candidateId === userId.toString();
    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job && application.job.jobType === 'company') {
        const jobCompanyId = application.job.company?._id ?
          application.job.company._id.toString() :
          application.job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job && application.job.jobType === 'organization') {
        const jobOrganizationId = application.job.organization?._id ?
          application.job.organization._id.toString() :
          application.job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log('❌ No permission to view file');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this file'
      });
    }

    // Find the file in the application (same logic as download)
    let fileData = null;
    let filePath = null;
    let fileName = null;
    let foundIn = '';

    // Search in selected CVs
    if (application.selectedCVs && application.selectedCVs.length > 0) {
      for (const cv of application.selectedCVs) {
        // FIX 4A: Robust ID extraction with optional chaining and toString()
        const cvId = cv.cvId?.toString() || cv._id?.toString() || '';
        if (cvId === cleanFileId || cv._id?.toString() === cleanFileId || cv.filename === fileId) {
          fileData = cv;
          // FIX 4B: Check both filePath and path field names
          filePath = cv.filePath || cv.path;
          fileName = cv.originalName || cv.fileName || cv.filename || 'CV';
          foundIn = 'CVs';
          break;
        }
      }
    }

    // Search in references
    if (!fileData && application.references && application.references.length > 0) {
      for (const ref of application.references) {
        if (ref.document && ref.document._id && ref.document._id.toString() === cleanFileId) {
          fileData = ref.document;
          filePath = ref.document.path;
          fileName = ref.document.originalName || ref.document.filename;
          foundIn = 'references';
          break;
        }
      }
    }

    // Search in work experience
    if (!fileData && application.workExperience && application.workExperience.length > 0) {
      for (const exp of application.workExperience) {
        if (exp.document && exp.document._id && exp.document._id.toString() === cleanFileId) {
          fileData = exp.document;
          filePath = exp.document.path;
          fileName = exp.document.originalName || exp.document.filename;
          foundIn = 'workExperience';
          break;
        }
      }
    }

    // Search in other attachments
    if (!fileData && application.attachments) {
      const allAttachments = [
        ...(application.attachments.referenceDocuments || []),
        ...(application.attachments.experienceDocuments || []),
        ...(application.attachments.portfolioFiles || []),
        ...(application.attachments.otherDocuments || [])
      ];

      for (const att of allAttachments) {
        if (att._id && att._id.toString() === cleanFileId) {
          fileData = att;
          filePath = att.path;
          fileName = att.originalName || att.filename;
          foundIn = 'attachments';
          break;
        }
      }
    }

    if (!fileData || !filePath) {
      console.log('❌ File not found in application:', fileId);
      return res.status(404).json({
        success: false,
        message: 'File not found in this application'
      });
    }

    // Check if file can be viewed inline
    const inlineTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/html'
    ];

    const canViewInline = fileData.mimetype && inlineTypes.includes(fileData.mimetype);

    if (!canViewInline) {
      console.log('❌ File type cannot be viewed inline:', fileData.mimetype);
      return res.status(400).json({
        success: false,
        message: 'This file type cannot be viewed inline. Please download it.'
      });
    }

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const folder = foundIn === 'CVs' ? 'cv' : 'applications';
    // FIX 4C: Check fileName first, then filename
    const filename = fileData.fileName || fileData.filename;

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: 'File has no filename'
      });
    }

    const possiblePaths = [
      path.join(uploadBase, folder, filename),                    // priority 1: UPLOAD_BASE_PATH + folder
      path.join('/app', 'uploads', folder, filename),             // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', folder, filename),      // priority 3: fallback
      path.join(uploadBase, 'applications', filename),            // priority 4: cross-folder fallback
      path.join('/app', 'uploads', 'applications', filename),     // priority 5: Docker cross-folder
      // FIX 4D: Add filePath as fallback with both field names
      (!isWindowsPath(fileData.filePath || filePath) ? (fileData.filePath || filePath) : null)
    ].filter(Boolean);

    console.log('🔍 Searching for file in paths:', possiblePaths);

    filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        console.log(`✅ Found file at: ${filePath}`);
        break;
      }
    }

    if (!filePath) {
      console.log('❌ File not found on server');
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    console.log(`✅ Viewing file inline: ${fileName} from ${filePath}`);

    // Set headers for inline viewing
    res.setHeader('Content-Type', fileData.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

  } catch (error) {
    console.error('❌ View application file error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error viewing file',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// @desc    Get all attachments for an application
// @route   GET /api/v1/applications/:applicationId/attachments
// @access  Private (based on application ownership)
exports.getApplicationAttachments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`📁 Getting attachments for application: ${applicationId}`);

    // Validate applicationId
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company', select: 'name user' },
          { path: 'organization', model: 'Organization', select: 'name user' }
        ]
      })
      .populate('candidate', 'name email')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check permissions
    let hasPermission = false;

    if (userRole === 'candidate') {
      const candidateId = application.candidate._id ?
        application.candidate._id.toString() :
        application.candidate?.toString();
      hasPermission = candidateId === userId.toString();
    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job && application.job.jobType === 'company') {
        const jobCompanyId = application.job.company?._id ?
          application.job.company._id.toString() :
          application.job.company?.toString();
        hasPermission = jobCompanyId === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job && application.job.jobType === 'organization') {
        const jobOrganizationId = application.job.organization?._id ?
          application.job.organization._id.toString() :
          application.job.organization?.toString();
        hasPermission = jobOrganizationId === organization._id.toString();
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log('❌ No permission to access attachments');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these files'
      });
    }

    // Aggregate all attachments
    const attachments = [];

    // 1. CVs from selectedCVs
    if (application.selectedCVs && application.selectedCVs.length > 0) {
      application.selectedCVs.forEach((cv, index) => {
        if (cv) {
          const realCvId = (cv.cvId || cv._id)?.toString();
          if (!realCvId) {
            console.warn(`Skipping CV at index ${index}: no usable ID`);
            return;
          }

          attachments.push({
            _id: realCvId,
            filename: cv.fileName || cv.filename,
            originalName: cv.originalName || cv.fileName || cv.filename,
            type: 'cv',
            size: cv.size || 0,
            mimetype: cv.mimetype || 'application/octet-stream',
            uploadedAt: cv.uploadedAt || application.createdAt,
            description: 'Curriculum Vitae',
            category: 'CV'
          });
        }
      });
    }

    // 2. Reference documents
    if (application.references && application.references.length > 0) {
      application.references.forEach((ref, index) => {
        if (ref.document) {
          const realDocId = ref.document._id?.toString();
          if (!realDocId) {
            console.warn(`Skipping reference document at index ${index}: no usable ID`);
            return;
          }

          attachments.push({
            _id: realDocId,
            filename: ref.document.filename,
            originalName: ref.document.originalName || ref.document.filename,
            type: 'reference',
            size: ref.document.size || 0,
            mimetype: ref.document.mimetype || 'application/octet-stream',
            uploadedAt: ref.document.uploadedAt || application.createdAt,
            description: `Reference from ${ref.name || 'Reference'}`,
            category: 'Reference'
          });
        }
      });
    }

    // 3. Experience documents
    if (application.workExperience && application.workExperience.length > 0) {
      application.workExperience.forEach((exp, index) => {
        if (exp.document) {
          const realDocId = exp.document._id?.toString();
          if (!realDocId) {
            console.warn(`Skipping experience document at index ${index}: no usable ID`);
            return;
          }

          attachments.push({
            _id: realDocId,
            filename: exp.document.filename,
            originalName: exp.document.originalName || exp.document.filename,
            type: 'experience',
            size: exp.document.size || 0,
            mimetype: exp.document.mimetype || 'application/octet-stream',
            uploadedAt: exp.document.uploadedAt || application.createdAt,
            description: `Experience at ${exp.company || 'Company'}`,
            category: 'Experience'
          });
        }
      });
    }

    // 4. Other attachments
    if (application.attachments) {
      const categories = [
        { key: 'referenceDocuments', type: 'reference', desc: 'Reference Document' },
        { key: 'experienceDocuments', type: 'experience', desc: 'Experience Document' },
        { key: 'portfolioFiles', type: 'portfolio', desc: 'Portfolio File' },
        { key: 'otherDocuments', type: 'other', desc: 'Other Document' }
      ];

      categories.forEach(category => {
        const docs = application.attachments[category.key] || [];
        docs.forEach((doc, index) => {
          if (doc) {
            const realDocId = doc._id?.toString();
            if (!realDocId) {
              console.warn(`Skipping ${category.key} document at index ${index}: no usable ID`);
              return;
            }

            attachments.push({
              _id: realDocId,
              filename: doc.filename,
              originalName: doc.originalName || doc.filename,
              type: category.type,
              size: doc.size || 0,
              mimetype: doc.mimetype || 'application/octet-stream',
              uploadedAt: doc.uploadedAt || application.createdAt,
              description: category.desc,
              category: category.type.charAt(0).toUpperCase() + category.type.slice(1)
            });
          }
        });
      });
    }

    console.log(`✅ Found ${attachments.length} attachments`);

    res.status(200).json({
      success: true,
      data: {
        attachments,
        applicationId: application._id,
        jobTitle: application.job?.title,
        candidateName: application.candidate?.name
      }
    });

  } catch (error) {
    console.error('❌ Get application attachments error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching attachments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Download CV file (authenticated)
// @route   GET /api/v1/applications/cv/:cvId/download
// @access  Private (Candidate who owns CV or has permission)
exports.downloadCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`📥 CV Download request: cvId=${cvId}, userId=${userId}, role=${userRole}`);

    // Validate cvId - it should be a MongoDB ObjectId or a string
    if (!cvId || cvId === '0' || cvId === 'undefined' || cvId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID'
      });
    }

    // Try to find CV by ID in the User model
    let user = null;
    let cv = null;

    // First try to find by _id
    user = await User.findOne({
      'cvs._id': cvId
    }).select('cvs name email');

    // If not found, try by cvId field
    if (!user) {
      user = await User.findOne({
        'cvs.cvId': cvId
      }).select('cvs name email');
    }

    // If still not found, try to find by filename
    if (!user) {
      user = await User.findOne({
        'cvs.filename': cvId
      }).select('cvs name email');
    }

    if (!user) {
      console.log(`❌ CV not found with ID: ${cvId}`);
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    // Find the specific CV
    cv = user.cvs.find(c => 
      c._id?.toString() === cvId || 
      c.cvId?.toString() === cvId ||
      c.filename === cvId
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found in user profile'
      });
    }

    console.log(`✅ Found CV:`, {
      cvId: cv._id,
      filename: cv.filename,
      owner: user._id
    });

    // Check permissions
    let hasPermission = false;

    if (userRole === 'candidate') {
      hasPermission = user._id.toString() === userId.toString();
    } else if (userRole === 'company' || userRole === 'organization') {
      const application = await Application.findOne({
        'selectedCVs.cvId': cv._id.toString()
      }).populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company' },
          { path: 'organization', model: 'Organization' }
        ]
      });

      if (application && application.job) {
        if (userRole === 'company' && application.job.jobType === 'company') {
          const company = await Company.findOne({ user: userId });
          if (company) {
            const jobCompanyId = application.job.company?._id?.toString();
            hasPermission = jobCompanyId === company._id.toString();
          }
        } else if (userRole === 'organization' && application.job.jobType === 'organization') {
          const organization = await Organization.findOne({ user: userId });
          if (organization) {
            const jobOrganizationId = application.job.organization?._id?.toString();
            hasPermission = jobOrganizationId === organization._id.toString();
          }
        }
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log('❌ No permission to download CV');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this CV'
      });
    }

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const filename = cv.fileName || cv.filename;
    const storedPath = cv.filePath || cv.path;

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: 'CV has no filename'
      });
    }

    const possiblePaths = [
      path.join(uploadBase, 'cv', filename),                 // priority 1: UPLOAD_BASE_PATH + cv folder
      path.join('/app', 'uploads', 'cv', filename),          // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', 'cv', filename),   // priority 3: fallback
      path.join(uploadBase, filename),                       // priority 4: without folder
      (!isWindowsPath(storedPath) ? storedPath : null)       // priority 5: stored path only if Linux
    ].filter(Boolean);

    console.log('🔍 Searching for CV in paths:', possiblePaths);

    let filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        console.log(`✅ Found CV at: ${filePath}`);
        break;
      }
    }

    if (!filePath) {
      console.log(`❌ CV file not found at any location`);
      return res.status(404).json({
        success: false,
        message: 'CV file not found on server'
      });
    }

    const fileName = cv.originalName || cv.fileName || cv.filename || 'CV.pdf';

    console.log(`✅ Serving CV: ${fileName} from ${filePath}`);

    // Set headers for download
    res.setHeader('Content-Type', cv.mimetype || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-File-Name', encodeURIComponent(fileName));

    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming CV file'
        });
      }
    });

  } catch (error) {
    console.error('❌ Download CV error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading CV',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// @desc    View CV file inline (authenticated)
// @route   GET /api/v1/applications/cv/:cvId/view
// @access  Private (Candidate who owns CV or has permission)
exports.viewCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`👁️ CV View request: cvId=${cvId}, userId=${userId}, role=${userRole}`);

    // Validate cvId
    if (!cvId || cvId === '0' || cvId === 'undefined' || cvId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID'
      });
    }

    // Find the user who owns this CV
    let user = null;
    let cv = null;

    // Try different search methods
    user = await User.findOne({ 'cvs._id': cvId }).select('cvs name email');
    if (!user) user = await User.findOne({ 'cvs.cvId': cvId }).select('cvs name email');
    if (!user) user = await User.findOne({ 'cvs.filename': cvId }).select('cvs name email');

    if (!user) {
      console.log(`❌ CV not found with ID: ${cvId}`);
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    // Find the specific CV
    cv = user.cvs.find(c => 
      c._id?.toString() === cvId || 
      c.cvId?.toString() === cvId ||
      c.filename === cvId
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found in user profile'
      });
    }

    // Check permissions (same as download)
    let hasPermission = false;

    if (userRole === 'candidate') {
      hasPermission = user._id.toString() === userId.toString();
    } else if (userRole === 'company' || userRole === 'organization') {
      const application = await Application.findOne({
        'selectedCVs.cvId': cv._id.toString()
      }).populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company' },
          { path: 'organization', model: 'Organization' }
        ]
      });

      if (application && application.job) {
        if (userRole === 'company' && application.job.jobType === 'company') {
          const company = await Company.findOne({ user: userId });
          if (company) {
            const jobCompanyId = application.job.company?._id?.toString();
            hasPermission = jobCompanyId === company._id.toString();
          }
        } else if (userRole === 'organization' && application.job.jobType === 'organization') {
          const organization = await Organization.findOne({ user: userId });
          if (organization) {
            const jobOrganizationId = application.job.organization?._id?.toString();
            hasPermission = jobOrganizationId === organization._id.toString();
          }
        }
      }
    } else if (userRole === 'admin') {
      hasPermission = true;
    }

    if (!hasPermission) {
      console.log('❌ No permission to view CV');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this CV'
      });
    }

    // Check if file can be viewed inline
    const inlineTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];

    const canViewInline = cv.mimetype && inlineTypes.includes(cv.mimetype);

    if (!canViewInline) {
      console.log('❌ CV type cannot be viewed inline:', cv.mimetype);
      return res.status(400).json({
        success: false,
        message: 'This CV type cannot be viewed inline. Please download it.'
      });
    }

    // ============ UNIVERSAL PATH RESOLUTION ============
    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const filename = cv.fileName || cv.filename;
    const storedPath = cv.filePath || cv.path;

    if (!filename) {
      return res.status(404).json({
        success: false,
        message: 'CV has no filename'
      });
    }

    const possiblePaths = [
      path.join(uploadBase, 'cv', filename),                 // priority 1: UPLOAD_BASE_PATH + cv folder
      path.join('/app', 'uploads', 'cv', filename),          // priority 2: Docker explicit
      path.join(process.cwd(), 'uploads', 'cv', filename),   // priority 3: fallback
      path.join(uploadBase, filename),                       // priority 4: without folder
      (!isWindowsPath(storedPath) ? storedPath : null)       // priority 5: stored path only if Linux
    ].filter(Boolean);

    console.log('🔍 Searching for CV in paths:', possiblePaths);

    let filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        console.log(`✅ Found CV at: ${filePath}`);
        break;
      }
    }

    if (!filePath) {
      console.log(`❌ CV file not found`);
      return res.status(404).json({
        success: false,
        message: 'CV file not found on server'
      });
    }

    const fileName = cv.originalName || cv.fileName || cv.filename || 'CV.pdf';

    console.log(`✅ Viewing CV inline: ${fileName} from ${filePath}`);

    // Set headers for inline viewing
    res.setHeader('Content-Type', cv.mimetype || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming CV file'
        });
      }
    });

  } catch (error) {
    console.error('❌ View CV error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error viewing CV',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};