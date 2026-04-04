const JobTemplate = require('../models/JobTemplate');
const Job = require('../models/Job');
const AdminActivityLog = require('../models/AdminActivityLog');

// Get all job templates with filtering
exports.getJobTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, isActive } = req.query;
    
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const templates = await JobTemplate.find(filter)
      .populate('createdBy', 'name email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await JobTemplate.countDocuments(filter);
    
    res.json({
      templates,
      pagination: {
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting job templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await JobTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new template
exports.createJobTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    templateData.createdBy = req.user._id;
    
    const template = new JobTemplate(templateData);
    await template.save();
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'CREATE',
      targetModel: 'JobTemplate',
      targetId: template._id,
      changes: templateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating job template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update template
exports.updateJobTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const template = await JobTemplate.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'UPDATE',
      targetModel: 'JobTemplate',
      targetId: template._id,
      changes: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json(template);
  } catch (error) {
    console.error('Error updating job template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete template
exports.deleteJobTemplate = async (req, res) => {
  try {
    const template = await JobTemplate.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'DELETE',
      targetModel: 'JobTemplate',
      targetId: template._id,
      changes: { deletedTemplate: template.title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting job template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create job from template
exports.createJobFromTemplate = async (req, res) => {
  try {
    const { templateId, modifications, companyId, publish } = req.body;
    
    const template = await JobTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Create job based on template with modifications
    const jobData = {
      ...template.toObject(),
      ...modifications,
      _id: undefined,
      templateId: template._id,
      companyId: companyId || null,
      createdBy: req.user._id,
      createdAt: new Date(),
      status: publish ? 'published' : 'draft'
    };
    
    const job = new Job(jobData);
    await job.save();
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'CREATE',
      targetModel: 'Job',
      targetId: job._id,
      changes: { fromTemplate: templateId, modifications, publish },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job from template:', error);
    res.status(500).json({ message: 'Error creating job from template', error: error.message });
  }
};

// Duplicate template
exports.duplicateTemplate = async (req, res) => {
  try {
    const template = await JobTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const newTemplate = new JobTemplate({
      ...template.toObject(),
      _id: undefined,
      title: `${template.title} (Copy)`,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newTemplate.save();
    
    // Log this activity
    const activityLog = new AdminActivityLog({
      adminId: req.user._id,
      action: 'CREATE',
      targetModel: 'JobTemplate',
      targetId: newTemplate._id,
      changes: { duplicatedFrom: template._id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await activityLog.save();
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ message: 'Error duplicating template', error: error.message });
  }
};

// Export templates
exports.exportTemplates = async (req, res) => {
  try {
    const templates = await JobTemplate.find().populate('createdBy', 'name email');
    
    // Convert to CSV format
    const csvData = templates.map(template => ({
      Title: template.title,
      Description: template.description,
      Requirements: template.requirements.join('; '),
      'Min Salary': template.salaryRange.min,
      'Max Salary': template.salaryRange.max,
      Currency: template.salaryRange.currency,
      Location: template.location,
      Category: template.category,
      Tags: template.tags.join(', '),
      Active: template.isActive,
      'Created By': template.createdBy.name,
      'Created At': template.createdAt
    }));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=job-templates.csv');
    
    // Simple CSV conversion
    const header = Object.keys(csvData[0]).join(',') + '\n';
    const rows = csvData.map(obj => 
      Object.values(obj).map(val => 
        `"${String(val).replace(/"/g, '""')}"`
      ).join(',')
    ).join('\n');
    
    res.send(header + rows);
  } catch (error) {
    console.error('Error exporting templates:', error);
    res.status(500).json({ message: 'Error exporting templates', error: error.message });
  }
};