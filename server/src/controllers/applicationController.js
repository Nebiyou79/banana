const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
// 🔔 NOTIFICATION
const notificationService = require('../services/notificationService');

const {
  COMPANY_POPULATE_SELECT,
  ORGANIZATION_POPULATE_SELECT,
  enrichApplicationsWithOwnerPreview,
  buildOwnerPreviewFromJob,
} = require('../utils/resolveOwnerPreview');

const JOB_POPULATE_OPTIONS = [
  { path: 'company',      select: COMPANY_POPULATE_SELECT,      model: 'Company' },
  { path: 'organization', select: ORGANIZATION_POPULATE_SELECT, model: 'Organization' },
];
 
// Helper to detect Windows absolute paths
const isWindowsPath = (p) => Boolean(p && typeof p === 'string' && /^[A-Za-z]:\\/.test(p));
 
// Universal file formatter (handles local file uploads)
const formatFileDataUniversal = (file, folder = 'applications') => {
  if (!file) return null;
 
  let fileObj;
  if (file.toObject)   { fileObj = file.toObject(); }
  else if (file._doc)  { fileObj = { ...file._doc }; }
  else                 { fileObj = { ...file }; }
 
  const backendUrl      = process.env.BACKEND_URL || 'http://localhost:4000';
  const cleanBackendUrl = backendUrl.replace(/\/+$/, '');
  const fileId          = fileObj._id || fileObj.cvId || fileObj.fileId || fileObj.id;
 
  if (fileId) {
    return {
      _id:          (fileObj._id || fileObj.cvId)?.toString() || undefined,
      cvId:         fileObj.cvId?.toString() || undefined,
      filename:     fileObj.fileName || fileObj.filename,
      originalName: fileObj.originalName || fileObj.originalname || fileObj.fileName,
      path:         fileObj.path || fileObj.filePath,
      size:         fileObj.size || 0,
      mimetype:     fileObj.mimetype || 'application/octet-stream',
      uploadedAt:   fileObj.uploadedAt || fileObj.createdAt || new Date(),
      url:          `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName || fileObj.filename}`,
      downloadUrl:  `${cleanBackendUrl}/api/v1/uploads/download/${folder}/${fileObj.fileName || fileObj.filename}`,
      viewUrl:      `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName || fileObj.filename}`,
    };
  }
 
  if (fileObj.fileName) {
    return {
      _id:          (fileObj._id || fileObj.cvId)?.toString() || undefined,
      cvId:         fileObj.cvId?.toString() || undefined,
      filename:     fileObj.fileName || fileObj.filename,
      originalName: fileObj.originalName || fileObj.originalname || fileObj.fileName,
      path:         fileObj.path || fileObj.filePath,
      size:         fileObj.size || 0,
      mimetype:     fileObj.mimetype || 'application/octet-stream',
      uploadedAt:   fileObj.uploadedAt || fileObj.createdAt || new Date(),
      url:          `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName}`,
      downloadUrl:  `${cleanBackendUrl}/api/v1/uploads/download/${folder}/${fileObj.fileName}`,
      viewUrl:      `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.fileName}`,
    };
  }
 
  if (!fileObj.filename && fileObj.originalName) fileObj.filename = fileObj.originalName;
 
  if (!fileObj.filename) {
    console.warn('⚠️ File missing filename:', fileObj);
    return null;
  }
 
  return {
    _id:          (fileObj._id || fileObj.cvId)?.toString() || undefined,
    cvId:         fileObj.cvId?.toString() || undefined,
    filename:     fileObj.filename,
    originalName: fileObj.originalName || fileObj.filename,
    path:         fileObj.path || fileObj.filePath,
    size:         fileObj.size || 0,
    mimetype:     fileObj.mimetype || 'application/octet-stream',
    uploadedAt:   fileObj.uploadedAt || fileObj.createdAt || new Date(),
    url:          `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.filename}`,
    downloadUrl:  `${cleanBackendUrl}/api/v1/uploads/download/${folder}/${fileObj.filename}`,
    viewUrl:      `${cleanBackendUrl}/api/v1/uploads/view/${folder}/${fileObj.filename}`,
  };
};
 
// Cleanup function for uploaded files on error
const cleanupUploadedFiles = async (uploadedFiles) => {
  try {
    if (!uploadedFiles || !uploadedFiles.success) return;
    const fsPromises = require('fs').promises;
    if (uploadedFiles.files && Array.isArray(uploadedFiles.files)) {
      for (const file of uploadedFiles.files) {
        if (file.path && file.path.startsWith('/')) {
          try {
            await fsPromises.unlink(file.path);
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


// ─────────────────────────────────────────────────────────────────────────────
// applyForJob
// ─────────────────────────────────────────────────────────────────────────────
exports.applyForJob = async (req, res) => {
  try {
    console.log('🔍 [Backend] ===== APPLICATION SUBMISSION STARTED =====');
    console.log('📦 [Backend] ALL request body fields:', Object.keys(req.body));
    Object.keys(req.body).forEach(key => {
      if (key.includes('tempId') || key.includes('referencePdfs') || key.includes('experiencePdfs')) {
        console.log(`  ${key}: ${typeof req.body[key]} = ${req.body[key]}`);
      }
    });
 
    const parsedBody = { ...req.body };
    const parseField = (fieldName) => {
      if (parsedBody[fieldName] && typeof parsedBody[fieldName] === 'string') {
        try { parsedBody[fieldName] = JSON.parse(parsedBody[fieldName]); }
        catch (error) { console.log(`⚠️ Failed to parse ${fieldName}:`, error.message); }
      }
    };
    ['selectedCVs', 'contactInfo', 'skills', 'references', 'workExperience', 'userInfo'].forEach(parseField);
    req.body = parsedBody;
 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [Backend] VALIDATION ERRORS:', errors.array());
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
 
    const { jobId } = req.params;
    const userId    = req.user.userId;
 
    if (req.user.role !== 'candidate') {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(403).json({ success: false, message: 'Only candidates can apply for jobs' });
    }
 
    const job = await Job.findOne({ _id: jobId, status: 'active' })
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT);
 
    if (!job) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
 
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
    }
 
    const existingApplication = await Application.findOne({ job: jobId, candidate: userId });
    if (existingApplication) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }
 
    const candidate = await User.findById(userId)
      .select('name email phone location avatar bio website socialLinks skills education experience certifications cvs')
      .lean();
 
    if (!candidate) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(404).json({ success: false, message: 'Candidate profile not found' });
    }
 
    const uploadedFiles = { referenceFiles: {}, experienceFiles: {} };
 
    if (req.uploadedFilesByField) {
      Object.entries(req.uploadedFilesByField).forEach(([field, data]) => {
        data.files.forEach((file, fileIndex) => {
          let _tempId = null;
          const possibleKeys = [
            `${field}_${fileIndex}_tempId`, `referencePdfs_${fileIndex}_tempId`,
            `experiencePdfs_${fileIndex}_tempId`, `${field}_metadata_${fileIndex}`,
          ];
          for (const key of possibleKeys) {
            if (req.body[key]) {
              const value = req.body[key];
              if (typeof value === 'string') {
                if (value.startsWith('{')) {
                  try { const p = JSON.parse(value); _tempId = p._tempId || p.tempId; } catch { _tempId = value; }
                } else { _tempId = value; }
              }
              break;
            }
          }
          if (!_tempId) {
            const parsedData = parsedBody[field === 'referencePdfs' ? 'references' : 'workExperience'];
            if (parsedData && parsedData[fileIndex]) _tempId = parsedData[fileIndex]._tempId;
          }
          if (_tempId) {
            if (field === 'referencePdfs') uploadedFiles.referenceFiles[_tempId] = { ...file, _tempId };
            else if (field === 'experiencePdfs') uploadedFiles.experienceFiles[_tempId] = { ...file, _tempId };
          }
        });
      });
    }
 
    const {
      coverLetter, skills: applicationSkills = [], references = [],
      workExperience = [], contactInfo = {}, selectedCVs = [], userInfo = {}
    } = parsedBody;
 
    if (!coverLetter || coverLetter.trim().length === 0) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'Cover letter is required' });
    }
    if (coverLetter.length > 5000) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'Cover letter cannot exceed 5000 characters' });
    }
    if (!selectedCVs || selectedCVs.length === 0) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'At least one CV must be selected' });
    }
 
    const userCVIds    = candidate.cvs ? candidate.cvs.map(cv => cv._id.toString()) : [];
    const invalidCVs   = selectedCVs.filter(cv => !userCVIds.includes(cv.cvId));
    if (invalidCVs.length > 0) {
      await cleanupUploadedFiles(req.uploadedFiles);
      return res.status(400).json({ success: false, message: 'Invalid CV selection - CV does not belong to user' });
    }
 
    const profileSkills    = candidate.skills || [];
    const skills           = [...new Set([...profileSkills, ...applicationSkills])];
    const selectedCVsData  = selectedCVs.map(cvData => {
      const userCV = candidate.cvs.find(cv => cv._id.toString() === cvData.cvId);
      if (!userCV) throw new Error(`CV not found: ${cvData.cvId}`);
      return {
        cvId:         userCV._id,
        filename:     userCV.fileName || userCV.filename,
        originalName: userCV.originalName || userCV.fileName || userCV.filename,
        path:         userCV.filePath || userCV.path || '',
        size:         userCV.size || 0,
        mimetype:     userCV.mimetype || 'application/octet-stream',
        url:          userCV.fileUrl || userCV.url || `/api/v1/uploads/cv/${userCV.fileName || userCV.filename}`,
        downloadUrl:  userCV.downloadUrl || `/api/v1/uploads/cv/${userCV.fileName || userCV.filename}`,
        uploadedAt:   userCV.uploadedAt || new Date(),
      };
    });
 
    const processedReferences = references.map((ref) => {
      let document = null;
      if (ref._tempId && uploadedFiles.referenceFiles[ref._tempId]) {
        const f = uploadedFiles.referenceFiles[ref._tempId];
        document = { filename: f.fileName, originalName: f.originalName, path: f.path, size: f.size, mimetype: f.mimetype, url: f.url, downloadUrl: f.downloadUrl, uploadedAt: new Date() };
        delete uploadedFiles.referenceFiles[ref._tempId];
      }
      const { _tempId, ...refData } = ref;
      return { ...refData, document, providedAsDocument: !!document };
    });
 
    const processedWorkExperience = workExperience.map((exp) => {
      let document = null;
      if (exp._tempId && uploadedFiles.experienceFiles[exp._tempId]) {
        const f = uploadedFiles.experienceFiles[exp._tempId];
        document = { filename: f.fileName, originalName: f.originalName, path: f.path, size: f.size, mimetype: f.mimetype, url: f.url, downloadUrl: f.downloadUrl, uploadedAt: new Date() };
        delete uploadedFiles.experienceFiles[exp._tempId];
      }
      const { _tempId, ...expData } = exp;
      return { ...expData, document, providedAsDocument: !!document };
    });
 
    const applicationData = {
      job: jobId,
      candidate: userId,
      userInfo: userInfo || {
        name: candidate.name, email: candidate.email, phone: candidate.phone,
        location: candidate.location, avatar: candidate.avatar,
        bio: candidate.bio, website: candidate.website, socialLinks: candidate.socialLinks,
      },
      selectedCVs: selectedCVsData,
      coverLetter: coverLetter.trim(),
      skills,
      references: processedReferences,
      workExperience: processedWorkExperience,
      contactInfo: {
        email:    contactInfo?.email    || candidate.email,
        phone:    contactInfo?.phone    || candidate.phone,
        telegram: contactInfo?.telegram || '',
        location: contactInfo?.location || candidate.location,
      },
      attachments: { referenceDocuments: [], experienceDocuments: [], portfolioFiles: [], otherDocuments: [] },
      statusHistory: [{ status: 'applied', changedBy: userId, changedAt: new Date(), message: 'Application submitted' }],
    };
 
    const application = await Application.create(applicationData);
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });
 
    const populatedApplication = await Application.findById(application._id)
      .populate({ path: 'job', populate: JOB_POPULATE_OPTIONS })
      .populate('candidate', 'name email')
      .lean();
 
    if (populatedApplication?.job) {
      populatedApplication.job.ownerPreview = await buildOwnerPreviewFromJob(populatedApplication.job);
    }

    // 🔔 NOTIFICATION: Notify employer about new application
    (async () => {
      try {
        const employerUserId = job.company?.user || job.organization?.user;
        if (employerUserId && employerUserId.toString() !== userId.toString()) {
          await notificationService.create({
            recipient: employerUserId,
            actor: userId,
            type: 'application_received',
            title: 'New application',
            body: `{actorName} applied for "${job.title}"`,
            data: {
              entityType: 'Application',
              entityId: application._id.toString(),
              screen: 'ApplicationDetail',
              params: { applicationId: application._id, jobId }
            },
            priority: 'high',
            groupKey: `application_received:${jobId}`,
            channels: { inApp: true, push: true, email: true }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION
 
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application: populatedApplication },
    });
 
  } catch (error) {
    await cleanupUploadedFiles(req.uploadedFiles);
    console.error('❌ [Backend] Apply for job error:', error);
 
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

 
// ─────────────────────────────────────────────────────────────────────────────
// getMyApplications — candidate's list
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
 
    const filter = { candidate: userId };
    if (status) filter.status = status;
 
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
 
    const applications = await Application.find(filter)
      .populate({ path: 'job', populate: JOB_POPULATE_OPTIONS })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
 
    const total = await Application.countDocuments(filter);
 
    await enrichApplicationsWithOwnerPreview(applications);
 
    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('❌ Get my applications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching applications', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getMyCVs
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyCVs = async (req, res) => {
  try {
    const userId = req.user.userId;

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

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const baseUrl = `${backendUrl}/api/v1/uploads/cv`;

    const formattedCVs = (candidate.cvs || []).map(cv => {
      const filename = cv.fileName || cv.filename;
      return {
        _id: cv._id,
        filename: filename,
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

// ─────────────────────────────────────────────────────────────────────────────
// getApplicationDetails — single application detail
// ─────────────────────────────────────────────────────────────────────────────
exports.getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId   = req.user.userId;
    const userRole = req.user.role;
 
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    }
 
    const application = await Application.findById(applicationId)
      .populate({ path: 'job', populate: JOB_POPULATE_OPTIONS })
      .populate('candidate', 'name email avatar phone location')
      .populate('statusHistory.changedBy', 'name email')
      .populate('companyResponse.respondedBy', 'name email')
      .lean();
 
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
 
    let hasPermission = false;
 
    if (userRole === 'candidate') {
      const candidateId  = application.candidate._id ? application.candidate._id.toString() : application.candidate?.toString();
      const userIdString = userId.toString ? userId.toString() : userId;
      hasPermission = candidateId === userIdString;
    } else if (userRole === 'company') {
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
      return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
    }
 
    if (application.job) {
      application.job.ownerPreview = await buildOwnerPreviewFromJob(application.job);
    }
 
    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        const formatted  = formatFileDataUniversal(cv, 'cv');
        if (!formatted) return null;
        const resolvedId = cv.cvId?.toString() || cv._id?.toString();
        return { ...formatted, cvId: resolvedId || formatted.cvId, _id: resolvedId || formatted._id };
      }).filter(cv => cv !== null),
 
      attachments: {
        referenceDocuments:  (application.attachments?.referenceDocuments  || []).map(d => formatFileDataUniversal(d, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(d => formatFileDataUniversal(d, 'applications')),
        portfolioFiles:      (application.attachments?.portfolioFiles      || []).map(d => formatFileDataUniversal(d, 'applications')),
        otherDocuments:      (application.attachments?.otherDocuments      || []).map(d => formatFileDataUniversal(d, 'applications')),
      },
 
      references: (application.references || []).map(ref => {
        if (!ref) return null;
        return ref.document ? { ...ref, document: formatFileDataUniversal(ref.document, 'applications') } : ref;
      }).filter(Boolean),
 
      workExperience: (application.workExperience || []).map(exp => {
        if (!exp) return null;
        return exp.document ? { ...exp, document: formatFileDataUniversal(exp.document, 'applications') } : exp;
      }).filter(Boolean),
    };
 
    res.status(200).json({ success: true, data: { application: applicationResponse } });
  } catch (error) {
    console.error('❌ Get application details error:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    res.status(500).json({ success: false, message: 'Error fetching application details', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getJobApplications — applications for a single job (employer view)
// ─────────────────────────────────────────────────────────────────────────────
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId    = req.user.userId;
    const userRole  = req.user.role;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
 
    const job = await Job.findById(jobId)
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT)
      .lean();
 
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
 
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
 
    if (!hasPermission) return res.status(403).json({ success: false, message: 'Not authorized to view applications for this job' });
 
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
      pagination: { current: parseInt(page), totalPages: Math.ceil(total / limit), totalResults: total, resultsPerPage: parseInt(limit) },
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job applications' });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// getCompanyApplications — all applications across company's jobs
// ─────────────────────────────────────────────────────────────────────────────
exports.getCompanyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
 
    const company = await Company.findOne({ user: userId });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
 
    const companyJobs = await Job.find({ company: company._id, jobType: 'company' }).select('_id');
    const jobIds      = companyJobs.map(job => job._id);
 
    const filter = { job: { $in: jobIds } };
    if (status) filter.status = status;
 
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
 
    const applications = await Application.find(filter)
      .populate({ path: 'job', populate: JOB_POPULATE_OPTIONS })
      .populate('candidate', 'name email avatar location phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
 
    const total = await Application.countDocuments(filter);
 
    await enrichApplicationsWithOwnerPreview(applications);
 
    res.status(200).json({
      success: true,
      data: applications,
      pagination: { current: parseInt(page), totalPages: Math.ceil(total / limit), totalResults: total, resultsPerPage: parseInt(limit) },
    });
  } catch (error) {
    console.error('❌ Get company applications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching company applications', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
 
// ─────────────────────────────────────────────────────────────────────────────
// getOrganizationApplications
// ─────────────────────────────────────────────────────────────────────────────
exports.getOrganizationApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
 
    const organization = await Organization.findOne({ user: userId });
    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
 
    const organizationJobs = await Job.find({ organization: organization._id, jobType: 'organization' }).select('_id');
    const jobIds           = organizationJobs.map(job => job._id);
 
    const filter = { job: { $in: jobIds } };
    if (status) filter.status = status;
 
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
 
    const applications = await Application.find(filter)
      .populate({ path: 'job', populate: JOB_POPULATE_OPTIONS })
      .populate('candidate', 'name email avatar location phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
 
    const total = await Application.countDocuments(filter);
 
    await enrichApplicationsWithOwnerPreview(applications);
 
    res.status(200).json({
      success: true,
      data: applications,
      pagination: { current: parseInt(page), totalPages: Math.ceil(total / limit), totalResults: total, resultsPerPage: parseInt(limit) },
    });
  } catch (error) {
    console.error('❌ Get organization applications error:', error);
    res.status(500).json({ success: false, message: 'Error fetching organization applications', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// updateApplicationStatus
// ─────────────────────────────────────────────────────────────────────────────
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, message, interviewDetails } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = [
      'applied', 'under-review', 'shortlisted', 'interview-scheduled',
      'interviewed', 'offer-pending', 'offer-made', 'offer-accepted',
      'offer-rejected', 'on-hold', 'rejected', 'withdrawn'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
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
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

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
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    await application.updateStatus(status, userId, message, interviewDetails);

    const updatedApplication = await Application.findById(applicationId)
      .populate('statusHistory.changedBy', 'name email');

    // 🔔 NOTIFICATION: Notify candidate about status change
    (async () => {
      try {
        const statusNotifMap = {
          'shortlisted':          { type: 'application_shortlisted', title: "You've been shortlisted!", priority: 'high' },
          'interview-scheduled':  { type: 'application_status', title: 'Interview scheduled', priority: 'high' },
          'offer-made':           { type: 'offer_made', title: 'Offer extended!', priority: 'critical' },
          'rejected':             { type: 'application_rejected', title: 'Application update', priority: 'normal' },
          'under-review':         { type: 'application_status', title: 'Application under review', priority: 'normal' }
        };
        const notifConfig = statusNotifMap[status];
        if (notifConfig) {
          const candidateId = application.candidate._id || application.candidate;
          await notificationService.create({
            recipient: candidateId,
            actor: userId,
            type: notifConfig.type,
            title: notifConfig.title,
            body: `Your application for "${application.job?.title || 'the position'}" is now: ${status}`,
            data: {
              entityType: 'Application',
              entityId: applicationId,
              screen: 'ApplicationDetail',
              params: { applicationId }
            },
            priority: notifConfig.priority,
            channels: { inApp: true, push: true, email: notifConfig.priority !== 'normal' }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Error updating application status' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// addCompanyResponse
// ─────────────────────────────────────────────────────────────────────────────
exports.addCompanyResponse = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, message, interviewLocation } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Response status is required' });
    }

    const validStatuses = [
      'active-consideration', 'on-hold', 'rejected', 'selected-for-interview'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid response status' });
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
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

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
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this application' });
    }

    await application.addCompanyResponse(status, userId, message, interviewLocation);

    const updatedApplication = await Application.findById(applicationId)
      .populate('companyResponse.respondedBy', 'name email');

    // 🔔 NOTIFICATION: Notify candidate about company response (interview selection)
    (async () => {
      try {
        const candidateId = application.candidate._id || application.candidate;
        if (status === 'selected-for-interview') {
          await notificationService.create({
            recipient: candidateId,
            actor: userId,
            type: 'application_status',
            title: 'Selected for interview!',
            body: `You have been selected for an interview for "${application.job?.title || 'a position'}"`,
            data: {
              entityType: 'Application',
              entityId: applicationId,
              screen: 'ApplicationDetail',
              params: { applicationId }
            },
            priority: 'high',
            channels: { inApp: true, push: true, email: true }
          });
        }
      } catch (notifErr) {
        console.warn('[Notification] Non-critical error:', notifErr.message);
      }
    })();
    // END NOTIFICATION

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    console.error('Add company response error:', error);
    res.status(500).json({ success: false, message: 'Error adding company response' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// withdrawApplication
// ─────────────────────────────────────────────────────────────────────────────
exports.withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.candidate.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this application' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn' });
    }

    if (['offer-accepted', 'offer-made', 'interviewed'].includes(application.status)) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw application at this stage' });
    }

    await application.updateStatus('withdrawn', userId, 'Application withdrawn by candidate');

    res.status(200).json({ success: true, message: 'Application withdrawn successfully' });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ success: false, message: 'Error withdrawing application' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getApplicationStatistics
// ─────────────────────────────────────────────────────────────────────────────
exports.getApplicationStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let statistics = {};

    if (userRole === 'candidate') {
      const totalApplications = await Application.countDocuments({ candidate: userId });
      const underReview = await Application.countDocuments({ candidate: userId, status: 'under-review' });
      const shortlisted = await Application.countDocuments({ candidate: userId, status: 'shortlisted' });
      const interviewScheduled = await Application.countDocuments({ candidate: userId, status: 'interview-scheduled' });
      const rejected = await Application.countDocuments({ candidate: userId, status: 'rejected' });
      const offerMade = await Application.countDocuments({ candidate: userId, status: 'offer-made' });

      statistics = {
        totalApplications, underReview, shortlisted, interviewScheduled, rejected, offerMade,
        successRate: totalApplications > 0 ? ((shortlisted + interviewScheduled + offerMade) / totalApplications * 100).toFixed(1) : 0
      };

    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

      const jobs = await Job.find({ company: company._id, jobType: 'company' }).select('_id');
      const jobIds = jobs.map(job => job._id);

      const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
      const newApplications = await Application.countDocuments({ job: { $in: jobIds }, status: 'applied' });
      const underReview = await Application.countDocuments({ job: { $in: jobIds }, status: 'under-review' });
      const shortlisted = await Application.countDocuments({ job: { $in: jobIds }, status: 'shortlisted' });
      const interviewScheduled = await Application.countDocuments({ job: { $in: jobIds }, status: 'interview-scheduled' });
      const rejected = await Application.countDocuments({ job: { $in: jobIds }, status: 'rejected' });
      const hired = await Application.countDocuments({ job: { $in: jobIds }, status: 'offer-accepted' });

      statistics = { totalApplications, newApplications, underReview, shortlisted, interviewScheduled, rejected, hired, jobsPosted: jobs.length };

    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });

      const jobs = await Job.find({ organization: organization._id, jobType: 'organization' }).select('_id');
      const jobIds = jobs.map(job => job._id);

      const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
      const newApplications = await Application.countDocuments({ job: { $in: jobIds }, status: 'applied' });
      const underReview = await Application.countDocuments({ job: { $in: jobIds }, status: 'under-review' });
      const shortlisted = await Application.countDocuments({ job: { $in: jobIds }, status: 'shortlisted' });
      const interviewScheduled = await Application.countDocuments({ job: { $in: jobIds }, status: 'interview-scheduled' });
      const rejected = await Application.countDocuments({ job: { $in: jobIds }, status: 'rejected' });
      const hired = await Application.countDocuments({ job: { $in: jobIds }, status: 'offer-accepted' });

      statistics = { totalApplications, newApplications, underReview, shortlisted, interviewScheduled, rejected, hired, jobsPosted: jobs.length };
    }

    res.status(200).json({ success: true, data: { statistics } });

  } catch (error) {
    console.error('Get application statistics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching application statistics' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getCompanyApplicationDetails
// ─────────────────────────────────────────────────────────────────────────────
exports.getCompanyApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;

    console.log(`\n🏢 ==========================================`);
    console.log(`🏢 [getCompanyApplicationDetails] START`);
    console.log(`🏢 Application: ${applicationId}, User: ${userId}`);

    if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company', select: COMPANY_POPULATE_SELECT },
          { path: 'organization', model: 'Organization', select: ORGANIZATION_POPULATE_SELECT }
        ]
      })
      .populate('candidate', 'name email avatar phone location')
      .populate('statusHistory.changedBy', 'name email')
      .populate('companyResponse.respondedBy', 'name email')
      .lean();

    if (!application) {
      console.log('🏢 [getCompanyApplicationDetails] Application not found');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    console.log(`🏢 Job title: "${application.job?.title}"`);
    console.log(`🏢 Job type: ${application.job?.jobType}`);
    console.log(`🏢 Company populated: ${!!application.job?.company}`);
    console.log(`🏢 Company name: "${application.job?.company?.name}"`);
    console.log(`🏢 Company user ref: ${application.job?.company?.user}`);

    const company = await Company.findOne({ user: userId });
    if (!company) {
      console.log('🏢 [getCompanyApplicationDetails] Company profile not found for user');
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const jobCompanyId = application.job?.company?._id ?
      application.job.company._id.toString() :
      application.job?.company?.toString();

    if (!jobCompanyId || jobCompanyId !== company._id.toString() || application.job?.jobType !== 'company') {
      console.log('🏢 Authorization FAILED:', { jobCompanyId, companyId: company._id.toString(), jobType: application.job?.jobType });
      return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
    }

    console.log('🏢 Authorization GRANTED');

    console.log('🏢 Calling buildOwnerPreviewFromJob...');
    if (application.job) {
      application.job.ownerPreview = await buildOwnerPreviewFromJob(application.job);
      console.log(`🏢 ownerPreview result: logoUrl=${application.job.ownerPreview?.logoUrl ? application.job.ownerPreview.logoUrl.substring(0, 80) + '...' : 'NULL'}`);
      console.log(`🏢 ownerPreview name: "${application.job.ownerPreview?.name}"`);
    } else {
      console.log('🏢 WARNING: application.job is null/undefined');
    }

    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        const formatted = formatFileDataUniversal(cv, 'cv');
        if (!formatted) return null;
        const resolvedId = cv.cvId?.toString() || cv._id?.toString();
        return { ...formatted, cvId: resolvedId || formatted.cvId, _id: resolvedId || formatted._id };
      }).filter(cv => cv !== null),
      attachments: {
        referenceDocuments: (application.attachments?.referenceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        portfolioFiles: (application.attachments?.portfolioFiles || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        otherDocuments: (application.attachments?.otherDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications'))
      },
      references: (application.references || []).map(ref => {
        if (!ref) return null;
        if (ref.document) return { ...ref, document: formatFileDataUniversal(ref.document, 'applications') };
        return ref;
      }).filter(ref => ref !== null),
      workExperience: (application.workExperience || []).map(exp => {
        if (!exp) return null;
        if (exp.document) return { ...exp, document: formatFileDataUniversal(exp.document, 'applications') };
        return exp;
      }).filter(exp => exp !== null)
    };

    console.log(`🏢 [getCompanyApplicationDetails] SUCCESS — sending response`);
    console.log(`🏢 ==========================================\n`);

    res.status(200).json({ success: true, data: { application: applicationResponse } });

  } catch (error) {
    console.error('❌ Get company application details error:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    res.status(500).json({ success: false, message: 'Error fetching application details', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getOrganizationApplicationDetails
// ─────────────────────────────────────────────────────────────────────────────
exports.getOrganizationApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;

    console.log(`\n🏛️ ==========================================`);
    console.log(`🏛️ [getOrganizationApplicationDetails] START`);
    console.log(`🏛️ Application: ${applicationId}, User: ${userId}`);

    if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    if (!applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        populate: [
          { path: 'company', model: 'Company', select: COMPANY_POPULATE_SELECT },
          { path: 'organization', model: 'Organization', select: ORGANIZATION_POPULATE_SELECT }
        ]
      })
      .populate('candidate', 'name email avatar phone location')
      .populate('statusHistory.changedBy', 'name email')
      .populate('companyResponse.respondedBy', 'name email')
      .lean();

    if (!application) {
      console.log('🏛️ [getOrganizationApplicationDetails] Application not found');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    console.log(`🏛️ Job title: "${application.job?.title}"`);
    console.log(`🏛️ Job type: ${application.job?.jobType}`);
    console.log(`🏛️ Organization populated: ${!!application.job?.organization}`);

    const organization = await Organization.findOne({ user: userId });
    if (!organization) {
      console.log('🏛️ [getOrganizationApplicationDetails] Organization profile not found');
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const jobOrganizationId = application.job?.organization?._id ?
      application.job.organization._id.toString() :
      application.job?.organization?.toString();

    if (!jobOrganizationId || jobOrganizationId !== organization._id.toString() || application.job?.jobType !== 'organization') {
      console.log('🏛️ Authorization FAILED:', { jobOrganizationId, organizationId: organization._id.toString(), jobType: application.job?.jobType });
      return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
    }

    console.log('🏛️ Authorization GRANTED');

    console.log('🏛️ Calling buildOwnerPreviewFromJob...');
    if (application.job) {
      application.job.ownerPreview = await buildOwnerPreviewFromJob(application.job);
      console.log(`🏛️ ownerPreview result: logoUrl=${application.job.ownerPreview?.logoUrl ? application.job.ownerPreview.logoUrl.substring(0, 80) + '...' : 'NULL'}`);
      console.log(`🏛️ ownerPreview name: "${application.job.ownerPreview?.name}"`);
    } else {
      console.log('🏛️ WARNING: application.job is null/undefined');
    }

    const applicationResponse = {
      ...application,
      selectedCVs: (application.selectedCVs || []).map(cv => {
        if (!cv) return null;
        const formatted = formatFileDataUniversal(cv, 'cv');
        if (!formatted) return null;
        const resolvedId = cv.cvId?.toString() || cv._id?.toString();
        return { ...formatted, cvId: resolvedId || formatted.cvId, _id: resolvedId || formatted._id };
      }).filter(cv => cv !== null),
      attachments: {
        referenceDocuments: (application.attachments?.referenceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        experienceDocuments: (application.attachments?.experienceDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        portfolioFiles: (application.attachments?.portfolioFiles || []).map(doc => formatFileDataUniversal(doc, 'applications')),
        otherDocuments: (application.attachments?.otherDocuments || []).map(doc => formatFileDataUniversal(doc, 'applications'))
      },
      references: (application.references || []).map(ref => {
        if (!ref) return null;
        if (ref.document) return { ...ref, document: formatFileDataUniversal(ref.document, 'applications') };
        return ref;
      }).filter(ref => ref !== null),
      workExperience: (application.workExperience || []).map(exp => {
        if (!exp) return null;
        if (exp.document) return { ...exp, document: formatFileDataUniversal(exp.document, 'applications') };
        return exp;
      }).filter(exp => exp !== null)
    };

    console.log(`🏛️ [getOrganizationApplicationDetails] SUCCESS — sending response`);
    console.log(`🏛️ ==========================================\n`);

    res.status(200).json({ success: true, data: { application: applicationResponse } });

  } catch (error) {
    console.error('❌ Get organization application details error:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    res.status(500).json({ success: false, message: 'Error fetching application details', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// downloadApplicationFile
// ─────────────────────────────────────────────────────────────────────────────
exports.downloadApplicationFile = async (req, res) => {
  try {
    const { applicationId, fileId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log(`📥 Download request: application=${applicationId}, file=${fileId}`);

    const cleanFileId = fileId.replace(/^(cv-|ref-|exp-|att-)/, '');

    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

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

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    let hasPermission = false;
    if (userRole === 'candidate') {
      const candidateId = application.candidate._id ? application.candidate._id.toString() : application.candidate?.toString();
      hasPermission = candidateId === userId.toString();
    } else if (userRole === 'company') {
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
    if (!hasPermission) return res.status(403).json({ success: false, message: 'Not authorized to download this file' });

    let fileData = null, filePath = null, fileName = null, foundIn = '';

    // Search in selected CVs
    if (application.selectedCVs && application.selectedCVs.length > 0) {
      for (const cv of application.selectedCVs) {
        const cvId = cv.cvId?.toString() || cv._id?.toString() || '';
        if (cvId === cleanFileId || cv._id?.toString() === cleanFileId || cv.filename === fileId) {
          fileData = cv; filePath = cv.filePath || cv.path;
          fileName = cv.originalName || cv.fileName || cv.filename || 'CV'; foundIn = 'CVs'; break;
        }
      }
    }
    // Search in references
    if (!fileData && application.references && application.references.length > 0) {
      for (const ref of application.references) {
        if (ref.document) {
          const docId = ref.document._id ? ref.document._id.toString() : '';
          if ((docId && docId === cleanFileId) || ref.document.filename === fileId) {
            fileData = ref.document; filePath = ref.document.path;
            fileName = ref.document.originalName || ref.document.filename; foundIn = 'references'; break;
          }
        }
      }
    }
    // Search in work experience
    if (!fileData && application.workExperience && application.workExperience.length > 0) {
      for (const exp of application.workExperience) {
        if (exp.document) {
          const docId = exp.document._id ? exp.document._id.toString() : '';
          if ((docId && docId === cleanFileId) || exp.document.filename === fileId) {
            fileData = exp.document; filePath = exp.document.path;
            fileName = exp.document.originalName || exp.document.filename; foundIn = 'workExperience'; break;
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
      for (const att of allAttachments) {
        if (att._id && att._id.toString() === cleanFileId) {
          fileData = att; filePath = att.path;
          fileName = att.originalName || att.filename; foundIn = 'attachments'; break;
        }
      }
    }

    if (!fileData) return res.status(404).json({ success: false, message: 'File not found in this application' });

    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const folder = foundIn === 'CVs' ? 'cv' : 'applications';
    const filename = fileData.fileName || fileData.filename;
    if (!filename) return res.status(404).json({ success: false, message: 'File has no filename' });

    const possiblePaths = [
      path.join(uploadBase, folder, filename),
      path.join('/app', 'uploads', folder, filename),
      path.join(process.cwd(), 'uploads', folder, filename),
      path.join(uploadBase, 'applications', filename),
      path.join('/app', 'uploads', 'applications', filename),
      (!isWindowsPath(fileData.filePath || filePath) ? (fileData.filePath || filePath) : null)
    ].filter(Boolean);

    filePath = null;
    for (const candidate of possiblePaths) {
      if (candidate && fs.existsSync(candidate)) { filePath = candidate; break; }
    }
    if (!filePath) return res.status(404).json({ success: false, message: 'File not found on server' });

    res.setHeader('Content-Type', fileData.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming file' });
    });

  } catch (error) {
    console.error('❌ Download application file error:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Error downloading file', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// viewApplicationFile
// ─────────────────────────────────────────────────────────────────────────────
exports.viewApplicationFile = async (req, res) => {
  try {
    const { applicationId, fileId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const cleanFileId = fileId.replace(/^(cv-|ref-|exp-|att-)/, '');
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid application ID' });

    const application = await Application.findById(applicationId)
      .populate({ path: 'job', populate: [{ path: 'company', model: 'Company', select: 'name user' }, { path: 'organization', model: 'Organization', select: 'name user' }] })
      .populate('candidate', 'name').lean();
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    let hasPermission = false;
    if (userRole === 'candidate') {
      hasPermission = (application.candidate._id ? application.candidate._id.toString() : application.candidate?.toString()) === userId.toString();
    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job?.jobType === 'company') {
        hasPermission = (application.job.company?._id ? application.job.company._id.toString() : application.job.company?.toString()) === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job?.jobType === 'organization') {
        hasPermission = (application.job.organization?._id ? application.job.organization._id.toString() : application.job.organization?.toString()) === organization._id.toString();
      }
    } else if (userRole === 'admin') hasPermission = true;
    if (!hasPermission) return res.status(403).json({ success: false, message: 'Not authorized to view this file' });

    let fileData = null, filePath = null, fileName = null, foundIn = '';
    if (application.selectedCVs?.length > 0) {
      for (const cv of application.selectedCVs) {
        if ((cv.cvId?.toString() || cv._id?.toString() || '') === cleanFileId || cv.filename === fileId) {
          fileData = cv; filePath = cv.filePath || cv.path; fileName = cv.originalName || cv.fileName || cv.filename || 'CV'; foundIn = 'CVs'; break;
        }
      }
    }
    if (!fileData && application.references?.length > 0) {
      for (const ref of application.references) {
        if (ref.document?._id?.toString() === cleanFileId) {
          fileData = ref.document; filePath = ref.document.path; fileName = ref.document.originalName || ref.document.filename; foundIn = 'references'; break;
        }
      }
    }
    if (!fileData && application.workExperience?.length > 0) {
      for (const exp of application.workExperience) {
        if (exp.document?._id?.toString() === cleanFileId) {
          fileData = exp.document; filePath = exp.document.path; fileName = exp.document.originalName || exp.document.filename; foundIn = 'workExperience'; break;
        }
      }
    }
    if (!fileData && application.attachments) {
      const all = [...(application.attachments.referenceDocuments||[]), ...(application.attachments.experienceDocuments||[]), ...(application.attachments.portfolioFiles||[]), ...(application.attachments.otherDocuments||[])];
      for (const att of all) { if (att._id?.toString() === cleanFileId) { fileData = att; filePath = att.path; fileName = att.originalName || att.filename; foundIn = 'attachments'; break; } }
    }
    if (!fileData || !filePath) return res.status(404).json({ success: false, message: 'File not found in this application' });

    const inlineTypes = ['application/pdf','image/jpeg','image/jpg','image/png','image/gif','image/webp','text/plain','text/html'];
    if (!fileData.mimetype || !inlineTypes.includes(fileData.mimetype)) return res.status(400).json({ success: false, message: 'This file type cannot be viewed inline. Please download it.' });

    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const folder = foundIn === 'CVs' ? 'cv' : 'applications';
    const filename = fileData.fileName || fileData.filename;
    if (!filename) return res.status(404).json({ success: false, message: 'File has no filename' });

    const possiblePaths = [
      path.join(uploadBase, folder, filename), path.join('/app', 'uploads', folder, filename),
      path.join(process.cwd(), 'uploads', folder, filename), path.join(uploadBase, 'applications', filename),
      path.join('/app', 'uploads', 'applications', filename),
      (!isWindowsPath(fileData.filePath || filePath) ? (fileData.filePath || filePath) : null)
    ].filter(Boolean);
    filePath = null;
    for (const c of possiblePaths) { if (c && fs.existsSync(c)) { filePath = c; break; } }
    if (!filePath) return res.status(404).json({ success: false, message: 'File not found on server' });

    res.setHeader('Content-Type', fileData.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (error) => { if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming file' }); });

  } catch (error) {
    console.error('❌ View application file error:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Error viewing file', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getApplicationAttachments
// ─────────────────────────────────────────────────────────────────────────────
exports.getApplicationAttachments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid application ID' });

    const application = await Application.findById(applicationId)
      .populate({ path: 'job', populate: [{ path: 'company', model: 'Company', select: 'name user' }, { path: 'organization', model: 'Organization', select: 'name user' }] })
      .populate('candidate', 'name email').lean();
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    let hasPermission = false;
    if (userRole === 'candidate') {
      hasPermission = (application.candidate._id ? application.candidate._id.toString() : application.candidate?.toString()) === userId.toString();
    } else if (userRole === 'company') {
      const company = await Company.findOne({ user: userId });
      if (company && application.job?.jobType === 'company') {
        hasPermission = (application.job.company?._id ? application.job.company._id.toString() : application.job.company?.toString()) === company._id.toString();
      }
    } else if (userRole === 'organization') {
      const organization = await Organization.findOne({ user: userId });
      if (organization && application.job?.jobType === 'organization') {
        hasPermission = (application.job.organization?._id ? application.job.organization._id.toString() : application.job.organization?.toString()) === organization._id.toString();
      }
    } else if (userRole === 'admin') hasPermission = true;
    if (!hasPermission) return res.status(403).json({ success: false, message: 'Not authorized to access these files' });

    const attachments = [];
    if (application.selectedCVs?.length > 0) {
      application.selectedCVs.forEach((cv, i) => {
        if (cv) {
          const id = (cv.cvId || cv._id)?.toString();
          if (id) attachments.push({ _id: id, filename: cv.fileName || cv.filename, originalName: cv.originalName || cv.fileName || cv.filename, type: 'cv', size: cv.size || 0, mimetype: cv.mimetype || 'application/octet-stream', uploadedAt: cv.uploadedAt || application.createdAt, description: 'Curriculum Vitae', category: 'CV' });
        }
      });
    }
    if (application.references?.length > 0) {
      application.references.forEach((ref, i) => {
        if (ref.document?._id) attachments.push({ _id: ref.document._id.toString(), filename: ref.document.filename, originalName: ref.document.originalName || ref.document.filename, type: 'reference', size: ref.document.size || 0, mimetype: ref.document.mimetype || 'application/octet-stream', uploadedAt: ref.document.uploadedAt || application.createdAt, description: `Reference from ${ref.name || 'Reference'}`, category: 'Reference' });
      });
    }
    if (application.workExperience?.length > 0) {
      application.workExperience.forEach((exp, i) => {
        if (exp.document?._id) attachments.push({ _id: exp.document._id.toString(), filename: exp.document.filename, originalName: exp.document.originalName || exp.document.filename, type: 'experience', size: exp.document.size || 0, mimetype: exp.document.mimetype || 'application/octet-stream', uploadedAt: exp.document.uploadedAt || application.createdAt, description: `Experience at ${exp.company || 'Company'}`, category: 'Experience' });
      });
    }
    if (application.attachments) {
      [{ key: 'referenceDocuments', type: 'reference', desc: 'Reference Document' }, { key: 'experienceDocuments', type: 'experience', desc: 'Experience Document' }, { key: 'portfolioFiles', type: 'portfolio', desc: 'Portfolio File' }, { key: 'otherDocuments', type: 'other', desc: 'Other Document' }].forEach(cat => {
        (application.attachments[cat.key] || []).forEach((doc, i) => {
          if (doc?._id) attachments.push({ _id: doc._id.toString(), filename: doc.filename, originalName: doc.originalName || doc.filename, type: cat.type, size: doc.size || 0, mimetype: doc.mimetype || 'application/octet-stream', uploadedAt: doc.uploadedAt || application.createdAt, description: cat.desc, category: cat.type.charAt(0).toUpperCase() + cat.type.slice(1) });
        });
      });
    }

    res.status(200).json({ success: true, data: { attachments, applicationId: application._id, jobTitle: application.job?.title, candidateName: application.candidate?.name } });
  } catch (error) {
    console.error('❌ Get application attachments error:', error);
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid application ID' });
    res.status(500).json({ success: false, message: 'Error fetching attachments', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// downloadCV
// ─────────────────────────────────────────────────────────────────────────────
exports.downloadCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    if (!cvId || cvId === '0' || cvId === 'undefined' || cvId === 'null') return res.status(400).json({ success: false, message: 'Invalid CV ID' });

    let user = await User.findOne({ 'cvs._id': cvId }).select('cvs name email');
    if (!user) user = await User.findOne({ 'cvs.cvId': cvId }).select('cvs name email');
    if (!user) user = await User.findOne({ 'cvs.filename': cvId }).select('cvs name email');
    if (!user) return res.status(404).json({ success: false, message: 'CV not found' });

    const cv = user.cvs.find(c => c._id?.toString() === cvId || c.cvId?.toString() === cvId || c.filename === cvId);
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found in user profile' });

    let hasPermission = false;
    if (userRole === 'candidate') hasPermission = user._id.toString() === userId.toString();
    else if (userRole === 'company' || userRole === 'organization') {
      const app = await Application.findOne({ 'selectedCVs.cvId': cv._id.toString() }).populate({ path: 'job', populate: [{ path: 'company', model: 'Company' }, { path: 'organization', model: 'Organization' }] });
      if (app?.job) {
        if (userRole === 'company' && app.job.jobType === 'company') {
          const comp = await Company.findOne({ user: userId });
          if (comp) hasPermission = app.job.company?._id?.toString() === comp._id.toString();
        } else if (userRole === 'organization' && app.job.jobType === 'organization') {
          const org = await Organization.findOne({ user: userId });
          if (org) hasPermission = app.job.organization?._id?.toString() === org._id.toString();
        }
      }
    } else if (userRole === 'admin') hasPermission = true;
    if (!hasPermission) return res.status(403).json({ success: false, message: 'Not authorized to download this CV' });

    // 🔔 NOTIFICATION: Notify candidate that CV was downloaded
    (async () => {
      try {
        if (userRole === 'company' || userRole === 'organization') {
          await notificationService.create({
            recipient: user._id, actor: userId, type: 'profile_view',
            title: 'Your CV was viewed', body: 'An employer downloaded your CV',
            data: { entityType: 'User', entityId: user._id.toString(), screen: 'MyApplications' },
            priority: 'low', channels: { inApp: true, push: false, email: false }
          });
        }
      } catch (notifErr) { console.warn('[Notification] Non-critical error:', notifErr.message); }
    })();
    // END NOTIFICATION

    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const filename = cv.fileName || cv.filename;
    const storedPath = cv.filePath || cv.path;
    if (!filename) return res.status(404).json({ success: false, message: 'CV has no filename' });

    const possiblePaths = [path.join(uploadBase, 'cv', filename), path.join('/app', 'uploads', 'cv', filename), path.join(process.cwd(), 'uploads', 'cv', filename), path.join(uploadBase, filename), (!isWindowsPath(storedPath) ? storedPath : null)].filter(Boolean);
    let filePath = null;
    for (const c of possiblePaths) { if (c && fs.existsSync(c)) { filePath = c; break; } }
    if (!filePath) return res.status(404).json({ success: false, message: 'CV file not found on server' });

    const fileName = cv.originalName || cv.fileName || cv.filename || 'CV.pdf';
    res.setHeader('Content-Type', cv.mimetype || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-File-Name', encodeURIComponent(fileName));
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (error) => { if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming CV file' }); });

  } catch (error) {
    console.error('❌ Download CV error:', error);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Error downloading CV', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// viewCV
// ─────────────────────────────────────────────────────────────────────────────
exports.viewCV = async (req, res) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    if (!cvId || cvId === '0' || cvId === 'undefined' || cvId === 'null') return res.status(400).json({ success: false, message: 'Invalid CV ID' });

    let user = await User.findOne({ 'cvs._id': cvId }).select('cvs name email');
    if (!user) user = await User.findOne({ 'cvs.cvId': cvId }).select('cvs name email');
    if (!user) user = await User.findOne({ 'cvs.filename': cvId }).select('cvs name email');
    if (!user) return res.status(404).json({ success: false, message: 'CV not found' });

    const cv = user.cvs.find(c => c._id?.toString() === cvId || c.cvId?.toString() === cvId || c.filename === cvId);
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found in user profile' });

    let hasPermission = false;
    if (userRole === 'candidate') hasPermission = user._id.toString() === userId.toString();
    else if (userRole === 'company' || userRole === 'organization') {
      const app = await Application.findOne({ 'selectedCVs.cvId': cv._id.toString() }).populate({ path: 'job', populate: [{ path: 'company', model: 'Company' }, { path: 'organization', model: 'Organization' }] });
      if (app?.job) {
        if (userRole === 'company' && app.job.jobType === 'company') {
          const comp = await Company.findOne({ user: userId });
          if (comp) hasPermission = app.job.company?._id?.toString() === comp._id.toString();
        } else if (userRole === 'organization' && app.job.jobType === 'organization') {
          const org = await Organization.findOne({ user: userId });
          if (org) hasPermission = app.job.organization?._id?.toString() === org._id.toString();
        }
      }
    } else if (userRole === 'admin') hasPermission = true;
    if (!hasPermission) return res.status(403).json({ success: false, message: 'Not authorized to view this CV' });

    const inlineTypes = ['application/pdf','image/jpeg','image/jpg','image/png','image/gif','image/webp','text/plain'];
    if (!cv.mimetype || !inlineTypes.includes(cv.mimetype)) return res.status(400).json({ success: false, message: 'This CV type cannot be viewed inline. Please download it.' });

    const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
    const filename = cv.fileName || cv.filename;
    const storedPath = cv.filePath || cv.path;
    if (!filename) return res.status(404).json({ success: false, message: 'CV has no filename' });

    const possiblePaths = [path.join(uploadBase, 'cv', filename), path.join('/app', 'uploads', 'cv', filename), path.join(process.cwd(), 'uploads', 'cv', filename), path.join(uploadBase, filename), (!isWindowsPath(storedPath) ? storedPath : null)].filter(Boolean);
    let filePath = null;
    for (const c of possiblePaths) { if (c && fs.existsSync(c)) { filePath = c; break; } }
    if (!filePath) return res.status(404).json({ success: false, message: 'CV file not found on server' });

    const fileName = cv.originalName || cv.fileName || cv.filename || 'CV.pdf';
    res.setHeader('Content-Type', cv.mimetype || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (error) => { if (!res.headersSent) res.status(500).json({ success: false, message: 'Error streaming CV file' }); });

  } catch (error) {
    console.error('❌ View CV error:', error);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Error viewing CV', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};