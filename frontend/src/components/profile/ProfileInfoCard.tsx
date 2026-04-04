/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/ProfileInfoCard.tsx
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
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
    Camera,
    MessageCircle,
    UserPlus,
    UserCheck,
    Loader2,
    Mail,
    Github,
    Twitter,
    Linkedin,
} from 'lucide-react';
import { Profile, profileService } from '@/services/profileService';
import { followService } from '@/services/followService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfileInfoCardProps {
    profile: Profile;
    variant?: 'default' | 'compact' | 'detailed' | 'glass' | 'minimal';
    showActions?: boolean;
    showStats?: boolean;
    showContactInfo?: boolean;
    showSocialLinks?: boolean;
    isOwnProfile?: boolean;
    onAction?: (action: string, data?: any) => void;
    onFollowChange?: (isFollowing: boolean) => void;
    onAvatarUpload?: (file: File) => Promise<void>;
    onCoverUpload?: (file: File) => Promise<void>;
    className?: string;
    themeMode?: 'light' | 'dark';
}

// Role-based color mapping
const ROLE_COLORS = {
    candidate: { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    freelancer: { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    company: { gradient: 'from-teal-500 to-emerald-500', bg: 'bg-teal-50', text: 'text-teal-700' },
    organization: { gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    admin: { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-700' }
};

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
    profile,
    showActions = true,
    showStats = true,
    showContactInfo = true,
    showSocialLinks = true,
    isOwnProfile = false,
    onAction,
    onFollowChange,
    onAvatarUpload,
    onCoverUpload,
    className = '',
    themeMode = 'light'
}) => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState(profile.socialStats?.followerCount || 0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isUploading, setIsUploading] = useState({ avatar: false, cover: false });

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
        lastActive,
        avatar,
        cover
    } = profile;

    // Get role-specific colors
    const roleColor = ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.candidate;

    // Check follow status
    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!isOwnProfile && currentUser?.id && user?._id) {
                try {
                    // Map user role to target type
                    const targetTypeMap: Record<string, 'User' | 'Company' | 'Organization'> = {
                        candidate: 'User',
                        freelancer: 'User',
                        company: 'Company',
                        organization: 'Organization',
                        admin: 'User'
                    };
                    const targetType = targetTypeMap[user.role] || 'User';
                    
                    const status = await followService.getFollowStatus(user._id, targetType);
                    setIsFollowing(status.following);
                } catch (error) {
                    console.error('Error checking follow status:', error);
                }
            }
        };

        checkFollowStatus();
    }, [user?._id, currentUser?.id, isOwnProfile, user.role]);

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
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 1) return 'Today';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    const handleFollowToggle = async () => {
        if (!user?._id) return;

        if (!currentUser) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        if (isOwnProfile) return;

        try {
            setFollowLoading(true);
            
            // Map user role to target type
            const targetTypeMap: Record<string, 'User' | 'Company' | 'Organization'> = {
                candidate: 'User',
                freelancer: 'User',
                company: 'Company',
                organization: 'Organization',
                admin: 'User'
            };
            const targetType = targetTypeMap[user.role] || 'User';
            
            console.log('Following with targetType:', targetType, 'userId:', user._id);
            
            // Optimistic update
            setIsFollowing(!isFollowing);
            setFollowerCount(prev => !isFollowing ? prev + 1 : Math.max(0, prev - 1));
            onFollowChange?.(!isFollowing);

            const result = await followService.toggleFollow(user._id, {
                targetType,
            });

            setIsFollowing(result.following);
            setFollowerCount(prev => result.following ? prev + 1 : Math.max(0, prev - 1));
            
            toast({
                title: result.following ? 'Followed' : 'Unfollowed',
                description: result.following 
                    ? `You are now following ${user.name}`
                    : `You have unfollowed ${user.name}`,
            });

        } catch (error: any) {
            // Revert optimistic update
            setIsFollowing(!isFollowing);
            setFollowerCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
            
            console.error('Failed to toggle follow:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update follow status',
                variant: 'destructive',
            });
        } finally {
            setFollowLoading(false);
        }
    };

    const handleShare = () => {
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: user.name,
                text: headline || `Check out ${user.name}'s profile`,
                url: shareUrl,
            }).catch(() => {
                navigator.clipboard.writeText(shareUrl);
                toast({
                    title: 'Link copied',
                    description: 'Profile link copied to clipboard',
                });
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({
                title: 'Link copied',
                description: 'Profile link copied to clipboard',
            });
        }
    };

    const handleMessage = () => {
        if (!currentUser) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        window.location.href = `/dashboard/messages?user=${user._id}`;
    };

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
                        toast({
                            title: 'Success',
                            description: 'Profile picture updated successfully',
                        });
                    } catch (error) {
                        console.error('Failed to upload avatar:', error);
                        toast({
                            title: 'Error',
                            description: 'Failed to update profile picture',
                            variant: 'destructive',
                        });
                    } finally {
                        setIsUploading(prev => ({ ...prev, avatar: false }));
                    }
                }
            };
            input.click();
        }
    };

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
                        toast({
                            title: 'Success',
                            description: 'Cover photo updated successfully',
                        });
                    } catch (error) {
                        console.error('Failed to upload cover:', error);
                        toast({
                            title: 'Error',
                            description: 'Failed to update cover photo',
                            variant: 'destructive',
                        });
                    } finally {
                        setIsUploading(prev => ({ ...prev, cover: false }));
                    }
                }
            };
            input.click();
        }
    };

    // Format number helper
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main Profile Card */}
            <Card className={cn(
                "overflow-hidden border shadow-lg",
                themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
            )}>
                {/* Cover Image */}
                <div className="relative h-32 bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700">
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
                                    disabled={isUploading.cover}
                                    className="absolute bottom-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                                >
                                    {isUploading.cover ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Camera className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                            {cover && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                                    <Cloud className="w-3 h-3" />
                                    Cloud
                                </div>
                            )}
                        </div>
                    ) : isOwnProfile ? (
                        <button
                            onClick={handleCoverClick}
                            className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
                        >
                            <Camera className="w-6 h-6 text-gray-400" />
                        </button>
                    ) : null}
                </div>

                <CardContent className="p-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12 mb-4">
                        <div className="relative group">
                            <div className="relative">
                                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white dark:border-gray-900 shadow-xl">
                                    {avatarUrl ? (
                                        <AvatarImage
                                            src={getAvatarWithCacheBust()}
                                            alt={user.name}
                                            className="cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={handleAvatarClick}
                                        />
                                    ) : (
                                        <AvatarFallback className={cn(
                                            "text-white text-xl font-bold cursor-pointer hover:opacity-90 transition-opacity",
                                            roleColor.gradient
                                        )}>
                                            {initials}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                {isUploading.avatar && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="absolute -bottom-1 -right-1 flex gap-1">
                                {verificationStatus === 'verified' && (
                                    <div className="bg-green-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
                                        <Shield className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                {premium?.isPremium && (
                                    <div className="bg-linear-to-r from-amber-400 to-yellow-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
                                        <Star className="w-3 h-3 text-white fill-white" />
                                    </div>
                                )}
                                {avatar && (
                                    <div className="bg-blue-500 rounded-full p-1 shadow-lg border-2 border-white dark:border-gray-900">
                                        <Cloud className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Edit Avatar Button */}
                            {isOwnProfile && (
                                <button
                                    onClick={handleAvatarClick}
                                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={isUploading.avatar}
                                >
                                    <Camera className="w-6 h-6 text-white" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h2 className={cn(
                                    "text-xl sm:text-2xl font-bold truncate",
                                    themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    {user.name}
                                </h2>
                                <Badge className={cn(
                                    roleColor.bg,
                                    roleColor.text,
                                    "border-0"
                                )}>
                                    {roleDisplayName}
                                </Badge>
                                {lastActive && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Active {formatDate(lastActive)}
                                    </span>
                                )}
                            </div>

                            {headline && (
                                <p className={cn(
                                    "text-sm sm:text-base mb-3",
                                    themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                )}>
                                    {headline}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                {location && (
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        <MapPin className="w-4 h-4" />
                                        <span>{location}</span>
                                    </div>
                                )}
                                {currentPosition && (
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        <Briefcase className="w-4 h-4" />
                                        <span className="truncate max-w-[200px]">
                                            {currentPosition.position} at {currentPosition.company}
                                        </span>
                                    </div>
                                )}
                                {experienceYears > 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    )}>
                                        <Clock className="w-4 h-4" />
                                        <span>{experienceYears} years</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {showActions && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <Button
                                onClick={handleShare}
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>

                            {!isOwnProfile ? (
                                <>
                                    <Button
                                        onClick={handleFollowToggle}
                                        size="sm"
                                        disabled={followLoading}
                                        className={cn(
                                            "flex-1 sm:flex-none transition-all",
                                            isFollowing 
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                : `bg-linear-to-r ${roleColor.gradient} text-white hover:shadow-lg`
                                        )}
                                    >
                                        {followLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : isFollowing ? (
                                            <>
                                                <UserCheck className="w-4 h-4 mr-2" />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Follow
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={handleMessage}
                                        variant="premium"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Message
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => onAction?.('edit_profile')}
                                    variant="premium"
                                    size="sm"
                                    className="flex-1 sm:flex-none"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    {showStats && socialStats && (
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="text-center">
                                <div className={cn(
                                    "text-lg font-bold",
                                    themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    {formatNumber(socialStats.postCount || 0)}
                                </div>
                                <div className={cn(
                                    "text-xs",
                                    themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Posts
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "text-lg font-bold",
                                    themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    {formatNumber(followerCount)}
                                </div>
                                <div className={cn(
                                    "text-xs",
                                    themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Followers
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "text-lg font-bold",
                                    themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    {formatNumber(socialStats.followingCount || 0)}
                                </div>
                                <div className={cn(
                                    "text-xs",
                                    themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Following
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "text-lg font-bold",
                                    themeMode === 'dark' ? 'text-white' : 'text-gray-900'
                                )}>
                                    {formatNumber(socialStats.profileViews || 0)}
                                </div>
                                <div className={cn(
                                    "text-xs",
                                    themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                    Views
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bio Card */}
            {bio && (
                <Card className={cn(
                    "border",
                    themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                )}>
                    <CardContent className="p-4">
                        <h4 className={cn(
                            "font-semibold mb-2",
                            themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                            About
                        </h4>
                        <p className={cn(
                            "text-sm whitespace-pre-line",
                            themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                            {bio}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Social Links */}
            {showSocialLinks && socialLinks && Object.keys(socialLinks).length > 0 && (
                <Card className={cn(
                    "border",
                    themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                )}>
                    <CardContent className="p-4">
                        <h4 className={cn(
                            "font-semibold mb-3",
                            themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                            Connect Elsewhere
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {socialLinks.linkedin && (
                                <a
                                    href={socialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg hover:bg-[#0A66C2]/20 transition-colors"
                                >
                                    <Linkedin className="w-4 h-4" />
                                    <span className="text-sm hidden sm:inline">LinkedIn</span>
                                </a>
                            )}
                            {socialLinks.github && (
                                <a
                                    href={socialLinks.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    <span className="text-sm hidden sm:inline">GitHub</span>
                                </a>
                            )}
                            {socialLinks.twitter && (
                                <a
                                    href={socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
                                >
                                    <Twitter className="w-4 h-4" />
                                    <span className="text-sm hidden sm:inline">Twitter</span>
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact Info */}
            {showContactInfo && (user.email || phone || website) && (
                <Card className={cn(
                    "border",
                    themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                )}>
                    <CardContent className="p-4">
                        <h4 className={cn(
                            "font-semibold mb-3",
                            themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                            Contact Information
                        </h4>
                        <div className="space-y-2">
                            {user.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <a href={`mailto:${user.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                        {user.email}
                                    </a>
                                </div>
                            )}
                            {phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <a href={`tel:${phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                        {phone}
                                    </a>
                                </div>
                            )}
                            {website && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="w-4 h-4 text-gray-500" />
                                    <a
                                        href={website.startsWith('http') ? website : `https://${website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                                    >
                                        {website.replace(/^https?:\/\//, '')}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Profile Completion (Own Profile Only) */}
            {isOwnProfile && profileCompletion && (
                <Card className={cn(
                    "border",
                    themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                )}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                                "text-sm font-medium",
                                themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                                Profile Strength
                            </span>
                            <Badge variant="outline">{profileCompletion.percentage}%</Badge>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    profileCompletion.percentage >= 80
                                        ? 'bg-linear-to-r from-green-500 to-emerald-500'
                                        : profileCompletion.percentage >= 50
                                        ? 'bg-linear-to-r from-blue-500 to-cyan-500'
                                        : 'bg-linear-to-r from-amber-500 to-orange-500'
                                )}
                                style={{ width: `${profileCompletion.percentage}%` }}
                            />
                        </div>
                        {profileCompletion.percentage < 100 && (
                            <button
                                onClick={() => onAction?.('complete_profile')}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                Complete your profile
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ProfileInfoCard;