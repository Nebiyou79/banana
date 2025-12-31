// src/components/VerificationProgress.tsx
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import verificationService, { VerificationDetails } from '@/services/verificationService';

export interface VerificationProgressProps {
    details: VerificationDetails;
    showLabels?: boolean;
    compact?: boolean;
}

const VerificationProgress: React.FC<VerificationProgressProps> = ({
    details,
    showLabels = true,
    compact = false
}) => {
    const progress = verificationService.calculateVerificationProgress(details);

    const verificationItems = [
        { key: 'profileVerified', label: 'Profile Verified', value: details.profileVerified },
        { key: 'socialVerified', label: 'Social Profile Verified', value: details.socialVerified },
        { key: 'documentsVerified', label: 'Documents Verified', value: details.documentsVerified },
        { key: 'emailVerified', label: 'Email Verified', value: details.emailVerified },
        { key: 'phoneVerified', label: 'Phone Verified', value: details.phoneVerified }
    ];

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Verification Progress</span>
                    <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Status</h3>
                <div className="flex items-center justify-between mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 mr-4">
                        <div
                            className={`h-3 rounded-full transition-all duration-300 ${progress >= 80 ? 'bg-green-500' :
                                progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-lg font-bold text-gray-900 min-w-[60px]">{progress}%</span>
                </div>
            </div>

            <div className="space-y-3">
                {verificationItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center">
                            {item.value ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                            )}
                            {showLabels && (
                                <span className="text-sm text-gray-700">{item.label}</span>
                            )}
                        </div>
                        <span className={`text-sm font-medium ${item.value ? 'text-green-600' : 'text-red-600'}`}>
                            {item.value ? 'Verified' : 'Pending'}
                        </span>
                    </div>
                ))}
            </div>

            {details.verificationNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Admin Notes</h4>
                    <p className="text-sm text-blue-700">{details.verificationNotes}</p>
                </div>
            )}

            {details.lastVerified && (
                <div className="mt-4 text-xs text-gray-500">
                    Last verified: {new Date(details.lastVerified).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

export default VerificationProgress;