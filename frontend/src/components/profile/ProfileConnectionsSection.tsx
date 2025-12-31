import React, { useState, useEffect } from 'react';
import { followService, Follow } from '@/services/followService';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import profileService from '@/services/profileService';
import { Users, UserPlus, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProfileConnectionsSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const ProfileConnectionsSection: React.FC<ProfileConnectionsSectionProps> = ({
  userId,
  isOwnProfile = false,
}) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<Record<string, { following: boolean; status?: string }>>({});

  useEffect(() => {
    fetchConnections();
  }, [userId]);

  const fetchConnections = async () => {
    try {
      setLoading(true);

      const [followersRes, followingRes] = await Promise.all([
        followService.getPublicFollowers(userId, { limit: 5 }),
        followService.getPublicFollowing(userId, { limit: 5 })
      ]);

      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);

      // Get follow status for all connections if user is logged in
      if (user?.id) {
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
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    try {
      const result = await followService.toggleFollow(targetUserId);
      setFollowStatus(prev => ({
        ...prev,
        [targetUserId]: { following: result.following }
      }));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const isFollowing = (targetUserId: string) => {
    return followStatus[targetUserId]?.following || false;
  };

  if (loading) {
    return (
      <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Network
          </h3>
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const totalFollowers = followers.length;
  const totalFollowing = following.length;

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Network
          </h3>
        </div>

        <Button
          variant="premium"
          size="sm"
          onClick={() => window.location.href = `/profile/${userId}/network`}
          className="group backdrop-blur-lg border-gray-300"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="backdrop-blur-lg bg-white rounded-xl p-4 text-center border border-gray-200 hover:scale-105 transition-transform">
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalFollowers}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </div>
        <div className="backdrop-blur-lg bg-white rounded-xl p-4 text-center border border-gray-200 hover:scale-105 transition-transform">
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalFollowing}</div>
          <div className="text-sm text-gray-600">Following</div>
        </div>
      </div>

      {/* Followers Section */}
      <div className="space-y-6">
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-lg mb-2">Top Followers</h4>
          <div className="text-sm text-gray-600">
            People who follow {isOwnProfile ? 'you' : 'this profile'}
          </div>
        </div>

        <div className="space-y-4">
          {followers.slice(0, 5).map((follow) => {
            const user = follow.follower || follow.targetId;
            const initials = profileService.getInitials(user.name);
            const following = isFollowing(user._id);
            const isCurrentUser = user?._id === userId;

            return (
              <div
                key={user._id}
                className="group flex items-center justify-between backdrop-blur-lg bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-500 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-gray-300 group-hover:ring-blue-500 transition-all">
                      {user.avatar ? (
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {user.verificationStatus === 'verified' && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-1 shadow-lg">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {user.name}
                    </div>
                    {user.headline && (
                      <div className="text-sm text-gray-600 line-clamp-1">{user.headline}</div>
                    )}
                  </div>
                </div>

                {!isOwnProfile && !isCurrentUser && user?._id && (
                  <Button
                    size="sm"
                    variant={following ? "outline" : "premium"}
                    onClick={() => handleFollow(user._id)}
                    className="backdrop-blur-lg border-gray-300 group-hover:scale-110 transition-transform"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {following ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Following Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 text-lg mb-2">Following</h4>
          <div className="text-sm text-gray-600">
            People {isOwnProfile ? 'you follow' : 'this profile follows'}
          </div>
        </div>

        <div className="space-y-4">
          {following.slice(0, 5).map((follow) => {
            const user = follow.targetId || follow;
            const initials = profileService.getInitials(user.name);
            const following = isFollowing(user._id);
            const isCurrentUser = user?._id === userId;

            return (
              <div
                key={user._id}
                className="group flex items-center justify-between backdrop-blur-lg bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-500 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-gray-300 group-hover:ring-purple-500 transition-all">
                      {user.avatar ? (
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {user.verificationStatus === 'verified' && (
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 shadow-lg">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {user.name}
                    </div>
                    {user.headline && (
                      <div className="text-sm text-gray-600 line-clamp-1">{user.headline}</div>
                    )}
                  </div>
                </div>

                {!isOwnProfile && !isCurrentUser && user?._id && (
                  <Button
                    size="sm"
                    variant={following ? "outline" : "premium"}
                    onClick={() => handleFollow(user._id)}
                    className="backdrop-blur-lg border-gray-300 group-hover:scale-110 transition-transform"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {following ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {(totalFollowers === 0 && totalFollowing === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">No Connections Yet</h4>
          <p className="text-gray-600 text-sm">
            Start building your professional network
          </p>
        </div>
      )}
    </Card>
  );
};