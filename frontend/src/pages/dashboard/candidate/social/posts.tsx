// pages/dashboard/[role]/social/posts.tsx - Unified Posts Management
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { EditablePostCard } from '@/components/social/post/EditablePostCard';
import { PostComposer } from '@/components/social/post/PostComposer';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Trash2,
  Pin,
  BarChart3,
  Filter,
  Search,
  Grid,
  List,
  CheckSquare,
  X,
  Archive,
  Plus,
  TrendingUp,
  Sparkles,
  Eye,
  Clock,
  Users,
  FileText,
  MoreVertical,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { postService, Post, PostsResponse } from '@/services/postService';
import { useAuth } from '@/contexts/AuthContext';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';

type PostStatus = 'all' | 'active' | 'hidden' | 'draft';
type PostType = 'all' | 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement';
type SortOption = 'newest' | 'oldest' | 'popular' | 'trending';

interface PostStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

function MyPostsPageContent() {
  const { user } = useAuth();
  const { colors, role } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [postStats, setPostStats] = useState<Record<string, PostStats>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<PostStatus>('all');
  const [typeFilter, setTypeFilter] = useState<PostType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const postsContainerRef = useRef<HTMLDivElement>(null);

  // Load posts on mount and when filters change
  useEffect(() => {
    loadMyPosts(true);
  }, [statusFilter, typeFilter, sortOption, searchQuery]);

  const loadMyPosts = async (reset = false) => {
    if (isLoadingMore && !reset) return;

    const loader = reset ? setLoading : setIsLoadingMore;
    loader(true);

    try {
      const currentPage = reset ? 1 : page;

      // Map sort option to backend parameters
      const sortMap = {
        'newest': 'createdAt_desc',
        'oldest': 'createdAt_asc',
        'popular': 'stats.likes_desc',
        'trending': 'stats.views_desc'
      };

      const response = await postService.getMyPosts({
        page: currentPage,
        limit: 12,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });

      const postsData = response.data || [];

      if (reset) {
        setPosts(postsData);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...postsData]);
        setPage(prev => prev + 1);
      }

      setHasMore(!!response.pagination && currentPage < response.pagination.pages);
      calculatePostsStats(postsData);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load your posts"
      });
    } finally {
      loader(false);
    }
  };

  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      await loadMyPosts(true);
      toast({
        variant: "success",
        title: "Refreshed",
        description: "Posts refreshed successfully"
      });
    } catch (error) {
      console.error('Failed to refresh posts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculatePostsStats = (postsList: Post[]) => {
    const stats: Record<string, PostStats> = {};

    postsList.forEach(post => {
      const views = post.stats?.views || 0;
      const likes = post.stats?.likes || 0;
      const comments = post.stats?.comments || 0;
      const shares = post.stats?.shares || 0;
      const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;

      stats[post._id] = {
        views,
        likes,
        comments,
        shares,
        engagementRate
      };
    });

    setPostStats(prev => ({ ...prev, ...stats }));
  };

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    calculatePostsStats([newPost, ...posts]);
    setShowComposer(false);
    toast({
      variant: "success",
      title: "Post Created",
      description: "Your post has been published successfully"
    });

    // Scroll to top to show new post
    if (postsContainerRef.current) {
      postsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [posts, toast]);

  const handlePostUpdated = useCallback((updatedPost: Post) => {
    setPosts(prev => prev.map(post =>
      post._id === updatedPost._id ? updatedPost : post
    ));

    // Update stats for the updated post
    const stats = postStats[updatedPost._id];
    if (stats) {
      setPostStats(prev => ({
        ...prev,
        [updatedPost._id]: {
          ...stats,
          likes: updatedPost.stats?.likes || stats.likes,
          comments: updatedPost.stats?.comments || stats.comments,
          shares: updatedPost.stats?.shares || stats.shares,
          views: updatedPost.stats?.views || stats.views,
        }
      }));
    }

    toast({
      variant: "success",
      title: "Updated",
      description: "Post updated successfully"
    });
  }, [postStats, toast]);

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });

    setPostStats(prev => {
      const newStats = { ...prev };
      delete newStats[postId];
      return newStats;
    });

    toast({
      variant: "success",
      title: "Deleted",
      description: "Post deleted successfully"
    });
  }, [toast]);

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedPosts.size} selected posts? This action cannot be undone.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const deletePromises = Array.from(selectedPosts).map(postId =>
        postService.deletePost(postId, false)
      );

      await Promise.all(deletePromises);

      setPosts(prev => prev.filter(post => !selectedPosts.has(post._id)));
      setSelectedPosts(new Set());

      toast({
        variant: "success",
        title: "Bulk Delete",
        description: `${selectedPosts.size} posts deleted successfully`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to delete posts'
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedPosts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const archivePromises = Array.from(selectedPosts).map(postId =>
        postService.updatePost(postId, {
          visibility: 'private'
        }).catch(err => {
          console.error(`Failed to archive post ${postId}:`, err);
          return null;
        })
      );

      const results = await Promise.all(archivePromises);
      const successfulArchives = results.filter(r => r !== null);

      setPosts(prev => prev.map(post =>
        selectedPosts.has(post._id)
          ? { ...post, visibility: 'private' }
          : post
      ));

      setSelectedPosts(new Set());

      toast({
        variant: "success",
        title: "Archived",
        description: `${successfulArchives.length} posts archived successfully`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to archive posts'
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkPin = async (pin: boolean) => {
    if (selectedPosts.size === 0) return;

    setBulkActionLoading(true);
    try {
      const pinPromises = Array.from(selectedPosts).map(postId =>
        postService.updatePost(postId, { pinned: pin })
      );

      await Promise.all(pinPromises);

      setPosts(prev => prev.map(post =>
        selectedPosts.has(post._id)
          ? { ...post, pinned: pin }
          : post
      ));

      toast({
        variant: "success",
        title: pin ? "Pinned" : "Unpinned",
        description: `${selectedPosts.size} posts ${pin ? 'pinned' : 'unpinned'}`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${pin ? 'pin' : 'unpin'} posts`
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    const newSet = new Set(selectedPosts);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
    }
    setSelectedPosts(newSet);
  };

  const selectAllPosts = () => {
    if (selectedPosts.size === filteredPosts.length && filteredPosts.length > 0) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p._id)));
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSortOption('newest');
    setSearchQuery('');
    setActiveTab('all');
    setShowAdvancedFilters(false);
  };

  // Filtered posts based on search and active tab
  const filteredPosts = posts.filter(post => {
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = post.content?.toLowerCase().includes(query);
      const matchesHashtags = post.hashtags?.some(tag =>
        tag.toLowerCase().includes(query.replace('#', ''))
      );
      const matchesAuthor = post.author.name?.toLowerCase().includes(query);

      if (!matchesContent && !matchesHashtags && !matchesAuthor) {
        return false;
      }
    }

    // Apply tab filters
    if (activeTab === 'pinned') return post.pinned;
    if (activeTab === 'popular') {
      const stats = postStats[post._id];
      return stats && stats.engagementRate > 5;
    }
    if (activeTab === 'drafts') return post.visibility === 'private';
    return true;
  });

  // Statistics calculation
  const totalStats = {
    posts: posts.length,
    views: Object.values(postStats).reduce((sum, stat) => sum + stat.views, 0),
    likes: Object.values(postStats).reduce((sum, stat) => sum + stat.likes, 0),
    comments: Object.values(postStats).reduce((sum, stat) => sum + stat.comments, 0),
    shares: Object.values(postStats).reduce((sum, stat) => sum + stat.shares, 0),
    pinned: posts.filter(p => p.pinned).length,
    engagement: posts.length > 0
      ? (Object.values(postStats).reduce((sum, stat) => sum + stat.engagementRate, 0) / posts.length).toFixed(1)
      : '0.0'
  };

  // Empty state
  const renderEmptyState = () => (
    <div className="text-center py-12 px-4 bg-white rounded-xl border border-gray-200">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-blue-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {searchQuery ? 'No Posts Found' : 'No Posts Yet'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {searchQuery
          ? 'No posts match your search criteria. Try different filters.'
          : 'Share your thoughts, updates, or achievements with your network.'}
      </p>
      {!searchQuery && (
        <Button
          onClick={() => setShowComposer(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Post
        </Button>
      )}
      {searchQuery && (
        <Button
          onClick={handleClearFilters}
          variant="outline"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );

  // Loading skeleton
  const renderPostSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Posts</h1>
              <p className="text-sm text-gray-600">
                Manage and track your content performance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPosts}
                disabled={isRefreshing}
                className="h-9"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>

              <Button
                onClick={() => setShowComposer(true)}
                size="sm"
                className="h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-700">{totalStats.posts}</div>
              <div className="text-xs text-blue-600">Posts</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-700">{totalStats.views.toLocaleString()}</div>
              <div className="text-xs text-green-600">Views</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-purple-700">{totalStats.likes.toLocaleString()}</div>
              <div className="text-xs text-purple-600">Likes</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-amber-700">{totalStats.comments.toLocaleString()}</div>
              <div className="text-xs text-amber-600">Comments</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-pink-700">{totalStats.engagement}%</div>
              <div className="text-xs text-pink-600">Engagement</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-2">
            <TabsList className="w-full bg-transparent border-b border-gray-200 justify-start px-0 h-10">
              <TabsTrigger
                value="all"
                className="px-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
              >
                All ({posts.length})
              </TabsTrigger>
              <TabsTrigger
                value="pinned"
                className="px-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none flex items-center gap-1"
              >
                <Pin className="w-3 h-3" />
                Pinned ({posts.filter(p => p.pinned).length})
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="px-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Popular
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className="px-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Drafts ({posts.filter(p => p.visibility === 'private').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Post Composer (Conditional) */}
          {showComposer && (
            <div className="mb-6">
              <PostComposer
                onPostCreated={handlePostCreated}
                onClose={() => setShowComposer(false)}
                roleContext={role}
              />
            </div>
          )}

          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Selection Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <button
                    onClick={selectAllPosts}
                    className={`p-1.5 rounded-lg border transition-colors ${selectedPosts.size === filteredPosts.length && filteredPosts.length > 0
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    disabled={filteredPosts.length === 0 || loading}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  {selectedPosts.size > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {selectedPosts.size} selected
                    </span>
                  )}
                </div>

                {selectedPosts.size > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkPin(true)}
                      disabled={bulkActionLoading}
                      className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Pin className="w-3 h-3 mr-1" />
                      Pin
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkPin(false)}
                      disabled={bulkActionLoading}
                      className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Pin className="w-3 h-3 mr-1" />
                      Unpin
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                      disabled={bulkActionLoading}
                      className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkActionLoading}
                      className="h-8 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid'
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="h-9"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {showAdvancedFilters ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'active', 'hidden', 'draft'] as PostStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-colors ${statusFilter === status
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                        >
                          {status === 'all' ? 'All Status' : status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'text', 'image', 'video', 'poll', 'job', 'achievement', 'link'] as PostType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-colors ${typeFilter === type
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                        >
                          {type === 'all' ? 'All Types' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <div className="flex flex-wrap gap-2">
                      {(['newest', 'oldest', 'popular', 'trending'] as SortOption[]).map(sort => (
                        <button
                          key={sort}
                          onClick={() => setSortOption(sort)}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-colors ${sortOption === sort
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            }`}
                        >
                          {sort === 'newest' ? 'Newest' :
                            sort === 'oldest' ? 'Oldest' :
                              sort === 'popular' ? 'Popular' : 'Trending'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9"
                  >
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      loadMyPosts(true);
                      setShowAdvancedFilters(false);
                    }}
                    className="h-9"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Posts Content */}
          <div ref={postsContainerRef} className="min-h-[400px]">
            {loading && filteredPosts.length === 0 ? (
              renderPostSkeleton()
            ) : filteredPosts.length === 0 ? (
              renderEmptyState()
            ) : viewMode === 'list' ? (
              // List View with EditablePostCard
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="relative">
                    {/* Selection checkbox */}
                    {selectedPosts.has(post._id) && (
                      <div className="absolute -left-3 top-4 z-10">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckSquare className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    <EditablePostCard
                      post={post}
                      currentUserId={user?._id || ''}
                      onUpdate={handlePostUpdated}
                      onDelete={handlePostDeleted}
                      className={selectedPosts.has(post._id) ? 'ml-2' : ''}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="relative">
                    {/* Selection checkbox */}
                    <div className="absolute left-2 top-2 z-10">
                      <button
                        onClick={() => togglePostSelection(post._id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedPosts.has(post._id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-400 bg-white'
                          }`}
                      >
                        {selectedPosts.has(post._id) && (
                          <CheckSquare className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>

                    <EditablePostCard
                      post={post}
                      currentUserId={user?._id || ''}
                      onUpdate={handlePostUpdated}
                      onDelete={handlePostDeleted}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredPosts.length > 0 && hasMore && (
              <div className="pt-6 pb-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => loadMyPosts(false)}
                  disabled={isLoadingMore}
                  className="px-6 py-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action FAB */}
      {!showComposer && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}

export default function MyPostsPage() {
  const router = useRouter();
  const { role } = router.query;

  return (
    <SocialDashboardLayout requiredRole={role as any || 'candidate'}>
      <RoleThemeProvider>
        <MyPostsPageContent />
      </RoleThemeProvider>
    </SocialDashboardLayout>
  );
}