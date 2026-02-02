import React, { useState, useEffect } from 'react';
import { PostCard } from '@/components/social/post/PostCard';
import { Post } from '@/services/postService';
import { postService } from '@/services/postService';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/social/ui/Button';
import {
  Globe,
  PlusCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Loader2,
  Filter,
  Image as ImageIcon,
  Video,
  FileText,
  X
} from 'lucide-react';

interface ProfilePostsSectionProps {
  userId: string;
  isOwnProfile: boolean;
  limit?: number;
  showLoadMore?: boolean;
  currentUserId?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export const ProfilePostsSection: React.FC<ProfilePostsSectionProps> = ({
  userId,
  isOwnProfile,
  limit = 5,
  showLoadMore = true,
  currentUserId,
  variant = 'default',
  className = '',
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'text' | 'image' | 'video' | 'document'>('all');
  const [stats, setStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    engagement: 0,
    shares: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchPosts = async (pageNum: number = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      // Use updated postService.getUserPosts method
      const response = await postService.getUserPosts(userId, {
        page: pageNum,
        limit,
        type: postTypeFilter === 'all' ? undefined : postTypeFilter,
        includeShared: true
      });

      if (pageNum === 1 || refresh) {
        setPosts(response.data || []);
      } else {
        setPosts(prev => [...prev, ...(response.data || [])]);
      }

      // Calculate stats from response
      const postsData = response.data || [];
      const newStats = {
        total: postsData.length,
        images: postsData.filter(p => p.type === 'image').length,
        videos: postsData.filter(p => p.type === 'video').length,
        engagement: postsData.reduce((sum, p) =>
          sum + (p.stats?.likes || 0) + (p.stats?.comments || 0), 0
        ),
        shares: postsData.reduce((sum, p) => sum + (p.stats?.shares || 0), 0)
      };
      setStats(newStats);

      // Check if there are more pages
      const pagination = response.pagination;
      if (pagination) {
        setHasMore(pagination.page < pagination.pages);
      } else {
        setHasMore((response.data || []).length >= limit);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userId, postTypeFilter]);

  const handleRefresh = () => {
    setPage(1);
    fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handleViewProfile = (profileUserId: string) => {
    window.location.href = `/profile/${profileUserId}`;
  };

  const handleCreatePost = () => {
    window.location.href = `/create-post`;
  };

  const handleViewAllPosts = () => {
    window.location.href = `/profile/${userId}/posts`;
  };

  const filterButtons = [
    { value: 'all', label: 'All', icon: <Globe className="w-4 h-4" /> },
    { value: 'text', label: 'Text', icon: <FileText className="w-4 h-4" /> },
    { value: 'image', label: 'Images', icon: <ImageIcon className="w-4 h-4" /> },
    { value: 'video', label: 'Videos', icon: <Video className="w-4 h-4" /> },
  ];

  // Loading skeleton
  if (loading && posts.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0 && !loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-8 ${className}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isOwnProfile ? "Your creative space" : "Profile posts"}
              </p>
            </div>
          </div>

          {isOwnProfile && (
            <Button
              onClick={handleCreatePost}
              variant="default"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          )}
        </div>

        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {isOwnProfile ? "Start Sharing Your Journey" : "No Posts Yet"}
          </h4>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
            {isOwnProfile
              ? "Share your thoughts, achievements, or updates with your network. Your first post could inspire others!"
              : "This profile hasn't shared any posts yet. Check back soon for updates."}
          </p>
          {isOwnProfile ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleCreatePost}
                variant="default"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
              <Button
                onClick={() => window.location.href = '/feed'}
                variant="outline"
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Explore Feed
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.total} posts • {stats.engagement} engagement
              </span>
              {stats.shares > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  • {stats.shares} shares
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter dropdown for mobile */}
          <div className="md:hidden">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {postTypeFilter !== 'all' && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
          </div>

          {/* Filter buttons for desktop */}
          <div className="hidden md:flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {filterButtons.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setPostTypeFilter(filter.value as any)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${postTypeFilter === filter.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Button
                onClick={handleCreatePost}
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create
              </Button>
            ) : (
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-700"
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter dropdown */}
      {showFilters && (
        <div className="md:hidden mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Filter Posts</h4>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {filterButtons.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setPostTypeFilter(filter.value as any);
                  setShowFilters(false);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${postTypeFilter === filter.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500', icon: '📝' },
          { label: 'Images', value: stats.images, color: 'from-purple-500 to-pink-500', icon: '🖼️' },
          { label: 'Videos', value: stats.videos, color: 'from-amber-500 to-orange-500', icon: '🎬' },
          { label: 'Likes/Comments', value: stats.engagement, color: 'from-green-500 to-emerald-500', icon: '💬' },
          { label: 'Shares', value: stats.shares, color: 'from-indigo-500 to-violet-500', icon: '🔄' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
              <div className={`text-2xl bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Posts list */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-900"
          >
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onViewProfile={handleViewProfile}
              // showActions={true}
              className="border-0"
            />
          </div>
        ))}
      </div>

      {/* Load more */}
      {showLoadMore && hasMore && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loading}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  Load More Posts
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Showing {posts.length} posts • {hasMore ? 'Scroll or click to load more' : 'All posts loaded'}
            </p>
          </div>
        </div>
      )}

      {/* View all posts (for compact view) */}
      {!showLoadMore && posts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleViewAllPosts}
            className="group w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  View All Posts
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  See complete post history by {isOwnProfile ? 'you' : 'this profile'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
          </button>
        </div>
      )}
    </div>
  );
};