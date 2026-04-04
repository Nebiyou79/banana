/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { jobService, Job, SalaryMode, JobStatus, ApplicationInfo, ApplicationStatusReason } from '@/services/jobService';
import { companyService, CompanyProfile } from '@/services/companyService';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { Profile, DetailedProfile, PublicProfile } from '@/services/profileService';
import { getTheme } from '@/utils/color';
import {
    MapPin,
    DollarSign,
    Briefcase,
    User,
    Calendar,
    Shield,
    Bookmark,
    Share2,
    Users,
    CheckCircle,
    Send,
    Globe,
    Award,
    Heart,
    FileText,
    Target,
    GraduationCap,
    Zap,
    Clock,
    Edit3,
    Archive,
    PauseCircle,
    XCircle,
    ArrowRight,
    Tag,
    Briefcase as BriefcaseIcon,
    Calendar as CalendarIcon,
    Users as UsersIcon,
    Phone,
    MapPin as MapPinIcon,
    Info,
    Loader2,
    Building,
    Users2,
    ExternalLink,
    Lock,
    AlertCircle,
    FileCheck,
    Mail,
    Link,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Youtube
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TabbedJobDetailsProps {
    job: Job;
    role: 'candidate' | 'company' | 'organization';
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null;
    onSaveJob?: () => void;
    onApply?: () => void;
    onEditJob?: () => void;
    onStatusChange?: (status: JobStatus) => void;
    onViewApplications?: () => void;
    isSaved?: boolean;
    isApplying?: boolean;
    applicationInfo?: ApplicationInfo;
    themeMode?: 'light' | 'dark';
    hasApplied?: boolean;
    userApplication?: any;
}

// ===== FIXED AVATAR COMPONENT =====
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
        lg: 'w-24 h-24'
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
            lg: 96
        };

        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=${sizeMap[size]}`;
    };

    const avatarUrl = getAvatarUrl();
    const [imgError, setImgError] = useState(false);

    return (
        <div
            className={cn(
                sizeClasses[size],
                "rounded-xl overflow-hidden shrink-0 flex items-center justify-center",
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
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                    {ownerName.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );
};

// ===== FIXED APPLY BUTTON with "Applications Locked" =====
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
                text: 'Applied Successfully',
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

// ===== FIXED CANDIDATES PROGRESS COMPONENT =====
interface CandidatesProgressProps {
    job: Job;
    themeMode?: 'light' | 'dark';
    compact?: boolean;
}

const CandidatesProgress: React.FC<CandidatesProgressProps> = ({ job, themeMode = 'light', compact = false }) => {
    const theme = getTheme(themeMode);

    const candidatesNeeded = job.candidatesNeeded || 1;
    // In a real implementation, this would come from the backend
    // For now, we'll show a placeholder that indicates this data is coming soon
    const positionsFilled = 0;
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

                <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>{candidatesNeeded}</span>
                </div>

                {/* Info message about selection tracking */}
                <p className="text-xs mt-2 italic" style={{ color: theme.text.muted }}>
                    Positions filled count will be updated as candidates are selected
                </p>
            </div>
        </div>
    );
};

// Types for enhanced entity data
interface EnhancedEntityInfo {
    id?: string;
    name: string;
    type: 'company' | 'organization';
    description?: string;
    mission?: string;
    vision?: string;
    industry?: string;
    organizationType?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    verified: boolean;
    logoUrl?: string;
    size?: string;
    foundedYear?: number;
    registrationNumber?: string;
    secondaryPhone?: string;
    socialLinks?: {
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
        youtube?: string;
    };
    values?: string[];
    awards?: string[];
    projects?: string[];
    impact?: string;
    isLoading: boolean;
}

const TabbedJobDetails: React.FC<TabbedJobDetailsProps> = ({
    job,
    role,
    ownerProfile,
    onSaveJob,
    onApply,
    onEditJob,
    onStatusChange,
    onViewApplications,
    isSaved = false,
    isApplying = false,
    applicationInfo,
    themeMode = 'light',
    hasApplied = false,
    userApplication,
}) => {
    const [activeTab, setActiveTab] = useState('details');
    const [entityInfo, setEntityInfo] = useState<EnhancedEntityInfo>({
        name: '',
        type: job.jobType === 'company' ? 'company' : 'organization',
        verified: false,
        isLoading: false
    });
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchEntityDetails = async () => {
            if (!job) return;

            setEntityInfo(prev => ({ ...prev, isLoading: true }));

            try {
                if (job.jobType === 'company' && job.company?._id) {
                    const company = await companyService.getCompany(job.company._id);
                    if (company) {
                        setEntityInfo({
                            id: company._id,
                            name: company.name,
                            type: 'company',
                            description: company.description,
                            industry: company.industry,
                            website: company.website,
                            phone: company.phone,
                            email: company.user?.email,
                            address: company.address,
                            verified: company.verified,
                            logoUrl: company.logoUrl || company.logoFullUrl || job.company?.logoUrl,
                            isLoading: false
                        });
                    }
                } else if (job.jobType === 'organization' && job.organization?._id) {
                    const organization = await organizationService.getOrganization(job.organization._id);
                    if (organization) {
                        setEntityInfo({
                            id: organization._id,
                            name: organization.name,
                            type: 'organization',
                            description: organization.description,
                            mission: organization.mission,
                            organizationType: organization.organizationType,
                            industry: organization.industry,
                            website: organization.website,
                            phone: organization.phone,
                            email: organization.user?.email,
                            address: organization.address,
                            verified: organization.verified,
                            logoUrl: organization.logoUrl || organization.logoFullUrl || job.organization?.logoUrl,
                            registrationNumber: organization.registrationNumber,
                            secondaryPhone: organization.secondaryPhone,
                            isLoading: false
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch entity details:', error);
                setEntityInfo({
                    name: getOwnerNameFromJob(job),
                    type: job.jobType === 'company' ? 'company' : 'organization',
                    description: getOwnerDescriptionFromJob(job),
                    industry: getIndustryFromJob(job),
                    verified: isVerifiedFromJob(job),
                    logoUrl: getLogoUrlFromJob(job),
                    isLoading: false
                });
            }
        };

        if (activeTab === 'entity') {
            fetchEntityDetails();
        }
    }, [job, activeTab]);

    const getOwnerNameFromJob = (job: Job): string => {
        return job.ownerName || jobService.getOwnerName(job);
    };

    const getOwnerDescriptionFromJob = (job: Job): string => {
        if (job.jobType === 'company' && job.company?.description) {
            return job.company.description;
        }
        if (job.jobType === 'organization' && job.organization?.description) {
            return job.organization.description;
        }
        return 'No description available';
    };

    const getIndustryFromJob = (job: Job): string => {
        if (job.jobType === 'company' && job.company?.industry) {
            return job.company.industry;
        }
        if (job.jobType === 'organization' && job.organization?.organizationType) {
            return job.organization.organizationType;
        }
        if (job.jobType === 'organization' && job.organization?.industry) {
            return job.organization.industry;
        }
        return 'Not specified';
    };

    const isVerifiedFromJob = (job: Job): boolean => {
        return job.ownerVerified || job.company?.verified || job.organization?.verified || false;
    };

    const getLogoUrlFromJob = (job: Job): string | undefined => {
        return job.ownerAvatarUrl || job.company?.logoUrl || job.organization?.logoUrl;
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: JobStatus): string => {
        switch (status) {
            case JobStatus.ACTIVE: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case JobStatus.DRAFT: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case JobStatus.PAUSED: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            case JobStatus.CLOSED: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case JobStatus.ARCHIVED: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
        }
    };

    const getStatusIcon = (status: JobStatus) => {
        switch (status) {
            case JobStatus.ACTIVE: return <CheckCircle className="w-4 h-4" />;
            case JobStatus.DRAFT: return <Edit3 className="w-4 h-4" />;
            case JobStatus.PAUSED: return <PauseCircle className="w-4 h-4" />;
            case JobStatus.CLOSED: return <XCircle className="w-4 h-4" />;
            case JobStatus.ARCHIVED: return <Archive className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const isDeadlinePassed = job.applicationDeadline ? new Date(job.applicationDeadline) < new Date() : false;

    const handleViewEntityProfile = () => {
        if (entityInfo.id) {
            if (entityInfo.type === 'company') {
                router.push(`/dashboard/company/${entityInfo.id}`);
            } else {
                router.push(`/dashboard/organization/${entityInfo.id}`);
            }
        } else {
            toast({
                title: 'Profile Unavailable',
                description: 'Complete entity profile is not available',
                variant: 'warning'
            });
        }
    };

    const formatEntitySize = (size?: string): string => {
        if (!size) return 'Not specified';
        const sizeMap: Record<string, string> = {
            '1-10': '1-10 employees',
            '11-50': '11-50 employees',
            '51-200': '51-200 employees',
            '201-500': '201-500 employees',
            '501-1000': '501-1000 employees',
            '1000+': '1000+ employees'
        };
        return sizeMap[size] || size;
    };

    const renderEntityInfoTab = () => {
        const ownerName = entityInfo.name || getOwnerNameFromJob(job);
        const theme = getTheme(themeMode);

        return (
            <TabsContent value="entity" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-24 sm:h-32 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800"></div>

                    <CardContent className="relative pt-0 px-4 sm:px-6">
                        <div className="flex justify-center -mt-12 sm:-mt-16 mb-3 sm:mb-4">
                            <Avatar
                                job={job}
                                ownerProfile={ownerProfile}
                                themeMode={themeMode}
                                size="lg"
                                bordered={entityInfo.verified}
                            />
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {ownerName}
                            </h3>

                            <div className="flex flex-wrap justify-center items-center gap-2 mb-3 sm:mb-4">
                                <Badge className={cn(
                                    "capitalize text-xs sm:text-sm",
                                    entityInfo.type === 'organization'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                )}>
                                    {entityInfo.type === 'organization' ? 'Non-profit' : 'Company'}
                                </Badge>

                                {entityInfo.verified && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-xs sm:text-sm">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Verified
                                    </Badge>
                                )}
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                    {entityInfo.organizationType || entityInfo.industry || 'Not specified'}
                                </div>
                                {entityInfo.type === 'company' && entityInfo.size && (
                                    <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        {formatEntitySize(entityInfo.size)}
                                    </div>
                                )}
                            </div>

                            {entityInfo.description && (
                                <div className="mb-4 sm:mb-6 max-w-2xl mx-auto">
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {entityInfo.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                                {entityInfo.website && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm"
                                        onClick={() => window.open(entityInfo.website, '_blank')}
                                    >
                                        <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                        <span className="hidden xs:inline">Website</span>
                                    </Button>
                                )}

                                {entityInfo.email && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm"
                                        onClick={() => window.location.href = `mailto:${entityInfo.email}`}
                                    >
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                        <span className="hidden xs:inline">Email</span>
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    onClick={handleViewEntityProfile}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                >
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden xs:inline">View Profile</span>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {(entityInfo.phone || entityInfo.address || entityInfo.socialLinks) && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3">
                            {entityInfo.phone && (
                                <div className="flex items-center gap-2 sm:gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{entityInfo.phone}</span>
                                </div>
                            )}
                            {entityInfo.secondaryPhone && (
                                <div className="flex items-center gap-2 sm:gap-3 ml-6 sm:ml-7 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 truncate">{entityInfo.secondaryPhone}</span>
                                </div>
                            )}
                            {entityInfo.address && (
                                <div className="flex items-center gap-2 sm:gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{entityInfo.address}</span>
                                </div>
                            )}

                            {entityInfo.socialLinks && Object.values(entityInfo.socialLinks).some(Boolean) && (
                                <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Social:</span>
                                    <div className="flex gap-1 sm:gap-2">
                                        {entityInfo.socialLinks.linkedin && (
                                            <a href={entityInfo.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                                                className="p-1 hover:text-blue-600 transition-colors">
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                        {entityInfo.socialLinks.twitter && (
                                            <a href={entityInfo.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                                                className="p-1 hover:text-blue-400 transition-colors">
                                                <Twitter className="w-4 h-4" />
                                            </a>
                                        )}
                                        {entityInfo.socialLinks.facebook && (
                                            <a href={entityInfo.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                                                className="p-1 hover:text-blue-600 transition-colors">
                                                <Facebook className="w-4 h-4" />
                                            </a>
                                        )}
                                        {entityInfo.socialLinks.instagram && (
                                            <a href={entityInfo.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                                                className="p-1 hover:text-pink-600 transition-colors">
                                                <Instagram className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {(entityInfo.mission || entityInfo.values) && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">
                                {entityInfo.type === 'organization' ? 'Mission & Values' : 'Company Culture'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                            {entityInfo.mission && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
                                        <Target className="w-4 h-4 text-blue-500" />
                                        Mission
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{entityInfo.mission}</p>
                                </div>
                            )}
                            {entityInfo.values && entityInfo.values.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        Core Values
                                    </h4>
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {entityInfo.values.map((value, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 text-xs sm:text-sm"
                                            >
                                                {value}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        );
    };

    const renderJobDetailsTab = () => (
        <TabsContent value="details" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {/* Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {job.candidatesNeeded || 1}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Needed</div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {job.applicationCount || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Applied</div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="text-sm sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-1 capitalize truncate">
                            {job.remote || 'on-site'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Work Type</div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-3 sm:p-4 text-center">
                        <div className="text-sm sm:text-xl font-bold text-orange-600 dark:text-orange-400 mb-1 truncate">
                            {jobService.getJobTypeLabel(job.type)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Job Type</div>
                    </CardContent>
                </Card>
            </div>

            {/* Short Description */}
            {job.shortDescription && (
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                        <CardTitle className="text-base sm:text-lg">Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{job.shortDescription}</p>
                    </CardContent>
                </Card>
            )}

            {/* Full Description */}
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        {role === 'organization' ? 'Opportunity Description' : 'Job Description'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Requirements and Responsibilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {job.requirements && job.requirements.length > 0 && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                            <ul className="space-y-2 sm:space-y-3">
                                {job.requirements.map((req, index) => (
                                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {job.responsibilities && job.responsibilities.length > 0 && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                Responsibilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                            <ul className="space-y-2 sm:space-y-3">
                                {job.responsibilities.map((resp, index) => (
                                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{resp}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Skills and Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {job.skills && job.skills.length > 0 && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                Required Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                {job.skills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                            Benefits & Compensation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                        {job.salaryMode !== SalaryMode.HIDDEN && (
                            <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
                                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
                                    <DollarSign className="h-4 w-4" />
                                    Salary Information
                                </h4>
                                <p className="text-green-800 dark:text-green-200 font-semibold text-base sm:text-lg">
                                    {jobService.getFormattedSalary(job)}
                                </p>
                                {job.salary?.isNegotiable && (
                                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">Negotiable</p>
                                )}
                            </div>
                        )}

                        {job.benefits && job.benefits.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">Benefits Package</h4>
                                <ul className="space-y-1 sm:space-y-2">
                                    {job.benefits.map((benefit, index) => (
                                        <li key={index} className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 dark:bg-red-400 rounded-full shrink-0"></div>
                                            <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Details */}
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                                        {job.location?.city || 'Not specified'}, {job.location?.region || 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Job Type</label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                                        {jobService.getJobTypeLabel(job.type)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Experience Level</label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                                        {jobService.getExperienceLabel(job.experienceLevel)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                            {job.category && (
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                                        <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                                            {jobService.getJobCategories().find(cat => cat.value === job.category)?.label || job.category}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {job.educationLevel && (
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Education Level</label>
                                        <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                                            {jobService.getEducationLabel(job.educationLevel)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Remote Work</label>
                                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium capitalize">{job.remote}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {job.applicationDeadline && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300">Application Deadline:</span>
                                <span className={`text-xs sm:text-sm font-medium ${isDeadlinePassed ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {formatDate(job.applicationDeadline)}
                                    {isDeadlinePassed && ' (Expired)'}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    );

    const renderActionsHistoryTab = () => (
        <TabsContent value="actions" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {role === 'candidate' && (
                <>
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                            {onApply && (
                                <ApplyButton
                                    job={job}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onApply();
                                    }}
                                    disabled={isApplying || hasApplied}
                                    applying={isApplying}
                                    hasApplied={hasApplied}
                                    themeMode={themeMode}
                                    size="lg"
                                />
                            )}

                            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                                {onSaveJob && (
                                    <Button
                                        onClick={onSaveJob}
                                        variant="outline"
                                        className={cn(
                                            "flex-1 border transition-all duration-200 text-sm sm:text-base",
                                            isSaved
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                : "border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        )}
                                    >
                                        <Bookmark className={cn("h-4 w-4 mr-2", isSaved && "fill-current")} />
                                        <span className="hidden xs:inline">{isSaved ? 'Saved' : 'Save Job'}</span>
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm sm:text-base"
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast({
                                            title: 'Link Copied',
                                            description: 'Job link copied to clipboard',
                                        });
                                    }}
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    <span className="hidden xs:inline">Share</span>
                                </Button>
                            </div>

                            {applicationInfo && !hasApplied && (
                                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">Application Status</h4>
                                    <div className="space-y-1 sm:space-y-2">
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                            <Badge className={applicationInfo.canApply ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                                {applicationInfo.canApply ? 'Open' : 'Closed'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Candidates Needed:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{applicationInfo.candidatesNeeded}</span>
                                        </div>
                                        <div className="flex justify-between text-xs sm:text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Applications Received:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{applicationInfo.applicationCount}</span>
                                        </div>
                                        {applicationInfo.status.message && (
                                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                    {applicationInfo.status.message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {hasApplied && (
                                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
                                                Application Submitted
                                            </p>
                                            <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                                You applied on {userApplication?.createdAt ? formatDate(userApplication.createdAt) : 'recently'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Important Dates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Posted</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatDate(job.createdAt)}</span>
                                </div>
                                {job.applicationDeadline && (
                                    <div className="flex justify-between items-center py-1 sm:py-2">
                                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Application Deadline</span>
                                        <span className={`text-xs sm:text-sm font-semibold ${isDeadlinePassed ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                            {formatDate(job.applicationDeadline)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {(role === 'company' || role === 'organization') && (
                <>
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">Management Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                            {onViewApplications && (
                                <Button
                                    onClick={onViewApplications}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-sm sm:text-base"
                                >
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    View Applications ({job.applicationCount || 0})
                                </Button>
                            )}

                            {onEditJob && (
                                <Button
                                    onClick={onEditJob}
                                    variant="outline"
                                    className="w-full border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 sm:py-3 text-sm sm:text-base"
                                >
                                    <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Edit {role === 'organization' ? 'Opportunity' : 'Job'} Details
                                </Button>
                            )}

                            {onStatusChange && (
                                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Change Status</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {job.status !== JobStatus.ACTIVE && (
                                            <Button
                                                onClick={() => onStatusChange(JobStatus.ACTIVE)}
                                                variant="outline"
                                                className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/30 text-xs sm:text-sm py-1 sm:py-2"
                                            >
                                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Activate
                                            </Button>
                                        )}
                                        {job.status !== JobStatus.PAUSED && (
                                            <Button
                                                onClick={() => onStatusChange(JobStatus.PAUSED)}
                                                variant="outline"
                                                className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/30 text-xs sm:text-sm py-1 sm:py-2"
                                            >
                                                <PauseCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Pause
                                            </Button>
                                        )}
                                        {job.status !== JobStatus.CLOSED && (
                                            <Button
                                                onClick={() => onStatusChange(JobStatus.CLOSED)}
                                                variant="outline"
                                                className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30 text-xs sm:text-sm py-1 sm:py-2"
                                            >
                                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Close
                                            </Button>
                                        )}
                                        {job.status !== JobStatus.ARCHIVED && (
                                            <Button
                                                onClick={() => onStatusChange(JobStatus.ARCHIVED)}
                                                variant="outline"
                                                className="border-gray-600 text-gray-600 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-900/30 text-xs sm:text-sm py-1 sm:py-2"
                                            >
                                                <Archive className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Archive
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="text-base sm:text-lg">{role === 'organization' ? 'Opportunity' : 'Job'} History</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="space-y-2 sm:space-y-4">
                                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Created</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatDate(job.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatDate(job.updatedAt)}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Current Status</span>
                                    <Badge className={cn(getStatusColor(job.status), "text-xs sm:text-sm")}>
                                        <span className="flex items-center gap-1">
                                            {getStatusIcon(job.status)}
                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                        </span>
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-1 sm:py-2">
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Views</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{job.viewCount || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{job.viewCount || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Views</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{job.applicationCount || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Applications</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    );

    return (
        <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <TabsTrigger
                        value="entity"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                        {job.jobType === 'company' ? 'Company' : 'Organization'}
                    </TabsTrigger>
                    <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                        {role === 'organization' ? 'Opportunity' : 'Job'}
                    </TabsTrigger>
                    <TabsTrigger
                        value="actions"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                        {role === 'candidate' ? 'Actions' : 'Management'}
                    </TabsTrigger>
                </TabsList>

                {renderEntityInfoTab()}
                {renderJobDetailsTab()}
                {renderActionsHistoryTab()}
            </Tabs>
        </div>
    );
};

export default TabbedJobDetails;