/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/post/PostCard.tsx - MOBILE OPTIMIZED PREMIUM VERSION
import React, { useState, useEffect } from 'react';
import {
  Globe, Users, Lock, MapPin, MoreVertical, Flag,
  Share2, Bookmark,
  Calendar, Building, Crown, Verified,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { PostActions } from '@/components/social/post/PostActions';
import { CommentList } from '@/components/social/comments/CommentList';
import { followService } from '@/services/followService';
import { postService, Post } from '@/services/postService';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import PostGallery from './PostGallery';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onViewProfile?: (userId: string) => void;
  onUpdatePost?: (updatedPost: Post) => void;
  condensed?: boolean;
  className?: string;
  isFollowing?: boolean; // NEW: Follow status passed from parent
  onFollowChange?: (userId: string, isFollowing: boolean) => void; // NEW: Callback for follow changes
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onViewProfile,
  onUpdatePost,
  condensed = false,
  className = '',
  isFollowing: parentIsFollowing = false, // Default from parent
  onFollowChange // Callback to update parent state
}) => {
  const [localPost, setLocalPost] = useState<Post>(post);
  const [showComments, setShowComments] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(parentIsFollowing); // Sync with parent prop
  const [isExpanded, setIsExpanded] = useState(!condensed);
  const [showFullMetadata, setShowFullMetadata] = useState(false);
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  const isOwnPost = post.author?._id === currentUserId;
  const formattedDate = postService.formatPostDate(post.createdAt);

  // Privacy configuration
  const PrivacyIcon = {
    public: Globe,
    connections: Users,
    private: Lock
  }[post.visibility];

  const privacyLabel = {
    public: 'Public',
    connections: 'Connections Only',
    private: 'Only Me'
  }[post.visibility];

  // Update local post when prop changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Sync isFollowing with parent prop
  useEffect(() => {
    setIsFollowing(parentIsFollowing);
  }, [parentIsFollowing]);

  // Update local post when parent updates it
  const handlePostUpdate = (updatedPost: Post) => {
    setLocalPost(updatedPost);
    if (onUpdatePost) {
      onUpdatePost(updatedPost);
    }
  };

  // REMOVED: Individual API call for follow status
  // The parent component now provides this via prop

  // Follow handler
  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to follow users"
      });
      return;
    }

    if (isOwnPost) {
      toast({
        variant: "destructive",
        title: "Cannot Follow",
        description: "You cannot follow yourself"
      });
      return;
    }

    const previousFollowing = isFollowing;
    
    // Optimistic update
    setIsFollowing(!previousFollowing);
    // Notify parent of the change
    if (onFollowChange) {
      onFollowChange(post.author._id, !previousFollowing);
    }

    try {
      const result = await followService.toggleFollow(post.author._id);
      
      // Update with actual result
      setIsFollowing(result.following);
      if (onFollowChange) {
        onFollowChange(post.author._id, result.following);
      }

      toast({
        variant: "success",
        title: result.following ? "Following" : "Unfollowed",
        description: result.following
          ? `You are now following ${post.author.name}`
          : `You unfollowed ${post.author.name}`,
        duration: 2000
      });
    } catch (error: any) {
      // Rollback on error
      setIsFollowing(previousFollowing);
      if (onFollowChange) {
        onFollowChange(post.author._id, previousFollowing);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to update follow status'
      });
    }
  };

  // Share handler
  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post._id}`;
      await navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        title: "Link Copied",
        description: "Post link copied to clipboard",
        duration: 2000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link"
      });
    }
  };

  // Save handler - Updated to use PostActions instead
  const handleSave = async () => {
    const newSavedState = !localPost.isSaved;

    try {
      // Optimistic update
      const updatedPost = {
        ...localPost,
        isSaved: newSavedState,
        stats: {
          ...localPost.stats,
          saves: newSavedState ? (localPost.stats.saves || 0) + 1 : Math.max(0, (localPost.stats.saves || 0) - 1)
        }
      };
      setLocalPost(updatedPost);

      if (newSavedState) {
        await postService.savePost(post._id);
      } else {
        await postService.unsavePost(post._id);
      }

      toast({
        variant: newSavedState ? "success" : "info",
        title: newSavedState ? "Saved" : "Unsaved",
        description: newSavedState
          ? "Post saved to your collection"
          : "Post removed from saved",
        duration: 2000
      });
    } catch (error: any) {
      // Rollback on error
      const rolledBackPost = {
        ...localPost,
        isSaved: !newSavedState,
        stats: {
          ...localPost.stats,
          saves: !newSavedState ? (localPost.stats.saves || 0) + 1 : Math.max(0, (localPost.stats.saves || 0) - 1)
        }
      };
      setLocalPost(rolledBackPost);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save post"
      });
    }
  };

  // Report handler
  const handleReport = () => {
    toast({
      variant: "default",
      title: "Report Submitted",
      description: "Our team will review this post",
      duration: 2000
    });
    setShowMoreMenu(false);
  };

  // Content display logic
  const displayContent = isExpanded || !condensed
    ? localPost.content
    : localPost.content.length > 150
      ? localPost.content.substring(0, 150) + '...'
      : localPost.content;

  const shouldShowExpandButton = condensed && localPost.content.length > 150;

  // Get author badge
  const getAuthorBadge = () => {
    const { verificationStatus, role } = localPost.author;
    
    if (role === 'admin') {
      return {
        icon: <Crown className="w-3 h-3" />,
        label: "Admin",
        className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      };
    }
    
    if (verificationStatus === 'verified') {
      return {
        icon: <Verified className="w-3 h-3" />,
        label: "Verified",
        className: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white",
      };
    }
    
    return null;
  };

  const authorBadge = getAuthorBadge();

  return (
    <article className={`w-full bg-white dark:bg-gray-900 ${isMobile ? 'border-0' : 'border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-lg dark:shadow-gray-900/30'} transition-all duration-300 ${className}`}>
      {/* Mobile Full Width Container */}
      <div className={isMobile ? 'px-0' : 'px-6'}>
        
        {/* Header Section - Mobile Optimized */}
        <div className={`${isMobile ? 'px-4 pt-4' : 'pt-6'} flex items-start justify-between`}>
          
          {/* Author Info - Mobile Stack Layout */}
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            <button
              onClick={() => onViewProfile?.(localPost.author._id)}
              className="shrink-0"
              aria-label={`View ${localPost.author.name}'s profile`}
            >
              <Avatar className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ring-2 ring-gray-100 dark:ring-gray-800`}>
                {localPost.author.avatar ? (
                  <AvatarImage
                    src={localPost.author.avatar}
                    alt={localPost.author.name}
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <AvatarFallback className={`${isMobile ? 'text-sm' : 'text-base'} bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 font-medium`}>
                    {profileService.getInitials(localPost.author.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </button>

            {/* Author Details - Mobile Optimized */}
            <div className="flex-1 min-w-0">
              {/* Name and Badge Row */}
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => onViewProfile?.(localPost.author._id)}
                  className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-37.5 sm:max-w-none`}
                >
                  {localPost.author.name}
                </button>

                {/* Badges - Compact on Mobile */}
                {authorBadge && (
                  <Badge 
                    className={`${authorBadge.className} ${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} font-bold border-0 flex items-center gap-1`}
                  >
                    {authorBadge.icon}
                    {!isMobile && <span>{authorBadge.label}</span>}
                  </Badge>
                )}
              </div>

              {/* Metadata - Mobile Compact */}
              <div className="flex items-center flex-wrap gap-1.5">
                {/* Privacy & Time - Always Visible */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <PrivacyIcon className="w-3 h-3" />
                  <span className="font-medium">{privacyLabel}</span>
                  <span className="text-gray-400">•</span>
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium">{formattedDate}</span>
                </div>

                {/* Optional Metadata Toggle */}
                {(localPost.author.company || localPost.author.headline || localPost.location?.name) && (
                  <>
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={() => setShowFullMetadata(!showFullMetadata)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                    >
                      {showFullMetadata ? (
                        <>
                          Less <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          More <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Expandable Metadata */}
              {showFullMetadata && (
                <div className="mt-2 space-y-1">
                  {localPost.author.company && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <Building className="w-3 h-3" />
                      <span className="font-medium">{localPost.author.company}</span>
                    </div>
                  )}
                  {localPost.author.headline && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {localPost.author.headline}
                    </div>
                  )}
                  {localPost.location?.name && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                      <MapPin className="w-3 h-3" />
                      <span className="font-medium">{localPost.location.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Follow Button */}
              {!isOwnPost && isMobile && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  className="mt-2 text-xs px-3 py-1 h-6"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Follow Button and More Menu */}
          <div className="flex items-center gap-2">
            {!isOwnPost && !isMobile && (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                className="text-xs px-3 py-1.5 h-7"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>

              {showMoreMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className={`absolute right-0 top-full mt-1 ${isMobile ? 'w-48' : 'w-56'} bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50`}>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Post</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>{localPost.isSaved ? 'Unsave' : 'Save Post'}</span>
                    </button>
                    <button
                      onClick={handleReport}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-red-600 dark:text-red-400"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report Post</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Section - Full Width */}
        <div className={`${isMobile ? 'px-4 py-3' : 'py-4'}`}>
          <p className={`text-gray-900 dark:text-gray-100 ${isMobile ? 'text-sm leading-relaxed' : 'text-base leading-relaxed'} whitespace-pre-line`}>
            {displayContent}
            {shouldShowExpandButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm ml-1 font-medium"
              >
                {isExpanded ? 'See less' : '...See more'}
              </button>
            )}
          </p>

          {/* Hashtags - Mobile Scrollable */}
          {localPost.hashtags?.length > 0 && (
            <div className={`mt-2 flex flex-wrap ${isMobile ? 'gap-1.5 overflow-x-auto pb-1' : 'gap-2'}`}>
              {localPost.hashtags.map((tag: string) => (
                <span
                  key={tag}
                  className={`${isMobile ? 'text-xs px-2 py-1' : 'text-sm px-2.5 py-1'} text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer whitespace-nowrap`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Integrated Media Gallery - No Container Seam */}
        {localPost.media?.length > 0 && (
          <div className={isMobile ? '' : 'px-0'}>
            <div className={`${isMobile ? 'mx-0' : 'mx-0'} overflow-hidden ${isMobile ? '' : 'rounded-lg'}`}>
              <PostGallery
                media={localPost.media}
                maxHeight={isMobile ? 400 : 550}
                showCaptions={true}
                interactive={true}
                lightboxEnabled={true}
                autoplayVideos={false}
                mutedVideos={true}
                onDoubleClickLike={() => {
                  if (currentUserId) {
                    toast({
                      variant: "success",
                      title: "Liked",
                      duration: 1000
                    });
                  }
                }}
                className={isMobile ? 'rounded-none' : 'rounded-lg'}
              />
            </div>
          </div>
        )}

        {/* Integrated Actions Section */}
        <div className={`${isMobile ? 'px-4 py-3' : 'py-4'}`}>
          <PostActions
            post={localPost}
            currentUserId={currentUserId}
            onComment={() => setShowComments(!showComments)}
            onShare={handleShare}
            onSave={handleSave}
            onInteractionUpdate={handlePostUpdate} // IMPORTANT: This allows PostActions to update PostCard
          />
        </div>

        {/* Comments Section - Integrated */}
        {showComments && (
          <div className={`${isMobile ? 'px-0' : 'px-0'}`}>
            <CommentList
              postId={localPost._id}
              currentUserId={currentUserId}
              onCommentCountChange={(count) => {
                if (onUpdatePost) {
                  onUpdatePost({
                    ...localPost,
                    stats: { ...localPost.stats, comments: count }
                  });
                }
              }}
              className={`${isMobile ? 'border-t border-gray-200 dark:border-gray-800' : 'border-t border-gray-200 dark:border-gray-800'}`}
              compact={isMobile}
            />
          </div>
        )}

      </div>
    </article>
  );
};