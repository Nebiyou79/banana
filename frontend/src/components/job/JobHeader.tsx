import React from 'react';
import { Job, JobStatus, SalaryMode } from '@/services/jobService';
import { Profile, DetailedProfile, PublicProfile } from '@/services/profileService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    MapPin,
    Briefcase,
    Calendar,
    Building,
    Shield,
    Edit3,
    Share2,
    Bookmark,
    Send,
    CheckCircle,
    PauseCircle,
    XCircle,
    Archive,
    Trash2,
    MoreVertical,
    User
} from 'lucide-react';
import { colorClasses, getTheme } from '@/utils/color';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';

export type UserRole = 'candidate' | 'company' | 'organization';

export interface JobHeaderProps {
    job: Job;
    role: UserRole;
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null; // Add ownerProfile prop

    // Action handlers
    onApply?: () => void;
    onSave?: () => void;
    onShare?: () => void;
    onEdit?: () => void;
    onStatusChange?: (status: JobStatus) => void;
    onDelete?: () => void;

    // State
    isSaved?: boolean;
    isApplying?: boolean;
    isSaving?: boolean;

    // Optional customizations
    className?: string;
    compact?: boolean;
    showApplicationStatus?: boolean;
    themeMode?: 'light' | 'dark';
}

export const JobHeader: React.FC<JobHeaderProps> = ({
    job,
    role,
    ownerProfile, // New prop
    onApply,
    onSave,
    onShare,
    onEdit,
    onStatusChange,
    onDelete,
    isSaved = false,
    isApplying = false,
    isSaving = false,
    className = '',
    compact = false,
    showApplicationStatus = true,
    themeMode: propThemeMode = 'light'
}) => {
    // Use prop theme mode or detect from document
    const themeMode = propThemeMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const theme = getTheme(themeMode);

    // Helper functions from jobService (simplified versions for component)
    const getOwnerName = () => {
        if (job.jobType === 'organization' && job.organization) {
            return job.organization.name;
        }
        if (job.jobType === 'company' && job.company) {
            return job.company.name;
        }
        return 'Unknown';
    };

    const getOwnerAvatarUrl = () => {
        const ownerName = getOwnerName();
        return getAvatarUrl({
            profile: ownerProfile,
            name: ownerName,
            fallbackColor: job.jobType === 'organization' ? '#4F46E5' : '#10B981',
            size: compact ? 40 : 48,
        });
    };

    const isVerified = () => {
        if (job.jobType === 'organization' && job.organization) {
            return job.organization.verified;
        }
        if (job.jobType === 'company' && job.company) {
            return job.company.verified;
        }
        return false;
    };

    const getJobTypeLabel = () => {
        const labels: Record<string, string> = {
            'full-time': 'Full Time',
            'part-time': 'Part Time',
            'contract': 'Contract',
            'internship': 'Internship',
            'temporary': 'Temporary',
            'volunteer': 'Volunteer',
            'remote': 'Remote',
            'hybrid': 'Hybrid'
        };
        return labels[job.type] || job.type;
    };

    const getExperienceLabel = () => {
        const labels: Record<string, string> = {
            'fresh-graduate': 'Fresh Graduate',
            'entry-level': 'Entry Level',
            'mid-level': 'Mid Level',
            'senior-level': 'Senior Level',
            'managerial': 'Managerial',
            'director': 'Director',
            'executive': 'Executive'
        };
        return labels[job.experienceLevel] || job.experienceLevel;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysAgo = (dateString: string) => {
        const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const canJobAcceptApplications = () => {
        if (job.isApplyEnabled === false) return false;
        if (job.status !== JobStatus.ACTIVE) return false;
        if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) return false;
        return true;
    };

    const getSalaryDisplay = () => {
        if (job.salaryMode === SalaryMode.HIDDEN) return 'Salary hidden';
        if (job.salaryMode === SalaryMode.NEGOTIABLE) return 'Negotiable';
        if (job.salaryMode === SalaryMode.COMPANY_SCALE) return 'Company scale';

        if (job.salary) {
            const { min, max, currency, period } = job.salary;
            if (min && max) {
                const formattedMin = min.toLocaleString();
                const formattedMax = max.toLocaleString();
                return `${currency} ${formattedMin} - ${formattedMax} / ${period}`;
            } else if (min) {
                const formattedMin = min.toLocaleString();
                return `${currency} ${formattedMin}+ / ${period}`;
            } else if (max) {
                const formattedMax = max.toLocaleString();
                return `${currency} Up to ${formattedMax} / ${period}`;
            }
        }

        return 'Not specified';
    };

    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case JobStatus.ACTIVE:
                return {
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    text: 'text-green-800 dark:text-green-300',
                    border: 'border-green-200 dark:border-green-800',
                    bgColor: theme.bg.green,
                    textColor: theme.text.green,
                    borderColor: theme.border.green
                };
            case JobStatus.DRAFT:
                return {
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    text: 'text-yellow-800 dark:text-yellow-300',
                    border: 'border-yellow-200 dark:border-yellow-800',
                    bgColor: theme.bg.goldenMustard,
                    textColor: theme.text.goldenMustard,
                    borderColor: theme.border.goldenMustard
                };
            case JobStatus.PAUSED:
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-800 dark:text-orange-300',
                    border: 'border-orange-200 dark:border-orange-800',
                    bgColor: theme.bg.orange,
                    textColor: theme.text.orange,
                    borderColor: theme.border.orange
                };
            case JobStatus.CLOSED:
                return {
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    text: 'text-red-800 dark:text-red-300',
                    border: 'border-red-200 dark:border-red-800',
                    bgColor: theme.bg.orange,
                    textColor: theme.text.error,
                    borderColor: theme.border.orange
                };
            case JobStatus.ARCHIVED:
                return {
                    bg: 'bg-gray-100 dark:bg-gray-800',
                    text: 'text-gray-800 dark:text-gray-300',
                    border: 'border-gray-200 dark:border-gray-700',
                    bgColor: theme.bg.gray400,
                    textColor: theme.text.gray400,
                    borderColor: theme.border.gray400
                };
            default:
                return {
                    bg: 'bg-gray-100 dark:bg-gray-800',
                    text: 'text-gray-800 dark:text-gray-300',
                    border: 'border-gray-200 dark:border-gray-700',
                    bgColor: theme.bg.gray100,
                    textColor: theme.text.gray100,
                    borderColor: theme.border.gray100
                };
        }
    };

    const getStatusIcon = (status: JobStatus) => {
        switch (status) {
            case JobStatus.ACTIVE: return <CheckCircle className="w-3 h-3" />;
            case JobStatus.DRAFT: return <Edit3 className="w-3 h-3" />;
            case JobStatus.PAUSED: return <PauseCircle className="w-3 h-3" />;
            case JobStatus.CLOSED: return <XCircle className="w-3 h-3" />;
            case JobStatus.ARCHIVED: return <Archive className="w-3 h-3" />;
            default: return null;
        }
    };

    // Determine if user can edit this job (owner check)
    const canEditJob = () => {
        if (role === 'company' && job.jobType === 'company') return true;
        if (role === 'organization' && job.jobType === 'organization') return true;
        return false;
    };

    const ownerName = getOwnerName();
    const ownerAvatarUrl = getOwnerAvatarUrl();
    const verified = isVerified();
    const statusColors = getStatusColor(job.status);
    const StatusIcon = getStatusIcon(job.status);
    const canApply = canJobAcceptApplications();
    const isOwner = canEditJob();
    const locationText = job.location ? `${job.location.city}, ${job.location.region}` : 'Location not specified';

    // Get initials for fallback
    const getInitials = (name: string) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const ownerInitials = getInitials(ownerName);

    // Get remote display text
    const getRemoteDisplay = () => {
        switch (job.remote) {
            case 'remote': return 'Remote';
            case 'hybrid': return 'Hybrid';
            case 'on-site': return 'On-site';
            default: return job.remote || 'On-site';
        }
    };

    // Get job type display
    const getJobTypeDisplay = () => {
        if (job.jobType === 'organization' && job.opportunityType) {
            switch (job.opportunityType) {
                case 'volunteer': return 'Volunteer';
                case 'internship': return 'Internship';
                case 'fellowship': return 'Fellowship';
                case 'training': return 'Training';
                case 'grant': return 'Grant';
                default: return 'Opportunity';
            }
        }
        return getJobTypeLabel();
    };

    // Mobile-friendly breakpoint
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle avatar image error
    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
        if (fallback) {
            fallback.style.display = 'flex';
        }
    };

    return (
        <div className={cn(
            "w-full border-b",
            theme.border.primary,
            className
        )}>
            {/* Main Header */}
            <div className="container mx-auto px-4 py-4 md:py-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: Job Info */}
                    <div className="flex-1 space-y-4">
                        {/* Job Title & Company */}
                        <div className="space-y-3">
                            <h1 className={cn(
                                "text-xl md:text-2xl lg:text-3xl font-bold",
                                theme.text.primary
                            )}>
                                {job.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                {/* Company/Organization */}
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "relative rounded-full overflow-hidden border",
                                        compact ? "w-8 h-8 md:w-10 md:h-10" : "w-10 h-10 md:w-12 md:h-12",
                                        theme.border.primary,
                                        "bg-gray-100 dark:bg-gray-800" // Fallback background
                                    )}>
                                        {/* Avatar Image */}
                                        {ownerAvatarUrl && (
                                            <img
                                                src={ownerAvatarUrl}
                                                alt={ownerName}
                                                className="object-cover w-full h-full"
                                                onError={handleAvatarError}
                                            />
                                        )}

                                        {/* Fallback Initials */}
                                        <div
                                            className={cn(
                                                "w-full h-full flex items-center justify-center hidden",
                                                "font-bold text-white",
                                                job.jobType === 'organization'
                                                    ? 'bg-purple-600'
                                                    : 'bg-green-600'
                                            )}
                                            style={{ display: !ownerAvatarUrl ? 'flex' : 'none' }}
                                        >
                                            <span className={compact ? 'text-xs' : 'text-sm'}>
                                                {ownerInitials}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn("font-semibold text-sm md:text-base", theme.text.primary)}>
                                            {ownerName}
                                        </span>
                                        {verified && (
                                            <div className="flex items-center gap-1">
                                                <Shield className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                <span className="text-xs text-green-600 dark:text-green-400">
                                                    Verified
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "inline-flex items-center gap-1 text-xs md:text-sm",
                                        statusColors.bg,
                                        statusColors.text,
                                        statusColors.border
                                    )}
                                >
                                    {StatusIcon}
                                    <span className="capitalize">{job.status}</span>
                                </Badge>
                            </div>
                        </div>

                        {/* Job Meta Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                            <div className="flex items-center gap-2">
                                <Briefcase className={cn("w-4 h-4 flex-shrink-0", theme.text.muted)} />
                                <span className={cn("text-xs md:text-sm truncate", theme.text.secondary)} title={getJobTypeDisplay()}>
                                    {getJobTypeDisplay()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <MapPin className={cn("w-4 h-4 flex-shrink-0", theme.text.muted)} />
                                <span className={cn("text-xs md:text-sm truncate", theme.text.secondary)} title={getRemoteDisplay()}>
                                    {getRemoteDisplay()}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className={cn("w-4 h-4 flex-shrink-0", theme.text.muted)} />
                                <span className={cn("text-xs md:text-sm", theme.text.secondary)}>
                                    {getDaysAgo(job.createdAt)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Building className={cn("w-4 h-4 flex-shrink-0", theme.text.muted)} />
                                <span className={cn("text-xs md:text-sm truncate", theme.text.secondary)} title={getExperienceLabel()}>
                                    {getExperienceLabel()}
                                </span>
                            </div>
                        </div>

                        {/* Salary Display */}
                        {job.salaryMode !== SalaryMode.HIDDEN && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className={cn("text-sm md:text-base font-medium", theme.text.primary)}>
                                    💰 {getSalaryDisplay()}
                                </span>
                                {job.salary?.isNegotiable && (
                                    <Badge variant="outline" className={cn(
                                        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
                                        "text-xs"
                                    )}>
                                        Negotiable
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap gap-2 self-start">
                        {/* Candidate Actions */}
                        {role === 'candidate' && (
                            <>
                                {onApply && (
                                    <Button
                                        onClick={onApply}
                                        disabled={!canApply || isApplying}
                                        className={cn(
                                            "bg-blue-600 hover:bg-blue-700 text-white",
                                            "px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base",
                                            "w-full sm:w-auto",
                                            !canApply && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isApplying ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span className="hidden sm:inline">Applying...</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" />
                                                <span>Apply Now</span>
                                            </span>
                                        )}
                                    </Button>
                                )}

                                <div className="flex gap-2">
                                    {onSave && (
                                        <Button
                                            variant="outline"
                                            onClick={onSave}
                                            disabled={isSaving}
                                            className={cn(
                                                "border-gray-300 dark:border-gray-600",
                                                "text-gray-700 dark:text-gray-300",
                                                "px-3 py-2 text-sm",
                                                isSaved && "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                                            )}
                                            title={isSaved ? "Remove from saved" : "Save job"}
                                        >
                                            <Bookmark className={cn(
                                                "w-4 h-4",
                                                isSaved && "fill-blue-600 dark:fill-blue-400"
                                            )} />
                                            <span className="sr-only sm:not-sr-only sm:ml-2">
                                                {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
                                            </span>
                                        </Button>
                                    )}

                                    {onShare && (
                                        <Button
                                            variant="outline"
                                            onClick={onShare}
                                            className={cn(
                                                "border-gray-300 dark:border-gray-600",
                                                "text-gray-700 dark:text-gray-300",
                                                "px-3 py-2 text-sm"
                                            )}
                                            title="Share job"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            <span className="sr-only sm:not-sr-only sm:ml-2">Share</span>
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Company/Organization Actions */}
                        {(role === 'company' || role === 'organization') && isOwner && (
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                {onEdit && (
                                    <Button
                                        variant="outline"
                                        onClick={onEdit}
                                        className={cn(
                                            "border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20",
                                            "px-3 md:px-4 py-2 text-sm md:text-base",
                                            "flex-1 sm:flex-none"
                                        )}
                                    >
                                        <Edit3 className="w-4 h-4 mr-1 md:mr-2" />
                                        <span>Edit</span>
                                    </Button>
                                )}

                                {onShare && (
                                    <Button
                                        variant="outline"
                                        onClick={onShare}
                                        className={cn(
                                            "border-gray-600 text-gray-600 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-800",
                                            "px-3 py-2 text-sm",
                                            "flex-1 sm:flex-none"
                                        )}
                                        title="Share job"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span className="sr-only sm:not-sr-only">Share</span>
                                    </Button>
                                )}

                                {/* Status Actions Dropdown */}
                                {onStatusChange && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "border-gray-600 text-gray-600 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-800",
                                                    "px-3 py-2 text-sm",
                                                    "flex-1 sm:flex-none"
                                                )}
                                            >
                                                {isMobile ? <MoreVertical className="w-4 h-4" /> : 'Actions'}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="min-w-[200px]">
                                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                Change Status
                                            </div>

                                            {/* Status Change Options */}
                                            {job.status !== JobStatus.ACTIVE && (
                                                <DropdownMenuItem
                                                    onClick={() => onStatusChange(JobStatus.ACTIVE)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span>Activate</span>
                                                </DropdownMenuItem>
                                            )}

                                            {job.status !== JobStatus.PAUSED && (
                                                <DropdownMenuItem
                                                    onClick={() => onStatusChange(JobStatus.PAUSED)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <PauseCircle className="w-4 h-4 text-orange-600" />
                                                    <span>Pause</span>
                                                </DropdownMenuItem>
                                            )}

                                            {job.status !== JobStatus.CLOSED && (
                                                <DropdownMenuItem
                                                    onClick={() => onStatusChange(JobStatus.CLOSED)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                    <span>Close</span>
                                                </DropdownMenuItem>
                                            )}

                                            {job.status !== JobStatus.ARCHIVED && (
                                                <DropdownMenuItem
                                                    onClick={() => onStatusChange(JobStatus.ARCHIVED)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Archive className="w-4 h-4 text-gray-600" />
                                                    <span>Archive</span>
                                                </DropdownMenuItem>
                                            )}

                                            {/* Delete Action */}
                                            {onDelete && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={onDelete}
                                                        className="flex items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Application Status Banner (Candidate only) */}
                {role === 'candidate' && showApplicationStatus && !canApply && (
                    <div className={cn(
                        "mt-4 p-3 rounded-lg border",
                        job.status === JobStatus.CLOSED ?
                            "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                            "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    )}>
                        <p className={cn(
                            "text-sm font-medium",
                            job.status === JobStatus.CLOSED ?
                                "text-red-800 dark:text-red-300" :
                                "text-yellow-800 dark:text-yellow-300"
                        )}>
                            {job.status === JobStatus.CLOSED ?
                                'This position is no longer accepting applications.' :
                                job.status === JobStatus.PAUSED ?
                                    'This position is currently paused.' :
                                    job.isApplyEnabled === false ?
                                        'Applications are currently closed for this position.' :
                                        'Application deadline has passed.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Avatar Component (Simplified version)
interface JobAvatarProps {
    job: Job;
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    themeMode?: 'light' | 'dark';
}

export const JobAvatar: React.FC<JobAvatarProps> = ({
    job,
    ownerProfile,
    size = 'md',
    className = '',
    themeMode = 'light'
}) => {
    const theme = getTheme(themeMode);

    const getOwnerName = () => {
        if (job.jobType === 'organization' && job.organization) {
            return job.organization.name;
        }
        if (job.jobType === 'company' && job.company) {
            return job.company.name;
        }
        return 'Unknown';
    };

    const ownerName = getOwnerName();
    const avatarUrl = getAvatarUrl({
        profile: ownerProfile,
        name: ownerName,
        fallbackColor: job.jobType === 'organization' ? '#4F46E5' : '#10B981',
        size: size === 'sm' ? 32 : size === 'md' ? 48 : 64,
    });

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    const ownerInitials = getInitials(ownerName);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10 md:w-12 md:h-12',
        lg: 'w-14 h-14 md:w-16 md:h-16'
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
        if (fallback) {
            fallback.style.display = 'flex';
        }
    };

    return (
        <div className={cn(
            "relative rounded-full overflow-hidden border",
            sizeClasses[size],
            theme.border.primary,
            "bg-gray-100 dark:bg-gray-800", // Fallback background
            className
        )}>
            {/* Avatar Image */}
            <img
                src={avatarUrl}
                alt={ownerName}
                className="object-cover w-full h-full"
                onError={handleImageError}
            />

            {/* Fallback Initials */}
            <div
                className={cn(
                    "w-full h-full flex items-center justify-center",
                    "font-bold text-white",
                    job.jobType === 'organization'
                        ? 'bg-purple-600'
                        : 'bg-green-600'
                )}
                style={{ display: 'none' }}
            >
                <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
                    {ownerInitials}
                </span>
            </div>
        </div>
    );
};

export default JobHeader;