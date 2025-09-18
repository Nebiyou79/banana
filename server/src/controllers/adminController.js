const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const AdminActivityLog = require('../models/AdminActivityLog'); // ADD THIS IMPORT
const SystemSettings = require('../models/SystemSettings');
const Report = require('../models/Report');
const Tender = require('../models/Tender');
const Proposal = require('../models/Proposal');

// Get dashboard statistics with advanced analytics
exports.getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalCandidates = await User.countDocuments({ role: 'candidate' });
    const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
    const totalCompanies = await User.countDocuments({ role: 'company' });
    const totalOrganizations = await User.countDocuments({ role: 'org' });
    
    // Job statistics
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'published' });
    const draftJobs = await Job.countDocuments({ status: 'draft' });
    const closedJobs = await Job.countDocuments({ status: 'closed' });
    
    // Company statistics
    const totalCompaniesRegistered = await Company.countDocuments();
    const verifiedCompanies = await Company.countDocuments({ verified: true });
    
    // Financial statistics (if you have payment integration)
    const revenue30Days = 0; // Placeholder for revenue calculation
    
    // Growth statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers30Days = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    const newJobs30Days = await Job.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    // Popular job categories
    const popularCategories = await Job.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Recent activities
    const recentActivities = await AdminActivityLog.find()
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        freelancers: totalFreelancers,
        companies: totalCompanies,
        organizations: totalOrganizations,
        newLast30Days: newUsers30Days
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        draft: draftJobs,
        closed: closedJobs,
        newLast30Days: newJobs30Days
      },
      companies: {
        total: totalCompaniesRegistered,
        verified: verifiedCompanies
      },
      financial: {
        revenueLast30Days: revenue30Days
      },
      popularCategories,
      recentActivities
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users with advanced filtering
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      dateFrom,
      dateTo,
      verified 
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (verified !== undefined) filter.verified = verified === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.headline': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(filter)
      .select('-passwordHash')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort(sortOptions);
    
    const total = await User.countDocuments(filter);
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'VIEW',
      targetModel: 'User',
      targetId: req.user._id,
      changes: { filter },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json({
      users,
      pagination: {
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow password updates through this endpoint
    if (updates.password) {
      delete updates.password;
    }
    
    const user = await User.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'UPDATE',
      targetModel: 'User',
      targetId: user._id,
      changes: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'DELETE',
      targetModel: 'User',
      targetId: user._id,
      changes: { deletedUser: user.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Bulk user actions
exports.bulkUserActions = async (req, res) => {
  try {
    const { action, userIds, data } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    
    let update = {};
    let result;
    
    switch (action) {
      case 'activate':
        update = { status: 'active' };
        break;
      case 'deactivate':
        update = { status: 'inactive' };
        break;
      case 'verify':
        update = { verified: true };
        break;
      case 'changeRole':
        if (!data || !data.role) {
          return res.status(400).json({ message: 'Role is required' });
        }
        update = { role: data.role };
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    result = await User.updateMany(
      { _id: { $in: userIds } },
      update
    );
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'BULK_UPDATE',
      targetModel: 'User',
      targetId: req.user._id,
      changes: { action, userIds, update },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json({ 
      message: `Successfully updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error with bulk user actions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all jobs (fixed version)
exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Use lean() to get plain objects and handle population separately
    const jobs = await Job.find(filter)
      .select('-applications') // Exclude heavy data if not needed
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects
    
    // If you need company information, fetch it separately
    const jobsWithCompanies = await Promise.all(
      jobs.map(async (job) => {
        if (job.companyId) {
          try {
            const company = await Company.findById(job.companyId)
              .select('name email logo')
              .lean();
            return { ...job, company };
          } catch (error) {
            console.error('Error fetching company:', error);
            return job; // Return job without company info if there's an error
          }
        }
        return job;
      })
    );
    
    const total = await Job.countDocuments(filter);
    
    res.json({
      jobs: jobsWithCompanies,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const job = await Job.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'UPDATE',
      targetModel: 'Job',
      targetId: job._id,
      changes: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'DELETE',
      targetModel: 'Job',
      targetId: job._id,
      changes: { deletedJob: job.title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get system settings
exports.getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new SystemSettings({ updatedBy: req.user._id });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update system settings
exports.updateSystemSettings = async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedBy = req.user._id;
    
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings(updates);
    } else {
      settings = await SystemSettings.findOneAndUpdate(
        {},
        updates,
        { new: true, upsert: true }
      );
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'UPDATE',
      targetModel: 'SystemSettings',
      targetId: settings._id,
      changes: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate report
exports.generateReport = async (req, res) => {
  try {
    const { type, title, filters } = req.body;
    
    let data;
    
    switch (type) {
      case 'users':
        data = await generateUserReport(filters);
        break;
      case 'jobs':
        data = await generateJobReport(filters);
        break;
      case 'financial':
        data = await generateFinancialReport(filters);
        break;
      case 'system':
        data = await generateSystemReport(filters);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    const report = new Report({
      title,
      type,
      filters,
      data,
      generatedBy: req.user._id
    });
    
    await report.save();
    
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reports = await Report.find()
      .populate('generatedBy', 'name email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await Report.countDocuments();
    
    res.json({
      reports,
      pagination: {
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions for reports
const generateUserReport = async (filters) => {
  const matchStage = {};
  
  if (filters && (filters.dateFrom || filters.dateTo)) {
    matchStage.createdAt = {};
    if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
  }
  
  if (filters && filters.role) {
    matchStage.role = filters.role;
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          role: '$role',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ];
  
  return await User.aggregate(pipeline);
};

const generateJobReport = async (filters) => {
  const matchStage = {};
  
  if (filters && (filters.dateFrom || filters.dateTo)) {
    matchStage.createdAt = {};
    if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
  }
  
  if (filters && filters.status) {
    matchStage.status = filters.status;
  }
  
  if (filters && filters.category) {
    matchStage.category = filters.category;
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          status: '$status',
          category: '$category',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ];
  
  return await Job.aggregate(pipeline);
};

const generateFinancialReport = async (filters) => {
  // Placeholder for financial data
  // This would connect to your payment system in a real implementation
  return { message: 'Financial reports will be available when payment system is integrated' };
};

const generateSystemReport = async (filters) => {
  // System performance and usage statistics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const userStats = await User.aggregate([
    {
      $facet: {
        totalUsers: [{ $count: 'count' }],
        newUsers: [{ $match: { createdAt: { $gte: thirtyDaysAgo } } }, { $count: 'count' }],
        byRole: [{ $group: { _id: '$role', count: { $sum: 1 } } }]
      }
    }
  ]);
  
  const jobStats = await Job.aggregate([
    {
      $facet: {
        totalJobs: [{ $count: 'count' }],
        newJobs: [{ $match: { createdAt: { $gte: thirtyDaysAgo } } }, { $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }]
      }
    }
  ]);
  
  return {
    userStats: userStats[0],
    jobStats: jobStats[0],
    generatedAt: new Date()
  };
};

// Get platform analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalFreelancers,
      totalTenders,
      totalProposals,
      activeTenders,
      completedTenders,
      pendingVerifications,
      recentSignups
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'freelancer' }),
      Tender.countDocuments(),
      Proposal.countDocuments(),
      Tender.countDocuments({ status: 'open' }),
      Tender.countDocuments({ status: 'awarded' }),
      User.countDocuments({ 'freelancerProfile.verification.status': 'pending' }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt')
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          companies: totalCompanies,
          freelancers: totalFreelancers,
          recentSignups
        },
        tenders: {
          total: totalTenders,
          active: activeTenders,
          completed: completedTenders
        },
        proposals: {
          total: totalProposals
        },
        verifications: {
          pending: pendingVerifications
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all users with filtering and pagination
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      verificationStatus
    } = req.query;

    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (verificationStatus) filter['freelancerProfile.verification.status'] = verificationStatus;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('company', 'name industry')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user status (suspend/ban/activate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, suspensionReason, suspensionEnds } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    if (suspensionReason) user.suspensionReason = suspensionReason;
    if (suspensionEnds) user.suspensionEnds = new Date(suspensionEnds);

    await user.save();

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all tenders for moderation
exports.getAllTenders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tenders = await Tender.find(filter)
      .populate('company', 'name industry')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Tender.countDocuments(filter);

    res.json({
      success: true,
      data: tenders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Moderate tender (mark as inappropriate)
exports.moderateTender = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const tender = await Tender.findById(id);
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    if (action === 'flag') {
      tender.moderated = true;
      tender.moderationReason = reason;
      tender.status = 'closed';
    } else if (action === 'approve') {
      tender.moderated = false;
      tender.moderationReason = null;
    }

    await tender.save();

    res.json({
      success: true,
      message: `Tender ${action === 'flag' ? 'flagged' : 'approved'} successfully`,
      data: tender
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all proposals for monitoring
exports.getAllProposals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { 'freelancerId.name': { $regex: search, $options: 'i' } },
        { proposalText: { $regex: search, $options: 'i' } }
      ];
    }

    const proposals = await Proposal.find(filter)
      .populate('freelancerId', 'name email avatar')
      .populate('tenderId', 'title budget')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Proposal.countDocuments(filter);

    res.json({
      success: true,
      data: proposals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};