// src/components/VerificationRequestModal.tsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import verificationService from '@/services/verificationService';

export interface VerificationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    userId?: string;
}

const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    userId
}) => {
    const [verificationType, setVerificationType] = useState<'profile' | 'social' | 'document'>('profile');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            setError('Please provide a description');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await verificationService.requestVerification({
                verificationType,
                description
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess();
                // Reset form
                setDescription('');
                setVerificationType('profile');
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit verification request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            type="button"
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Request Verification
                            </h3>

                            {success ? (
                                <div className="rounded-md bg-green-50 p-4 mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-green-800">
                                                Request Submitted
                                            </h3>
                                            <div className="mt-2 text-sm text-green-700">
                                                <p>Your verification request has been submitted successfully. An admin will review it shortly.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Verification Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['profile', 'social', 'document'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setVerificationType(type)}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md ${verificationType === type
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                            Description (Required)
                                        </label>
                                        <textarea
                                            id="description"
                                            rows={4}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Please describe why you're requesting verification..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Provide details about what you want verified. For document verification, mention which documents you've uploaded.
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="rounded-md bg-red-50 p-3">
                                            <p className="text-sm text-red-800">{error}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationRequestModal;