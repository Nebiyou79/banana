// src/components/UserVerificationBadge.tsx
import React, { useEffect, useState } from 'react';
import VerificationBadge, { VerificationStatus } from './VerificationBadge';
import verificationService, { VerificationStatusResponse } from '@/services/verificationService';

export interface UserVerificationBadgeProps {
    userId?: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    showTooltip?: boolean; // Added to match VerificationBadge props
    refreshInterval?: number;
    onStatusChange?: (status: VerificationStatus) => void;
    className?: string;
    isLoading?: boolean; // Added for external loading state
    customMessage?: string; // Added for custom tooltip messages
}

const UserVerificationBadge: React.FC<UserVerificationBadgeProps> = ({
    userId,
    size = 'md',
    showText = false,
    showTooltip = true,
    refreshInterval = 0,
    onStatusChange,
    className = '',
    isLoading: externalLoading,
    customMessage
}) => {
    const [verificationData, setVerificationData] = useState<VerificationStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVerificationStatus = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await verificationService.getVerificationStatus(userId);
            setVerificationData(data);

            if (onStatusChange) {
                onStatusChange(data.verificationStatus);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load verification status');
            console.error('Error fetching verification status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVerificationStatus();

        let intervalId: NodeJS.Timeout;
        if (refreshInterval > 0) {
            intervalId = setInterval(fetchVerificationStatus, refreshInterval);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [userId, refreshInterval]);

    // Use external loading state if provided
    const loading = externalLoading !== undefined ? externalLoading : isLoading;

    if (loading) {
        return (
            <div className={`inline-flex items-center rounded-full bg-gray-200 px-3 py-1.5 text-sm ${className}`}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                <span className="text-gray-600 text-xs">Loading...</span>
            </div>
        );
    }

    if (error && process.env.NODE_ENV === 'development') {
        return (
            <div className={`inline-flex items-center rounded-full bg-gray-200 px-3 py-1.5 text-sm ${className}`}>
                <span className="text-red-600 text-xs">Error: {error}</span>
            </div>
        );
    }

    // Use custom message if provided, otherwise use service message
    const tooltipMessage = customMessage || verificationData?.verificationMessage;

    return (
        <VerificationBadge
            status={verificationData?.verificationStatus || 'none'}
            size={size}
            showText={showText}
            showTooltip={showTooltip}
            customMessage={tooltipMessage}
            className={className}
        />
    );
};

export default UserVerificationBadge;