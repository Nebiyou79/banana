// components/social/comments/CommentList.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/social/ui/Card';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { commentService, Comment } from '@/services/commentService';
import { Button } from '../ui/Button';
import { Loader2, MessageSquare, Filter, ChevronDown, AlertCircle, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../../ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { motion, AnimatePresence } from 'framer-motion';

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
    highlightNewComments = true
}) => {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalComments, setTotalComments] = useState(0);
    const [sortConfig, setSortConfig] = useState({ sortBy, sortOrder });
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [activeTab, setActiveTab] = useState('all');
    const [pinnedComments, setPinnedComments] = useState<Comment[]>([]);
    const [newCommentIds, setNewCommentIds] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    const loadComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        if (isLoading || isLoadingMore) return;

        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        setError(null);

        try {
            console.log(`Loading comments page ${pageNum} for post ${postId}`);

            const response = await commentService.getComments(postId, {
                page: pageNum,
                limit,
                sortBy: sortConfig.sortBy === 'trending' ? 'engagement.likes' : sortConfig.sortBy,
                sortOrder: sortConfig.sortOrder,
                includeReplies: true, // FIXED: Always include replies
                depth: 2 // FIXED: Include up to 2 levels of replies
            });

            console.log('Comments response:', {
                dataCount: response.data?.length,
                hasPagination: !!response.pagination,
                totalComments: response.pagination?.total
            });

            if (response.data && Array.isArray(response.data)) {
                // Debug: Log reply structure
                response.data.forEach((comment, index) => {
                    console.log(`Comment ${index + 1}:`, {
                        id: comment._id,
                        content: comment.content?.substring(0, 50) + '...',
                        repliesCount: comment.engagement?.replies,
                        actualReplies: comment.replies?.length,
                        hasReplies: comment.replies && comment.replies.length > 0
                    });
                });

                // Separate pinned comments
                const pinned = response.data.filter(comment => comment.metadata?.isPinned);
                const regular = response.data.filter(comment => !comment.metadata?.isPinned);

                // Build comment tree - but ensure replies are already included
                const commentTree = response.data; // Already includes replies from backend

                setComments(prev => {
                    const newComments = append ? [...prev, ...commentTree] : commentTree;
                    // Remove duplicates
                    const uniqueComments = Array.from(
                        new Map(newComments.map(comment => [comment._id, comment])).values()
                    );
                    return uniqueComments;
                });

                setPinnedComments(pinned);
                setTotalComments(response.pagination?.total || 0);
                setHasMore(pageNum < (response.pagination?.pages || 1));
                setPage(pageNum);
                setRetryCount(0);

                // Highlight new comments
                if (highlightNewComments && pageNum === 1) {
                    const newIds = new Set(response.data.map(comment => comment._id));
                    setNewCommentIds(newIds);

                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        setNewCommentIds(new Set());
                    }, 3000);
                }

                if (pageNum === 1 && response.data.length > 0) {
                    console.log(`Successfully loaded ${response.data.length} comments with replies`);
                }

                onCommentCountChange?.(response.pagination?.total || 0);
            } else {
                console.warn('Invalid response format:', response);
                setComments([]);
                setPinnedComments([]);
                setTotalComments(0);
            }
        } catch (error: any) {
            console.error('Failed to load comments:', error);

            if (error.message?.includes('429') || error.response?.status === 429) {
                if (retryCount < 3) {
                    setRetryCount(prev => prev + 1);
                    const delay = Math.pow(2, retryCount) * 1000;

                    toast.warning(`Too many requests. Retrying in ${delay / 1000}s...`, {
                        duration: delay
                    });

                    setTimeout(() => {
                        loadComments(pageNum, append);
                    }, delay);
                    return;
                } else {
                    setError('Too many requests. Please wait a moment.');
                    toast.error('Too many requests. Please wait.');
                }
            } else if (error.message?.includes('Comments are disabled')) {
                setError('Comments are disabled for this post.');
                toast.error('Comments are disabled for this post.');
            } else if (error.message?.includes('Post not found')) {
                setError('Post not found.');
                toast.error('Post not found.');
            } else {
                setError('Failed to load comments. Please try again.');
                toast.error('Failed to load comments');
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [postId, limit, sortConfig.sortBy, sortConfig.sortOrder, isLoading, isLoadingMore, onCommentCountChange, retryCount, highlightNewComments]);
    // Initial load
    useEffect(() => {
        if (autoLoad) {
            const timer = setTimeout(() => {
                loadComments(1, false);
            }, 300); // Small delay for better UX
            return () => clearTimeout(timer);
        }
    }, [autoLoad]);

    // Reload when sort config changes
    useEffect(() => {
        if (autoLoad) {
            loadComments(1, false);
        }
    }, [sortConfig, autoLoad]);

    // Handle load more
    const handleLoadMore = () => {
        loadComments(page + 1, true);
    };

    // Handle retry
    const handleRetry = () => {
        setRetryCount(0);
        setError(null);
        loadComments(1, false);
    };

    // Handle comment added
    const handleCommentAdded = (newComment: Comment) => {
        // If it's a reply, find the parent and update its replies
        if (newComment.parentType === 'Comment' && newComment.parentId) {
            const updateRepliesInTree = (commentList: Comment[]): Comment[] => {
                return commentList.map(comment => {
                    if (comment._id === newComment.parentId) {
                        const updatedReplies = comment.replies ? [...comment.replies, newComment] : [newComment];
                        return {
                            ...comment,
                            engagement: {
                                ...comment.engagement,
                                replies: (comment.engagement?.replies || 0) + 1
                            },
                            replies: updatedReplies
                        };
                    }
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: updateRepliesInTree(comment.replies)
                        };
                    }
                    return comment;
                });
            };

            setComments(prev => updateRepliesInTree(prev));
        } else {
            // It's a top-level comment
            const updatedComments = commentService.utils.buildCommentTree([
                newComment,
                ...comments
            ]);
            setComments(updatedComments);
        }

        setTotalComments(prev => prev + 1);

        // Highlight new comment
        if (highlightNewComments) {
            setNewCommentIds(prev => new Set([...prev, newComment._id]));
            setTimeout(() => {
                setNewCommentIds(prev => {
                    const next = new Set(prev);
                    next.delete(newComment._id);
                    return next;
                });
            }, 3000);
        }

        onCommentCountChange?.(totalComments + 1);

        // Scroll to new comment
        setTimeout(() => {
            const element = document.getElementById(`comment-${newComment._id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    // Handle comment updated
    const handleCommentUpdated = (updatedComment: Comment) => {
        const updateCommentInTree = (commentList: Comment[]): Comment[] => {
            return commentList.map(comment => {
                if (comment._id === updatedComment._id) {
                    return updatedComment;
                }
                if (comment.replies) {
                    return {
                        ...comment,
                        replies: updateCommentInTree(comment.replies)
                    };
                }
                return comment;
            });
        };

        setComments(prev => updateCommentInTree(prev));

        toast.success('Comment updated');
    };

    // Handle comment deleted
    const handleCommentDeleted = (commentId: string) => {
        const removeCommentFromTree = (commentList: Comment[]): Comment[] => {
            return commentList
                .filter(comment => comment._id !== commentId)
                .map(comment => {
                    if (comment.replies) {
                        return {
                            ...comment,
                            replies: removeCommentFromTree(comment.replies)
                        };
                    }
                    return comment;
                });
        };

        setComments(prev => removeCommentFromTree(prev));
        setTotalComments(prev => prev - 1);
        onCommentCountChange?.(totalComments - 1);

        toast.success('Comment deleted');
    };

    // Handle sort change
    const handleSortChange = (newSortBy: 'createdAt' | 'engagement.likes' | 'trending') => {
        setSortConfig(prev => {
            if (prev.sortBy === newSortBy) {
                return {
                    sortBy: newSortBy,
                    sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'
                };
            }
            return {
                sortBy: newSortBy,
                sortOrder: 'desc'
            };
        });
    };

    // Get sort label
    const getSortLabel = (type: 'createdAt' | 'engagement.likes' | 'trending') => {
        switch (type) {
            case 'engagement.likes':
                return 'Most liked';
            case 'trending':
                return 'Trending';
            case 'createdAt':
            default:
                return sortConfig.sortOrder === 'desc' ? 'Newest' : 'Oldest';
        }
    };

    // Get icon for sort type
    const getSortIcon = (type: 'createdAt' | 'engagement.likes' | 'trending') => {
        switch (type) {
            case 'engagement.likes':
                return <TrendingUp size={12} />;
            case 'trending':
                return <Sparkles size={12} />;
            case 'createdAt':
            default:
                return <Clock size={12} />;
        }
    };

    // Render skeleton loader
    const renderSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="flex gap-4">
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Render error state
    const renderErrorState = () => (
        <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to load comments</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="secondary" className="gap-2">
                <Loader2 className="h-4 w-4" />
                Try Again
            </Button>
        </div>
    );

    // Render empty state
    const renderEmptyState = () => (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No comments yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                Be the first to start the conversation. Share your thoughts and engage with others.
            </p>
        </div>
    );

    // Render sort buttons
    const renderSortButtons = () => (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                {(['createdAt', 'engagement.likes', 'trending'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => handleSortChange(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${sortConfig.sortBy === type
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                    >
                        {getSortIcon(type)}
                        {getSortLabel(type)}
                    </button>
                ))}
            </div>
        </div>
    );

    // Get filtered comments based on active tab
    const getFilteredComments = () => {
        if (activeTab === 'pinned' && pinnedComments.length > 0) {
            return pinnedComments;
        }
        return comments;
    };

    return (
        <div className={className} ref={containerRef}>
            {/* Header */}
            {showHeader && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comments</h2>
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
            {showTabs && pinnedComments.length > 0 && (
                <div className="mb-6">
                    <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'all'
                                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            All Comments
                            <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                                {totalComments}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pinned')}
                            className={`px-4 py-2 text-sm font-medium flex items-center ${activeTab === 'pinned'
                                ? 'border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Sparkles size={12} className="mr-1.5" />
                            Pinned
                            <span className="ml-1.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
                                {pinnedComments.length}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Comment Composer */}
            {showComposer && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                        <CommentComposer
                            postId={postId}
                            onAdded={handleCommentAdded}
                            autoFocus={false}
                            placeholder="Share your thoughts..."
                        />
                    </div>
                </motion.div>
            )}

            {/* Pinned Comments Section */}
            {pinnedComments.length > 0 && activeTab === 'all' && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pinned Comments</h3>
                    </div>
                    <div className="space-y-4">
                        {pinnedComments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                postId={postId}
                                currentUserId={currentUserId}
                                onReplyAdded={handleCommentAdded}
                                onCommentUpdated={handleCommentUpdated}
                                onCommentDeleted={handleCommentDeleted}
                                maxDepth={maxDepth}
                                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl p-4"
                                isHighlighted={newCommentIds.has(comment._id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {/* Loading State */}
                {isLoading && renderSkeleton()}

                {/* Error State */}
                {error && !isLoading && renderErrorState()}

                {/* Empty State */}
                {!isLoading && !error && getFilteredComments().length === 0 && renderEmptyState()}

                {/* Comments */}
                {!isLoading && !error && getFilteredComments().length > 0 && (
                    <AnimatePresence>
                        <div className="space-y-4">
                            {getFilteredComments().map((comment, index) => (
                                <motion.div
                                    key={comment._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    id={`comment-${comment._id}`}
                                >
                                    <CommentItem
                                        comment={comment}
                                        postId={postId}
                                        currentUserId={currentUserId}
                                        onReplyAdded={handleCommentAdded}
                                        onCommentUpdated={handleCommentUpdated}
                                        onCommentDeleted={handleCommentDeleted}
                                        maxDepth={maxDepth}
                                        className={`
                                            bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 
                                            shadow-sm hover:shadow-md transition-shadow
                                            ${index > 0 ? 'mt-4' : ''}
                                            ${newCommentIds.has(comment._id) ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-opacity-50' : ''}
                                        `}
                                        isHighlighted={newCommentIds.has(comment._id)}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && activeTab === 'all' && (
                            <div className="text-center pt-6">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    loading={isLoadingMore}
                                    disabled={isLoadingMore}
                                    className="px-6 gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading more...
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4" />
                                            Load more comments
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* End of Comments */}
                        {!hasMore && getFilteredComments().length > 0 && (
                            <div className="text-center py-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                                    <MessageSquare size={16} />
                                    <span>All comments loaded</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                                    Showing {getFilteredComments().length} of {totalComments} comments
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};