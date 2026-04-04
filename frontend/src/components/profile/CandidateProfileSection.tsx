// components/profile/CandidateProfileView.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
    User,
    Briefcase,
    GraduationCap,
    Award,
    FileText,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Globe,
    ExternalLink,
    Star,
    Check,
    Clock,
    AlertCircle,
    BookOpen,
    Linkedin,
    Github,
    Twitter
} from 'lucide-react';
import { candidateService, type CandidateProfile, type CV } from '@/services/candidateService';
import { profileService } from '@/services/profileService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { colorClasses } from '@/utils/color';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';

interface CandidateProfileViewProps {
    candidateProfile?: CandidateProfile;
    showEditButton?: boolean;
    onEditClick?: () => void;
    className?: string;
    showAllSections?: boolean;
    themeMode?: 'light' | 'dark';
}

const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Present';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Present';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
        });
    } catch {
        return 'Present';
    }
};

const calculateDuration = (startDate?: string, endDate?: string, current?: boolean): string => {
    if (!startDate) return '';

    const start = new Date(startDate);
    const end = current || !endDate ? new Date() : new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
    if (parts.length === 0) return '0 mos';

    return parts.join(' ');
};

const getCVFileSize = (cv: CV): string => {
    if (!cv?.size) return 'Unknown size';
    const bytes = cv.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getVerificationBadge = (status: string) => {
    switch (status) {
        case 'full':
            return {
                label: 'Verified',
                icon: <Check className="w-3 h-3" />,
                variant: 'default' as const,
                color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800'
            };
        case 'partial':
            return {
                label: 'Partially Verified',
                icon: <Clock className="w-3 h-3" />,
                variant: 'secondary' as const,
                color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
            };
        default:
            return {
                label: 'Not Verified',
                icon: <AlertCircle className="w-3 h-3" />,
                variant: 'outline' as const,
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            };
    }
};

// Helper function to safely get URL string
const getUrlString = (url: any): string => {
    if (!url) return '';
    if (typeof url === 'string') return url;
    if (typeof url === 'object' && url.url) return url.url;
    if (typeof url === 'object' && url.href) return url.href;
    return '';
};

// Helper function to safely check if URL is valid
const isValidUrl = (url: any): boolean => {
    const urlStr = getUrlString(url);
    if (!urlStr) return false;
    try {
        new URL(urlStr);
        return true;
    } catch {
        return false;
    }
};

export const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({
    candidateProfile: externalProfile,
    showEditButton = false,
    onEditClick,
    className = '',
    showAllSections = true,
    themeMode = 'light'
}) => {
    const [profile, setProfile] = useState<CandidateProfile | null>(externalProfile || null);
    const [loading, setLoading] = useState(!externalProfile);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    useEffect(() => {
        if (!externalProfile) {
            loadProfileData();
        } else {
            setProfile(externalProfile);
        }
    }, [externalProfile]);

    useEffect(() => {
        if (profile?.avatar) {
            setAvatarUrl(profile.avatar);
        }
    }, [profile]);

    const loadProfileData = async () => {
        try {
            setLoading(true);

            // Load candidate data from candidateService
            const candidateData = await candidateService.getProfile();
            setProfile(candidateData);

            // Load profile completion from profileService
            const completion = await profileService.getProfileCompletion();
            setProfileCompletion(completion.percentage);

        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCV = (cv: CV) => {
        if (cv.fileUrl) {
            window.open(cv.fileUrl, '_blank');
        }
    };

    const handleDownloadCV = (cv: CV) => {
        candidateService.downloadCV(cv._id, cv.originalName);
    };

    if (loading) {
        return (
            <div className={`space-y-4 md:space-y-6 ${className}`}>
                {/* Header Skeleton */}
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 md:h-7 w-32 md:w-48" />
                                <Skeleton className="h-4 w-24 md:w-32" />
                                <Skeleton className="h-4 w-28 md:w-40" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Sections Skeleton */}
                {[1, 2, 3].map((i) => (
                    <Card key={i} className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                        <CardHeader>
                            <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={`text-center py-8 md:py-12 ${className}`}>
                <AlertCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                <h3 className="text-lg md:text-xl font-medium text-foreground dark:text-gray-100 mb-2">Profile Not Found</h3>
                <p className="text-muted-foreground dark:text-gray-400">Unable to load candidate profile information.</p>
            </div>
        );
    }

    const verificationBadge = getVerificationBadge(profile.verificationStatus);

    // Safely get social links
    const linkedinUrl = profile.socialLinks?.linkedin ? getUrlString(profile.socialLinks.linkedin) : '';
    const githubUrl = profile.socialLinks?.github ? getUrlString(profile.socialLinks.github) : '';
    const twitterUrl = profile.socialLinks?.twitter ? getUrlString(profile.socialLinks.twitter) : '';

    return (
        <div className={`space-y-4 md:space-y-6 ${className}`}>
            {/* Profile Header */}
            <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <CardContent className="pt-4 md:pt-6">
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 ${colorClasses.border.gray400} overflow-hidden`}>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                        <User className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                                <div className="min-w-0">
                                    <h1 className="text-xl md:text-2xl font-bold text-foreground dark:text-gray-100 truncate">{profile.name}</h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {profile.role && (
                                            <Badge variant="outline" className={`${colorClasses.bg.blue} ${colorClasses.text.blue} ${colorClasses.border.blue} dark:${colorClasses.bg.blue} dark:${colorClasses.text.blue} dark:${colorClasses.border.blue}`}>
                                                {profile.role}
                                            </Badge>
                                        )}
                                        <Badge variant={verificationBadge.variant} className={verificationBadge.color}>
                                            {verificationBadge.icon}
                                            <span className="ml-1">{verificationBadge.label}</span>
                                        </Badge>
                                        {profile.profileCompleted && (
                                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                                                <Check className="w-3 h-3 mr-1" />
                                                Complete Profile
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {showEditButton && onEditClick && (
                                    <Button onClick={onEditClick} variant="outline" size="sm" className="w-full md:w-auto">
                                        <User className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <p className="text-foreground dark:text-gray-300 mt-3 text-sm md:text-base">{profile.bio}</p>
                            )}

                            {/* Profile Completion */}
                            {showAllSections && (
                                <div className="mt-3 md:mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground dark:text-gray-400">Profile Completion</span>
                                        <span className="font-medium text-foreground dark:text-gray-100">{profileCompletion}%</span>
                                    </div>
                                    <Progress value={profileCompletion} className="h-1.5 md:h-2" />
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-3 md:mt-4 text-sm text-muted-foreground dark:text-gray-400">
                                {profile.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 md:w-4 md:h-4" />
                                        <span className="truncate">{profile.email}</span>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                        <span className="truncate">{profile.location}</span>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3 md:w-4 md:h-4" />
                                        <span className="truncate">{profile.phone}</span>
                                    </div>
                                )}
                                {profile.website && isValidUrl(profile.website) && (
                                    <a
                                        href={getUrlString(profile.website)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline truncate"
                                    >
                                        <Globe className="w-3 h-3 md:w-4 md:h-4" />
                                        <span>Website</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skills Section */}
            {profile.skills && profile.skills.length > 0 && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 md:w-5 md:h-5" />
                            <CardTitle className="text-base md:text-lg">Skills & Expertise</CardTitle>
                            <Badge variant="outline" className="text-xs">{profile.skills.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {profile.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="px-2.5 py-1 md:px-3 md:py-1.5 text-xs md:text-sm">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Experience Section */}
            {showAllSections && profile.experience && profile.experience.length > 0 && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                            <CardTitle className="text-base md:text-lg">Work Experience</CardTitle>
                            <Badge variant="outline" className="text-xs">{profile.experience.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.experience.map((exp, index) => (
                                <div key={index} className="pb-3 md:pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <h3 className="font-medium text-foreground dark:text-gray-100 text-sm md:text-base">{exp.position}</h3>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">{exp.company}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                            </span>
                                            <span>•</span>
                                            <span>{calculateDuration(exp.startDate, exp.endDate, exp.current)}</span>
                                        </div>
                                        {exp.description && (
                                            <p className="text-sm text-foreground dark:text-gray-300 mt-1.5 md:mt-2">{exp.description}</p>
                                        )}
                                        {exp.skills && exp.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5 md:mt-2">
                                                {exp.skills.map((skill, skillIndex) => (
                                                    <Badge key={skillIndex} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Education Section */}
            {showAllSections && profile.education && profile.education.length > 0 && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                            <CardTitle className="text-base md:text-lg">Education</CardTitle>
                            <Badge variant="outline" className="text-xs">{profile.education.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.education.map((edu, index) => (
                                <div key={index} className="pb-3 md:pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <h3 className="font-medium text-foreground dark:text-gray-100 text-sm md:text-base">{edu.degree}</h3>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                                            {edu.institution} • {edu.field}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                                            </span>
                                            <span>•</span>
                                            <span>{calculateDuration(edu.startDate, edu.endDate, edu.current)}</span>
                                        </div>
                                        {edu.description && (
                                            <p className="text-sm text-foreground dark:text-gray-300 mt-1.5 md:mt-2">{edu.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Certifications Section */}
            {showAllSections && profile.certifications && profile.certifications.length > 0 && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 md:w-5 md:h-5" />
                            <CardTitle className="text-base md:text-lg">Certifications</CardTitle>
                            <Badge variant="outline" className="text-xs">{profile.certifications.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {profile.certifications.map((cert, index) => (
                                <div key={index} className={`p-3 ${colorClasses.bg.gray100} dark:bg-gray-800 rounded-lg border ${colorClasses.border.gray400} dark:border-gray-700`}>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <h3 className="font-medium text-foreground dark:text-gray-100 text-sm md:text-base">{cert.name}</h3>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400">{cert.issuer}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>Issued: {formatDate(cert.issueDate)}</span>
                                            {cert.expiryDate && (
                                                <>
                                                    <span>•</span>
                                                    <span>Expires: {formatDate(cert.expiryDate)}</span>
                                                </>
                                            )}
                                        </div>
                                        {cert.credentialId && (
                                            <p className="text-xs text-muted-foreground dark:text-gray-500">ID: {cert.credentialId}</p>
                                        )}
                                        {cert.credentialUrl && isValidUrl(cert.credentialUrl) && (
                                            <a
                                                href={getUrlString(cert.credentialUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                            >
                                                View Credential
                                                <ExternalLink className="w-2 h-2" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* CVs Section */}
            {showAllSections && profile.cvs && profile.cvs.length > 0 && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 md:w-5 md:h-5" />
                            <CardTitle className="text-base md:text-lg">Curriculum Vitae</CardTitle>
                            <Badge variant="outline" className="text-xs">{profile.cvs.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {profile.cvs.map((cv, index) => (
                                <div key={index} className={`p-3 ${colorClasses.bg.gray100} dark:bg-gray-800 rounded-lg border ${colorClasses.border.gray400} dark:border-gray-700`}>
                                    <div className="flex flex-col md:flex-row md:justify-between items-start gap-2 md:gap-0">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-foreground dark:text-gray-100 text-sm md:text-base truncate">{cv.originalName}</h3>
                                                {cv.isPrimary && (
                                                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground dark:text-gray-500">
                                                <span>Size: {getCVFileSize(cv)}</span>
                                                <span>•</span>
                                                <span>Uploaded: {new Date(cv.uploadedAt).toLocaleDateString()}</span>
                                                {cv.fileExtension && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Format: {cv.fileExtension.toUpperCase()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 md:gap-2 self-end md:self-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewCV(cv)}
                                                className="h-7 w-7 p-0"
                                                title="View"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadCV(cv)}
                                                className="h-7 w-7 p-0"
                                                title="Download"
                                            >
                                                <FileText className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Portfolio Section */}
            {showAllSections && profile.portfolio && profile.portfolio.length > 0 && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                            <CardTitle className="text-base md:text-lg">Portfolio</CardTitle>
                            <Badge variant="outline" className="text-xs">{profile.portfolio.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {profile.portfolio.map((project, index) => (
                                <div key={index} className={`p-3 ${colorClasses.bg.gray100} dark:bg-gray-800 rounded-lg border ${colorClasses.border.gray400} dark:border-gray-700`}>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <h3 className="font-medium text-foreground dark:text-gray-100 text-sm md:text-base">{project.title}</h3>
                                        {project.description && (
                                            <p className="text-sm text-foreground dark:text-gray-300 line-clamp-2">{project.description}</p>
                                        )}
                                        {project.skills && project.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {project.skills.map((skill, skillIndex) => (
                                                    <Badge key={skillIndex} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {project.url && isValidUrl(project.url) && (
                                            <a
                                                href={getUrlString(project.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                View Project
                                                <ExternalLink className="w-2 h-2" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Social Links - FIXED with safe URL handling */}
            {showAllSections && (linkedinUrl || githubUrl || twitterUrl) && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base md:text-lg">Social Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {linkedinUrl && (
                                <a
                                    href={linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#0A66C2]/20 dark:text-[#0A66C2] rounded-lg hover:bg-[#0A66C2]/20 dark:hover:bg-[#0A66C2]/30 transition-colors"
                                >
                                    <Linkedin className="w-4 h-4" />
                                    <span className="text-xs">LinkedIn</span>
                                </a>
                            )}
                            {githubUrl && (
                                <a
                                    href={githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    <span className="text-xs">GitHub</span>
                                </a>
                            )}
                            {twitterUrl && (
                                <a
                                    href={twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] dark:bg-[#1DA1F2]/20 dark:text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 dark:hover:bg-[#1DA1F2]/30 transition-colors"
                                >
                                    <Twitter className="w-4 h-4" />
                                    <span className="text-xs">Twitter</span>
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Personal Info */}
            {(profile.dateOfBirth || profile.gender) && showAllSections && (
                <Card className={`border ${themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base md:text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.dateOfBirth && (
                                <div>
                                    <h3 className="font-medium text-sm text-muted-foreground dark:text-gray-400">Date of Birth</h3>
                                    <p className="text-foreground dark:text-gray-100">{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            )}
                            {profile.gender && (
                                <div>
                                    <h3 className="font-medium text-sm text-muted-foreground dark:text-gray-400">Gender</h3>
                                    <p className="text-foreground dark:text-gray-100 capitalize">{profile.gender}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CandidateProfileView;