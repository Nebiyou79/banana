/* eslint-disable @typescript-eslint/no-explicit-any */
// /dashboard/company/social/index.tsx - Company Social Feed (CLEAN VERSION)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp,
  Sparkles,
  Filter,
  RefreshCw,
  Pin,
  Zap,
  Users,
  Globe,
  Building2,
  ArrowUp,
} from 'lucide-react';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { PostComposer } from '@/components/social/post/PostComposer';
import { PostCard } from '@/components/social/post/PostCard';
import { Button } from '@/components/social/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { postService, Post } from '@/services/postService';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import { colorClasses } from '@/utils/color';

// Custom infinite scroll hook
const useInfiniteScroll = <T,>(
  fetchFunction: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: { limit?: number; initialPage?: number } = {}
) => {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(options.initialPage || 1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await fetchFunction(page);
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      if (result.data.length > 0) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchFunction]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchFunction(1);
      setItems(result.data);
      setPage(2);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to refresh items:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    if (!lastItemRef.current || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(lastItemRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading]);

  return {
    items,
    loadMore,
    refresh,
    isLoading,
    isRefreshing,
    hasMore,
    lastItemRef,
    reset: () => {
      setItems([]);
      setPage(1);
      setHasMore(true);
      refresh();
    }
  };
};

type FeedType = 'all' | 'following' | 'trending' | 'announcements';

interface FeedFilter {
  type: FeedType;
  timeframe?: 'today' | 'week' | 'month';
  sortBy?: 'recent' | 'popular' | 'trending';
}

function CompanySocialFeedContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FeedType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>({
    type: 'all',
    timeframe: 'today',
    sortBy: 'recent'
  });
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Always show back to top button
  useEffect(() => {
    setShowBackToTop(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch feed posts
  const fetchFeedPosts = useCallback(async (pageNum: number) => {
    try {
      const params: any = {
        page: pageNum,
        limit: 10,
        sortBy: filter.sortBy
      };

      if (activeTab === 'announcements') {
        params.type = 'job';
      } else if (activeTab === 'following') {
        params.following = true;
      } else if (activeTab === 'trending') {
        params.sortBy = 'trending';
      }

      if (filter.timeframe) {
        const now = new Date();
        const timeframeMap: Record<string, Date> = {
          today: new Date(now.setDate(now.getDate() - 1)),
          week: new Date(now.setDate(now.getDate() - 7)),
          month: new Date(now.setDate(now.getDate() - 30))
        };
        params.since = timeframeMap[filter.timeframe].toISOString();
      }

      const response = await postService.getFeedPosts(params);
      return {
        data: response.data.filter((post: Post) => !post.pinned),
        hasMore: response.pagination ? pageNum < response.pagination.pages : false
      };
    } catch (error) {
      console.error('Failed to fetch feed posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load feed posts"
      });
      return { data: [], hasMore: false };
    }
  }, [activeTab, filter.timeframe, filter.sortBy, toast]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFeedPosts(1);
      setFeedPosts(result.data);
      setHasMore(result.hasMore);
      setPage(2);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFeedPosts]);

  // Load more posts
  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await fetchFeedPosts(page);
      setFeedPosts(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh feed
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
    setNewPostsCount(0);
    toast({
      variant: "default",
      title: "Feed refreshed",
      description: "Latest posts loaded"
    });
  };

  // Load pinned and trending posts
  useEffect(() => {
    const loadSpecialPosts = async () => {
      try {
        const pinnedResponse = await postService.getFeedPosts({
          limit: 3,
          type: activeTab === 'announcements' ? 'job' : undefined
        });
        setPinnedPosts(pinnedResponse.data || []);

        const trendingResponse = await postService.getFeedPosts({
          limit: 3,
        });
        setTrendingPosts(trendingResponse.data || []);
      } catch (error) {
        console.error('Failed to load special posts:', error);
      }
    };

    loadSpecialPosts();
  }, [activeTab]);

  // Load initial data on mount and filter change
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleFilterChange = (key: keyof FeedFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    loadInitialData();
  };

  const handleViewProfile = (userId: string) => {
    window.location.href = `/profile/${userId}`;
  };

  const handlePostCreated = (post: Post) => {
    loadInitialData();
    toast({
      variant: "success",
      title: "Success",
      description: "Post created successfully"
    });
  };

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
              <h1 className={`text-2xl md:text-3xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
                🏢 Company Social Feed
              </h1>
              <p className={`${colorClasses.text.gray800} text-sm`}>
                Connect with your industry network and share updates
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                loading={isRefreshing}
                className={`${colorClasses.border.darkNavy} ${colorClasses.text.darkNavy} hover:${colorClasses.bg.darkNavy} hover:text-white`}
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Post Composer */}
        <div className="mb-6">
          <PostComposer
            onPostCreated={handlePostCreated}
            roleContext="company"
            mode="create"
          />
        </div>

        {/* Main Feed */}
        <div className={`rounded-xl border ${colorClasses.border.gray100} ${colorClasses.bg.white} shadow-sm overflow-hidden`}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FeedType)}>
            <div className="border-b">
              <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList className="bg-transparent flex-wrap">
                  <TabsTrigger
                    value="all"
                    className={`data-[state=active]:${colorClasses.bg.darkNavy} data-[state=active]:${colorClasses.text.white} text-xs md:text-sm`}
                  >
                    <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="following"
                    className={`data-[state=active]:${colorClasses.bg.darkNavy} data-[state=active]:${colorClasses.text.white} text-xs md:text-sm`}
                  >
                    <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Following
                  </TabsTrigger>
                  <TabsTrigger
                    value="trending"
                    className={`data-[state=active]:${colorClasses.bg.darkNavy} data-[state=active]:${colorClasses.text.white} text-xs md:text-sm`}
                  >
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger
                    value="announcements"
                    className={`data-[state=active]:${colorClasses.bg.darkNavy} data-[state=active]:${colorClasses.text.white} text-xs md:text-sm`}
                  >
                    <Building2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Announcements
                  </TabsTrigger>
                </TabsList>

                {/* Filter Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`${colorClasses.text.gray800} text-xs md:text-sm`}
                >
                  <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Filters
                </Button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className={`px-4 md:px-6 py-4 ${colorClasses.bg.gray100} border-b`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs md:text-sm font-medium ${colorClasses.text.gray800} mb-1`}>
                        Timeframe
                      </label>
                      <select
                        value={filter.timeframe}
                        onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                        className={`w-full rounded-lg border ${colorClasses.border.gray400} px-3 py-2 text-xs md:text-sm focus:outline-none ${colorClasses.border.darkNavy}`}
                      >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs md:text-sm font-medium ${colorClasses.text.gray800} mb-1`}>
                        Sort By
                      </label>
                      <select
                        value={filter.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className={`w-full rounded-lg border ${colorClasses.border.gray400} px-3 py-2 text-xs md:text-sm focus:outline-none ${colorClasses.border.darkNavy}`}
                      >
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="trending">Trending</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pinned Announcements */}
            {activeTab === 'announcements' && pinnedPosts.length > 0 && (
              <div className={`px-4 md:px-6 py-4 ${colorClasses.bg.goldenMustard} bg-opacity-10 border-b`}>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className={`w-4 h-4 ${colorClasses.text.goldenMustard}`} />
                  <h3 className={`font-semibold ${colorClasses.text.darkNavy} text-sm md:text-base`}>
                    Pinned Announcements
                  </h3>
                </div>
                <div className="space-y-3">
                  {pinnedPosts.map((post) => (
                    <div key={post._id} className="transform transition-transform hover:scale-[1.02]">
                      <PostCard
                        post={post}
                        currentUserId={user?._id}
                        onViewProfile={handleViewProfile}
                        condensed={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section */}
            {activeTab === 'trending' && trendingPosts.length > 0 && (
              <div className={`px-4 md:px-6 py-4 ${colorClasses.bg.blue} bg-opacity-10 border-b`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={`w-4 h-4 ${colorClasses.text.blue}`} />
                  <h3 className={`font-semibold ${colorClasses.text.darkNavy} text-sm md:text-base`}>
                    Trending Now
                  </h3>
                </div>
                <div className="space-y-3">
                  {trendingPosts.map((post) => (
                    <div key={post._id} className="transform transition-transform hover:scale-[1.02]">
                      <PostCard
                        post={post}
                        currentUserId={user?._id}
                        onViewProfile={handleViewProfile}
                        condensed={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed Content */}
            <TabsContent value={activeTab} className="m-0">
              <div className="p-4 md:p-6">
                {feedPosts.length === 0 && !loading ? (
                  <div className="text-center py-8">
                    <div className={`w-12 h-12 ${colorClasses.bg.blue} bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Sparkles className={`w-6 h-6 ${colorClasses.text.blue}`} />
                    </div>
                    <h3 className={`text-base md:text-lg font-semibold ${colorClasses.text.darkNavy} mb-2`}>
                      No posts yet
                    </h3>
                    <p className={`${colorClasses.text.gray800} text-sm mb-4`}>
                      {activeTab === 'following'
                        ? 'Follow more people to see their posts here'
                        : 'Be the first to share something!'}
                    </p>
                    {activeTab !== 'following' && (
                      <Button
                        onClick={() => document.getElementById('post-composer')?.scrollIntoView({ behavior: 'smooth' })}
                        variant="default"
                        className={`${colorClasses.bg.blue} hover:${colorClasses.bg.darkNavy} text-white text-sm`}
                      >
                        Create First Post
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedPosts.map((post: Post, index) => (
                      <div
                        key={post._id}
                        ref={index === feedPosts.length - 1 ? undefined : undefined}
                        className="transform transition-transform hover:scale-[1.01]"
                      >
                        <PostCard
                          post={post}
                          currentUserId={user?._id}
                          onViewProfile={handleViewProfile}
                        />
                      </div>
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
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

                    {/* End of Feed */}
                    {!hasMore && feedPosts.length > 0 && (
                      <div className="text-center py-6 border-t">
                        <div className={`w-8 h-8 ${colorClasses.bg.gray100} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <Zap className={`w-4 h-4 ${colorClasses.text.gray400}`} />
                        </div>
                        <p className={`${colorClasses.text.gray800} text-sm`}>
                          You`ve reached the end of the feed
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Simple Stats at Bottom */}
        <div className={`mt-6 text-center ${colorClasses.text.gray800} text-sm`}>
          <div className="inline-flex items-center gap-4">
            <span>📊 {feedPosts.length} posts loaded</span>
            <span>•</span>
            <span>🔄 Last updated: Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanySocialFeed() {
  return (
    <SocialDashboardLayout requiredRole="company">
      <RoleThemeProvider>
        <CompanySocialFeedContent />
      </RoleThemeProvider>
    </SocialDashboardLayout>
  );
}