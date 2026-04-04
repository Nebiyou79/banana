/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/comments/CommentList.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { commentService, Comment } from '@/services/commentService';
import { Button } from '../ui/Button';
import { Loader2, MessageSquare, ChevronDown, AlertCircle, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CommentListProps {
  postId: string;
  currentUserId?: string;
  initialComments?: Comment[];
  showHeader?: boolean;
  autoLoad?: boolean;
  limit?: number;
  sortBy?: 'createdAt' | 'engagement.likes' | 'trending';
  sortOrder?: 'asc' | 'desc';
  maxDepth?: number;
  onCommentCountChange?: (count: number) => void;
  className?: string;
  showComposer?: boolean;
  showTabs?: boolean;
  highlightNewComments?: boolean;
  compact?: boolean;
}

export const CommentList: React.FC<CommentListProps> = ({
  postId,
  currentUserId,
  initialComments = [],
  showHeader = true,
  autoLoad = true,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  maxDepth = 5,
  onCommentCountChange,
  className = '',
  showComposer = true,
  showTabs = false,
  highlightNewComments = true,
  compact = false
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [sortConfig, setSortConfig] = useState({ sortBy, sortOrder });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [pinnedComments, setPinnedComments] = useState<Comment[]>([]);
  const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const loadAttempts = useRef(0);
  const MAX_LOAD_ATTEMPTS = 3;

  // FIX: Stable skeleton IDs
  const skeletonIds = useMemo(() =>
    ['skeleton-1', 'skeleton-2', 'skeleton-3'],
    []);

  // FIX: Simplified loadComments without complex dependencies
  const loadComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    // Safety check to prevent infinite loops
    if (isLoading || isLoadingMore || !postId || loadAttempts.current >= MAX_LOAD_ATTEMPTS || !isMounted.current) {
      return;
    }

    loadAttempts.current++;

    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const response = await commentService.getComments(postId, {
        page: pageNum,
        limit,
        sortBy: sortConfig.sortBy === 'trending' ? 'engagement.likes' : sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
        includeReplies: true,
        depth: 2
      });

      if (response.data && Array.isArray(response.data) && isMounted.current) {
        // Separate pinned comments
        const pinned = response.data.filter(comment => comment.metadata?.isPinned);
        const regular = response.data.filter(comment => !comment.metadata?.isPinned);

        if (append) {
          setComments(prev => {
            const newComments = [...prev, ...regular];
            const uniqueComments = Array.from(
              new Map(newComments.map(comment => [`comment-${comment._id}`, comment])).values()
            );
            return commentService.utils.sortComments(
              uniqueComments,
              sortConfig.sortBy === 'trending' ? 'engagement.likes' : sortConfig.sortBy,
              sortConfig.sortOrder
            );
          });
        } else {
          const sorted = commentService.utils.sortComments(
            regular,
            sortConfig.sortBy === 'trending' ? 'engagement.likes' : sortConfig.sortBy,
            sortConfig.sortOrder
          );
          setComments(sorted);
        }

        setPinnedComments(pinned);
        setTotalComments(response.pagination?.total || response.data.length);
        setHasMore(!!response.pagination?.hasNext);
        setPage(pageNum);
        setError(null);

        // Highlight new comments
        if (highlightNewComments && pageNum === 1) {
          const newIds = new Set(response.data.map(comment => comment._id));
          setNewCommentIds(newIds);

          setTimeout(() => {
            if (isMounted.current) {
              setNewCommentIds(new Set());
            }
          }, 3000);
        }

        onCommentCountChange?.(response.pagination?.total || response.data.length);
      }
    } catch (error: any) {
      console.error('Failed to load comments:', error);

      let errorMessage = 'Failed to load comments. Please try again.';

      if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment.';
      } else if (error.message?.includes('Comments are disabled')) {
        errorMessage = 'Comments are disabled for this post.';
      } else if (error.message?.includes('Post not found')) {
        errorMessage = 'Post not found.';
      }

      if (isMounted.current) {
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [postId, limit, sortConfig, highlightNewComments, onCommentCountChange, toast]);

  // FIX: Initial load - simplified
  useEffect(() => {
    isMounted.current = true;
    loadAttempts.current = 0;

    if (autoLoad && postId) {
      // Use requestAnimationFrame to avoid React 18 double mount
      const timer = requestAnimationFrame(() => {
        loadComments(1, false);
      });
      return () => cancelAnimationFrame(timer);
    }

    return () => {
      isMounted.current = false;
    };
  }, [postId, autoLoad]); // Remove loadComments from dependencies

  // FIX: Sort config changes - simplified
  useEffect(() => {
    if (autoLoad && postId && isMounted.current) {
      const timer = setTimeout(() => {
        loadComments(1, false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [sortConfig]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore && isMounted.current) {
      loadComments(page + 1, true);
    }
  }, [hasMore, isLoading, isLoadingMore, page]);

  const handleRetry = useCallback(() => {
    if (isMounted.current) {
      loadAttempts.current = 0;
      setError(null);
      loadComments(1, false);
    }
  }, []);

  const handleCommentAdded = useCallback((newComment: Comment) => {
    if (!isMounted.current) return;

    if (newComment.parentType === 'Comment' && newComment.parentId) {
      // Update parent comment's replies
      setComments(prev => {
        const updateReplies = (commentList: Comment[]): Comment[] => {
          return commentList.map(comment => {
            if (comment._id === newComment.parentId) {
              const updatedReplies = comment.replies ? [...comment.replies, newComment] : [newComment];
              return {
                ...comment,
                engagement: {
                  ...comment.engagement,
                  replies: comment.engagement.replies + 1
                },
                replies: updatedReplies
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: updateReplies(comment.replies)
              };
            }
            return comment;
          });
        };
        return updateReplies(prev);
      });
    } else {
      // Add new top-level comment
      setComments(prev => commentService.utils.sortComments(
        [newComment, ...prev],
        sortConfig.sortBy === 'trending' ? 'engagement.likes' : sortConfig.sortBy,
        sortConfig.sortOrder
      ));
    }

    setTotalComments(prev => prev + 1);
    onCommentCountChange?.(totalComments + 1);

    if (highlightNewComments) {
      setNewCommentIds(prev => new Set([...prev, newComment._id]));
      setTimeout(() => {
        if (isMounted.current) {
          setNewCommentIds(prev => {
            const next = new Set(prev);
            next.delete(newComment._id);
            return next;
          });
        }
      }, 3000);
    }

    // Scroll to new comment
    setTimeout(() => {
      if (isMounted.current) {
        const element = document.getElementById(`comment-${newComment._id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [sortConfig, totalComments, onCommentCountChange, highlightNewComments]);

  const handleCommentUpdated = useCallback((updatedComment: Comment) => {
    if (!isMounted.current) return;

    setComments(prev => {
      const updateComment = (commentList: Comment[]): Comment[] => {
        return commentList.map(comment => {
          if (comment._id === updatedComment._id) {
            return updatedComment;
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateComment(comment.replies)
            };
          }
          return comment;
        });
      };
      return updateComment(prev);
    });

    toast({
      title: 'Success',
      description: 'Comment updated successfully',
    });
  }, [toast]);

  const handleCommentDeleted = useCallback((commentId: string) => {
    if (!isMounted.current) return;

    setComments(prev => {
      const removeComment = (commentList: Comment[]): Comment[] => {
        return commentList
          .filter(comment => comment._id !== commentId)
          .map(comment => {
            if (comment.replies) {
              return {
                ...comment,
                replies: removeComment(comment.replies)
              };
            }
            return comment;
          });
      };
      return removeComment(prev);
    });

    setTotalComments(prev => prev - 1);
    onCommentCountChange?.(totalComments - 1);

    toast({
      title: 'Success',
      description: 'Comment deleted successfully',
    });
  }, [totalComments, onCommentCountChange, toast]);

  const handleSortChange = useCallback((newSortBy: 'createdAt' | 'engagement.likes' | 'trending') => {
    if (isLoading) return;
    
    setSortConfig(prev => {
      if (prev.sortBy === newSortBy && prev.sortOrder === 'desc') return prev;
      return {
        sortBy: newSortBy,
        sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
      };
    });
  }, [isLoading]);

  const getSortLabel = useCallback((type: 'createdAt' | 'engagement.likes' | 'trending') => {
    const labels = {
      'engagement.likes': 'Most liked',
      'trending': 'Trending',
      'createdAt': sortConfig.sortOrder === 'desc' ? 'Newest' : 'Oldest'
    };
    return labels[type];
  }, [sortConfig.sortOrder]);

  const getSortIcon = useCallback((type: 'createdAt' | 'engagement.likes' | 'trending') => {
    const icons = {
      'engagement.likes': <TrendingUp size={12} />,
      'trending': <Sparkles size={12} />,
      'createdAt': <Clock size={12} />
    };
    return icons[type];
  }, []);

  const getFilteredComments = useMemo(() => {
    if (activeTab === 'pinned' && pinnedComments.length > 0) {
      return pinnedComments;
    }
    return comments;
  }, [activeTab, pinnedComments, comments]);

  const hasComments = getFilteredComments.length > 0;
  const showPinnedSection = pinnedComments.length > 0 && activeTab === 'all';

  const renderSkeleton = useCallback(() => (
    <div className="space-y-4 animate-pulse">
      {skeletonIds.map((id) => (
        <div key={id} className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex gap-4 pt-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ), [skeletonIds]);

  const renderErrorState = useCallback(() => (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Unable to load comments
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
      <Button
        onClick={handleRetry}
        variant="secondary"
        className="gap-2"
      >
        <Loader2 className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  ), [error, handleRetry]);

  const renderEmptyState = useCallback(() => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
        <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No comments yet
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
        Be the first to start the conversation. Share your thoughts and engage with others.
      </p>
      {showComposer && (
        <div className="mt-6 max-w-md mx-auto">
          <CommentComposer
            postId={postId}
            onAdded={handleCommentAdded}
            placeholder="Start the conversation..."
            autoFocus={false}
            compact={compact}
          />
        </div>
      )}
    </div>
  ), [postId, handleCommentAdded, showComposer, compact]);

  const renderSortButtons = useCallback(() => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        {(['createdAt', 'engagement.likes', 'trending'] as const).map((type) => (
          <button
            key={`sort-${type}`}
            onClick={() => handleSortChange(type)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
              sortConfig.sortBy === type
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            )}
          >
            {getSortIcon(type)}
            {getSortLabel(type)}
          </button>
        ))}
      </div>
    </div>
  ), [sortConfig.sortBy, handleSortChange, getSortIcon, getSortLabel]);

  const renderTabs = useCallback(() => (
    <div className="mb-6">
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-4 py-2 text-sm font-medium relative",
            activeTab === 'all'
              ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          All Comments
          <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
            {totalComments}
          </span>
        </button>
        {pinnedComments.length > 0 && (
          <button
            onClick={() => setActiveTab('pinned')}
            className={cn(
              "px-4 py-2 text-sm font-medium flex items-center relative",
              activeTab === 'pinned'
                ? "text-yellow-600 dark:text-yellow-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Sparkles size={12} className="mr-1.5" />
            Pinned
            <span className="ml-1.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
              {pinnedComments.length}
            </span>
          </button>
        )}
      </div>
    </div>
  ), [activeTab, totalComments, pinnedComments.length]);

  // FIX: Fixed AnimatePresence mode from "sync" to "popLayout"
  const renderCommentsList = useMemo(() => {
    if (isLoading) return renderSkeleton();
    if (error) return renderErrorState();
    if (!hasComments) return renderEmptyState();

    return (
      <AnimatePresence mode="popLayout">
        {getFilteredComments.map((comment, index) => (
          <motion.div
            key={`comment-${comment._id}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
              layout: { duration: 0.2 }
            }}
            layoutId={`comment-${comment._id}`}
          >
            <CommentItem
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onReplyAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              maxDepth={maxDepth}
              compact={compact}
              className={cn(
                "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4",
                "shadow-sm hover:shadow-md transition-shadow duration-200",
                !compact && "hover:border-gray-300 dark:hover:border-gray-600",
                newCommentIds.has(comment._id) && "ring-2 ring-blue-500 dark:ring-blue-400 ring-opacity-50"
              )}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    );
  }, [
    isLoading,
    error,
    hasComments,
    getFilteredComments,
    postId,
    currentUserId,
    handleCommentAdded,
    handleCommentUpdated,
    handleCommentDeleted,
    maxDepth,
    compact,
    newCommentIds,
    renderSkeleton,
    renderErrorState,
    renderEmptyState
  ]);

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {/* Header */}
      {showHeader && (
        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4",
          !compact && "pb-4 border-b border-gray-200 dark:border-gray-700"
        )}>
          <div className="flex items-center gap-3">
            <h2 className={cn(
              "font-bold text-gray-900 dark:text-white",
              compact ? "text-lg" : "text-xl"
            )}>
              Comments
            </h2>
            {totalComments > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium">
                {totalComments}
              </span>
            )}
          </div>
          {totalComments > 0 && renderSortButtons()}
        </div>
      )}

      {/* Tabs */}
      {showTabs && pinnedComments.length > 0 && renderTabs()}

      {/* Comment Composer */}
      {showComposer && !compact && (
        <motion.div
          key="comment-composer"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <CommentComposer
              postId={postId}
              onAdded={handleCommentAdded}
              autoFocus={false}
              placeholder="Share your thoughts..."
              compact={compact}
            />
          </div>
        </motion.div>
      )}

      {/* Pinned Comments Section */}
      {showPinnedSection && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Pinned Comments
            </h3>
          </div>
          <div className="space-y-4">
            {pinnedComments.map((comment) => (
              <motion.div
                key={`pinned-comment-${comment._id}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <CommentItem
                  comment={comment}
                  postId={postId}
                  currentUserId={currentUserId}
                  onReplyAdded={handleCommentAdded}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                  maxDepth={maxDepth}
                  compact={compact}
                  className={cn(
                    "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-4",
                    newCommentIds.has(comment._id) && "ring-2 ring-blue-500 dark:ring-blue-400 ring-opacity-50"
                  )}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {renderCommentsList}

        {/* Load More Button */}
        {hasMore && activeTab === 'all' && !isLoading && !error && (
          <div className="text-center pt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              loading={isLoadingMore}
              disabled={isLoadingMore}
              className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Load more
                </>
              )}
            </Button>
          </div>
        )}

        {/* End of Comments */}
        {!hasMore && hasComments && activeTab === 'all' && (
          <div className="text-center py-6 border-t border-gray-100 dark:border-gray-800 mt-4">
            <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
              <MessageSquare size={16} />
              <span>All comments loaded</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
              Showing {getFilteredComments.length} of {totalComments} comments
            </p>
          </div>
        )}
      </div>

      {/* Compact Composer */}
      {showComposer && compact && !isLoading && !error && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <CommentComposer
            postId={postId}
            onAdded={handleCommentAdded}
            placeholder="Add a comment..."
            compact={true}
            submitLabel="Post"
          />
        </div>
      )}
    </div>
  );
};