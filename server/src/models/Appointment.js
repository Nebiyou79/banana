// server/src/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    verificationType: {
        type: String,
        enum: {
            values: ['candidate', 'freelancer', 'company', 'organization'],
            message: 'Invalid verification type'
        },
        required: [true, 'Verification type is required'],
        index: true
    },
    appointmentDate: {
        type: String, // Stored as YYYY-MM-DD
        required: [true, 'Appointment date is required'],
        index: true,
        validate: {
            validator: function (value) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) return false;

                const appointmentDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Appointment must be in the future
                return appointmentDate >= today;
            },
            message: 'Appointment date must be a valid future date in YYYY-MM-DD format'
        }
    },
    appointmentTime: {
        type: String, // Stored as HH:MM in 24-hour format
        required: [true, 'Appointment time is required'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM']
    },
    documents: [{
        type: String,
        trim: true
    }],
    additionalNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'completed', 'cancelled'],
            message: 'Invalid appointment status'
        },
        default: 'pending',
        index: true
    },
    officeLocation: {
        type: String,
        default: '22 Meklit Building, Addis Ababa, Ethiopia'
    },
    confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    confirmationDate: {
        type: Date
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
    },
    cancelledAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    adminNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Admin notes cannot exceed 500 characters']
    },
    verificationResult: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'needs_review']
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        rejectionReason: String,
        documentsVerified: [{
            documentType: String,
            status: {
                type: String,
                enum: ['pending', 'verified', 'rejected']
            },
            notes: String
        }]
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

// Compound index for unique appointments
appointmentSchema.index(
    { appointmentDate: 1, appointmentTime: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } }
    }
);

// Index for user appointments
appointmentSchema.index({ userId: 1, status: 1 });

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function () {
    return new Date(`${this.appointmentDate}T${this.appointmentTime}`);
});

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function () {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    return appointmentDateTime > now && this.status === 'pending';
});

// Virtual for checking if appointment is past due
appointmentSchema.virtual('isPastDue').get(function () {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    return appointmentDateTime < now && this.status === 'pending';
});

// Pre-save middleware to validate appointment
appointmentSchema.pre('save', async function (next) {
    // Check for time slot conflicts
    if (this.isModified('appointmentDate') || this.isModified('appointmentTime')) {
        const conflictingAppointment = await this.constructor.findOne({
            _id: { $ne: this._id },
            appointmentDate: this.appointmentDate,
            appointmentTime: this.appointmentTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (conflictingAppointment) {
            const err = new Error('This time slot is already booked');
            err.name = 'ValidationError';
            return next(err);
        }
    }

    // Validate appointment date is not in the past
    if (this.isModified('appointmentDate')) {
        const appointmentDate = new Date(this.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
            const err = new Error('Appointment date cannot be in the past');
            err.name = 'ValidationError';
            return next(err);
        }
    }

    next();
});

// Static method to get appointments by date range
appointmentSchema.statics.getByDateRange = function (startDate, endDate, status) {
    const query = {
        appointmentDate: { $gte: startDate, $lte: endDate }
    };

    if (status) {
        query.status = status;
    }

    return this.find(query).sort({ appointmentDate: 1, appointmentTime: 1 });
};

// Static method to get upcoming appointments
appointmentSchema.statics.getUpcoming = function (userId) {
    const today = new Date().toISOString().split('T')[0];

    return this.find({
        userId,
        appointmentDate: { $gte: today },
        status: { $in: ['pending', 'confirmed'] }
    }).sort({ appointmentDate: 1, appointmentTime: 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);