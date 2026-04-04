/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/network/FollowButton.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { followService } from '@/services/followService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, UserMinus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/social/ui/Button';

interface FollowButtonProps {
  targetUserId: string;
  targetType?: 'User' | 'Company' | 'Organization';
  initialFollowing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  showConfirmation?: boolean;
  onFollowChange?: (following: boolean) => void;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetType = 'User',
  initialFollowing = false,
  size = 'md',
  variant = 'default',
  showConfirmation = false,
  onFollowChange,
  className = '',
  disabled = false,
  fullWidth = false,
  compact = false
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [followStatus, setFollowStatus] = useState<{ following: boolean; status?: string }>({
    following: initialFollowing
  });
  const { toast } = useToast();

  // Check initial follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const status = await followService.getFollowStatus(targetUserId, targetType);
        setFollowStatus(status);
        setIsFollowing(status.following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [targetUserId, targetType]);

  const handleFollow = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    const previousFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(true);
    onFollowChange?.(true);

    try {
      const result = await followService.toggleFollow(targetUserId, { targetType });

      if (!result.following) {
        // Revert if toggle didn't result in following
        setIsFollowing(false);
        onFollowChange?.(false);
      }

      toast({
        title: result.following ? "Followed" : "Unfollowed",
        description: result.following
          ? `You are now following this ${targetType.toLowerCase()}`
          : `You have unfollowed this ${targetType.toLowerCase()}`,
      });
    } catch (error: any) {
      // Revert on error
      setIsFollowing(previousFollowing);
      onFollowChange?.(previousFollowing);

      console.error('Follow error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, targetType, isLoading, disabled, isFollowing, onFollowChange, toast]);

  const handleUnfollow = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    const previousFollowing = isFollowing;

    // Optimistic update
    setIsFollowing(false);
    onFollowChange?.(false);
    setShowUnfollowConfirm(false);

    try {
      const result = await followService.toggleFollow(targetUserId, { targetType });

      if (result.following) {
        // Revert if toggle didn't result in unfollowing
        setIsFollowing(true);
        onFollowChange?.(true);
      }

      toast({
        title: "Unfollowed",
        description: `You have unfollowed this ${targetType.toLowerCase()}`,
      });
    } catch (error: any) {
      // Revert on error
      setIsFollowing(previousFollowing);
      onFollowChange?.(previousFollowing);

      console.error('Unfollow error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, targetType, isLoading, disabled, isFollowing, onFollowChange, toast]);

  const handleToggle = useCallback(() => {
    if (isFollowing) {
      if (showConfirmation) {
        setShowUnfollowConfirm(true);
      } else {
        handleUnfollow();
      }
    } else {
      handleFollow();
    }
  }, [isFollowing, showConfirmation, handleFollow, handleUnfollow]);

  // Show confirmation dialog for unfollow
  if (showUnfollowConfirm) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          onClick={() => setShowUnfollowConfirm(false)}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span className={compact ? "hidden sm:inline" : ""}>Cancel</span>
        </Button>
        <Button
          onClick={handleUnfollow}
          variant="destructive"
          size="sm"
          disabled={isLoading}
          className="gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserMinus className="w-3.5 h-3.5" />
          )}
          <span className={compact ? "hidden sm:inline" : ""}>Confirm</span>
        </Button>
      </div>
    );
  }

  // Pending follow request state
  if (followStatus.status === 'pending') {
    return (
      <Button
        disabled
        variant="outline"
        size="social-icon-sm"
        className={cn("gap-2 opacity-70", className, fullWidth && "w-full")}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className={compact ? "hidden sm:inline" : ""}>Requested</span>
      </Button>
    );
  }

  // Blocked state
  if (followStatus.status === 'blocked') {
    return (
      <Button
        disabled
        variant="outline"
        size="social-icon-sm"
        className={cn(
          "border-red-300 text-red-600 hover:text-red-600 hover:bg-red-50 gap-2",
          className,
          fullWidth && "w-full"
        )}
      >
        <X className="w-4 h-4" />
        <span className={compact ? "hidden sm:inline" : ""}>Blocked</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      variant={isFollowing ? "secondary" : variant}
      size="social-icon-sm"
      disabled={isLoading || disabled}
      className={cn(
        "gap-2 transition-all duration-200",
        !isFollowing && "hover:scale-[1.02] active:scale-95",
        className,
        fullWidth && "w-full"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span className={compact ? "hidden sm:inline" : ""}>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span className={compact ? "hidden sm:inline" : ""}>Follow</span>
        </>
      )}
    </Button>
  );
};

export default FollowButton;