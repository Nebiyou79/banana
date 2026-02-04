import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/solid';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import { useVerification } from '@/hooks/useVerification';

export type VerificationStatus = 'none' | 'partial' | 'full';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface VerificationBadgeProps {
    status?: VerificationStatus;
    size?: BadgeSize;
    showText?: boolean;
    showTooltip?: boolean;
    customMessage?: string;
    className?: string;
    userId?: string;
    autoFetch?: boolean;
    themeMode?: ThemeMode;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
    status: propStatus,
    size = 'md',
    showText = false,
    showTooltip = true,
    customMessage,
    className = '',
    userId,
    autoFetch = true,
    themeMode = 'light'
}) => {
    const theme = getTheme(themeMode);
    const [showTooltipState, setShowTooltipState] = useState(false);

    // Use the verification hook if autoFetch is enabled and no prop status provided
    const { verificationData, loading, verificationStatus: hookStatus } = useVerification();

    // Determine which status to use
    const status = propStatus || (autoFetch ? hookStatus : 'none');

    // Determine tooltip message
    const getTooltipMessage = () => {
        if (customMessage) return customMessage;

        if (verificationData?.verificationMessage) {
            return verificationData.verificationMessage;
        }

        switch (status) {
            case 'full':
                return 'Your profile is fully verified and trusted';
            case 'partial':
                return 'Your profile is verified but not your social profile. Complete your verification.';
            case 'none':
            default:
                return 'Both profile and social profile are not verified. Complete your verification.';
        }
    };

    const getConfig = (mode: ThemeMode) => {
        const tooltip = getTooltipMessage();

        switch (status) {
            case 'full':
                return {
                    icon: CheckCircleIcon,
                    text: 'Fully Verified',
                    bgColor: colorClasses.bg.teal,
                    textColor: 'text-white',
                    iconColor: 'text-white',
                    tooltip,
                    borderColor: mode === 'dark' ? '#10B981' : '#059669'
                };
            case 'partial':
                return {
                    icon: ExclamationCircleIcon,
                    text: 'Partially Verified',
                    bgColor: colorClasses.bg.goldenMustard,
                    textColor: mode === 'dark' ? 'text-yellow-300' : 'text-yellow-800',
                    iconColor: mode === 'dark' ? 'text-yellow-300' : 'text-yellow-800',
                    tooltip,
                    borderColor: mode === 'dark' ? '#F59E0B' : '#D97706'
                };
            case 'none':
            default:
                return {
                    icon: XCircleIcon,
                    text: 'Not Verified',
                    bgColor: colorClasses.bg.orange,
                    textColor: 'text-white',
                    iconColor: 'text-white',
                    tooltip,
                    borderColor: mode === 'dark' ? '#EF4444' : '#DC2626'
                };
        }
    };

    const config = getConfig(themeMode);
    const Icon = config.icon;

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1 text-xs',
            icon: 'h-3 w-3',
            text: 'text-xs',
            tooltip: 'text-xs max-w-[150px]',
            tooltipText: 'text-xs'
        },
        md: {
            container: 'px-3 py-1.5 text-sm',
            icon: 'h-4 w-4',
            text: 'text-sm',
            tooltip: 'text-sm max-w-[200px]',
            tooltipText: 'text-sm'
        },
        lg: {
            container: 'px-4 py-2 text-base',
            icon: 'h-5 w-5',
            text: 'text-base',
            tooltip: 'text-base max-w-[250px]',
            tooltipText: 'text-base'
        }
    };

    // Show loading state
    if (loading && autoFetch && !propStatus) {
        return (
            <div
                className={`inline-flex items-center rounded-full font-medium ${theme.bg.secondary} ${theme.text.secondary} ${sizeClasses[size].container} ${className}`}
                style={{
                    border: `1px solid ${theme.border.secondary}`
                }}
            >
                <div className={`animate-pulse rounded-full ${sizeClasses[size].icon} ${theme.bg.gray400} mr-2`} />
                {showText && (
                    <div
                        className="animate-pulse rounded"
                        style={{
                            backgroundColor: theme.bg.gray400,
                            width: '3rem',
                            height: '0.75rem'
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="relative inline-block">
            <div
                className={`
                    inline-flex items-center rounded-full font-medium border
                    ${config.bgColor} ${config.textColor}
                    ${sizeClasses[size].container}
                    ${showTooltip ? 'cursor-help' : ''}
                    transition-all duration-200 hover:opacity-90
                    ${className}
                `}
                style={{
                    borderColor: config.borderColor
                }}
                onMouseEnter={() => setShowTooltipState(true)}
                onMouseLeave={() => setShowTooltipState(false)}
                onFocus={() => setShowTooltipState(true)}
                onBlur={() => setShowTooltipState(false)}
                role="status"
                aria-label={`Verification status: ${config.text}`}
                tabIndex={0}
            >
                <Icon
                    className={`${sizeClasses[size].icon} ${config.iconColor} mr-2`}
                    aria-hidden="true"
                />
                {showText && (
                    <span className={`font-semibold ${sizeClasses[size].text}`}>
                        {config.text}
                    </span>
                )}
                {showTooltip && !showText && (
                    <InformationCircleIcon
                        className={`${sizeClasses[size].icon} ${config.iconColor} ml-1`}
                    />
                )}
            </div>

            {showTooltip && showTooltipState && (
                <div className={`absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 ${sizeClasses[size].tooltip}`}>
                    <div className="relative">
                        <div
                            className={`rounded-lg px-3 py-2 shadow-lg ${themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-900'} ${themeMode === 'dark' ? 'text-white' : 'text-white'}`}
                            style={{
                                border: `1px solid ${themeMode === 'dark' ? '#4B5563' : '#374151'}`,
                            }}
                        >
                            <div className={`font-medium ${sizeClasses[size].tooltipText}`}>
                                {config.tooltip}
                            </div>
                            <div
                                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent"
                                style={{
                                    borderTopColor: themeMode === 'dark' ? '#1F2937' : '#111827'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationBadge;