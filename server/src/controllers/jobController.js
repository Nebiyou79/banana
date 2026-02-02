// controllers/jobController.js - UPDATED VERSION WITH ALL NEW FEATURES
const Job = require('../models/Job');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper function to count text characters (without HTML tags)
const countTextCharacters = (html) => {
  if (!html) return 0;
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');
  // Remove multiple spaces and newlines
  const cleanText = text.replace(/\s+/g, ' ').trim();
  return cleanText.length;
};

// NEW: Helper function to sanitize salary data based on salaryMode
const sanitizeSalaryData = (jobData) => {
  const salaryMode = jobData.salaryMode || (jobData.salary && jobData.salary.mode) || 'range';
  
  // Clear salary fields if mode is not 'range'
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
  
  // Convert to plain object to include virtuals
  const jobObj = job.toObject ? job.toObject() : job;
  
  // Add computed fields
  return {
    ...jobObj,
    // Virtuals will be included automatically due to schema options
    // But we'll ensure they're present
    salaryDisplay: job.salaryDisplay,
    isSalaryVisible: job.isSalaryVisible,
    applicationStatus: job.applicationStatus,
    canAcceptApplications: job.canAcceptApplications,
    isActive: job.isActive,
    isExpired: job.isExpired,
    displayType: job.displayType,
    ownerType: job.ownerType,
    // Application info
    applicationInfo: {
      isApplyEnabled: job.isApplyEnabled,
      canApply: job.canApply(),
      candidatesNeeded: job.candidatesNeeded,
      candidatesRemaining: Math.max(0, job.candidatesNeeded - (job.applicationCount || 0)),
      applicationCount: job.applicationCount || 0,
      status: job.applicationStatus
    },
    // Salary info
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

// @desc    Get all ACTIVE jobs (public) - UPDATED
// @route   GET /api/v1/job
// @access  Public
exports.getJobs = async (req, res, next) => {
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
      maxSalary,
      jobType,
      salaryMode
    } = req.query;

    const query = { status: 'active' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (region) query['location.region'] = region;
    if (category) query.category = category;
    if (type) query.type = type;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (jobType) query.jobType = jobType;
    if (salaryMode) query.salaryMode = salaryMode;

    // Salary filtering only works for jobs with salary mode 'range'
    if (minSalary || maxSalary) {
      query.$and = query.$and || [];
      query.$and.push({ salaryMode: 'range' });
      
      if (minSalary) {
        query.$and.push({
          $or: [
            { 'salary.min': { $gte: parseInt(minSalary) } },
            { 'salary.max': { $gte: parseInt(minSalary) } }
          ]
        });
      }
      if (maxSalary) {
        query.$and.push({
          $or: [
            { 'salary.max': { $lte: parseInt(maxSalary) } },
            { 'salary.min': { $lte: parseInt(maxSalary) } }
          ]
        });
      }
    }

    const jobs = await Job.find(query)
      .populate('company', 'name logoUrl verified industry')
      .populate('organization', 'name logoUrl verified industry organizationType')
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    // Format each job response
    const formattedJobs = jobs.map(job => formatJobResponse(job));

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
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

// @desc    Create job - UPDATED WITH ALL NEW FEATURES
// @route   POST /api/v1/job
// @access  Private (Company only)
exports.createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }

    if (req.user.role !== 'company' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only companies can create jobs'
      });
    }

    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    // Log the incoming data for debugging
    console.log('📥 Received job data:', JSON.stringify({
      ...req.body,
      descriptionLength: req.body.description?.length,
      textOnlyLength: countTextCharacters(req.body.description)
    }, null, 2));

    // VALIDATE EDUCATION LEVEL
    const validEducationLevels = [
      'primary-education',
      'secondary-education',
      'tvet-level-i',
      'tvet-level-ii',
      'tvet-level-iii',
      'tvet-level-iv',
      'tvet-level-v',
      'undergraduate-bachelors',
      'postgraduate-masters',
      'doctoral-phd',
      'lecturer',
      'professor',
      'none-required',
      // Backward compatibility
      'high-school',
      'diploma',
      'bachelors',
      'masters',
      'phd'
    ];

    if (req.body.educationLevel && !validEducationLevels.includes(req.body.educationLevel)) {
      console.log('❌ Invalid education level:', req.body.educationLevel);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [`Invalid education level: ${req.body.educationLevel}`],
        details: [{
          field: 'educationLevel',
          message: 'Invalid education level',
          value: req.body.educationLevel,
          validOptions: validEducationLevels
        }]
      });
    }

    // VALIDATE CATEGORY (using new enum)
    const validCategories = Job.schema.path('category').enumValues;
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [`Invalid category: ${req.body.category}`],
        details: [{
          field: 'category',
          message: 'Invalid category',
          value: req.body.category
        }]
      });
    }

    // VALIDATE DESCRIPTION TEXT LENGTH
    if (req.body.description) {
      const textLength = countTextCharacters(req.body.description);
      console.log('📊 Description validation:', {
        htmlLength: req.body.description.length,
        textLength: textLength
      });

      if (textLength < 50) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description must be at least 50 characters long (text only)'],
          details: [{
            field: 'description',
            message: 'Description must be at least 50 characters long (text only)',
            value: `Text length: ${textLength} characters`
          }]
        });
      }

      if (textLength > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description cannot exceed 5000 characters (text only)'],
          details: [{
            field: 'description',
            message: 'Description cannot exceed 5000 characters (text only)',
            value: `Text length: ${textLength} characters`
          }]
        });
      }
    }

    // VALIDATE CANDIDATES NEEDED
    if (!req.body.candidatesNeeded || req.body.candidatesNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['At least 1 candidate is required'],
        details: [{
          field: 'candidatesNeeded',
          message: 'At least 1 candidate is required',
          value: req.body.candidatesNeeded
        }]
      });
    }

    // SANITIZE SALARY DATA BASED ON SALARY MODE
    const sanitizedData = sanitizeSalaryData(req.body);

    // Transform education level if using old values
    const educationLevelMapping = {
      'high-school': 'secondary-education',
      'diploma': 'tvet-level-iii',
      'bachelors': 'undergraduate-bachelors',
      'masters': 'postgraduate-masters',
      'phd': 'doctoral-phd'
    };

    const jobData = {
      ...sanitizedData,
      isApplyEnabled: req.body.isApplyEnabled !== undefined ? req.body.isApplyEnabled : true,
      educationLevel: educationLevelMapping[req.body.educationLevel] || req.body.educationLevel,
      company: company._id,
      jobType: 'company',
      createdBy: userId,
      // Ensure salaryMode defaults to 'range' if not provided
      salaryMode: req.body.salaryMode || 'range'
    };

    console.log('📤 Creating job with data:', JSON.stringify({
      ...jobData,
      descriptionLength: jobData.description?.length,
      textOnlyLength: countTextCharacters(jobData.description)
    }, null, 2));

    const job = await Job.create(jobData);
    await job.populate('company', 'name logoUrl verified industry');

    console.log('✅ Job created successfully:', job._id);

    const formattedJob = formatJobResponse(job);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: formattedJob
    });
  } catch (error) {
    console.error('Create job error:', error);

    if (error.name === 'ValidationError') {
      console.log('❌ Mongoose validation errors:', error.errors);
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
        details: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate job entry',
        errors: ['A job with similar details already exists']
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single job - UPDATED
// @route   GET /api/v1/job/:id
// @access  Public
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logoUrl verified industry description website')
      .populate('organization', 'name logoUrl verified industry organizationType description website mission')
      .populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.viewCount = (job.viewCount || 0) + 1;
    await job.save();

    const formattedJob = formatJobResponse(job);

    res.status(200).json({
      success: true,
      data: formattedJob
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
};

// @desc    Get company jobs - UPDATED
// @route   GET /api/v1/job/company/my-jobs
// @access  Private (Company only)
exports.getCompanyJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const { page = 1, limit = 12, status } = req.query;

    const query = {
      company: company._id,
      jobType: 'company'
    };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('company', 'name logoUrl verified')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    // Format each job response
    const formattedJobs = jobs.map(job => formatJobResponse(job));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    });
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company jobs'
    });
  }
};

// @desc    Update job - UPDATED WITH ALL NEW FEATURES
// @route   PUT /api/v1/job/:id
// @access  Private (Company/Admin only)
exports.updateJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    // Properly compare company IDs
    const jobCompanyId = job.company?._id ? job.company._id.toString() : job.company?.toString();
    const userCompanyId = company._id.toString();

    console.log('Job Company ID:', jobCompanyId);
    console.log('User Company ID:', userCompanyId);
    console.log('Match:', jobCompanyId === userCompanyId);

    if (job.jobType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'This is not a company job'
      });
    }

    if (jobCompanyId !== userCompanyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    // VALIDATE DESCRIPTION TEXT LENGTH FOR UPDATES
    if (req.body.description) {
      const textLength = countTextCharacters(req.body.description);
      console.log('📊 Description validation for update:', {
        htmlLength: req.body.description.length,
        textLength: textLength
      });

      if (textLength < 50) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description must be at least 50 characters long (text only)']
        });
      }

      if (textLength > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description cannot exceed 5000 characters (text only)']
        });
      }
    }

    // SANITIZE SALARY DATA BASED ON SALARY MODE
    const sanitizedData = sanitizeSalaryData(req.body);

    // Use findByIdAndUpdate for better handling
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).populate('company', 'name logoUrl verified industry');

    const formattedJob = formatJobResponse(updatedJob);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: formattedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
};

// @desc    Delete job - UPDATED
// @route   DELETE /api/v1/job/:id
// @access  Private (Company/Admin only)
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    // Properly compare company IDs
    const jobCompanyId = job.company?._id ? job.company._id.toString() : job.company?.toString();
    const userCompanyId = company._id.toString();

    if (job.jobType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'This is not a company job'
      });
    }

    if (jobCompanyId !== userCompanyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job'
    });
  }
};

// @desc    Get organization jobs - UPDATED
// @route   GET /api/v1/job/organization/my-jobs
// @access  Private (Organization only)
exports.getOrganizationJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const organization = await Organization.findOne({ user: userId });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found. Please create your organization profile first.'
      });
    }

    const { page = 1, limit = 12, status } = req.query;

    const query = {
      organization: organization._id,
      jobType: 'organization'
    };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('organization', 'name logoUrl verified organizationType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    // Format each job response
    const formattedJobs = jobs.map(job => formatJobResponse(job));

    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    });
  } catch (error) {
    console.error('Get organization jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization opportunities'
    });
  }
};

// @desc    Create job for organization - UPDATED
// @route   POST /api/v1/job/organization
// @access  Private (Organization only)
exports.createOrganizationJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (req.user.role !== 'organization' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organizations can create opportunities'
      });
    }

    const userId = req.user.userId || req.user._id;
    const organization = await Organization.findOne({ user: userId });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found. Please create your organization profile first.'
      });
    }

    // VALIDATE DESCRIPTION TEXT LENGTH
    if (req.body.description) {
      const textLength = countTextCharacters(req.body.description);
      console.log('📊 Description validation for organization:', {
        htmlLength: req.body.description.length,
        textLength: textLength
      });

      if (textLength < 50) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description must be at least 50 characters long (text only)']
        });
      }

      if (textLength > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description cannot exceed 5000 characters (text only)']
        });
      }
    }

    // VALIDATE CANDIDATES NEEDED
    if (!req.body.candidatesNeeded || req.body.candidatesNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['At least 1 candidate is required'],
        details: [{
          field: 'candidatesNeeded',
          message: 'At least 1 candidate is required',
          value: req.body.candidatesNeeded
        }]
      });
    }

    // SANITIZE SALARY DATA BASED ON SALARY MODE
    const sanitizedData = sanitizeSalaryData(req.body);

    const jobData = {
      ...sanitizedData,
      organization: organization._id,
      isApplyEnabled: req.body.isApplyEnabled !== undefined ? req.body.isApplyEnabled : true,
      jobType: 'organization',
      createdBy: userId,
      // Ensure salaryMode defaults to 'range' if not provided
      salaryMode: req.body.salaryMode || 'range'
    };

    const job = await Job.create(jobData);
    await job.populate('organization', 'name logoUrl verified industry organizationType');

    const formattedJob = formatJobResponse(job);

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: formattedJob
    });
  } catch (error) {
    console.error('Create organization job error:', error);

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
      message: 'Error creating opportunity'
    });
  }
};

// @desc    Update organization job - UPDATED
// @route   PUT /api/v1/job/organization/:id
// @access  Private (Organization/Admin only)
exports.updateOrganizationJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    const organization = await Organization.findOne({ user: userId });

    if (!organization && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    // Properly compare organization IDs
    const jobOrganizationId = job.organization?._id ? job.organization._id.toString() : job.organization?.toString();
    const userOrganizationId = organization._id.toString();

    if (job.jobType !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'This is not an organization opportunity'
      });
    }

    if (jobOrganizationId !== userOrganizationId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this opportunity'
      });
    }

    // VALIDATE DESCRIPTION TEXT LENGTH FOR UPDATES
    if (req.body.description) {
      const textLength = countTextCharacters(req.body.description);
      console.log('📊 Description validation for organization update:', {
        htmlLength: req.body.description.length,
        textLength: textLength
      });

      if (textLength < 50) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description must be at least 50 characters long (text only)']
        });
      }

      if (textLength > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Description cannot exceed 5000 characters (text only)']
        });
      }
    }

    // SANITIZE SALARY DATA BASED ON SALARY MODE
    const sanitizedData = sanitizeSalaryData(req.body);

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    ).populate('organization', 'name logoUrl verified industry organizationType');

    const formattedJob = formatJobResponse(updatedJob);

    res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully',
      data: formattedJob
    });
  } catch (error) {
    console.error('Update organization job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating opportunity'
    });
  }
};

// @desc    Delete organization job - UPDATED
// @route   DELETE /api/v1/job/organization/:id
// @access  Private (Organization/Admin only)
exports.deleteOrganizationJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    const organization = await Organization.findOne({ user: userId });

    if (!organization && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    // Properly compare organization IDs
    const jobOrganizationId = job.organization?._id ? job.organization._id.toString() : job.organization?.toString();
    const userOrganizationId = organization._id.toString();

    if (job.jobType !== 'organization') {
      return res.status(403).json({
        success: false,
        message: 'This is not an organization opportunity'
      });
    }

    if (jobOrganizationId !== userOrganizationId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this opportunity'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete organization job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting opportunity'
    });
  }
};

// @desc    Get job categories - UPDATED
// @route   GET /api/v1/job/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};

// @desc    Get jobs for candidates with advanced filtering - UPDATED
// @route   GET /api/v1/job/candidate
// @access  Private (Candidate)
exports.getJobsForCandidate = async (req, res, next) => {
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
      maxSalary,
      remote
    } = req.query;

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
    if (remote) filter.remote = remote;

    // Salary filtering only works for jobs with salary mode 'range'
    if (minSalary || maxSalary) {
      filter.$and = filter.$and || [];
      filter.$and.push({ salaryMode: 'range' });
      
      if (minSalary) {
        filter.$and.push({
          $or: [
            { 'salary.min': { $gte: parseInt(minSalary) } },
            { 'salary.max': { $gte: parseInt(minSalary) } }
          ]
        });
      }
      if (maxSalary) {
        filter.$and.push({
          $or: [
            { 'salary.max': { $lte: parseInt(maxSalary) } },
            { 'salary.min': { $lte: parseInt(maxSalary) } }
          ]
        });
      }
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logoUrl verified industry')
        .populate('organization', 'name logoUrl verified industry organizationType')
        .sort({ featured: -1, urgent: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Job.countDocuments(filter)
    ]);

    // Format each job response
    const formattedJobs = jobs.map(job => formatJobResponse(job));

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
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

// Existing saveJob, unsaveJob, and getSavedJobs functions remain the same...

// @desc    Save job for candidate
// @route   POST /api/v1/job/:jobId/save
// @access  Private (Candidate)
exports.saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

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

    // Check if applications are enabled
    if (!job.isApplyEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Applications are closed for this job'
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
    console.error('Save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving job'
    });
  }
};

// @desc    Unsave job for candidate
// @route   POST /api/v1/job/:jobId/unsave
// @access  Private (Candidate)
exports.unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

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
    console.error('Unsave job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unsaving job'
    });
  }
};

// @desc    Get saved jobs for candidate - UPDATED
// @route   GET /api/v1/job/saved
// @access  Private (Candidate)
exports.getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;

    // First get user with saved job IDs
    const user = await User.findById(userId).select('savedJobs');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.savedJobs || user.savedJobs.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get the actual jobs with proper population
    const savedJobs = await Job.find({
      _id: { $in: user.savedJobs },
      status: 'active',
      $or: [
        { applicationDeadline: { $gt: new Date() } },
        { applicationDeadline: null }
      ]
    })
      .populate('company', 'name logoUrl verified industry')
      .populate('organization', 'name logoUrl verified industry organizationType');

    // Format each job response
    const formattedJobs = savedJobs.map(job => formatJobResponse(job));

    res.status(200).json({
      success: true,
      data: formattedJobs
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};