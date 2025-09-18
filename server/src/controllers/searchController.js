// controllers/searchController.js
const Job = require('../models/Job');
const Company = require('../models/Company');

// @desc    Search jobs with advanced filtering
// @route   GET /api/search/jobs
// @access  Public
exports.searchJobs = async (req, res, next) => {
  try {
    const {
      query,
      location,
      skills,
      type,
      category,
      remote,
      experienceLevel,
      minSalary,
      maxSalary,
      page = 1,
      limit = 12
    } = req.query;

    // Build search query
    const searchQuery = { status: 'active' };

    // Text search across multiple fields
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { requirements: { $in: [new RegExp(query, 'i')] } },
        { skills: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    // Location filter
    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }

    // Skills filter (comma-separated)
    if (skills) {
      const skillsArray = skills.split(',').map(skill => new RegExp(skill.trim(), 'i'));
      searchQuery.skills = { $in: skillsArray };
    }

    // Job type filter
    if (type) {
      searchQuery.type = type;
    }

    // Category filter
    if (category) {
      searchQuery.category = { $regex: category, $options: 'i' };
    }

    // Remote filter
    if (remote !== undefined) {
      searchQuery.remote = remote === 'true';
    }

    // Experience level filter
    if (experienceLevel) {
      searchQuery.experienceLevel = experienceLevel;
    }

    // Salary range filter
    if (minSalary || maxSalary) {
      searchQuery.$and = [];
      
      if (minSalary) {
        searchQuery.$and.push({
          $or: [
            { 'salary.max': { $gte: Number(minSalary) } },
            { 'salary.min': { $gte: Number(minSalary) } }
          ]
        });
      }
      
      if (maxSalary) {
        searchQuery.$and.push({
          $or: [
            { 'salary.min': { $lte: Number(maxSalary) } },
            { 'salary.max': { $lte: Number(maxSalary) } }
          ]
        });
      }

      // If no salary range conditions, remove the $and array
      if (searchQuery.$and.length === 0) {
        delete searchQuery.$and;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with filters
    const jobs = await Job.find(searchQuery)
      .populate('company', 'name logoUrl verified industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Job.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
};