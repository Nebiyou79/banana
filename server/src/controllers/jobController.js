// controllers/jobController.js - FIXED VERSION
const Job = require('../models/Job');
const Company = require('../models/Company');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all ACTIVE jobs (public)
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
      jobType
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

    if (minSalary || maxSalary) {
      query.$and = query.$and || [];
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

    res.status(200).json({
      success: true,
      data: jobs,
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

// @desc    Create job
// @route   POST /api/v1/job
// @access  Private (Company only)
exports.createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
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

    const jobData = {
      ...req.body,
      company: company._id,
      jobType: 'company',
      createdBy: userId
    };

    const job = await Job.create(jobData);
    await job.populate('company', 'name logoUrl verified industry');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    
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
      message: 'Error creating job'
    });
  }
};

// @desc    Get single job
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

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
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

    res.status(200).json({
      success: true,
      data: jobs,
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

// @desc    Update job - FIXED VERSION
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

    let job = await Job.findById(req.params.id).lean(); // Use lean() to get plain object
    
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

    // FIX: Properly compare company IDs
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

    // Use findByIdAndUpdate for better handling
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('company', 'name logoUrl verified industry');

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
};

// @desc    Delete job - FIXED VERSION
// @route   DELETE /api/v1/job/:id
// @access  Private (Company/Admin only)
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean(); // Use lean() to get plain object
    
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

    // FIX: Properly compare company IDs
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

// @desc    Get organization jobs
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

    res.status(200).json({
      success: true,
      data: jobs,
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

// @desc    Create job for organization
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

    const jobData = {
      ...req.body,
      organization: organization._id,
      jobType: 'organization',
      createdBy: userId
    };

    const job = await Job.create(jobData);
    await job.populate('organization', 'name logoUrl verified industry organizationType');

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: job
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

// @desc    Update organization job - FIXED VERSION
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

    // FIX: Properly compare organization IDs
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

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('organization', 'name logoUrl verified industry organizationType');

    res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update organization job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating opportunity'
    });
  }
};

// @desc    Delete organization job - FIXED VERSION
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

    // FIX: Properly compare organization IDs
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

// @desc    Get job categories
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
// ADD THESE FUNCTIONS TO YOUR EXISTING jobController.js

// @desc    Get jobs for candidates with advanced filtering
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

    if (minSalary || maxSalary) {
      filter.$and = filter.$and || [];
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
        .skip((page - 1) * limit)
        .lean(),
      Job.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
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

// jobController.js - ADD THESE TWO NEW FUNCTIONS

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

// @desc    Get saved jobs for candidate
// @route   GET /api/v1/job/saved
// @access  Private (Candidate)
exports.getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
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
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.savedJobs || []
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs'
    });
  }
};
// SIMPLE HELPER FUNCTIONS
function getEthiopianRegions() {
  return [
    { name: 'Addis Ababa', slug: 'addis-ababa' },
    { name: 'Amhara', slug: 'amhara' },
    { name: 'Oromia', slug: 'oromia' },
    { name: 'Tigray', slug: 'tigray' },
    { name: 'SNNPR', slug: 'snnpr' },
    { name: 'Somali', slug: 'somali' },
    { name: 'Afar', slug: 'afar' },
    { name: 'Benishangul-Gumuz', slug: 'benishangul-gumuz' },
    { name: 'Gambela', slug: 'gambela' },
    { name: 'Harari', slug: 'harari' },
    { name: 'Sidama', slug: 'sidama' },
    { name: 'South West Ethiopia', slug: 'south-west-ethiopia' },
    { name: 'Dire Dawa', slug: 'dire-dawa' },
    { name: 'International', slug: 'international' }
  ];
}