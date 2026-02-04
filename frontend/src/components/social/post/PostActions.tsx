/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/post/PostActions.tsx - FACEBOOK-STYLE VERSION WITH IMMEDIATE UPDATES
import React, { useState, useEffect, useRef } from 'react';
import {
    MessageCircle, Share2, Bookmark, Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { likeService, ReactionType } from '@/services/likeService';
import { postService } from '@/services/postService';

interface PostActionsProps {
    post: any;
    currentUserId?: string;
    onLike?: (reaction?: ReactionType) => void;
    onDislike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onSave?: () => void;
    onReactionChange?: (reaction: ReactionType) => void;
    showDislike?: boolean;
    onInteractionUpdate?: (updatedPost: any) => void; // Updated to pass full post
}

// Facebook-style reaction bar component
const ReactionBar: React.FC<{
    onSelect: (reaction: ReactionType) => void;
    onClose: () => void;
    currentReaction?: ReactionType | null;
    parentRef: React.RefObject<any>;
}> = ({ onSelect, onClose, currentReaction, parentRef }) => {
    const reactions = likeService.getAllReactionTypes();
    const [isVisible, setIsVisible] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsVisible(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (barRef.current && !barRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Position the bar relative to parent
    const getBarStyle = () => {
        if (!parentRef.current) return {};

        const parentRect = parentRef.current.getBoundingClientRect();

        return {
            position: 'absolute' as const,
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: `calc(100% + 10px)`,
            zIndex: 50,
        };
    };

    return (
        <div
            ref={barRef}
            className={`transform transition-all duration-300 ease-out ${isVisible
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-90 translate-y-4'
                }`}
            style={getBarStyle()}
            onMouseEnter={() => {
                // Keep bar open when mouse enters reaction bar
            }}
            onMouseLeave={onClose}
        >
            {/* Facebook-style reaction bar */}
            <div className="bg-white dark:bg-gray-900 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2">
                {reactions.map((reaction) => (
                    <button
                        key={reaction.type}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelect(reaction.type);
                            onClose();
                        }}
                        onMouseEnter={() => setHoveredReaction(reaction.type)}
                        onMouseLeave={() => setHoveredReaction(null)}
                        className={`p-1 transform transition-all duration-200 ${currentReaction === reaction.type || hoveredReaction === reaction.type
                            ? 'scale-125 -translate-y-2'
                            : 'hover:scale-110 hover:-translate-y-1'
                            }`}
                        aria-label={reaction.label}
                        title={reaction.label}
                    >
                        <span className={`text-2xl transition-transform duration-200 ${hoveredReaction === reaction.type ? 'scale-110' : ''}`}>
                            {reaction.emoji}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tooltip for hovered reaction */}
            {hoveredReaction && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap">
                    {likeService.getReactionLabel(hoveredReaction)}
                </div>
            )}
        </div>
    );
};

// Custom SVG for Like button (Facebook-style)
const LikeIcon: React.FC<{ isActive: boolean; hasReaction: boolean; reactionEmoji?: string }> = ({
    isActive,
    hasReaction,
    reactionEmoji
}) => {
    if (hasReaction && reactionEmoji) {
        return (
            <div className="relative">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
                </svg>
                <span className="absolute -top-2 -right-2 text-lg">
                    {reactionEmoji}
                </span>
            </div>
        );
    }

    return isActive ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
    );
};

// Custom SVG for Dislike button
const DislikeIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    return isActive ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 12v2h9l-1.34 5.34L15 15V5H6z" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
    );
};

export const PostActions: React.FC<PostActionsProps> = ({
    post,
    currentUserId,
    onLike,
    onDislike,
    onComment,
    onShare,
    onSave,
    onReactionChange,
    showDislike = true,
    onInteractionUpdate,
}) => {
    const [showReactionBar, setShowReactionBar] = useState(false);
    const [localPost, setLocalPost] = useState(post);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const likeButtonRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when prop changes
    useEffect(() => {
        setLocalPost(post);
    }, [post]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
        };
    }, []);

    // Get current user interaction
    const getUserInteraction = () => {
        return localPost?.userInteraction || null;
    };

    // Get stats with proper handling
    const getOptimisticStats = () => {
        const baseStats = localPost?.stats || {};
        const userInteraction = getUserInteraction();
        
        // Calculate likes/dislikes based on current interaction
        let likeCount = baseStats.likes || 0;
        let dislikeCount = baseStats.dislikes || 0;
        
        if (userInteraction?.interactionType === 'reaction') {
            // User has a reaction - ensure at least 1 like shown
            likeCount = Math.max(1, likeCount);
        } else if (userInteraction?.interactionType === 'dislike') {
            // User has a dislike - ensure at least 1 dislike shown
            dislikeCount = Math.max(1, dislikeCount);
        }

        return {
            likeCount,
            dislikeCount,
            commentCount: baseStats.comments || 0,
            shareCount: baseStats.shares || 0,
            saveCount: localPost?.isSaved ? Math.max(1, baseStats.saves || 0) : (baseStats.saves || 0),
            viewCount: baseStats.views || 0
        };
    };

    const stats = getOptimisticStats();

    // Get current reaction from user interaction
    const getCurrentReaction = (): ReactionType | null => {
        const userInteraction = getUserInteraction();
        if (userInteraction?.interactionType === 'reaction') {
            return userInteraction.value as ReactionType;
        }
        return null;
    };

    // Get current reaction emoji
    const getCurrentReactionEmoji = () => {
        const currentReaction = getCurrentReaction();
        if (currentReaction) {
            return likeService.getReactionEmoji(currentReaction);
        }
        return null;
    };

    // Get current reaction label
    const getCurrentReactionLabel = () => {
        const currentReaction = getCurrentReaction();
        if (currentReaction) {
            return likeService.getReactionLabel(currentReaction);
        }
        return 'Like';
    };

    // Get color based on current reaction
    const getReactionColor = () => {
        const currentReaction = getCurrentReaction();
        if (currentReaction) {
            switch (currentReaction) {
                case 'heart': return 'text-red-600 dark:text-red-400';
                case 'celebrate': return 'text-yellow-600 dark:text-yellow-400';
                case 'percent_100': return 'text-green-600 dark:text-green-400';
                case 'clap': return 'text-orange-600 dark:text-orange-400';
                case 'like':
                default: return 'text-blue-600 dark:text-blue-400';
            }
        }
        return 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400';
    };

    // Update local and parent state
    const updatePostState = (updatedPost: any) => {
        setLocalPost(updatedPost);
        if (onInteractionUpdate) {
            onInteractionUpdate(updatedPost);
        }
    };

    // Apply optimistic update immediately
    const applyOptimisticUpdate = (action: {
        type: 'add_reaction' | 'add_dislike' | 'remove_interaction' | 'toggle' | 'update_reaction' | 'save' | 'unsave';
        reaction?: ReactionType;
    }) => {
        const updatedPost = postService.getOptimisticPostUpdate(localPost, action.type, action.reaction);
        
        // Handle save/unsave specifically
        if (action.type === 'save') {
            updatedPost.isSaved = true;
            updatedPost.stats = {
                ...updatedPost.stats,
                saves: (updatedPost.stats.saves || 0) + 1
            };
        } else if (action.type === 'unsave') {
            updatedPost.isSaved = false;
            updatedPost.stats = {
                ...updatedPost.stats,
                saves: Math.max(0, (updatedPost.stats.saves || 0) - 1)
            };
        }
        
        updatePostState(updatedPost);
        return updatedPost;
    };

    // Handle hover to show reaction bar
    const handleLikeMouseEnter = () => {
        if (isMobile || showReactionBar) return;

        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setShowReactionBar(true);
        }, 300);
    };

    const handleLikeMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        if (!isMobile && showReactionBar) {
            // Only hide after delay when mouse leaves completely
            hideTimeoutRef.current = setTimeout(() => {
                setShowReactionBar(false);
            }, 500);
        }
    };

    // Handle long press for mobile
    const handleLikeTouchStart = () => {
        if (!isMobile) return;

        longPressTimeoutRef.current = setTimeout(() => {
            setShowReactionBar(true);
        }, 500);
    };

    const handleLikeTouchEnd = () => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
        }
    };

    // Handle like/reaction click
    const handleLikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || !currentUserId) return;

        setIsLoading(true);

        try {
            const currentReaction = getCurrentReaction();
            const userInteraction = getUserInteraction();
            const hasDislike = userInteraction?.interactionType === 'dislike';

            // Apply optimistic update immediately
            let optimisticAction: any;
            if (hasDislike) {
                optimisticAction = { type: 'toggle' as const };
            } else if (currentReaction) {
                optimisticAction = { type: 'remove_interaction' as const };
            } else {
                optimisticAction = { type: 'add_reaction' as const, reaction: 'like' as ReactionType };
            }
            
            applyOptimisticUpdate(optimisticAction);

            // Make API call
            if (hasDislike) {
                // User has dislike, need to toggle to like
                await likeService.toggleInteraction(post._id, 'Post');
                toast({
                    variant: "success",
                    title: "Liked",
                    duration: 1500
                });
            } else if (currentReaction) {
                // User already has a reaction - remove it
                await likeService.removeInteraction(post._id, 'Post');
                toast({
                    variant: "info",
                    title: "Reaction removed",
                    duration: 1500
                });
            } else {
                // No interaction - add default like
                await likeService.addReaction(post._id, { reaction: 'like', targetType: 'Post' });
                toast({
                    variant: "success",
                    title: "Liked",
                    duration: 1500
                });
            }

            setShowReactionBar(false);
        } catch (error: any) {
            console.error('Failed to handle like:', error);
            // Rollback optimistic update on error
            updatePostState(post);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update reaction"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle reaction selection from bar
    const handleReactionSelect = async (reaction: ReactionType) => {
        if (isLoading || !currentUserId) return;

        setIsLoading(true);

        try {
            const currentReaction = getCurrentReaction();
            const userInteraction = getUserInteraction();
            const hasDislike = userInteraction?.interactionType === 'dislike';

            // Apply optimistic update immediately
            let optimisticAction: any;
            if (hasDislike) {
                optimisticAction = { type: 'toggle' as const, reaction };
            } else if (currentReaction === reaction) {
                optimisticAction = { type: 'remove_interaction' as const };
            } else {
                optimisticAction = { type: currentReaction ? 'update_reaction' : 'add_reaction' as const, reaction };
            }
            
            applyOptimisticUpdate(optimisticAction);

            // Make API call
            if (hasDislike) {
                // If user has dislike, toggle to reaction
                await likeService.toggleInteraction(post._id, 'Post');
                // Then update to specific reaction
                await likeService.updateReaction(post._id, { reaction, targetType: 'Post' });
            } else if (currentReaction === reaction) {
                // Clicking same reaction - remove it
                await likeService.removeInteraction(post._id, 'Post');
                toast({
                    variant: "info",
                    title: "Reaction removed",
                    duration: 1500
                });
            } else if (currentReaction) {
                // Changing reaction type
                await likeService.updateReaction(post._id, { reaction, targetType: 'Post' });
                const reactionLabel = likeService.getReactionLabel(reaction);
                toast({
                    variant: "success",
                    title: `${reactionLabel}`,
                    duration: 1500
                });
            } else {
                // Adding new reaction
                await likeService.addReaction(post._id, { reaction, targetType: 'Post' });
                const reactionLabel = likeService.getReactionLabel(reaction);
                toast({
                    variant: "success",
                    title: `${reactionLabel}`,
                    duration: 1500
                });
            }

            setShowReactionBar(false);
        } catch (error: any) {
            console.error('Failed to set reaction:', error);
            // Rollback optimistic update on error
            updatePostState(post);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add reaction"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle dislike click
    const handleDislikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || !currentUserId) return;

        setIsLoading(true);
        try {
            const userInteraction = getUserInteraction();
            const hasDislike = userInteraction?.interactionType === 'dislike';
            const hasReaction = userInteraction?.interactionType === 'reaction';

            // Apply optimistic update immediately
            let optimisticAction: any;
            if (hasDislike) {
                optimisticAction = { type: 'remove_interaction' as const };
            } else if (hasReaction) {
                optimisticAction = { type: 'toggle' as const };
            } else {
                optimisticAction = { type: 'add_dislike' as const };
            }
            
            applyOptimisticUpdate(optimisticAction);

            // Make API call
            if (hasDislike) {
                // Remove dislike
                await likeService.removeInteraction(post._id, 'Post');
                toast({
                    variant: "info",
                    title: "Dislike removed",
                    duration: 1500
                });
            } else if (hasReaction) {
                // Toggle from reaction to dislike
                await likeService.toggleInteraction(post._id, 'Post');
                toast({
                    variant: "info",
                    title: "Disliked",
                    duration: 1500
                });
            } else {
                // Add dislike
                await likeService.addDislike(post._id, 'Post');
                toast({
                    variant: "info",
                    title: "Disliked",
                    duration: 1500
                });
            }
        } catch (error: any) {
            console.error('Failed to handle dislike:', error);
            // Rollback optimistic update on error
            updatePostState(post);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update reaction"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle comment click
    const handleCommentClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onComment) onComment();
    };

    // Handle share click
    const handleShareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onShare) onShare();
    };

    // Handle save click
    const handleSaveClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || !currentUserId) return;

        setIsLoading(true);
        
        try {
            const currentSaved = localPost?.isSaved || false;
            
            // Apply optimistic update immediately
            if (currentSaved) {
                applyOptimisticUpdate({ type: 'unsave' });
            } else {
                applyOptimisticUpdate({ type: 'save' });
            }
            
            // Call postService methods for actual saving
            if (!currentSaved) {
                await postService.savePost(post._id);
                toast({
                    variant: "success",
                    title: "Saved",
                    description: "Post saved to your collection",
                    duration: 1500
                });
            } else {
                await postService.unsavePost(post._id);
                toast({
                    variant: "info",
                    title: "Unsaved",
                    description: "Post removed from saved",
                    duration: 1500
                });
            }
        } catch (error: any) {
            // Rollback on error
            updatePostState(post);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save post"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Keep reaction bar open when mouse is over it
    const handleReactionBarMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
    };

    const handleReactionBarMouseLeave = () => {
        if (!isMobile) {
            hideTimeoutRef.current = setTimeout(() => {
                setShowReactionBar(false);
            }, 500);
        }
    };

    const userInteraction = getUserInteraction();
    const hasReaction = userInteraction?.interactionType === 'reaction';
    const currentReaction = getCurrentReaction();
    const currentReactionEmoji = getCurrentReactionEmoji();
    const currentReactionLabel = getCurrentReactionLabel();
    const hasDislike = userInteraction?.interactionType === 'dislike';
    const isSaved = localPost?.isSaved || false;

    return (
        <div ref={containerRef} className="relative px-4 py-3">
            <div className="flex items-center justify-between gap-4">
                {/* Left Actions - Reactions, Dislike, Comment, Share */}
                <div className="flex items-center gap-4">
                    {/* Like button with reaction bar */}
                    <div
                        ref={likeButtonRef}
                        className="relative"
                        onMouseEnter={handleLikeMouseEnter}
                        onMouseLeave={handleLikeMouseLeave}
                        onTouchStart={handleLikeTouchStart}
                        onTouchEnd={handleLikeTouchEnd}
                    >
                        <div
                            onClick={handleLikeClick}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer ${getReactionColor()} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={currentReactionLabel}
                            title={currentReactionLabel}
                        >
                            <LikeIcon
                                isActive={hasReaction}
                                hasReaction={hasReaction}
                                reactionEmoji={currentReactionEmoji || undefined}
                            />
                            {!isMobile && (
                                <span className="text-sm font-medium">
                                    {currentReactionLabel}
                                </span>
                            )}
                        </div>

                        {/* Facebook-style reaction bar positioned relative to container */}
                        {showReactionBar && containerRef.current && (
                            <div
                                onMouseEnter={handleReactionBarMouseEnter}
                                onMouseLeave={handleReactionBarMouseLeave}
                            >
                                <ReactionBar
                                    onSelect={handleReactionSelect}
                                    onClose={() => setShowReactionBar(false)}
                                    currentReaction={currentReaction}
                                    parentRef={containerRef}
                                />
                            </div>
                        )}
                    </div>

                    {/* Dislike button */}
                    {showDislike && (
                        <div
                            onClick={handleDislikeClick}
                            className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer ${hasDislike
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={hasDislike ? 'Remove dislike' : 'Dislike'}
                            title={hasDislike ? 'Remove dislike' : 'Dislike'}
                        >
                            <DislikeIcon isActive={hasDislike} />
                            {!isMobile && (
                                <span className="text-sm font-medium">
                                    {hasDislike ? 'Disliked' : 'Dislike'}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Comment button */}
                    <div
                        onClick={handleCommentClick}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                        aria-label="Comment"
                        title="Comment"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {!isMobile && (
                            <span className="text-sm font-medium">Comment</span>
                        )}
                    </div>

                    {/* Share button */}
                    <div
                        onClick={handleShareClick}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 cursor-pointer"
                        aria-label="Share"
                        title="Share"
                    >
                        <Share2 className="w-5 h-5" />
                        {!isMobile && (
                            <span className="text-sm font-medium">Share</span>
                        )}
                    </div>
                </div>

                {/* Right Action - Save */}
                <div
                    onClick={handleSaveClick}
                    className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer ${isSaved
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isSaved ? "Unsave post" : "Save post"}
                    title={isSaved ? "Unsave post" : "Save post"}
                >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    {!isMobile && (
                        <span className="text-sm font-medium">
                            {isSaved ? 'Saved' : 'Save'}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Display - Updated with optimistic counts */}
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                {/* Likes */}
                <div className="flex items-center gap-1">
                    <span className="font-medium">{stats.likeCount}</span>
                    <span>like{stats.likeCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Dislikes */}
                {showDislike && (
                    <div className="flex items-center gap-1">
                        <span className="font-medium">{stats.dislikeCount}</span>
                        <span>dislike{stats.dislikeCount !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Comments */}
                <div
                    onClick={handleCommentClick}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                    <span className="font-medium">{stats.commentCount}</span>
                    <span>comment{stats.commentCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Shares */}
                <div className="flex items-center gap-1">
                    <span className="font-medium">{stats.shareCount}</span>
                    <span>share{stats.shareCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Saves */}
                <div className="flex items-center gap-1">
                    <span className="font-medium">{stats.saveCount}</span>
                    <span>save{stats.saveCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Views */}
                <div className="flex items-center gap-1 ml-auto">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{stats.viewCount}</span>
                    <span>view{stats.viewCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    );
};