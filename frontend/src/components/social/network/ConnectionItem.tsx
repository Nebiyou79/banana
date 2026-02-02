/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/network/ConnectionItem.tsx
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ExternalLink, 
  MessageSquare, 
  Check, 
  UserPlus, 
  UserMinus, 
  Loader2, 
  Users2,
  Shield
} from 'lucide-react';
import { followService, FollowUser } from '@/services/followService';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ConnectionItemProps {
  user: FollowUser;
  type?: 'follower' | 'following' | 'suggestion' | 'request';
  currentUserId?: string;
  onFollowChange?: (userId: string, following: boolean) => void;
  showActions?: boolean;
  showMessageButton?: boolean;
  initialFollowing?: boolean;
  compact?: boolean;
  className?: string;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({
  user,
  type = 'following',
  currentUserId,
  onFollowChange,
  showActions = true,
  showMessageButton = true,
  initialFollowing = false,
  compact = false,
  className = ''
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing || type === 'following');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isCurrentUser = user._id === currentUserId;
  const canFollow = type !== 'following' && !isCurrentUser;

  const userStats = useMemo(() => ({
    followerCount: user.followerCount || 0,
    mutualConnections: user.mutualConnections || 0,
    formattedFollowerCount: followService.formatFollowerCount(user.followerCount || 0),
    displayRole: user.role ? profileService.getDisplayRole(user.role) : null,
    initials: profileService.getInitials(user.name)
  }), [user]);

  const handleFollowToggle = async () => {
    if (isLoading || isCurrentUser) return;

    setIsLoading(true);
    try {
      const result = await followService.toggleFollow(user._id);
      const newFollowing = result.following;

      setIsFollowing(newFollowing);
      onFollowChange?.(user._id, newFollowing);

      toast({
        title: newFollowing ? "Followed" : "Unfollowed",
        description: newFollowing
          ? `You are now following ${user.name}`
          : `You unfollowed ${user.name}`,
      });
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationBadge = () => {
    if (user.verificationStatus === 'verified') {
      return (
        <Badge 
          variant="success" 
          size="sm" 
          className="absolute -top-1 -right-1 px-1.5 py-0.5"
        >
          <Check className="w-3 h-3" />
        </Badge>
      );
    }
    return null;
  };

  const renderRoleBadge = () => {
    if (user.role === 'admin') {
      return (
        <Badge variant="destructive" size="sm" className="px-1.5 py-0.5">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    
    if (user.role === 'moderator') {
      return (
        <Badge variant="secondary" size="sm" className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
          Moderator
        </Badge>
      );
    }
    
    if (userStats.displayRole) {
      return (
        <Badge variant="outline" size="sm" className="px-1.5 py-0.5">
          {userStats.displayRole}
        </Badge>
      );
    }
    
    return null;
  };

  const renderStats = () => (
    <div className="flex items-center gap-3 mt-2">
      {userStats.followerCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {userStats.formattedFollowerCount} followers
        </span>
      )}
      {userStats.mutualConnections > 0 && (
        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <Users2 className="w-3 h-3" />
          {userStats.mutualConnections} mutual
        </span>
      )}
    </div>
  );

  const renderFollowButton = () => {
    if (!canFollow) return null;

    const buttonText = isFollowing ? 'Following' : 'Follow';
    const buttonIcon = isFollowing ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />;
    const buttonVariant = isFollowing ? 'secondary' : 'default';

    return (
      <Button
        onClick={handleFollowToggle}
        disabled={isLoading}
        variant={buttonVariant}
        size="sm"
        className={cn(
          "gap-1.5",
          compact ? "px-2" : "px-3",
          !compact && "min-w-[90px]"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            {buttonIcon}
            <span className={compact ? "hidden sm:inline" : ""}>{buttonText}</span>
          </>
        )}
      </Button>
    );
  };

  const renderFollowingButton = () => {
    if (type !== 'following') return null;

    return (
      <Button
        onClick={handleFollowToggle}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <UserMinus className="w-3.5 h-3.5" />
            <span className={compact ? "hidden sm:inline" : ""}>Unfollow</span>
          </>
        )}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl",
        "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        "hover:shadow-md transition-all duration-200",
        "hover:border-gray-300 dark:hover:border-gray-600",
        compact && "p-3",
        className
      )}
    >
      {/* User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0 mb-3 sm:mb-0">
        {/* Avatar */}
        <Link
          href={`/social/profile/${user._id}`}
          className="relative flex-shrink-0 block hover:opacity-90 transition-opacity"
        >
          <Avatar className={cn(
            "ring-2 ring-gray-100 dark:ring-gray-700",
            compact ? "h-10 w-10" : "h-12 w-12"
          )}>
            <AvatarImage
              src={user.avatar}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
              {userStats.initials}
            </AvatarFallback>
          </Avatar>
          {renderVerificationBadge()}
        </Link>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-2">
            <div className="min-w-0">
              <Link
                href={`/social/profile/${user._id}`}
                className="block group hover:opacity-80 transition-opacity"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {user.name}
                </h3>
              </Link>
              
              {user.headline && (
                <p className="text-gray-600 dark:text-gray-300 text-xs truncate mt-0.5">
                  {user.headline}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 mt-1 sm:mt-0">
              {renderRoleBadge()}
            </div>
          </div>

          {/* Stats - Hidden on compact mode */}
          {!compact && renderStats()}
        </div>
      </div>

      {/* Actions */}
      {showActions && !isCurrentUser && (
        <div className="flex items-center gap-2 self-end sm:self-center">
          {showMessageButton && (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              onClick={() => {
                toast({
                  title: "Message",
                  description: "Message functionality coming soon",
                });
              }}
              aria-label="Send message"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}

          <Link
            href={`/social/profile/${user._id}`}
            aria-label="View profile"
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>

          {renderFollowButton()}
          {renderFollowingButton()}
        </div>
      )}

      {/* Stats for compact mode - placed below */}
      {compact && (
        <div className="mt-2 sm:hidden">
          {renderStats()}
        </div>
      )}
    </div>
  );
};

export default ConnectionItem;