// components/verification/AppointmentModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import appointmentService, { AppointmentSlot, AppointmentRequest } from '@/services/apointmentService';
import { User } from '@/contexts/AuthContext';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void> | void;
    verificationType: 'candidate' | 'freelancer' | 'company' | 'organization';
    user?: User | null;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    verificationType,
    user
}) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Schedule Verification Appointment</h2>
                        <p className="text-gray-600">Complete the form to book your appointment</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isSubmitting}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Validation Error */}
                    {validationError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 font-medium">{validationError}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Office Information */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Office</h3>
                            <p className="text-sm text-gray-600 mb-1">
                                <strong>Location:</strong> {officeLocation.address}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <strong>Hours:</strong> {officeLocation.workingHours}
                            </p>
                            <p className="text-sm text-gray-600">
                                <strong>Contact:</strong> {officeLocation.contactPhone}
                            </p>
                        </div>

                        {/* Verification Type Indicator */}
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Verification Type:</span>{' '}
                                <span className="capitalize">{verificationType}</span>
                            </p>
                        </div>

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Date *
                            </label>
                            <select
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedTime('');
                                    setValidationError('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Time Slot *
                            </label>
                            {isLoadingSlots ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-600 mt-2">Loading available slots...</p>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTime(slot.startTime);
                                                setValidationError('');
                                            }}
                                            className={`p-3 border rounded-lg text-center transition ${selectedTime === slot.startTime
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                }`}
                                            disabled={isSubmitting}
                                        >
                                            <div className="flex items-center justify-center">
                                                <ClockIcon className="h-4 w-4 mr-2" />
                                                {slot.startTime} - {slot.endTime}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : selectedDate ? (
                                <div className="text-center py-4 bg-yellow-50 rounded-lg">
                                    <p className="text-yellow-800">No available slots for this date</p>
                                    <p className="text-sm text-yellow-600">Please select another date</p>
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-600">Please select a date first</p>
                                </div>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fullName: e.target.value });
                                        setValidationError('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        setValidationError('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        setValidationError('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={isSubmitting}
                                    placeholder="+251 11 123 4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={formData.additionalNotes}
                                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Any special requirements or notes for your appointment..."
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Appointment Summary */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Appointment Summary:</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                {selectedDate && (
                                    <p>
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
                                    <p>
                                        <span className="font-medium">Time:</span> {selectedTime}
                                    </p>
                                )}
                                <p>
                                    <span className="font-medium">Type:</span>{' '}
                                    <span className="capitalize">{verificationType} Verification</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-3 ${colorClasses.bg.darkNavy} text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Scheduling...
                                </>
                            ) : (
                                'Schedule Appointment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;