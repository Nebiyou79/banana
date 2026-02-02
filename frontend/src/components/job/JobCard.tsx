import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Job,
  jobService,
  SalaryMode,
  JobStatus,
} from '@/services/jobService';
import { Profile } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { getTheme, ThemeMode } from '@/utils/color';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import LoadingSpinner from '../LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/DropdownMenu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle, Archive, BarChart3, Bookmark, Briefcase, Building, Calendar, CheckCircle, CheckSquare, ChevronDown, ChevronUp, Clock, Copy, DollarSign, Edit3, Eye, EyeOff, FileText, Handshake, Hash, MapPin, Maximize2, Minimize2, MoreHorizontal, PauseCircle, Percent, Settings, Sparkles, Trash2, UserCheck, Users, UsersIcon, XCircle } from 'lucide-react';

interface JobCardProps {
  job: Job;
  ownerProfile?: Profile | null;
  showActions?: boolean;
  showMetrics?: boolean;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onViewStats?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  onToggleStatus?: (jobId: string, newStatus: JobStatus) => void;
  onDuplicate?: (jobId: string) => void;
  onShare?: (jobId: string, platform: string) => void;
  onChangeSalaryMode?: (jobId: string, mode: SalaryMode) => void;
  isOrganizationView?: boolean;
  themeMode?: ThemeMode;
  compact?: boolean;
  isLoading?: boolean;
  showAdvancedControls?: boolean;
}

// Management Metrics Component
interface MetricsDisplayProps {
  job: Job;
  themeMode?: ThemeMode;
  compact?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ job, themeMode = 'light', compact = false }) => {
  const theme = getTheme(themeMode);

  const candidatesNeeded = job.candidatesNeeded || 0;
  const applicationCount = job.applicationCount || 0;
  const candidatesRemaining = jobService.calculateCandidatesRemaining(job);
  const viewCount = job.viewCount || 0;
  const saveCount = job.saveCount || 0;

  const fillPercentage = candidatesNeeded > 0
    ? ((candidatesNeeded - candidatesRemaining) / candidatesNeeded) * 100
    : 0;

  const applicationRate = viewCount > 0 ? ((applicationCount / viewCount) * 100).toFixed(1) : '0.0';
  const saveRate = viewCount > 0 ? ((saveCount / viewCount) * 100).toFixed(1) : '0.0';

  const getCandidatesStatus = () => {
    if (candidatesRemaining > 0) {
      return {
        text: `${candidatesRemaining} remaining`,
        color: themeMode === 'dark' ? '#34D399' : '#059669',
        bgColor: themeMode === 'dark' ? '#065F46' : '#D1FAE5',
        icon: UserCheck,
      };
    } else if (candidatesRemaining === 0) {
      return {
        text: 'Filled',
        color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
        bgColor: themeMode === 'dark' ? '#1E40AF' : '#DBEAFE',
        icon: CheckSquare,
      };
    } else {
      return {
        text: `${Math.abs(candidatesRemaining)} over`,
        color: themeMode === 'dark' ? '#EF4444' : '#DC2626',
        bgColor: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2',
        icon: AlertTriangle,
      };
    }
  };

  const candidatesStatus = getCandidatesStatus();

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div
            className="p-2 rounded-lg text-center"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.secondary}`
            }}
          >
            <div className="text-sm font-semibold" style={{ color: theme.text.primary }}>
              {candidatesNeeded}
            </div>
            <div className="text-xs" style={{ color: theme.text.muted }}>
              Needed
            </div>
          </div>
          <div
            className="p-2 rounded-lg text-center"
            style={{
              backgroundColor: theme.bg.secondary,
              border: `1px solid ${theme.border.secondary}`
            }}
          >
            <div className="text-sm font-semibold" style={{ color: theme.text.primary }}>
              {applicationCount}
            </div>
            <div className="text-xs" style={{ color: theme.text.muted }}>
              Applied
            </div>
          </div>
          <div
            className="p-2 rounded-lg text-center"
            style={{
              backgroundColor: candidatesStatus.bgColor,
              border: `1px solid ${theme.border.secondary}`
            }}
          >
            <div
              className="text-sm font-semibold"
              style={{ color: candidatesStatus.color }}
            >
              {candidatesRemaining}
            </div>
            <div className="text-xs" style={{ color: theme.text.muted }}>
              Remaining
            </div>
          </div>
        </div>

        {candidatesNeeded > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: theme.text.muted }}>Progress</span>
              <span style={{ color: theme.text.primary }}>{Math.round(fillPercentage)}%</span>
            </div>
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(fillPercentage, 100)}%`,
                  backgroundColor: fillPercentage >= 100 ? '#3B82F6' :
                    fillPercentage >= 80 ? '#10B981' :
                      fillPercentage >= 50 ? '#F59E0B' : '#EF4444'
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                  {viewCount}
                </div>
                <div className="text-xs" style={{ color: theme.text.muted }}>
                  Views
                </div>
              </div>
              <Eye className="w-5 h-5" style={{ color: theme.text.muted }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                  {saveCount}
                </div>
                <div className="text-xs" style={{ color: theme.text.muted }}>
                  Saved
                </div>
              </div>
              <Bookmark className="w-5 h-5" style={{ color: theme.text.muted }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                  {applicationCount}
                </div>
                <div className="text-xs" style={{ color: theme.text.muted }}>
                  Applications
                </div>
              </div>
              <Users className="w-5 h-5" style={{ color: theme.text.muted }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                  {applicationRate}%
                </div>
                <div className="text-xs" style={{ color: theme.text.muted }}>
                  Apply Rate
                </div>
              </div>
              <Percent className="w-5 h-5" style={{ color: theme.text.muted }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UsersIcon className="w-4 h-4" style={{ color: theme.text.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
              Candidates Progress
            </span>
          </div>
          <div
            className="flex items-center px-2 py-1 rounded-md text-xs font-medium"
            style={{
              backgroundColor: candidatesStatus.bgColor,
              color: candidatesStatus.color
            }}
          >
            <candidatesStatus.icon className="w-3 h-3 mr-1" />
            {candidatesStatus.text}
          </div>
        </div>

        {candidatesNeeded > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: theme.text.muted }}>Target: {candidatesNeeded}</span>
              <span style={{ color: theme.text.muted }}>Applied: {applicationCount}</span>
              <span style={{ color: theme.text.muted }}>Remaining: {candidatesRemaining}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.text.muted }}>Fill Progress</span>
                <span style={{ color: theme.text.primary }}>{Math.round(fillPercentage)}% complete</span>
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(fillPercentage, 100)}%`,
                    backgroundColor: fillPercentage >= 100 ? '#3B82F6' :
                      fillPercentage >= 80 ? '#10B981' :
                        fillPercentage >= 50 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Salary Mode Editor Component
interface SalaryModeEditorProps {
  job: Job;
  onChange: (mode: SalaryMode) => void;
  themeMode?: ThemeMode;
  compact?: boolean;
}

const SalaryModeEditor: React.FC<SalaryModeEditorProps> = ({ job, onChange, themeMode = 'light', compact = false }) => {
  const theme = getTheme(themeMode);

  const getSalaryModeConfig = (mode: SalaryMode) => {
    switch (mode) {
      case SalaryMode.RANGE:
        return {
          label: 'Salary Range',
          icon: DollarSign,
          color: themeMode === 'dark' ? '#34D399' : '#059669',
          description: 'Show specific salary range to candidates',
          preview: jobService.getFormattedSalary(job)
        };
      case SalaryMode.HIDDEN:
        return {
          label: 'Salary Hidden',
          icon: EyeOff,
          color: themeMode === 'dark' ? '#9CA3AF' : '#6B7280',
          description: 'Hide salary details from candidates',
          preview: 'Salary hidden 👁️‍🗨️'
        };
      case SalaryMode.NEGOTIABLE:
        return {
          label: 'Negotiable',
          icon: Handshake,
          color: themeMode === 'dark' ? '#F59E0B' : '#D97706',
          description: 'Show as negotiable based on experience',
          preview: 'Negotiable 🤝'
        };
      case SalaryMode.COMPANY_SCALE:
        return {
          label: 'Company Scale',
          icon: Building,
          color: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
          description: 'Show as per company pay scale',
          preview: 'Company scale 🏢'
        };
      default:
        return {
          label: 'Unknown',
          icon: DollarSign,
          color: themeMode === 'dark' ? '#9CA3AF' : '#6B7280',
          description: 'Salary mode not specified',
          preview: 'Not specified'
        };
    }
  };

  const currentConfig = getSalaryModeConfig(job.salaryMode);

  if (compact) {
    return (
      <div
        className="p-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: theme.bg.secondary,
          border: `1px solid ${theme.border.secondary}`
        }}
        onClick={() => onChange(job.salaryMode === SalaryMode.RANGE ? SalaryMode.HIDDEN :
          job.salaryMode === SalaryMode.HIDDEN ? SalaryMode.NEGOTIABLE :
            job.salaryMode === SalaryMode.NEGOTIABLE ? SalaryMode.COMPANY_SCALE : SalaryMode.RANGE)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <currentConfig.icon className="w-4 h-4 mr-2" style={{ color: currentConfig.color }} />
            <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
              {currentConfig.label}
            </span>
          </div>
          <Settings className="w-3 h-3" style={{ color: theme.text.muted }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4" style={{ color: theme.text.primary }} />
          <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
            Salary Mode
          </span>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-md"
          style={{
            backgroundColor: currentConfig.color,
            color: 'white'
          }}
        >
          {currentConfig.label}
        </span>
      </div>

      <div className="space-y-2">
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: theme.bg.secondary,
            border: `1px solid ${theme.border.secondary}`
          }}
        >
          <div className="text-sm mb-2" style={{ color: theme.text.muted }}>
            Candidate View:
          </div>
          <div className="text-lg font-semibold" style={{ color: currentConfig.color }}>
            {currentConfig.preview}
          </div>
        </div>

        <div className="text-xs" style={{ color: theme.text.muted }}>
          {currentConfig.description}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.values(SalaryMode).map((mode) => {
            const config = getSalaryModeConfig(mode);
            const isActive = job.salaryMode === mode;

            return (
              <Button
                key={mode}
                onClick={() => onChange(mode)}
                className={`p-2 rounded-lg text-sm text-center transition-all ${isActive ? 'ring-2 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}
                style={{
                  backgroundColor: isActive ? config.color : theme.bg.secondary,
                  border: `1px solid ${theme.border.secondary}`,
                  color: isActive ? 'white' : theme.text.primary,
                }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <config.icon className="w-3 h-3" />
                  <span>{config.label}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Avatar Component
interface AvatarProps {
  job: Job;
  ownerProfile?: Profile | null;
  themeMode?: ThemeMode;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  job,
  ownerProfile,
  themeMode = 'light',
  size = 'md',
  bordered = false
}) => {
  const theme = getTheme(themeMode);

  const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
  const ownerName = ownerInfo?.name || 'Unknown';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const avatarUrl = getAvatarUrl({
    profile: ownerProfile,
    name: ownerName,
    fallbackColor: job.jobType === 'organization' ? '#4F46E5' : '#10B981',
    size: size === 'sm' ? 32 : size === 'md' ? 48 : 64,
  });

  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden ${bordered ? 'border' : ''}`}
      style={{ borderColor: bordered ? theme.border.secondary : 'transparent' }}>
      <img
        src={avatarUrl}
        alt={ownerName}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Main JobCard Component (Enhanced for Employer Dashboard)
const JobCard: React.FC<JobCardProps> = ({
  job,
  ownerProfile,
  showActions = false,
  showMetrics = true,
  onEdit,
  onDelete,
  onViewStats,
  onViewApplications,
  onToggleStatus,
  onDuplicate,
  onShare,
  onChangeSalaryMode,
  isOrganizationView = false,
  themeMode = 'light',
  compact = false,
  isLoading = false,
  showAdvancedControls = false
}) => {
  const theme = getTheme(themeMode);
  const { toast } = useToast();
  const router = useRouter();

  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
  const ownerName = ownerInfo?.name || 'Unknown';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status: JobStatus) => {
    const configs = {
      [JobStatus.DRAFT]: {
        label: 'Draft',
        color: themeMode === 'dark' ? '#6B7280' : '#6B7280',
        bgColor: themeMode === 'dark' ? '#374151' : '#F3F4F6',
        icon: FileText,
        actionLabel: 'Publish'
      },
      [JobStatus.ACTIVE]: {
        label: 'Active',
        color: themeMode === 'dark' ? '#34D399' : '#059669',
        bgColor: themeMode === 'dark' ? '#065F46' : '#D1FAE5',
        icon: CheckCircle,
        actionLabel: 'Pause'
      },
      [JobStatus.PAUSED]: {
        label: 'Paused',
        color: themeMode === 'dark' ? '#F59E0B' : '#D97706',
        bgColor: themeMode === 'dark' ? '#92400E' : '#FFEDD5',
        icon: PauseCircle,
        actionLabel: 'Resume'
      },
      [JobStatus.CLOSED]: {
        label: 'Closed',
        color: themeMode === 'dark' ? '#EF4444' : '#DC2626',
        bgColor: themeMode === 'dark' ? '#7F1D1D' : '#FEE2E2',
        icon: XCircle,
        actionLabel: 'Reopen'
      },
      [JobStatus.ARCHIVED]: {
        label: 'Archived',
        color: themeMode === 'dark' ? '#8B5CF6' : '#7C3AED',
        bgColor: themeMode === 'dark' ? '#5B21B6' : '#EDE9FE',
        icon: Archive,
        actionLabel: 'Restore'
      }
    };

    return configs[status] || configs[JobStatus.DRAFT];
  };

  const statusConfig = getStatusConfig(job.status);

  const getEditUrl = () => {
    if (isOrganizationView) {
      return `/dashboard/organization/jobs/edit/${job._id}`;
    }
    return job.jobType === 'organization'
      ? `/dashboard/organization/jobs/edit/${job._id}`
      : `/dashboard/company/jobs/edit/${job._id}`;
  };

  const getViewUrl = () => {
    if (isOrganizationView) {
      return `/dashboard/organization/jobs/${job._id}`;
    }
    return job.jobType === 'organization'
      ? `/dashboard/organization/jobs/${job._id}`
      : `/dashboard/company/jobs/${job._id}`;
  };

  const handleStatusChange = useCallback(async (newStatus: JobStatus) => {
    try {
      onToggleStatus?.(job._id, newStatus);
      toast({
        title: 'Status Updated',
        description: `Job status changed to ${getStatusConfig(newStatus).label}`,
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive'
      });
    }
  }, [job._id, onToggleStatus, toast]);

  const handleSalaryModeChange = useCallback(async (mode: SalaryMode) => {
    try {
      onChangeSalaryMode?.(job._id, mode);
      toast({
        title: 'Salary Mode Updated',
        description: `Salary display changed to ${mode}`,
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update salary mode',
        variant: 'destructive'
      });
    }
  }, [job._id, onChangeSalaryMode, toast]);

  const handleDuplicate = useCallback(() => {
    onDuplicate?.(job._id);
    toast({
      title: 'Job Duplicated',
      description: 'Creating a copy of this job...',
      variant: 'default'
    });
  }, [job._id, onDuplicate, toast]);

  if (isLoading) {
    return (
      <div
        className="rounded-xl border p-4 sm:p-6"
        style={{
          borderColor: theme.border.primary,
          backgroundColor: theme.bg.primary
        }}
      >
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner
            size="md"
            themeMode={themeMode}
            showText
            text="Loading job..."
          />
        </div>
      </div>
    );
  }

  // Compact View for Dashboard Lists
  if (compact) {
    return (
      <div
        className="rounded-lg border p-3 sm:p-4 hover:shadow-md transition-all duration-200"
        style={{
          borderColor: theme.border.primary,
          backgroundColor: theme.bg.primary,
          boxShadow: themeMode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
            <Avatar
              job={job}
              ownerProfile={ownerProfile}
              themeMode={themeMode}
              size="sm"
              bordered
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-1 mb-0.5" style={{ color: theme.text.primary }}>
                <Link href={getViewUrl()} className="hover:underline">
                  {job.title}
                </Link>
              </h3>
              <div className="flex items-center space-x-1 text-xs">
                <span style={{ color: theme.text.secondary }}>{ownerName}</span>
                {ownerInfo?.verified && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1 ml-2">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color
              }}
            >
              <statusConfig.icon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </span>
            <span className="text-xs" style={{ color: theme.text.muted }}>
              {formatDate(job.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="flex items-center" style={{ color: theme.text.muted }}>
              <MapPin className="w-3 h-3 mr-1" />
              {job.location?.city || job.location?.region || 'Remote'}
            </span>
            <span className="flex items-center" style={{ color: theme.text.muted }}>
              <Eye className="w-3 h-3 mr-1" />
              {job.viewCount || 0}
            </span>
            <span className="flex items-center" style={{ color: theme.text.muted }}>
              <Users className="w-3 h-3 mr-1" />
              {job.applicationCount || 0}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {showActions && (
              <Link
                href={getViewUrl()}
                className="px-2 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                  color: 'white'
                }}
              >
                Manage
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full Dashboard View
  return (
    <div
      className="rounded-xl border p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
      style={{
        borderColor: theme.border.primary,
        backgroundColor: theme.bg.primary,
        boxShadow: themeMode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Header with Status and Quick Actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
          <Avatar
            job={job}
            ownerProfile={ownerProfile}
            themeMode={themeMode}
            size="md"
            bordered
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1.5 sm:mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold line-clamp-2" style={{ color: theme.text.primary }}>
                  <Link href={getViewUrl()} className="hover:underline">
                    {job.title}
                  </Link>
                </h3>
                <div className="flex items-center space-x-1.5 sm:space-x-2 mt-1">
                  <span className="text-xs sm:text-sm" style={{ color: theme.text.secondary }}>
                    {jobService.getJobTypeDisplayLabel(job)}
                  </span>
                  {job.featured && (
                    <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {job.urgent && (
                    <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Urgent
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1.5 sm:space-y-2 ml-2 sm:ml-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs" style={{ color: theme.text.muted }}>
                    Updated {formatDate(job.updatedAt)}
                  </span>
                  {showAdvancedControls && (
                    <button
                      onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                      className={`p-1 rounded ${isMetricsExpanded ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                      style={{ color: theme.text.secondary }}
                    >
                      {isMetricsExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium"
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.color
                  }}
                >
                  <statusConfig.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
              <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text.secondary }}>
                {ownerName}
              </p>
              {ownerInfo?.verified && (
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              )}
              {job.jobNumber && (
                <span
                  className="inline-flex items-center text-xs bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md"
                  style={{ color: theme.text.muted }}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {job.jobNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Short Description */}
      {job.shortDescription && (
        <div className="mb-4">
          <p className="text-sm line-clamp-2" style={{ color: theme.text.secondary }}>
            {job.shortDescription}
          </p>
        </div>
      )}

      {/* Quick Info Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <MapPin className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
          <span>{job.location?.city || job.location?.region || 'Remote'}</span>
        </div>
        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <Briefcase className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
          <span>{jobService.getJobTypeLabel(job.type)}</span>
        </div>
        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <Calendar className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
          <span>Posted {formatDate(job.createdAt)}</span>
        </div>
        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <DollarSign className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
          <span>{jobService.formatSalary(job.salary)}</span>
        </div>
      </div>

      {/* Expanded Metrics Section */}
      {showAdvancedControls && isMetricsExpanded && (
        <div className="mb-4 p-4 rounded-lg border" style={{
          backgroundColor: theme.bg.secondary,
          borderColor: theme.border.secondary
        }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Candidates Management */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold" style={{ color: theme.text.primary }}>
                Candidates Management
              </h4>
              <MetricsDisplay job={job} themeMode={themeMode} />
            </div>

            {/* Salary Mode Management */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold" style={{ color: theme.text.primary }}>
                Salary Settings
              </h4>
              <SalaryModeEditor
                job={job}
                onChange={handleSalaryModeChange}
                themeMode={themeMode}
              />
            </div>
          </div>
        </div>
      )}

      {/* Compact Metrics Bar */}
      {showMetrics && !isMetricsExpanded && (
        <div className="mb-4">
          <MetricsDisplay job={job} themeMode={themeMode} compact />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t"
        style={{ borderColor: theme.border.secondary }}>
        <div className="flex items-center space-x-3 text-xs sm:text-sm">
          <span className="flex items-center" style={{ color: theme.text.muted }}>
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" style={{ color: theme.text.muted }} />
            {job.viewCount || 0} views
          </span>
          <span className="flex items-center" style={{ color: theme.text.muted }}>
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" style={{ color: theme.text.muted }} />
            {job.applicationCount || 0} applications
          </span>
          {job.applicationDeadline && (
            <span className="flex items-center" style={{ color: theme.text.muted }}>
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" style={{ color: theme.text.muted }} />
              Due {new Date(job.applicationDeadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showActions ? (
            <>
              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <MoreHorizontal className="w-4 h-4" style={{ color: theme.text.secondary }} />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="shadow-lg min-w-[200px]"
                  style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.primary,
                    boxShadow: themeMode === 'dark' ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => router.push(getViewUrl())}
                    style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}
                  >
                    <Eye className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                    View Details
                  </DropdownMenuItem>

                  {onViewApplications && (
                    <DropdownMenuItem
                      onClick={() => onViewApplications(job._id)}
                      style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}
                    >
                      <Users className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                      View Applications ({job.applicationCount || 0})
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />

                  <DropdownMenuItem
                    onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                    style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}
                  >
                    {isMetricsExpanded ? (
                      <>
                        <Minimize2 className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                        Hide Metrics
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                        Show Metrics
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}>
                      <statusConfig.icon className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                      Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                      style={{
                        backgroundColor: theme.bg.primary,
                        borderColor: theme.border.primary,
                        boxShadow: themeMode === 'dark' ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <DropdownMenuRadioGroup
                        value={job.status}
                        onValueChange={(value) => handleStatusChange(value as JobStatus)}
                      >
                        {Object.values(JobStatus).map((status) => {
                          const config = getStatusConfig(status);
                          return (
                            <DropdownMenuRadioItem
                              key={status}
                              value={status}
                              style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}
                            >
                              <config.icon className="w-4 h-4 mr-2" style={{ color: config.color }} />
                              {config.label}
                            </DropdownMenuRadioItem>
                          );
                        })}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />

                  {onEdit ? (
                    <DropdownMenuItem
                      onClick={() => onEdit(job._id)}
                      style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                      Edit Job
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href={getEditUrl()} style={{ color: theme.text.primary, backgroundColor: theme.bg.primary }}>
                        <Edit3 className="w-4 h-4 mr-2" style={{ color: theme.text.secondary }} />
                        Edit Job
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => onDelete?.(job._id)}
                    className="text-red-600 focus:text-red-600"
                    style={{ backgroundColor: theme.bg.primary }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick Action Buttons */}
              <div className="flex items-center space-x-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewApplications?.(job._id)}
                        className="px-2"
                        style={{
                          borderColor: theme.border.primary,
                          color: theme.text.secondary
                        }}
                      >
                        <Users className="w-4 h-4" style={{ color: theme.text.secondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      style={{
                        backgroundColor: theme.bg.primary,
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                    >
                      View Applications
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewStats?.(job._id)}
                        className="px-2"
                        style={{
                          borderColor: theme.border.primary,
                          color: theme.text.secondary
                        }}
                      >
                        <BarChart3 className="w-4 h-4" style={{ color: theme.text.secondary }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      style={{
                        backgroundColor: theme.bg.primary,
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                    >
                      View Analytics
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          ) : (
            <Link
              href={getViewUrl()}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              style={{
                backgroundColor: themeMode === 'dark' ? '#3B82F6' : '#2563EB',
                color: 'white'
              }}
            >
              Manage Job
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton for Employer Dashboard
export const JobCardSkeleton: React.FC<{ themeMode?: ThemeMode }> = ({ themeMode = 'light' }) => {
  const theme = getTheme(themeMode);

  return (
    <div
      className="rounded-xl border p-6 animate-pulse"
      style={{
        borderColor: theme.border.primary,
        backgroundColor: theme.bg.primary
      }}
    >
      <div className="flex items-start space-x-3 mb-4">
        <div
          className="w-12 h-12 rounded-full"
          style={{ backgroundColor: theme.bg.secondary }}
        />
        <div className="flex-1">
          <div
            className="h-6 rounded mb-2 w-3/4"
            style={{ backgroundColor: theme.bg.secondary }}
          />
          <div
            className="h-4 rounded w-1/3"
            style={{ backgroundColor: theme.bg.secondary }}
          />
        </div>
      </div>

      <div
        className="h-4 rounded mb-4 w-1/2"
        style={{ backgroundColor: theme.bg.secondary }}
      />

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 rounded"
            style={{ backgroundColor: theme.bg.secondary }}
          />
        ))}
      </div>

      <div
        className="h-16 rounded mb-6"
        style={{ backgroundColor: theme.bg.secondary }}
      />

      <div className="flex justify-between">
        <div className="flex space-x-2">
          <div
            className="h-8 w-20 rounded"
            style={{ backgroundColor: theme.bg.secondary }}
          />
          <div
            className="h-8 w-20 rounded"
            style={{ backgroundColor: theme.bg.secondary }}
          />
        </div>
        <div
          className="h-8 w-32 rounded"
          style={{ backgroundColor: theme.bg.secondary }}
        />
      </div>
    </div>
  );
};

// Quick Stats Component for Dashboard Overview
export const JobQuickStats: React.FC<{ job: Job; themeMode?: ThemeMode }> = ({ job, themeMode = 'light' }) => {
  const theme = getTheme(themeMode);

  const stats = [
    {
      label: 'Views',
      value: job.viewCount || 0,
      icon: Eye,
      color: themeMode === 'dark' ? '#3B82F6' : '#2563EB'
    },
    {
      label: 'Saves',
      value: job.saveCount || 0,
      icon: Bookmark,
      color: themeMode === 'dark' ? '#8B5CF6' : '#7C3AED'
    },
    {
      label: 'Applications',
      value: job.applicationCount || 0,
      icon: Users,
      color: themeMode === 'dark' ? '#10B981' : '#059669'
    },
    {
      label: 'Conversion',
      value: job.viewCount ? `${((job.applicationCount / job.viewCount) * 100).toFixed(1)}%` : '0%',
      icon: Percent,
      color: themeMode === 'dark' ? '#F59E0B' : '#D97706'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="p-3 rounded-lg border text-center"
          style={{
            backgroundColor: theme.bg.secondary,
            borderColor: theme.border.secondary
          }}
        >
          <div className="flex items-center justify-center mb-1">
            <stat.icon className="w-4 h-4 mr-1" style={{ color: stat.color }} />
            <span className="text-lg font-bold" style={{ color: theme.text.primary }}>
              {stat.value}
            </span>
          </div>
          <div className="text-xs" style={{ color: theme.text.muted }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobCard;