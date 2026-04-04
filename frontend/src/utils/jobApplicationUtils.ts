// utils/jobApplicationUtils.ts
import { Job } from '@/services/jobService';
import { jobService } from '@/services/jobService';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export interface JobApplicationDetails {
  canApply: boolean;
  statusKey: 'closed' | 'inactive' | 'expired' | 'open';
  title: string;
  description: string;
  actionText: string;
  isDisabled: boolean;
  deadline: Date | null;
  message: string;
}

export const getJobApplicationDetails = (job: Job): JobApplicationDetails => {
  const baseStatus = jobService.getApplicationStatus(job);
  
  let statusConfig = {
    canApply: baseStatus.canApply,
    title: '',
    description: '',
    actionText: '',
    isDisabled: false
  };
  
  switch (baseStatus.statusKey) {
    case 'closed':
      statusConfig = {
        ...statusConfig,
        title: 'Applications Closed',
        description: 'The employer has temporarily paused accepting applications for this position.',
        actionText: 'Applications Closed',
        isDisabled: true
      };
      break;
      
    case 'inactive':
      statusConfig = {
        ...statusConfig,
        title: 'Position Not Active',
        description: 'This position is not currently active.',
        actionText: 'Not Accepting Applications',
        isDisabled: true
      };
      break;
      
    case 'expired':
      statusConfig = {
        ...statusConfig,
        title: 'Deadline Passed',
        description: 'The application deadline has passed.',
        actionText: 'Deadline Passed',
        isDisabled: true
      };
      break;
      
    case 'open':
      statusConfig = {
        ...statusConfig,
        title: 'Accepting Applications',
        description: job.applicationDeadline 
          ? `Applications are open until ${new Date(job.applicationDeadline).toLocaleDateString()}`
          : 'Applications are open',
        actionText: 'Apply Now',
        isDisabled: false
      };
      break;
  }
  
  return {
    ...baseStatus,
    ...statusConfig,
    deadline: job.applicationDeadline ? new Date(job.applicationDeadline) : null
  };
};

// Helper to get status colors based on theme mode
export const getStatusColors = (
  statusKey: 'closed' | 'inactive' | 'expired' | 'open',
  themeMode: 'light' | 'dark' = 'light'
) => {
  if (themeMode === 'dark') {
    switch (statusKey) {
      case 'closed':
        return {
          bg: '#4B5563',
          text: '#E5E7EB',
          border: '#6B7280'
        };
      case 'inactive':
      case 'expired':
        return {
          bg: '#7F1D1D',
          text: '#FCA5A5',
          border: '#991B1B'
        };
      case 'open':
        return {
          bg: '#065F46',
          text: '#34D399',
          border: '#059669'
        };
      default:
        return {
          bg: '#374151',
          text: '#D1D5DB',
          border: '#4B5563'
        };
    }
  } else {
    switch (statusKey) {
      case 'closed':
        return {
          bg: '#9CA3AF',
          text: '#FFFFFF',
          border: '#D1D5DB'
        };
      case 'inactive':
      case 'expired':
        return {
          bg: '#FEE2E2',
          text: '#DC2626',
          border: '#FCA5A5'
        };
      case 'open':
        return {
          bg: '#D1FAE5',
          text: '#059669',
          border: '#34D399'
        };
      default:
        return {
          bg: '#F3F4F6',
          text: '#374151',
          border: '#D1D5DB'
        };
    }
  }
};

// Get icon based on status
export const getStatusIcon = (statusKey: 'closed' | 'inactive' | 'expired' | 'open') => {
  
  switch (statusKey) {
    case 'closed': return Lock;
    case 'inactive': return XCircle;
    case 'expired': return Clock;
    case 'open': return CheckCircle;
    default: return XCircle;
  }
};

// Format deadline for display
export const formatDeadline = (deadline: Date | null): string => {
  if (!deadline) return '';
  
  const now = new Date();
  const diffInHours = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 0) {
    return 'Deadline passed';
  } else if (diffInHours < 24) {
    return `Closes in ${diffInHours} hours`;
  } else if (diffInHours < 168) {
    return `Closes in ${Math.floor(diffInHours / 24)} days`;
  } else {
    return `Closes ${deadline.toLocaleDateString()}`;
  }
};