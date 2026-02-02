/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import FollowButton from '@/components/social/network/FollowButton';
import { profileService, Profile, CloudinaryImage } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { followService } from '@/services/followService';
import {
  MapPin,
  Briefcase,
  Shield,
  Star,
  Users,
  Globe,
  Calendar,
  Award,
  Target,
  Image as ImageIcon,
  RefreshCw,
  Cloud,
  Check,
  Edit,
  Camera,
  MessageSquare,
  Share2
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { cn } from '@/lib/utils';

// Color tokens based on design system
const COLORS = {
  // Backgrounds
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    overlay: 'bg-white/80 dark:bg-gray-900/80',
    muted: 'bg-gray-50/50 dark:bg-gray-800/50',
  },
  
  // Text
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-700 dark:text-gray-300',
    tertiary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    inverse: 'text-white dark:text-gray-900',
    brand: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  },
  
  // Borders
  border: {
    light: 'border-gray-200 dark:border-gray-700',
    medium: 'border-gray-300 dark:border-gray-600',
    strong: 'border-gray-400 dark:border-gray-500',
    brand: 'border-blue-200 dark:border-blue-700',
  },
  
  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    inner: 'shadow-inner',
    none: 'shadow-none',
  },
  
  // Gradients
  gradient: {
    subtle: 'from-gray-50 to-white dark:from-gray-800 dark:to-gray-900',
    brand: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    premium: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    success: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
  },
} as const;

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  onFollow?: (isFollowing: boolean) => void;
  onRefresh?: () => void;
  onEditProfile?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
  onCoverUpload?: (file: File) => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile = false,
  onFollow,
  onRefresh,
  onEditProfile,
  onAvatarUpload,
  onCoverUpload,
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(profile.socialStats?.followingCount || 0);
  const [followerCount, setFollowerCount] = useState(profile.socialStats?.followerCount || 0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [imageLoaded, setImageLoaded] = useState({
    avatar: false,
    cover: false
  });
  const [isUploading, setIsUploading] = useState({
    avatar: false,
    cover: false
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Check if current user follows this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isOwnProfile && user?.id && profile.user?._id) {
        try {
          const status = await followService.getFollowStatus(profile.user._id);
          setIsFollowing(status.following || false);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };

    checkFollowStatus();
  }, [profile.user?._id, user?.id, isOwnProfile]);

  // Get optimized image URLs using profileService helpers
  const getOptimizedCoverPhoto = () => {
    if (profile.cover?.secure_url) {
      return profileService.getOptimizedCoverUrl(profile.cover);
    }
    return profile.user.coverPhoto || '';
  };

  const getOptimizedAvatar = () => {
    if (profile.avatar?.secure_url) {
      return profileService.getOptimizedAvatarUrl(profile.avatar, 'large');
    }
    return profile.user.avatar || profileService.getPlaceholderAvatar(profile.user.name);
  };

  const optimizedCoverPhoto = getOptimizedCoverPhoto();
  const optimizedAvatar = getOptimizedAvatar();

  // Add cache busting for image refresh
  const getCoverPhotoWithCacheBust = () => {
    if (!optimizedCoverPhoto) return '';

    const url = optimizedCoverPhoto;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${refreshKey}`;
  };

  const getAvatarWithCacheBust = () => {
    if (!optimizedAvatar) return profileService.getPlaceholderAvatar(profile.user.name);

    const url = optimizedAvatar;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${refreshKey}`;
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    // Force image refresh by updating the cache key
    setRefreshKey(prev => prev + 1);
  };

  const handleFollowChange = async (following: boolean) => {
    setIsFollowing(following);
    if (following) {
      setFollowerCount(prev => prev + 1);
    } else {
      setFollowerCount(prev => Math.max(0, prev - 1));
    }
    onFollow?.(following);
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && onAvatarUpload) {
      setUploadError(null);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/gif';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onAvatarUpload) {
          // Validate file
          const validation = profileService.validateAvatarFile(file);
          if (!validation.valid) {
            setUploadError(validation.error || 'Invalid file');
            return;
          }

          setIsUploading(prev => ({ ...prev, avatar: true }));
          try {
            await onAvatarUpload(file);
            // Refresh the image
            setRefreshKey(prev => prev + 1);
            setUploadError(null);
          } catch (error: any) {
            console.error('Failed to upload avatar:', error);
            setUploadError(error.message || 'Failed to upload avatar');
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
      setUploadError(null);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onCoverUpload) {
          // Validate file
          const validation = profileService.validateCoverFile(file);
          if (!validation.valid) {
            setUploadError(validation.error || 'Invalid file');
            return;
          }

          setIsUploading(prev => ({ ...prev, cover: true }));
          try {
            await onCoverUpload(file);
            // Refresh the image
            setRefreshKey(prev => prev + 1);
            setUploadError(null);
          } catch (error: any) {
            console.error('Failed to upload cover:', error);
            setUploadError(error.message || 'Failed to upload cover photo');
          } finally {
            setIsUploading(prev => ({ ...prev, cover: false }));
          }
        }
      };
      input.click();
    }
  };

  const getCurrentPosition = () => {
    if (profile.roleSpecific?.experience?.length > 0) {
      const currentExp = profile.roleSpecific.experience.find(exp => exp.current);
      return currentExp || profile.roleSpecific.experience[0];
    }
    return null;
  };

  const currentPosition = getCurrentPosition();

  return (
    <div className={cn(
      COLORS.background.primary,
      "rounded-xl border overflow-hidden",
      COLORS.border.light,
      COLORS.shadow.sm
    )}>
      {/* Cover Photo */}
      <div className="relative h-48 md:h-56 lg:h-64">
        {optimizedCoverPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={getCoverPhotoWithCacheBust()}
              alt={`${profile.user.name}'s cover photo`}
              className="w-full h-full object-cover"
              key={`cover-${refreshKey}`}
              onLoad={() => {
                console.log('✅ Cover photo loaded successfully');
                setImageLoaded(prev => ({ ...prev, cover: true }));
              }}
              onError={(e) => {
                console.error('❌ Cover photo failed to load:', optimizedCoverPhoto);
                e.currentTarget.style.display = 'none';
                setImageLoaded(prev => ({ ...prev, cover: false }));
              }}
            />
            {isUploading.cover && (
              <div 
                className="absolute inset-0 bg-black/70 flex items-center justify-center"
                aria-label="Uploading cover photo"
              >
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {isOwnProfile && (
              <button
                onClick={handleCoverClick}
                className="absolute bottom-4 right-4 p-2 bg-black/70 text-white rounded-lg hover:bg-black/90 transition-colors flex items-center gap-2 backdrop-blur-sm"
                aria-label="Change cover photo"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Change cover</span>
              </button>
            )}
            {imageLoaded.cover && profile.cover && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
                <Cloud className="w-3 h-3" />
                <span>Cloud Storage</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity",
              COLORS.background.secondary,
              isOwnProfile && "hover:opacity-90"
            )}
            onClick={handleCoverClick}
            role={isOwnProfile ? "button" : "presentation"}
            aria-label={isOwnProfile ? "Add cover photo" : "No cover photo"}
          >
            {isUploading.cover ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <p className="text-gray-600 text-sm">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-gray-500 text-sm text-center px-4">
                  {isOwnProfile ? 'Click to add cover photo' : 'No cover photo'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-gray-900 dark:via-gray-900/20" />

        {/* Refresh button */}
        {onRefresh && (
          <div className="absolute top-4 right-4">
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
              title="Refresh profile"
              aria-label="Refresh profile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-4 md:px-6 pb-6">
        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {uploadError}
          </div>
        )}

        {/* Avatar and Actions Container */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-16 mb-4">
          {/* Avatar Container */}
          <div className="flex items-end gap-4 md:gap-6">
            <div className="relative group">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden">
                <Avatar className="w-full h-full">
                  {optimizedAvatar ? (
                    <>
                      <AvatarImage
                        src={getAvatarWithCacheBust()}
                        alt={`${profile.user.name}'s profile picture`}
                        className="object-cover cursor-pointer"
                        onClick={handleAvatarClick}
                        onLoad={() => {
                          console.log('✅ Avatar loaded successfully');
                          setImageLoaded(prev => ({ ...prev, avatar: true }));
                        }}
                        onError={(e) => {
                          console.error('Avatar failed to load:', optimizedAvatar);
                          e.currentTarget.src = profileService.getPlaceholderAvatar(profile.user.name);
                        }}
                      />
                      {isOwnProfile && (
                        <div 
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          aria-label="Edit profile picture"
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      )}
                      {isUploading.avatar && (
                        <div 
                          className="absolute inset-0 bg-black/50 flex items-center justify-center"
                          aria-label="Uploading profile picture"
                        >
                          <RefreshCw className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </>
                  ) : (
                    <AvatarFallback
                      className={cn(
                        COLORS.background.tertiary,
                        COLORS.text.primary,
                        "text-lg md:text-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                      )}
                      onClick={handleAvatarClick}
                    >
                      {profileService.getInitials(profile.user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              {/* Verification Badge */}
              {profile.verificationStatus === 'verified' && (
                <div 
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md"
                  title="Verified account"
                  aria-label="Verified account"
                >
                  <Shield className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              )}

              {/* Premium Badge */}
              {profile.premium?.isPremium && (
                <div 
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-1.5 rounded-full shadow-md"
                  title="Premium member"
                  aria-label="Premium member"
                >
                  <Star className="w-3 h-3 md:w-4 md:h-4" fill="white" />
                </div>
              )}

              {/* Cloud Storage Indicator */}
              {imageLoaded.avatar && profile.avatar && (
                <div className="absolute -bottom-1 -left-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span className="hidden sm:inline">Cloud</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {!isOwnProfile ? (
              <>
                <FollowButton
                  targetUserId={profile.user._id}
                  targetType="User"
                  initialFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="w-full sm:w-auto px-4"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto px-4"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onEditProfile}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto px-4"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto px-4"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <h1 className={cn(
              COLORS.text.primary,
              "text-xl md:text-2xl font-bold"
            )}>
              {profile.user.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                profile.user.role === 'candidate' ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                profile.user.role === 'freelancer' ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" :
                profile.user.role === 'company' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              )}>
                {profileService.getDisplayRole(profile.user.role)}
              </span>
              
              {profile.isActive && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Active now
                </span>
              )}
            </div>
          </div>

          {profile.headline && (
            <p className={cn(
              COLORS.text.secondary,
              "text-base md:text-lg mb-3"
            )}>
              {profile.headline}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
            {profile.location && (
              <div className={cn(
                "flex items-center gap-1.5",
                COLORS.text.tertiary
              )}>
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {currentPosition && (
              <div className={cn(
                "flex items-center gap-1.5",
                COLORS.text.tertiary
              )}>
                <Briefcase className="w-4 h-4" />
                <span>
                  {currentPosition.position} at {currentPosition.company}
                </span>
              </div>
            )}

            {profile.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <a
                  href={profileService.formatSocialLink('website', profile.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                  aria-label="Visit website"
                >
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            {
              label: 'Followers',
              value: followerCount.toLocaleString(),
              icon: <Users className="w-4 h-4" />,
              bgColor: 'bg-blue-50 dark:bg-blue-900/20',
              iconColor: 'text-blue-600 dark:text-blue-400',
              description: 'People following this profile'
            },
            {
              label: 'Following',
              value: followingCount.toLocaleString(),
              icon: <Target className="w-4 h-4" />,
              bgColor: 'bg-purple-50 dark:bg-purple-900/20',
              iconColor: 'text-purple-600 dark:text-purple-400',
              description: 'People this profile follows'
            },
            {
              label: 'Connections',
              value: profile.socialStats?.connectionCount?.toLocaleString() || '0',
              icon: '🤝',
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              iconColor: 'text-green-600 dark:text-green-400',
              description: 'Mutual connections'
            },
            {
              label: 'Posts',
              value: profile.socialStats?.postCount?.toLocaleString() || '0',
              icon: <Award className="w-4 h-4" />,
              bgColor: 'bg-amber-50 dark:bg-amber-900/20',
              iconColor: 'text-amber-600 dark:text-amber-400',
              description: 'Total posts published'
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg p-3 md:p-4 text-center transition-colors",
                COLORS.background.secondary,
                "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              role="region"
              aria-label={`${stat.label}: ${stat.value}`}
              title={stat.description}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mb-2 mx-auto",
                stat.bgColor,
                stat.iconColor
              )}>
                {stat.icon}
              </div>
              <div className={cn(
                "text-lg md:text-xl font-bold",
                COLORS.text.primary
              )}>
                {stat.value}
              </div>
              <div className={cn(
                "text-xs font-medium mt-1",
                COLORS.text.muted
              )}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Profile Completion Bar */}
        {isOwnProfile && profile.profileCompletion && (
          <div className="pt-6 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  COLORS.text.primary
                )}>
                  Profile Strength
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full font-medium">
                  {profile.profileCompletion.percentage}%
                </span>
              </div>
              <button 
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                aria-label="Complete profile to improve visibility"
              >
                Complete Profile →
              </button>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  profile.profileCompletion.percentage >= 80 ? "bg-green-500" :
                  profile.profileCompletion.percentage >= 50 ? "bg-blue-500" :
                  "bg-amber-500"
                )}
                style={{ width: `${profile.profileCompletion.percentage}%` }}
                role="progressbar"
                aria-valuenow={profile.profileCompletion.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            {profile.profileCompletion.percentage < 80 && (
              <p className={cn(
                "text-xs mt-2",
                COLORS.text.muted
              )}>
                Complete {profile.profileCompletion.requiredFields?.length || 0} more fields to reach 80%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};