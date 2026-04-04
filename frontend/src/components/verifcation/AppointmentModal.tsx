import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import appointmentService, { AppointmentSlot, AppointmentRequest } from '@/services/apointmentService';
import { User } from '@/contexts/AuthContext';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void> | void;
    verificationType: 'candidate' | 'freelancer' | 'company' | 'organization';
    user?: User | null;
    themeMode?: ThemeMode;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    verificationType,
    user,
    themeMode = 'light'
}) => {
    const theme = getTheme(themeMode);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        verificationType,
        additionalNotes: ''
    });
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');

    const officeLocation = appointmentService.getOfficeLocation();

    // Initialize form data with user info
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name || '',
                email: user.email || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                fullName: '',
                email: ''
            }));
        }
    }, [user]);

    // Load available slots when date changes
    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots(selectedDate);
        }
    }, [selectedDate]);

    const loadAvailableSlots = async (date: string) => {
        setIsLoadingSlots(true);
        try {
            const response = await appointmentService.getAvailableSlots(date, verificationType);
            setAvailableSlots(response.slots.filter(slot => slot.isAvailable));
        } catch (error) {
            console.error('Failed to load slots:', error);
            setValidationError('Failed to load available time slots. Please try again.');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const validateForm = (): boolean => {
        // Get user ID from either _id or id property
        const userId = user?._id || user?.id;

        if (!user || !userId) {
            setValidationError('Please login to schedule an appointment');
            return false;
        }

        if (!selectedDate) {
            setValidationError('Please select a date');
            return false;
        }

        if (!selectedTime) {
            setValidationError('Please select a time slot');
            return false;
        }

        if (!formData.fullName.trim()) {
            setValidationError('Please enter your full name');
            return false;
        }

        if (!formData.email.trim()) {
            setValidationError('Please enter your email address');
            return false;
        }

        if (!formData.phone.trim()) {
            setValidationError('Please enter your phone number');
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setValidationError('Please enter a valid email address');
            return false;
        }

        setValidationError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const userId = user?._id || user?.id;
        if (!userId) {
            setValidationError('User ID not found. Please try logging in again.');
            return;
        }

        const appointmentData: AppointmentRequest = {
            userId: userId,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            verificationType: formData.verificationType,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            additionalNotes: formData.additionalNotes
        };

        try {
            setIsSubmitting(true);
            await onSubmit(appointmentData);
        } catch (error) {
            console.error('Failed to submit appointment:', error);
            setValidationError('Failed to schedule appointment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate next 30 days for date picker
    const generateDateOptions = () => {
        const dates = [];
        const today = new Date();

        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);

            // Only weekdays (Monday - Friday)
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                dates.push({
                    value: date.toISOString().split('T')[0],
                    label: date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })
                });
            }
        }

        return dates;
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 ${themeMode === 'dark' ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center p-4 z-50`} onClick={onClose}>
            <div
                className={`${theme.bg.primary} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    border: `1px solid ${theme.border.primary}`
                }}
            >
                {/* Header */}
                <div
                    className={`sticky top-0 ${theme.bg.primary} border-b px-4 py-4 sm:px-6 sm:py-4 flex justify-between items-center`}
                    style={{ borderColor: theme.border.primary }}
                >
                    <div>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme.text.primary}`}>
                            Schedule Verification Appointment
                        </h2>
                        <p className={`text-sm sm:text-base ${theme.text.secondary}`}>
                            Complete the form to book your appointment
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${theme.text.muted} hover:${theme.text.primary} transition-colors`}
                        disabled={isSubmitting}
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                    {/* Validation Error */}
                    {validationError && (
                        <div
                            className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg"
                            style={{
                                backgroundColor: themeMode === 'dark' ? '#FEF2F2' : '#FEF2F2',
                                border: `1px solid ${themeMode === 'dark' ? '#FCA5A5' : '#FECACA'}`,
                                color: themeMode === 'dark' ? '#991B1B' : '#DC2626'
                            }}
                        >
                            <p className="font-medium text-sm sm:text-base">{validationError}</p>
                        </div>
                    )}

                    <div className="space-y-4 sm:space-y-6">
                        {/* Office Information */}
                        <div
                            className="p-3 sm:p-4 rounded-lg"
                            style={{
                                backgroundColor: themeMode === 'dark' ? '#1E40AF' : '#DBEAFE',
                                border: `1px solid ${themeMode === 'dark' ? '#3B82F6' : '#93C5FD'}`
                            }}
                        >
                            <h3 className={`text-base sm:text-lg font-semibold ${theme.text.primary} mb-1 sm:mb-2`}>
                                Verification Office
                            </h3>
                            <p className={`text-xs sm:text-sm ${theme.text.secondary} mb-1`}>
                                <strong>Location:</strong> {officeLocation.address}
                            </p>
                            <p className={`text-xs sm:text-sm ${theme.text.secondary} mb-1`}>
                                <strong>Hours:</strong> {officeLocation.workingHours}
                            </p>
                            <p className={`text-xs sm:text-sm ${theme.text.secondary}`}>
                                <strong>Contact:</strong> {officeLocation.contactPhone}
                            </p>
                        </div>

                        {/* Verification Type Indicator */}
                        <div
                            className="p-2 sm:p-3 rounded-lg"
                            style={{
                                backgroundColor: theme.bg.secondary,
                                border: `1px solid ${theme.border.secondary}`
                            }}
                        >
                            <p className={`text-xs sm:text-sm ${theme.text.secondary}`}>
                                <span className="font-medium">Verification Type:</span>{' '}
                                <span className="capitalize">{verificationType}</span>
                            </p>
                        </div>

                        {/* Date Selection */}
                        <div>
                            <label className={`block text-xs sm:text-sm font-medium ${theme.text.secondary} mb-2`}>
                                Select Date *
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedTime('');
                                    setValidationError('');
                                }}
                                className={`w-full px-3 py-2 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors ${theme.bg.primary}`}
                                style={{
                                    border: `1px solid ${theme.border.primary}`,
                                    color: theme.text.primary
                                }}
                                required
                                disabled={isLoadingSlots || isSubmitting}
                            >
                                <option value="">Choose a date</option>
                                {generateDateOptions().map((date) => (
                                    <option key={date.value} value={date.value}>
                                        {date.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Time Slots */}
                        <div>
                            <label className={`block text-xs sm:text-sm font-medium ${theme.text.secondary} mb-2`}>
                                Select Time Slot *
                            </label>
                            {isLoadingSlots ? (
                                <div className="text-center py-3 sm:py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className={`text-xs sm:text-sm ${theme.text.muted} mt-2`}>
                                        Loading available slots...
                                    </p>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTime(slot.startTime);
                                                setValidationError('');
                                            }}
                                            className={`p-2 sm:p-3 rounded-lg text-center transition-all duration-200 ${selectedTime === slot.startTime
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                }`}
                                            style={{
                                                border: `1px solid ${selectedTime === slot.startTime
                                                    ? '#2563EB'
                                                    : theme.border.primary
                                                    }`,
                                                color: selectedTime === slot.startTime
                                                    ? '#1D4ED8'
                                                    : theme.text.secondary
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            <div className="flex items-center justify-center">
                                                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                <span className="text-xs sm:text-sm">
                                                    {slot.startTime} - {slot.endTime}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : selectedDate ? (
                                <div
                                    className="text-center py-3 sm:py-4 rounded-lg"
                                    style={{
                                        backgroundColor: themeMode === 'dark' ? '#78350F' : '#FEF3C7',
                                        color: themeMode === 'dark' ? '#FBBF24' : '#92400E'
                                    }}
                                >
                                    <p className="font-medium">No available slots for this date</p>
                                    <p className="text-xs sm:text-sm mt-1">
                                        Please select another date
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className="text-center py-3 sm:py-4 rounded-lg"
                                    style={{
                                        backgroundColor: theme.bg.secondary,
                                        color: theme.text.muted
                                    }}
                                >
                                    <p>Please select a date first</p>
                                </div>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <label className={`block text-xs sm:text-sm font-medium ${theme.text.secondary} mb-1`}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fullName: e.target.value });
                                        setValidationError('');
                                    }}
                                    className={`w-full px-3 py-2 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors ${theme.bg.primary}`}
                                    style={{
                                        border: `1px solid ${theme.border.primary}`,
                                        color: theme.text.primary
                                    }}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className={`block text-xs sm:text-sm font-medium ${theme.text.secondary} mb-1`}>
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        setValidationError('');
                                    }}
                                    className={`w-full px-3 py-2 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors ${theme.bg.primary}`}
                                    style={{
                                        border: `1px solid ${theme.border.primary}`,
                                        color: theme.text.primary
                                    }}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className={`block text-xs sm:text-sm font-medium ${theme.text.secondary} mb-1`}>
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        setValidationError('');
                                    }}
                                    className={`w-full px-3 py-2 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors ${theme.bg.primary}`}
                                    style={{
                                        border: `1px solid ${theme.border.primary}`,
                                        color: theme.text.primary
                                    }}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="+251 11 123 4567"
                                />
                            </div>

                            <div>
                                <label className={`block text-xs sm:text-sm font-medium ${theme.text.secondary} mb-1`}>
                                    Additional Notes
                                </label>
                                <textarea
                                    value={formData.additionalNotes}
                                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                                    rows={3}
                                    className={`w-full px-3 py-2 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors ${theme.bg.primary}`}
                                    style={{
                                        border: `1px solid ${theme.border.primary}`,
                                        color: theme.text.primary
                                    }}
                                    placeholder="Any special requirements or notes for your appointment..."
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Appointment Summary */}
                        <div
                            className="p-3 sm:p-4 rounded-lg"
                            style={{
                                backgroundColor: theme.bg.secondary,
                                border: `1px solid ${theme.border.secondary}`
                            }}
                        >
                            <h3 className={`text-xs sm:text-sm font-medium ${theme.text.primary} mb-1 sm:mb-2`}>
                                Appointment Summary:
                            </h3>
                            <div className="space-y-1 text-xs sm:text-sm">
                                {selectedDate && (
                                    <p className={theme.text.secondary}>
                                        <span className="font-medium">Date:</span>{' '}
                                        {new Date(selectedDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                )}
                                {selectedTime && (
                                    <p className={theme.text.secondary}>
                                        <span className="font-medium">Time:</span> {selectedTime}
                                    </p>
                                )}
                                <p className={theme.text.secondary}>
                                    <span className="font-medium">Type:</span>{' '}
                                    <span className="capitalize">{verificationType} Verification</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 sm:mt-8 sm:pt-6 border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-4"
                        style={{ borderColor: theme.border.secondary }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors ${theme.text.secondary}`}
                            style={{
                                border: `1px solid ${theme.border.primary}`,
                                backgroundColor: theme.bg.primary
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-4 sm:px-6 py-2 sm:py-3 ${colorClasses.bg.darkNavy} text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                    <span className="text-xs sm:text-sm">Scheduling...</span>
                                </>
                            ) : (
                                <span className="text-xs sm:text-sm">Schedule Appointment</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;