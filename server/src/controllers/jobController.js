// controllers/jobController.js
const Job = require('../models/Job');
const Company = require('../models/Company');
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
      maxSalary
    } = req.query;

    // SIMPLE QUERY: Only show active jobs
    const query = { status: 'active' };

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filters
    if (region) query['location.region'] = region;
    if (category) query.category = category;
    if (type) query.type = type;
    if (experienceLevel) query.experienceLevel = experienceLevel;

    // Salary filter
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

// @desc    Create job (simple - no approval needed)
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

    // SIMPLE: Use the data as provided
    const jobData = {
      ...req.body,
      company: company._id,
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
      .populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views
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
    
    const query = { company: company._id };
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

// @desc    Update job
// @route   PUT /api/v1/job/:id
// @access  Private (Company/Admin only)
// In your jobController.js - update the updateJob function
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

    let job = await Job.findById(req.params.id);
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

    if (job.company.toString() !== company._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    // FIX: Use updateOne instead of findByIdAndUpdate to handle nested objects properly
    await Job.updateOne({ _id: req.params.id }, { $set: req.body });
    
    // Get the updated job
    job = await Job.findById(req.params.id)
      .populate('company', 'name logoUrl verified industry');

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/v1/job/:id
// @access  Private (Company/Admin only)
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
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

    if (job.company.toString() !== company._id.toString() && req.user.role !== 'admin') {
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
// @desc    Get organization jobs
// @route   GET /api/v1/job/organization/my-jobs
// @access  Private (Organization only)
exports.getOrganizationJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    // Find organization by user ID
    const organization = await Company.findOne({ 
      user: userId, 
      $or: [
        { 'user.role': 'organization' },
        { 'role': 'organization' }
      ]
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    const { page = 1, limit = 12, status } = req.query;
    
    const query = { company: organization._id };
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
    console.error('Get organization jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organization jobs'
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
    const organization = await Company.findOne({ 
      user: userId,
      $or: [
        { 'user.role': 'organization' },
        { 'role': 'organization' }
      ]
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    // Add organization-specific fields or modifications
    const jobData = {
      ...req.body,
      company: organization._id,
      createdBy: userId,
      // You can add organization-specific fields here if needed
      // For example: opportunityType, projectDuration, etc.
    };

    const job = await Job.create(jobData);
    await job.populate('company', 'name logoUrl verified industry');

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

// @desc    Update organization job
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

    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    const organization = await Company.findOne({ 
      user: userId,
      $or: [
        { 'user.role': 'organization' },
        { 'role': 'organization' }
      ]
    });
    
    if (!organization && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    if (job.company.toString() !== organization._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this opportunity'
      });
    }

    await Job.updateOne({ _id: req.params.id }, { $set: req.body });
    
    // Get the updated job
    job = await Job.findById(req.params.id)
      .populate('company', 'name logoUrl verified industry');

    res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update organization job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating opportunity'
    });
  }
};

// @desc    Delete organization job
// @route   DELETE /api/v1/job/organization/:id
// @access  Private (Organization/Admin only)
exports.deleteOrganizationJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    const userId = req.user.userId || req.user._id;
    const organization = await Company.findOne({ 
      user: userId,
      $or: [
        { 'user.role': 'organization' },
        { 'role': 'organization' }
      ]
    });
    
    if (!organization && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Organization profile not found'
      });
    }

    if (job.company.toString() !== organization._id.toString() && req.user.role !== 'admin') {
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