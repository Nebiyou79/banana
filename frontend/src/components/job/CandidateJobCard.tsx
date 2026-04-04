/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Job,
  jobService,
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
import { getTheme, ThemeMode } from '@/utils/color';
import LoadingSpinner from '../LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from '@/lib/utils';

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
    const owner = job.ownerName || (job.jobType === 'company' ? job.company?.name : job.organization?.name);
    const salary = jobService.getFormattedSalary(job);
    const location = job.location?.region === 'international'
      ? '🌍 Remote Worldwide'
      : `${job.location?.city || job.location?.region}, ${job.location?.country}`;
    const description = job.shortDescription || 'Check out this opportunity!';

    const fullText = `🏢 ${job.title}
📋 ${owner}
💰 ${salary}
📍 ${location}
📝 ${description.substring(0, 150)}${description.length > 150 ? '...' : ''}
🔗 ${getJobPageUrl()}`;

    const shortText = `Check out this ${job.displayType || 'job'}: "${job.title}" at ${owner}`;

    if (platform === 'copy' || platform === 'telegram' || platform === 'web-share') {
      return fullText;
    }

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
          className="gap-2 inline-flex items-center justify-center"
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

// Smart Apply Button Component with "Applications Locked" text
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
        text: 'Applied ✓',
        bgColor: 'bg-emerald-500 hover:bg-emerald-600',
        icon: FileCheck,
        clickable: false,
      };
    }

    if (!canApply) {
      let buttonText = 'Applications Locked';
      let icon = Lock;
      const bgColor = 'bg-gray-400 dark:bg-gray-600';

      if (statusReason === ApplicationStatusReason.DISABLED) {
        buttonText = 'Applications Locked';
        icon = Lock;
      } else if (statusReason === ApplicationStatusReason.INACTIVE) {
        buttonText = 'Position Inactive';
        icon = XCircle;
      } else if (statusReason === ApplicationStatusReason.EXPIRED) {
        buttonText = 'Deadline Passed';
        icon = Clock;
      } else {
        buttonText = 'Applications Locked';
        icon = Lock;
      }

      return {
        text: buttonText,
        bgColor,
        icon,
        clickable: false,
      };
    }

    return {
      text: applying ? 'Applying...' : 'Apply Now',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      icon: applying ? undefined : Send,
      clickable: true,
    };
  };

  const config = getButtonConfig();

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || !config.clickable || applying}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium text-white",
        "transition-all duration-200 shadow-md hover:shadow-lg",
        config.bgColor,
        config.clickable && !applying && "transform hover:scale-105",
        "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100",
        sizeClasses[size],
        "w-full"
      )}
    >
      {applying ? (
        <>
          <LoadingSpinner size="sm" themeMode={themeMode} />
          <span className="ml-2">{config.text}</span>
        </>
      ) : (
        <>
          {config.icon && <config.icon className="w-4 h-4 mr-2" />}
          {config.text}
        </>
      )}
    </button>
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

  const candidatesNeeded = job.candidatesNeeded || 1;
  const positionsFilled = 0; // This would come from backend
  const positionsRemaining = Math.max(0, candidatesNeeded - positionsFilled);
  const fillPercentage = candidatesNeeded > 0
    ? (positionsFilled / candidatesNeeded) * 100
    : 0;

  const getProgressColor = () => {
    if (fillPercentage >= 80) return '#EF4444';
    if (fillPercentage >= 50) return '#F59E0B';
    return '#10B981';
  };

  const getStatusText = () => {
    if (positionsRemaining <= 0) return 'Filled';
    if (positionsRemaining === 1) return '1 spot left';
    return `${positionsRemaining} spots left`;
  };

  if (compact) {
    return (
      <div className="flex items-center text-xs">
        <Users className="w-3 h-3 mr-1" style={{ color: theme.text.muted }} />
        <span className="font-medium" style={{ color: theme.text.primary }}>{candidatesNeeded} needed</span>
        <span className="mx-1" style={{ color: theme.text.muted }}>•</span>
        <span style={{ color: getProgressColor() }}>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm">
          <Users className="w-4 h-4 mr-2" style={{ color: theme.text.muted }} />
          <span className="font-medium" style={{ color: theme.text.primary }}>{candidatesNeeded} positions</span>
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
          <span style={{ color: theme.text.muted }}>Selection in progress</span>
          <span style={{ color: theme.text.muted }}>{candidatesNeeded} total</span>
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

        <p className="text-xs mt-2 italic" style={{ color: theme.text.muted }}>
          Positions filled count will be updated as candidates are selected
        </p>
      </div>
    </div>
  );
};

// Enhanced Avatar Component
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

  const ownerName = job.ownerName ||
    (job.jobType === 'organization' ? job.organization?.name : job.company?.name) ||
    'Unknown';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const getAvatarUrl = (): string => {
    if (job.ownerAvatarUrl && !job.ownerAvatarUrl.includes('ui-avatars.com')) {
      return job.ownerAvatarUrl;
    }

    if (ownerProfile?.avatar?.secure_url) {
      return ownerProfile.avatar.secure_url;
    }
    if (ownerProfile?.user.avatar) {
      return ownerProfile.user.avatar;
    }

    const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
    if (ownerInfo) {
      if (ownerInfo.avatar) {
        return ownerInfo.avatar;
      }
      if (ownerInfo.logoUrl) {
        return ownerInfo.logoUrl;
      }
      if (job.jobType === 'organization' && job.organization?.logoFullUrl) {
        return job.organization.logoFullUrl;
      }
    }

    return generatePlaceholderAvatar(ownerName, job.jobType);
  };

  const generatePlaceholderAvatar = (name: string, jobType: string): string => {
    const initials = name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const backgroundColor = jobType === 'organization' ? '8B5CF6' : '10B981';
    const sizeMap = {
      sm: 32,
      md: 40,
      lg: 64
    };

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=${sizeMap[size]}`;
  };

  const avatarUrl = getAvatarUrl();
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden shrink-0 ${bordered ? 'ring-2 ring-offset-2' : 'shadow-md'} flex items-center justify-center transition-transform hover:scale-105 duration-300`}
      style={{
        backgroundColor: theme.bg.secondary
      }}>
      {!imgError ? (
        <img
          src={avatarUrl}
          alt={`${ownerName} logo`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
          {ownerName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

// FIXED: Main CandidateJobCard Component
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
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Debounce timeout ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setLocalIsSaved(isSaved);
  }, [isSaved]);

  const hasApplied = useMemo(() => {
    if (!userApplications || userApplications.length === 0) return false;

    const directMatch = userApplications.some(app => app.job?._id === job._id);
    if (directMatch) return true;

    const jobObjectMatch = userApplications.some(app => {
      const appJob = app.job;
      if (typeof appJob === 'object' && appJob !== null) {
        return appJob._id === job._id || appJob.title === job.title;
      }
      return false;
    });
    if (jobObjectMatch) return true;

    const jobIdMatch = userApplications.some(app => app.jobId === job._id);
    return jobIdMatch;
  }, [userApplications, job._id, job.title]);

  const ownerName = job.ownerName ||
    (job.jobType === 'organization' ? job.organization?.name : job.company?.name) ||
    'Unknown';

  const ownerVerified = job.ownerVerified ||
    (job.jobType === 'organization' ? job.organization?.verified : job.company?.verified) ||
    false;

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

  // FIXED: Handle save job with proper state management and debouncing
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

    // Prevent multiple simultaneous requests
    if (saving) return;
    
    // Clear any pending timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);

    // Store current state before optimistic update
    const wasSaved = localIsSaved;
    const newSavedState = !wasSaved;
    
    // Optimistic update
    setLocalIsSaved(newSavedState);

    try {
      if (newSavedState) {
        // Trying to save
        const result = await jobService.saveJob(job._id);
        console.log('Save result:', result);
        
        // Only update if component is still mounted
        if (isMounted.current) {
          // Success - keep the optimistic state
          onSave?.(job._id, true);
          
          // notify user – this handler only runs on user action, so
          // the state really did flip
          toast({
            title: 'Job Saved',
            description: 'Job has been added to your saved jobs',
            variant: 'success'
          });
        }
      } else {
        // Trying to unsave
        const result = await jobService.unsaveJob(job._id);
        console.log('Unsave result:', result);
        
        // Only update if component is still mounted
        if (isMounted.current) {
          // Success - keep the optimistic state
          onSave?.(job._id, false);
          
          toast({
            title: 'Job Removed',
            description: 'Job has been removed from your saved jobs',
            variant: 'default'
          });
        }
      }
    } catch (error: any) {
      console.error('Save/unsave error:', error);
      
      // Only update if component is still mounted
      if (isMounted.current) {
        // Handle specific error cases
        if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.message || '';
          
          // If job is already saved, treat as success (don't revert)
          if (errorMessage.toLowerCase().includes('already saved')) {
            setLocalIsSaved(true);
            onSave?.(job._id, true);
            toast({
              title: 'Already Saved',
              description: 'This job is already in your saved list',
              variant: 'default'
            });
            return;
          }
          
          // If job is not saved, treat as success for unsave
          if (errorMessage.toLowerCase().includes('not saved') || 
              errorMessage.toLowerCase().includes('not found')) {
            setLocalIsSaved(false);
            onSave?.(job._id, false);
            toast({
              title: 'Job Removed',
              description: 'Job has been removed from your saved jobs',
              variant: 'default'
            });
            return;
          }
          
          // For other 400 errors, revert optimistic update
          setLocalIsSaved(wasSaved);
          toast({
            title: 'Error',
            description: errorMessage || `Failed to ${newSavedState ? 'save' : 'unsave'} job`,
            variant: 'destructive'
          });
        } else {
          // Network or other errors - revert optimistic update
          setLocalIsSaved(wasSaved);
          toast({
            title: 'Error',
            description: error.message || `Failed to ${newSavedState ? 'save' : 'unsave'} job`,
            variant: 'destructive'
          });
        }
      }
    } finally {
      // Only update if component is still mounted
      if (isMounted.current) {
        setSaving(false);
      }
    }
  }, [job._id, localIsSaved, isAuthenticated, router, toast, onSave, saving]);

  const handleApply = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasApplied) {
      toast({
        title: 'Already Applied',
        description: `You have already applied for "${job.title}"`,
        variant: 'info',
        duration: 3000,
      });
      return;
    }

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
      if (isMounted.current) {
        setApplying(false);
      }
    }
  }, [job, isAuthenticated, router, toast, onApply, hasApplied]);

  const handleShare = useCallback((platform: string) => {
    onShare?.(job._id, platform);
  }, [job._id, onShare]);

  const isNew = useMemo(() => {
    if (!job.createdAt) return false;
    const createdAt = new Date(job.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }, [job.createdAt]);

  const isUrgent = useMemo(() => {
    return job.urgent || (job.applicationDeadline &&
      new Date(job.applicationDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000);
  }, [job.urgent, job.applicationDeadline]);

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
                  className="p-1 h-auto ml-2 inline-flex items-center justify-center"
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
              {ownerVerified && (
                <CheckCircle className="w-3 h-3 text-green-500" />
              )}
              {isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {job.displayType || job.jobType === 'organization' ? 'Opportunity' : 'Job'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {job.shortDescription && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: theme.text.secondary }}>
          {job.shortDescription}
        </p>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SalaryDisplay job={job} themeMode={themeMode} />
        <CandidatesProgress job={job} themeMode={themeMode} />

        <div
          className="p-3 rounded-lg border"
          style={{
            borderColor: theme.border.primary,
            backgroundColor: theme.bg.secondary
          }}
        >
          <div className="flex items-center space-x-2">
            <Avatar
              job={job}
              ownerProfile={ownerProfile}
              themeMode={themeMode}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: theme.text.primary }}>
                {ownerName}
              </p>
              <p className="text-xs truncate" style={{ color: theme.text.muted }}>
                {ownerVerified ? 'Verified' : ''} {job.ownerType === 'Organization' ? 'Organization' : 'Company'}
              </p>
            </div>
          </div>
        </div>
      </div>

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

      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t"
        style={{ borderColor: theme.border.secondary }}>
        <div className="flex items-center space-x-3 mb-3 sm:mb-0" style={{ color: theme.text.muted }}>
          <div className="flex items-center text-xs">
            <Eye className="w-3 h-3 mr-1" />
            {job.viewCount || 0}
          </div>
          <div className="flex items-center text-xs">
            <Users className="w-3 h-3 mr-1" />
            {job.applicationCount || 0}
          </div>
          <div className="flex items-center text-xs">
            <Bookmark className="w-3 h-3 mr-1" />
            {job.saveCount || 0}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 inline-flex items-center justify-center"
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