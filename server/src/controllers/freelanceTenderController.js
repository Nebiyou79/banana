// src/freelance/freelanceTenderController.js
const FreelanceTender = require('../models/FreelanceTender');
const Company = require('../models/Company');
const User = require('../models/User');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');

// ========== HELPERS ==========

function buildDownloadUrl(req, tenderId, attachmentId) {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/api/v1/freelance-tenders/${tenderId}/attachments/${attachmentId}/download`;
}

function buildPreviewUrl(req, tenderId, attachmentId) {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/api/v1/freelance-tenders/${tenderId}/attachments/${attachmentId}/preview`;
}

function mapUploadedFiles(files, userId, tenderId, documentType = 'other', description = '') {
    return files.map(file => {
        const fileHash = crypto.createHash('md5')
            .update(file.path + Date.now())
            .digest('hex');

        return {
            originalName: file.originalName,
            fileName: file.fileName || file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
            url: file.url,
            downloadUrl: file.url,
            fileHash,
            uploadedBy: userId,
            documentType,
            description
        };
    });
}

async function backfillAttachmentUrls(tender, req) {
    let changed = false;
    tender.attachments.forEach(att => {
        const correctUrl = buildDownloadUrl(req, tender._id.toString(), att._id.toString());
        if (att.downloadUrl !== correctUrl) {
            att.downloadUrl = correctUrl;
            changed = true;
        }
    });
    if (changed) {
        await tender.save();
    }
    return tender;
}

// ========== 1. getCategories ==========
exports.getCategories = async (req, res) => {
    try {
        const categories = FreelanceTender.getCategories();
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

// ========== 2. createFreelanceTender ==========
exports.createFreelanceTender = async (req, res) => {
    try {
        const { role, _id } = req.user;

        if (!['company', 'organization'].includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Only companies and organizations can create freelance tenders'
            });
        }

        const { title, description, procurementCategory, deadline, details } = req.body;

        if (!title || !description || !procurementCategory || !deadline || !details) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, procurementCategory, deadline, details'
            });
        }

        // Parse details JSON string (sent as FormData)
        let detailsObj = details;
        if (typeof details === 'string') {
            try {
                detailsObj = JSON.parse(details);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid details format: must be a valid JSON object'
                });
            }
        }

        // Validate engagementType is present and a valid schema value
        if (!detailsObj.engagementType) {
            return res.status(400).json({
                success: false,
                message: 'engagementType is required in details'
            });
        }

        const validEngagementTypes = ['fixed_price', 'hourly', 'fixed_salary', 'negotiable'];
        if (!validEngagementTypes.includes(detailsObj.engagementType)) {
            return res.status(400).json({
                success: false,
                message: `engagementType must be one of: ${validEngagementTypes.join(', ')}`
            });
        }

        // FIX: Validate engagement-specific requirements
        if (detailsObj.engagementType === 'fixed_price') {
            if (!detailsObj.budget || detailsObj.budget.min == null || detailsObj.budget.max == null) {
                return res.status(400).json({
                    success: false,
                    message: 'Fixed-price tenders require budget.min and budget.max'
                });
            }
            if (Number(detailsObj.budget.max) < Number(detailsObj.budget.min)) {
                return res.status(400).json({
                    success: false,
                    message: 'budget.max must be greater than or equal to budget.min'
                });
            }
            detailsObj.budget = {
                min: Number(detailsObj.budget.min),
                max: Number(detailsObj.budget.max),
                currency: detailsObj.budget.currency || 'ETB'
            };
            // Clear any salaryRange data
            detailsObj.salaryRange = undefined;
            detailsObj.isNegotiable = false;
        } 
        else if (detailsObj.engagementType === 'hourly') {
            if (detailsObj.weeklyHours !== undefined && Number(detailsObj.weeklyHours) < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'weeklyHours must be at least 1'
                });
            }
            // Clear salary-related fields
            detailsObj.salaryRange = undefined;
            detailsObj.isNegotiable = false;
        }
        else if (detailsObj.engagementType === 'fixed_salary') {
            // FIX: Validate salaryRange for fixed_salary
            if (!detailsObj.salaryRange || detailsObj.salaryRange.min == null || detailsObj.salaryRange.max == null) {
                return res.status(400).json({
                    success: false,
                    message: 'Fixed salary tenders require salaryRange.min and salaryRange.max'
                });
            }
            if (Number(detailsObj.salaryRange.max) < Number(detailsObj.salaryRange.min)) {
                return res.status(400).json({
                    success: false,
                    message: 'salaryRange.max must be greater than or equal to salaryRange.min'
                });
            }
            detailsObj.salaryRange = {
                min: Number(detailsObj.salaryRange.min),
                max: Number(detailsObj.salaryRange.max),
                currency: detailsObj.salaryRange.currency || 'ETB',
                period: detailsObj.salaryRange.period || 'monthly'
            };
            // Clear budget data
            detailsObj.budget = undefined;
            detailsObj.isNegotiable = false;
        }
        else if (detailsObj.engagementType === 'negotiable') {
            // FIX: Set isNegotiable flag for negotiable type
            detailsObj.isNegotiable = true;
            // Clear other financial fields
            detailsObj.budget = undefined;
            detailsObj.salaryRange = undefined;
        }

        // Handle screening questions
        if (detailsObj.screeningQuestions) {
            detailsObj.screeningQuestions = detailsObj.screeningQuestions.map(q => {
                if (typeof q === 'string') {
                    return { question: q, required: false };
                }
                return {
                    question: q.question || q.text || '',
                    required: Boolean(q.required)
                };
            }).filter(q => q.question.trim() !== '');
        }

        // Validate projectType
        if (detailsObj.projectType) {
            const validProjectTypes = ['one_time', 'ongoing', 'complex'];
            if (!validProjectTypes.includes(detailsObj.projectType)) {
                return res.status(400).json({
                    success: false,
                    message: `projectType must be one of: ${validProjectTypes.join(', ')}`
                });
            }
        }

        // Find owner entity
        let ownerEntity = null;
        let ownerEntityModel = null;

        if (role === 'company') {
            ownerEntity = await Company.findOne({ user: _id });
            ownerEntityModel = 'Company';
        } else if (role === 'organization') {
            ownerEntity = await Organization.findOne({ user: _id });
            ownerEntityModel = 'Organization';
        }

        if (!ownerEntity) {
            return res.status(400).json({
                success: false,
                message: `No ${role} profile found for this user`
            });
        }

        const tenderData = {
            title,
            description,
            briefDescription: req.body.briefDescription || '',
            procurementCategory,
            deadline: new Date(deadline),
            owner: _id,
            ownerRole: role,
            ownerEntity: ownerEntity._id,
            ownerEntityModel,
            details: detailsObj,
            status: req.body.status || 'draft',
            ...(req.body.maxApplications ? { maxApplications: Number(req.body.maxApplications) } : {})
        };

        // Parse skillsRequired
        if (req.body.skillsRequired) {
            tenderData.skillsRequired = Array.isArray(req.body.skillsRequired)
                ? req.body.skillsRequired
                : req.body.skillsRequired.split(',').map(s => s.trim()).filter(Boolean);
        }

        // Handle file uploads
        if (req.uploadedFiles?.files?.length > 0) {
            tenderData.attachments = mapUploadedFiles(
                req.uploadedFiles.files,
                _id,
                null,
                req.body.documentType || 'other'
            );
        }

        // Create and save tender
        const tender = new FreelanceTender(tenderData);
        await tender.save();

        // Backfill attachment URLs
        await backfillAttachmentUrls(tender, req);

        // Audit log
        await tender.addAuditLog('CREATE_FREELANCE_TENDER', _id, {
            title: tender.title,
            status: tender.status,
            engagementType: tender.details.engagementType
        }, req.ip, req.get('User-Agent'));

        await tender.populate('owner', 'name email');

        res.status(201).json({
            success: true,
            data: tender,
            message: 'Freelance tender created successfully'
        });

    } catch (error) {
        console.error('Error in createFreelanceTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create freelance tender',
            error: error.message
        });
    }
};

// ========== 3. getFreelanceTenders (browse — freelancers only) ==========
exports.getFreelanceTenders = async (req, res) => {
    try {
        const { role, _id } = req.user;

        if (role !== 'freelancer' && role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only freelancers can browse freelance tenders'
            });
        }

        const filter = {
            owner: { $ne: _id },
            status: 'published',
            deadline: { $gt: new Date() },
            isDeleted: false
        };

        const {
            search, procurementCategory, engagementType, minBudget, maxBudget,
            experienceLevel, urgency, projectType, locationType, skills,
            page = 1, limit = 15, sortBy = 'createdAt', sortOrder = 'desc'
        } = req.query;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { briefDescription: { $regex: search, $options: 'i' } },
                { skillsRequired: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        if (procurementCategory) filter.procurementCategory = procurementCategory;
        if (engagementType) filter['details.engagementType'] = engagementType;
        if (minBudget) {
            filter.$or = filter.$or || [];
            filter.$or.push(
                { 'details.budget.min': { $gte: Number(minBudget) } },
                { 'details.salaryRange.min': { $gte: Number(minBudget) } }
            );
        }
        if (maxBudget) {
            filter.$or = filter.$or || [];
            filter.$or.push(
                { 'details.budget.max': { $lte: Number(maxBudget) } },
                { 'details.salaryRange.max': { $lte: Number(maxBudget) } }
            );
        }
        if (experienceLevel) filter['details.experienceLevel'] = experienceLevel;
        if (urgency) filter['details.urgency'] = urgency;
        if (projectType) filter['details.projectType'] = projectType;
        if (locationType) filter['details.locationType'] = locationType;

        if (skills) {
            const skillsArray = skills.split(',').map(s => new RegExp(s.trim(), 'i'));
            filter.skillsRequired = { $in: skillsArray };
        }

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tenders = await FreelanceTender.find(filter)
            .select('-applications')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate({ path: 'owner', select: 'name email' })
            .populate({ path: 'ownerEntity', select: 'name logo headline' });

        const safeTenders = tenders.filter(t => t != null);
        const total = await FreelanceTender.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                tenders: safeTenders,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('Error in getFreelanceTenders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch freelance tenders',
            error: error.message
        });
    }
};

// ========== 4. getFreelanceTender (single tender by :id) ==========
exports.getFreelanceTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        // Increment views (non-blocking)
        FreelanceTender.updateOne(
            { _id: id },
            { $inc: { 'metadata.views': 1 } }
        ).catch(err => console.error('Failed to increment views:', err));

        const isOwner = tender.owner.toString() === userId.toString();

        if (isOwner) {
            await tender.populate([
                { path: 'applications.applicant', select: '_id name email avatar' },
                { path: 'owner', select: '_id name email' },
                { path: 'ownerEntity', select: 'name logo headline' }
            ]);

            return res.status(200).json({
                success: true,
                data: tender,
                isOwner: true
            });
        }

        // Freelancer view — no applications
        const tenderWithoutApps = await FreelanceTender.findById(id)
            .select('-applications')
            .populate('owner', 'name email')
            .populate('ownerEntity', 'name logo headline');

        if (!tenderWithoutApps) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        // Check if this freelancer has already applied
        const fullTender = await FreelanceTender.findById(id).select('applications');
        const myApplication = fullTender?.applications?.find(
            app => app.applicant.toString() === userId.toString()
        ) || null;

        res.status(200).json({
            success: true,
            data: tenderWithoutApps,
            myApplication: myApplication ? {
                _id: myApplication._id,
                status: myApplication.status,
                submittedAt: myApplication.submittedAt,
                proposedRate: myApplication.proposedRate,
                coverLetter: myApplication.coverLetter
            } : null,
            isOwner: false
        });

    } catch (error) {
        console.error('Error in getFreelanceTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch freelance tender',
            error: error.message
        });
    }
};

// ========== 5. updateFreelanceTender ==========
exports.updateFreelanceTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this tender'
            });
        }

        const changes = {};

        const updatableFields = [
            'title', 'description', 'briefDescription', 'procurementCategory',
            'skillsRequired', 'deadline', 'details', 'maxApplications'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] === undefined) return;

            if (field === 'details' && typeof req.body[field] === 'string') {
                try {
                    let parsed = JSON.parse(req.body[field]);

                    // Re-apply engagement validation on update
                    if (parsed.engagementType === 'fixed_price' && parsed.budget) {
                        parsed.budget = {
                            min: Number(parsed.budget.min),
                            max: Number(parsed.budget.max),
                            currency: parsed.budget.currency || 'ETB'
                        };
                        // Clear other financial fields
                        parsed.salaryRange = undefined;
                        parsed.isNegotiable = false;
                    } else if (parsed.engagementType === 'fixed_salary' && parsed.salaryRange) {
                        parsed.salaryRange = {
                            min: Number(parsed.salaryRange.min),
                            max: Number(parsed.salaryRange.max),
                            currency: parsed.salaryRange.currency || 'ETB',
                            period: parsed.salaryRange.period || 'monthly'
                        };
                        // Clear other financial fields
                        parsed.budget = undefined;
                        parsed.isNegotiable = false;
                    } else if (parsed.engagementType === 'negotiable') {
                        parsed.isNegotiable = true;
                        parsed.budget = undefined;
                        parsed.salaryRange = undefined;
                    } else if (parsed.engagementType === 'hourly') {
                        parsed.budget = undefined;
                        parsed.salaryRange = undefined;
                        parsed.isNegotiable = false;
                    }

                    // Coerce screeningQuestions shape
                    if (parsed.screeningQuestions) {
                        parsed.screeningQuestions = parsed.screeningQuestions.map(q => {
                            if (typeof q === 'string') return { question: q, required: false };
                            return {
                                question: q.question || q.text || '',
                                required: Boolean(q.required)
                            };
                        }).filter(q => q.question.trim() !== '');
                    }

                    tender[field] = parsed;
                    changes[field] = 'updated';
                } catch (e) {
                    // Keep existing value if parse fails
                }
            } else if (field === 'skillsRequired' && typeof req.body[field] === 'string') {
                tender[field] = req.body[field].split(',').map(s => s.trim()).filter(Boolean);
                changes[field] = 'updated';
            } else if (field === 'maxApplications') {
                tender[field] = Number(req.body[field]);
                changes[field] = 'updated';
            } else {
                const oldValue = tender[field];
                tender[field] = req.body[field];
                if (JSON.stringify(oldValue) !== JSON.stringify(req.body[field])) {
                    changes[field] = { old: oldValue, new: req.body[field] };
                }
            }
        });

        // Handle new file uploads
        if (req.uploadedFiles?.files?.length > 0) {
            const newAttachments = mapUploadedFiles(
                req.uploadedFiles.files,
                userId,
                id,
                req.body.documentType || 'other'
            );
            tender.attachments.push(...newAttachments);
            changes.attachmentsAdded = newAttachments.length;
        }

        // Update metadata
        tender.metadata.updateCount = (tender.metadata.updateCount || 0) + 1;
        tender.metadata.lastUpdatedAt = new Date();
        tender.metadata.lastUpdatedBy = userId;

        await tender.save();

        // Backfill downloadUrl for any new attachments
        await backfillAttachmentUrls(tender, req);

        await tender.addAuditLog('UPDATE_FREELANCE_TENDER', userId, changes, req.ip, req.get('User-Agent'));
        await tender.populate('owner', 'name email');

        res.status(200).json({
            success: true,
            data: tender,
            message: 'Freelance tender updated successfully'
        });

    } catch (error) {
        console.error('Error in updateFreelanceTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update freelance tender',
            error: error.message
        });
    }
};

// ========== 6. deleteFreelanceTender ==========
exports.deleteFreelanceTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this tender'
            });
        }

        // Notify awarded freelancers (non-blocking)
        const awardedApplications = tender.applications.filter(app => app.status === 'awarded');
        awardedApplications.forEach(async (app) => {
            try {
                const freelancer = await User.findById(app.applicant);
                if (freelancer?.email) {
                    console.log(`Would email ${freelancer.email} about tender deletion`);
                }
            } catch (emailError) {
                console.error('Failed to send deletion email:', emailError);
            }
        });

        // Soft delete
        tender.isDeleted = true;
        tender.deletedAt = new Date();
        tender.deletedBy = userId;
        await tender.save();

        await tender.addAuditLog('DELETE_FREELANCE_TENDER', userId, {
            title: tender.title,
            status: tender.status,
            hadAwardedApplications: awardedApplications.length > 0
        }, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            message: 'Freelance tender deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteFreelanceTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete freelance tender',
            error: error.message
        });
    }
};

// ========== 7. publishFreelanceTender ==========
exports.publishFreelanceTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to publish this tender'
            });
        }

        if (tender.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: `Cannot publish tender with status: ${tender.status}`
            });
        }

        // Validate all required fields before publish
        const validationErrors = [];
        if (!tender.title) validationErrors.push('title');
        if (!tender.description) validationErrors.push('description');
        if (!tender.procurementCategory) validationErrors.push('procurementCategory');
        if (!tender.deadline || tender.deadline <= new Date()) {
            validationErrors.push('deadline must be in the future');
        }
        if (!tender.details?.engagementType) {
            validationErrors.push('details.engagementType');
        }

        // Validate engagement-specific fields
        if (tender.details.engagementType === 'fixed_price') {
            if (!tender.details.budget?.min || !tender.details.budget?.max) {
                validationErrors.push('budget.min and budget.max required for fixed price');
            }
        } else if (tender.details.engagementType === 'fixed_salary') {
            if (!tender.details.salaryRange?.min || !tender.details.salaryRange?.max) {
                validationErrors.push('salaryRange.min and salaryRange.max required for fixed salary');
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot publish: missing required fields',
                missingFields: validationErrors
            });
        }

        tender.status = 'published';
        tender.publishedAt = new Date();
        await tender.save();

        await tender.addAuditLog('PUBLISH_FREELANCE_TENDER', userId, {
            previousStatus: 'draft',
            newStatus: 'published'
        }, req.ip, req.get('User-Agent'));

        await tender.populate('owner', 'name email');

        res.status(200).json({
            success: true,
            data: tender,
            message: 'Freelance tender published successfully'
        });

    } catch (error) {
        console.error('Error in publishFreelanceTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish freelance tender',
            error: error.message
        });
    }
};

// ========== 8. submitApplication ==========
exports.submitApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (req.user.role !== 'freelancer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only freelancers can apply to freelance tenders'
            });
        }

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (!tender.canUserApply(req.user)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot apply to this tender. It may be expired, not published, closed to new applications, or you have already applied.'
            });
        }

        const { coverLetter, proposedRate, proposedRateCurrency, estimatedTimeline, portfolioLinks, screeningAnswers } = req.body;

        if (!coverLetter) {
            return res.status(400).json({ success: false, message: 'Cover letter is required' });
        }

        if (!proposedRate) {
            return res.status(400).json({ success: false, message: 'Proposed rate is required' });
        }

        const application = {
            applicant: userId,
            coverLetter,
            proposedRate: Number(proposedRate),
            proposedRateCurrency: proposedRateCurrency || 'ETB',
            submittedAt: new Date()
        };

        if (estimatedTimeline) {
            application.estimatedTimeline = typeof estimatedTimeline === 'string'
                ? JSON.parse(estimatedTimeline)
                : estimatedTimeline;
        }

        if (portfolioLinks) {
            application.portfolioLinks = Array.isArray(portfolioLinks)
                ? portfolioLinks
                : portfolioLinks.split(',').map(s => s.trim());
        }

        if (screeningAnswers) {
            application.screeningAnswers = typeof screeningAnswers === 'string'
                ? JSON.parse(screeningAnswers)
                : screeningAnswers;
        }

        if (req.uploadedFiles?.files?.length > 0) {
            const cvFile = req.uploadedFiles.files[0];
            application.cvPath = cvFile.path;
            application.cvFileName = cvFile.fileName || cvFile.filename;
            application.cvOriginalName = cvFile.originalName;
        }

        tender.applications.push(application);
        await tender.save();

        const newApp = tender.applications[tender.applications.length - 1];

        await tender.addAuditLog('SUBMIT_APPLICATION', userId, {
            applicationId: newApp._id,
            tenderTitle: tender.title
        }, req.ip, req.get('User-Agent'));

        res.status(201).json({
            success: true,
            data: newApp,
            message: 'Application submitted successfully'
        });

    } catch (error) {
        console.error('Error in submitApplication:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    }
};

// ========== 9. getTenderApplications ==========
exports.getTenderApplications = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { status, page = 1, limit = 20 } = req.query;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view applications'
            });
        }

        let applications = tender.applications;
        if (status) {
            applications = applications.filter(app => app.status === status);
        }

        applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const paginatedApps = applications.slice(skip, skip + limitNum);

        const applicantIds = paginatedApps.map(app => app.applicant);
        const applicants = await User.find({ _id: { $in: applicantIds } })
            .select('_id name email avatar');

        const applicantMap = {};
        applicants.forEach(user => {
            applicantMap[user._id.toString()] = user;
        });

        const appsWithUser = paginatedApps.map(app => {
            const appObj = app.toObject();
            appObj.applicant = applicantMap[app.applicant.toString()] || app.applicant;
            return appObj;
        });

        res.status(200).json({
            success: true,
            data: {
                applications: appsWithUser,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: applications.length,
                    totalPages: Math.ceil(applications.length / limitNum)
                },
                summary: {
                    total: tender.applications.length,
                    byStatus: {
                        submitted: tender.applications.filter(a => a.status === 'submitted').length,
                        under_review: tender.applications.filter(a => a.status === 'under_review').length,
                        shortlisted: tender.applications.filter(a => a.status === 'shortlisted').length,
                        awarded: tender.applications.filter(a => a.status === 'awarded').length,
                        rejected: tender.applications.filter(a => a.status === 'rejected').length
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error in getTenderApplications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// ========== 10. updateApplicationStatus ==========
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id, appId } = req.params;
        const userId = req.user._id;
        const { status, notes } = req.body;

        const validStatuses = ['submitted', 'under_review', 'shortlisted', 'awarded', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update applications'
            });
        }

        const application = tender.applications.id(appId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const previousStatus = application.status;
        application.status = status;
        application.reviewedAt = new Date();
        if (notes) {
            application.ownerNotes = notes;
        }

        // Auto-reject other applications when awarding a single-position tender
        if (status === 'awarded' && tender.details.numberOfPositions === 1) {
            tender.applications.forEach(app => {
                if (app._id.toString() !== appId) {
                    app.status = 'rejected';
                }
            });
        }

        await tender.save();

        // Email notification (non-blocking)
        try {
            const applicant = await User.findById(application.applicant);
            if (applicant?.email) {
                console.log(`Status update email would be sent to ${applicant.email}: ${status}`);
            }
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError);
        }

        await tender.addAuditLog('APPLICATION_STATUS_UPDATE', userId, {
            applicationId: appId,
            previousStatus,
            newStatus: status,
            applicantId: application.applicant
        }, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            data: application,
            message: `Application status updated to ${status}`
        });

    } catch (error) {
        console.error('Error in updateApplicationStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status',
            error: error.message
        });
    }
};

// ========== 11. getMyPostedTenders ==========
exports.getMyPostedTenders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, page = 1, limit = 15, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = {
            owner: userId,
            isDeleted: false
        };

        if (status) filter.status = status;

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tenders = await FreelanceTender.find(filter)
            .select('-applications')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email');

        const tendersWithCounts = tenders.map(tender => {
            const tenderObj = tender.toObject();
            tenderObj.applicationCount = tender.metadata?.totalApplications || 0;
            tenderObj.savedCount = tender.metadata?.savedBy?.length || 0;
            return tenderObj;
        });

        const total = await FreelanceTender.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                tenders: tendersWithCounts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('Error in getMyPostedTenders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your posted tenders',
            error: error.message
        });
    }
};

// ========== 12. toggleSaveFreelanceTender ==========
exports.toggleSaveFreelanceTender = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (req.user.role !== 'freelancer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only freelancers can save freelance tenders'
            });
        }

        const tender = await FreelanceTender.findOne({
            _id: id,
            isDeleted: false,
            status: 'published',
            deadline: { $gt: new Date() }
        });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Tender not found or not available for saving'
            });
        }

        const isSaved = tender.metadata.savedBy.some(
            savedId => savedId.toString() === userId.toString()
        );

        if (isSaved) {
            await FreelanceTender.updateOne(
                { _id: id },
                { $pull: { 'metadata.savedBy': userId } }
            );
        } else {
            await FreelanceTender.updateOne(
                { _id: id },
                { $addToSet: { 'metadata.savedBy': userId } }
            );
        }

        const updatedTender = await FreelanceTender.findById(id).select('metadata.savedBy');
        const totalSaves = updatedTender.metadata.savedBy.length;
        const saved = !isSaved;

        res.status(200).json({
            success: true,
            data: {
                saved,
                totalSaves,
                operation: saved ? 'saved' : 'unsaved'
            },
            message: `Tender ${saved ? 'saved' : 'unsaved'} successfully`
        });

    } catch (error) {
        console.error('Error in toggleSaveFreelanceTender:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save/unsave tender',
            error: error.message
        });
    }
};

// ========== 13. getSavedFreelanceTenders ==========
exports.getSavedFreelanceTenders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 15 } = req.query;

        const filter = {
            'metadata.savedBy': userId,
            status: 'published',
            isDeleted: false
        };

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 50);
        const skip = (pageNum - 1) * limitNum;

        const tenders = await FreelanceTender.find(filter)
            .select('-applications')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('owner', 'name email')
            .populate('ownerEntity', 'name logo headline');

        const total = await FreelanceTender.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                tenders,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error('Error in getSavedFreelanceTenders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch saved tenders',
            error: error.message
        });
    }
};

// ========== 14. getFreelanceTenderStats ==========
exports.getFreelanceTenderStats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view stats'
            });
        }

        const stats = {
            totalApplications: tender.applications.length,
            byStatus: {
                submitted: tender.applications.filter(a => a.status === 'submitted').length,
                under_review: tender.applications.filter(a => a.status === 'under_review').length,
                shortlisted: tender.applications.filter(a => a.status === 'shortlisted').length,
                awarded: tender.applications.filter(a => a.status === 'awarded').length,
                rejected: tender.applications.filter(a => a.status === 'rejected').length
            },
            views: tender.metadata.views || 0,
            savedCount: tender.metadata.savedBy.length,
            engagementType: tender.details.engagementType,
            status: tender.status,
            deadline: tender.deadline,
            daysRemaining: tender.metadata.daysRemaining,
            publishedAt: tender.publishedAt,
            createdAt: tender.createdAt,
            maxApplications: tender.maxApplications || null,
            acceptingApplications: tender.acceptingApplications
        };

        // Add engagement-specific stats
        if (tender.details.engagementType === 'fixed_price') {
            stats.budget = {
                min: tender.details.budget.min,
                max: tender.details.budget.max,
                currency: tender.details.budget.currency
            };
            const rates = tender.applications.map(a => a.proposedRate).filter(r => r);
            if (rates.length > 0) {
                stats.averageProposedRate = rates.reduce((a, b) => a + b, 0) / rates.length;
                stats.minProposedRate = Math.min(...rates);
                stats.maxProposedRate = Math.max(...rates);
            }
        } else if (tender.details.engagementType === 'fixed_salary') {
            stats.salaryRange = {
                min: tender.details.salaryRange.min,
                max: tender.details.salaryRange.max,
                currency: tender.details.salaryRange.currency,
                period: tender.details.salaryRange.period
            };
        } else if (tender.details.engagementType === 'hourly') {
            stats.weeklyHours = tender.details.weeklyHours;
        } else if (tender.details.engagementType === 'negotiable') {
            stats.isNegotiable = true;
        }

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error in getFreelanceTenderStats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tender stats',
            error: error.message
        });
    }
};

// ========== 15. uploadAdditionalAttachments ==========
exports.uploadAdditionalAttachments = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!req.uploadedFiles?.files?.length) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to upload attachments'
            });
        }

        const newAttachments = mapUploadedFiles(
            req.uploadedFiles.files,
            userId,
            id,
            req.body.documentType || 'other',
            req.body.description || ''
        );

        tender.attachments.push(...newAttachments);
        await tender.save();

        await backfillAttachmentUrls(tender, req);

        const savedAttachments = tender.attachments.slice(-newAttachments.length);

        res.status(200).json({
            success: true,
            data: savedAttachments,
            message: `${newAttachments.length} attachment(s) uploaded successfully`
        });

    } catch (error) {
        console.error('Error in uploadAdditionalAttachments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload attachments',
            error: error.message
        });
    }
};

// ========== 16. downloadAttachment ==========
exports.downloadAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        const attachment = tender.attachments.id(attachmentId);
        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
        }

        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on disk'
            });
        }

        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, no-cache');

        res.download(attachment.path, attachment.originalName, (err) => {
            if (err && !res.headersSent) {
                console.error('Download error:', err);
                res.status(500).json({
                    success: false,
                    message: 'Failed to download file'
                });
            }
        });

    } catch (error) {
        console.error('Error in downloadAttachment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download attachment',
            error: error.message
        });
    }
};

// ========== 17. previewAttachment ==========
exports.previewAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        const attachment = tender.attachments.id(attachmentId);
        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
        }

        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on disk'
            });
        }

        const isPreviewable = attachment.mimetype.startsWith('image/') ||
            attachment.mimetype === 'application/pdf';

        if (!isPreviewable) {
            return res.status(400).json({
                success: false,
                message: 'This file type cannot be previewed. Please download it instead.'
            });
        }

        res.setHeader('Content-Type', attachment.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');

        const fileStream = fs.createReadStream(attachment.path);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error reading file'
                });
            }
        });

    } catch (error) {
        console.error('Error in previewAttachment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to preview attachment',
            error: error.message
        });
    }
};

// ========== 18. deleteAttachment ==========
exports.deleteAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        const userId = req.user._id;

        const tender = await FreelanceTender.findOne({ _id: id, isDeleted: false });

        if (!tender) {
            return res.status(404).json({
                success: false,
                message: 'Freelance tender not found'
            });
        }

        if (tender.owner.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete attachments'
            });
        }

        const attachment = tender.attachments.id(attachmentId);
        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
        }

        // Delete from disk (best-effort — continue even if file is missing)
        try {
            if (fs.existsSync(attachment.path)) {
                fs.unlinkSync(attachment.path);
            }
        } catch (fileError) {
            console.error('Error deleting file from disk:', fileError);
        }

        tender.attachments.pull(attachmentId);
        await tender.save();

        await tender.addAuditLog('DELETE_ATTACHMENT', userId, {
            attachmentId,
            fileName: attachment.originalName
        }, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            message: 'Attachment deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteAttachment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete attachment',
            error: error.message
        });
    }
};