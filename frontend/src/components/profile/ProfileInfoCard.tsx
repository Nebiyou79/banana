// components/profile/ProfileInfoCard.tsx
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Briefcase,
    GraduationCap,
    Award,
    FileText,
    Calendar,
    MapPin,
    Users,
    Globe,
    Star,
    ExternalLink,
    Building,
    Target,
    DollarSign,
    Clock,
    Heart,
    MessageCircle,
    Share2,
    Download,
    Eye,
    ChevronRight,
    Sparkles,
    Shield,
    TrendingUp,
    Package,
    FolderOpen,
    ShoppingBag,
    BarChart3,
    Phone,
    Mail,
    Link as LinkIcon,
    UserPlus,
    UserMinus,
    CheckCircle
} from 'lucide-react';
import { Profile, profileService, SocialStats } from '@/services/profileService';
import { PublicProfileActions } from '@/components/profile/PublicProfileActions';
import { ProfileSocialAnalytics } from '@/components/profile/ProfileSocialAnalytics';

interface ProfileInfoCardProps {
    profile: Profile;
    variant?: 'default' | 'compact' | 'detailed' | 'glass' | 'minimal';
    showActions?: boolean;
    showStats?: boolean;
    showAnalytics?: boolean;
    showContactInfo?: boolean;
    showSocialLinks?: boolean;
    isOwnProfile?: boolean;
    onAction?: (action: string, data?: any) => void;
    onFollowChange?: (isFollowing: boolean) => void;
    className?: string;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
    profile,
    variant = 'default',
    showActions = true,
    showStats = true,
    showAnalytics = false,
    showContactInfo = true,
    showSocialLinks = true,
    isOwnProfile = false,
    onAction,
    onFollowChange,
    className = '',
}) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const {
        user,
        headline,
        bio,
        location,
        phone,
        website,
        socialLinks,
        socialStats,
        roleSpecific,
        verificationStatus,
        premium,
        profileCompletion,
        languages = [],
        interests = [],
        lastActive
    } = profile;

    // Format date helper
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate experience years
    const calculateExperienceYears = () => {
        if (!roleSpecific?.experience) return 0;
        return profileService.getExperienceYears(roleSpecific.experience);
    };

    // Get current position
    const getCurrentPosition = () => {
        if (roleSpecific?.experience?.length > 0) {
            const currentExp = roleSpecific.experience.find(exp => exp.current);
            return currentExp || roleSpecific.experience[0];
        }
        return null;
    };

    // Get initials
    const initials = profileService.getInitials(user.name);

    // Get role display name
    const roleDisplayName = profileService.getDisplayRole(user.role);

    // Get skill categories
    const getSkillCategories = () => {
        if (!roleSpecific?.skills) return [];

        // Group skills by category (simplified)
        return {
            'Technical': roleSpecific.skills.filter(skill =>
                ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'AWS'].some(tech =>
                    skill.toLowerCase().includes(tech.toLowerCase())
                )
            ).slice(0, 5),
            'Professional': roleSpecific.skills.filter(skill =>
                ['Communication', 'Leadership', 'Project Management', 'Teamwork'].some(soft =>
                    skill.toLowerCase().includes(soft.toLowerCase())
                )
            ).slice(0, 3)
        };
    };

    const currentPosition = getCurrentPosition();
    const experienceYears = calculateExperienceYears();
    const skillCategories = getSkillCategories();

    // Render based on variant
    const renderCompactView = () => (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                        {user.avatar ? (
                            <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                                {initials}
                            </AvatarFallback>
                        )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{user.name}</h3>
                            {verificationStatus === 'verified' && (
                                <Badge variant="success" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>

                        {headline && (
                            <p className="text-sm text-gray-600 mb-2 truncate">{headline}</p>
                        )}

                        {location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <MapPin className="w-3 h-3" />
                                <span>{location}</span>
                            </div>
                        )}

                        {roleSpecific?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {roleSpecific.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                                        {skill}
                                    </Badge>
                                ))}
                                {roleSpecific.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{roleSpecific.skills.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderDetailedView = () => (
        <Card className="overflow-hidden border-0 shadow-xl">
            {/* Cover Image */}
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
                {profile.coverPhoto ? (
                    <img
                        src={profile.coverPhoto}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <CardContent className="p-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-end -mt-12 mb-6">
                    <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                            {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            )}
                        </Avatar>

                        {premium?.isPremium && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white p-1 rounded-full shadow-lg">
                                <Star className="w-4 h-4" fill="white" />
                            </div>
                        )}
                    </div>

                    <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            <Badge variant="outline" className="font-medium">
                                {roleDisplayName}
                            </Badge>
                            {verificationStatus === 'verified' && (
                                <Badge variant="success">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>

                        {headline && (
                            <p className="text-lg text-gray-700 mb-3">{headline}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{location}</span>
                                </div>
                            )}

                            {experienceYears > 0 && (
                                <div className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{experienceYears} years experience</span>
                                </div>
                            )}

                            {lastActive && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Active {formatDate(lastActive)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bio */}
                {bio && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                        <p className="text-gray-700 whitespace-pre-line">{bio}</p>
                    </div>
                )}

                {/* Skills */}
                {roleSpecific?.skills?.length > 0 && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Skills & Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                            {roleSpecific.skills.slice(0, 10).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                    {skill}
                                </Badge>
                            ))}
                            {roleSpecific.skills.length > 10 && (
                                <Button variant="ghost" size="sm" className="text-gray-600">
                                    +{roleSpecific.skills.length - 10} more
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Current Position */}
                {currentPosition && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">Current Position</h4>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold text-gray-900">{currentPosition.position}</p>
                            <p className="text-gray-700">{currentPosition.company}</p>
                            {currentPosition.location && (
                                <p className="text-sm text-gray-600">{currentPosition.location}</p>
                            )}
                            <p className="text-sm text-gray-500">
                                {formatDate(currentPosition.startDate)} - {currentPosition.current ? 'Present' : (currentPosition.endDate ? formatDate(currentPosition.endDate) : 'N/A')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                {showStats && socialStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {socialStats.followerCount?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600">Followers</div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {socialStats.followingCount?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600">Following</div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {socialStats.connectionCount?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600">Connections</div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {socialStats.profileViews?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600">Profile Views</div>
                        </div>
                    </div>
                )}

                {/* Social Links */}
                {showSocialLinks && socialLinks && Object.keys(socialLinks).length > 0 && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Social Links</h4>
                        <div className="flex flex-wrap gap-2">
                            {socialLinks.linkedin && (
                                <a
                                    href={socialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <span className="font-medium">LinkedIn</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}

                            {socialLinks.github && (
                                <a
                                    href={socialLinks.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <span className="font-medium">GitHub</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}

                            {socialLinks.twitter && (
                                <a
                                    href={socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors"
                                >
                                    <span className="font-medium">Twitter</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Contact Info */}
                {showContactInfo && (phone || website) && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                        <div className="space-y-2">
                            {phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700">{phone}</span>
                                </div>
                            )}

                            {website && (
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500" />
                                    <a
                                        href={website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Completion */}
                {isOwnProfile && profileCompletion && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">Profile Strength</span>
                                <Badge variant="outline">{profileCompletion.percentage}%</Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="text-blue-600">
                                Complete Profile
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000"
                                style={{ width: `${profileCompletion.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderGlassView = () => (
        <div className="backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 shadow-2xl p-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Avatar & Basic Info */}
                <div className="md:w-1/3 space-y-6">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50" />
                        <Avatar className="relative w-32 h-32 border-4 border-white/50 shadow-2xl">
                            {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-3xl font-bold">
                                    {initials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            {premium?.isPremium && (
                                <div className="p-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500">
                                    <Star className="w-3 h-3 text-white" fill="white" />
                                </div>
                            )}
                        </div>

                        {headline && (
                            <p className="text-lg text-gray-700 mb-4">{headline}</p>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{location || 'Location not specified'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{roleDisplayName}</span>
                            </div>

                            {experienceYears > 0 && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700">{experienceYears} years experience</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    {socialStats && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="backdrop-blur-lg bg-white/50 rounded-xl p-3 text-center border border-gray-200/50">
                                <div className="text-xl font-bold text-gray-900">{socialStats.followerCount?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-gray-600">Followers</div>
                            </div>
                            <div className="backdrop-blur-lg bg-white/50 rounded-xl p-3 text-center border border-gray-200/50">
                                <div className="text-xl font-bold text-gray-900">{socialStats.followingCount?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-gray-600">Following</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Detailed Info */}
                <div className="md:w-2/3 space-y-6">
                    {/* Bio */}
                    {bio && (
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200/50">
                            <h4 className="font-bold text-gray-900 text-lg mb-3">About</h4>
                            <p className="text-gray-700 leading-relaxed">{bio}</p>
                        </div>
                    )}

                    {/* Skills */}
                    {roleSpecific?.skills?.length > 0 && (
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200/50">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 text-lg">Top Skills</h4>
                                <Badge variant="outline">{roleSpecific.skills.length} skills</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {roleSpecific.skills.slice(0, 8).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1.5 backdrop-blur-sm">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience Summary */}
                    {roleSpecific?.experience?.length > 0 && (
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200/50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">Experience</h4>
                                    <p className="text-sm text-gray-600">{roleSpecific.experience.length} positions</p>
                                </div>
                            </div>

                            {currentPosition && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-gray-900">{currentPosition.position}</p>
                                        <p className="text-gray-700">{currentPosition.company}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(currentPosition.startDate)} - {currentPosition.current ? 'Present' : (currentPosition.endDate ? formatDate(currentPosition.endDate) : 'N/A')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Social Links */}
                    {showSocialLinks && socialLinks && Object.keys(socialLinks).length > 0 && (
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200/50">
                            <h4 className="font-bold text-gray-900 text-lg mb-4">Connect</h4>
                            <div className="flex flex-wrap gap-3">
                                {socialLinks.linkedin && (
                                    <a
                                        href={socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 rounded-xl border border-blue-200/50 transition-all hover:scale-105"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                        <span className="text-sm font-medium">LinkedIn</span>
                                    </a>
                                )}

                                {socialLinks.github && (
                                    <a
                                        href={socialLinks.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50/50 hover:bg-gray-100/50 text-gray-700 rounded-xl border border-gray-200/50 transition-all hover:scale-105"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span className="text-sm font-medium">GitHub</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderDefaultView = () => (
        <Card className="border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                            {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                    {initials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg font-bold">{user.name}</CardTitle>
                            {headline && (
                                <p className="text-sm text-gray-600">{headline}</p>
                            )}
                        </div>
                    </div>

                    {verificationStatus === 'verified' && (
                        <Badge variant="success" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {/* Location and Role */}
                {(location || roleDisplayName) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{location}</span>
                            </div>
                        )}
                        {roleDisplayName && (
                            <div className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                <span>{roleDisplayName}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Bio Preview */}
                {bio && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                        {bio}
                    </p>
                )}

                {/* Skills Preview */}
                {roleSpecific?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {roleSpecific.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                                {skill}
                            </Badge>
                        ))}
                        {roleSpecific.skills.length > 4 && (
                            <span className="text-xs text-gray-500 self-center">
                                +{roleSpecific.skills.length - 4} more
                            </span>
                        )}
                    </div>
                )}

                {/* Stats */}
                {showStats && socialStats && (
                    <div className="flex justify-between border-t border-gray-100 pt-3">
                        <div className="text-center">
                            <div className="font-bold text-gray-900">{socialStats.followerCount?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-gray-600">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-gray-900">{socialStats.followingCount?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-gray-600">Following</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-gray-900">{socialStats.connectionCount?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-gray-600">Connections</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Render action buttons based on whether it's own profile
    const renderActionButtons = () => {
        if (!showActions) return null;

        if (isOwnProfile) {
            return (
                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={() => onAction?.('edit_profile')}
                        variant="outline"
                        className="flex-1"
                    >
                        Edit Profile
                    </Button>
                    <Button
                        onClick={() => onAction?.('share_profile')}
                        variant="outline"
                        className="flex-1"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>
            );
        }

        return (
            <PublicProfileActions
                targetId={user._id}
                targetType={user.role.charAt(0).toUpperCase() + user.role.slice(1) as any}
                targetName={user.name}
                targetData={profile}
                initialIsFollowing={isFollowing}
                onAction={onAction}
            />
        );
    };

    // Render analytics section
    const renderAnalytics = () => {
        if (!showAnalytics || !isOwnProfile) return null;

        return (
            <div className="mt-8">
                <ProfileSocialAnalytics
                    stats={socialStats}
                    variant="card"
                    showTrends={true}
                />
            </div>
        );
    };

    // Main render based on variant
    const renderContent = () => {
        switch (variant) {
            case 'compact':
                return renderCompactView();
            case 'detailed':
                return renderDetailedView();
            case 'glass':
                return renderGlassView();
            case 'minimal':
                return renderDefaultView();
            default:
                return renderDetailedView();
        }
    };

    return (
        <div className={`${className}`}>
            {renderContent()}
            {renderActionButtons()}
            {renderAnalytics()}
        </div>
    );
};

export default ProfileInfoCard;