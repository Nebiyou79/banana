// components/VerificationBadge.tsx
import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/solid';
import { colorClasses } from '@/utils/color';
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
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
    status: propStatus,
    size = 'md',
    showText = false,
    showTooltip = true,
    customMessage,
    className = '',
    userId,
    autoFetch = true
}) => {
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

    const getConfig = () => {
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
                    iconBg: 'bg-green-500'
                };
            case 'partial':
                return {
                    icon: ExclamationCircleIcon,
                    text: 'Partially Verified',
                    bgColor: colorClasses.bg.goldenMustard,
                    textColor: 'text-yellow-800',
                    iconColor: 'text-yellow-800',
                    tooltip,
                    iconBg: 'bg-yellow-500'
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
                    iconBg: 'bg-red-500'
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1 text-xs',
            icon: 'h-3 w-3',
            text: 'text-xs',
            tooltip: 'text-xs max-w-[150px]'
        },
        md: {
            container: 'px-3 py-1.5 text-sm',
            icon: 'h-4 w-4',
            text: 'text-sm',
            tooltip: 'text-sm max-w-[200px]'
        },
        lg: {
            container: 'px-4 py-2 text-base',
            icon: 'h-5 w-5',
            text: 'text-base',
            tooltip: 'text-base max-w-[250px]'
        }
    };

    // Show loading state
    if (loading && autoFetch && !propStatus) {
        return (
            <div className={`inline-flex items-center rounded-full font-medium bg-gray-200 text-gray-700 ${sizeClasses[size].container} ${className}`}>
                <div className={`animate-pulse rounded-full ${sizeClasses[size].icon} bg-gray-300 mr-2`} />
                {showText && (
                    <div className="animate-pulse h-3 w-16 bg-gray-300 rounded"></div>
                )}
            </div>
        );
    }

    return (
        <div className="relative inline-block">
            <div
                className={`
                    inline-flex items-center rounded-full font-medium
                    ${config.bgColor} ${config.textColor}
                    ${sizeClasses[size].container}
                    ${showTooltip ? 'cursor-help' : ''}
                    transition-all duration-200 hover:opacity-90
                    ${className}
                `}
                onMouseEnter={() => setShowTooltipState(true)}
                onMouseLeave={() => setShowTooltipState(false)}
                onFocus={() => setShowTooltipState(true)}
                onBlur={() => setShowTooltipState(false)}
                role="status"
                aria-label={`Verification status: ${config.text}`}
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
                <div className={`absolute z-50 ${sizeClasses[size].tooltip}`}>
                    <div className="relative">
                        <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-lg">
                            <div className="font-medium">{config.tooltip}</div>
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-900"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationBadge;