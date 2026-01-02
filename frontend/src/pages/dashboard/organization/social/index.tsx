/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/organization/social/page.tsx - Organization Social Feed (CLEAN VERSION)
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { PostComposer } from '@/components/social/post/PostComposer';
import { PostCard } from '@/components/social/post/PostCard';
import { Button } from '@/components/social/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  TrendingUp,
  Users,
  Building2,
  Sparkles,
  RefreshCw,
  ArrowUp,
  Globe,
  Filter,
  Megaphone
} from 'lucide-react';
import { postService, Post, FeedParams } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import { colorClasses } from '@/utils/color';

type FeedType = 'all' | 'trending' | 'announcements' | 'team';

interface FeedFilter {
  type?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement';
  sortBy?: 'recent' | 'popular' | 'trending';
}

function OrganizationSocialFeedContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { colors, role } = useTheme();
  const [activeTab, setActiveTab] = useState<FeedType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>({
    sortBy: 'recent'
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(true);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Always show back to top button
  useEffect(() => {
    setShowBackToTop(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      const params: FeedParams = {
        page: pageNum,
        limit: 10,
        sortBy: filter.sortBy
      };

      if (activeTab === 'announcements') {
        params.type = 'job';
      } else if (activeTab === 'trending') {
        params.sortBy = 'trending';
      }

      const response = await postService.getFeedPosts(params);
      return {
        data: response.data || [],
        hasMore: response.pagination ? pageNum < response.pagination.pages : false
      };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load posts"
      });
      return { data: [], hasMore: false };
    }
  }, [activeTab, filter.sortBy, toast]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchPosts(1);
      setPosts(result.data);
      setHasMore(result.hasMore);
      setPage(2);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  // Load more posts
  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await fetchPosts(page);
      setPosts(prev => [...prev, ...result.data]);
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
    toast({
      variant: "default",
      title: "Feed refreshed",
      description: "Latest posts loaded"
    });
  };

  // Load initial data on mount and filter change
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleFilterChange = (key: keyof FeedFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    loadInitialData();
  };

  const handleViewProfile = (userId: string) => {
    window.location.href = `/social/profile/${userId}`;
  };

  const handlePostCreated = (post: Post) => {
    loadInitialData();
    toast({
      variant: "success",
      title: "Success",
      description: "Post created successfully"
    });
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${colorClasses.bg.teal} bg-opacity-20 flex items-center justify-center`}>
        <Building2 className={`w-8 h-8 ${colorClasses.text.teal}`} />
      </div>
      <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-2`}>
        Your organization feed is empty
      </h3>
      <p className={`${colorClasses.text.gray800} mb-6 max-w-md mx-auto`}>
        Share announcements, updates, and connect with your network
      </p>
      <Button
        onClick={() => document.getElementById('post-composer')?.scrollIntoView({ behavior: 'smooth' })}
        className={`${colorClasses.bg.teal} hover:${colorClasses.bg.darkNavy} text-white`}
      >
        <Megaphone className="w-4 h-4 mr-2" />
        Create Announcement
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
                🏛️ Organization Feed
              </h2>
              <p className={`${colorClasses.text.gray800} text-sm`}>
                Share announcements, updates, and connect with stakeholders
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                loading={isRefreshing}
                className={`text-xs md:text-sm ${colorClasses.border.darkNavy} ${colorClasses.text.darkNavy} hover:${colorClasses.bg.darkNavy} hover:text-white`}
                size="sm"
              >
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Post Composer */}
        <div className="mb-6">
          <PostComposer
            onPostCreated={handlePostCreated}
            roleContext="organization"
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
                    <Megaphone className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger
                    value="team"
                    className={`data-[state=active]:${colorClasses.bg.darkNavy} data-[state=active]:${colorClasses.text.white} text-xs md:text-sm`}
                  >
                    <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Team
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

            {/* Feed Content */}
            <TabsContent value={activeTab} className="m-0">
              <div className="p-4 md:p-6">
                {posts.length === 0 && !loading ? (
                  renderEmptyState()
                ) : (
                  <div className="space-y-4">
                    {posts.map((post: Post, index) => (
                      <div
                        key={post._id}
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
                    {!hasMore && posts.length > 0 && (
                      <div className="text-center py-6 border-t">
                        <div className={`w-8 h-8 ${colorClasses.bg.gray100} rounded-full flex items-center justify-center mx-auto mb-2`}>
                          <Sparkles className={`w-4 h-4 ${colorClasses.text.gray400}`} />
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
                )}

                {/* Loading State */}
                {loading && posts.length === 0 && renderPostSkeleton()}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Simple Stats */}
        <div className={`mt-6 text-center ${colorClasses.text.gray800} text-xs md:text-sm`}>
          <div className="inline-flex items-center gap-3 md:gap-4 flex-wrap justify-center">
            <span>🏛️ {posts.length} organization posts</span>
            <span>•</span>
            <span>📢 Announcements</span>
            <span>•</span>
            <span>🔄 Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationSocialFeed() {
  return (
    <SocialDashboardLayout requiredRole="organization">
      <RoleThemeProvider>
        <OrganizationSocialFeedContent />
      </RoleThemeProvider>
    </SocialDashboardLayout>
  );
}