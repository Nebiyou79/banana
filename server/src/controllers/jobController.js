// controllers/jobController.js - UPDATED VERSION WITH OWNER PREVIEW
const Job = require('../models/Job');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const {
  COMPANY_POPULATE_SELECT,
  ORGANIZATION_POPULATE_SELECT,
  buildOwnerPreviewFromJob,
  enrichJobsWithOwnerPreview,
} = require('../utils/resolveOwnerPreview');

// Helper function to count text characters (without HTML tags)
const countTextCharacters = (html) => {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, '');
  const cleanText = text.replace(/\s+/g, ' ').trim();
  return cleanText.length;
};

// NEW: Helper function to sanitize salary data based on salaryMode
const sanitizeSalaryData = (jobData) => {
  const salaryMode = jobData.salaryMode || (jobData.salary && jobData.salary.mode) || 'range';
  if (salaryMode !== 'range') {
    if (jobData.salary) {
      jobData.salary.min = undefined;
      jobData.salary.max = undefined;
      jobData.salary.currency = undefined;
    }
  }
  return jobData;
};

// NEW: Helper to format job response with virtuals
const formatJobResponse = (job) => {
  if (!job) return null;
  const jobObj = job.toObject ? job.toObject() : job;
  return {
    ...jobObj,
    salaryDisplay: job.salaryDisplay,
    isSalaryVisible: job.isSalaryVisible,
    applicationStatus: job.applicationStatus,
    canAcceptApplications: job.canAcceptApplications,
    isActive: job.isActive,
    isExpired: job.isExpired,
    displayType: job.displayType,
    ownerType: job.ownerType,
    applicationInfo: {
      isApplyEnabled: job.isApplyEnabled,
      canApply: job.canApply ? job.canApply() : (job.isApplyEnabled && !job.isExpired),
      candidatesNeeded: job.candidatesNeeded,
      candidatesRemaining: Math.max(0, job.candidatesNeeded - (job.applicationCount || 0)),
      applicationCount: job.applicationCount || 0,
      status: job.applicationStatus
    },
    salaryInfo: {
      display: job.salaryDisplay,
      mode: job.salaryMode || 'range',
      details: job.salaryMode === 'range' ? {
        min: job.salary?.min,
        max: job.salary?.max,
        currency: job.salary?.currency,
        period: job.salary?.period,
        isNegotiable: job.salary?.isNegotiable,
        isPublic: job.salary?.isPublic
      } : null,
      isVisible: job.isSalaryVisible
    }
  };
};

/**
 * Format job response AND attach ownerPreview.
 * ownerPreview is built from the already-populated company/org sub-doc,
 * then augmented with the Cloudinary avatar from the linked Profile
 * (same mechanism used by ProductController.buildOwnerSnapshot).
 */
const formatJobResponseWithPreview = async (job) => {
  const base = formatJobResponse(job);
  if (!base) return null;
  base.ownerPreview = await buildOwnerPreviewFromJob(base);
  return base;
};

// @desc    Get all ACTIVE jobs (public)
// @route   GET /api/v1/job
// @access  Public
exports.getJobs = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, search, region, category,
      type, experienceLevel, minSalary, maxSalary, jobType, salaryMode
    } = req.query;

    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (region)           query['location.region'] = region;
    if (category)         query.category            = category;
    if (type)             query.type                = type;
    if (experienceLevel)  query.experienceLevel     = experienceLevel;
    if (jobType)          query.jobType             = jobType;
    if (salaryMode)       query.salaryMode          = salaryMode;

    if (minSalary || maxSalary) {
      query.$and = query.$and || [];
      query.$and.push({ salaryMode: 'range' });
      if (minSalary) {
        query.$and.push({ $or: [{ 'salary.min': { $gte: parseInt(minSalary) } }, { 'salary.max': { $gte: parseInt(minSalary) } }] });
      }
      if (maxSalary) {
        query.$and.push({ $or: [{ 'salary.max': { $lte: parseInt(maxSalary) } }, { 'salary.min': { $lte: parseInt(maxSalary) } }] });
      }
    }

    const jobs = await Job.find(query)
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT)
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    // Build ownerPreview for each job (Profile-backed, same as Products)
    const formattedJobs = await Promise.all(jobs.map(j => formatJobResponseWithPreview(j)));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
};

// @desc    Create job
// @route   POST /api/v1/job
// @access  Private (Company only)
exports.createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false, message: 'Validation failed',
        errors: errors.array(),
        details: errors.array().map(err => ({ field: err.path, message: err.msg, value: err.value }))
      });
    }

    if (req.user.role !== 'company' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only companies can create jobs' });
    }

    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    console.log('📥 Received job data:', JSON.stringify({
      ...req.body,
      descriptionLength: req.body.description?.length,
      textOnlyLength: countTextCharacters(req.body.description)
    }, null, 2));

    const validEducationLevels = [
      'primary-education', 'secondary-education', 'tvet-level-i', 'tvet-level-ii',
      'tvet-level-iii', 'tvet-level-iv', 'tvet-level-v', 'undergraduate-bachelors',
      'postgraduate-masters', 'doctoral-phd', 'lecturer', 'professor', 'none-required',
      'high-school', 'diploma', 'bachelors', 'masters', 'phd'
    ];

    if (req.body.educationLevel && !validEducationLevels.includes(req.body.educationLevel)) {
      return res.status(400).json({
        success: false, message: 'Validation failed',
        errors: [`Invalid education level: ${req.body.educationLevel}`],
        details: [{ field: 'educationLevel', message: 'Invalid education level', value: req.body.educationLevel }]
      });
    }

    const validCategories = Job.schema.path('category').enumValues;
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        success: false, message: 'Validation failed',
        errors: [`Invalid category: ${req.body.category}`],
        details: [{ field: 'category', message: 'Invalid category', value: req.body.category }]
      });
    }

    if (req.body.description) {
      const textLength = countTextCharacters(req.body.description);
      if (textLength < 50) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: ['Description must be at least 50 characters long (text only)'] });
      }
      if (textLength > 5000) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: ['Description cannot exceed 5000 characters (text only)'] });
      }
    }

    if (!req.body.candidatesNeeded || req.body.candidatesNeeded < 1) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: ['At least 1 candidate is required'] });
    }

    const sanitizedData = sanitizeSalaryData(req.body);

    const educationLevelMapping = {
      'high-school': 'secondary-education', 'diploma': 'tvet-level-iii',
      'bachelors': 'undergraduate-bachelors', 'masters': 'postgraduate-masters', 'phd': 'doctoral-phd'
    };

    const jobData = {
      ...sanitizedData,
      isApplyEnabled: req.body.isApplyEnabled !== undefined ? req.body.isApplyEnabled : true,
      educationLevel: educationLevelMapping[req.body.educationLevel] || req.body.educationLevel,
      company: company._id,
      jobType: 'company',
      createdBy: userId,
      salaryMode: req.body.salaryMode || 'range'
    };

    const job = await Job.create(jobData);
    await job.populate('company', COMPANY_POPULATE_SELECT);

    const formattedJob = await formatJobResponseWithPreview(job);

    res.status(201).json({ success: true, message: 'Job created successfully', data: formattedJob });
  } catch (error) {
    console.error('Create job error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false, message: 'Validation failed', errors: messages,
        details: Object.values(error.errors).map(err => ({ field: err.path, message: err.message, value: err.value }))
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate job entry', errors: ['A job with similar details already exists'] });
    }
    res.status(500).json({ success: false, message: 'Error creating job', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get single job
// @route   GET /api/v1/job/:id
// @access  Public
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT)
      .populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.viewCount = (job.viewCount || 0) + 1;
    await job.save();

    const formattedJob = await formatJobResponseWithPreview(job);

    res.status(200).json({ success: true, data: formattedJob });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Error fetching job' });
  }
};

// @desc    Get company jobs
// @route   GET /api/v1/job/company/my-jobs
// @access  Private (Company only)
exports.getCompanyJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found' });
    }

    const { page = 1, limit = 12, status } = req.query;

    const query = { company: company._id, jobType: 'company' };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('company', COMPANY_POPULATE_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);
    const formattedJobs = await Promise.all(jobs.map(j => formatJobResponseWithPreview(j)));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: { current: parseInt(page), totalPages: Math.ceil(total / limit), totalResults: total }
    });
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching company jobs' });
  }
};

// @desc    Update job
// @route   PUT /api/v1/job/:id
// @access  Private (Company/Admin only)
exports.updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    let job = await Job.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Company profile not found' });
    }

    const jobCompanyId = job.company?._id ? job.company._id.toString() : job.company?.toString();
    const userCompanyId = company._id.toString();

    if (job.jobType !== 'company') {
      return res.status(403).json({ success: false, message: 'This is not a company job' });
    }

    if (jobCompanyId !== userCompanyId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    if (req.body.description) {
      const textLength = countTextCharacters(req.body.description);
      if (textLength < 50) return res.status(400).json({ success: false, message: 'Validation failed', errors: ['Description must be at least 50 characters long (text only)'] });
      if (textLength > 5000) return res.status(400).json({ success: false, message: 'Validation failed', errors: ['Description cannot exceed 5000 characters (text only)'] });
    }

    const sanitizedData = sanitizeSalaryData(req.body);

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    )
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT);

    const formattedJob = await formatJobResponseWithPreview(updatedJob);

    res.status(200).json({ success: true, message: 'Job updated successfully', data: formattedJob });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Error updating job' });
  }
};

// @desc    Delete job
// @route   DELETE /api/v1/job/:id
// @access  Private (Company/Admin only)
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Company profile not found' });
    }

    const jobCompanyId = job.company?._id ? job.company._id.toString() : job.company?.toString();
    if (jobCompanyId !== company?._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Error deleting job' });
  }
};

// @desc    Get jobs for candidate (authenticated browsing)
// @route   GET /api/v1/job/candidate/jobs
// @access  Private (Candidate)
exports.getJobsForCandidate = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, search, region, category,
      type, experienceLevel, minSalary, maxSalary, remote, salaryMode
    } = req.query;

    const filter = { status: 'active' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (region)          filter['location.region'] = region;
    if (category)        filter.category            = category;
    if (type)            filter.type                = type;
    if (experienceLevel) filter.experienceLevel     = experienceLevel;
    if (remote)          filter.remote              = remote;
    if (salaryMode)      filter.salaryMode          = salaryMode;

    if (minSalary || maxSalary) {
      filter.$and = filter.$and || [];
      filter.$and.push({ salaryMode: 'range' });
      if (minSalary) filter.$and.push({ $or: [{ 'salary.min': { $gte: parseInt(minSalary) } }, { 'salary.max': { $gte: parseInt(minSalary) } }] });
      if (maxSalary) filter.$and.push({ $or: [{ 'salary.max': { $lte: parseInt(maxSalary) } }, { 'salary.min': { $lte: parseInt(maxSalary) } }] });
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company',      COMPANY_POPULATE_SELECT)
        .populate('organization', ORGANIZATION_POPULATE_SELECT)
        .sort({ featured: -1, urgent: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Job.countDocuments(filter)
    ]);

    const formattedJobs = await Promise.all(jobs.map(j => formatJobResponseWithPreview(j)));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs for candidate error:', error);
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
};

// @desc    Save job for candidate
// @route   POST /api/v1/job/:jobId/save
// @access  Private (Candidate)
exports.saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId || req.user._id;

    if (!jobId) return res.status(400).json({ success: false, message: 'Job ID is required' });

    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(jobId)) return res.status(400).json({ success: false, message: 'Invalid job ID format' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.savedJobs) user.savedJobs = [];

    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({ success: false, message: 'Job is already saved' });
    }

    user.savedJobs.push(jobId);
    job.saveCount = (job.saveCount || 0) + 1;
    await Promise.all([user.save(), job.save()]);

    res.status(200).json({ success: true, message: 'Job saved successfully', data: { saved: true } });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ success: false, message: 'Error saving job', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Unsave job for candidate
// @route   POST /api/v1/job/:jobId/unsave
// @access  Private (Candidate)
exports.unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId || req.user._id;

    if (!jobId) return res.status(400).json({ success: false, message: 'Job ID is required' });

    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(jobId)) return res.status(400).json({ success: false, message: 'Invalid job ID format' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.savedJobs) user.savedJobs = [];

    if (!user.savedJobs.includes(jobId)) {
      return res.status(400).json({ success: false, message: 'Job is not saved' });
    }

    user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
    job.saveCount = Math.max(0, (job.saveCount || 1) - 1);
    await Promise.all([user.save(), job.save()]);

    res.status(200).json({ success: true, message: 'Job removed from saved', data: { saved: false } });
  } catch (error) {
    console.error('Unsave job error:', error);
    res.status(500).json({ success: false, message: 'Error unsaving job', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get saved jobs for candidate
// @route   GET /api/v1/job/saved
// @access  Private (Candidate)
exports.getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const user = await User.findById(userId).select('savedJobs');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.savedJobs || user.savedJobs.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const savedJobs = await Job.find({ _id: { $in: user.savedJobs } })
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT);

    const formattedJobs = await Promise.all(savedJobs.map(j => formatJobResponseWithPreview(j)));

    res.status(200).json({ success: true, data: formattedJobs });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching saved jobs', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Organization job management (mirrors company flow) ────────────────────────

// @desc    Get organization's own jobs
// @route   GET /api/v1/job/organization/my-jobs
// @access  Private (Organization only)
exports.getOrganizationJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const org = await Organization.findOne({ user: userId });
    if (!org) return res.status(404).json({ success: false, message: 'Organization profile not found' });

    const { page = 1, limit = 12, status } = req.query;
    const query = { organization: org._id, jobType: 'organization' };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('organization', ORGANIZATION_POPULATE_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);
    const formattedJobs = await Promise.all(jobs.map(j => formatJobResponseWithPreview(j)));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: { current: parseInt(page), totalPages: Math.ceil(total / limit), totalResults: total }
    });
  } catch (error) {
    console.error('Get organization jobs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching organization jobs' });
  }
};

// @desc    Create organization job
// @route   POST /api/v1/job/organization
// @access  Private (Organization only)
exports.createOrganizationJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    if (req.user.role !== 'organization' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only organizations can create organization jobs' });
    }

    const userId = req.user.userId || req.user._id;
    const org = await Organization.findOne({ user: userId });
    if (!org) return res.status(404).json({ success: false, message: 'Organization profile not found' });

    const sanitizedData = sanitizeSalaryData(req.body);

    const jobData = {
      ...sanitizedData,
      isApplyEnabled: req.body.isApplyEnabled !== undefined ? req.body.isApplyEnabled : true,
      organization: org._id,
      jobType: 'organization',
      createdBy: userId,
      salaryMode: req.body.salaryMode || 'range'
    };

    const job = await Job.create(jobData);
    await job.populate('organization', ORGANIZATION_POPULATE_SELECT);

    const formattedJob = await formatJobResponseWithPreview(job);
    res.status(201).json({ success: true, message: 'Opportunity created successfully', data: formattedJob });
  } catch (error) {
    console.error('Create organization job error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Error creating opportunity', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Update organization job
// @route   PUT /api/v1/job/organization/:id
// @access  Private (Organization/Admin only)
exports.updateOrganizationJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.jobType !== 'organization') {
      return res.status(403).json({ success: false, message: 'This is not an organization job' });
    }

    const userId = req.user.userId || req.user._id;
    const org = await Organization.findOne({ user: userId });

    if (!org && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Organization profile not found' });
    }

    const jobOrgId = job.organization?._id ? job.organization._id.toString() : job.organization?.toString();
    if (org && jobOrgId !== org._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    const sanitizedData = sanitizeSalaryData(req.body);

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    )
      .populate('company',      COMPANY_POPULATE_SELECT)
      .populate('organization', ORGANIZATION_POPULATE_SELECT);

    const formattedJob = await formatJobResponseWithPreview(updatedJob);
    res.status(200).json({ success: true, message: 'Job updated successfully', data: formattedJob });
  } catch (error) {
    console.error('Update organization job error:', error);
    res.status(500).json({ success: false, message: 'Error updating job' });
  }
};

// @desc    Delete organization job
// @route   DELETE /api/v1/job/organization/:id
// @access  Private (Organization/Admin only)
exports.deleteOrganizationJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.jobType !== 'organization') return res.status(403).json({ success: false, message: 'This is not an organization job' });

    const userId = req.user.userId || req.user._id;
    const org = await Organization.findOne({ user: userId });

    const jobOrgId = job.organization?._id ? job.organization._id.toString() : job.organization?.toString();
    if (org && jobOrgId !== org._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Delete organization job error:', error);
    res.status(500).json({ success: false, message: 'Error deleting opportunity' });
  }
};
// @desc    Get job categories
// @route   GET /api/v1/job/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = Job.schema.path('category').enumValues;
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
};