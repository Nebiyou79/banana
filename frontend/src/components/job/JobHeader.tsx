/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Job, JobStatus, SalaryMode, jobService, ApplicationStatusReason } from '@/services/jobService';
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
    Eye,
    Users,
    Clock,
    Lock,
    AlertCircle,
    FileCheck,
    Sparkles,
    DollarSign,
    EyeOff,
    Handshake,
} from 'lucide-react';
import { getTheme } from '@/utils/color';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import LoadingSpinner from '@/components/LoadingSpinner';

export type UserRole = 'candidate' | 'company' | 'organization';

export interface JobHeaderProps {
    job: Job;
    role: UserRole;
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    onApply?: () => void;
    onSave?: () => void;
    onShare?: () => void;
    onEdit?: () => void;
    onStatusChange?: (status: JobStatus) => void;
    onDelete?: () => void;
    isSaved?: boolean;
    isApplying?: boolean;
    isSaving?: boolean;
    hasApplied?: boolean;
    userApplication?: any;
    className?: string;
    compact?: boolean;
    showApplicationStatus?: boolean;
    themeMode?: 'light' | 'dark';
}

// ===== ENHANCED AVATAR COMPONENT =====
interface AvatarProps {
    job: Job;
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    themeMode?: 'light' | 'dark';
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
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20'
    };

    const getAvatarUrl = (): string => {
        if (job.ownerAvatarUrl && !job.ownerAvatarUrl.includes('ui-avatars.com')) {
            return job.ownerAvatarUrl;
        }

        if (ownerProfile) {
            if ('avatar' in ownerProfile && ownerProfile.avatar?.secure_url) {
                return ownerProfile.avatar.secure_url;
            }
            if ('user' in ownerProfile && ownerProfile.user?.avatar) {
                return ownerProfile.user.avatar;
            }
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
            sm: 40,
            md: 56,
            lg: 80
        };

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=${sizeMap[size]}`;
    };

    const avatarUrl = getAvatarUrl();
    const [imgError, setImgError] = React.useState(false);

    return (
        <div
            className={cn(
                sizeClasses[size],
                "rounded-xl overflow-hidden shrink-0",
                bordered ? 'ring-2 ring-offset-2' : 'shadow-md',
                "transition-transform hover:scale-105 duration-300"
            )}
            style={{
                backgroundColor: theme.bg.secondary
            }}
        >
            {!imgError ? (
                <img
                    src={avatarUrl}
                    alt={`${ownerName} logo`}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                    {ownerName.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );
};

// ===== ENHANCED APPLY BUTTON with "Applications Locked" =====
interface ApplyButtonProps {
    job: Job;
    onClick: (e: React.MouseEvent) => void;
    disabled: boolean;
    applying: boolean;
    hasApplied: boolean;
    themeMode?: 'light' | 'dark';
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
            let bgColor = 'bg-gray-400 dark:bg-gray-600';

            if (statusReason === ApplicationStatusReason.DISABLED) {
                buttonText = 'Applications Locked';
                icon = Lock;
            } else if (statusReason === ApplicationStatusReason.INACTIVE) {
                buttonText = 'Position Inactive';
                icon = PauseCircle;
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

// ===== INFO ROW COMPONENT for better mobile display =====
interface InfoRowProps {
    icon: React.ElementType;
    label: string;
    value: string;
    className?: string;
    themeMode?: 'light' | 'dark';
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, className, themeMode }) => {
    const theme = getTheme(themeMode || 'light');

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Icon className="w-4 h-4 shrink-0" style={{ color: theme.text.muted }} />
            <span className="text-sm" style={{ color: theme.text.secondary }}>{value}</span>
        </div>
    );
};

// ===== DETAILS CHIP COMPONENT for mobile =====
interface DetailChipProps {
    icon: React.ElementType;
    label: string;
    value: string;
    themeMode?: 'light' | 'dark';
}

const DetailChip: React.FC<DetailChipProps> = ({ icon: Icon, label, value, themeMode }) => {
    const theme = getTheme(themeMode || 'light');

    return (
        <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
            style={{
                backgroundColor: theme.bg.secondary,
                color: theme.text.secondary
            }}
            title={label}
        >
            <Icon className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{value}</span>
        </div>
    );
};

// ===== MAIN JOBHEADER COMPONENT =====
export const JobHeader: React.FC<JobHeaderProps> = ({
    job,
    role,
    ownerProfile,
    onApply,
    onSave,
    onShare,
    onEdit,
    onStatusChange,
    onDelete,
    isSaved = false,
    isApplying = false,
    isSaving = false,
    hasApplied = false,
    userApplication,
    className = '',
    compact = false,
    showApplicationStatus = true,
    themeMode: propThemeMode = 'light'
}) => {
    const themeMode = propThemeMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const theme = getTheme(themeMode);

    const ownerName = job.ownerName ||
        (job.jobType === 'organization' ? job.organization?.name : job.company?.name) ||
        'Unknown';

    const ownerVerified = job.ownerVerified ||
        (job.jobType === 'organization' ? job.organization?.verified : job.company?.verified) ||
        false;

    const isOwner = (role === 'company' && job.jobType === 'company') ||
        (role === 'organization' && job.jobType === 'organization');

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays}d ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDaysUntilDeadline = () => {
        if (!job.applicationDeadline) return null;
        const days = Math.floor((new Date(job.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return 'Expired';
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `${days}d left`;
    };

    const deadlineInfo = getDaysUntilDeadline();
    const canApply = jobService.canJobAcceptApplications(job);

    const handleApply = (e: React.MouseEvent) => {
        if (onApply) onApply();
    };

    const getAppliedDate = () => {
        if (userApplication?.createdAt) {
            return new Date(userApplication.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
        return null;
    };

    const getLocationDisplay = () => {
        if (job.location?.region === 'international') {
            return '🌍 Worldwide (Remote)';
        }
        const city = job.location?.city || '';
        const region = job.location?.region || '';
        const country = job.location?.country || 'Ethiopia';

        if (city && region) return `${city}, ${region}`;
        if (region) return `${region}, ${country}`;
        return 'Location not specified';
    };

    const getSalaryDisplay = () => {
        return jobService.getFormattedSalary(job);
    };

    const getJobTypeDisplay = () => {
        return jobService.getJobTypeLabel(job.type);
    };

    const getExperienceDisplay = () => {
        return jobService.getExperienceLabel(job.experienceLevel);
    };

    return (
        <div className={cn(
            "w-full",
            themeMode === 'dark' ? 'bg-gray-900' : 'bg-white',
            "border-b",
            themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200',
            "sticky top-0 z-40",
            className
        )}>
            {/* Top Bar with Quick Stats - Hidden on mobile */}
            <div className={cn(
                "border-b",
                themeMode === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-white/50',
                "backdrop-blur-sm hidden sm:block"
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <span className={themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                {job.jobType === 'organization' ? 'Opportunity' : 'Job'} Details
                            </span>
                            <span className={themeMode === 'dark' ? 'text-gray-700' : 'text-gray-300'}>•</span>
                            <span className={cn(
                                "font-medium truncate max-w-[200px]",
                                themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>
                                {job.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm" style={{ color: theme.text.muted }}>
                                <Eye className="w-4 h-4" />
                                <span>{job.viewCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm" style={{ color: theme.text.muted }}>
                                <Users className="w-4 h-4" />
                                <span>{job.applicationCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm" style={{ color: theme.text.muted }}>
                                <Bookmark className="w-4 h-4" />
                                <span>{job.saveCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
                    {/* Left Section - Avatar and Title */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 sm:gap-4">
                            {/* Avatar - Hidden on very small screens? No, keep it visible but maybe smaller? */}
                            <Avatar
                                job={job}
                                ownerProfile={ownerProfile}
                                themeMode={themeMode}
                                size="lg"
                                bordered={ownerVerified}
                            />

                            {/* Title and Meta */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h1 className={cn(
                                        "font-bold truncate",
                                        "text-xl sm:text-2xl md:text-3xl",
                                        themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {job.title}
                                    </h1>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2">
                                        {job.featured && (
                                            <Badge className="bg-linear-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Featured
                                            </Badge>
                                        )}
                                        {job.urgent && (
                                            <Badge className="bg-linear-to-r from-red-500 to-rose-500 text-white border-0 text-xs">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Urgent
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Company Info Row */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-[300px]",
                                            themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        )}>
                                            {ownerName}
                                        </span>
                                        {ownerVerified && (
                                            <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 text-xs whitespace-nowrap">
                                                <Shield className="w-3 h-3 mr-1" />
                                                Verified
                                            </Badge>
                                        )}
                                    </div>

                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                                        themeMode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                                    )}>
                                        {job.jobType === 'organization' ? 'Non-profit' : 'Company'}
                                    </span>

                                    {/* Status Badge for Owners - Hidden on mobile */}
                                    {isOwner && (
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize hidden sm:inline-flex",
                                                job.status === JobStatus.ACTIVE && "border-green-500 text-green-600 dark:text-green-400",
                                                job.status === JobStatus.DRAFT && "border-gray-500 text-gray-600 dark:text-gray-400",
                                                job.status === JobStatus.PAUSED && "border-amber-500 text-amber-600 dark:text-amber-400",
                                                job.status === JobStatus.CLOSED && "border-red-500 text-red-600 dark:text-red-400",
                                                job.status === JobStatus.ARCHIVED && "border-purple-500 text-purple-600 dark:text-purple-400"
                                            )}
                                        >
                                            {job.status}
                                        </Badge>
                                    )}
                                </div>

                                {/* Location and Type Row - Desktop Version */}
                                <div className="hidden sm:flex flex-wrap items-center gap-4 text-sm">
                                    <InfoRow icon={MapPin} label="Location" value={getLocationDisplay()} themeMode={themeMode} />
                                    <InfoRow icon={Briefcase} label="Job Type" value={getJobTypeDisplay()} themeMode={themeMode} />
                                    <InfoRow icon={Calendar} label="Posted" value={formatDate(job.createdAt)} themeMode={themeMode} />
                                    {deadlineInfo && (
                                        <InfoRow
                                            icon={Clock}
                                            label="Deadline"
                                            value={deadlineInfo === 'Expired' ? 'Deadline passed' : `${deadlineInfo}`}
                                            themeMode={themeMode}
                                        />
                                    )}
                                </div>

                                {/* Salary, Experience, and Positions - Desktop Version */}
                                <div className="hidden sm:flex flex-wrap items-center gap-3 mt-3">
                                    {/* Salary Display */}
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                                        job.salaryMode === SalaryMode.RANGE && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                        job.salaryMode === SalaryMode.HIDDEN && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                                        job.salaryMode === SalaryMode.NEGOTIABLE && "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                        job.salaryMode === SalaryMode.COMPANY_SCALE && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    )}>
                                        {job.salaryMode === SalaryMode.RANGE && <DollarSign className="w-3 h-3 mr-1" />}
                                        {job.salaryMode === SalaryMode.HIDDEN && <EyeOff className="w-3 h-3 mr-1" />}
                                        {job.salaryMode === SalaryMode.NEGOTIABLE && <Handshake className="w-3 h-3 mr-1" />}
                                        {job.salaryMode === SalaryMode.COMPANY_SCALE && <Building className="w-3 h-3 mr-1" />}
                                        <span>{getSalaryDisplay()}</span>
                                    </div>

                                    <InfoRow icon={Briefcase} label="Experience" value={getExperienceDisplay()} themeMode={themeMode} />

                                    <InfoRow icon={Users} label="Positions" value={`${job.candidatesNeeded || 1} position${(job.candidatesNeeded || 1) > 1 ? 's' : ''}`} themeMode={themeMode} />
                                </div>

                                {/* Mobile Version - All details as chips */}
                                <div className="flex sm:hidden flex-wrap gap-2 mt-3">
                                    <DetailChip icon={MapPin} label="Location" value={getLocationDisplay()} themeMode={themeMode} />
                                    <DetailChip icon={Briefcase} label="Job Type" value={getJobTypeDisplay()} themeMode={themeMode} />
                                    <DetailChip icon={Calendar} label="Posted" value={formatDate(job.createdAt)} themeMode={themeMode} />

                                    {/* Salary Chip */}
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                                        job.salaryMode === SalaryMode.RANGE && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                        job.salaryMode === SalaryMode.HIDDEN && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                                        job.salaryMode === SalaryMode.NEGOTIABLE && "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                        job.salaryMode === SalaryMode.COMPANY_SCALE && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    )}>
                                        {job.salaryMode === SalaryMode.RANGE && <DollarSign className="w-3 h-3" />}
                                        {job.salaryMode === SalaryMode.HIDDEN && <EyeOff className="w-3 h-3" />}
                                        {job.salaryMode === SalaryMode.NEGOTIABLE && <Handshake className="w-3 h-3" />}
                                        {job.salaryMode === SalaryMode.COMPANY_SCALE && <Building className="w-3 h-3" />}
                                        <span className="truncate max-w-[100px]">{getSalaryDisplay()}</span>
                                    </div>

                                    <DetailChip icon={Briefcase} label="Experience" value={getExperienceDisplay()} themeMode={themeMode} />
                                    <DetailChip icon={Users} label="Positions" value={`${job.candidatesNeeded || 1} position${(job.candidatesNeeded || 1) > 1 ? 's' : ''}`} themeMode={themeMode} />

                                    {deadlineInfo && (
                                        <DetailChip
                                            icon={Clock}
                                            label="Deadline"
                                            value={deadlineInfo === 'Expired' ? 'Deadline passed' : `${deadlineInfo}`}
                                            themeMode={themeMode}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 lg:w-72 mt-2 sm:mt-0">
                        {/* Candidate Actions */}
                        {role === 'candidate' && (
                            <div className="space-y-3">
                                {onApply && (
                                    <ApplyButton
                                        job={job}
                                        onClick={handleApply}
                                        disabled={isApplying || hasApplied}
                                        applying={isApplying}
                                        hasApplied={hasApplied}
                                        themeMode={themeMode}
                                        size="lg"
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    {onSave && (
                                        <Button
                                            variant="outline"
                                            onClick={onSave}
                                            disabled={isSaving}
                                            className={cn(
                                                "inline-flex items-center justify-center w-full h-11 border transition-all duration-200",
                                                isSaved
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                    : "border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            )}
                                        >
                                            {isSaving ? (
                                                <LoadingSpinner size="sm" themeMode={themeMode} />
                                            ) : (
                                                <>
                                                    <Bookmark className={cn("w-4 h-4 mr-2", isSaved && "fill-current")} />
                                                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {onShare && (
                                        <Button
                                            variant="outline"
                                            onClick={onShare}
                                            className="inline-flex items-center justify-center w-full h-11 border border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                                        >
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Share
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Owner Actions (Company/Organization) */}
                        {isOwner && (
                            <div className="space-y-3">
                                {onEdit && (
                                    <Button
                                        onClick={onEdit}
                                        className="inline-flex items-center justify-center w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit Job Details
                                    </Button>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    {onShare && (
                                        <Button
                                            variant="outline"
                                            onClick={onShare}
                                            className="inline-flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-11"
                                        >
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Share
                                        </Button>
                                    )}

                                    {onStatusChange && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="inline-flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-11"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                    Change Status
                                                </div>
                                                {job.status !== JobStatus.ACTIVE && (
                                                    <DropdownMenuItem onClick={() => onStatusChange(JobStatus.ACTIVE)}>
                                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}
                                                {job.status !== JobStatus.PAUSED && (
                                                    <DropdownMenuItem onClick={() => onStatusChange(JobStatus.PAUSED)}>
                                                        <PauseCircle className="w-4 h-4 mr-2 text-amber-600" />
                                                        Pause
                                                    </DropdownMenuItem>
                                                )}
                                                {job.status !== JobStatus.CLOSED && (
                                                    <DropdownMenuItem onClick={() => onStatusChange(JobStatus.CLOSED)}>
                                                        <XCircle className="w-4 h-4 mr-2 text-rose-600" />
                                                        Close
                                                    </DropdownMenuItem>
                                                )}
                                                {job.status !== JobStatus.ARCHIVED && (
                                                    <DropdownMenuItem onClick={() => onStatusChange(JobStatus.ARCHIVED)}>
                                                        <Archive className="w-4 h-4 mr-2 text-purple-600" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                )}
                                                {onDelete && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={onDelete}
                                                            className="text-rose-600 focus:text-rose-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete Job
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Application Status Banner for Candidates - FIXED: Smaller and less prominent */}
                {role === 'candidate' && showApplicationStatus && (
                    <div className="mt-4 sm:mt-6">
                        {hasApplied ? (
                            <div className="bg-linear-to-r from-emerald-500 to-green-500 text-white rounded-lg p-3 sm:p-4 shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-lg">
                                        <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm sm:text-base">Application Submitted Successfully!</p>
                                        <p className="text-emerald-50 text-xs sm:text-sm">
                                            You applied on {getAppliedDate() || 'recently'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : !canApply ? (
                            <div className={cn(
                                "rounded-lg p-3 sm:p-4 shadow-sm border",
                                themeMode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                            )}>
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-1.5 rounded-lg",
                                        themeMode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                    )}>
                                        <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn(
                                            "font-medium text-sm",
                                            themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        )}>
                                            Applications Locked by Company
                                        </p>
                                        <p className={cn(
                                            "text-xs mt-0.5",
                                            themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        )}>
                                            {job.status === JobStatus.CLOSED ? 'Position closed by employer' :
                                                job.status === JobStatus.PAUSED ? 'Applications temporarily paused' :
                                                    'Applications are currently closed for this position'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : job.applicationDeadline && (
                            <div className={cn(
                                "rounded-lg p-3 sm:p-4 shadow-sm border",
                                themeMode === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-1.5 rounded-lg",
                                        themeMode === 'dark' ? 'bg-blue-800/30' : 'bg-blue-100'
                                    )}>
                                        <Clock className={cn(
                                            "w-4 h-4",
                                            themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                        )} />
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "font-semibold text-sm sm:text-base",
                                            themeMode === 'dark' ? 'text-blue-400' : 'text-blue-700'
                                        )}>
                                            Apply Before Deadline
                                        </p>
                                        <p className={cn(
                                            "text-xs sm:text-sm",
                                            themeMode === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                        )}>
                                            {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobHeader;