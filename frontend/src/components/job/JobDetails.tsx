/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { jobService, Job, SalaryMode, JobStatus, ApplicationInfo } from '@/services/jobService';
import { companyService, CompanyProfile } from '@/services/companyService';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { Profile, DetailedProfile, PublicProfile } from '@/services/profileService';
import { getTheme } from '@/utils/color';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
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
    Award as AwardIcon,
    Briefcase as BriefcaseIcon,
    Calendar as CalendarIcon,
    Users as UsersIcon,
    ChevronRight,
    Phone,
    MapPin as MapPinIcon,
    Info,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/router';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils'; // Added cn import

interface TabbedJobDetailsProps {
    job: Job;
    role: 'candidate' | 'company' | 'organization';
    ownerProfile?: Profile | DetailedProfile | PublicProfile | null; // Add ownerProfile prop
    onSaveJob?: () => void;
    onApply?: () => void;
    onEditJob?: () => void;
    onStatusChange?: (status: JobStatus) => void;
    onViewApplications?: () => void;
    isSaved?: boolean;
    isApplying?: boolean;
    applicationInfo?: ApplicationInfo;
    themeMode?: 'light' | 'dark';
}

// Types for enhanced entity data
interface EnhancedEntityInfo {
    id?: string;
    name: string;
    type: 'company' | 'organization';
    description?: string;
    mission?: string;
    industry?: string;
    organizationType?: string;
    website?: string;
    phone?: string;
    address?: string;
    verified: boolean;
    logoUrl?: string;
    size?: string;
    foundedYear?: number;
    registrationNumber?: string;
    secondaryPhone?: string;
    isLoading: boolean;
}

const TabbedJobDetails: React.FC<TabbedJobDetailsProps> = ({
    job,
    role,
    ownerProfile, // New prop
    onSaveJob,
    onApply,
    onEditJob,
    onStatusChange,
    onViewApplications,
    isSaved = false,
    isApplying = false,
    applicationInfo,
}) => {
    const [activeTab, setActiveTab] = useState('details');
    const [entityInfo, setEntityInfo] = useState<EnhancedEntityInfo>({
        name: '',
        type: job.jobType === 'company' ? 'company' : 'organization',
        verified: false,
        isLoading: false
    });
    const { toast } = useToast();

    // Fetch full entity details when entity tab is active
    useEffect(() => {
        const fetchEntityDetails = async () => {
            if (!job) return;

            setEntityInfo(prev => ({ ...prev, isLoading: true }));

            try {
                if (job.jobType === 'company' && job.company?._id) {
                    // Fetch full company details
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
                            address: company.address,
                            verified: company.verified,
                            logoUrl: company.logoUrl || company.logoFullUrl,
                            isLoading: false
                        });
                    }
                } else if (job.jobType === 'organization' && job.organization?._id) {
                    // Fetch full organization details
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
                            address: organization.address,
                            verified: organization.verified,
                            logoUrl: organization.logoUrl || organization.logoFullUrl,
                            registrationNumber: organization.registrationNumber,
                            secondaryPhone: organization.secondaryPhone,
                            isLoading: false
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch entity details:', error);
                // Fallback to basic job data
                setEntityInfo({
                    name: getOwnerNameFromJob(job),
                    type: job.jobType === 'company' ? 'company' : 'organization',
                    description: getOwnerDescriptionFromJob(job),
                    industry: getIndustryFromJob(job),
                    verified: isVerifiedFromJob(job),
                    isLoading: false
                });
            }
        };

        if (activeTab === 'entity') {
            fetchEntityDetails();
        }
    }, [job, activeTab]);

    // Helper functions for basic job data
    const getOwnerNameFromJob = (job: Job): string => {
        return jobService.getOwnerName(job);
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
        return job.company?.verified || job.organization?.verified || false;
    };

    // Get avatar URL using the shared utility
    const getAvatarUrlForEntity = (): string => {
        const ownerName = entityInfo.name || getOwnerNameFromJob(job);

        // First priority: ownerProfile from props
        if (ownerProfile) {
            return getAvatarUrl({
                profile: ownerProfile,
                name: ownerName,
                fallbackColor: entityInfo.type === 'organization' ? '#4F46E5' : '#10B981',
                size: 96,
            });
        }

        // Second priority: logoUrl from entityInfo
        if (entityInfo.logoUrl) {
            return entityInfo.logoUrl;
        }

        // Third priority: logo from job data
        if (job.jobType === 'company' && job.company?.logoUrl) {
            return job.company.logoUrl;
        }
        if (job.jobType === 'organization' && job.organization?.logoUrl) {
            return job.organization.logoUrl;
        }

        // Final fallback: initials-based avatar
        const initials = getInitials(ownerName);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${entityInfo.type === 'organization' ? '4F46E5' : '10B981'
            }&color=fff&size=96`;
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

    const getJobTypeDisplay = (job: Job): string => {
        if (job.jobType === 'organization') {
            const types: Record<string, string> = {
                'job': 'Job Opportunity',
                'volunteer': 'Volunteer Position',
                'internship': 'Internship',
                'fellowship': 'Fellowship',
                'training': 'Training Program',
                'grant': 'Grant Opportunity',
                'other': 'Opportunity'
            };
            return types[job.opportunityType || 'job'] || 'Opportunity';
        }
        return 'Job';
    };

    const isDeadlinePassed = job.applicationDeadline ? new Date(job.applicationDeadline) < new Date() : false;

    // Get initials for fallback display
    const getInitials = (name: string) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // Handle avatar image error
    const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
        if (fallback) {
            fallback.style.display = 'flex';
        }
    };

    // Tab 1: Company/Organization Info
    const renderEntityInfoTab = () => {
        const ownerName = entityInfo.name || getOwnerNameFromJob(job);
        const avatarUrl = getAvatarUrlForEntity();
        const initials = getInitials(ownerName);
        const hasAvatar = avatarUrl && !avatarUrl.includes('ui-avatars.com');

        return (
            <TabsContent value="entity" className="mt-6 space-y-6">
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            {/* Loading State */}
                            {entityInfo.isLoading ? (
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {/* Avatar/Logo */}
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg mb-4 relative">
                                        {/* Avatar Image - Only show if hasAvatar */}
                                        {hasAvatar ? (
                                            <img
                                                src={avatarUrl}
                                                alt={ownerName}
                                                className="w-full h-full object-cover"
                                                onError={handleAvatarError}
                                                loading="lazy"
                                            />
                                        ) : null}

                                        {/* Fallback Initials - Show if no avatar or if avatar fails */}
                                        <div
                                            className={cn(
                                                "w-full h-full flex items-center justify-center",
                                                "font-bold text-white",
                                                entityInfo.type === 'organization'
                                                    ? 'bg-purple-600'
                                                    : 'bg-green-600'
                                            )}
                                            style={{ display: hasAvatar ? 'none' : 'flex' }}
                                        >
                                            <span className="text-lg">
                                                {initials}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Name and Verification */}
                                    <div className="mb-4">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            {ownerName}
                                        </h3>
                                        {entityInfo.verified && (
                                            <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                                <Shield className="w-3 h-3 mr-1" />
                                                Verified
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Industry/Type */}
                                    <div className="mb-6">
                                        <Badge variant="outline" className="text-gray-600 dark:text-gray-300">
                                            {entityInfo.organizationType || entityInfo.industry || 'Not specified'}
                                        </Badge>
                                        {entityInfo.type === 'company' && entityInfo.size && (
                                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                • {entityInfo.size}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="mb-6 max-w-2xl">
                                        {entityInfo.description ? (
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {entityInfo.description}
                                            </p>
                                        ) : (
                                            <div className="text-gray-400 dark:text-gray-500 italic">
                                                <Info className="w-5 h-5 inline-block mr-1" />
                                                No description available
                                            </div>
                                        )}
                                    </div>

                                    {/* Mission (for organizations) */}
                                    {entityInfo.type === 'organization' && entityInfo.mission && (
                                        <div className="mb-6 max-w-2xl bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                                Mission Statement
                                            </h4>
                                            <p className="text-blue-800 dark:text-blue-200 text-sm">
                                                {entityInfo.mission}
                                            </p>
                                        </div>
                                    )}

                                    {/* Contact Info */}
                                    {(entityInfo.phone || entityInfo.address) && (
                                        <div className="mb-6 max-w-2xl bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                                            <div className="space-y-2 text-sm">
                                                {entityInfo.phone && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{entityInfo.phone}</span>
                                                    </div>
                                                )}
                                                {entityInfo.secondaryPhone && (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                        <Phone className="w-4 h-4" />
                                                        <span>Secondary: {entityInfo.secondaryPhone}</span>
                                                    </div>
                                                )}
                                                {entityInfo.address && (
                                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                                                        <MapPinIcon className="w-4 h-4 mt-0.5" />
                                                        <span>{entityInfo.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Website Link */}
                                    {entityInfo.website && (
                                        <div className="mb-6">
                                            <Button
                                                variant="outline"
                                                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                onClick={() => window.open(entityInfo.website, '_blank')}
                                            >
                                                <Globe className="w-4 h-4 mr-2" />
                                                Visit Website
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Switch to Details Button */}
                            <Button
                                onClick={() => setActiveTab('details')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                View Job Details
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Info */}
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {entityInfo.isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-300">Entity Type</span>
                                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                                        {entityInfo.type === 'company' ? 'Company' : 'Organization'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-300">Opportunity Type</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {getJobTypeDisplay(job)}
                                    </span>
                                </div>
                                {entityInfo.type === 'company' && entityInfo.size && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-300">Company Size</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{entityInfo.size}</span>
                                    </div>
                                )}
                                {entityInfo.type === 'company' && entityInfo.foundedYear && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-300">Founded</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{entityInfo.foundedYear}</span>
                                    </div>
                                )}
                                {entityInfo.type === 'organization' && entityInfo.registrationNumber && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-300">Registration #</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{entityInfo.registrationNumber}</span>
                                    </div>
                                )}
                                {entityInfo.type === 'organization' && entityInfo.mission && (
                                    <div className="pt-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mission</h4>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">{entityInfo.mission}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        );
    };

    // Tab 2: Main Job Details
    const renderJobDetailsTab = () => (
        <TabsContent value="details" className="mt-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {job.candidatesNeeded || 1}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Candidates Needed</div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {job.applicationCount || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Applications</div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1 capitalize">
                            {job.remote || 'on-site'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Work Type</div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {jobService.getJobTypeLabel(job.type)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Job Type</div>
                    </CardContent>
                </Card>
            </div>

            {/* Overview & Description */}
            {job.shortDescription && (
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{job.shortDescription}</p>
                    </CardContent>
                </Card>
            )}

            {/* Full Description */}
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Job Description
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Requirements & Responsibilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {job.requirements.map((req, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                Responsibilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {job.responsibilities.map((resp, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Target className="h-5 w-5 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{resp}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Skills & Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                Required Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 px-3 py-1.5"
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Benefits & Salary */}
                <Card className="border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                            Benefits & Compensation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Salary Display */}
                        {job.salaryMode !== SalaryMode.HIDDEN && (
                            <div className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Salary Information
                                </h4>
                                <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                                    {jobService.getFormattedSalary(job)}
                                </p>
                                {job.salary?.isNegotiable && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">Negotiable</p>
                                )}
                            </div>
                        )}

                        {/* Benefits List */}
                        {job.benefits && job.benefits.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Benefits Package</h4>
                                <ul className="space-y-2">
                                    {job.benefits.map((benefit, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full shrink-0"></div>
                                            <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Job Category & Details */}
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Location</label>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {job.location?.city || 'Not specified'}, {job.location?.region || 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5 text-gray-400" />
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Job Type</label>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {jobService.getJobTypeLabel(job.type)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Experience Level</label>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {jobService.getExperienceLabel(job.experienceLevel)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {job.category && (
                                <div className="flex items-center gap-3">
                                    <Tag className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Category</label>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {jobService.getJobCategories().find(cat => cat.value === job.category)?.label || job.category}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {job.educationLevel && (
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Education Level</label>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {jobService.getEducationLabel(job.educationLevel)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-gray-400" />
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Remote Work</label>
                                    <p className="text-gray-900 dark:text-white font-medium capitalize">{job.remote}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {job.applicationDeadline && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Application Deadline:</span>
                                <span className={`text-sm font-medium ${isDeadlinePassed ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
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

    // Tab 3: Extra Info, Actions & History
    const renderActionsHistoryTab = () => (
        <TabsContent value="actions" className="mt-6 space-y-6">
            {/* CANDIDATE-ONLY UI */}
            {role === 'candidate' && (
                <>
                    {/* Quick Actions */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <Button
                                    onClick={onApply}
                                    disabled={isApplying || !applicationInfo?.canApply}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                                >
                                    {isApplying ? (
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 justify-center">
                                            <Send className="h-5 w-5" />
                                            <span>Apply Now</span>
                                        </div>
                                    )}
                                </Button>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={onSaveJob}
                                        variant="outline"
                                        className="flex-1 border-gray-300 dark:border-gray-600"
                                    >
                                        <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400' : ''}`} />
                                        {isSaved ? 'Saved' : 'Save Job'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-gray-300 dark:border-gray-600"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast({
                                                title: 'Link Copied',
                                                description: 'Job link copied to clipboard',
                                            });
                                        }}
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                </div>
                            </div>

                            {/* Application Status */}
                            {applicationInfo && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Application Status</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Can Apply:</span>
                                            <Badge className={applicationInfo.canApply ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {applicationInfo.canApply ? 'Yes' : 'No'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Candidates Needed:</span>
                                            <span className="font-medium">{applicationInfo.candidatesNeeded}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Applications Received:</span>
                                            <span className="font-medium">{applicationInfo.applicationCount}</span>
                                        </div>
                                        {applicationInfo.status.message && (
                                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    {applicationInfo.status.message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Important Dates */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Important Dates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-300">Posted</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{formatDate(job.createdAt)}</span>
                                </div>
                                {job.applicationDeadline && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 dark:text-gray-300">Application Deadline</span>
                                        <span className={`font-semibold ${isDeadlinePassed ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                            {formatDate(job.applicationDeadline)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* COMPANY/ORGANIZATION-ONLY UI */}
            {(role === 'company' || role === 'organization') && (
                <>
                    {/* Quick Actions */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle>Management Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                onClick={onViewApplications}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                            >
                                <Users className="h-5 w-5 mr-2" />
                                View Applications ({job.applicationCount || 0})
                            </Button>

                            <Button
                                onClick={onEditJob}
                                variant="outline"
                                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30 py-3"
                            >
                                <Edit3 className="h-5 w-5 mr-2" />
                                Edit {role === 'organization' ? 'Opportunity' : 'Job'} Details
                            </Button>

                            {/* Status Management */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Change Status</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {job.status !== JobStatus.ACTIVE && (
                                        <Button
                                            onClick={() => onStatusChange?.(JobStatus.ACTIVE)}
                                            variant="outline"
                                            className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/30"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Activate
                                        </Button>
                                    )}
                                    {job.status !== JobStatus.PAUSED && (
                                        <Button
                                            onClick={() => onStatusChange?.(JobStatus.PAUSED)}
                                            variant="outline"
                                            className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/30"
                                        >
                                            <PauseCircle className="h-4 w-4 mr-1" />
                                            Pause
                                        </Button>
                                    )}
                                    {job.status !== JobStatus.CLOSED && (
                                        <Button
                                            onClick={() => onStatusChange?.(JobStatus.CLOSED)}
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Close
                                        </Button>
                                    )}
                                    {job.status !== JobStatus.ARCHIVED && (
                                        <Button
                                            onClick={() => onStatusChange?.(JobStatus.ARCHIVED)}
                                            variant="outline"
                                            className="border-gray-600 text-gray-600 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-900/30"
                                        >
                                            <Archive className="h-4 w-4 mr-1" />
                                            Archive
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job History */}
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle>{role === 'organization' ? 'Opportunity' : 'Job'} History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-300">Created</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{formatDate(job.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-300">Last Updated</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{formatDate(job.updatedAt)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-300">Current Status</span>
                                    <Badge className={getStatusColor(job.status)}>
                                        <span className="flex items-center gap-1">
                                            {getStatusIcon(job.status)}
                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                        </span>
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600 dark:text-gray-300">Views</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{job.viewCount || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* SHARED UI */}
            <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{job.viewCount || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">Total Views</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{job.applicationCount || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">Applications</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    );

    return (
        <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="entity">
                        {job.jobType === 'company' ? 'Company Info' : 'Organization Info'}
                    </TabsTrigger>
                    <TabsTrigger value="details">
                        {role === 'organization' ? 'Opportunity Details' : 'Job Details'}
                    </TabsTrigger>
                    <TabsTrigger value="actions">
                        {role === 'candidate' ? 'Actions & Dates' : 'Management'}
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Entity Info */}
                {renderEntityInfoTab()}

                {/* Tab 2: Job Details */}
                {renderJobDetailsTab()}

                {/* Tab 3: Actions & History */}
                {renderActionsHistoryTab()}
            </Tabs>
        </div>
    );
};

export default TabbedJobDetails;