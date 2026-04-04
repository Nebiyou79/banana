/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/ProfileConnectionsSection.tsx - FIXED VERSION
import React, { useState, useEffect, useCallback, memo } from 'react';
import { followService } from '@/services/followService';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { profileService } from '@/services/profileService';
import { 
    Users, 
    UserPlus, 
    ChevronRight, 
    UserMinus,
    Loader2,
    AlertCircle,
    Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/social/ui/Badge';

interface ProfileConnectionsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
  themeMode?: 'light' | 'dark';
}

interface ConnectionUser {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  verificationStatus?: string;
  role?: string;
  followerCount?: number;
  mutualConnections?: number;
}

interface FollowWithUser {
  _id: string;
  user: ConnectionUser;
  followedAt?: string;
  type?: 'follower' | 'following';
}

const ConnectionCard = memo(({
  user,
  onFollow,
  isFollowing,
  showFollowButton,
  isLoading = false,
  type = 'follower',
  themeMode = 'light'
}: {
  user: ConnectionUser;
  onFollow: (userId: string) => Promise<void>;
  isFollowing: boolean;
  showFollowButton: boolean;
  isLoading?: boolean;
  type?: 'follower' | 'following';
  themeMode?: 'light' | 'dark';
}) => {
  const initials = profileService.getInitials(user.name);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const getVariantColors = () => {
    if (type === 'follower') {
      return {
        hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-400',
        hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        avatarBg: 'bg-linear-to-br from-blue-500 to-cyan-500',
        badgeBg: 'bg-linrear-to-r from-blue-500 to-cyan-500',
        followButtonGradient: 'from-blue-500 to-cyan-500'
      };
    }
    return {
      hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-400',
      hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
      avatarBg: 'bg-linear-to-br from-purple-500 to-pink-500',
      badgeBg: 'bg-linrear-to-r from-purple-500 to-pink-500',
      followButtonGradient: 'from-purple-500 to-pink-500'
    };
  };

  const colors = getVariantColors();

  const handleClick = () => {
    window.location.href = `/social/profile/${user._id}`;
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer",
        themeMode === 'dark' 
          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300',
        colors.hoverBorder
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className="relative shrink-0">
          <Avatar className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 ring-2 transition-all",
            themeMode === 'dark' ? 'ring-gray-700' : 'ring-gray-100',
            "group-hover:ring-offset-2"
          )}>
            {user.avatar ? (
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                className="object-cover"
                loading="lazy"
              />
            ) : (
              <AvatarFallback className={cn(colors.avatarBg, "text-white font-bold")}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          {user.verificationStatus === 'verified' && (
            <div className={cn(
              "absolute -bottom-1 -right-1 rounded-full p-1 shadow-lg border-2",
              themeMode === 'dark' ? 'border-gray-800' : 'border-white',
              colors.badgeBg
            )}>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-semibold truncate",
              themeMode === 'dark' ? 'text-gray-100' : 'text-gray-800',
              colors.hoverText,
              "transition-colors"
            )}>
              {user.name}
            </h4>
            {user.role && (
              <Badge variant="outline" size="sm" className="text-xs px-1.5 py-0.5">
                {profileService.getDisplayRole(user.role)}
              </Badge>
            )}
          </div>
          
          {user.headline && (
            <p className={cn(
              "text-xs sm:text-sm truncate mt-0.5",
              themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {user.headline}
            </p>
          )}

          {/* Mutual connections count - like in ConnectionItem */}
          {user.mutualConnections && user.mutualConnections > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {showFollowButton && (
        <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size={isMobile ? "sm" : "default"}
            variant={isFollowing ? "outline" : "default"}
            onClick={() => onFollow(user._id)}
            disabled={isLoading}
            className={cn(
              "whitespace-nowrap transition-all",
              !isFollowing && `bg-linrear-to-r ${colors.followButtonGradient} text-white hover:shadow-lg`
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : isFollowing ? (
              <>
                <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Unfollow</span>
                <span className="sm:hidden">-</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Follow</span>
                <span className="sm:hidden">+</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});

ConnectionCard.displayName = 'ConnectionCard';

const SkeletonLoader = ({ themeMode = 'light' }: { themeMode?: 'light' | 'dark' }) => (
  <Card className={cn(
    "border rounded-2xl p-6",
    themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
  )}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 rounded-xl bg-linrear-to-r from-amber-500 to-orange-500">
        <Users className="w-6 h-6 text-white" />
      </div>
      <h3 className={cn(
        "text-2xl font-bold",
        themeMode === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        Network
      </h3>
    </div>

    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className={cn(
            "h-12 w-12 rounded-full",
            themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
          )} />
          <div className="flex-1 space-y-2">
            <div className={cn(
              "h-4 rounded w-3/4",
              themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            )} />
            <div className={cn(
              "h-3 rounded w-1/2",
              themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            )} />
          </div>
          <div className={cn(
            "h-9 w-24 rounded",
            themeMode === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
          )} />
        </div>
      ))}
    </div>
  </Card>
);

export const ProfileConnectionsSection: React.FC<ProfileConnectionsSectionProps> = ({
  userId,
  isOwnProfile = false,
  themeMode = 'light'
}) => {
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState<FollowWithUser[]>([]);
  const [following, setFollowing] = useState<FollowWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [totalCounts, setTotalCounts] = useState({ followers: 0, following: 0 });

  const isMobile = useMediaQuery('(max-width: 640px)');

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching connections for user:', userId);

      // Fetch followers and following in parallel
      const [followersRes, followingRes] = await Promise.all([
        followService.getPublicFollowers(userId, { limit: 5 }),
        followService.getPublicFollowing(userId, { limit: 5 })
      ]);

      console.log('Followers response:', followersRes);
      console.log('Following response:', followingRes);

      // Helper function to extract user data from Follow object - like in ConnectionItem
      const extractUserFromFollow = (follow: any, type: 'follower' | 'following'): ConnectionUser | null => {
        try {
          // For followers, the user data is in 'follower' field
          if (type === 'follower' && follow.follower) {
            const userData = follow.follower;
            return {
              _id: userData._id,
              name: userData.name || 'Unknown User',
              avatar: userData.avatar,
              headline: userData.headline || userData.bio,
              verificationStatus: userData.verificationStatus,
              role: userData.role,
              followerCount: userData.followerCount,
              mutualConnections: userData.mutualConnections
            };
          }
          
          // For following, the user data is in 'targetId' field
          if (type === 'following' && follow.targetId) {
            const userData = follow.targetId;
            return {
              _id: userData._id,
              name: userData.name || 'Unknown User',
              avatar: userData.avatar,
              headline: userData.headline || userData.bio,
              verificationStatus: userData.verificationStatus,
              role: userData.role,
              followerCount: userData.followerCount,
              mutualConnections: userData.mutualConnections
            };
          }
          
          // Fallback: try to find user data in the object itself
          if (follow._id && follow.name) {
            return {
              _id: follow._id,
              name: follow.name,
              avatar: follow.avatar,
              headline: follow.headline || follow.bio,
              verificationStatus: follow.verificationStatus,
              role: follow.role,
              followerCount: follow.followerCount,
              mutualConnections: follow.mutualConnections
            };
          }
          
          return null;
        } catch (err) {
          console.error('Error extracting user from follow:', err);
          return null;
        }
      };

      // Transform followers data - like in NetworkList
      const followersList: FollowWithUser[] = (followersRes.data || [])
        .map((follow: any) => {
          const userData = extractUserFromFollow(follow, 'follower');
          if (!userData) return null;
          
          return {
            _id: follow._id,
            user: userData,
            followedAt: follow.createdAt || follow.followedAt,
            type: 'follower'
          };
        })
        .filter(Boolean) as FollowWithUser[];

      // Transform following data - like in NetworkList
      const followingList: FollowWithUser[] = (followingRes.data || [])
        .map((follow: any) => {
          const userData = extractUserFromFollow(follow, 'following');
          if (!userData) return null;
          
          return {
            _id: follow._id,
            user: userData,
            followedAt: follow.createdAt || follow.followedAt,
            type: 'following'
          };
        })
        .filter(Boolean) as FollowWithUser[];

      console.log('Processed followers:', followersList);
      console.log('Processed following:', followingList);

      setFollowers(followersList);
      setFollowing(followingList);
      
      setTotalCounts({
        followers: followersRes.pagination?.total || followersList.length,
        following: followingRes.pagination?.total || followingList.length
      });

      // Get follow status for all connections if user is logged in - like in NetworkList
      if (currentUser?.id) {
        const allUserIds = [
          ...followersList.map(f => f.user._id),
          ...followingList.map(f => f.user._id)
        ].filter(Boolean);

        const uniqueIds = Array.from(new Set(allUserIds));

        if (uniqueIds.length > 0) {
          const statuses = await followService.getBulkFollowStatus(uniqueIds);
          
          const statusMap: Record<string, boolean> = {};
          Object.entries(statuses).forEach(([id, status]: [string, any]) => {
            statusMap[id] = status.following;
          });
          
          setFollowStatus(statusMap);
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
    if (userId) {
      fetchConnections();
    }
  }, [userId, fetchConnections]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));

      // Determine target type based on user role
      const targetUser = [...followers, ...following].find(f => f.user._id === targetUserId)?.user;
      const targetType = targetUser?.role === 'company' ? 'Company' : 
                         targetUser?.role === 'organization' ? 'Organization' : 'User';

      // Optimistic update
      setFollowStatus(prev => ({
        ...prev,
        [targetUserId]: !prev[targetUserId]
      }));

      const result = await followService.toggleFollow(targetUserId, {
        targetType: targetType as any
      });

      // Update with actual result
      setFollowStatus(prev => ({
        ...prev,
        [targetUserId]: result.following
      }));

      // Refresh connections to update counts
      await fetchConnections();

    } catch (error) {
      console.error('Failed to follow user:', error);
      
      // Revert optimistic update
      setFollowStatus(prev => ({
        ...prev,
        [targetUserId]: !prev[targetUserId]
      }));
      
      setError('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (loading) {
    return <SkeletonLoader themeMode={themeMode} />;
  }

  return (
    <Card className={cn(
      "border rounded-2xl p-4 sm:p-6",
      themeMode === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-linrear-to-r from-amber-500 to-orange-500">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className={cn(
              "text-xl sm:text-2xl font-bold",
              themeMode === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Network
            </h3>
            <p className={cn(
              "text-sm",
              themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {totalCounts.followers} followers · {totalCounts.following} following
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = `/profile/${userId}/network`}
          className="flex items-center gap-1 sm:gap-2"
        >
          <span className="text-sm">View All</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {error && (
        <div className={cn(
          "mb-4 p-3 rounded-lg flex items-center gap-2 text-sm",
          themeMode === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
        )}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Followers Section */}
      {followers.length > 0 && (
        <div className="mb-6">
          <h4 className={cn(
            "font-semibold text-base mb-3",
            themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            Followers {totalCounts.followers > followers.length && `· Top ${followers.length}`}
          </h4>
          <div className="space-y-3">
            {followers.map((follow) => {
              const isCurrentUser = follow.user._id === currentUser?.id;
              const showFollowButton = !isOwnProfile && !isCurrentUser && currentUser?.id;

              return (
                <ConnectionCard
                  key={`follower-${follow.user._id}`}
                  user={follow.user}
                  onFollow={handleFollow}
                  isFollowing={followStatus[follow.user._id] || false}
                  showFollowButton={!!showFollowButton}
                  isLoading={followLoading[follow.user._id]}
                  type="follower"
                  themeMode={themeMode}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Following Section */}
      {following.length > 0 && (
        <div className={cn(
          followers.length > 0 && "pt-6 border-t",
          themeMode === 'dark' ? 'border-gray-800' : 'border-gray-200'
        )}>
          <h4 className={cn(
            "font-semibold text-base mb-3",
            themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            Following {totalCounts.following > following.length && `· Top ${following.length}`}
          </h4>
          <div className="space-y-3">
            {following.map((follow) => {
              const isCurrentUser = follow.user._id === currentUser?.id;
              const showFollowButton = !isOwnProfile && !isCurrentUser && currentUser?.id;

              return (
                <ConnectionCard
                  key={`following-${follow.user._id}`}
                  user={follow.user}
                  onFollow={handleFollow}
                  isFollowing={followStatus[follow.user._id] || false}
                  showFollowButton={!!showFollowButton}
                  isLoading={followLoading[follow.user._id]}
                  type="following"
                  themeMode={themeMode}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {followers.length === 0 && following.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h4 className={cn(
            "text-lg font-semibold mb-2",
            themeMode === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            No Connections Yet
          </h4>
          <p className={cn(
            "text-sm max-w-sm mx-auto",
            themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {isOwnProfile 
              ? 'Start building your professional network by following interesting people.'
              : 'This profile has no connections yet.'}
          </p>
        </div>
      )}
    </Card>
  );
};