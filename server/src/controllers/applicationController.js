// backend/controllers/applicationController.js
const Application = require('../models/Application');
const Job = require('../models/Job'); // optional
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// Candidate applies to a job
exports.applyJob = asyncHandler(async (req, res, next) => {
  const candidateId = req.user.userId; // make sure this matches authMiddleware
  const { jobId, coverLetter, resumeSnapshot } = req.body;

  if (!jobId) return next(new ErrorResponse('jobId is required', 400));
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return next(new ErrorResponse('Invalid jobId format', 400));
  }

  // Prevent duplicate application
  const existing = await Application.findOne({ jobId, candidateId });
  if (existing) return next(new ErrorResponse('You have already applied to this job', 409));

  const application = await Application.create({
    jobId,
    candidate: candidateId,
    coverLetter: coverLetter || '',
    resumeSnapshot: resumeSnapshot || ''
  });

  res.status(201).json({
    success: true,
    data: application
  });
});

// Candidate fetches their own applications
exports.getUserApplications = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const applications = await Application.find({ candidate: userId })
    .populate({ path: 'jobId', select: 'title company location' })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

// Company/Admin fetches applications for a job
exports.getApplicationsForJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return next(new ErrorResponse('Invalid jobId format', 400));
  }

  const job = await Job.findById(jobId);
  if (!job) return next(new ErrorResponse('Job not found', 404));

  // Only company owner or admin can view
  if (req.user.role !== 'admin' && String(job.company) !== String(req.user.company)) {
    return next(new ErrorResponse('Not authorized to view applications for this job', 403));
  }

  const applications = await Application.find({ jobId })
    .populate({ path: 'candidate', select: 'name email profileCompleted' })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
});

// Company/Admin updates application status
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) return next(new ErrorResponse('Invalid application ID', 400));

  const validStatuses = ['applied', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected'];
  if (!status || !validStatuses.includes(status)) return next(new ErrorResponse('Invalid status', 400));

  const application = await Application.findById(id);
  if (!application) return next(new ErrorResponse('Application not found', 404));

  // Only company owner or admin can update
  const job = await Job.findById(application.jobId);
  if (req.user.role !== 'admin' && String(job.company) !== String(req.user.company)) {
    return next(new ErrorResponse('Not authorized to update this application', 403));
  }

  application.status = status;
  if (notes) application.notes = notes;
  await application.save();

  const updated = await application.populate({ path: 'candidate', select: 'name email' });
  res.status(200).json({ success: true, data: updated });
});
