/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/candidate/social/index.tsx - UPDATED WITH THEME & ANIMATIONS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import Head from 'next/head';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import PostComposer from '@/components/social/post/PostComposer';
import { PostCard } from '@/components/social/post/PostCard';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/social/ui/Badge';
import {
  TrendingUp,
  Sparkles,
  Plus,
  ArrowUp,
  RefreshCw,
  Search,
  Zap,
  Clock,
  Flame,
  MessageSquare,
  Eye,
  Share2,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  Users,
  Filter,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { postService, Post, FeedParams } from '@/services/postService';
import { followService } from '@/services/followService'; // NEW IMPORT
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';

interface FeedFilter {
  type?: 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement' | 'document';
  sortBy?: 'latest' | 'trending' | 'popular';
  hashtag?: string;
  author?: string;
}

function SocialFeedContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getButtonClasses, getTextClasses, getBgClasses, getPageBgStyle, getCardStyle, colors, role } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState<FeedFilter>({
    sortBy: 'latest'
  });
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    uniqueAuthors: 0
  });

  // NEW: Follow status management
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});
  const [isLoadingFollowStatus, setIsLoadingFollowStatus] = useState(false);
  const followStatusCache = useRef<Map<string, boolean>>(new Map());

  // Animation states
  const [pageLoaded, setPageLoaded] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------------------- Animation Initialization ---------------------- */
  useEffect(() => {
    setPageLoaded(true);

    // Staggered animations
    const timer1 = setTimeout(() => setHeroLoaded(true), 300);
    const timer2 = setTimeout(() => setStatsLoaded(true), 600);
    const timer3 = setTimeout(() => setSearchLoaded(true), 900);
    const timer4 = setTimeout(() => setPostsLoaded(true), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  /* ---------------------- Scroll to Top Handler ---------------------- */
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------------- NEW: Bulk Follow Status Fetch ---------------------- */
  const fetchBulkFollowStatus = useCallback(async (authorIds: string[]) => {
    if (!user?._id || authorIds.length === 0 || isLoadingFollowStatus) return;

    setIsLoadingFollowStatus(true);
    try {
      // Check cache first
      const uncachedIds: string[] = [];
      const cachedResults: Record<string, boolean> = {};

      authorIds.forEach(id => {
        const cached = followStatusCache.current.get(id);
        if (cached !== undefined) {
          cachedResults[id] = cached;
        } else {
          uncachedIds.push(id);
        }
      });

      // If all cached, use cache
      if (uncachedIds.length === 0) {
        setFollowStatuses(prev => ({ ...prev, ...cachedResults }));
        return;
      }

      // Fetch uncached IDs in bulk
      const bulkStatuses = await followService.getBulkFollowStatus(uncachedIds);
      
      // Update cache
      Object.entries(bulkStatuses).forEach(([userId, data]) => {
        if (data) {
          followStatusCache.current.set(userId, data.following || false);
        }
      });

      // Combine cached and fetched results
      const combinedResults = { ...cachedResults };
      Object.entries(bulkStatuses).forEach(([userId, data]) => {
        if (data) {
          combinedResults[userId] = data.following || false;
        }
      });

      setFollowStatuses(prev => ({ ...prev, ...combinedResults }));
    } catch (error) {
      console.error('Failed to fetch bulk follow status:', error);
      // Don't show error toast for background operation
    } finally {
      setIsLoadingFollowStatus(false);
    }
  }, [user?._id, isLoadingFollowStatus]);

  /* ---------------------- NEW: Update Follow Status When Posts Change ---------------------- */
  useEffect(() => {
    if (posts.length === 0 || !user?._id) return;

    // Get unique author IDs (excluding current user)
    const authorIds = Array.from(
      new Set(
        posts
          .map(post => post.author?._id)
          .filter(id => id && id !== user._id)
      )
    ) as string[];

    if (authorIds.length === 0) return;

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchBulkFollowStatus(authorIds);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [posts, user?._id, fetchBulkFollowStatus]);

  /* ---------------------- Initial Data Load ---------------------- */
  useEffect(() => {
    loadInitialData();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [filters]);

  /* ---------------------- Infinite Scroll Setup ---------------------- */
  useEffect(() => {
    if (!loading && hasMore && loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMorePosts();
          }
        },
        { threshold: 0.5 }
      );

      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore]);

  /* ---------------------- API Functions ---------------------- */
  const loadInitialData = async () => {
    setLoading(true);
    setPage(1);
    try {
      const feedParams: FeedParams = {
        page: 1,
        limit: isMobile ? 8 : 12,
        type: filters.type,
        hashtag: filters.hashtag,
        sortBy: filters.sortBy,
        author: filters.author
      };

      const response = await postService.getFeedPosts(feedParams, user?._id);

      if (response.success && response.data) {
        setPosts(response.data);
        setHasMore(!!response.pagination && response.pagination.page < response.pagination.pages);

        // Calculate stats
        const totalLikes = response.data.reduce((sum, post) => sum + (post.stats?.likes || 0), 0);
        const totalComments = response.data.reduce((sum, post) => sum + (post.stats?.comments || 0), 0);
        const uniqueAuthors = new Set(response.data.map(post => post.author._id)).size;

        setStats({
          totalPosts: response.data.length,
          totalLikes,
          totalComments,
          uniqueAuthors
        });
      } else {
        throw new Error(response.message || 'Failed to load posts');
      }
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load feed posts"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const feedParams: FeedParams = {
        page: nextPage,
        limit: isMobile ? 8 : 12,
        type: filters.type,
        hashtag: filters.hashtag,
        sortBy: filters.sortBy,
        author: filters.author
      };

      const response = await postService.getFeedPosts(feedParams, user?._id);

      if (response.success && response.data && response.data.length > 0) {
        setPosts(prev => [...prev, ...response.data]);
        setPage(nextPage);
        setHasMore(!!response.pagination && response.pagination.page < response.pagination.pages);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error loading more posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load more posts"
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- NEW: Handle Follow Status Update ---------------------- */
  const handleFollowChange = useCallback((userId: string, isFollowing: boolean) => {
    // Update local state
    setFollowStatuses(prev => ({
      ...prev,
      [userId]: isFollowing
    }));
    
    // Update cache
    followStatusCache.current.set(userId, isFollowing);
  }, []);

  /* ---------------------- Event Handlers ---------------------- */
  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    toast({
      variant: "success",
      title: "Success",
      description: "Your post has been published"
    });
    setIsCreating(false);
  }, [toast]);

  const handlePostUpdated = useCallback((updatedPost: Post) => {
    setPosts(prev => prev.map(post =>
      post._id === updatedPost._id ? updatedPost : post
    ));
  }, []);

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    toast({
      variant: "success",
      title: "Success",
      description: "Post deleted successfully"
    });
  }, [toast]);

  const handleViewProfile = (userId: string) => {
    window.open(`/dashboard/${role}/social/profile/${userId}`, '_blank');
  };

  const handleFilterChange = (newFilters: Partial<FeedFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (isMobile) {
      setShowFilters(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Clear follow cache on refresh
    followStatusCache.current.clear();
    setFollowStatuses({});
    await loadInitialData();
    setIsRefreshing(false);
    toast({
      variant: "default",
      title: "Feed refreshed",
      description: "Latest posts loaded"
    });
  };

  const clearAllFilters = () => {
    setFilters({
      sortBy: 'latest'
    });
    setSearchQuery('');
    if (isMobile) {
      setShowFilters(false);
    }
  };

  /* ---------------------- Filtered Posts ---------------------- */
  const filteredPosts = searchQuery
    ? posts.filter(post =>
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : posts;

  /* ---------------------- Component Rendering ---------------------- */
  const renderEmptyState = () => (
    <div className="text-center py-12 px-4 md:py-16 animate-in fade-in-up duration-700">
      <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce animate-duration-[3s]`}
        style={{ background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%)` }}>
        <Sparkles className="w-8 h-8 md:w-10 md:h-10" style={{ color: colors.primary }} />
      </div>
      <h3 className={`text-lg md:text-xl font-semibold mb-3 animate-in fade-in-up duration-500 ${getTextClasses('primary')}`}>
        {searchQuery ? "No posts found" : "Welcome to your professional feed"}
      </h3>
      <p className={`text-sm md:text-base mb-6 md:mb-8 max-w-md mx-auto animate-in fade-in-up duration-500 animate-delay-200 ${getTextClasses('muted')}`}>
        {searchQuery
          ? `No posts found for "${searchQuery}". Try a different search term.`
          : "Connect with professionals, share insights, and discover opportunities. Start by creating your first post!"}
      </p>
      {!searchQuery && (
        <Button
          onClick={() => setIsCreating(true)}
          className={`px-5 py-2.5 md:px-6 md:py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-500 animate-delay-400 ${getButtonClasses('primary')}`}
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          Create Your First Post
        </Button>
      )}
    </div>
  );

  const QuickStats = () => (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
      <div className={`rounded-xl p-4 border animate-in fade-in-up duration-500`} style={getCardStyle()}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs md:text-sm mb-1 ${getTextClasses('muted')}`}>Posts</p>
            <p className={`text-xl md:text-2xl font-bold ${getTextClasses('primary')}`}>{stats.totalPosts}</p>
          </div>
          <MessageSquare className="w-6 h-6 md:w-8 md:h-8" style={{ color: colors.primary }} />
        </div>
      </div>

      <div className={`rounded-xl p-4 border animate-in fade-in-up duration-500 animate-delay-100`} style={getCardStyle()}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs md:text-sm mb-1 ${getTextClasses('muted')}`}>Likes</p>
            <p className={`text-xl md:text-2xl font-bold ${getTextClasses('primary')}`}>{stats.totalLikes}</p>
          </div>
          <Eye className="w-6 h-6 md:w-8 md:h-8" style={{ color: colors.success || '#10B981' }} />
        </div>
      </div>

      <div className={`rounded-xl p-4 border animate-in fade-in-up duration-500 animate-delay-200`} style={getCardStyle()}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs md:text-sm mb-1 ${getTextClasses('muted')}`}>Comments</p>
            <p className={`text-xl md:text-2xl font-bold ${getTextClasses('primary')}`}>{stats.totalComments}</p>
          </div>
          <Share2 className="w-6 h-6 md:w-8 md:h-8" style={{ color: colors.secondary }} />
        </div>
      </div>

      <div className={`rounded-xl p-4 border animate-in fade-in-up duration-500 animate-delay-300`} style={getCardStyle()}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs md:text-sm mb-1 ${getTextClasses('muted')}`}>Authors</p>
            <p className={`text-xl md:text-2xl font-bold ${getTextClasses('primary')}`}>{stats.uniqueAuthors}</p>
          </div>
          <Users className="w-6 h-6 md:w-8 md:h-8" style={{ color: colors.accent }} />
        </div>
      </div>
    </div>
  );

  const renderPostSkeleton = () => (
    <div className={`space-y-4 md:space-y-6 ${isMobile ? 'px-4' : ''}`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`rounded-xl p-4 md:p-6 animate-pulse ${getBgClasses('card')} border`}
          style={getCardStyle()}
        >
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full ${getBgClasses('card')}`} />
            <div className="flex-1">
              <div className={`h-4 rounded w-1/4 mb-2 ${getBgClasses('card')}`} />
              <div className={`h-3 rounded w-1/3 ${getBgClasses('card')}`} />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-2 mb-4">
            <div className={`h-4 rounded w-full ${getBgClasses('card')}`} />
            <div className={`h-4 rounded w-2/3 ${getBgClasses('card')}`} />
          </div>

          {/* Media skeleton */}
          <div className={`h-48 rounded-lg ${getBgClasses('card')}`} />

          {/* Actions skeleton */}
          <div className="flex justify-between mt-4">
            <div className={`h-8 rounded w-24 ${getBgClasses('card')}`} />
            <div className={`h-8 rounded w-24 ${getBgClasses('card')}`} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderMobileFilterDrawer = () => {
    if (!showFilters) return null;

    return (
      <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-300">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFilters(false)}
        />
        <div className="absolute right-0 top-0 h-full w-80 shadow-xl animate-in slide-in-from-right-0 duration-300" style={getCardStyle()}>
          <div className="p-4 border-b" style={{ borderColor: colors.primary + '20' }}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${getTextClasses('primary')}`}>Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className={`p-2 rounded-lg transition-colors ${getButtonClasses('ghost')}`}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Sort Options */}
            <div>
              <h4 className={`text-sm font-medium mb-2 ${getTextClasses('secondary')}`}>Sort by</h4>
              <div className="space-y-2">
                {[
                  { value: 'latest', label: 'Latest', icon: Clock },
                  { value: 'trending', label: 'Trending', icon: Flame },
                  { value: 'popular', label: 'Popular', icon: TrendingUp }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange({ sortBy: option.value as any })}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${filters.sortBy === option.value
                      ? 'border shadow-sm scale-[1.02]'
                      : 'hover:scale-[1.01]'
                      }`}
                    style={{
                      background: filters.sortBy === option.value
                        ? colors.primary + '10'
                        : 'transparent',
                      borderColor: filters.sortBy === option.value
                        ? colors.primary + '30'
                        : 'transparent',
                      color: filters.sortBy === option.value
                        ? colors.primary
                        : getTextClasses('muted').includes('text-') ? '' : colors.primary + '80'
                    }}
                  >
                    <option.icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post Type Filters */}
            <div>
              <h4 className={`text-sm font-medium mb-2 ${getTextClasses('secondary')}`}>Post Type</h4>
              <div className="space-y-2">
                {[
                  { value: undefined, label: 'All Posts' },
                  { value: 'text', label: 'Text', icon: MessageSquare },
                  { value: 'image', label: 'Images', icon: ImageIcon },
                  { value: 'video', label: 'Videos', icon: Video },
                  { value: 'document', label: 'Documents', icon: FileText },
                  { value: 'link', label: 'Links', icon: LinkIcon }
                ].map((option) => (
                  <button
                    key={option.value || 'all'}
                    onClick={() => handleFilterChange({ type: option.value as any })}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${filters.type === option.value
                      ? 'border shadow-sm scale-[1.02]'
                      : 'hover:scale-[1.01]'
                      }`}
                    style={{
                      background: filters.type === option.value
                        ? colors.secondary + '10'
                        : 'transparent',
                      borderColor: filters.type === option.value
                        ? colors.secondary + '30'
                        : 'transparent',
                      color: filters.type === option.value
                        ? colors.secondary
                        : getTextClasses('muted').includes('text-') ? '' : colors.secondary + '80'
                    }}
                  >
                    {option.icon && <option.icon className="w-4 h-4" />}
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            <button
              onClick={clearAllFilters}
              className={`w-full py-2.5 mt-4 text-sm font-medium rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${getButtonClasses('outline')}`}
              style={{ color: colors.error || '#EF4444', borderColor: colors.error || '#EF4444' }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------------------- Main Render ---------------------- */
  return (
    <div
      ref={containerRef}
      className={`min-h-screen ${isMobile ? getBgClasses('page') : ''} ${pageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      style={!isMobile ? getPageBgStyle() : {}}
    >
      {/* Animated Background Elements */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 right-1/4 w-64 h-64 rounded-full blur-3xl animate-float animate-duration-[20s] animate-delay-0"
            style={{ background: `${colors.primary}05` }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float animate-duration-[25s] animate-delay-1000"
            style={{ background: `${colors.secondary}05` }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full blur-3xl animate-float animate-duration-[30s] animate-delay-2000"
            style={{ background: `${colors.accent}05` }}
          />
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 animate-in bounce-in duration-500"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Filter Drawer */}
      {renderMobileFilterDrawer()}

      {/* Main Content */}
      <div className={isMobile ? '' : 'max-w-4xl mx-auto px-4 py-6 md:px-6 lg:px-8'}>
        {/* Header */}
        {!isMobile && (
          <div className="mb-6 md:mb-8">
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
              <div>
                <h1
                  className={`text-2xl md:text-3xl font-bold mb-2 animate-text bg-gradient-to-r from-primary to-secondary bg-clip-text`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Professional Network
                </h1>
                <p className={`text-sm md:text-base ${getTextClasses('muted')}`}>
                  Connect, share, and grow with your {role} community
                </p>
              </div>

              {/* Desktop Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  loading={isRefreshing}
                  className={`${getButtonClasses('outline')} transform hover:scale-105 active:scale-95`}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
                <Button
                  onClick={() => setIsCreating(true)}
                  className={`${getButtonClasses('primary')} shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            {posts.length > 0 && <QuickStats />}

            {/* Search Bar */}
            <div className={`relative mb-6 ${searchLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, people, or hashtags..."
                className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${getBgClasses('card')} border`}
                style={{
                  ...getCardStyle(),
                  borderColor: colors.primary + '30',
                  color: getTextClasses('primary').includes('text-') ? '' : colors.primary,
                }}
              />
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${getTextClasses('secondary')}`}>
                  Filter by type
                </h3>
                <button
                  onClick={clearAllFilters}
                  className="text-xs transition-colors hover:underline"
                  style={{ color: colors.primary }}
                >
                  Clear filters
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange({ type: undefined })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${!filters.type
                    ? 'text-white shadow-md transform scale-[1.02]'
                    : `${getButtonClasses('outline')} hover:scale-105`
                    }`}
                  style={!filters.type ? {
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  } : {}}
                >
                  All
                </button>
                {[
                  { value: 'text', label: 'Text', icon: MessageSquare, color: colors.primary },
                  { value: 'image', label: 'Images', icon: ImageIcon, color: colors.success },
                  { value: 'video', label: 'Videos', icon: Video, color: colors.warning },
                  { value: 'document', label: 'Documents', icon: FileText, color: colors.secondary },
                  { value: 'link', label: 'Links', icon: LinkIcon, color: colors.accent }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange({ type: option.value as any })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${filters.type === option.value
                      ? 'border shadow-sm transform scale-[1.02]'
                      : `${getButtonClasses('outline')} hover:scale-105`
                      }`}
                    style={filters.type === option.value ? {
                      background: option.color + '10',
                      borderColor: option.color + '30',
                      color: option.color
                    } : {}}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange({ sortBy: 'latest' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${filters.sortBy === 'latest'
                    ? 'text-white shadow-sm transform scale-[1.05]'
                    : `${getBgClasses('card')} ${getTextClasses('muted')} hover:scale-105`
                    }`}
                  style={filters.sortBy === 'latest' ? {
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  } : {}}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  Latest
                </button>
                <button
                  onClick={() => handleFilterChange({ sortBy: 'trending' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${filters.sortBy === 'trending'
                    ? 'border shadow-sm transform scale-[1.05]'
                    : `${getBgClasses('card')} ${getTextClasses('muted')} hover:scale-105`
                    }`}
                  style={filters.sortBy === 'trending' ? {
                    background: colors.warning + '10',
                    borderColor: colors.warning + '30',
                    color: colors.warning
                  } : {}}
                >
                  <Flame className="w-3 h-3 inline mr-1" />
                  Trending
                </button>
                <button
                  onClick={() => handleFilterChange({ sortBy: 'popular' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${filters.sortBy === 'popular'
                    ? 'border shadow-sm transform scale-[1.05]'
                    : `${getBgClasses('card')} ${getTextClasses('muted')} hover:scale-105`
                    }`}
                  style={filters.sortBy === 'popular' ? {
                    background: colors.success + '10',
                    borderColor: colors.success + '30',
                    color: colors.success
                  } : {}}
                >
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Popular
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-sm" style={getCardStyle()}>
            <div className="flex items-center justify-between mb-3">
              <h1
                className={`text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text`}
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Feed
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(true)}
                  className={`p-2 rounded-lg transition-all duration-300 ${showFilters ? 'shadow-md scale-110' : 'hover:scale-110'} ${getButtonClasses(showFilters ? 'primary' : 'ghost')}`}
                  style={showFilters ? {
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  } : {}}
                  aria-label="Filters"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${getButtonClasses('ghost')}`}
                  aria-label="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <Button
                  onClick={() => setIsCreating(true)}
                  className={`p-2 transition-all duration-300 hover:scale-110 ${getButtonClasses('primary')}`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                  aria-label="Create post"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.primary }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className={`w-full pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 transition-all duration-300 ${getBgClasses('card')} border`}
                style={{
                  ...getCardStyle(),
                  borderColor: colors.primary + '30',
                  color: getTextClasses('primary').includes('text-') ? '' : colors.primary
                }}
              />
            </div>

            {/* Mobile Quick Filters */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              <button
                onClick={() => handleFilterChange({ type: undefined })}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-all duration-300 ${!filters.type
                  ? 'text-white shadow-sm transform scale-105'
                  : `${getBgClasses('card')} ${getTextClasses('muted')} hover:scale-105`
                  }`}
                style={!filters.type ? {
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                } : {}}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange({ sortBy: 'latest' })}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-all duration-300 ${filters.sortBy === 'latest'
                  ? 'text-white shadow-sm transform scale-105'
                  : `${getBgClasses('card')} ${getTextClasses('muted')} hover:scale-105`
                  }`}
                style={filters.sortBy === 'latest' ? {
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                } : {}}
              >
                Latest
              </button>
              <button
                onClick={() => handleFilterChange({ sortBy: 'trending' })}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-all duration-300 ${filters.sortBy === 'trending'
                  ? 'border shadow-sm transform scale-105'
                  : `${getBgClasses('card')} ${getTextClasses('muted')} hover:scale-105`
                  }`}
                style={filters.sortBy === 'trending' ? {
                  background: colors.warning + '10',
                  borderColor: colors.warning + '30',
                  color: colors.warning
                } : {}}
              >
                Trending
              </button>
              {filters.type && (
                <Badge
                  variant="secondary"
                  className="text-xs px-3 py-1.5 transition-all duration-300 hover:scale-105"
                  style={{
                    background: colors.secondary + '10',
                    borderColor: colors.secondary + '30',
                    color: colors.secondary
                  }}
                >
                  {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Posts Section */}
        <div className={isMobile ? '' : 'mb-8'}>
          {loading && posts.length === 0 ? (
            renderPostSkeleton()
          ) : filteredPosts.length === 0 ? (
            <div className={isMobile ? 'p-4' : ''}>
              {renderEmptyState()}
            </div>
          ) : (
            <div className={isMobile ? 'space-y-4' : 'space-y-4 md:space-y-6'}>
              {filteredPosts.map((post, index) => (
                <div
                  key={post._id}
                  className={`${isMobile ? 'px-4' : 'transform transition-all duration-300 hover:-translate-y-1'} ${postsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <PostCard
                    post={post}
                    currentUserId={user?._id}
                    onViewProfile={handleViewProfile}
                    onUpdatePost={handlePostUpdated}
                    condensed={isMobile}
                    className={isMobile ? '' : 'shadow-md hover:shadow-xl transition-shadow duration-300'}
                    isFollowing={followStatuses[post.author?._id] || false} // NEW: Pass follow status
                    onFollowChange={handleFollowChange} // NEW: Handle follow changes
                  />
                  {isMobile && index < filteredPosts.length - 1 && (
                    <div className="mt-4" style={{ borderColor: colors.primary + '10' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Load More Indicator */}
          {filteredPosts.length > 0 && hasMore && (
            <div ref={loadMoreRef} className="pt-6 md:pt-8 text-center">
              <div className={`inline-flex items-center gap-2 ${getTextClasses('muted')}`}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{
                  borderColor: colors.primary + '30',
                  borderTopColor: colors.primary
                }}></div>
                <span className="text-sm">Loading more posts...</span>
              </div>
            </div>
          )}

          {/* End of Feed */}
          {filteredPosts.length > 0 && !hasMore && !loading && (
            <div className={`pt-6 md:pt-8 text-center ${isMobile ? 'px-4' : 'mt-6 md:mt-8'}`}
              style={!isMobile ? { borderColor: colors.primary + '10' } : {}}
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 rounded-full flex items-center justify-center animate-bounce animate-duration-[3s]`}
                style={{ background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.secondary}10 100%)` }}>
                <Zap className="w-5 h-5 md:w-6 md:h-6" style={{ color: colors.primary }} />
              </div>
              <p className={`text-sm ${getTextClasses('muted')}`}>
                You`ve reached the end of your feed
              </p>
              <p className={`text-xs mt-1 ${getTextClasses('muted')}`}>
                Check back later for new updates
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats - Desktop Only */}
        {!isMobile && posts.length > 0 && (
          <div className={`mt-8 pt-6`} style={{ borderColor: colors.primary + '10' }}>
            <div className={`flex flex-wrap items-center justify-between text-sm ${getTextClasses('muted')}`}>
              <div className="flex items-center gap-4">
                <span>📊 {posts.length} posts loaded</span>
                <span style={{ color: colors.primary }}>•</span>
                <span>👥 {stats.uniqueAuthors} authors</span>
                <span style={{ color: colors.primary }}>•</span>
                <span>👍 {stats.totalLikes} total likes</span>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollToTop}
                  className="text-xs transform hover:scale-105"
                  style={{ color: colors.primary }}
                >
                  <ArrowUp className="w-3 h-3 mr-1" />
                  Back to top
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsCreating(false)}
          />
          <div className={`relative ${isMobile ? 'w-full h-full' : 'w-full max-w-2xl max-h-[90vh] overflow-hidden'} animate-in zoom-in duration-300`}>
            <PostComposer
              onPostCreated={handlePostCreated}
              onCancel={() => setIsCreating(false)}
              isModal={true}
              className={isMobile ? 'rounded-none h-full' : 'rounded-2xl'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialFeedPage() {
  return (
    <>
      <Head>
        <title>Feed | Banana Social</title>
        <meta name="description" content="Connect with professionals, share insights, and grow your network" />
      </Head>

      <SocialDashboardLayout requiredRole="candidate">
        <SocialFeedContent />
      </SocialDashboardLayout>
    </>
  );
}