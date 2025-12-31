// components/social/network/FollowButton.tsx
import React, { useState, useEffect } from 'react';
import { followService } from '@/services/followService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, UserMinus, Check, X } from 'lucide-react';

interface FollowButtonProps {
    targetUserId: string;
    targetType?: 'User' | 'Company' | 'Organization';
    initialFollowing?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    showConfirmation?: boolean;
    onFollowChange?: (following: boolean) => void;
    className?: string;
    disabled?: boolean;
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
    disabled = false
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

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs h-8',
        md: 'px-4 py-2 text-sm h-9',
        lg: 'px-6 py-2.5 text-base h-11'
    };

    const variantClasses = {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
        ghost: 'text-blue-600 hover:bg-blue-50',
        destructive: 'bg-red-600 text-white hover:bg-red-700'
    };

    const handleFollow = async () => {
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
                variant: "default"
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
    };

    const handleUnfollow = async () => {
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
                variant: "default"
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
    };

    const handleToggle = () => {
        if (isFollowing) {
            if (showConfirmation) {
                setShowUnfollowConfirm(true);
            } else {
                handleUnfollow();
            }
        } else {
            handleFollow();
        }
    };

    // Show confirmation dialog for unfollow
    if (showUnfollowConfirm) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <button
                    onClick={() => setShowUnfollowConfirm(false)}
                    className={`px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors ${sizeClasses.sm}`}
                    disabled={isLoading}
                >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                </button>
                <button
                    onClick={handleUnfollow}
                    className={`bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 ${sizeClasses.sm}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <UserMinus className="w-3.5 h-3.5" />
                    )}
                    Confirm
                </button>
            </div>
        );
    }

    // Pending follow request state
    if (followStatus.status === 'pending') {
        return (
            <button
                disabled
                className={`border border-gray-300 text-gray-600 font-medium rounded-lg ${sizeClasses[size]} ${className} flex items-center gap-2 opacity-70 cursor-not-allowed`}
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                Requested
            </button>
        );
    }

    // Blocked state
    if (followStatus.status === 'blocked') {
        return (
            <button
                disabled
                className={`border border-red-300 text-red-600 font-medium rounded-lg ${sizeClasses[size]} ${className} flex items-center gap-2 opacity-70 cursor-not-allowed`}
            >
                <X className="w-4 h-4" />
                Blocked
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={`
                font-medium rounded-lg transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed
                ${sizeClasses[size]} 
                ${variantClasses[variant]}
                ${className}
                flex items-center gap-2
                ${!isFollowing && 'hover:scale-[1.02] active:scale-[0.98]'}
            `}
            disabled={isLoading || disabled}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4" />
                    <span>Following</span>
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;