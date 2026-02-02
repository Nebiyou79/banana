import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Briefcase,
    MapPin,
    Globe,
    Star,
    ExternalLink,
Clock,
    Share2,
    ChevronRight,
    Shield,
    Phone,
    Link as LinkIcon,
    Cloud,
    Camera
} from 'lucide-react';
import { Profile, profileService } from '@/services/profileService';
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
    onAvatarUpload?: (file: File) => Promise<void>;
    onCoverUpload?: (file: File) => Promise<void>;
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
    onAvatarUpload,
    onCoverUpload,
    className = '',
}) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState({
        avatar: false,
        cover: false
    });
    const [refreshKey, setRefreshKey] = useState(0);

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
        lastActive,
        avatar,
        cover
    } = profile;

    // Get optimized image URLs
    const getOptimizedAvatar = () => {
        if (avatar?.secure_url) {
            return profileService.getOptimizedAvatarUrl(avatar, 'large');
        }
        return user.avatar || profileService.getPlaceholderAvatar(user.name);
    };

    const getOptimizedCover = () => {
        if (cover?.secure_url) {
            return profileService.getOptimizedCoverUrl(cover);
        }
        return '';
    };

    const avatarUrl = getOptimizedAvatar();
    const coverUrl = getOptimizedCover();

    // Add cache busting for images
    const getAvatarWithCacheBust = () => {
        if (!avatarUrl) return profileService.getPlaceholderAvatar(user.name);
        const separator = avatarUrl.includes('?') ? '&' : '?';
        return `${avatarUrl}${separator}_t=${refreshKey}`;
    };

    const getCoverWithCacheBust = () => {
        if (!coverUrl) return '';
        const separator = coverUrl.includes('?') ? '&' : '?';
        return `${coverUrl}${separator}_t=${refreshKey}`;
    };

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

    const currentPosition = getCurrentPosition();
    const experienceYears = calculateExperienceYears();

    // Handle avatar upload
    const handleAvatarClick = () => {
        if (isOwnProfile && onAvatarUpload) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp,image/gif';
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file && onAvatarUpload) {
                    setIsUploading(prev => ({ ...prev, avatar: true }));
                    try {
                        await onAvatarUpload(file);
                        setRefreshKey(prev => prev + 1);
                    } catch (error) {
                        console.error('Failed to upload avatar:', error);
                    } finally {
                        setIsUploading(prev => ({ ...prev, avatar: false }));
                    }
                }
            };
            input.click();
        }
    };

    // Handle cover upload
    const handleCoverClick = () => {
        if (isOwnProfile && onCoverUpload) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp';
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file && onCoverUpload) {
                    setIsUploading(prev => ({ ...prev, cover: true }));
                    try {
                        await onCoverUpload(file);
                        setRefreshKey(prev => prev + 1);
                    } catch (error) {
                        console.error('Failed to upload cover:', error);
                    } finally {
                        setIsUploading(prev => ({ ...prev, cover: false }));
                    }
                }
            };
            input.click();
        }
    };

    // Render based on variant
    const renderCompactView = () => (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                            {avatarUrl ? (
                                <AvatarImage
                                    src={getAvatarWithCacheBust()}
                                    alt={user.name}
                                    className="cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={handleAvatarClick}
                                />
                            ) : (
                                <AvatarFallback
                                    className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={handleAvatarClick}
                                >
                                    {initials}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {isUploading.avatar && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                        {avatar && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Cloud className="w-3 h-3" />
                            </div>
                        )}
                    </div>

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
                {coverUrl ? (
                    <div className="relative w-full h-full">
                        <img
                            src={getCoverWithCacheBust()}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        {isOwnProfile && (
                            <button
                                onClick={handleCoverClick}
                                className="absolute bottom-4 right-4 p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors flex items-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                <span className="text-sm">Change cover</span>
                            </button>
                        )}
                        {cover && (
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
                                <Cloud className="w-3 h-3" />
                                <span>Cloud Storage</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleCoverClick}
                    >
                        {isOwnProfile && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white/60" />
                            </div>
                        )}
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <CardContent className="p-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-end -mt-12 mb-6">
                    <div className="relative group">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                                {avatarUrl ? (
                                    <AvatarImage
                                        src={getAvatarWithCacheBust()}
                                        alt={user.name}
                                        className="cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={handleAvatarClick}
                                    />
                                ) : (
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={handleAvatarClick}
                                    >
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            {isOwnProfile && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full cursor-pointer">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            )}
                            {isUploading.avatar && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        {premium?.isPremium && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white p-1 rounded-full shadow-lg">
                                <Star className="w-4 h-4" fill="white" />
                            </div>
                        )}
                        {avatar && (
                            <div className="absolute -bottom-2 -left-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Cloud className="w-3 h-3" />
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

    const renderDefaultView = () => (
        <Card className="border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="w-12 h-12">
                                {avatarUrl ? (
                                    <AvatarImage
                                        src={getAvatarWithCacheBust()}
                                        alt={user.name}
                                        className="cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={handleAvatarClick}
                                    />
                                ) : (
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={handleAvatarClick}
                                    >
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            {avatar && (
                                <div className="absolute -bottom-1 -right-1">
                                    <Cloud className="w-3 h-3 text-blue-500" />
                                </div>
                            )}
                        </div>
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
            case 'minimal':
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