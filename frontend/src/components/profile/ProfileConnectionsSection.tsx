/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, memo } from 'react';
import { followService, Follow } from '@/services/followService';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { profileService } from '@/services/profileService';
import { Users, UserPlus, ChevronRight, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { colorClasses } from '@/utils/color';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ProfileConnectionsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

interface ConnectionUser {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  verificationStatus?: string;
}

const ConnectionCard = memo(({ 
  user, 
  onFollow, 
  isFollowing, 
  showFollowButton,
  variant = 'follower'
}: { 
  user: ConnectionUser;
  onFollow: (userId: string) => Promise<void>;
  isFollowing: boolean;
  showFollowButton: boolean;
  variant?: 'follower' | 'following';
}) => {
  const initials = profileService.getInitials(user.name);
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  const getVariantColors = () => {
    if (variant === 'follower') {
      return {
        hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-500',
        hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        ringColor: 'group-hover:ring-blue-500 dark:group-hover:ring-blue-500',
        avatarBg: 'bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600',
        badgeBg: 'bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600'
      };
    }
    return {
      hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-500',
      hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
      ringColor: 'group-hover:ring-purple-500 dark:group-hover:ring-purple-500',
      avatarBg: 'bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600',
      badgeBg: 'bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600'
    };
  };

  const colors = getVariantColors();
  
  return (
    <div
      className={`group flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 ${colors.hoverBorder} transition-all duration-300`}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <Avatar className={`w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-gray-300 dark:ring-gray-600 ${colors.ringColor} transition-all`}>
            {user.avatar ? (
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                className="object-cover"
                loading="lazy"
              />
            ) : (
              <AvatarFallback className={`${colors.avatarBg} text-white font-bold`}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          {user.verificationStatus === 'verified' && (
            <div className={`absolute -bottom-1 -right-1 ${colors.badgeBg} rounded-full p-1 shadow-lg`}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-gray-900 dark:text-gray-100 ${colors.hoverText} transition-colors truncate`}>
            {user.name}
          </div>
          {user.headline && (
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.headline}</div>
          )}
        </div>
      </div>

      {showFollowButton && (
        <div className="flex-shrink-0 ml-2">
          <Button
            size={isMobile ? "sm" : "default"}
            variant={isFollowing ? "outline" : "premium"}
            onClick={() => onFollow(user._id)}
            className="whitespace-nowrap"
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Unfollow</span>
                <span className="sm:hidden">Unfollow</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Follow</span>
                <span className="sm:hidden">Follow</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});

ConnectionCard.displayName = 'ConnectionCard';

const SkeletonLoader = () => (
  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-xl ${colorClasses.bg.goldenMustard}`}>
        <Users className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        Network
      </h3>
    </div>

    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </Card>
);

export const ProfileConnectionsSection: React.FC<ProfileConnectionsSectionProps> = ({
  userId,
  isOwnProfile = false,
}) => {
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [followStatus, setFollowStatus] = useState<Record<string, { following: boolean; status?: string }>>({});
  const [error, setError] = useState<string | null>(null);

  const isMobile = useMediaQuery('(max-width: 640px)');

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [followersRes, followingRes] = await Promise.all([
        followService.getPublicFollowers(userId, { limit: 5 }),
        followService.getPublicFollowing(userId, { limit: 5 })
      ]);

      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);

      // Get follow status for all connections if user is logged in
      if (currentUser?.id) {
        const allConnectionIds = [
          ...(followersRes.data || []).map((f: any) => f.follower?._id || f.targetId?._id).filter(Boolean),
          ...(followingRes.data || []).map((f: any) => f.targetId?._id || f._id).filter(Boolean)
        ];

        if (allConnectionIds.length > 0) {
          const statuses = await followService.getBulkFollowStatus(allConnectionIds);
          setFollowStatus(statuses);
        }
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      setError('Failed to load connections. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleFollow = async (targetUserId: string) => {
    try {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
      
      const result = await followService.toggleFollow(targetUserId);
      
      setFollowStatus(prev => ({
        ...prev,
        [targetUserId]: { 
          following: result.following,
          status: result.following ? 'accepted' : 'none'
        }
      }));

      // Refresh connections to update counts
      await fetchConnections();
    } catch (error) {
      console.error('Failed to follow user:', error);
      setError('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const isFollowing = (targetUserId: string) => {
    return followStatus[targetUserId]?.following || false;
  };

  const getConnectionUser = (follow: Follow): ConnectionUser => {
    return follow.follower || follow.targetId || follow as any;
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const totalFollowers = followers.length;
  const totalFollowing = following.length;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${colorClasses.bg.goldenMustard}`}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Network
          </h3>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.href = `/profile/${userId}/network`}
          className="flex items-center gap-2"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className={`mb-6 p-3 rounded-lg ${colorClasses.bg.gray100} dark:${colorClasses.bg.gray800} ${colorClasses.text.orange}`}>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} mb-6`}>
        <div className={`${colorClasses.bg.gray100} dark:${colorClasses.bg.gray800} rounded-lg p-4 text-center border ${colorClasses.border.gray400} dark:${colorClasses.border.gray700} hover:scale-[1.02] transition-transform`}>
          <div className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white} mb-1`}>
            {totalFollowers}
          </div>
          <div className={`text-sm ${colorClasses.text.gray600} dark:${colorClasses.text.gray400}`}>
            Followers
          </div>
        </div>
        <div className={`${colorClasses.bg.gray100} dark:${colorClasses.bg.gray800} rounded-lg p-4 text-center border ${colorClasses.border.gray400} dark:${colorClasses.border.gray700} hover:scale-[1.02] transition-transform`}>
          <div className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white} mb-1`}>
            {totalFollowing}
          </div>
          <div className={`text-sm ${colorClasses.text.gray600} dark:${colorClasses.text.gray400}`}>
            Following
          </div>
        </div>
      </div>

      {/* Followers Section */}
      <div className="space-y-4">
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
            Top Followers
          </h4>
          <div className={`text-sm ${colorClasses.text.gray600} dark:${colorClasses.text.gray400}`}>
            People who follow {isOwnProfile ? 'you' : 'this profile'}
          </div>
        </div>

        <div className="space-y-3">
          {followers.slice(0, 5).map((follow) => {
            const user = getConnectionUser(follow);
            const following = isFollowing(user._id);
            const isCurrentUser = user._id === userId;
            const showFollowButton = !isOwnProfile && !isCurrentUser && currentUser?.id;

            return (
              <ConnectionCard
                key={user._id}
                user={user}
                onFollow={handleFollow}
                isFollowing={following}
                showFollowButton={!!showFollowButton}
                variant="follower"
              />
            );
          })}
        </div>
      </div>

      {/* Following Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
            Following
          </h4>
          <div className={`text-sm ${colorClasses.text.gray600} dark:${colorClasses.text.gray400}`}>
            People {isOwnProfile ? 'you follow' : 'this profile follows'}
          </div>
        </div>

        <div className="space-y-3">
          {following.slice(0, 5).map((follow) => {
            const user = getConnectionUser(follow);
            const following = isFollowing(user._id);
            const isCurrentUser = user._id === userId;
            const showFollowButton = !isOwnProfile && !isCurrentUser && currentUser?.id;

            return (
              <ConnectionCard
                key={user._id}
                user={user}
                onFollow={handleFollow}
                isFollowing={following}
                showFollowButton={!!showFollowButton}
                variant="following"
              />
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {totalFollowers === 0 && totalFollowing === 0 && (
        <div className="text-center py-8">
          <div className={`w-16 h-16 rounded-full ${colorClasses.bg.goldenMustard} flex items-center justify-center mx-auto mb-4`}>
            <Users className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Connections Yet
          </h4>
          <p className={`text-sm ${colorClasses.text.gray600} dark:${colorClasses.text.gray400}`}>
            Start building your professional network
          </p>
        </div>
      )}
    </Card>
  );
};