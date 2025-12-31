import React, { useState, useEffect } from 'react';
import { PostCard } from '@/components/social/post/PostCard';
import { Post } from '@/services/postService';
import { postService } from '@/services/postService';
import { Card } from '@/components/social/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/social/ui/Button';
import {
  Globe,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Filter,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface ProfilePostsSectionProps {
  userId: string;
  isOwnProfile: boolean;
  limit?: number;
  showLoadMore?: boolean;
  currentUserId?: string;
  variant?: 'default' | 'compact';
}

export const ProfilePostsSection: React.FC<ProfilePostsSectionProps> = ({
  userId,
  isOwnProfile,
  limit = 5,
  showLoadMore = true,
  currentUserId,
  variant = 'default',
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'text' | 'image' | 'video'>('all');

  const fetchPosts = async (pageNum: number = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await postService.getUserPosts(userId, {
        page: pageNum,
        limit,
        type: postTypeFilter === 'all' ? undefined : postTypeFilter
      });

      if (pageNum === 1 || refresh) {
        setPosts(response.data || []);
      } else {
        setPosts(prev => [...prev, ...(response.data || [])]);
      }

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

  if (loading && posts.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Posts
            </h3>
          </div>
        </div>

        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="backdrop-blur-lg bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
              <div className="h-48 bg-gray-200 rounded-xl mt-4 animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Posts
            </h3>
          </div>
          {isOwnProfile && (
            <Button
              onClick={() => window.location.href = '/create-post'}
              variant="premium"
              className="backdrop-blur-lg border-gray-300 hover:scale-105 transition-transform"
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
          <h4 className="text-xl font-bold text-gray-900 mb-3">
            {isOwnProfile ? "Your Creative Space" : "No Posts Yet"}
          </h4>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            {isOwnProfile
              ? "Share your thoughts, achievements, or updates with your network. Your first post could inspire others!"
              : "This profile hasn't shared any posts yet. Check back soon for updates."}
          </p>
          {isOwnProfile ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/create-post'}
                variant="premium"
                className="backdrop-blur-lg border-gray-300"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
              <Button
                onClick={() => window.location.href = '/posts/trending'}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Explore Trending
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const stats = {
    totalPosts: posts.length,
    imagePosts: posts.filter(p => p.type === 'image').length,
    videoPosts: posts.filter(p => p.type === 'video').length,
    engagement: posts.reduce((sum, p) => sum + (p.stats?.likes || 0) + (p.stats?.comments || 0), 0),
  };

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Posts
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {posts.length} posts • {stats.engagement} total engagement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex gap-2 border border-gray-300 rounded-xl p-1 bg-gray-50">
            <button
              onClick={() => setPostTypeFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${postTypeFilter === 'all'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setPostTypeFilter('text')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${postTypeFilter === 'text'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              Text
            </button>
            <button
              onClick={() => setPostTypeFilter('image')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${postTypeFilter === 'image'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              Images
            </button>
            <button
              onClick={() => setPostTypeFilter('video')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${postTypeFilter === 'video'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              Videos
            </button>
          </div>

          {isOwnProfile ? (
            <Button
              onClick={() => window.location.href = '/create-post'}
              variant="premium"
              className="backdrop-blur-lg border-gray-300 hover:scale-105 transition-transform"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          ) : (
            <Button
              onClick={handleRefresh}
              variant="premium"
              size="sm"
              className="backdrop-blur-lg border-gray-300"
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: stats.totalPosts, color: 'from-blue-500 to-cyan-500' },
          { label: 'Images', value: stats.imagePosts, color: 'from-purple-500 to-pink-500' },
          { label: 'Videos', value: stats.videoPosts, color: 'from-amber-500 to-orange-500' },
          { label: 'Engagement', value: stats.engagement, color: 'from-green-500 to-emerald-500' },
        ].map((stat, index) => (
          <div
            key={index}
            className="backdrop-blur-lg bg-white rounded-xl p-4 text-center border border-gray-200 hover:scale-105 transition-transform duration-300"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 bg-gradient-to-br ${stat.color}`}>
              <span className="text-lg">
                {index === 0 ? '📝' : index === 1 ? '🖼️' : index === 2 ? '🎬' : '💬'}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post._id}
            className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-500 transition-all duration-300 group"
          >
            <PostCard
              post={post}
              currentUserId={currentUserId}
              onViewProfile={handleViewProfile}
              // variant="glass"
              className="bg-transparent border-0"
            />

            {/* Glass overlay effects */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Load More */}
      {showLoadMore && hasMore && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <Button
              variant="premium"
              onClick={handleLoadMore}
              disabled={loading}
              className="backdrop-blur-lg border-gray-300 group hover:scale-105 transition-transform"
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
            <p className="text-sm text-gray-600 mt-3">
              Showing {posts.length} posts • {hasMore ? 'Scroll or click to load more' : 'All posts loaded'}
            </p>
          </div>
        </div>
      )}

      {/* View All Posts */}
      {!showLoadMore && posts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => window.location.href = `/profile/${userId}/posts`}
            className="group w-full flex items-center justify-center gap-2 backdrop-blur-lg bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-500 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-gray-700 group-hover:text-blue-600 transition-colors font-medium">
              View All Posts by {isOwnProfile ? 'You' : 'This Profile'}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
          </button>
        </div>
      )}
    </Card>
  );
};