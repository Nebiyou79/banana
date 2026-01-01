// components/social/comments/CommentItem.tsx
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import {
  Heart, MessageCircle, MoreVertical,
  ChevronDown, ChevronUp, Edit, Trash2,
  CheckCircle, Flag, Pin, Reply, Clock,
  RefreshCw
} from 'lucide-react';
import { commentService, Comment } from '@/services/commentService';
import { likeService, ReactionType } from '@/services/likeService';
import { CommentComposer } from './CommentComposer';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/social/ui/Dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  depth?: number;
  onReplyAdded?: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  showReplyInput?: boolean;
  maxDepth?: number;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  isHighlighted?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  currentUserId,
  depth = 0,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
  showReplyInput = false,
  maxDepth = 5,
  className = '',
  compact = false,
  showActions = true,
  isHighlighted = false
}) => {
  const [isReplying, setIsReplying] = useState(showReplyInput);
  const [isEditing, setIsEditing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localComment, setLocalComment] = useState<Comment>(comment);
  const [userReaction, setUserReaction] = useState<{
    reaction: ReactionType;
    reactedAt: string;
  } | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [editedContent, setEditedContent] = useState(localComment.content);
  const [replyCount, setReplyCount] = useState(localComment.engagement?.replies || 0);
  const [localReplies, setLocalReplies] = useState<Comment[]>(localComment.replies || []);
  const [hasLoadedReplies, setHasLoadedReplies] = useState(false);

  const canEdit = commentService.utils.canUserEditComment(localComment, currentUserId);
  const canDelete = commentService.utils.canUserDeleteComment(localComment, currentUserId);
  const canReport = currentUserId && currentUserId !== localComment.author._id;
  const canPin = currentUserId === postId || localComment.author.role === 'admin';
  const isAuthor = currentUserId === localComment.author._id;
  const canReply = depth < maxDepth && localComment.moderation?.status === 'active';
  const hasReplies = replyCount > 0;
  const isDeleted = localComment.moderation?.status === 'deleted';
  const isHidden = localComment.moderation?.status === 'hidden';

  // Load user reaction
  useEffect(() => {
    const loadUserReaction = async () => {
      try {
        if (currentUserId && localComment._id) {
          const reaction = await likeService.getUserReaction(localComment._id, 'Comment');
          if (reaction) {
            setUserReaction({
              reaction: reaction.reaction as ReactionType,
              reactedAt: reaction.reactedAt
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user reaction:', error);
      }
    };
    loadUserReaction();
  }, [localComment._id, currentUserId]);

  // Update local comment when prop changes
  useEffect(() => {
    setLocalComment(comment);
    setEditedContent(comment.content);
    setReplyCount(comment.engagement?.replies || 0);

    // If the comment comes with replies, use them
    if (comment.replies && comment.replies.length > 0) {
      setLocalReplies(comment.replies);
      setHasLoadedReplies(true);
    }
  }, [comment]);

  // Load replies on mount if comment has replies but we haven't loaded them yet
  useEffect(() => {
    const loadReplies = async () => {
      if (
        !isDeleted &&
        !isHidden &&
        localComment._id &&
        replyCount > 0 &&
        !hasLoadedReplies &&
        localReplies.length === 0
      ) {
        console.log(`Loading replies for comment ${localComment._id} (count: ${replyCount})`);
        await loadCommentReplies();
      }
    };

    loadReplies();
  }, [localComment._id, replyCount, hasLoadedReplies, localReplies.length, isDeleted, isHidden]);

  // Function to load replies
  const loadCommentReplies = async () => {
    if (isLoadingReplies || !localComment._id) return;

    setIsLoadingReplies(true);
    try {
      const response = await commentService.getCommentReplies(localComment._id, {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      });

      if (response.data && response.data.length > 0) {
        console.log(`Successfully loaded ${response.data.length} replies for comment ${localComment._id}`);
        setLocalReplies(response.data);
        setHasLoadedReplies(true);
      }
    } catch (error) {
      console.error(`Failed to load replies for comment ${localComment._id}:`, error);
      toast.error('Failed to load replies');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Handle refresh replies
  const handleRefreshReplies = async () => {
    await loadCommentReplies();
  };

  // Handle like toggle
  const handleLikeToggle = async () => {
    if (isLiking || !currentUserId || !localComment._id) return;

    setIsLiking(true);
    try {
      if (userReaction) {
        // Unlike
        await likeService.removeReaction(localComment._id, 'Comment');
        setUserReaction(null);
        setLocalComment(prev => ({
          ...prev,
          engagement: {
            ...prev.engagement,
            likes: Math.max(0, (prev.engagement?.likes || 0) - 1)
          }
        }));
        toast.success('Like removed');
      } else {
        // Like
        const response = await likeService.addReaction(localComment._id, {
          reaction: 'like',
          targetType: 'Comment'
        });
        setUserReaction({
          reaction: 'like',
          reactedAt: new Date().toISOString()
        });
        setLocalComment(prev => ({
          ...prev,
          engagement: {
            ...prev.engagement,
            likes: (response.stats?.total || 0)
          }
        }));
        toast.success('Liked comment');
      }
    } catch (error: any) {
      console.error('Failed to toggle like:', error);
      toast.error(error.message || 'Failed to update reaction');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    const validation = commentService.utils.validateContent(editedContent);
    if (!validation.isValid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    if (editedContent === localComment.content) {
      setIsEditing(false);
      return;
    }

    try {
      const updatedComment = await commentService.updateComment(localComment._id, {
        content: editedContent
      });
      setLocalComment(updatedComment);
      setIsEditing(false);
      onCommentUpdated?.(updatedComment);
      toast.success('Comment updated');
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      toast.error(error.message || 'Failed to update comment');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await commentService.deleteComment(localComment._id);
      onCommentDeleted?.(localComment._id);
      toast.success('Comment deleted');
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast.error(error.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle report
  const handleReport = async () => {
    if (!confirm('Report this comment as inappropriate?')) {
      return;
    }

    try {
      await commentService.reportComment(localComment._id, 'Inappropriate content');
      toast.success('Comment reported. Our team will review it.');
    } catch (error: any) {
      console.error('Failed to report comment:', error);
      toast.error(error.message || 'Failed to report comment');
    }
  };

  // Handle reply added
  const handleReplyAdded = (newReply: Comment) => {
    setIsReplying(false);

    // Add reply to local state
    setLocalReplies(prev => [...prev, newReply]);
    setReplyCount(prev => prev + 1);
    setHasLoadedReplies(true);

    // Update parent comment engagement
    setLocalComment(prev => ({
      ...prev,
      engagement: {
        ...prev.engagement,
        replies: (prev.engagement?.replies || 0) + 1
      }
    }));

    // Notify parent component
    onReplyAdded?.(newReply);

    // Auto-expand replies section
    setIsExpanded(true);

    // Scroll to new reply after a short delay
    setTimeout(() => {
      const element = document.getElementById(`comment-${newReply._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Load more replies
  const loadMoreReplies = async () => {
    if (isLoadingReplies || !localComment._id) return;

    setIsLoadingReplies(true);
    try {
      const response = await commentService.getCommentReplies(localComment._id, {
        page: Math.ceil(localReplies.length / 20) + 1,
        limit: 20
      });

      if (response.data && response.data.length > 0) {
        setLocalReplies(prev => [...prev, ...response.data]);
        toast.success(`Loaded ${response.data.length} more replies`);
      } else {
        toast.info('No more replies to load');
      }
    } catch (error) {
      console.error('Failed to load more replies:', error);
      toast.error('Failed to load more replies');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return commentService.utils.formatCommentDate(dateString);
  };

  // Format engagement number
  const formatEngagement = (num: number) => {
    return commentService.utils.formatEngagementNumber(num);
  };

  // Render content
  const renderContent = () => {
    if (isDeleted) {
      return (
        <div className="text-gray-400 dark:text-gray-500 italic text-sm">
          This comment has been deleted.
        </div>
      );
    }

    if (isHidden) {
      return (
        <div className="text-gray-400 dark:text-gray-500 italic text-sm">
          This comment is hidden.
        </div>
      );
    }

    if (isEditing) {
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={3}
            autoFocus
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {editedContent.length}/2000 characters
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(localComment.content);
                }}
                className="px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleEdit}
                disabled={editedContent.trim() === localComment.content || !editedContent.trim()}
                className="px-4 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                Save changes
              </Button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {localComment.content}
      </div>
    );
  };

  // Render media
  const renderMedia = () => {
    if (!localComment.media || localComment.media.length === 0 || isDeleted) return null;

    return (
      <div className="mt-3 space-y-2">
        {localComment.media.map((media, index) => (
          <div
            key={index}
            className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 max-w-md"
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={`Comment attachment ${index + 1}`}
                className="w-full h-auto max-h-64 object-cover"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            ) : media.type === 'video' ? (
              <video
                src={media.url}
                className="w-full h-auto max-h-64 object-cover"
                controls
                preload="metadata"
                playsInline
              >
                <source src={media.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  // Render author badge
  const renderAuthorBadge = () => {
    if (isDeleted || isHidden) return null;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {localComment.author?.verificationStatus === 'verified' && (
          <Badge variant="success" size="sm" className="px-1.5 py-0.5">
            <CheckCircle size={10} className="mr-1" />
            Verified
          </Badge>
        )}

        {localComment.author?.role === 'admin' && (
          <Badge variant="destructive" size="sm" className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700">
            Admin
          </Badge>
        )}

        {localComment.author?.role === 'moderator' && (
          <Badge variant="secondary" size="sm" className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
            Moderator
          </Badge>
        )}

        {localComment.metadata?.isPinned && (
          <Badge variant="outline" size="sm" className="px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700">
            <Pin size={10} className="mr-1" />
            Pinned
          </Badge>
        )}
      </div>
    );
  };

  // Render replies section
  const renderRepliesSection = () => {
    const actualReplyCount = localReplies.length || replyCount;
    const showRepliesSection = hasReplies || localReplies.length > 0;

    if (!showRepliesSection) return null;

    return (
      <div className="mt-4">
        {/* Replies Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            type="button"
            disabled={isLoadingReplies}
          >
            {isExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            {actualReplyCount} {actualReplyCount === 1 ? 'reply' : 'replies'}
            {isLoadingReplies && (
              <span className="ml-1 animate-spin">
                <RefreshCw size={12} />
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            {!isExpanded && actualReplyCount > 0 && (
              <button
                onClick={handleRefreshReplies}
                disabled={isLoadingReplies}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1"
                type="button"
              >
                <RefreshCw size={10} className={isLoadingReplies ? 'animate-spin' : ''} />
                Refresh
              </button>
            )}

            {/* Show more button */}
            {isExpanded && localReplies.length > 0 && localReplies.length < actualReplyCount && (
              <button
                onClick={loadMoreReplies}
                disabled={isLoadingReplies}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                type="button"
              >
                {isLoadingReplies ? 'Loading...' : `Show ${actualReplyCount - localReplies.length} more`}
              </button>
            )}
          </div>
        </div>

        {/* Load replies button (when not expanded but has replies) */}
        {!isExpanded && actualReplyCount > 0 && localReplies.length === 0 && !hasLoadedReplies && (
          <div className="mb-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCommentReplies}
              loading={isLoadingReplies}
              disabled={isLoadingReplies}
              className="text-xs"
            >
              <MessageCircle size={12} className="mr-1.5" />
              Load replies ({actualReplyCount})
            </Button>
          </div>
        )}

        {/* Nested replies */}
        <AnimatePresence>
          {isExpanded && localReplies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {localReplies.map((reply, index) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  onReplyAdded={handleReplyAdded}
                  onCommentUpdated={onCommentUpdated}
                  onCommentDeleted={onCommentDeleted}
                  maxDepth={maxDepth}
                  className={`pt-3 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
                />
              ))}
            </motion.div>
          )}

          {/* No replies loaded yet message */}
          {isExpanded && actualReplyCount > 0 && localReplies.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm"
            >
              <p>No replies loaded yet.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCommentReplies}
                loading={isLoadingReplies}
                className="mt-2 text-gray-600 dark:text-gray-400"
              >
                Load replies
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800' : ''} ${isHighlighted ? 'bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 -m-3' : ''
        } ${className}`}
      id={`comment-${localComment._id}`}
    >
      <div className="group rounded-lg transition-colors">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className={`${compact ? "h-8 w-8" : "h-10 w-10"} ring-1 ring-gray-200 dark:ring-gray-700`}>
              {!isDeleted ? (
                <>
                  <AvatarImage
                    src={localComment.author?.avatar}
                    alt={localComment.author?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 font-medium">
                    {localComment.author?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600">
                  <Trash2 size={14} />
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          {/* Comment Body */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium ${isDeleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
                  } text-sm`}>
                  {isDeleted ? 'Deleted User' : localComment.author?.name || 'Unknown User'}
                </span>

                {renderAuthorBadge()}

                <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                  <Clock size={10} />
                  {formatTime(localComment.createdAt)}
                </span>

                {localComment.metadata?.edited?.isEdited && !isDeleted && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                    (edited)
                  </span>
                )}
              </div>

              {/* Action Menu */}
              {!isDeleted && showActions && (canEdit || canDelete || canReport || canPin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        <Edit size={12} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}

                    {canReply && (
                      <DropdownMenuItem
                        onClick={() => setIsReplying(true)}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        <Reply size={12} className="mr-2" />
                        Reply
                      </DropdownMenuItem>
                    )}

                    {(canEdit || canDelete || canPin) && <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />}

                    {canReport && (
                      <DropdownMenuItem
                        onClick={handleReport}
                        className="text-sm text-orange-600 dark:text-orange-400"
                      >
                        <Flag size={12} className="mr-2" />
                        Report
                      </DropdownMenuItem>
                    )}

                    {canDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-sm text-red-600 dark:text-red-400"
                        disabled={isDeleting}
                      >
                        <Trash2 size={12} className="mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    )}

                    {/* Debug option */}
                    {process.env.NODE_ENV === 'development' && (
                      <>
                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => console.log('Comment debug:', {
                            id: localComment._id,
                            replyCount,
                            localReplies: localReplies.length,
                            hasLoadedReplies
                          })}
                          className="text-sm text-gray-500 dark:text-gray-400"
                        >
                          Debug Info
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            {renderContent()}

            {/* Media */}
            {renderMedia()}

            {/* Actions */}
            {!isDeleted && !isHidden && showActions && (
              <div className="flex items-center gap-4 mt-3">
                {/* Like Button */}
                <div className="relative">
                  <button
                    onClick={handleLikeToggle}
                    disabled={isLiking || !currentUserId}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${userReaction
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    type="button"
                  >
                    <Heart
                      size={14}
                      className={userReaction ? 'fill-current' : ''}
                    />
                    <span className="font-medium">
                      {localComment.engagement?.likes > 0
                        ? formatEngagement(localComment.engagement.likes)
                        : 'Like'
                      }
                    </span>
                  </button>
                </div>

                {/* Reply Button */}
                {canReply && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm border border-transparent"
                    type="button"
                  >
                    <MessageCircle size={14} />
                    <span className="font-medium">Reply</span>
                  </button>
                )}
              </div>
            )}

            {/* Reply composer */}
            <AnimatePresence>
              {isReplying && canReply && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <CommentComposer
                    postId={postId}
                    parentCommentId={localComment._id}
                    onAdded={handleReplyAdded}
                    placeholder="Write your reply..."
                    compact={true}
                    submitLabel="Reply"
                    onCancel={() => setIsReplying(false)}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Replies Section */}
        {renderRepliesSection()}
      </div>
    </motion.div>
  );
};