// server/src/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

exports.getAvailableSlots = async (req, res) => {
    try {
        const { date, verificationType } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        // Generate working hours (9 AM to 4 PM, Monday to Friday)
        const slots = [];
        const startHour = 9;
        const endHour = 16;
        const slotDuration = 45; // minutes
        const slotsPerDay = 8; // 8 slots per day

        // Check if date is a weekend
        const appointmentDate = new Date(date);
        const dayOfWeek = appointmentDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.json({
                success: true,
                slots: [],
                message: 'No appointments on weekends'
            });
        }

        // Generate slots for the day
        for (let i = 0; i < slotsPerDay; i++) {
            const slotHour = startHour + Math.floor((i * slotDuration) / 60);
            const slotMinute = (i * slotDuration) % 60;

            const startTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
            const endHourAdj = slotHour + Math.floor((slotMinute + slotDuration) / 60);
            const endMinute = (slotMinute + slotDuration) % 60;
            const endTime = `${endHourAdj.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

            // Check if slot is already booked
            const existingAppointment = await Appointment.findOne({
                appointmentDate: date,
                appointmentTime: startTime,
                status: { $in: ['pending', 'confirmed'] }
            });

            slots.push({
                id: `${date}-${startTime}`,
                date,
                startTime,
                endTime,
                isAvailable: !existingAppointment,
                type: 'verification',
                verificationType: verificationType || 'general',
                location: '22 Meklit Building, Addis Ababa',
                maxCapacity: 1,
                currentBookings: existingAppointment ? 1 : 0
            });
        }

        res.json({
            success: true,
            slots,
            totalSlots: slots.length,
            availableSlots: slots.filter(slot => slot.isAvailable).length
        });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching slots',
            error: error.message
        });
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const {
            userId,
            fullName,
            email,
            phone,
            verificationType,
            appointmentDate,
            appointmentTime,
            documents,
            additionalNotes
        } = req.body;

        // Validation
        if (!fullName || !email || !phone || !verificationType || !appointmentDate || !appointmentTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate phone number (basic validation)
        if (phone.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number'
            });
        }

        // Check if slot is still available
        const existingAppointment = await Appointment.findOne({
            appointmentDate,
            appointmentTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is no longer available. Please choose another time.'
            });
        }

        // Check if user already has a pending appointment for this verification type
        const userPendingAppointment = await Appointment.findOne({
            userId,
            verificationType,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (userPendingAppointment) {
            return res.status(400).json({
                success: false,
                message: `You already have a pending appointment for ${verificationType} verification.`
            });
        }

        // Get user details if userId is provided
        let user = null;
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
        }

        // Create appointment
        const appointment = new Appointment({
            userId: userId || null,
            fullName,
            email,
            phone,
            verificationType,
            appointmentDate,
            appointmentTime,
            documents: documents || [],
            additionalNotes,
            status: 'pending',
            officeLocation: '22 Meklit Building, Addis Ababa, Ethiopia'
        });

        await appointment.save();

        // Send confirmation email
        try {
            await sendAppointmentConfirmationEmail(appointment, user);
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the appointment creation if email fails
        }

        // Notify admin about new appointment
        try {
            await notifyAdminAboutNewAppointment(appointment);
        } catch (notificationError) {
            console.error('Failed to notify admin:', notificationError);
        }

        res.status(201).json({
            success: true,
            appointment: {
                id: appointment._id,
                fullName: appointment.fullName,
                email: appointment.email,
                verificationType: appointment.verificationType,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                status: appointment.status,
                officeLocation: appointment.officeLocation
            },
            message: 'Appointment scheduled successfully. A confirmation email has been sent.'
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating appointment',
            error: error.message
        });
    }
};

exports.getUserAppointments = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const appointments = await Appointment.find({ userId })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .select('-__v');

        res.json({
            success: true,
            appointments,
            total: appointments.length,
            upcoming: appointments.filter(app =>
                new Date(app.appointmentDate) >= new Date() &&
                app.status === 'pending'
            ).length,
            completed: appointments.filter(app =>
                app.status === 'completed'
            ).length
        });
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching appointments',
            error: error.message
        });
    }
};

exports.getAppointmentDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id)
            .populate('userId', 'name email role verificationStatus')
            .select('-__v');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching appointment details',
            error: error.message
        });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if appointment can be cancelled (only pending appointments)
        if (appointment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel appointment with status: ${appointment.status}`
            });
        }

        // Check if appointment is in the past
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        if (appointmentDateTime < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel past appointments'
            });
        }

        // Update appointment status
        appointment.status = 'cancelled';
        appointment.cancellationReason = cancellationReason || 'User cancelled';
        appointment.cancelledAt = new Date();

        await appointment.save();

        // Send cancellation email
        try {
            await sendAppointmentCancellationEmail(appointment);
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
        }

        // Notify admin about cancellation
        try {
            await notifyAdminAboutCancellation(appointment);
        } catch (notificationError) {
            console.error('Failed to notify admin:', notificationError);
        }

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            appointment: {
                id: appointment._id,
                status: appointment.status,
                cancelledAt: appointment.cancelledAt
            }
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling appointment',
            error: error.message
        });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        const adminId = req.user?.userId;

        if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: confirmed, completed, or cancelled'
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Update status
        appointment.status = status;

        if (status === 'confirmed') {
            appointment.confirmedBy = adminId;
            appointment.confirmationDate = new Date();
        }

        if (adminNotes) {
            appointment.adminNotes = adminNotes;
        }

        await appointment.save();

        // Send status update email
        try {
            await sendAppointmentStatusUpdateEmail(appointment, status);
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError);
        }

        res.json({
            success: true,
            message: `Appointment ${status} successfully`,
            appointment: {
                id: appointment._id,
                status: appointment.status,
                confirmedBy: appointment.confirmedBy,
                confirmationDate: appointment.confirmationDate
            }
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating appointment status',
            error: error.message
        });
    }
};

exports.getAppointmentsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const { status } = req.query;

        const query = { appointmentDate: date };

        if (status) {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .sort({ appointmentTime: 1 })
            .populate('userId', 'name email role')
            .select('-__v');

        res.json({
            success: true,
            date,
            appointments,
            total: appointments.length,
            byStatus: {
                pending: appointments.filter(app => app.status === 'pending').length,
                confirmed: appointments.filter(app => app.status === 'confirmed').length,
                completed: appointments.filter(app => app.status === 'completed').length,
                cancelled: appointments.filter(app => app.status === 'cancelled').length
            }
        });
    } catch (error) {
        console.error('Error fetching appointments by date:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching appointments',
            error: error.message
        });
    }
};

exports.getAdminAppointments = async (req, res) => {
    try {
        const {
            status,
            verificationType,
            dateFrom,
            dateTo,
            page = 1,
            limit = 20
        } = req.query;

        const query = {};

        // Apply filters
        if (status && status !== 'all') {
            query.status = status;
        }

        if (verificationType && verificationType !== 'all') {
            query.verificationType = verificationType;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.appointmentDate = {};
            if (dateFrom) query.appointmentDate.$gte = dateFrom;
            if (dateTo) query.appointmentDate.$lte = dateTo;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [appointments, total] = await Promise.all([
            Appointment.find(query)
                .sort({ appointmentDate: -1, appointmentTime: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email role verificationStatus')
                .select('-__v'),
            Appointment.countDocuments(query)
        ]);

        // Get statistics
        const stats = await Appointment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$verificationType',
                    count: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    confirmed: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            appointments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            },
            stats,
            filters: {
                status,
                verificationType,
                dateFrom,
                dateTo
            }
        });
    } catch (error) {
        console.error('Error fetching admin appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching appointments',
            error: error.message
        });
    }
};

exports.bulkUpdateAppointments = async (req, res) => {
    try {
        const { appointmentIds, status, adminNotes } = req.body;
        const adminId = req.user?.userId;

        if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Appointment IDs are required'
            });
        }

        if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Update multiple appointments
        const updateData = {
            status,
            updatedAt: new Date()
        };

        if (status === 'confirmed') {
            updateData.confirmedBy = adminId;
            updateData.confirmationDate = new Date();
        }

        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }

        const result = await Appointment.updateMany(
            { _id: { $in: appointmentIds } },
            { $set: updateData }
        );

        // Send notifications for updated appointments
        const updatedAppointments = await Appointment.find({ _id: { $in: appointmentIds } });

        // Send email notifications (in background)
        updatedAppointments.forEach(async (appointment) => {
            try {
                await sendAppointmentStatusUpdateEmail(appointment, status);
            } catch (emailError) {
                console.error(`Failed to send email for appointment ${appointment._id}:`, emailError);
            }
        });

        res.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} appointment(s) to ${status}`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount
        });
    } catch (error) {
        console.error('Error bulk updating appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while bulk updating appointments',
            error: error.message
        });
    }
};

// Helper functions for email notifications
async function sendAppointmentConfirmationEmail(appointment, user) {
    const emailData = {
        to: appointment.email,
        subject: `Appointment Confirmation - ${appointment.verificationType} Verification`,
        template: 'appointmentConfirmation',
        data: {
            fullName: appointment.fullName,
            verificationType: appointment.verificationType,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            officeLocation: appointment.officeLocation,
            documentsRequired: appointment.documents,
            additionalNotes: appointment.additionalNotes,
            userVerificationStatus: user?.verificationStatus || 'none'
        }
    };

    await sendEmail(emailData);
}

async function sendAppointmentCancellationEmail(appointment) {
    const emailData = {
        to: appointment.email,
        subject: `Appointment Cancelled - ${appointment.verificationType} Verification`,
        template: 'appointmentCancellation',
        data: {
            fullName: appointment.fullName,
            verificationType: appointment.verificationType,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            cancellationReason: appointment.cancellationReason || 'No reason provided'
        }
    };

    await sendEmail(emailData);
}

async function sendAppointmentStatusUpdateEmail(appointment, newStatus) {
    const emailData = {
        to: appointment.email,
        subject: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${appointment.verificationType} Verification`,
        template: 'appointmentStatusUpdate',
        data: {
            fullName: appointment.fullName,
            verificationType: appointment.verificationType,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            status: newStatus,
            officeLocation: appointment.officeLocation,
            adminNotes: appointment.adminNotes
        }
    };

    await sendEmail(emailData);
}

async function notifyAdminAboutNewAppointment(appointment) {
    const admins = await User.find({ role: 'admin', isActive: true }).select('email');

    if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);

        const emailData = {
            to: adminEmails,
            subject: `New Verification Appointment - ${appointment.verificationType}`,
            template: 'newAppointmentAdminNotification',
            data: {
                appointmentId: appointment._id,
                fullName: appointment.fullName,
                email: appointment.email,
                phone: appointment.phone,
                verificationType: appointment.verificationType,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                documents: appointment.documents,
                createdAt: appointment.createdAt
            }
        };

        await sendEmail(emailData);
    }
}

async function notifyAdminAboutCancellation(appointment) {
    const admins = await User.find({ role: 'admin', isActive: true }).select('email');

    if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);

        const emailData = {
            to: adminEmails,
            subject: `Appointment Cancelled - ${appointment.verificationType} Verification`,
            template: 'appointmentCancellationAdminNotification',
            data: {
                appointmentId: appointment._id,
                fullName: appointment.fullName,
                verificationType: appointment.verificationType,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                cancellationReason: appointment.cancellationReason,
                cancelledAt: appointment.cancelledAt
            }
        };

        await sendEmail(emailData);
    }
}