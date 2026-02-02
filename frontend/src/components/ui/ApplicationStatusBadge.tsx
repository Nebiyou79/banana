// components/ui/ApplicationStatusBadge.tsx
import React from 'react';
import { Job, jobService } from '@/services/jobService';
import { getStatusColors, getStatusIcon } from '@/utils/jobApplicationUtils';
import { colorClasses } from '@/utils/color';
import { IconButton } from '@mui/material';

interface ApplicationStatusBadgeProps {
  job: Job;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  themeMode?: 'light' | 'dark';
  className?: string;
}

const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  job,
  showIcon = true,
  showText = true,
  size = 'md',
  themeMode = 'light',
  className = ''
}) => {
  // Get application status from jobService
  const getApplicationStatus = () => {
    const status = jobService.getApplicationStatus(job);
    
    if (status.statusKey === 'closed') {
      return {
        canApply: false,
        text: 'Closed',
        color: themeMode === 'dark' ? '#9CA3AF' : '#6B7280',
        bgColor: themeMode === 'dark' ? '#4B5563' : '#9CA3AF',
        icon: getStatusIcon('closed')
      };
    }
    
    if (status.statusKey === 'inactive') {
      return {
        canApply: false,
        text: 'Inactive',
        color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626',
        bgColor: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2',
        icon: getStatusIcon('inactive')
      };
    }
    
    if (status.statusKey === 'expired') {
      return {
        canApply: false,
        text: 'Expired',
        color: themeMode === 'dark' ? '#FCA5A5' : '#DC2626',
        bgColor: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2',
        icon: getStatusIcon('expired')
      };
    }
    
    return {
      canApply: true,
      text: 'Open',
      color: themeMode === 'dark' ? '#34D399' : '#059669',
      bgColor: themeMode === 'dark' ? '#065F46' : '#D1FAE5',
      icon: getStatusIcon('open')
    };
  };

  const applicationStatus = getApplicationStatus();
  const Icon = applicationStatus.icon;
  const colors = getStatusColors(jobService.getApplicationStatus(job).statusKey, themeMode);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: applicationStatus.bgColor,
        color: applicationStatus.color,
        borderColor: colors.border
      }}
    >
      {showIcon && <IconButton className={`${iconSize[size]} mr-1.5`} />}
      {showText && <span>{applicationStatus.text}</span>}
    </span>
  );
};

export default ApplicationStatusBadge;