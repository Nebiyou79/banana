// components/profile/CandidateProfileView.tsx
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
    Shield,
    BookOpen,
    Users,
    Building,
    Check,
    Clock,
    AlertCircle
} from 'lucide-react';
import { candidateService, type CandidateProfile, type CV } from '@/services/candidateService';
import { profileService, type CloudinaryImage } from '@/services/profileService';
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
                color: 'bg-green-100 text-green-800 border-green-200'
            };
        case 'partial':
            return {
                label: 'Partially Verified',
                icon: <Clock className="w-3 h-3" />,
                variant: 'secondary' as const,
                color: 'bg-amber-100 text-amber-800 border-amber-200'
            };
        default:
            return {
                label: 'Not Verified',
                icon: <AlertCircle className="w-3 h-3" />,
                variant: 'outline' as const,
                color: 'bg-gray-100 text-gray-800 border-gray-200'
            };
    }
};

export const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({
    candidateProfile: externalProfile,
    showEditButton = false,
    onEditClick,
    className = '',
    showAllSections = true
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
            <div className={`space-y-6 ${className}`}>
                {/* Header Skeleton */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-20 h-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Sections Skeleton */}
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
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
            <div className={`text-center py-12 ${className}`}>
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Profile Not Found</h3>
                <p className="text-muted-foreground">Unable to load candidate profile information.</p>
            </div>
        );
    }

    const verificationBadge = getVerificationBadge(profile.verificationStatus);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`w-20 h-20 rounded-full border-4 ${colorClasses.border.white} ${colorClasses.bg.gray100} overflow-hidden`}>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-10 h-10 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {profile.role && (
                                            <Badge variant="outline" className={`${colorClasses.bg.blue} ${colorClasses.text.blue} ${colorClasses.border.blue}`}>
                                                {profile.role}
                                            </Badge>
                                        )}
                                        <Badge variant={verificationBadge.variant} className={verificationBadge.color}>
                                            {verificationBadge.icon}
                                            <span className="ml-1">{verificationBadge.label}</span>
                                        </Badge>
                                        {profile.profileCompleted && (
                                            <Badge variant="success" className={`${colorClasses.bg.green} ${colorClasses.text.green}`}>
                                                <Check className="w-3 h-3 mr-1" />
                                                Complete Profile
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {showEditButton && onEditClick && (
                                    <Button onClick={onEditClick} variant="outline" size="sm">
                                        <User className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <p className="text-foreground mt-3">{profile.bio}</p>
                            )}

                            {/* Profile Completion */}
                            {showAllSections && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Profile Completion</span>
                                        <span className="font-medium">{profileCompletion}%</span>
                                    </div>
                                    <Progress value={profileCompletion} className="h-2" />
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                                {profile.email && (
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        <span>{profile.email}</span>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{profile.phone}</span>
                                    </div>
                                )}
                                {profile.website && (
                                    <a
                                        href={profile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <Globe className="w-4 h-4" />
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5" />
                            <CardTitle>Skills & Expertise</CardTitle>
                            <Badge variant="outline">{profile.skills.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1.5">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Experience Section */}
            {showAllSections && profile.experience && profile.experience.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            <CardTitle>Work Experience</CardTitle>
                            <Badge variant="outline">{profile.experience.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.experience.map((exp, index) => (
                                <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-foreground">{exp.position}</h3>
                                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                            </span>
                                            <span>•</span>
                                            <span>{calculateDuration(exp.startDate, exp.endDate, exp.current)}</span>
                                        </div>
                                        {exp.description && (
                                            <p className="text-sm text-foreground mt-2">{exp.description}</p>
                                        )}
                                        {exp.skills && exp.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            <CardTitle>Education</CardTitle>
                            <Badge variant="outline">{profile.education.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile.education.map((edu, index) => (
                                <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-foreground">{edu.degree}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {edu.institution} • {edu.field}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                                            </span>
                                            <span>•</span>
                                            <span>{calculateDuration(edu.startDate, edu.endDate, edu.current)}</span>
                                        </div>
                                        {edu.description && (
                                            <p className="text-sm text-foreground mt-2">{edu.description}</p>
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            <CardTitle>Certifications</CardTitle>
                            <Badge variant="outline">{profile.certifications.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.certifications.map((cert, index) => (
                                <div key={index} className={`p-3 ${colorClasses.bg.gray100} rounded-lg border ${colorClasses.border.gray400}`}>
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-foreground">{cert.name}</h3>
                                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                                            <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>
                                        )}
                                        {cert.credentialUrl && (
                                            <a
                                                href={cert.credentialUrl}
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <CardTitle>Curriculum Vitae</CardTitle>
                            <Badge variant="outline">{profile.cvs.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {profile.cvs.map((cv, index) => (
                                <div key={index} className={`p-3 ${colorClasses.bg.gray100} rounded-lg border ${colorClasses.border.gray400}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-foreground">{cv.originalName}</h3>
                                                {cv.isPrimary && (
                                                    <Badge variant="success" className={`${colorClasses.bg.green} ${colorClasses.text.green}`}>
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                                        <div className="flex items-center gap-1">
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
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            <CardTitle>Portfolio</CardTitle>
                            <Badge variant="outline">{profile.portfolio.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.portfolio.map((project, index) => (
                                <div key={index} className={`p-3 ${colorClasses.bg.gray100} rounded-lg border ${colorClasses.border.gray400}`}>
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-foreground">{project.title}</h3>
                                        {project.description && (
                                            <p className="text-sm text-foreground line-clamp-2">{project.description}</p>
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
                                        {project.url && (
                                            <a
                                                href={project.url}
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

            {/* Social Links */}
            {showAllSections && profile.socialLinks && (
                <Card>
                    <CardHeader>
                        <CardTitle>Social Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {profile.socialLinks.linkedin && (
                                <a
                                    href={profile.socialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A66C2]/5 text-[#0A66C2] rounded-lg hover:bg-[#0A66C2]/10 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <span className="text-xs">LinkedIn</span>
                                </a>
                            )}
                            {profile.socialLinks.github && (
                                <a
                                    href={profile.socialLinks.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <span className="text-xs">GitHub</span>
                                </a>
                            )}
                            {profile.socialLinks.twitter && (
                                <a
                                    href={profile.socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#1DA1F2]/5 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/10 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                    </svg>
                                    <span className="text-xs">Twitter</span>
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Personal Info */}
            {(profile.dateOfBirth || profile.gender) && showAllSections && (
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.dateOfBirth && (
                                <div>
                                    <h3 className="font-medium text-sm text-muted-foreground">Date of Birth</h3>
                                    <p className="text-foreground">{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            )}
                            {profile.gender && (
                                <div>
                                    <h3 className="font-medium text-sm text-muted-foreground">Gender</h3>
                                    <p className="text-foreground capitalize">{profile.gender}</p>
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