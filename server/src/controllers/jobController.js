const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get all jobs (public)
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      type,
      category,
      remote,
      experienceLevel
    } = req.query;

    const query = { status: 'active' };

    // Build search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (location) query.location = { $regex: location, $options: 'i' };
    if (type) query.type = type;
    if (category) query.category = { $regex: category, $options: 'i' };
    if (remote !== undefined) query.remote = remote === 'true';
    if (experienceLevel) query.experienceLevel = experienceLevel;

    const jobs = await Job.find(query)
      .populate('company', 'name logoUrl verified industry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logoUrl description website industry verified')
      .populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get company's jobs
// @route   GET /api/jobs/company/my-jobs
// @access  Private
exports.getCompanyJobs = async (req, res, next) => {
  try {
    console.log('User making request:', req.user);
    
    // Use req.user.userId (from JWT) or req.user._id (from database)
    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found'
      });
    }

    const jobs = await Job.find({ company: company._id })
      .populate('company', 'name logoUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create job
// @route   POST /api/jobs
// @access  Private (Company only)
exports.createJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Only companies can create jobs'
      });
    }

    // Use req.user.userId (from JWT) or req.user._id (from database)
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
      createdBy: userId
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Use req.user.userId (from JWT) or req.user._id (from database)
    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });
    
    // Check if user owns the job or is admin
    if (job.company.toString() !== company._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Use req.user.userId (from JWT) or req.user._id (from database)
    const userId = req.user.userId || req.user._id;
    const company = await Company.findOne({ user: userId });
    
    // Check if user owns the job or is admin
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
      message: 'Server error'
    });
  }
};
exports.getPublicJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      location,
      remote,
      experienceLevel,
      category
    } = req.query;

    const query = { status: 'active' };
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Other filters
    if (type) query.type = type;
    if (location) query.location = new RegExp(location, 'i');
    if (remote !== undefined) query.remote = remote === 'true';
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (category) query.category = category;

    const jobs = await Job.find(query)
      .populate('company', 'name logoUrl verified industry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total
      }
    });
  } catch (error) {
    console.error('Get public jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Save job
exports.saveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedJobs: req.params.id } },
      { new: true }
    );

    res.json({ success: true, message: 'Job saved successfully' });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Unsave job
exports.unsaveJob = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedJobs: req.params.id } },
      { new: true }
    );

    res.json({ success: true, message: 'Job unsaved successfully' });
  } catch (error) {
    console.error('Unsave job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get saved jobs
exports.getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedJobs',
        populate: { path: 'company', select: 'name logoUrl verified industry' }
      });

    res.json({ success: true, data: user.savedJobs || [] });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Apply to job
exports.applyToJob = async (req, res) => {
  try {
    const { coverLetter, proposal, bidAmount } = req.body;
    const jobId = req.params.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = job.applications.find(
      app => app.freelancer.toString() === req.user._id.toString()
    );

    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }

    // Add application
    job.applications.push({
      freelancer: req.user._id,
      coverLetter,
      proposal,
      bidAmount,
      status: 'submitted'
    });

    await job.save();

    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};