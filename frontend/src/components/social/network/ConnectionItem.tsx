// components/social/network/ConnectionItem.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { User, Building, ExternalLink, MessageSquare, Check, UserPlus, UserMinus, Loader2, Users2 } from 'lucide-react';
import { followService, FollowUser } from '@/services/followService';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

interface ConnectionItemProps {
    user: FollowUser;
    type?: 'follower' | 'following' | 'suggestion' | 'request';
    currentUserId?: string;
    onFollowChange?: (userId: string, following: boolean) => void;
    showActions?: boolean;
    showMessageButton?: boolean;
    initialFollowing?: boolean;
}

const ConnectionItem: React.FC<ConnectionItemProps> = ({
    user,
    type = 'following',
    currentUserId,
    onFollowChange,
    showActions = true,
    showMessageButton = true,
    initialFollowing = false
}) => {
    const [isFollowing, setIsFollowing] = useState(initialFollowing || type === 'following');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const isCurrentUser = user._id === currentUserId;
    const canFollow = type !== 'following' && !isCurrentUser;

    const getRoleIcon = () => {
        if (user.verificationStatus === 'verified') {
            return <Check className="w-3 h-3 text-green-500 fill-green-500" />;
        }
        return <User className="w-3 h-3 text-gray-400" />;
    };

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
                variant: "default"
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

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <Link
                        href={`/social/profile/${user._id}`}
                        className="block"
                    >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const span = document.createElement('span');
                                            span.className = "text-sm";
                                            span.textContent = profileService.getInitials(user.name);
                                            parent.appendChild(span);
                                        }
                                    }}
                                />
                            ) : (
                                <span className="text-sm">{profileService.getInitials(user.name)}</span>
                            )}
                        </div>
                    </Link>

                    {/* Verification Badge */}
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs border border-gray-200">
                        {getRoleIcon()}
                    </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/social/profile/${user._id}`}
                        className="block hover:opacity-80 transition-opacity"
                    >
                        <div className="flex items-center gap-1 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{user.name}</h3>
                            {user.verificationStatus === 'verified' && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded">
                                    ✓
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 text-xs truncate">
                            {user.headline || 'No headline'}
                        </p>
                        {user.role && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                {profileService.getDisplayRole(user.role)}
                            </span>
                        )}
                    </Link>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {user.followerCount !== undefined && (
                            <span>{followService.formatFollowerCount(user.followerCount)} followers</span>
                        )}
                        {user.mutualConnections !== undefined && user.mutualConnections > 0 && (
                            <span className="flex items-center gap-1">
                                <Users2 className="w-3 h-3" />
                                {user.mutualConnections} mutual
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            {showActions && !isCurrentUser && (
                <div className="flex items-center gap-2 ml-2">
                    {showMessageButton && (
                        <button
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            title="Send message"
                            onClick={() => {
                                // Implement message functionality
                                toast({
                                    title: "Message",
                                    description: "Message functionality coming soon",
                                    variant: "default"
                                });
                            }}
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                    )}

                    <Link
                        href={`/social/profile/${user._id}`}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        title="View profile"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Link>

                    {canFollow && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={isLoading}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isFollowing
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isFollowing ? (
                                <>
                                    <UserMinus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Following</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Follow</span>
                                </>
                            )}
                        </button>
                    )}

                    {type === 'following' && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <>
                                    <UserMinus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Unfollow</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConnectionItem;