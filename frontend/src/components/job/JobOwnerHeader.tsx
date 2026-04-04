/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Job, JobStatus, SalaryMode, jobService } from '@/services/jobService';
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
    CheckCircle,
    PauseCircle,
    XCircle,
    Archive,
    Trash2,
    MoreVertical,
    Eye,
    Users,
    Clock,
    AlertCircle,
    FileCheck,
    DollarSign,
    EyeOff,
    Handshake,
    BarChart3,
    Copy,
    Sparkles,
    Users as UsersIcon,
    TrendingUp,
    Settings,
    ExternalLink,
    ChevronDown,
    Globe
} from 'lucide-react';
import { getTheme, ThemeMode } from '@/utils/color';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/DropdownMenu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/Tooltip";
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

export type UserRole = 'company' | 'organization';

export interface JobOwnerHeaderProps {
    job: Job;
    role: UserRole;
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    onEdit?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: JobStatus) => void;
    onViewApplications?: () => void;
    onViewStats?: () => void;
    onDuplicate?: () => void;
    onToggleApply?: (enabled: boolean) => void;
    isDeleting?: boolean;
    isUpdating?: boolean;
    className?: string;
    themeMode?: 'light' | 'dark';
    showMetrics?: boolean;
}

// ===== METRICS CARD COMPONENT =====
interface MetricCardProps {
    label: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    themeMode: 'light' | 'dark';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, color, themeMode }) => {
    const theme = getTheme(themeMode);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-help transition-all hover:scale-105"
                        style={{
                            backgroundColor: theme.bg.secondary,
                            border: `1px solid ${theme.border.secondary}`
                        }}
                    >
                        <Icon className="w-3 h-3" style={{ color }} />
                        <span className="text-xs font-medium" style={{ color: theme.text.primary }}>
                            {value}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// ===== SALARY DISPLAY COMPONENT =====
interface SalaryDisplayProps {
    job: Job;
    themeMode?: 'light' | 'dark';
}

const SalaryDisplay: React.FC<SalaryDisplayProps> = ({ job, themeMode = 'light' }) => {
    const theme = getTheme(themeMode);

    const getSalaryConfig = () => {
        switch (job.salaryMode) {
            case SalaryMode.RANGE:
                return {
                    icon: DollarSign,
                    label: jobService.getFormattedSalary(job),
                    color: theme.text.green,
                };
            case SalaryMode.HIDDEN:
                return {
                    icon: EyeOff,
                    label: 'Hidden',
                    color: theme.text.muted,
                };
            case SalaryMode.NEGOTIABLE:
                return {
                    icon: Handshake,
                    label: 'Negotiable',
                    color: theme.text.orange,
                };
            case SalaryMode.COMPANY_SCALE:
                return {
                    icon: Building,
                    label: 'Scale',
                    color: theme.text.blue,
                };
            default:
                return {
                    icon: DollarSign,
                    label: 'Not specified',
                    color: theme.text.muted,
                };
        }
    };

    const config = getSalaryConfig();

    return (
        <div
            className="inline-flex items-center rounded-full text-xs px-2.5 py-1 gap-1.5"
            style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.secondary}`,
                color: config.color
            }}
        >
            <config.icon className="w-3 h-3" />
            <span>{config.label}</span>
        </div>
    );
};

// ===== AVATAR COMPONENT =====
interface AvatarProps {
    job: Job;
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    themeMode?: 'light' | 'dark';
    size?: 'sm' | 'md';
    showVerified?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
    job,
    ownerProfile,
    themeMode = 'light',
    size = 'md',
    showVerified = true
}) => {
    const theme = getTheme(themeMode);
    const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
    const ownerName = job.ownerName || ownerInfo?.name || 'Unknown';
    const isVerified = job.ownerVerified || ownerInfo?.verified || false;

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10'
    };

    const avatarUrl = getAvatarUrl({
        profile: ownerProfile,
        name: ownerName,
        fallbackColor: job.jobType === 'organization' ? '#4F46E5' : '#10B981',
        size: size === 'sm' ? 32 : 40,
    });

    return (
        <div className="relative">
            <div className={cn(
                sizeClasses[size],
                "rounded-lg overflow-hidden shrink-0 border-2",
                themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'
            )}>
                <img
                    src={avatarUrl}
                    alt={ownerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const initials = ownerName
                            .split(' ')
                            .map(part => part.charAt(0))
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                        const bgColor = job.jobType === 'organization' ? '4F46E5' : '10B981';
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=40`;
                    }}
                />
            </div>
            {showVerified && isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-gray-800">
                    <Shield className="w-2.5 h-2.5 text-white" />
                </div>
            )}
        </div>
    );
};

// ===== STATUS BADGE COMPONENT =====
interface StatusBadgeProps {
    status: JobStatus;
    themeMode?: 'light' | 'dark';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, themeMode = 'light' }) => {
    const theme = getTheme(themeMode);

    const getStatusConfig = (status: JobStatus) => {
        const configs = {
            [JobStatus.DRAFT]: {
                label: 'Draft',
                color: theme.text.muted,
                icon: FileCheck,
            },
            [JobStatus.ACTIVE]: {
                label: 'Active',
                color: theme.text.green,
                icon: CheckCircle,
            },
            [JobStatus.PAUSED]: {
                label: 'Paused',
                color: theme.text.orange,
                icon: PauseCircle,
            },
            [JobStatus.CLOSED]: {
                label: 'Closed',
                color: theme.text.error,
                icon: XCircle,
            },
            [JobStatus.ARCHIVED]: {
                label: 'Archived',
                color: theme.text.teal || '#8B5CF6',
                icon: Archive,
            }
        };
        return configs[status] || configs[JobStatus.DRAFT];
    };

    const config = getStatusConfig(status);

    return (
        <span
            className="inline-flex items-center rounded-full text-xs px-2 py-0.5 gap-1"
            style={{
                backgroundColor: theme.bg.secondary,
                border: `1px solid ${theme.border.secondary}`,
                color: config.color
            }}
        >
            <config.icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

// ===== MAIN JOB OWNER HEADER COMPONENT =====
export const JobOwnerHeader: React.FC<JobOwnerHeaderProps> = ({
    job,
    role,
    ownerProfile,
    onEdit,
    onShare,
    onDelete,
    onStatusChange,
    onViewApplications,
    onViewStats,
    onDuplicate,
    onToggleApply,
    isDeleting = false,
    isUpdating = false,
    className = '',
    themeMode: propThemeMode = 'light',
    showMetrics = true,
}) => {
    const themeMode = propThemeMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const theme = getTheme(themeMode);

    const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
    const ownerName = job.ownerName || ownerInfo?.name || 'Unknown';
    const isVerified = job.ownerVerified || ownerInfo?.verified || false;

    const getDaysAgo = (dateString: string) => {
        const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const handleStatusChange = (newStatus: JobStatus) => {
        onStatusChange?.(newStatus);
    };

    const handleToggleApply = () => {
        onToggleApply?.(!job.isApplyEnabled);
    };

    // Get accent color based on job type
    const getAccentColor = () => {
        return job.jobType === 'organization' ? '#8B5CF6' : '#10B981';
    };

    return (
        <div className={cn("w-full", className)}>
            {/* Header with proper background color */}
            <div
                className="border-b sticky top-0 z-10"
                style={{
                    backgroundColor: theme.bg.primary,
                    borderColor: theme.border.secondary
                }}
            >
                {/* Decorative top bar with accent color */}
                <div className="h-0.5 w-full" style={{ background: getAccentColor() }} />

                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
                    {/* Desktop Layout (md and up) */}
                    <div className="hidden md:block">
                        {/* Top Row */}
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: Avatar and Title */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Avatar
                                    job={job}
                                    ownerProfile={ownerProfile}
                                    themeMode={themeMode}
                                    size="md"
                                    showVerified={true}
                                />

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-bold truncate" style={{ color: theme.text.primary }}>
                                            {job.title}
                                        </h1>
                                        <StatusBadge status={job.status} themeMode={themeMode} />
                                        {job.featured && (
                                            <Badge className="bg-linear-to-r from-yellow-400 to-yellow-500 text-white border-none text-xs px-2 py-0.5">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Featured
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs mt-1">
                                        <span className="font-medium" style={{ color: theme.text.secondary }}>
                                            {ownerName}
                                        </span>
                                        {isVerified && <Shield className="w-3 h-3 text-green-500" />}
                                        <span style={{ color: theme.text.muted }}>•</span>
                                        <span style={{ color: theme.text.muted }}>
                                            {job.jobType === 'organization' ? 'Non-profit' : 'Company'}
                                        </span>
                                        {job.jobNumber && (
                                            <>
                                                <span style={{ color: theme.text.muted }}>•</span>
                                                <span className="font-mono" style={{ color: theme.text.muted }}>
                                                    #{job.jobNumber}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Location and Date */}
                                    <div className="flex items-center gap-3 text-xs mt-1.5">
                                        <div className="flex items-center gap-1" style={{ color: theme.text.muted }}>
                                            <MapPin className="w-3 h-3" />
                                            <span>{job.location?.city || job.location?.region || 'Remote'}</span>
                                        </div>
                                        <div className="flex items-center gap-1" style={{ color: theme.text.muted }}>
                                            <Briefcase className="w-3 h-3" />
                                            <span>{jobService.getJobTypeLabel(job.type)}</span>
                                        </div>
                                        <div className="flex items-center gap-1" style={{ color: theme.text.muted }}>
                                            <Calendar className="w-3 h-3" />
                                            <span>{getDaysAgo(job.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                {/* Metrics */}
                                {showMetrics && (
                                    <div className="flex items-center gap-1">
                                        <MetricCard
                                            label="Views"
                                            value={job.viewCount || 0}
                                            icon={Eye}
                                            color={theme.text.blue}
                                            themeMode={themeMode}
                                        />
                                        <MetricCard
                                            label="Applications"
                                            value={job.applicationCount || 0}
                                            icon={Users}
                                            color={theme.text.green}
                                            themeMode={themeMode}
                                        />
                                    </div>
                                )}

                                {/* View Applications Button */}
                                <Button
                                    onClick={onViewApplications}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Users className="w-4 h-4 mr-1.5" />
                                    <span>{job.applicationCount || 0}</span>
                                </Button>

                                {/* Actions Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="px-2"
                                            style={{
                                                backgroundColor: theme.bg.primary,
                                                borderColor: theme.border.primary,
                                                color: theme.text.secondary
                                            }}
                                        >
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="min-w-[180px]"
                                        style={{
                                            backgroundColor: theme.bg.primary,
                                            borderColor: theme.border.primary
                                        }}
                                    >
                                        {/* Edit */}
                                        <DropdownMenuItem onClick={onEdit} style={{ color: theme.text.primary }}>
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Edit Job
                                        </DropdownMenuItem>

                                        {/* Status Submenu */}
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger style={{ color: theme.text.primary }}>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Change Status
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent
                                                style={{
                                                    backgroundColor: theme.bg.primary,
                                                    borderColor: theme.border.primary
                                                }}
                                            >
                                                <DropdownMenuRadioGroup
                                                    value={job.status}
                                                    onValueChange={(value) => handleStatusChange(value as JobStatus)}
                                                >
                                                    {Object.values(JobStatus).map((status) => {
                                                        const config = {
                                                            [JobStatus.DRAFT]: { label: 'Draft', icon: FileCheck, color: theme.text.muted },
                                                            [JobStatus.ACTIVE]: { label: 'Active', icon: CheckCircle, color: theme.text.green },
                                                            [JobStatus.PAUSED]: { label: 'Paused', icon: PauseCircle, color: theme.text.orange },
                                                            [JobStatus.CLOSED]: { label: 'Closed', icon: XCircle, color: theme.text.error },
                                                            [JobStatus.ARCHIVED]: { label: 'Archived', icon: Archive, color: theme.text.teal || '#8B5CF6' }
                                                        }[status];
                                                        return (
                                                            <DropdownMenuRadioItem
                                                                key={status}
                                                                value={status}
                                                                style={{ color: theme.text.primary }}
                                                            >
                                                                <config.icon className="w-4 h-4 mr-2" style={{ color: config.color }} />
                                                                {config.label}
                                                            </DropdownMenuRadioItem>
                                                        );
                                                    })}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>

                                        {/* Toggle Applications */}
                                        <DropdownMenuItem onClick={handleToggleApply} style={{ color: theme.text.primary }}>
                                            {job.isApplyEnabled ? (
                                                <>
                                                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                                    Disable Applications
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                    Enable Applications
                                                </>
                                            )}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />

                                        {/* Share */}
                                        <DropdownMenuItem onClick={onShare} style={{ color: theme.text.primary }}>
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Share Job
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />

                                        {/* Delete (Danger) */}
                                        <DropdownMenuItem
                                            onClick={onDelete}
                                            style={{ color: theme.text.error }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Job
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Bottom Row - Salary and Additional Info */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <SalaryDisplay job={job} themeMode={themeMode} />

                            {job.applicationDeadline && (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                                    style={{
                                        backgroundColor: theme.bg.secondary,
                                        border: `1px solid ${theme.border.secondary}`
                                    }}
                                >
                                    <Clock className="w-3 h-3" style={{ color: theme.text.muted }} />
                                    <span style={{ color: theme.text.secondary }}>
                                        Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                    </span>
                                </div>
                            )}

                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                                style={{
                                    backgroundColor: theme.bg.secondary,
                                    border: `1px solid ${theme.border.secondary}`
                                }}
                            >
                                <Users className="w-3 h-3" style={{ color: theme.text.muted }} />
                                <span style={{ color: theme.text.secondary }}>
                                    {job.candidatesNeeded || 1} needed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout (below md) */}
                    <div className="md:hidden space-y-3">
                        {/* Avatar and Title Row */}
                        <div className="flex items-start gap-2">
                            <Avatar
                                job={job}
                                ownerProfile={ownerProfile}
                                themeMode={themeMode}
                                size="sm"
                                showVerified={true}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h1 className="text-base font-bold truncate" style={{ color: theme.text.primary }}>
                                        {job.title}
                                    </h1>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="px-2 h-7"
                                                style={{
                                                    backgroundColor: theme.bg.primary,
                                                    borderColor: theme.border.primary,
                                                    color: theme.text.secondary
                                                }}
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="min-w-[160px]"
                                            style={{
                                                backgroundColor: theme.bg.primary,
                                                borderColor: theme.border.primary
                                            }}
                                        >
                                            <DropdownMenuItem onClick={onViewApplications} style={{ color: theme.text.primary }}>
                                                <Users className="w-4 h-4 mr-2" />
                                                Applications ({job.applicationCount || 0})
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={onEdit} style={{ color: theme.text.primary }}>
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleToggleApply} style={{ color: theme.text.primary }}>
                                                {job.isApplyEnabled ? 'Disable Apps' : 'Enable Apps'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />
                                            <DropdownMenuItem onClick={onShare} style={{ color: theme.text.primary }}>
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator style={{ backgroundColor: theme.border.secondary }} />
                                            <DropdownMenuItem onClick={onDelete} style={{ color: theme.text.error }}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center gap-1 text-xs mt-0.5">
                                    <span className="font-medium" style={{ color: theme.text.secondary }}>
                                        {ownerName}
                                    </span>
                                    {isVerified && <Shield className="w-2.5 h-2.5 text-green-500" />}
                                </div>

                                <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                                    <StatusBadge status={job.status} themeMode={themeMode} />
                                    <div className="flex items-center gap-1" style={{ color: theme.text.muted }}>
                                        <MapPin className="w-2.5 h-2.5" />
                                        <span>{job.location?.city || 'Remote'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Row */}
                        <div className="flex items-center gap-2">
                            <SalaryDisplay job={job} themeMode={themeMode} />
                            <div
                                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                style={{
                                    backgroundColor: theme.bg.secondary,
                                    border: `1px solid ${theme.border.secondary}`
                                }}
                            >
                                <Eye className="w-3 h-3" style={{ color: theme.text.muted }} />
                                <span style={{ color: theme.text.primary }}>{job.viewCount || 0}</span>
                            </div>
                            <div
                                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                style={{
                                    backgroundColor: theme.bg.secondary,
                                    border: `1px solid ${theme.border.secondary}`
                                }}
                            >
                                <Users className="w-3 h-3" style={{ color: theme.text.muted }} />
                                <span style={{ color: theme.text.primary }}>{job.applicationCount || 0}</span>
                            </div>
                        </div>

                        {/* Deadline Row */}
                        {job.applicationDeadline && (
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                                style={{
                                    backgroundColor: theme.bg.secondary,
                                    border: `1px solid ${theme.border.secondary}`
                                }}
                            >
                                <Clock className="w-3 h-3" style={{ color: theme.text.muted }} />
                                <span style={{ color: theme.text.secondary }}>
                                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {(isDeleting || isUpdating) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="rounded-lg p-4 flex items-center gap-3 shadow-xl"
                            style={{
                                backgroundColor: theme.bg.primary,
                                border: `1px solid ${theme.border.primary}`
                            }}
                        >
                            <LoadingSpinner />
                            <p className="text-sm" style={{ color: theme.text.secondary }}>
                                {isDeleting ? 'Deleting...' : 'Updating...'}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default JobOwnerHeader;