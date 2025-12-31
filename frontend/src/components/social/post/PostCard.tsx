/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/post/PostCard.tsx
import React, { useState, useEffect } from 'react';
import { Globe, Users, Lock, MapPin, MoreVertical, Flag, ExternalLink } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { PostGallery } from '@/components/social/post/PostGallery';
import { PostActions } from '@/components/social/post/PostActions';
import { CommentList } from '@/components/social/comments/CommentList';
import { likeService } from '@/services/likeService';
import { followService } from '@/services/followService';
import { postService, Post } from '@/services/postService';
import { profileService } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onViewProfile?: (userId: string) => void;
  condensed?: boolean;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onViewProfile,
  condensed = false,
  className = ''
}) => {
  const [isLiked, setIsLiked] = useState(post.hasLiked || false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);
  const [commentCount, setCommentCount] = useState(post.stats?.comments || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { toast } = useToast();

  const isOwnPost = post.author?._id === currentUserId;
  const formattedDate = postService.formatPostDate(post.createdAt);

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

  // Check follow status on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isOwnPost && post.author?._id && currentUserId) {
        try {
          const status = await followService.getFollowStatus(post.author._id);
          setIsFollowing(status.following || false);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };

    checkFollowStatus();
  }, [post.author?._id, currentUserId, isOwnPost]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to like posts"
      });
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      if (previousLiked) {
        await likeService.removeReaction(post._id, 'Post');
      } else {
        await likeService.addReaction(post._id, {
          reaction: 'like',
          targetType: 'Post'
        });
      }
    } catch (error: any) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to update reaction'
      });
    }
  };

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

    try {
      const result = await followService.toggleFollow(post.author._id);
      setIsFollowing(result.following);

      toast({
        variant: "success",
        title: result.following ? "Following" : "Unfollowed",
        description: result.following
          ? `You are now following ${post.author.name}`
          : `You unfollowed ${post.author.name}`
      });
    } catch (error: any) {
      // Revert on error
      setIsFollowing(previousFollowing);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to update follow status'
      });
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post._id}`;
      await navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        title: "Link Copied",
        description: "Post link copied to clipboard"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link"
      });
    }
  };

  const handleReport = () => {
    toast({
      variant: "default",
      title: "Report Submitted",
      description: "Our team will review this post"
    });
  };

  const displayContent = condensed && post.content.length > 150
    ? post.content.substring(0, 150) + '...'
    : post.content;

  return (
    <article className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <button
              onClick={() => onViewProfile?.(post.author._id)}
              className="flex-shrink-0"
              aria-label={`View ${post.author.name}'s profile`}
            >
              <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                {post.author.avatar ? (
                  <AvatarImage
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                    {profileService.getInitials(post.author.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </button>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onViewProfile?.(post.author._id)}
                  className="font-semibold text-gray-900 hover:text-blue-600 text-sm truncate"
                >
                  {post.author.name}
                </button>

                {post.author.verificationStatus === 'verified' && (
                  <Badge variant="success" size="sm" className="text-xs px-2 py-0.5">
                    ✓
                  </Badge>
                )}

                {post.author.headline && (
                  <span className="text-gray-600 text-xs truncate">
                    {post.author.headline}
                  </span>
                )}

                {!isOwnPost && (
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="ml-auto text-xs px-3 py-1 h-7"
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <PrivacyIcon className="w-3 h-3" />
                  <span>{privacyLabel}</span>
                </div>
                <span>•</span>
                <span>{formattedDate}</span>

                {post.location?.name && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{post.location.name}</span>
                    </div>
                  </>
                )}

                {post.pinned && (
                  <Badge variant="premium" size="sm" className="text-xs">
                    📌 Pinned
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={handleReport}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report Post</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 text-sm whitespace-pre-line">
          {displayContent}
          {condensed && post.content.length > 150 && (
            <button className="text-blue-600 hover:text-blue-700 text-sm ml-1">
              ...see more
            </button>
          )}
        </p>

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((tag: string) => (
              <span
                key={tag}
                className="text-blue-600 hover:text-blue-700 hover:underline text-xs cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media Gallery */}
        {post.media?.length > 0 && (
          <div className="mt-3">
            <PostGallery images={post.media} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>{likeCount} likes</span>
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:text-blue-600"
            >
              {commentCount} comments
            </button>
            <span>{post.stats?.shares || 0} shares</span>
          </div>
          <span>{post.stats?.views || 0} views</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-gray-100">
        <PostActions
          post={post}
          onLike={handleLike}
          onComment={() => setShowComments(!showComments)}
          onShare={handleShare}
          isLiked={isLiked}
          likeCount={likeCount}
          commentCount={commentCount}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3">
          <CommentList
            postId={post._id}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </article>
  );
};