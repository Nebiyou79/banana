/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Job, JobStatus, SalaryMode, jobService } from '@/services/jobService';
import { Profile, DetailedProfile, PublicProfile } from '@/services/profileService';
import { getTheme, ThemeMode } from '@/utils/color';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    MapPin,
    Briefcase,
    Calendar,
    Building,
    Shield,
    Edit3,
    Share2,
    CheckCircle,
    PauseCircle,
    XCircle,
    Archive,
    Eye,
    Users,
    Clock,
    Lock,
    AlertCircle,
    FileCheck,
    DollarSign,
    EyeOff,
    Handshake,
    Award,
    Target,
    Heart,
    FileText,
    GraduationCap,
    Zap,
    Tag,
    Globe,
    Mail,
    Phone,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    BarChart3,
    Download,
    Settings,
    Sparkles,
    UserCheck,
    Users as UsersIcon,
    TrendingUp,
    Activity,
    Copy,
    Trash2,
    CheckSquare,
    AlertTriangle,
    Info,
    Loader2,
    Hash,
    Bookmark,
    Layers,
    ListChecks,
    Briefcase as BriefcaseIcon,
    CalendarDays,
    MapPinned,
    Radio,
    GanttChart,
    PieChart,
    LineChart,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/Tooltip";
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

// ===== INTERFACES =====
export interface JobOwnerDetailsProps {
    job: Job;
    role: 'company' | 'organization';
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: JobStatus) => void;
    onViewApplications?: () => void;
    onViewApplication?: (applicationId: string) => void;
    onToggleApply?: (enabled: boolean) => void;
    onShare?: () => void;
    onExportData?: () => void;
    isDeleting?: boolean;
    isUpdating?: boolean;
    className?: string;
    themeMode?: 'light' | 'dark';
    applications?: any[];
    isLoadingApplications?: boolean;
}

// ===== STAT CARD COMPONENT =====
interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ElementType;
    trend?: number;
    trendLabel?: string;
    color: string;
    themeMode: 'light' | 'dark';
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    trend,
    trendLabel,
    color,
    themeMode
}) => {
    const theme = getTheme(themeMode);

    return (
        <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl p-4 border"
            style={{
                backgroundColor: theme.bg.primary,
                borderColor: theme.border.secondary
            }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium mb-1" style={{ color: theme.text.muted }}>
                        {label}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                        {value}
                    </p>
                    {trend !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                            {trend >= 0 ? (
                                <ArrowUpRight className="w-3 h-3 text-green-500" />
                            ) : (
                                <ArrowDownRight className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {Math.abs(trend)}% {trendLabel || 'vs last week'}
                            </span>
                        </div>
                    )}
                </div>
                <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
};

// ===== PROGRESS TRACKER COMPONENT =====
interface ProgressTrackerProps {
    job: Job;
    themeMode: 'light' | 'dark';
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ job, themeMode }) => {
    const theme = getTheme(themeMode);

    const candidatesNeeded = job.candidatesNeeded || 0;
    const applicationCount = job.applicationCount || 0;
    const candidatesRemaining = jobService.calculateCandidatesRemaining(job);
    const filledCount = candidatesNeeded - candidatesRemaining;
    const fillPercentage = candidatesNeeded > 0 ? (filledCount / candidatesNeeded) * 100 : 0;

    const getProgressColor = () => {
        if (fillPercentage >= 80) return '#EF4444';
        if (fillPercentage >= 50) return '#F59E0B';
        return '#10B981';
    };

    const getStatusText = () => {
        if (candidatesRemaining <= 0) return 'Filled';
        if (candidatesRemaining === 1) return '1 spot left';
        return `${candidatesRemaining} spots left`;
    };

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${getProgressColor()}15` }}
                        >
                            <UsersIcon className="w-4 h-4" style={{ color: getProgressColor() }} />
                        </div>
                        <div>
                            <h3 className="font-semibold" style={{ color: theme.text.primary }}>
                                Hiring Progress
                            </h3>
                            <p className="text-xs" style={{ color: theme.text.muted }}>
                                {filledCount} of {candidatesNeeded} candidates hired
                            </p>
                        </div>
                    </div>
                    <Badge
                        className="px-2.5 py-1 text-xs font-medium"
                        style={{
                            backgroundColor: `${getProgressColor()}15`,
                            color: getProgressColor(),
                            border: `1px solid ${getProgressColor()}30`
                        }}
                    >
                        {getStatusText()}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span style={{ color: theme.text.muted }}>Progress</span>
                        <span style={{ color: theme.text.primary }}>{Math.round(fillPercentage)}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(fillPercentage, 100)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute h-full rounded-full"
                            style={{ backgroundColor: getProgressColor() }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: theme.border.secondary }}>
                    <div className="text-center">
                        <p className="text-lg font-semibold" style={{ color: theme.text.primary }}>
                            {applicationCount}
                        </p>
                        <p className="text-xs" style={{ color: theme.text.muted }}>Applications</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold" style={{ color: theme.text.primary }}>
                            {job.viewCount || 0}
                        </p>
                        <p className="text-xs" style={{ color: theme.text.muted }}>Views</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold" style={{ color: theme.text.primary }}>
                            {job.saveCount || 0}
                        </p>
                        <p className="text-xs" style={{ color: theme.text.muted }}>Saves</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ===== APPLICATION STATUS DISTRIBUTION COMPONENT =====
interface StatusDistributionProps {
    applications: any[];
    themeMode: 'light' | 'dark';
}

const StatusDistribution: React.FC<StatusDistributionProps> = ({ applications, themeMode }) => {
    const theme = getTheme(themeMode);

    const statusConfig: Record<string, { label: string; color: string }> = {
        'applied': { label: 'Applied', color: '#3B82F6' },
        'under-review': { label: 'Under Review', color: '#8B5CF6' },
        'shortlisted': { label: 'Shortlisted', color: '#10B981' },
        'interview-scheduled': { label: 'Interview', color: '#F59E0B' },
        'rejected': { label: 'Rejected', color: '#EF4444' },
        'hired': { label: 'Hired', color: '#6366F1' },
        'withdrawn': { label: 'Withdrawn', color: '#6B7280' }
    };

    const statusCounts = applications.reduce((acc: any, app: any) => {
        const status = app.status || 'applied';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const data = Object.entries(statusCounts)
        .map(([key, value]) => ({
            status: key,
            count: value as number,
            ...statusConfig[key] || { label: key, color: '#6B7280' }
        }))
        .sort((a, b) => b.count - a.count);

    const total = data.reduce((sum, item) => sum + item.count, 0);

    if (applications.length === 0) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <PieChart className="w-6 h-6" style={{ color: theme.text.muted }} />
                    </div>
                    <h4 className="text-sm font-medium mb-1" style={{ color: theme.text.primary }}>
                        No Applications Yet
                    </h4>
                    <p className="text-xs" style={{ color: theme.text.muted }}>
                        Applications will appear here when candidates apply
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="w-4 h-4" style={{ color: theme.text.primary }} />
                    Application Status
                </CardTitle>
                <CardDescription>
                    {total} total application{total !== 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {data.map((item) => (
                    <div key={item.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span style={{ color: theme.text.secondary }}>{item.label}</span>
                            </div>
                            <span className="font-medium" style={{ color: theme.text.primary }}>
                                {item.count} ({Math.round((item.count / total) * 100)}%)
                            </span>
                        </div>
                        <Progress
                            value={(item.count / total) * 100}
                            className="h-1.5"
                            style={{ backgroundColor: theme.bg.secondary }}
                            indicatorStyle={{ backgroundColor: item.color }}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

// ===== RECENT APPLICATIONS COMPONENT =====
interface RecentApplicationsProps {
    applications: any[];
    onViewApplication?: (id: string) => void;
    themeMode: 'light' | 'dark';
    isLoading?: boolean;
}

const RecentApplications: React.FC<RecentApplicationsProps> = ({
    applications,
    onViewApplication,
    themeMode,
    isLoading
}) => {
    const theme = getTheme(themeMode);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'applied': '#3B82F6',
            'under-review': '#8B5CF6',
            'shortlisted': '#10B981',
            'interview-scheduled': '#F59E0B',
            'rejected': '#EF4444',
            'hired': '#6366F1',
            'withdrawn': '#6B7280'
        };
        return colors[status] || '#6B7280';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'applied': 'Applied',
            'under-review': 'Under Review',
            'shortlisted': 'Shortlisted',
            'interview-scheduled': 'Interview',
            'rejected': 'Rejected',
            'hired': 'Hired',
            'withdrawn': 'Withdrawn'
        };
        return labels[status] || status;
    };

    if (isLoading) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center">
                        <LoadingSpinner size="md" />
                        <p className="mt-3 text-sm" style={{ color: theme.text.muted }}>
                            Loading applications...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (applications.length === 0) {
        return (
            <Card className="border shadow-sm">
                <CardContent className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Users className="w-6 h-6" style={{ color: theme.text.muted }} />
                    </div>
                    <h4 className="text-sm font-medium mb-1" style={{ color: theme.text.primary }}>
                        No Applications
                    </h4>
                    <p className="text-xs" style={{ color: theme.text.muted }}>
                        Applications will appear here when candidates apply
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <GanttChart className="w-4 h-4" style={{ color: theme.text.primary }} />
                    Recent Applications
                </CardTitle>
                <CardDescription>
                    Latest {Math.min(applications.length, 5)} of {applications.length} applications
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {applications.slice(0, 5).map((app: any) => (
                    <motion.div
                        key={app._id}
                        whileHover={{ scale: 1.01, x: 4 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 rounded-lg border cursor-pointer group"
                        style={{
                            borderColor: theme.border.primary,
                            backgroundColor: theme.bg.secondary
                        }}
                        onClick={() => onViewApplication?.(app._id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                    style={{ backgroundColor: getStatusColor(app.status) }}
                                >
                                    {app.candidate?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h5 className="text-sm font-medium group-hover:text-blue-600 transition-colors" style={{ color: theme.text.primary }}>
                                        {app.candidate?.name || 'Unknown Candidate'}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge
                                            className="text-[10px] px-1.5 py-0"
                                            style={{
                                                backgroundColor: getStatusColor(app.status) + '15',
                                                color: getStatusColor(app.status)
                                            }}
                                        >
                                            {getStatusLabel(app.status)}
                                        </Badge>
                                        <span className="text-[10px]" style={{ color: theme.text.muted }}>
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.text.muted }} />
                        </div>
                    </motion.div>
                ))}
            </CardContent>
            {applications.length > 5 && (
                <CardFooter className="pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewApplication?.('all')}
                        className="w-full text-xs"
                        style={{ color: theme.text.primary }}
                    >
                        View all {applications.length} applications
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

// ===== JOB DETAILS SECTION COMPONENT =====
interface JobDetailsSectionProps {
    job: Job;
    themeMode: 'light' | 'dark';
}

const JobDetailsSection: React.FC<JobDetailsSectionProps> = ({ job, themeMode }) => {
    const theme = getTheme(themeMode);

    const sections = [
        {
            title: 'Overview',
            icon: Info,
            content: job.shortDescription && (
                <p className="text-sm leading-relaxed" style={{ color: theme.text.secondary }}>
                    {job.shortDescription}
                </p>
            )
        },
        {
            title: 'Full Description',
            icon: FileText,
            content: (
                <div className="prose prose-sm max-w-none" style={{ color: theme.text.secondary }}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                        {job.description}
                    </p>
                </div>
            )
        },
        {
            title: 'Requirements',
            icon: CheckCircle,
            color: theme.text.green,
            content: job.requirements?.length > 0 && (
                <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.text.green }} />
                            <span style={{ color: theme.text.secondary }}>{req}</span>
                        </li>
                    ))}
                </ul>
            )
        },
        {
            title: 'Responsibilities',
            icon: Target,
            color: theme.text.orange,
            content: job.responsibilities?.length > 0 && (
                <ul className="space-y-2">
                    {job.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <Target className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.text.orange }} />
                            <span style={{ color: theme.text.secondary }}>{resp}</span>
                        </li>
                    ))}
                </ul>
            )
        },
        {
            title: 'Required Skills',
            icon: Award,
            color: theme.text.teal || '#8B5CF6',
            content: job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, i) => (
                        <Badge
                            key={i}
                            className="px-3 py-1.5 text-xs"
                            style={{
                                backgroundColor: theme.bg.secondary,
                                borderColor: theme.border.secondary,
                                color: theme.text.secondary
                            }}
                        >
                            {skill}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            title: 'Benefits',
            icon: Heart,
            color: theme.text.error,
            content: job.benefits?.length > 0 && (
                <ul className="space-y-2">
                    {job.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <Heart className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.text.error }} />
                            <span style={{ color: theme.text.secondary }}>{benefit}</span>
                        </li>
                    ))}
                </ul>
            )
        }
    ].filter(section => section.content);

    return (
        <div className="space-y-4">
            {sections.map((section, index) => (
                <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="border shadow-sm overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <section.icon className="w-4 h-4" style={{ color: section.color || theme.text.primary }} />
                                {section.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {section.content}
                        </CardContent>
                    </Card>
                </motion.div>
            ))}

            {/* Additional Details Card */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Layers className="w-4 h-4" style={{ color: theme.text.primary }} />
                        Additional Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={BriefcaseIcon} label="Job Type" value={jobService.getJobTypeLabel(job.type)} theme={theme} />
                        <DetailItem icon={UserCheck} label="Experience" value={jobService.getExperienceLabel(job.experienceLevel)} theme={theme} />
                        <DetailItem icon={GraduationCap} label="Education" value={jobService.getEducationLabel(job.educationLevel)} theme={theme} />
                        <DetailItem icon={Zap} label="Remote Work" value={job.remote} theme={theme} capitalize />
                        <DetailItem icon={Building} label="Work Arrangement" value={
                            job.workArrangement === 'office' ? 'Office Based' :
                                job.workArrangement === 'field-work' ? 'Field Work' : 'Hybrid'
                        } theme={theme} />
                        {job.category && (
                            <DetailItem icon={Tag} label="Category" value={
                                jobService.getJobCategories().find(c => c.value === job.category)?.label || job.category
                            } theme={theme} />
                        )}
                        {job.jobNumber && (
                            <DetailItem icon={Hash} label="Job Number" value={`#${job.jobNumber}`} theme={theme} />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Location Card */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MapPinned className="w-4 h-4" style={{ color: theme.text.primary }} />
                        Location Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" style={{ color: theme.text.muted }} />
                        <div>
                            <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                {job.location?.region === 'international' ? '🌍 Remote Worldwide' :
                                    `${job.location?.city || job.location?.region}, ${job.location?.country}`}
                            </p>
                            {job.location?.subCity && (
                                <p className="text-xs mt-1" style={{ color: theme.text.secondary }}>
                                    Sub-city: {job.location.subCity}
                                </p>
                            )}
                            {job.location?.woreda && (
                                <p className="text-xs" style={{ color: theme.text.secondary }}>
                                    Woreda: {job.location.woreda}
                                </p>
                            )}
                        </div>
                    </div>
                    {job.location?.specificLocation && (
                        <div className="mt-2 p-3 rounded-lg text-sm" style={{ backgroundColor: theme.bg.secondary }}>
                            <span className="font-medium" style={{ color: theme.text.primary }}>Specific Location: </span>
                            <span style={{ color: theme.text.secondary }}>{job.location.specificLocation}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deadline Card */}
            {job.applicationDeadline && (
                <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" style={{ color: theme.text.primary }} />
                            Application Deadline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5" style={{ color: theme.text.muted }} />
                            <div>
                                <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                    {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                {new Date(job.applicationDeadline) < new Date() && (
                                    <p className="text-xs text-red-500 mt-1">
                                        This deadline has passed
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// Helper component for detail items
const DetailItem: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    theme: any;
    capitalize?: boolean;
}> = ({ icon: Icon, label, value, theme, capitalize }) => (
    <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5" style={{ color: theme.text.muted }} />
        <div>
            <p className="text-xs font-medium" style={{ color: theme.text.muted }}>{label}</p>
            <p className={`text-sm ${capitalize ? 'capitalize' : ''}`} style={{ color: theme.text.primary }}>
                {value}
            </p>
        </div>
    </div>
);

// ===== SETTINGS PANEL COMPONENT =====
interface SettingsPanelProps {
    job: Job;
    onStatusChange?: (status: JobStatus) => void;
    onToggleApply?: (enabled: boolean) => void;
    onDelete?: () => void;
    onEdit?: () => void;
    onShare?: () => void;
    onExportData?: () => void;
    themeMode: 'light' | 'dark';
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    job,
    onStatusChange,
    onToggleApply,
    onDelete,
    onEdit,
    onShare,
    onExportData,
    themeMode
}) => {
    const theme = getTheme(themeMode);

    const statusOptions = [
        { value: JobStatus.DRAFT, label: 'Draft', icon: FileCheck, color: '#6B7280' },
        { value: JobStatus.ACTIVE, label: 'Active', icon: CheckCircle, color: '#10B981' },
        { value: JobStatus.PAUSED, label: 'Paused', icon: PauseCircle, color: '#F59E0B' },
        { value: JobStatus.CLOSED, label: 'Closed', icon: XCircle, color: '#EF4444' },
        { value: JobStatus.ARCHIVED, label: 'Archived', icon: Archive, color: '#8B5CF6' }
    ];

    return (
        <div className="space-y-4">
            {/* Status Control */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Radio className="w-4 h-4" style={{ color: theme.text.primary }} />
                        Job Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => {
                            const isActive = job.status === option.value;
                            return (
                                <motion.button
                                    key={option.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onStatusChange?.(option.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                                        isActive && 'ring-2 ring-offset-1'
                                    )}
                                    style={{
                                        backgroundColor: isActive ? option.color : `${option.color}15`,
                                        color: isActive ? 'white' : option.color,
                                        border: `1px solid ${option.color}30`
                                    }}
                                >
                                    <option.icon className="w-3.5 h-3.5" />
                                    {option.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Applications Control */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: theme.text.primary }} />
                        Applications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                                {job.isApplyEnabled ? 'Applications are open' : 'Applications are closed'}
                            </p>
                            <p className="text-xs mt-1" style={{ color: theme.text.muted }}>
                                {job.isApplyEnabled
                                    ? 'Candidates can apply to this position'
                                    : 'Applications are currently disabled'}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => onToggleApply?.(!job.isApplyEnabled)}
                            style={{
                                backgroundColor: job.isApplyEnabled ? theme.text.error : theme.text.green,
                                color: 'white'
                            }}
                        >
                            {job.isApplyEnabled ? 'Disable' : 'Enable'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.secondary }}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4" style={{ color: theme.text.primary }} />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <ActionButton icon={Edit3} label="Edit" onClick={onEdit} color={theme.text.blue} theme={theme} />
                        <ActionButton icon={Share2} label="Share" onClick={onShare} color={theme.text.teal || '#8B5CF6'} theme={theme} />
                        <ActionButton icon={Download} label="Export" onClick={onExportData} color={theme.text.green} theme={theme} />
                        <ActionButton icon={Trash2} label="Delete" onClick={onDelete} color={theme.text.error} theme={theme} danger />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Helper component for action buttons
const ActionButton: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    color: string;
    theme: any;
    danger?: boolean;
}> = ({ icon: Icon, label, onClick, color, theme, danger }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="p-3 rounded-lg border transition-all group"
        style={{
            borderColor: theme.border.primary,
            backgroundColor: theme.bg.primary
        }}
    >
        <Icon
            className="w-4 h-4 mx-auto mb-1.5 group-hover:scale-110 transition-transform"
            style={{ color: danger ? theme.text.error : color }}
        />
        <span className="text-xs font-medium block text-center" style={{ color: theme.text.primary }}>
            {label}
        </span>
    </motion.button>
);

// ===== CHEVRON RIGHT ICON =====
const ChevronRight: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

// ===== MAIN JOB OWNER DETAILS COMPONENT =====
export const JobOwnerDetails: React.FC<JobOwnerDetailsProps> = ({
    job,
    role,
    onEdit,
    onDelete,
    onStatusChange,
    onViewApplications,
    onViewApplication,
    onToggleApply,
    onShare,
    onExportData,
    isDeleting = false,
    isUpdating = false,
    className = '',
    themeMode: propThemeMode = 'light',
    applications = [],
    isLoadingApplications = false
}) => {
    const themeMode = propThemeMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const theme = getTheme(themeMode);
    const router = useRouter();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('details');

    // Handle export data
    const handleExportData = () => {
        if (onExportData) {
            onExportData();
        } else {
            const dataStr = JSON.stringify({ job, applications }, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', `job-${job._id}-export.json`);
            link.click();
        }
    };

    // Calculate statistics
    const stats = {
        total: applications.length,
        new: applications.filter((a: any) =>
            new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        shortlisted: applications.filter((a: any) =>
            a.status === 'shortlisted' || a.status === 'interview-scheduled'
        ).length,
        hired: applications.filter((a: any) => a.status === 'hired').length
    };

    // Get accent color
    const accentColor = job.jobType === 'organization' ? '#8B5CF6' : '#10B981';

    return (
        <div className={cn("w-full", className)}>
            {/* Elegant Tabs */}
            <div className="border-b mb-6" style={{ borderColor: theme.border.secondary }}>
                <div className="flex space-x-6">
                    <TabButton
                        active={activeTab === 'details'}
                        onClick={() => setActiveTab('details')}
                        icon={FileText}
                        label="Job Details"
                        theme={theme}
                    />
                    <TabButton
                        active={activeTab === 'actions'}
                        onClick={() => setActiveTab('actions')}
                        icon={Settings}
                        label="Management"
                        badge={applications.length > 0 ? applications.length : undefined}
                        theme={theme}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Job Details Tab */}
                {activeTab === 'details' && (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <JobDetailsSection job={job} themeMode={themeMode} />
                    </motion.div>
                )}

                {/* Management Tab */}
                {activeTab === 'actions' && (
                    <motion.div
                        key="actions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Stats Grid */}
                        {applications.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard
                                    label="Total Applications"
                                    value={stats.total}
                                    icon={Users}
                                    color="#3B82F6"
                                    themeMode={themeMode}
                                />
                                <StatCard
                                    label="New (7d)"
                                    value={stats.new}
                                    icon={Activity}
                                    color="#10B981"
                                    themeMode={themeMode}
                                />
                                <StatCard
                                    label="Shortlisted"
                                    value={stats.shortlisted}
                                    icon={UserCheck}
                                    color="#8B5CF6"
                                    themeMode={themeMode}
                                />
                                <StatCard
                                    label="Hired"
                                    value={stats.hired}
                                    icon={Award}
                                    color="#6366F1"
                                    themeMode={themeMode}
                                />
                            </div>
                        )}

                        {/* Progress Tracker */}
                        <ProgressTracker job={job} themeMode={themeMode} />

                        {/* Two Column Layout for Applications Data */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <StatusDistribution applications={applications} themeMode={themeMode} />
                            <RecentApplications
                                applications={applications}
                                onViewApplication={onViewApplication}
                                themeMode={themeMode}
                                isLoading={isLoadingApplications}
                            />
                        </div>

                        {/* Settings Panel */}
                        <SettingsPanel
                            job={job}
                            onStatusChange={onStatusChange}
                            onToggleApply={onToggleApply}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onShare={onShare}
                            onExportData={handleExportData}
                            themeMode={themeMode}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

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
                            className="rounded-lg p-5 flex items-center gap-3 shadow-xl"
                            style={{
                                backgroundColor: theme.bg.primary,
                                border: `1px solid ${theme.border.primary}`
                            }}
                        >
                            <LoadingSpinner />
                            <p style={{ color: theme.text.secondary }}>
                                {isDeleting ? 'Deleting...' : 'Updating...'}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Tab Button Component
const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    badge?: number;
    theme: any;
}> = ({ active, onClick, icon: Icon, label, badge, theme }) => (
    <button
        onClick={onClick}
        className={cn(
            "py-3 px-1 text-sm font-medium border-b-2 transition-all relative",
            active ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
        )}
        style={{
            color: active ? theme.text.primary : theme.text.muted,
            borderColor: active ? theme.text.blue : 'transparent'
        }}
    >
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {label}
            {badge !== undefined && badge > 0 && (
                <span
                    className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                    style={{
                        backgroundColor: theme.text.blue + '20',
                        color: theme.text.blue
                    }}
                >
                    {badge}
                </span>
            )}
        </div>
    </button>
);

export default JobOwnerDetails;