import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import FollowButton from '@/components/social/network/FollowButton';
import profileService, { Profile } from '@/services/profileService';
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
  RefreshCw
} from 'lucide-react';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile?: boolean;
  onFollow?: (isFollowing: boolean) => void;
  onRefresh?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile = false,
  onFollow,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(profile.socialStats?.followingCount || 0);
  const [followerCount, setFollowerCount] = useState(profile.socialStats?.followerCount || 0);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Get the correct cover photo location
  const getCoverPhoto = () => {
    // Check multiple possible locations - prioritize user.coverPhoto
    return profile.user?.coverPhoto || profile.coverPhoto;
  };

  const coverPhoto = getCoverPhoto();

  // Add cache busting for image refresh
  const getCoverPhotoWithCacheBust = () => {
    if (!coverPhoto) return '';

    const url = coverPhoto;
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

  const getCurrentPosition = () => {
    if (profile.roleSpecific?.experience?.length > 0) {
      const currentExp = profile.roleSpecific.experience.find(exp => exp.current);
      return currentExp || profile.roleSpecific.experience[0];
    }
    return null;
  };

  const currentPosition = getCurrentPosition();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Cover Photo - UPDATED to use correct location */}
      <div className="relative h-48 bg-gradient-to-r from-blue-50 to-indigo-50">
        {coverPhoto ? (
          <>
            <img
              src={getCoverPhotoWithCacheBust()}
              alt="Cover"
              className="w-full h-full object-cover"
              key={`cover-${refreshKey}`}
              onLoad={() => console.log('✅ Cover photo loaded successfully')}
              onError={(e) => {
                console.error('❌ Cover photo failed to load:', coverPhoto);
                e.currentTarget.style.display = 'none';
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm">No cover photo</p>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

        {/* Refresh button */}
        {onRefresh && (
          <div className="absolute top-4 right-4">
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
              title="Refresh profile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Avatar Container */}
        <div className="flex items-end justify-between -mt-16 mb-4">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                <Avatar className="w-full h-full">
                  {profile.user.avatar ? (
                    <AvatarImage
                      src={profile.user.avatar}
                      alt={profile.user.name}
                      className="object-cover"
                      onError={(e) => {
                        console.error('Avatar failed to load:', profile.user.avatar);
                      }}
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-gray-700 text-xl font-semibold">
                      {profileService.getInitials(profile.user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              {/* Verification Badge */}
              {profile.verificationStatus === 'verified' && (
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                  <Shield className="w-4 h-4" />
                </div>
              )}

              {/* Premium Badge */}
              {profile.premium?.isPremium && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white p-1.5 rounded-full shadow-lg">
                  <Star className="w-4 h-4" fill="white" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isOwnProfile ? (
              <>
                <FollowButton
                  targetUserId={profile.user._id}
                  targetType="User"
                  initialFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="px-4"
                />
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Message
                </button>
              </>
            ) : (
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.user.name}
            </h1>
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {profileService.getDisplayRole(profile.user.role)}
            </span>
          </div>

          {profile.headline && (
            <p className="text-lg text-gray-700 mb-3">{profile.headline}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {currentPosition && (
              <div className="flex items-center gap-1.5">
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
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Website
                </a>
              </div>
            )}

            {profile.user.isActive && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Active now</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Followers',
              value: followerCount.toLocaleString(),
              icon: <Users className="w-4 h-4" />,
              color: 'text-blue-600 bg-blue-50'
            },
            {
              label: 'Following',
              value: followingCount.toLocaleString(),
              icon: <Target className="w-4 h-4" />,
              color: 'text-purple-600 bg-purple-50'
            },
            {
              label: 'Connections',
              value: profile.socialStats?.connectionCount?.toLocaleString() || '0',
              icon: '🤝',
              color: 'text-green-600 bg-green-50'
            },
            {
              label: 'Posts',
              value: profile.socialStats?.postCount?.toLocaleString() || '0',
              icon: <Award className="w-4 h-4" />,
              color: 'text-amber-600 bg-amber-50'
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <div className={`w-8 h-8 ${stat.color} rounded-full flex items-center justify-center mb-2 mx-auto`}>
                {stat.icon}
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Profile Completion Bar */}
        {isOwnProfile && profile.profileCompletion && (
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Profile Strength</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {profile.profileCompletion.percentage}%
                </span>
              </div>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Complete Profile →
              </button>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
                style={{ width: `${profile.profileCompletion.percentage}%` }}
              />
            </div>
            {profile.profileCompletion.percentage < 80 && (
              <p className="text-xs text-gray-500 mt-2">
                Complete {profile.profileCompletion.requiredFields?.length || 0} more fields to reach 80%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};