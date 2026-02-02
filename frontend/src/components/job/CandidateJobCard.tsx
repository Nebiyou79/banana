/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Job,
  jobService,
  Organization,
  SalaryMode,
  ApplicationStatusReason,
} from '@/services/jobService';
import { Profile } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/social/ui/Button';
import {
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Users,
  Bookmark,
  BookmarkCheck,
  FileCheck,
  ExternalLink,
  Sparkles,
  DollarSign,
  Lock,
  XCircle,
  AlertCircle,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Link as LinkIcon,
  EyeOff,
  Handshake,
  Building,
} from 'lucide-react';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import LoadingSpinner from '../LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { candidateService } from '@/services/candidateService';

interface CandidateJobCardProps {
  job: Job;
  ownerProfile?: Profile | null;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string, saved: boolean) => void;
  onShare?: (jobId: string, platform: string) => void;
  isSaved?: boolean;
  showSaveButton?: boolean;
  compact?: boolean;
  className?: string;
  userApplications?: any[];
  themeMode?: ThemeMode;
  variant?: 'default' | 'compact' | 'featured' | 'detailed';
}

// Share Menu Component
interface ShareMenuProps {
  job: Job;
  onShare?: (platform: string) => void;
  themeMode?: ThemeMode;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ job, onShare, themeMode = 'light' }) => {
  const { toast } = useToast();
  const theme = getTheme(themeMode);

  const getJobPageUrl = () => {
    return `${window.location.origin}/dashboard/candidate/jobs/${job._id}`;
  };

  const getShareText = (platform: string = 'standard') => {
    const owner = job.jobType === 'company' ? job.company?.name : job.organization?.name;
    const salary = jobService.getFormattedSalary(job);
    const location = job.location?.region === 'international'
      ? '🌍 Remote Worldwide'
      : `${job.location?.city || job.location?.region}, ${job.location?.country}`;
    const description = job.shortDescription || 'Check out this opportunity!';

    // Multi-line formatted text for better sharing
    const fullText = `🏢 ${job.title}
📋 ${owner}
💰 ${salary}
📍 ${location}
📝 ${description.substring(0, 150)}${description.length > 150 ? '...' : ''}
🔗 ${getJobPageUrl()}`;

    const shortText = `Check out this ${jobService.getJobTypeDisplayLabel(job)}: "${job.title}" at ${owner}`;

    // Return appropriate text based on platform
    if (platform === 'copy' || platform === 'telegram' || platform === 'web-share') {
      return fullText;
    }

    // For social platforms that primarily share URLs, use shorter text
    return shortText;
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getJobPageUrl())}&quote=${encodeURIComponent(getShareText('facebook'))}`;
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('facebook');
  };

  const shareOnTwitter = () => {
    const text = getShareText('twitter');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getJobPageUrl())}`;
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('twitter');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getJobPageUrl())}`;
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('linkedin');
  };

  const shareOnTelegram = () => {
    const text = getShareText('telegram');
    const url = `https://t.me/share/url?url=${encodeURIComponent(getJobPageUrl())}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('telegram');
  };

  const copyLink = async () => {
    try {
      const text = getShareText('copy');
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Job details copied',
        description: 'Full job information copied to clipboard',
        variant: 'success'
      });
      onShare?.('copy');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy job details',
        variant: 'destructive'
      });
    }
  };

  const useWebShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: getShareText('web-share'),
        url: getJobPageUrl(),
      })
        .then(() => onShare?.('web-share'))
        .catch(() => copyLink());
    } else {
      copyLink();
    }
  };

  const shareOptions = [
    {
      label: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      action: shareOnFacebook
    },
    {
      label: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      action: shareOnTwitter
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      color: '#0A66C2',
      action: shareOnLinkedIn
    },
    {
      label: 'Telegram',
      icon: Send,
      color: '#0088CC',
      action: shareOnTelegram
    },
    {
      label: 'Copy Details',
      icon: LinkIcon,
      color: theme.text.muted,
      action: copyLink
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          style={{
            backgroundColor: theme.bg.primary,
            borderColor: theme.border.primary,
            color: theme.text.secondary
          }}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 shadow-lg"
        style={{
          backgroundColor: theme.bg.primary,
          borderColor: theme.border.primary,
          boxShadow: themeMode === 'dark' ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
      >
        {shareOptions.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={option.action}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
          >
            <option.icon
              className="w-4 h-4 mr-2"
              style={{ color: option.color }}
            />
            {option.label}
          </DropdownMenuItem>
        ))}
        {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
          <DropdownMenuItem
            onClick={useWebShare}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              color: theme.text.primary,
              backgroundColor: theme.bg.primary
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share via...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Smart Apply Button Component
interface ApplyButtonProps {
  job: Job;
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  applying: boolean;
  hasApplied: boolean;
  themeMode?: ThemeMode;
  size?: 'sm' | 'md' | 'lg';
}

const ApplyButton: React.FC<ApplyButtonProps> = ({
  job,
  onClick,
  disabled,
  applying,
  hasApplied,
  themeMode = 'light',
  size = 'md'
}) => {
  const theme = getTheme(themeMode);

  const applicationInfo = job.applicationInfo || jobService.getApplicationStatusInfo(job);
  const statusReason = applicationInfo.status?.reason;
  const canApply = applicationInfo.canApply;

  const getButtonConfig = () => {
    if (hasApplied) {
      return {
        text: 'View Application',
        backgroundColor: theme.bg.secondary,
        textColor: theme.text.primary,
        icon: FileCheck,
      };
    }

    if (!canApply) {
      switch (statusReason) {
        case ApplicationStatusReason.DISABLED:
          return {
            text: 'Applications Closed',
            backgroundColor: themeMode === 'dark' ? '#4B5563' : '#9CA3AF',
            textColor: themeMode === 'dark' ? '#E5E7EB' : '#FFFFFF',
            icon: Lock,
          };
        case ApplicationStatusReason.INACTIVE:
          return {
            text: 'Position Inactive',
            backgroundColor: themeMode === 'dark' ? '#4B5563' : '#9CA3AF',
            textColor: themeMode === 'dark' ? '#E5E7EB' : '#FFFFFF',
            icon: XCircle,
          };
        case ApplicationStatusReason.EXPIRED:
          return {
            text: 'Deadline Passed',
            backgroundColor: themeMode === 'dark' ? '#4B5563' : '#9CA3AF',
            textColor: themeMode === 'dark' ? '#E5E7EB' : '#FFFFFF',
            icon: Clock,
          };
        default:
          return {
            text: 'Not Available',
            backgroundColor: themeMode === 'dark' ? '#4B5563' : '#9CA3AF',
            textColor: themeMode === 'dark' ? '#E5E7EB' : '#FFFFFF',
            icon: AlertCircle,
          };
      }
    }

    // Default apply button
    return {
      text: applying ? 'Applying...' : 'Apply Now',
      backgroundColor: themeMode === 'dark' ? '#2563EB' : '#3B82F6',
      textColor: '#FFFFFF',
      icon: applying ? undefined : CheckCircle,
    };
  };

  const config = getButtonConfig();
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || !canApply}
      className={`${sizeClasses[size]} gap-2 font-medium transition-all duration-200 hover:opacity-90`}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        border: 'none',
        cursor: disabled || !canApply ? 'not-allowed' : 'pointer',
        opacity: disabled || !canApply ? 0.7 : 1
      }}
    >
      {applying ? (
        <>
          <LoadingSpinner size="sm" themeMode={themeMode} />
          {config.text}
        </>
      ) : (
        <>
          {config.icon && <config.icon className="w-4 h-4" />}
          {config.text}
        </>
      )}
    </Button>
  );
};

// Salary Display Component
interface SalaryDisplayProps {
  job: Job;
  themeMode?: ThemeMode;
  compact?: boolean;
}

const SalaryDisplay: React.FC<SalaryDisplayProps> = ({ job, themeMode = 'light', compact = false }) => {
  const theme = getTheme(themeMode);

  const getSalaryConfig = () => {
    switch (job.salaryMode) {
      case SalaryMode.RANGE:
        return {
          icon: DollarSign,
          label: jobService.getFormattedSalary(job),
          color: theme.text.green,
          bgColor: themeMode === 'dark' ? '#064E3B' : '#D1FAE5',
          tooltip: 'Salary range provided'
        };
      case SalaryMode.HIDDEN:
        return {
          icon: EyeOff,
          label: 'Salary hidden',
          color: theme.text.muted,
          bgColor: themeMode === 'dark' ? '#374151' : '#F3F4F6',
          tooltip: 'Salary details are not disclosed'
        };
      case SalaryMode.NEGOTIABLE:
        return {
          icon: Handshake,
          label: 'Negotiable',
          color: theme.text.orange,
          bgColor: themeMode === 'dark' ? '#92400E' : '#FFEDD5',
          tooltip: 'Salary is negotiable based on experience'
        };
      case SalaryMode.COMPANY_SCALE:
        return {
          icon: Building,
          label: 'Company scale',
          color: theme.text.blue,
          bgColor: themeMode === 'dark' ? '#1E3A8A' : '#DBEAFE',
          tooltip: 'Salary based on company pay scale'
        };
      default:
        return {
          icon: DollarSign,
          label: 'Not specified',
          color: theme.text.muted,
          bgColor: themeMode === 'dark' ? '#374151' : '#F3F4F6',
          tooltip: 'Salary information not available'
        };
    }
  };

  const config = getSalaryConfig();

  if (compact) {
    return (
      <div
        className="flex items-center px-2 py-1 rounded-md text-xs"
        style={{
          backgroundColor: config.bgColor,
          color: config.color
        }}
        title={config.tooltip}
      >
        <config.icon className="w-3 h-3 mr-1" />
        <span className="font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-1">
        <span style={{ color: theme.text.muted }} className="text-xs mr-2">
          Salary
        </span>
        <div
          className="flex items-center px-2 py-1 rounded-md"
          style={{
            backgroundColor: config.bgColor,
            color: config.color
          }}
          title={config.tooltip}
        >
          <config.icon className="w-3 h-3 mr-1" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
      </div>
      {job.salary?.isNegotiable && job.salaryMode === SalaryMode.RANGE && (
        <span
          className="text-xs px-2 py-0.5 rounded self-start mt-1"
          style={{
            backgroundColor: themeMode === 'dark' ? '#92400E' : '#FFEDD5',
            color: themeMode === 'dark' ? '#FDBA74' : '#9A3412'
          }}
        >
          Negotiable
        </span>
      )}
    </div>
  );
};

// Candidates Progress Component
interface CandidatesProgressProps {
  job: Job;
  themeMode?: ThemeMode;
  compact?: boolean;
}

const CandidatesProgress: React.FC<CandidatesProgressProps> = ({ job, themeMode = 'light', compact = false }) => {
  const theme = getTheme(themeMode);

  const candidatesNeeded = job.candidatesNeeded || 0;
  const candidatesRemaining = jobService.calculateCandidatesRemaining(job);
  const applicationsCount = job.applicationCount || 0;
  const filledCount = candidatesNeeded - candidatesRemaining;
  const fillPercentage = candidatesNeeded > 0
    ? (filledCount / candidatesNeeded) * 100
    : 0;

  const getProgressColor = () => {
    if (fillPercentage >= 80) return '#EF4444'; // red
    if (fillPercentage >= 50) return '#F59E0B'; // amber
    return '#10B981'; // green
  };

  const getStatusText = () => {
    if (candidatesRemaining <= 0) return 'Filled';
    if (candidatesRemaining === 1) return '1 spot left';
    return `${candidatesRemaining} spots left`;
  };

  if (compact) {
    return (
      <div className="flex items-center text-xs">
        <Users className="w-3 h-3 mr-1" />
        <span className="font-medium">{candidatesNeeded} needed</span>
        <span className="mx-1">•</span>
        <span style={{ color: getProgressColor() }}>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm">
          <Users className="w-4 h-4 mr-2" />
          <span className="font-medium">{candidatesNeeded} candidates needed</span>
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: getProgressColor() }}
        >
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span style={{ color: theme.text.muted }}>{applicationsCount} applied</span>
          <span style={{ color: theme.text.muted }}>{filledCount} selected</span>
        </div>

        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(fillPercentage, 100)}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>{candidatesNeeded}</span>
        </div>
      </div>
    </div>
  );
};

// Avatar Component for CandidateJobCard
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
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const avatarUrl = getAvatarUrl({
    profile: ownerProfile,
    name: ownerName,
    fallbackColor: job.jobType === 'organization' ? '#4F46E5' : '#10B981',
    size: size === 'sm' ? 32 : size === 'md' ? 40 : 64,
  });

  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden flex-shrink-0 ${bordered ? 'border' : ''}`}
      style={{ borderColor: bordered ? theme.border.secondary : 'transparent' }}>
      <img
        src={avatarUrl}
        alt={ownerName}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Main CandidateJobCard Component
const CandidateJobCard: React.FC<CandidateJobCardProps> = ({
  job,
  ownerProfile,
  onApply,
  onSave,
  onShare,
  isSaved = false,
  showSaveButton = true,
  compact = false,
  className = '',
  userApplications = [],
  themeMode = 'light',
  variant = 'default'
}) => {
  const theme = getTheme(themeMode);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(isSaved);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const hasApplied = userApplications.some(app => app.job?._id === job._id);
  const userApplication = userApplications.find(app => app.job?._id === job._id);
  const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
  const ownerName = ownerInfo?.name || 'Unknown';

  // Format date relative to now
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Handle save job
  const handleSaveJob = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save jobs',
        variant: 'warning',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    setSaving(true);
    try {
      if (localIsSaved) {
        await candidateService.unsaveJob(job._id);
        setLocalIsSaved(false);
        onSave?.(job._id, false);
        toast({
          title: 'Job Removed',
          description: 'Job has been removed from your saved jobs',
          variant: 'default'
        });
      } else {
        await candidateService.saveJob(job._id);
        setLocalIsSaved(true);
        onSave?.(job._id, true);
        toast({
          title: 'Job Saved',
          description: 'Job has been added to your saved jobs',
          variant: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [job._id, localIsSaved, isAuthenticated, router, toast, onSave]);

  // Handle apply job
  const handleApply = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const applicationInfo = job.applicationInfo || jobService.getApplicationStatusInfo(job);
    if (!applicationInfo.canApply) {
      toast({
        title: 'Applications Not Available',
        description: applicationInfo.status.message,
        variant: 'warning',
        duration: 5000,
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for jobs',
        variant: 'warning',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    if (hasApplied) {
      router.push(`/dashboard/candidate/applications/${userApplication?._id}`);
      return;
    }

    setApplying(true);
    try {
      onApply?.(job._id);
      await router.push(`/dashboard/candidate/apply/${job._id}`);
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: 'Application Error',
        description: 'Failed to apply to job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  }, [job, isAuthenticated, router, toast, onApply, hasApplied, userApplication]);

  // Handle share job
  const handleShare = useCallback((platform: string) => {
    onShare?.(job._id, platform);
  }, [job._id, onShare]);

  // Determine if job is new
  const isNew = useMemo(() => {
    if (!job.createdAt) return false;
    const createdAt = new Date(job.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }, [job.createdAt]);

  // Determine if job is urgent
  const isUrgent = useMemo(() => {
    return job.urgent || (job.applicationDeadline &&
      new Date(job.applicationDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000);
  }, [job.urgent, job.applicationDeadline]);

  // Compact variant
  if (compact || variant === 'compact') {
    return (
      <div
        className={`group relative rounded-lg border p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${className}`}
        style={{
          borderColor: theme.border.primary,
          backgroundColor: theme.bg.primary,
          boxShadow: themeMode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
        onClick={() => router.push(`/dashboard/candidate/jobs/${job._id}`)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Avatar
              job={job}
              ownerProfile={ownerProfile}
              themeMode={themeMode}
              size="sm"
              bordered
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: theme.text.primary }}>
                {job.title}
              </h3>
              <p className="text-xs truncate" style={{ color: theme.text.muted }}>
                {ownerName}
                {ownerInfo?.verified && (
                  <CheckCircle className="w-3 h-3 inline ml-1 text-green-500" />
                )}
              </p>
            </div>
          </div>

          {showSaveButton && (
            <Button
              onClick={handleSaveJob}
              disabled={saving}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              style={{ color: theme.text.muted }}
            >
              {saving ? (
                <LoadingSpinner size="sm" themeMode={themeMode} />
              ) : localIsSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-current text-blue-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Short Description */}
        {job.shortDescription && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: theme.text.secondary }}>
            {job.shortDescription}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs" style={{ color: theme.text.primary }}>
              <MapPin className="w-3 h-3 mr-1" />
              <span>{job.location?.city || job.location?.region || 'Remote'}</span>
            </div>
            <div className="flex items-center text-xs" style={{ color: theme.text.primary }}>
              <Briefcase className="w-3 h-3 mr-1" />
              <span>{jobService.getJobTypeLabel(job.type)}</span>
            </div>
          </div>

          <SalaryDisplay job={job} themeMode={themeMode} compact />
          <CandidatesProgress job={job} themeMode={themeMode} compact />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: theme.border.secondary }}>
          <span className="text-xs" style={{ color: theme.text.muted }}>
            {formatDate(job.createdAt)}
          </span>
          <div className="flex items-center space-x-2">
            <ApplyButton
              job={job}
              onClick={handleApply}
              disabled={applying || hasApplied}
              applying={applying}
              hasApplied={hasApplied}
              themeMode={themeMode}
              size="sm"
            />
            <ShareMenu job={job} onShare={handleShare} themeMode={themeMode} />
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div
        className={`group rounded-xl border p-6 transition-all duration-300 hover:shadow-lg ${className}`}
        style={{
          borderColor: theme.border.primary,
          backgroundColor: theme.bg.primary,
          boxShadow: themeMode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Header with logo and actions */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar
              job={job}
              ownerProfile={ownerProfile}
              themeMode={themeMode}
              size="md"
              bordered
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: theme.text.primary }}>
                    {job.title}
                  </h1>
                  <div className="flex items-center flex-wrap gap-2">
                    <p className="text-lg font-medium" style={{ color: theme.text.secondary }}>
                      {ownerName}
                    </p>
                    {ownerInfo?.verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                    {isNew && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New
                      </span>
                    )}
                    {isUrgent && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {showSaveButton && (
                    <Button
                      onClick={handleSaveJob}
                      disabled={saving}
                      variant={localIsSaved ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                    >
                      {saving ? (
                        <LoadingSpinner size="sm" themeMode={themeMode} />
                      ) : localIsSaved ? (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  <ShareMenu job={job} onShare={handleShare} themeMode={themeMode} />
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-4" style={{ color: theme.text.muted }}>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {job.location?.region === 'international' ? '🌍 Remote Worldwide' :
                    `${job.location?.city || job.location?.region}, ${job.location?.country}`}
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {jobService.getJobTypeLabel(job.type)}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Posted {formatDate(job.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Description */}
          <div className="lg:col-span-2">
            {job.shortDescription && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: theme.text.primary }}>
                  Overview
                </h3>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  {job.shortDescription}
                </p>
              </div>
            )}

            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Experience Level
                </h4>
                <p style={{ color: theme.text.secondary }}>
                  {jobService.getExperienceLabel(job.experienceLevel)}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Education Level
                </h4>
                <p style={{ color: theme.text.secondary }}>
                  {jobService.getEducationLabel(job.educationLevel)}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Work Arrangement
                </h4>
                <p style={{ color: theme.text.secondary }}>
                  {job.workArrangement === 'office' ? 'Office Based' :
                    job.workArrangement === 'field-work' ? 'Field Work' : 'Hybrid (Office & Field)'}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Remote Work
                </h4>
                <p style={{ color: theme.text.secondary }}>
                  {job.remote === 'remote' ? 'Fully Remote' :
                    job.remote === 'hybrid' ? 'Hybrid Remote' : 'On-site'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Key Info Cards */}
          <div className="space-y-4">
            {/* Salary Card */}
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: theme.border.primary,
                backgroundColor: theme.bg.secondary
              }}
            >
              <SalaryDisplay job={job} themeMode={themeMode} />
            </div>

            {/* Candidates Card */}
            <div
              className="p-4 rounded-lg border"
              style={{
                borderColor: theme.border.primary,
                backgroundColor: theme.bg.secondary
              }}
            >
              <CandidatesProgress job={job} themeMode={themeMode} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t"
          style={{ borderColor: theme.border.secondary }}>
          <div className="flex items-center space-x-4 mb-4 sm:mb-0" style={{ color: theme.text.muted }}>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              {job.viewCount || 0} views
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {job.applicationCount || 0} applications
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`/dashboard/candidate/jobs/${job._id}`)}
            >
              <ExternalLink className="w-4 h-4" />
              View Full Details
            </Button>

            <ApplyButton
              job={job}
              onClick={handleApply}
              disabled={applying || hasApplied}
              applying={applying}
              hasApplied={hasApplied}
              themeMode={themeMode}
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`group rounded-xl border p-6 transition-all duration-300 hover:shadow-lg ${className}`}
      style={{
        borderColor: theme.border.primary,
        backgroundColor: theme.bg.primary,
        boxShadow: themeMode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <Avatar
            job={job}
            ownerProfile={ownerProfile}
            themeMode={themeMode}
            size="md"
            bordered
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1.5 sm:mb-2">
              <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors line-clamp-2" style={{ color: theme.text.primary }}>
                <Link
                  href={`/dashboard/candidate/jobs/${job._id}`}
                  className="hover:underline"
                >
                  {job.title}
                </Link>
              </h3>
              {showSaveButton && (
                <Button
                  onClick={handleSaveJob}
                  disabled={saving}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto ml-2"
                  style={{ color: theme.text.muted }}
                >
                  {saving ? (
                    <LoadingSpinner size="sm" themeMode={themeMode} />
                  ) : localIsSaved ? (
                    <BookmarkCheck className="w-4 h-4 fill-current text-blue-600" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                {ownerName}
              </p>
              {ownerInfo?.verified && (
                <CheckCircle className="w-3 h-3 text-green-500" />
              )}
              {isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Short Description */}
      {job.shortDescription && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: theme.text.secondary }}>
          {job.shortDescription}
        </p>
      )}

      {/* Key Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <MapPin className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">
            {job.location?.region === 'international' ? '🌍 Remote Worldwide' :
              `${job.location?.city || job.location?.region}, ${job.location?.country}`}
          </span>
        </div>

        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <Briefcase className="w-4 h-4 mr-2 shrink-0" />
          <span>{jobService.getJobTypeLabel(job.type)}</span>
        </div>

        <div className="flex items-center text-sm" style={{ color: theme.text.secondary }}>
          <Calendar className="w-4 h-4 mr-2 shrink-0" />
          <span>{formatDate(job.createdAt)}</span>
        </div>
      </div>

      {/* Featured Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SalaryDisplay job={job} themeMode={themeMode} />
        <CandidatesProgress job={job} themeMode={themeMode} />
      </div>

      {/* Skills Preview */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-md border"
                style={{
                  backgroundColor: theme.bg.secondary,
                  borderColor: theme.border.secondary,
                  color: theme.text.secondary
                }}
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span
                className="text-xs px-2 py-1 rounded-md"
                style={{
                  backgroundColor: theme.bg.secondary,
                  color: theme.text.muted
                }}
              >
                +{job.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t"
        style={{ borderColor: theme.border.secondary }}>
        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
          <span className="text-xs" style={{ color: theme.text.muted }}>
            <Eye className="w-3 h-3 inline mr-1" />
            {job.viewCount || 0}
          </span>
          <span className="text-xs" style={{ color: theme.text.muted }}>
            <Users className="w-3 h-3 inline mr-1" />
            {job.applicationCount || 0}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push(`/dashboard/candidate/jobs/${job._id}`)}
          >
            <ExternalLink className="w-3 h-3" />
            Details
          </Button>

          <ApplyButton
            job={job}
            onClick={handleApply}
            disabled={applying || hasApplied}
            applying={applying}
            hasApplied={hasApplied}
            themeMode={themeMode}
            size="sm"
          />

          <ShareMenu job={job} onShare={handleShare} themeMode={themeMode} />
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Component
export const CandidateJobCardSkeleton: React.FC<{ themeMode?: ThemeMode }> = ({ themeMode = 'light' }) => {
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
          className="w-10 h-10 rounded-full"
          style={{ backgroundColor: theme.bg.secondary }}
        />
        <div className="flex-1">
          <div
            className="h-5 rounded mb-2"
            style={{ backgroundColor: theme.bg.secondary }}
          />
          <div
            className="h-4 rounded w-1/3"
            style={{ backgroundColor: theme.bg.secondary }}
          />
        </div>
      </div>

      <div
        className="h-4 rounded mb-4"
        style={{ backgroundColor: theme.bg.secondary }}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 rounded"
            style={{ backgroundColor: theme.bg.secondary }}
          />
        ))}
      </div>

      <div className="flex justify-between">
        <div className="flex space-x-3">
          <div
            className="h-8 w-20 rounded"
            style={{ backgroundColor: theme.bg.secondary }}
          />
          <div
            className="h-8 w-20 rounded"
            style={{ backgroundColor: theme.bg.secondary }}
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateJobCard;