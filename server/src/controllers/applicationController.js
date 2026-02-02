const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const { validationResult } = require('express-validator');

// Universal file formatter (handles local file uploads)
const formatFileDataUniversal = (file, folder = 'applications') => {
  if (!file) return null;

  // Handle MongoDB documents - extract the actual data
  let fileObj;
  if (file.toObject) {
    fileObj = file.toObject();
  } else if (file._doc) {
    fileObj = { ...file._doc };
  } else {
    fileObj = { ...file };
  }

  // Local file handling
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

  // Check if we have uploaded file metadata
  if (fileObj.fileName) {
    return {
      _id: fileObj._id,
      filename: fileObj.fileName || fileObj.filename,
      originalName: fileObj.originalName || fileObj.originalname || fileObj.fileName,
      path: fileObj.path,
      size: fileObj.size || 0,
      mimetype: fileObj.mimetype || 'application/octet-stream',
      uploadedAt: fileObj.uploadedAt || fileObj.createdAt || new Date(),
      url: fileObj.url || `${backendUrl}/uploads/${folder}/${fileObj.fileName}`,
      downloadUrl: fileObj.downloadUrl || `${backendUrl}/uploads/download/${folder}/${fileObj.fileName}`,
      viewUrl: fileObj.viewUrl || `${backendUrl}/uploads/view/${folder}/${fileObj.fileName}`
    };
  }

  // Legacy format compatibility
  if (!fileObj.filename && fileObj.originalName) {
    fileObj.filename = fileObj.originalName;
  }

  if (!fileObj.filename) {
    console.warn('⚠️ File missing filename:', fileObj);
    return null;
  }

  return {
    _id: fileObj._id,
    filename: fileObj.filename,
    originalName: fileObj.originalName || fileObj.filename,
    path: fileObj.path,
    size: fileObj.size || 0,
    mimetype: fileObj.mimetype || 'application/octet-stream',
    uploadedAt: fileObj.uploadedAt || fileObj.createdAt || new Date(),
    url: `${backendUrl}/api/v1/uploads/${folder}/${fileObj.filename}`,
    downloadUrl: `${backendUrl}/api/v1/uploads/${folder}/${fileObj.filename}`,
    viewUrl: `${backendUrl}/api/v1/uploads/view/${folder}/${fileObj.filename}`
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

// Enhanced helper to parse form data fields
const parseFormDataField = (fieldValue) => {
  if (!fieldValue) return null;

  if (typeof fieldValue === 'string') {
    try {
      return JSON.parse(fieldValue);
    } catch (error) {
      console.log('⚠️ Field parsing failed, returning as string:', fieldValue.substring(0, 100));
      return fieldValue;
    }
  }

  return fieldValue;
};

// Enhanced applyForJob function with local file upload integration
exports.applyForJob = async (req, res) => {
  try {
    console.log('🔍 [Backend] ===== APPLICATION SUBMISSION STARTED =====');
    console.log('📦 [Backend] Request body fields:', Object.keys(req.body));

    // Check for uploaded files by field
    if (req.uploadedFilesByField) {
      console.log('📁 [Backend] Files uploaded by field:', Object.keys(req.uploadedFilesByField));
      Object.entries(req.uploadedFilesByField).forEach(([field, data]) => {
        console.log(`  ${field}: ${data.count} file(s)`);
      });
    }

    // Parse form data fields BEFORE validation
    const parsedBody = { ...req.body };

    // Parse all JSON string fields
    if (parsedBody.selectedCVs) {
      parsedBody.selectedCVs = parseFormDataField(parsedBody.selectedCVs);
    }
    if (parsedBody.contactInfo) {
      parsedBody.contactInfo = parseFormDataField(parsedBody.contactInfo);
    }
    if (parsedBody.skills) {
      parsedBody.skills = parseFormDataField(parsedBody.skills);
    }
    if (parsedBody.references) {
      parsedBody.references = parseFormDataField(parsedBody.references);
    }
    if (parsedBody.workExperience) {
      parsedBody.workExperience = parseFormDataField(parsedBody.workExperience);
    }
    if (parsedBody.userInfo) {
      parsedBody.userInfo = parseFormDataField(parsedBody.userInfo);
    }

    // Replace req.body with parsed data for validation
    req.body = parsedBody;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [Backend] VALIDATION ERRORS:', errors.array());
      // Cleanup uploaded files on validation error
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

    // Check if job exists and is active
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

    // Check if job is still accepting applications
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      console.log('❌ [Backend] Job deadline passed');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Check if user has already applied
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

    // Get candidate profile data
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

    // Process uploaded files from different fields
    let uploadedCV = null;
    let uploadedReferenceDocs = [];
    let uploadedExperienceDocs = [];

    // Get CV file if uploaded
    if (req.uploadedFilesByField?.cv?.files?.[0]) {
      uploadedCV = req.uploadedFilesByField.cv.files[0];
      console.log('📄 [Backend] CV file uploaded:', uploadedCV.fileName);
    }

    // Get reference PDFs
    if (req.uploadedFilesByField?.referencePdfs?.files) {
      uploadedReferenceDocs = req.uploadedFilesByField.referencePdfs.files;
      console.log('📁 [Backend] Reference PDFs uploaded:', uploadedReferenceDocs.length);
    }

    // Get experience PDFs
    if (req.uploadedFilesByField?.experiencePdfs?.files) {
      uploadedExperienceDocs = req.uploadedFilesByField.experiencePdfs.files;
      console.log('📁 [Backend] Experience PDFs uploaded:', uploadedExperienceDocs.length);
    }

    // Use parsed data from earlier
    const {
      coverLetter,
      skills: applicationSkills = [],
      references = [],
      workExperience = [],
      contactInfo = {},
      selectedCVs = [],
      userInfo = {}
    } = parsedBody;

    console.log('📝 [Backend] Cover letter length:', coverLetter?.length);
    console.log('🎯 [Backend] Skills count:', applicationSkills.length);
    console.log('👥 [Backend] References count:', references.length);
    console.log('💼 [Backend] Work experience count:', workExperience.length);
    console.log('📄 [Backend] Selected CVs count:', selectedCVs.length);

    // Validate required fields with better error messages
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

    // Validate selected CVs
    if (!selectedCVs || selectedCVs.length === 0) {
      console.log('❌ [Backend] No CVs selected');
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'At least one CV must be selected'
      });
    }

    // Verify selected CVs belong to user
    const userCVIds = candidate.cvs ? candidate.cvs.map(cv => cv._id.toString()) : [];
    const invalidCVs = selectedCVs.filter(cv => !userCVIds.includes(cv.cvId));

    if (invalidCVs.length > 0) {
      console.log('❌ [Backend] Invalid CV selection');
      console.log('❌ [Backend] User CV IDs:', userCVIds);
      console.log('❌ [Backend] Selected CV IDs:', selectedCVs.map(cv => cv.cvId));
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({
        success: false,
        message: 'Invalid CV selection - CV does not belong to user'
      });
    }

    console.log('✅ [Backend] All validations passed');

    // Combine profile skills with application skills
    const profileSkills = candidate.skills || [];
    const skills = [...new Set([...profileSkills, ...applicationSkills])];

    // Prepare selected CVs data with proper file URLs
    const selectedCVsData = selectedCVs.map(cvData => {
      const userCV = candidate.cvs.find(cv => cv._id.toString() === cvData.cvId);
      if (!userCV) {
        throw new Error(`CV not found: ${cvData.cvId}`);
      }

      return {
        cvId: userCV._id,
        filename: userCV.filename,
        originalName: userCV.originalName || userCV.filename,
        url: userCV.url || `/api/v1/uploads/cv/${userCV.filename}`,
        size: userCV.size || 0,
        mimetype: userCV.mimetype || 'application/octet-stream',
        uploadedAt: userCV.uploadedAt || new Date(),
        downloadUrl: userCV.downloadUrl || `/api/v1/uploads/cv/${userCV.filename}`,
        viewUrl: userCV.viewUrl || `/api/v1/uploads/cv/view/${userCV.filename}`
      };
    });

    console.log('✅ [Backend] Selected CVs processed:', selectedCVsData.length);

    // Process references with uploaded files
    const processedReferences = references.map((ref, index) => {
      console.log(`🔍 [Backend] Processing reference ${index}:`, {
        name: ref.name,
        providedAsDocument: ref.providedAsDocument,
        hasUploadedFile: !!uploadedReferenceDocs[index]
      });

      // Only attach document if reference has providedAsDocument flag AND we have uploaded files
      if (ref.providedAsDocument && uploadedReferenceDocs[index]) {
        const uploadedFile = uploadedReferenceDocs[index];
        console.log(`✅ [Backend] Attaching document to reference ${index}:`, uploadedFile.fileName);

        return {
          ...ref,
          document: {
            originalName: uploadedFile.originalName,
            fileName: uploadedFile.fileName,
            size: uploadedFile.size,
            mimetype: uploadedFile.mimetype,
            path: uploadedFile.path,
            url: uploadedFile.url,
            downloadUrl: uploadedFile.downloadUrl,
            uploadedAt: new Date()
          },
          providedAsDocument: true
        };
      } else {
        console.log(`📝 [Backend] Form-based reference ${index} - no document attached`);
        // For form-only references, don't create any document
        return {
          ...ref,
          providedAsDocument: false,
          document: null // Explicitly set to null
        };
      }
    });

    // Process work experience with uploaded files
    const processedWorkExperience = workExperience.map((exp, index) => {
      console.log(`🔍 [Backend] Processing work experience ${index}:`, {
        company: exp.company,
        providedAsDocument: exp.providedAsDocument,
        hasUploadedFile: !!uploadedExperienceDocs[index]
      });

      // Only attach document if experience has providedAsDocument flag AND we have uploaded files
      if (exp.providedAsDocument && uploadedExperienceDocs[index]) {
        const uploadedFile = uploadedExperienceDocs[index];
        console.log(`✅ [Backend] Attaching document to work experience ${index}:`, uploadedFile.fileName);

        return {
          ...exp,
          document: {
            originalName: uploadedFile.originalName,
            fileName: uploadedFile.fileName,
            size: uploadedFile.size,
            mimetype: uploadedFile.mimetype,
            path: uploadedFile.path,
            url: uploadedFile.url,
            downloadUrl: uploadedFile.downloadUrl,
            uploadedAt: new Date()
          },
          providedAsDocument: true
        };
      } else {
        console.log(`📝 [Backend] Form-based work experience ${index} - no document attached`);
        // For form-only experience, don't create any document
        return {
          ...exp,
          providedAsDocument: false,
          document: null // Explicitly set to null
        };
      }
    });

    // Create application with uploaded file data
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
        referenceDocuments: uploadedReferenceDocs.map(file => ({
          originalName: file.originalName,
          filename: file.fileName,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          url: file.url,
          downloadUrl: file.downloadUrl,
          uploadedAt: new Date()
        })),
        experienceDocuments: uploadedExperienceDocs.map(file => ({
          originalName: file.originalName,
          filename: file.fileName,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          url: file.url,
          downloadUrl: file.downloadUrl,
          uploadedAt: new Date()
        })),
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

    // If a new CV file was uploaded, add it to attachments
    if (uploadedCV) {
      applicationData.attachments.cvFile = {
        originalName: uploadedCV.originalName,
        filename: uploadedCV.fileName,
        path: uploadedCV.path,
        size: uploadedCV.size,
        mimetype: uploadedCV.mimetype,
        url: uploadedCV.url,
        downloadUrl: uploadedCV.downloadUrl,
        uploadedAt: new Date()
      };
    }

    console.log('📝 [Backend] Creating application:', {
      jobId,
      candidate: userId,
      cvCount: selectedCVsData.length,
      skillsCount: skills.length,
      referencesCount: processedReferences.length,
      experienceCount: processedWorkExperience.length,
      uploadedReferenceDocs: uploadedReferenceDocs.length,
      uploadedExperienceDocs: uploadedExperienceDocs.length,
      newCVUploaded: !!uploadedCV
    });

    const application = await Application.create(applicationData);

    // Increment job application count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Populate application for response
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company organization jobType')
      .populate('candidate', 'name email')
      .lean();

    console.log('🎉 [Backend] Application created successfully:', application._id);
    console.log('📊 [Backend] Application summary:', {
      references: populatedApplication.references?.length,
      workExperience: populatedApplication.workExperience?.length,
      uploadedReferenceDocs: uploadedReferenceDocs.length,
      uploadedExperienceDocs: uploadedExperienceDocs.length
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application: populatedApplication }
    });

  } catch (error) {
    // Cleanup uploaded files on error
    await cleanupUploadedFiles(req.uploadedFiles);

    console.error('❌ [Backend] Apply for job error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.error('❌ [Backend] Mongoose validation errors:', messages);
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

    // Format CVs with proper download URLs
    const formattedCVs = (candidate.cvs || []).map(cv => {
      // Local file handling
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
      const baseUrl = `${backendUrl}/api/v1/uploads/cv`;

      return {
        _id: cv._id,
        filename: cv.filename,
        originalName: cv.originalName || cv.filename,
        path: cv.path,
        size: cv.size || 0,
        mimetype: cv.mimetype || 'application/octet-stream',
        uploadedAt: cv.uploadedAt,
        isDefault: cv.isPrimary || false,
        isPrimary: cv.isPrimary || false,
        url: cv.url || `${baseUrl}/${cv.filename}`,
        downloadUrl: cv.downloadUrl || `${baseUrl}/${cv.filename}`,
        viewUrl: cv.viewUrl || `${baseUrl}/view/${cv.filename}`
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
      // Proper candidate ID comparison - convert both to strings
      const candidateId = application.candidate._id ?
        application.candidate._id.toString() :
        application.candidate?.toString();

      // Convert userId to string for comparison
      const userIdString = userId.toString ? userId.toString() : userId;

      hasPermission = candidateId === userIdString;

      console.log(`👤 Candidate permission check:`, {
        candidateId,
        userId: userIdString,
        hasPermission
      });
    } else if (userRole === 'company') {
      // Company can view applications for jobs they posted
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
      // Organization can view applications for jobs they posted
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

      // Format selected CVs with proper URLs
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        return formatFileDataUniversal(cv, 'cv');
      }).filter(cv => cv !== null),

      // Format attachments with proper URLs
      attachments: {
        referenceDocuments: (application.attachments?.referenceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        portfolioFiles: (application.attachments?.portfolioFiles || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        otherDocuments: (application.attachments?.otherDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications'))
      },

      // Format references with document URLs
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

      // Format work experience with document URLs
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
      // Candidate statistics
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
      // Company statistics
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
      // Organization statistics
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

    // Format response
    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        return formatFileDataUniversal(cv, 'cv');
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

    // Format response
    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        return formatFileDataUniversal(cv, 'cv');
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