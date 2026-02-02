/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import PostComposer from '@/components/social/post/PostComposer';
import { EditablePostCard } from '@/components/social/post/EditablePostCard';
import { Button } from '@/components/social/ui/Button';
import {
  Plus,
  Search,
  X,
  Filter,
  Grid,
  List,
  RefreshCw,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
  Pin,
  Calendar,
  Hash,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUp,
  Zap,
  Clock,
  Flame,
  Users,
  Globe,
  Lock,
  Star,
  Target
} from 'lucide-react';
import { postService, Post } from '@/services/postService';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
import { useMediaQuery } from '@/hooks/use-media-query';

type PostStatus = 'all' | 'active' | 'hidden' | 'deleted';
type PostType = 'all' | 'text' | 'image' | 'video' | 'link' | 'poll' | 'job' | 'achievement' | 'document';

interface PostStats {
  total: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  pinned: number;
  drafts: number;
}

function MyPostsPageContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { colors, getButtonClasses, getTextClasses, getBgClasses, getPageBgStyle, getCardStyle, getBorderClasses, role } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'list' : 'list');
  const [statusFilter, setStatusFilter] = useState<PostStatus>('all');
  const [typeFilter, setTypeFilter] = useState<PostType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'popular' | 'drafts'>('all');
  const [showComposer, setShowComposer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<PostStats>({
    total: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagement: 0,
    pinned: 0,
    drafts: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize animations
  useEffect(() => {
    const timer1 = setTimeout(() => setSearchLoaded(true), 200);
    const timer2 = setTimeout(() => setStatsLoaded(true), 400);
    const timer3 = setTimeout(() => setPostsLoaded(true), 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Scroll to top button visibility
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

  // Load posts on mount
  useEffect(() => {
    loadMyPosts();
  }, [statusFilter, typeFilter, activeTab]);

  const loadMyPosts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: isMobile ? 6 : 12
      };

      // Add status filter
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('📡 Loading my posts with params:', params);

      // Using the correct endpoint from postService
      const response = await postService.getMyPosts(params);

      const postsData = response.data || [];
      console.log('✅ Loaded posts:', postsData.length);
      setPosts(postsData);

      // Calculate stats
      const totalStats: PostStats = {
        total: postsData.length,
        views: postsData.reduce((sum, post) => sum + (post.stats?.views || 0), 0),
        likes: postsData.reduce((sum, post) => sum + (post.stats?.likes || 0), 0),
        comments: postsData.reduce((sum, post) => sum + (post.stats?.comments || 0), 0),
        shares: postsData.reduce((sum, post) => sum + (post.stats?.shares || 0), 0),
        pinned: postsData.filter(p => p.pinned).length,
        drafts: postsData.filter(p => p.visibility === 'private').length,
        engagement: postsData.length > 0 ?
          (postsData.reduce((sum, post) => {
            const views = post.stats?.views || 1;
            const engagement = ((post.stats?.likes || 0) + (post.stats?.comments || 0) + (post.stats?.shares || 0)) / views * 100;
            return sum + engagement;
          }, 0) / postsData.length) : 0
      };
      setStats(totalStats);

    } catch (error: any) {
      console.error('❌ Failed to load posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load your posts"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      await loadMyPosts();
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

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setShowComposer(false);
    toast({
      variant: "success",
      title: "Post Created",
      description: "Your post has been published successfully"
    });
  }, [toast]);

  const handlePostUpdated = useCallback((updatedPost: Post) => {
    setPosts(prev => prev.map(post =>
      post._id === updatedPost._id ? updatedPost : post
    ));
    toast({
      variant: "success",
      title: "Updated",
      description: "Post updated successfully"
    });
  }, [toast]);

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
    toast({
      variant: "success",
      title: "Deleted",
      description: "Post deleted successfully"
    });
  }, [toast]);

  // Filtered posts
  const filteredPosts = posts.filter(post => {
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = post.content?.toLowerCase().includes(query);
      const matchesHashtags = post.hashtags?.some(tag =>
        tag.toLowerCase().includes(query.replace('#', ''))
      );
      const matchesTitle = post.type === 'achievement' || post.type === 'job' || post.type === 'poll';

      if (!matchesContent && !matchesHashtags && !matchesTitle) {
        return false;
      }
    }

    // Apply type filter
    if (typeFilter !== 'all' && post.type !== typeFilter) {
      return false;
    }

    // Apply status filter
    if (statusFilter !== 'all' && post.status !== statusFilter) {
      return false;
    }

    // Apply tab filters
    if (activeTab === 'pinned') return post.pinned;
    if (activeTab === 'popular') {
      const engagement = ((post.stats?.likes || 0) + (post.stats?.comments || 0) + (post.stats?.shares || 0)) / (post.stats?.views || 1);
      return engagement > 0.1; // 10% engagement rate
    }
    if (activeTab === 'drafts') return post.visibility === 'private';
    return true;
  });

  // Get post type icon
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'poll': return <Target className="w-4 h-4" />;
      case 'job': return <Star className="w-4 h-4" />;
      case 'achievement': return <Sparkles className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Format number with abbreviations
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Loading skeleton with theme colors
  const renderPostSkeleton = () => (
    <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse animate-in fade-in-up duration-300" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="rounded-xl border p-4 animate-in slide-in-from-left-0 duration-500" style={getCardStyle()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: colors.primary + '20' }} />
                <div>
                  <div className="h-3 rounded w-32 mb-2" style={{ backgroundColor: colors.primary + '20' }} />
                  <div className="h-2 rounded w-24" style={{ backgroundColor: colors.secondary + '20' }} />
                </div>
              </div>
              <div className="w-6 h-6 rounded" style={{ backgroundColor: colors.accent + '20' }} />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 rounded w-full" style={{ backgroundColor: colors.primary + '10' }} />
              <div className="h-3 rounded w-2/3" style={{ backgroundColor: colors.primary + '10' }} />
            </div>
            <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: colors.primary + '20' }}>
              <div className="h-2 rounded w-12" style={{ backgroundColor: colors.secondary + '20' }} />
              <div className="h-2 rounded w-12" style={{ backgroundColor: colors.secondary + '20' }} />
              <div className="h-2 rounded w-12" style={{ backgroundColor: colors.secondary + '20' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state with theme
  const renderEmptyState = () => (
    <div className={`text-center py-12 ${isMobile ? 'px-4' : 'px-4 md:px-8'} animate-in fade-in-up duration-700`}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce animate-duration-[3s]"
        style={{ background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%)` }}>
        <Sparkles className="w-8 h-8" style={{ color: colors.primary }} />
      </div>
      <h3 className={`text-lg font-bold mb-2 animate-in fade-in-up duration-500 ${getTextClasses('primary')}`}>
        {searchQuery ? 'No Posts Found' : 'No Posts Yet'}
      </h3>
      <p className={`text-sm mb-6 max-w-md mx-auto animate-in fade-in-up duration-500 animate-delay-200 ${getTextClasses('muted')}`}>
        {searchQuery
          ? 'No posts match your search criteria. Try different filters.'
          : `Share your ${role === 'candidate' ? 'achievements' : role === 'company' ? 'company updates' : role === 'freelancer' ? 'portfolio work' : 'organization news'} with your network.`}
      </p>
      {!searchQuery && (
        <Button
          onClick={() => setShowComposer(true)}
          className={`px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-500 animate-delay-400 ${getButtonClasses('primary')}`}
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Post
        </Button>
      )}
    </div>
  );

  // Stat item component with theme animations
  const StatItem = ({ icon: Icon, label, value, color, delay = 0 }: any) => (
    <div
      className={`text-center p-3 rounded-lg border animate-in fade-in-up duration-500`}
      style={{
        ...getCardStyle(),
        animationDelay: `${delay}ms`,
        borderColor: color + '30'
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center mb-2 animate-pulse animate-duration-[2000ms]"
          style={{ backgroundColor: color + '10' }}
        >
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <div
          className="text-sm md:text-base font-bold animate-countup animate-duration-1000"
          style={{ color: colors.primary }}
        >
          {value}
        </div>
        <div className={`text-xs mt-1 ${getTextClasses('muted')}`}>{label}</div>
      </div>
    </div>
  );

  // Tab button with theme
  const TabButton = ({ active, onClick, icon: Icon, label, count, color }: any) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-300 flex items-center gap-1 whitespace-nowrap transform hover:scale-105 active:scale-95 ${active
        ? `${getButtonClasses('primary')} shadow-md`
        : `${getBgClasses('card')} ${getTextClasses('muted')} hover:${getTextClasses('primary')}`
        }`}
      style={active ? {
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
      } : {}}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
      {count !== undefined && <span>({count})</span>}
    </button>
  );

  return (
    <div
      className="min-h-screen animate-in fade-in duration-500"
      style={getPageBgStyle()}
      ref={containerRef}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full blur-3xl animate-float animate-duration-[15s]" style={{ background: `${colors.primary}10` }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float animate-duration-[20s] animate-delay-1000" style={{ background: `${colors.secondary}10` }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full blur-3xl animate-float animate-duration-[25s] animate-delay-2000" style={{ background: `${colors.accent}10` }} />
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-in bounce-in duration-500"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-lg animate-in slide-in-from-top-0 duration-500 ${isMobile ? 'px-4 py-3' : 'px-4 md:px-6 py-4'}`} style={getCardStyle()}>
        {isMobile ? (
          <div className="flex items-center justify-between animate-in fade-in-up duration-300">
            <div>
              <h1 className={`text-lg font-bold ${getTextClasses('primary')}`}>
                My Posts
              </h1>
              <p className={`text-xs ${getTextClasses('muted')} animate-in fade-in-up duration-500 animate-delay-200`}>
                Manage your {role} content
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshPosts}
                disabled={isRefreshing || loading}
                className="p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
                style={getCardStyle()}
                aria-label="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: colors.primary }} />
              </button>
              <button
                onClick={() => setShowComposer(true)}
                className="p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                }}
                aria-label="Create post"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto animate-in fade-in-up duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${getTextClasses('primary')} animate-text bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
                  My Posts
                </h1>
                <p className={`text-sm md:text-base ${getTextClasses('muted')} animate-in fade-in-up duration-500 animate-delay-200`}>
                  Manage and track your {role} content
                </p>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPosts}
                  disabled={isRefreshing || loading}
                  className={`${getButtonClasses('outline')} transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-500`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowComposer(true)}
                  size="sm"
                  className={`${getButtonClasses('primary')} transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-500 animate-delay-100`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={isMobile ? 'px-0' : 'px-4 py-4 md:px-6 lg:px-8'}>
        <div className={isMobile ? '' : 'max-w-7xl mx-auto'}>
          {/* Stats Overview */}
          {!isMobile && (
            <div className="mb-4 md:mb-6 animate-in fade-in-up duration-500">
              <div className="grid grid-cols-3 md:grid-cols-8 gap-2 md:gap-3">
                <StatItem
                  icon={BarChart3}
                  label="Total"
                  value={stats.total}
                  color={colors.primary}
                  delay={0}
                />
                <StatItem
                  icon={Eye}
                  label="Views"
                  value={formatNumber(stats.views)}
                  color="#10B981"
                  delay={100}
                />
                <StatItem
                  icon={Heart}
                  label="Likes"
                  value={formatNumber(stats.likes)}
                  color="#EF4444"
                  delay={200}
                />
                <StatItem
                  icon={MessageCircle}
                  label="Comments"
                  value={formatNumber(stats.comments)}
                  color="#F59E0B"
                  delay={300}
                />
                <StatItem
                  icon={Share2}
                  label="Shares"
                  value={formatNumber(stats.shares)}
                  color="#8B5CF6"
                  delay={400}
                />
                <StatItem
                  icon={Pin}
                  label="Pinned"
                  value={stats.pinned}
                  color="#3B82F6"
                  delay={500}
                />
                <StatItem
                  icon={Lock}
                  label="Drafts"
                  value={stats.drafts}
                  color="#6B7280"
                  delay={600}
                />
                <StatItem
                  icon={TrendingUp}
                  label="Engage"
                  value={`${stats.engagement.toFixed(1)}%`}
                  color={colors.secondary}
                  delay={700}
                />
              </div>
            </div>
          )}

          {/* Mobile Search and Tabs */}
          {isMobile && (
            <div className="px-4 space-y-3 mb-4 animate-in fade-in-up duration-300">
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4" style={{ color: colors.primary + '80' }} />
                </div>
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-300"
                  style={{
                    ...getCardStyle(),
                    border: `1px solid ${colors.primary}20`,
                    color: colors.primary,
                    backgroundColor: colors.primary + '05'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform duration-200"
                    style={{ color: colors.primary + '60' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                <TabButton
                  active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                  label={`All`}
                  count={posts.length}
                />
                <TabButton
                  active={activeTab === 'pinned'}
                  onClick={() => setActiveTab('pinned')}
                  icon={Pin}
                  label="Pinned"
                  count={posts.filter(p => p.pinned).length}
                />
                <TabButton
                  active={activeTab === 'popular'}
                  onClick={() => setActiveTab('popular')}
                  icon={TrendingUp}
                  label="Popular"
                />
              </div>
            </div>
          )}

          {/* Desktop Search and Controls */}
          {!isMobile && (
            <div className="mb-4 md:mb-6 space-y-3 md:space-y-4 animate-in fade-in-up duration-500">
              {/* Search Bar */}
              <div className="relative animate-in fade-in-up duration-300">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4" style={{ color: colors.primary + '80' }} />
                </div>
                <input
                  type="text"
                  placeholder="Search posts by content, hashtags, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300"
                  style={{
                    ...getCardStyle(),
                    border: `1px solid ${colors.primary}30`,
                    color: colors.primary,
                    backgroundColor: colors.primary + '05'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform duration-200"
                    style={{ color: colors.primary + '60' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tabs and Controls Row */}
              <div className="flex items-center justify-between animate-in fade-in-up duration-500 animate-delay-100">
                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: colors.primary + '10' }}>
                  <TabButton
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    label="All Posts"
                    count={posts.length}
                  />
                  <TabButton
                    active={activeTab === 'pinned'}
                    onClick={() => setActiveTab('pinned')}
                    icon={Pin}
                    label="Pinned"
                    count={posts.filter(p => p.pinned).length}
                  />
                  <TabButton
                    active={activeTab === 'popular'}
                    onClick={() => setActiveTab('popular')}
                    icon={TrendingUp}
                    label="Popular"
                  />
                  <TabButton
                    active={activeTab === 'drafts'}
                    onClick={() => setActiveTab('drafts')}
                    icon={Lock}
                    label="Drafts"
                    count={posts.filter(p => p.visibility === 'private').length}
                  />
                </div>

                {/* View and Filter Controls */}
                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: colors.primary + '10' }}>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-all duration-300 ${viewMode === 'list'
                        ? `${getButtonClasses('primary')} shadow-sm`
                        : `${getTextClasses('muted')} hover:${getTextClasses('primary')} hover:scale-110`
                        }`}
                      style={viewMode === 'list' ? {
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                      } : {}}
                    >
                      <List className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-all duration-300 ${viewMode === 'grid'
                        ? `${getButtonClasses('primary')} shadow-sm`
                        : `${getTextClasses('muted')} hover:${getTextClasses('primary')} hover:scale-110`
                        }`}
                      style={viewMode === 'grid' ? {
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                      } : {}}
                    >
                      <Grid className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`${getButtonClasses('outline')} transform hover:scale-105 active:scale-95`}
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    Filter
                    {showFilters ? (
                      <ChevronUp className="w-3 h-3 ml-1" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="animate-in slide-in-from-top-0 duration-300">
                  <div className="rounded-lg border p-4" style={getCardStyle()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Status Filter */}
                      <div>
                        <h3 className={`text-sm font-medium mb-2 ${getTextClasses('primary')}`}>Status</h3>
                        <div className="flex flex-wrap gap-1">
                          {(['all', 'active', 'hidden', 'deleted'] as PostStatus[]).map((status, index) => (
                            <button
                              key={status}
                              onClick={() => setStatusFilter(status)}
                              className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-500`}
                              style={{
                                animationDelay: `${index * 50}ms`,
                                ...(statusFilter === status ? {
                                  background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%)`,
                                  color: colors.primary,
                                  border: `1px solid ${colors.primary}30`
                                } : {
                                  ...getCardStyle(),
                                  color: colors.primary + '80',
                                  border: `1px solid ${colors.primary}10`
                                })
                              }}
                            >
                              {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <h3 className={`text-sm font-medium mb-2 ${getTextClasses('primary')}`}>Type</h3>
                        <div className="flex flex-wrap gap-1">
                          {(['all', 'text', 'image', 'video', 'link', 'poll', 'job', 'achievement', 'document'] as PostType[]).map((type, index) => (
                            <button
                              key={type}
                              onClick={() => setTypeFilter(type)}
                              className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-300 flex items-center gap-1 transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-500`}
                              style={{
                                animationDelay: `${index * 50}ms`,
                                ...(typeFilter === type ? {
                                  background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.secondary}20 100%)`,
                                  color: colors.primary,
                                  border: `1px solid ${colors.primary}30`
                                } : {
                                  ...getCardStyle(),
                                  color: colors.primary + '80',
                                  border: `1px solid ${colors.primary}10`
                                })
                              }}
                            >
                              {type !== 'all' && getPostTypeIcon(type)}
                              <span>{type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts Content */}
          <div className="min-h-[400px]">
            {loading ? (
              renderPostSkeleton()
            ) : filteredPosts.length === 0 ? (
              renderEmptyState()
            ) : viewMode === 'list' || isMobile ? (
              // List View - Full width on mobile
              <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
                {filteredPosts.map((post, index) => (
                  <div
                    key={post._id}
                    className="animate-in slide-in-from-left-0 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <EditablePostCard
                      post={post}
                      currentUserId={user?._id || ''}
                      onUpdate={handlePostUpdated}
                      onDelete={handlePostDeleted}
                      className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                    />
                    {isMobile && index < filteredPosts.length - 1 && (
                      <div className="mx-4 h-px animate-in fade-in duration-300" style={{ backgroundColor: colors.primary + '20' }} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Grid View (Desktop only)
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredPosts.map((post, index) => (
                  <div
                    key={post._id}
                    className="animate-in fade-in-up duration-500 transform transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <EditablePostCard
                      post={post}
                      currentUserId={user?._id || ''}
                      onUpdate={handlePostUpdated}
                      onDelete={handlePostDeleted}
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {filteredPosts.length > 0 && !loading && (
            <div className={`mt-6 md:mt-8 text-center ${isMobile ? 'px-4' : ''} animate-in fade-in-up duration-500 animate-delay-300`}>
              <Button
                variant="outline"
                onClick={loadMyPosts}
                disabled={isRefreshing}
                className={`${getButtonClasses('outline')} transform hover:scale-105 active:scale-95`}
              >
                {isRefreshing ? (
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

      {/* Floating Action Button */}
      {!showComposer && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-50 animate-in bounce-in duration-500 animate-delay-500 transform hover:scale-110 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
          aria-label="Create new post"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Post Creation Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div
            className="absolute inset-0 backdrop-blur-sm transition-all duration-300"
            style={{ backgroundColor: colors.primary + '80' }}
            onClick={() => setShowComposer(false)}
          />
          <div className={`relative animate-in zoom-in duration-300 ${isMobile ? 'w-full h-full max-h-screen overflow-auto' : 'w-full max-w-2xl mx-4'}`}>
            <PostComposer
              onPostCreated={handlePostCreated}
              onCancel={() => setShowComposer(false)}
              isModal={true}
              className={isMobile ? 'rounded-none h-full' : 'rounded-2xl'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyPostsPage() {
  return (
    <SocialDashboardLayout requiredRole="candidate">
      <MyPostsPageContent />
    </SocialDashboardLayout>
  );
}