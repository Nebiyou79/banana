// pages/dashboard/candidate/social/index.tsx - Candidate Social Feed (CLEAN VERSION)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { PostComposer } from '@/components/social/post/PostComposer';
import { PostCard } from '@/components/social/post/PostCard';
import { Button } from '@/components/social/ui/Button';
import {
  TrendingUp,
  Filter,
  Zap,
  Sparkles,
  Users,
  Briefcase,
  Building2,
  Plus,
  Image as ImageIcon,
  FileText,
  Calendar,
  ArrowUp,
  RefreshCw
} from 'lucide-react';
import { postService, Post, FeedParams } from '@/services/postService';
import { useAuth } from '@/contexts/AuthContext';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import { colorClasses } from '@/utils/color';

interface FeedFilter {
  type?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement';
  trending?: boolean;
  followedOnly?: boolean;
  hashtag?: string;
}

function SocialFeedContent() {
  const { user } = useAuth();
  const { colors, role } = useTheme();
  const { toast } = useToast();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<FeedFilter>({
    trending: false,
    followedOnly: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'trending'>('feed');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(true);

  // Always show back to top button
  useEffect(() => {
    setShowBackToTop(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [filters, viewMode]);

  async function loadInitialData() {
    setLoading(true);
    setPage(1);
    try {
      const feedParams: FeedParams = {
        page: 1,
        limit: 10,
        type: filters.type,
        hashtag: filters.hashtag,
      };

      if (viewMode === 'trending') {
        feedParams.sortBy = 'trending';
      }

      const response = await postService.getFeedPosts(feedParams);
      setPosts(response.data || []);
      setHasMore(!!response.pagination && response.pagination.page < response.pagination.pages);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load feed posts"
      });
    } finally {
      setLoading(false);
    }
  }

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const feedParams: FeedParams = {
        page: nextPage,
        limit: 10,
        type: filters.type,
        hashtag: filters.hashtag,
      };

      if (viewMode === 'trending') {
        feedParams.sortBy = 'trending';
      }

      const response = await postService.getFeedPosts(feedParams);

      if (response.data && response.data.length > 0) {
        setPosts(prev => [...prev, ...response.data]);
        setPage(nextPage);
        setHasMore(!!response.pagination && response.pagination.page < response.pagination.pages);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load more posts"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    toast({
      variant: "success",
      title: "Success",
      description: "Your post has been published"
    });
    setIsCreating(false);
  }, [toast]);

  const handleViewProfile = (userId: string) => {
    window.location.href = `/social/profile/${userId}`;
  };

  const handleFilterChange = (newFilters: Partial<FeedFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
    toast({
      variant: "default",
      title: "Feed refreshed",
      description: "Latest posts loaded"
    });
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${colorClasses.bg.blue} bg-opacity-20 flex items-center justify-center`}>
        <Sparkles className={`w-8 h-8 ${colorClasses.text.blue}`} />
      </div>
      <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-2`}>
        Your feed is empty
      </h3>
      <p className={`${colorClasses.text.gray800} mb-6 max-w-md mx-auto`}>
        Start by following people in your industry, or create your first post to share your thoughts!
      </p>
      <Button
        onClick={() => setIsCreating(true)}
        className={`${colorClasses.bg.blue} hover:${colorClasses.bg.darkNavy} text-white`}
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Post
      </Button>
    </div>
  );

  const renderPostSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={`rounded-xl border ${colorClasses.border.gray100} p-4 animate-pulse`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${colorClasses.bg.gray100} rounded-full`} />
            <div className="flex-1">
              <div className={`h-3 ${colorClasses.bg.gray100} rounded w-1/4 mb-2`} />
              <div className={`h-2 ${colorClasses.bg.gray100} rounded w-1/3`} />
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className={`h-3 ${colorClasses.bg.gray100} rounded w-full`} />
            <div className={`h-3 ${colorClasses.bg.gray100} rounded w-2/3`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`h-32 ${colorClasses.bg.gray100} rounded-lg`} />
            <div className={`h-32 ${colorClasses.bg.gray100} rounded-lg`} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen" ref={mainContentRef}>
      {/* Always Visible Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 ${colorClasses.bg.darkNavy} ${colorClasses.text.white} rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Main Content - Clean Layout */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className={`text-xl md:text-2xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
                👨‍💼 Professional Feed
              </h2>
              <p className={`${colorClasses.text.gray800} text-sm`}>
                Stay updated with your network's activities and industry insights
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'feed' ? 'secondary' : 'outline'}
                onClick={() => {
                  setViewMode('feed');
                  handleFilterChange({ trending: false });
                }}
                className={`text-xs md:text-sm ${viewMode === 'feed' ? colorClasses.bg.darkNavy + ' text-white' : ''}`}
                size="sm"
              >
                <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                My Feed
              </Button>
              <Button
                variant={viewMode === 'trending' ? 'premium' : 'outline'}
                onClick={() => {
                  setViewMode('trending');
                  handleFilterChange({ trending: true });
                }}
                className={`text-xs md:text-sm ${viewMode === 'trending' ? colorClasses.bg.darkNavy + ' text-white' : ''}`}
                size="sm"
              >
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Trending
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`text-xs md:text-sm ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
                size="sm"
              >
                <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          {showFilters && (
            <div className={`rounded-lg border ${colorClasses.border.gray100} p-3 mb-4`}>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange({ type: undefined })}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${!filters.type
                    ? `${colorClasses.bg.blue} ${colorClasses.text.white} ${colorClasses.border.blue}`
                    : `${colorClasses.bg.white} ${colorClasses.text.gray800} ${colorClasses.border.gray400} hover:${colorClasses.bg.gray100}`
                    }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => handleFilterChange({ type: 'job' })}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${filters.type === 'job'
                    ? `${colorClasses.bg.teal} ${colorClasses.text.white} ${colorClasses.border.teal}`
                    : `${colorClasses.bg.white} ${colorClasses.text.gray800} ${colorClasses.border.gray400} hover:${colorClasses.bg.gray100}`
                    }`}
                >
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Jobs
                </button>
                <button
                  onClick={() => handleFilterChange({ type: 'achievement' })}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${filters.type === 'achievement'
                    ? `${colorClasses.bg.orange} ${colorClasses.text.white} ${colorClasses.border.orange}`
                    : `${colorClasses.bg.white} ${colorClasses.text.gray800} ${colorClasses.border.gray400} hover:${colorClasses.bg.gray100}`
                    }`}
                >
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Achievements
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Post Composer - Same as Company */}
        <div className="mb-6">
          <PostComposer
            onPostCreated={handlePostCreated}
            roleContext="candidate"
            mode="create"
          />
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={isRefreshing}
            className={`text-xs ${colorClasses.border.darkNavy} ${colorClasses.text.darkNavy} hover:${colorClasses.bg.darkNavy} hover:text-white`}
            size="sm"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh Feed
          </Button>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            renderPostSkeleton()
          ) : posts.length === 0 ? (
            renderEmptyState()
          ) : (
            posts.map((post) => (
              <div key={post._id} className="transform transition-transform hover:scale-[1.01]">
                <PostCard
                  post={post}
                  currentUserId={user?._id}
                  onViewProfile={handleViewProfile}
                  condensed={false}
                />
              </div>
            ))
          )}

          {/* Load More Button */}
          {posts.length > 0 && hasMore && (
            <div className="pt-6 text-center">
              <Button
                variant="outline"
                onClick={loadMorePosts}
                loading={loading}
                className={`${colorClasses.border.darkNavy} ${colorClasses.text.darkNavy} hover:${colorClasses.bg.darkNavy} hover:text-white`}
              >
                Load More Posts
              </Button>
            </div>
          )}

          {/* No More Posts Message */}
          {posts.length > 0 && !hasMore && !loading && (
            <div className="pt-6 text-center border-t">
              <div className={`w-8 h-8 ${colorClasses.bg.gray100} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Zap className={`w-4 h-4 ${colorClasses.text.gray400}`} />
              </div>
              <p className={`text-sm ${colorClasses.text.gray800}`}>
                You've reached the end of your feed
              </p>
              <Button
                variant="ghost"
                onClick={scrollToTop}
                className="mt-3 text-xs"
                size="sm"
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Back to top
              </Button>
            </div>
          )}
        </div>

        {/* Simple Stats */}
        <div className={`mt-6 text-center ${colorClasses.text.gray800} text-xs md:text-sm`}>
          <div className="inline-flex items-center gap-3 md:gap-4 flex-wrap justify-center">
            <span>📊 {posts.length} posts</span>
            <span>•</span>
            <span>👥 Following updates</span>
            <span>•</span>
            <span>🔄 Updated just now</span>
          </div>
        </div>
      </div>

      {/* Post Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-75"
              onClick={() => setIsCreating(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <PostComposer
                onPostCreated={handlePostCreated}
                onClose={() => setIsCreating(false)}
                roleContext={role}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialFeedPage() {
  return (
    <SocialDashboardLayout requiredRole="candidate">
      <RoleThemeProvider>
        <SocialFeedContent />
      </RoleThemeProvider>
    </SocialDashboardLayout>
  );
}