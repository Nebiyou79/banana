// server/src/controllers/verificationController.js
const User = require('../models/User');
// 🔔 NOTIFICATION
const notificationService = require('../services/notificationService');

exports.updateVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            profileVerified,
            socialVerified,
            documentsVerified,
            verificationNotes,
            verificationStatus
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update verification details
        user.verificationDetails = {
            ...user.verificationDetails,
            profileVerified: profileVerified ?? user.verificationDetails.profileVerified,
            socialVerified: socialVerified ?? user.verificationDetails.socialVerified,
            documentsVerified: documentsVerified ?? user.verificationDetails.documentsVerified,
            verificationNotes: verificationNotes ?? user.verificationDetails.verificationNotes,
            lastVerified: new Date(),
            verifiedBy: req.user._id
        };

        // If admin directly sets status, override calculated status
        if (verificationStatus && req.user.role === 'admin') {
            user.verificationStatus = verificationStatus;
        } else {
            await user.updateVerificationStatus();
        }

        await user.save();

        // 🔔 NOTIFICATION: Notify user about verification status change
        (async () => {
            try {
                const verifNotifMap = {
                    'full':    { type: 'verification_approved', title: 'Account verified! ✅', priority: 'critical' },
                    'partial': { type: 'verification_status', title: 'Partial verification', priority: 'high' },
                    'none':    { type: 'verification_rejected', title: 'Verification update', priority: 'normal' }
                };
                const notifCfg = verifNotifMap[user.verificationStatus];
                if (notifCfg) {
                    await notificationService.create({
                        recipient: userId,
                        actor: req.user._id,
                        type: notifCfg.type,
                        title: notifCfg.title,
                        body: user.getVerificationMessage(),
                        data: {
                            entityType: 'User',
                            entityId: userId,
                            screen: 'VerificationStatus',
                            params: {}
                        },
                        priority: notifCfg.priority,
                        channels: { inApp: true, push: true, email: true }
                    });
                }
            } catch (notifErr) {
                console.warn('[Notification] Non-critical error:', notifErr.message);
            }
        })();
        // END NOTIFICATION

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
                verificationDetails: user.verificationDetails
            },
            verificationStatus: user.verificationStatus,
            message: user.getVerificationMessage()
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getVerificationStatus = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.userId;

        const user = await User.findById(userId)
            .select('verificationStatus verificationDetails name email role avatar headline');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            verificationStatus: user.verificationStatus,
            verificationDetails: user.verificationDetails,
            verificationMessage: user.getVerificationMessage(),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                headline: user.headline
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.requestVerification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { verificationType, description } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create verification request
        const verificationRequest = {
            userId,
            verificationType: verificationType || 'profile',
            description,
            status: 'pending',
            requestedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNotes: null
        };

        if (!user.verificationRequests) {
            user.verificationRequests = [];
        }

        user.verificationRequests.push(verificationRequest);
        await user.save();

        // 🔔 NOTIFICATION: Notify admin(s) about new verification request
        (async () => {
            try {
                const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
                for (const admin of admins) {
                    await notificationService.create({
                        recipient: admin._id,
                        actor: userId,
                        type: 'verification_submitted',
                        title: 'Verification request',
                        body: `{actorName} submitted a verification request`,
                        data: {
                            entityType: 'User',
                            entityId: userId,
                            screen: 'AdminVerifications',
                            params: { userId }
                        },
                        priority: 'normal',
                        groupKey: 'verification_submitted:admin',
                        channels: { inApp: true, push: false, email: true }
                    });
                }
            } catch (notifErr) {
                console.warn('[Notification] Non-critical error:', notifErr.message);
            }
        })();
        // END NOTIFICATION

        res.json({
            success: true,
            message: 'Verification request submitted successfully',
            request: verificationRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getVerificationRequests = async (req, res) => {
    try {
        const users = await User.find({
            'verificationRequests.status': 'pending'
        })
            .select('name email role verificationStatus verificationDetails verificationRequests')
            .sort({ 'verificationRequests.requestedAt': -1 });

        res.json({
            success: true,
            count: users.length,
            requests: users.map(user => ({
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentStatus: user.verificationStatus,
                requests: user.verificationRequests?.filter(r => r.status === 'pending')
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.bulkUpdateVerification = async (req, res) => {
    try {
        const { userIds, updates } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs are required'
            });
        }

        const bulkOperations = userIds.map(userId => ({
            updateOne: {
                filter: { _id: userId },
                update: {
                    $set: {
                        'verificationDetails.profileVerified': updates.profileVerified,
                        'verificationDetails.socialVerified': updates.socialVerified,
                        'verificationDetails.documentsVerified': updates.documentsVerified,
                        'verificationDetails.verificationNotes': updates.verificationNotes,
                        'verificationDetails.lastVerified': new Date(),
                        'verificationDetails.verifiedBy': req.user._id
                    }
                }
            }
        }));

        const result = await User.bulkWrite(bulkOperations);

        // Update verification status for each user
        for (const userId of userIds) {
            const user = await User.findById(userId);
            if (user) {
                await user.updateVerificationStatus();
                await user.save();
            }
        }

        res.json({
            success: true,
            message: `Updated verification for ${result.modifiedCount} users`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getVerificationStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 },
                    roles: { $push: '$role' }
                }
            },
            {
                $project: {
                    status: '$_id',
                    count: 1,
                    roles: 1,
                    _id: 0
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ verificationStatus: 'full' });
        const partiallyVerified = await User.countDocuments({ verificationStatus: 'partial' });
        const notVerified = await User.countDocuments({ verificationStatus: 'none' });

        res.json({
            success: true,
            stats: {
                total: totalUsers,
                verified: verifiedUsers,
                partiallyVerified,
                notVerified,
                verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
                detailedStats: stats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};