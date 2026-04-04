import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import verificationService, { VerificationDetails } from '@/services/verificationService';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import LoadingSpinner from '../LoadingSpinner';

export interface VerificationProgressProps {
    details: VerificationDetails;
    showLabels?: boolean;
    compact?: boolean;
    isLoading?: boolean;
    themeMode?: ThemeMode;
    className?: string;
}

const VerificationProgress: React.FC<VerificationProgressProps> = ({
    details,
    showLabels = true,
    compact = false,
    isLoading = false,
    themeMode = 'light',
    className = ''
}) => {
    const theme = getTheme(themeMode);
    const progress = verificationService.calculateVerificationProgress(details);

    const verificationItems = [
        { key: 'profileVerified', label: 'Profile Verified', value: details.profileVerified },
        { key: 'socialVerified', label: 'Social Profile Verified', value: details.socialVerified },
        { key: 'documentsVerified', label: 'Documents Verified', value: details.documentsVerified },
        { key: 'emailVerified', label: 'Email Verified', value: details.emailVerified },
        { key: 'phoneVerified', label: 'Phone Verified', value: details.phoneVerified }
    ];

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return themeMode === 'dark' ? '#10B981' : '#059669'; // green-600/green-500
        if (progress >= 40) return themeMode === 'dark' ? '#F59E0B' : '#D97706'; // yellow-600/yellow-500
        return themeMode === 'dark' ? '#EF4444' : '#DC2626'; // red-600/red-500
    };

    if (isLoading) {
        return (
            <div
                className={`${theme.bg.secondary} rounded-lg shadow-sm p-4 sm:p-6 ${className}`}
                style={{ border: `1px solid ${theme.border.secondary}` }}
            >
                <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                    <LoadingSpinner
                        size="md"
                        themeMode={themeMode}
                        showText
                        text="Loading verification..."
                    />
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className={`space-y-1.5 sm:space-y-2 ${className}`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-medium ${theme.text.secondary}`}>
                        Verification Progress
                    </span>
                    <span
                        className="text-xs sm:text-sm font-semibold"
                        style={{ color: getProgressColor(progress) }}
                    >
                        {progress}%
                    </span>
                </div>
                <div
                    className="w-full rounded-full h-1.5 sm:h-2"
                    style={{ backgroundColor: theme.bg.gray400 }}
                >
                    <div
                        className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: getProgressColor(progress)
                        }}
                    />
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2 pt-1">
                    {verificationItems.slice(0, 3).map((item) => (
                        <div key={item.key} className="flex items-center">
                            {item.value ? (
                                <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                            ) : (
                                <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {item.label.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${theme.bg.primary} rounded-lg shadow-sm p-4 sm:p-6 ${className}`}
            style={{ border: `1px solid ${theme.border.secondary}` }}
        >
            <div className="mb-3 sm:mb-4">
                <h3 className={`text-base sm:text-lg font-semibold ${theme.text.primary} mb-1.5 sm:mb-2`}>
                    Verification Status
                </h3>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div
                        className="w-full rounded-full h-2 sm:h-3 mr-3 sm:mr-4"
                        style={{ backgroundColor: theme.bg.secondary }}
                    >
                        <div
                            className={`h-2 sm:h-3 rounded-full transition-all duration-300`}
                            style={{
                                width: `${progress}%`,
                                backgroundColor: getProgressColor(progress)
                            }}
                        />
                    </div>
                    <span
                        className="text-base sm:text-lg font-bold min-w-[50px] sm:min-w-[60px] text-right"
                        style={{ color: getProgressColor(progress) }}
                    >
                        {progress}%
                    </span>
                </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
                {verificationItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center">
                            {item.value ? (
                                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2" />
                            ) : (
                                <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2" />
                            )}
                            {showLabels && (
                                <span className={`text-xs sm:text-sm ${theme.text.secondary}`}>
                                    {item.label}
                                </span>
                            )}
                        </div>
                        <span
                            className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full ${item.value
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}
                        >
                            {item.value ? 'Verified' : 'Pending'}
                        </span>
                    </div>
                ))}
            </div>

            {details.verificationNotes && (
                <div
                    className="mt-3 sm:mt-4 p-2 sm:p-3 rounded border"
                    style={{
                        backgroundColor: themeMode === 'dark' ? '#1E40AF' : '#DBEAFE',
                        borderColor: themeMode === 'dark' ? '#3B82F6' : '#93C5FD',
                        color: themeMode === 'dark' ? '#E0F2FE' : '#1E40AF'
                    }}
                >
                    <h4 className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Admin Notes</h4>
                    <p className="text-xs sm:text-sm">{details.verificationNotes}</p>
                </div>
            )}

            {details.lastVerified && (
                <div className={`mt-3 sm:mt-4 text-xs ${theme.text.muted}`}>
                    Last verified: {new Date(details.lastVerified).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

export default VerificationProgress;