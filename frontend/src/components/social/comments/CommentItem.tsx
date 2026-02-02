/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/comments/CommentItem.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import {
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  CheckCircle,
  Flag,
  Pin,
  Reply,
  Clock,
  RefreshCw,
  Heart,
  ThumbsUp,
  PartyPopper,
  Award,
  Clapperboard,
} from 'lucide-react';
import { commentService, Comment } from '@/services/commentService';
import { likeService, ReactionType } from '@/services/likeService';
import { CommentComposer } from './CommentComposer';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/social/ui/Dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [localComment, setLocalComment] = useState<Comment>(comment);
  const [userHasLiked, setUserHasLiked] = useState(comment.hasLiked || false);
  const [showReactions, setShowReactions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || []);
  const [hasLoadedReplies, setHasLoadedReplies] = useState(false);
  const [isLoadingInteraction, setIsLoadingInteraction] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);
  const { toast } = useToast();

  // Refs to track mounted state and prevent duplicate calls
  const isMounted = useRef(true);
  const hasLoadedInteraction = useRef(false);

  // Memoized permissions and state
  const permissions = useMemo(() => ({
    canEdit: commentService.utils.canUserEditComment(localComment, currentUserId),
    canDelete: commentService.utils.canUserDeleteComment(localComment, currentUserId),
    canReport: !!currentUserId && currentUserId !== localComment.author._id,
    canPin: currentUserId === postId || localComment.author.role === 'admin',
    isAuthor: currentUserId === localComment.author._id,
    canReply: depth < maxDepth && localComment.moderation?.status === 'active',
  }), [localComment, currentUserId, postId, depth, maxDepth]);

  const state = useMemo(() => ({
    isDeleted: localComment.moderation?.status === 'deleted',
    isHidden: localComment.moderation?.status === 'hidden',
    isActive: localComment.moderation?.status === 'active',
    hasReplies: (localReplies.length || localComment.engagement?.replies || 0) > 0,
    replyCount: localReplies.length || localComment.engagement?.replies || 0,
  }), [localComment, localReplies]);

  // Current likes (optimistic + actual)
  const currentLikes = useMemo(() =>
    optimisticLikes ?? localComment.engagement.likes,
    [localComment.engagement.likes, optimisticLikes]);

  // Load user interaction ONCE with proper cleanup
  useEffect(() => {
    isMounted.current = true;

    const loadUserInteraction = async () => {
      // Skip if already loaded, no user, or comment is deleted
      if (hasLoadedInteraction.current || !currentUserId || !localComment._id || state.isDeleted) {
        return;
      }

      try {
        // Use the likeService directly to get user interaction
        const result = await likeService.getUserInteraction(localComment._id, 'Comment');

        if (isMounted.current && result.hasInteraction && result.interaction) {
          // Only set if user has reacted (not disliked)
          if (result.interaction.interactionType === 'reaction') {
            setUserHasLiked(true);
          }
          hasLoadedInteraction.current = true;
        }
      } catch (error) {
        if (isMounted.current) {
          console.error('Failed to load user interaction:', error);
        }
      }
    };

    loadUserInteraction();

    return () => {
      isMounted.current = false;
    };
  }, [localComment._id, currentUserId, state.isDeleted]);

  // Update local comment when prop changes
  useEffect(() => {
    if (JSON.stringify(comment) !== JSON.stringify(localComment)) {
      setLocalComment(comment);
      setEditedContent(comment.content);

      if (comment.replies?.length && !hasLoadedReplies) {
        setLocalReplies(comment.replies);
        setHasLoadedReplies(true);
      }
    }
  }, [comment, localComment, hasLoadedReplies]);

  // Load replies if needed
  useEffect(() => {
    const loadRepliesIfNeeded = async () => {
      if (
        !state.isDeleted &&
        !state.isHidden &&
        localComment._id &&
        state.hasReplies &&
        !hasLoadedReplies &&
        localReplies.length === 0 &&
        !isLoadingReplies
      ) {
        await loadCommentReplies();
      }
    };

    loadRepliesIfNeeded();
  }, [localComment._id, state.hasReplies, hasLoadedReplies, localReplies.length, state.isDeleted, state.isHidden, isLoadingReplies]);

  const loadCommentReplies = useCallback(async () => {
    if (isLoadingReplies || !localComment._id) return;

    setIsLoadingReplies(true);
    try {
      const response = await commentService.getCommentReplies(localComment._id, {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      });

      if (response.data?.length) {
        setLocalReplies(response.data);
        setHasLoadedReplies(true);
      }
    } catch (error) {
      console.error(`Failed to load replies:`, error);
      toast({
        title: 'Error',
        description: 'Failed to load replies',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingReplies(false);
    }
  }, [localComment._id, isLoadingReplies, toast]);

  const handleReaction = useCallback(async (reaction: ReactionType = 'like') => {
    if (isLoadingInteraction || !currentUserId || !localComment._id || state.isDeleted) return;

    setIsLoadingInteraction(true);

    // Store current state for rollback
    const previousHasLiked = userHasLiked;
    const previousLikes = currentLikes;

    // Optimistic update
    if (userHasLiked) {
      // Removing like
      setOptimisticLikes(Math.max(0, currentLikes - 1));
      setUserHasLiked(false);
    } else {
      // Adding like
      setOptimisticLikes(currentLikes + 1);
      setUserHasLiked(true);
    }

    try {
      let result;

      if (previousHasLiked) {
        // Remove reaction using likeService directly
        result = await likeService.removeInteraction(localComment._id, 'Comment');
      } else {
        // Add reaction using likeService directly
        result = await likeService.addReaction(localComment._id, {
          reaction,
          targetType: 'Comment'
        });
      }

      // Update local state with server response
      setLocalComment(prev => ({
        ...prev,
        engagement: {
          ...prev.engagement,
          likes: result.stats.reactions?.total || prev.engagement.likes,
          dislikes: 0 // Remove dislikes
        }
      }));
      setOptimisticLikes(null); // Clear optimistic state

      // Update userHasLiked based on result
      const userInteractionResult = await likeService.getUserInteraction(localComment._id, 'Comment');
      setUserHasLiked(userInteractionResult.hasInteraction &&
        userInteractionResult.interaction?.interactionType === 'reaction');

    } catch (error: any) {
      console.error('Failed to handle reaction:', error);

      // Rollback optimistic update
      setUserHasLiked(previousHasLiked);
      setOptimisticLikes(null);

      toast({
        title: 'Error',
        description: error.message || 'Failed to update reaction',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingInteraction(false);
      setShowReactions(false);
    }
  }, [localComment._id, currentUserId, isLoadingInteraction, userHasLiked, state.isDeleted, toast, currentLikes]);

  const handleLike = useCallback(async () => {
    await handleReaction('like');
  }, [handleReaction]);

  const handleEdit = useCallback(async () => {
    const validation = commentService.utils.validateContent(editedContent);
    if (!validation.isValid) {
      validation.errors.forEach(err => toast({
        title: 'Validation Error',
        description: err,
        variant: 'destructive'
      }));
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
      toast({
        title: 'Success',
        description: 'Comment updated successfully'
      });
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update comment',
        variant: 'destructive'
      });
    }
  }, [localComment._id, editedContent, localComment.content, onCommentUpdated, toast]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      await commentService.deleteComment(localComment._id);
      onCommentDeleted?.(localComment._id);
      toast({
        title: 'Success',
        description: 'Comment deleted successfully'
      });
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive'
      });
    }
  }, [localComment._id, onCommentDeleted, toast]);

  const handleReport = useCallback(async () => {
    if (!confirm('Report this comment as inappropriate?')) return;

    try {
      await commentService.reportComment(localComment._id, 'Inappropriate content');
      toast({
        title: 'Report Submitted',
        description: 'Comment reported. Our team will review it.'
      });
    } catch (error: any) {
      console.error('Failed to report comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to report comment',
        variant: 'destructive'
      });
    }
  }, [localComment._id, toast]);

  const handleReplyAdded = useCallback((newReply: Comment) => {
    setIsReplying(false);
    setLocalReplies(prev => [...prev, newReply]);
    setLocalComment(prev => ({
      ...prev,
      engagement: {
        ...prev.engagement,
        replies: prev.engagement.replies + 1
      }
    }));
    setIsExpanded(true);
    onReplyAdded?.(newReply);
  }, [onReplyAdded]);

  const loadMoreReplies = useCallback(async () => {
    if (isLoadingReplies || !localComment._id) return;

    setIsLoadingReplies(true);
    try {
      const response = await commentService.getCommentReplies(localComment._id, {
        page: Math.ceil(localReplies.length / 20) + 1,
        limit: 20
      });

      if (response.data?.length) {
        setLocalReplies(prev => [...prev, ...response.data]);
        toast({
          title: 'Success',
          description: `Loaded ${response.data.length} more replies`
        });
      } else {
        toast({
          title: 'Info',
          description: 'No more replies to load'
        });
      }
    } catch (error) {
      console.error('Failed to load more replies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more replies',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingReplies(false);
    }
  }, [localComment._id, isLoadingReplies, localReplies.length, toast]);

  const renderContent = useMemo(() => {
    if (state.isDeleted) {
      return (
        <div className="text-gray-400 dark:text-gray-500 italic text-sm">
          This comment has been deleted.
        </div>
      );
    }

    if (state.isHidden) {
      return (
        <div className="text-gray-400 dark:text-gray-500 italic text-sm">
          This comment is hidden.
        </div>
      );
    }

    if (isEditing) {
      return (
        <motion.div
          key={`edit-${localComment._id}`}
          layout
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
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleEdit}
                disabled={editedContent.trim() === localComment.content || !editedContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
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
  }, [state.isDeleted, state.isHidden, isEditing, editedContent, localComment.content, handleEdit, localComment._id]);

  const renderMedia = useMemo(() => {
    if (!localComment.media?.length || state.isDeleted) return null;

    return (
      <div className="mt-3 space-y-2">
        {localComment.media.map((media, index) => (
          <div
            key={`media-${localComment._id}-${index}`}
            className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 max-w-md"
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={`Comment attachment ${index + 1}`}
                className="w-full h-auto max-h-64 object-cover"
                loading="lazy"
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
  }, [localComment.media, state.isDeleted, localComment._id]);

  const renderAuthorBadge = useMemo(() => {
    if (state.isDeleted || state.isHidden) return null;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {localComment.author?.verificationStatus === 'verified' && (
          <Badge variant="success" size="sm" className="px-1.5 py-0.5">
            <CheckCircle size={10} className="mr-1" />
            Verified
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
  }, [localComment.author, localComment.metadata, state.isDeleted, state.isHidden]);

  const renderRepliesSection = useMemo(() => {
    if (!state.hasReplies && localReplies.length === 0) return null;

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50"
            disabled={isLoadingReplies}
            type="button"
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {state.replyCount} {state.replyCount === 1 ? 'reply' : 'replies'}
            {isLoadingReplies && <RefreshCw size={12} className="ml-1 animate-spin" />}
          </button>

          {isExpanded && localReplies.length > 0 && localReplies.length < state.replyCount && (
            <button
              onClick={loadMoreReplies}
              disabled={isLoadingReplies}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
              type="button"
            >
              {isLoadingReplies ? 'Loading...' : `Show ${state.replyCount - localReplies.length} more`}
            </button>
          )}
        </div>

        <AnimatePresence mode="sync">
          {isExpanded && localReplies.length > 0 && (
            <motion.div
              key={`replies-${localComment._id}-${localReplies.length}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {localReplies.map((reply) => (
                <motion.div
                  key={`reply-${reply._id}-${reply.updatedAt}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CommentItem
                    comment={reply}
                    postId={postId}
                    currentUserId={currentUserId}
                    depth={depth + 1}
                    onReplyAdded={handleReplyAdded}
                    onCommentUpdated={onCommentUpdated}
                    onCommentDeleted={onCommentDeleted}
                    maxDepth={maxDepth}
                    className="pt-3"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    state.hasReplies,
    state.replyCount,
    localReplies,
    isExpanded,
    isLoadingReplies,
    loadMoreReplies,
    postId,
    currentUserId,
    depth,
    handleReplyAdded,
    onCommentUpdated,
    onCommentDeleted,
    maxDepth,
    localComment._id
  ]);

  const reactionConfigs = [
    { type: 'like' as ReactionType, emoji: '👍', label: 'Like', icon: <ThumbsUp size={16} /> },
    { type: 'heart' as ReactionType, emoji: '❤️', label: 'Love', icon: <Heart size={16} /> },
    { type: 'celebrate' as ReactionType, emoji: '🎉', label: 'Celebrate', icon: <PartyPopper size={16} /> },
    { type: 'percent_100' as ReactionType, emoji: '💯', label: '100', icon: <Award size={16} /> },
    { type: 'clap' as ReactionType, emoji: '👏', label: 'Clap', icon: <Clapperboard size={16} /> },
  ];

  return (
    <motion.div
      key={`comment-item-${localComment._id}-${localComment.updatedAt}`}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative group",
        depth > 0 && "ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800",
        isHighlighted && "bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 -m-3",
        className
      )}
      id={`comment-${localComment._id}`}
      layoutId={`comment-container-${localComment._id}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          <Avatar className={cn(
            compact ? "h-8 w-8" : "h-10 w-10",
            "ring-1 ring-gray-200 dark:ring-gray-700"
          )}>
            {state.isDeleted ? (
              <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600">
                <Trash2 size={14} />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage
                  src={localComment.author?.avatar}
                  alt={localComment.author?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400">
                  {localComment.author?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </>
            )}
          </Avatar>
        </div>

        {/* Comment Body */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-medium text-sm",
                state.isDeleted ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
              )}>
                {state.isDeleted ? 'Deleted User' : localComment.author?.name || 'Unknown User'}
              </span>

              {renderAuthorBadge}

              <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                <Clock size={10} />
                {commentService.utils.formatCommentDate(localComment.createdAt)}
              </span>

              {localComment.metadata?.edited?.isEdited && !state.isDeleted && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  (edited)
                </span>
              )}
            </div>

            {/* Action Menu */}
            {showActions && !state.isDeleted && (
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
                  {permissions.canEdit && (
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      <Edit size={12} className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}

                  {permissions.canReply && (
                    <DropdownMenuItem
                      onClick={() => setIsReplying(true)}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      <Reply size={12} className="mr-2" />
                      Reply
                    </DropdownMenuItem>
                  )}

                  {(permissions.canEdit || permissions.canDelete) && <DropdownMenuSeparator />}

                  {permissions.canReport && (
                    <DropdownMenuItem
                      onClick={handleReport}
                      className="text-sm text-orange-600 dark:text-orange-400"
                    >
                      <Flag size={12} className="mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}

                  {permissions.canDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      <Trash2 size={12} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {renderContent}

          {/* Media */}
          {renderMedia}

          {/* Actions */}
          {showActions && state.isActive && (
            <div className="flex items-center gap-2 mt-3">
              {/* Like Button */}
              <div className="relative">
                <button
                  onClick={handleLike}
                  disabled={isLoadingInteraction || !currentUserId}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    userHasLiked
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  type="button"
                >
                  <span className="text-sm">👍</span>
                  <span className="font-medium">
                    {currentLikes > 0
                      ? commentService.utils.formatEngagementNumber(currentLikes)
                      : 'Like'
                    }
                  </span>
                </button>

                {/* Reactions Dropdown */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactions(!showReactions);
                  }}
                  disabled={isLoadingInteraction}
                  className="ml-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  aria-label="Choose reaction"
                  type="button"
                >
                  <ChevronDown size={10} />
                </button>

                {/* Reactions Popover */}
                <AnimatePresence mode="wait">
                  {showReactions && (
                    <motion.div
                      key={`reactions-popover-${localComment._id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-1 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {reactionConfigs.map((config) => (
                        <button
                          key={`reaction-btn-${localComment._id}-${config.type}`}
                          onClick={() => handleReaction(config.type)}
                          disabled={isLoadingInteraction}
                          className={cn(
                            "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors",
                            "hover:scale-110 active:scale-95 flex items-center justify-center w-8 h-8",
                            userHasLiked && "ring-1 ring-blue-300"
                          )}
                          title={config.label}
                          aria-label={config.label}
                          type="button"
                        >
                          <span className="text-lg">{config.emoji}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reply Button */}
              {permissions.canReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  disabled={isLoadingInteraction}
                  className="flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs disabled:opacity-50"
                  type="button"
                >
                  <Reply size={12} />
                  <span className="font-medium">Reply</span>
                </button>
              )}
            </div>
          )}

          {/* Reply Composer */}
          <AnimatePresence mode="wait">
            {isReplying && permissions.canReply && (
              <motion.div
                key={`reply-composer-${localComment._id}`}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
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

          {/* Replies Section */}
          {renderRepliesSection}
        </div>
      </div>
    </motion.div>
  );
};