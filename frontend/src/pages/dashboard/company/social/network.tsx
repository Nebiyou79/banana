/* eslint-disable @typescript-eslint/no-explicit-any */
// /pages/dashboard/[role]/social/network.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { followService, FollowStats, FollowSuggestion } from '@/services/followService';
import { profileService, Profile } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import NetworkList from '@/components/social/network/NetworkList';
import { SuggestionList } from '@/components/social/network/SuggestionList';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { Button } from '@/components/social/ui/Button';
import {
  Users2,
  UserCheck,
  UserPlus,
  TrendingUp,
  Sparkles,
  BarChart3,
  Eye,
  RefreshCw,
  ChevronRight,
  Bell,
  MessageSquare,
  Star,
  Zap,
  Heart,
  Award,
  ExternalLink,
  Network,
  X,
  AlertCircle,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';

// Component that uses theme context
const NetworkContent = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { colors, getButtonClasses, getTextClasses, getCardStyle, getBgClasses } = useTheme();

  const role = user?.role || 'company';
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'suggestions' | 'requests'>('followers');
  const [stats, setStats] = useState<FollowStats>({
    followers: 0,
    following: 0,
    pendingRequests: 0,
    totalConnections: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [algorithm, setAlgorithm] = useState<'hybrid' | 'skills' | 'popular' | 'connections'>('hybrid');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [suggestionData, setSuggestionData] = useState<FollowSuggestion[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation states
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Initialize animations
  useEffect(() => {
    setPageLoaded(true);

    const timer1 = setTimeout(() => setHeroLoaded(true), 300);
    const timer2 = setTimeout(() => setStatsLoaded(true), 600);
    const timer3 = setTimeout(() => setCardsLoaded(true), 900);
    const timer4 = setTimeout(() => setContentLoaded(true), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Fetch all network data with better error handling
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors

      // Fetch all data in parallel with timeout handling
      const [profile, statsData, suggestions] = await Promise.allSettled([
        profileService.getProfile().catch(e => {
          console.error('Profile fetch failed:', e);
          return null;
        }),
        followService.getFollowStats().catch(e => {
          console.error('Stats fetch failed:', e);
          // Return default stats on timeout or error
          return {
            followers: 0,
            following: 0,
            pendingRequests: 0,
            totalConnections: 0
          };
        }),
        followService.getFollowSuggestions({
          limit: 12,
          algorithm
        }).catch(e => {
          console.error('Suggestions fetch failed:', e);
          return [];
        })
      ]);

      // Handle profile result
      if (profile.status === 'fulfilled' && profile.value) {
        setUserProfile(profile.value);
      } else {
        setUserProfile(null);
      }

      // Handle stats result
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      } else {
        setStats({
          followers: 0,
          following: 0,
          pendingRequests: 0,
          totalConnections: 0
        });
      }

      // Handle suggestions result
      if (suggestions.status === 'fulfilled') {
        setSuggestionData(suggestions.value);
      } else {
        setSuggestionData([]);
      }

      // Check if any request failed
      const failedRequests = [
        profile.status === 'rejected',
        statsData.status === 'rejected',
        suggestions.status === 'rejected'
      ].filter(Boolean).length;

      if (failedRequests > 1) {
        setError('Some network data failed to load. Please try refreshing the page.');
        toast({
          title: "Partial Data Loaded",
          description: "Some network information may be incomplete",
          variant: "warning"
        });
      }

    } catch (error: any) {
      console.error('Error fetching network data:', error);
      setError('Failed to load network data. Please check your connection and try again.');

      // Show user-friendly error toast
      if (error.message?.includes('timeout')) {
        toast({
          title: "Connection Timeout",
          description: "Network data is taking longer than expected to load. Some features may be limited.",
          variant: "warning",
          duration: 5000
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load network data",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, toast, algorithm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      toast({
        title: "Search",
        description: `Searching for "${searchQuery}"`,
        variant: "default"
      });
    }
  };

  // Handle algorithm change for suggestions
  const handleAlgorithmChange = (algo: 'hybrid' | 'skills' | 'popular' | 'connections') => {
    setAlgorithm(algo);
    toast({
      title: "Algorithm Updated",
      description: `Now showing ${algo} suggestions`,
      variant: "default"
    });
  };

  // Get role-specific tips
  const getRoleTips = () => {
    const tips: Record<string, string[]> = {
      candidate: [
        'Connect with recruiters in your industry',
        'Follow companies you\'re interested in',
        'Engage with professionals in your field'
      ],
      company: [
        'Follow potential candidates',
        'Connect with industry leaders',
        'Build your employer brand'
      ],
      freelancer: [
        'Connect with potential clients',
        'Follow agencies in your niche',
        'Build relationships with other freelancers'
      ],
      admin: [
        'Monitor network activity',
        'Connect with all user types',
        'Manage community engagement'
      ],
      organization: [
        'Connect with partners',
        'Follow related organizations',
        'Build industry presence'
      ]
    };

    return tips[role] || [
      'Connect with people you know',
      'Follow interesting profiles',
      'Build meaningful relationships'
    ];
  };

  // Handle follow actions
  const handleFollowChange = (userId: string, following: boolean) => {
    // Update local state
    if (following) {
      setStats(prev => ({ ...prev, following: prev.following + 1 }));
    } else {
      setStats(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    toast({
      title: "Refreshing",
      description: "Updating network data...",
      variant: "default"
    });
    await fetchData();
    toast({
      title: "Refreshed",
      description: "Network data updated successfully",
      variant: "success"
    });
  };

  // Loading state with animation
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 rounded-full" style={{ borderColor: colors.primary + '20' }}></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin" style={{ borderColor: colors.primary }}></div>
          </div>
          <p className="mt-6 text-gray-600 animate-in fade-in-up duration-500">Loading your network...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: colors.error + '20' }}>
              <AlertCircle className="w-10 h-10" style={{ color: colors.error }} />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.error }}>Connection Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRefresh}
              className="gap-2"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white'
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${role}`)}
              style={{
                borderColor: colors.primary,
                color: colors.primary
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Filter Drawer
  const MobileFilterDrawer = () => (
    <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${showMobileFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setShowMobileFilters(false)}
      />
      <div className={`absolute right-0 top-0 h-full w-80 transform transition-transform duration-300 ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}`} style={getCardStyle()}>
        <div className="p-4 border-b" style={{ borderColor: colors.primary + '20' }}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${getTextClasses('primary')}`}>Filter Options</h3>
            <button
              onClick={() => setShowMobileFilters(false)}
              className={`p-2 rounded-lg transition-colors ${getButtonClasses('ghost')}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <h4 className={`text-sm font-medium mb-2 ${getTextClasses('secondary')}`}>Sort by</h4>
            <div className="space-y-2">
              {[
                { value: 'hybrid', label: 'Smart Suggestions' },
                { value: 'skills', label: 'Skills Match' },
                { value: 'connections', label: 'Mutual Connections' },
                { value: 'popular', label: 'Popular Profiles' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleAlgorithmChange(option.value as any);
                    setShowMobileFilters(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-200 ${algorithm === option.value
                    ? 'border shadow-sm'
                    : 'hover:scale-[1.01]'
                    }`}
                  style={{
                    background: algorithm === option.value
                      ? colors.primary + '10'
                      : 'transparent',
                    borderColor: algorithm === option.value
                      ? colors.primary + '30'
                      : 'transparent',
                    color: algorithm === option.value
                      ? colors.primary
                      : getTextClasses('muted').includes('text-') ? '' : colors.primary + '80'
                  }}
                >
                  <span className="text-sm">{option.label}</span>
                  {algorithm === option.value && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border animate-in slide-in-from-top-0 duration-500" style={{
          backgroundColor: colors.error + '10',
          borderColor: colors.error + '30'
        }}>
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.error }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: colors.error }}>Connection Issue</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="gap-1 text-sm"
              style={{ color: colors.error }}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-1/4 w-64 h-64 rounded-full blur-3xl animate-float animate-duration-[20s] animate-delay-0"
          style={{ background: `${colors.primary}05` }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float animate-duration-[25s] animate-delay-1000"
          style={{ background: `${colors.secondary}05` }}
        />
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer />

      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-6 animate-in slide-in-from-top-0 duration-500">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="p-2.5 rounded-xl shadow-md shrink-0"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white'
              }}
            >
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: colors.primary }}>
                {role === 'candidate' ? 'My Network' :
                  role === 'company' ? 'Connections' :
                    role === 'freelancer' ? 'Client Network' :
                      role === 'admin' ? 'Admin Network' : 'Network'}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">
                Grow your professional circle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 animate-in fade-in-up duration-500 animate-delay-300">
            <button
              className={cn(
                "px-3 sm:px-5 py-2 rounded-lg font-medium transition-all duration-300 text-sm",
                "flex items-center gap-2",
                "hover:opacity-90 focus:outline-none shadow-md"
              )}
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white'
              }}
              onClick={() => router.push(`/dashboard/${role}/social/profile`)}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={handleRefresh}
              style={{ color: colors.primary }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`grid grid-cols-4 gap-2 sm:gap-4 mb-6 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:mb-2">
                <span className={`text-xs font-medium ${getTextClasses('muted')} hidden sm:block`}>Followers</span>
                <div
                  className="p-1.5 rounded-lg hidden sm:flex"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <Users2 className="w-4 h-4" style={{ color: colors.primary }} />
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {followService.formatFollowerCount(stats.followers)}
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>
                Followers
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="hidden sm:flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${getTextClasses('muted')}`}>Following</span>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: colors.secondary + '15' }}>
                  <UserCheck className="w-4 h-4" style={{ color: colors.secondary }} />
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {followService.formatFollowerCount(stats.following)}
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>
                Following
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="hidden sm:flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${getTextClasses('muted')}`}>Requests</span>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: colors.warning + '15' }}>
                  <Bell className="w-4 h-4" style={{ color: colors.warning }} />
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {stats.pendingRequests}
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>
                Requests
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="hidden sm:flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${getTextClasses('muted')}`}>Growth</span>
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: colors.success + '15' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: colors.success }} />
                </div>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {stats.followers > 0 ? Math.round((stats.following / stats.followers) * 100) : 0}%
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>
                Ratio
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 animate-in fade-in-up duration-500">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.primary }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connections..."
              className={`w-full pl-10 pr-16 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${getBgClasses('card')} border text-sm`}
              style={{
                ...getCardStyle(),
                borderColor: colors.primary + '30',
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2 text-xs"
              style={{ color: colors.primary }}
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Profile & Network Quality Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${cardsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
          {/* Profile Card */}
          {userProfile && (
            <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative shrink-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: 'white'
                      }}
                    >
                      {userProfile.user.avatar ? (
                        <img
                          src={userProfile.user.avatar}
                          alt={userProfile.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-base font-bold">
                          {profileService.getInitials(userProfile.user.name)}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full shadow" style={{ backgroundColor: colors.info }}>
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Star className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm ${getTextClasses('primary')} truncate`}>{userProfile.user.name}</h3>
                    <p className={`text-xs ${getTextClasses('muted')} truncate`}>{userProfile.headline || 'No headline set'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getBgClasses('card')} ${getTextClasses('secondary')}`}>
                        {profileService.getDisplayRole(userProfile.user.role)}
                      </span>
                      {userProfile.verificationStatus === 'verified' && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                          <Award className="w-2.5 h-2.5" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div>
                    <div className={`text-lg font-bold ${getTextClasses('primary')}`}>{stats.followers}</div>
                    <div className={`text-xs ${getTextClasses('muted')}`}>Followers</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${getTextClasses('primary')}`}>{stats.following}</div>
                    <div className={`text-xs ${getTextClasses('muted')}`}>Following</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${getTextClasses('primary')}`}>
                      {userProfile.socialStats?.profileViews || 0}
                    </div>
                    <div className={`text-xs ${getTextClasses('muted')}`}>Views</div>
                  </div>
                </div>

                <button
                  className={cn(
                    "w-full py-2 rounded-lg font-medium transition-all text-sm",
                    "flex items-center justify-center gap-2",
                    "hover:opacity-90 focus:outline-none shadow-sm"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: 'white'
                  }}
                  onClick={() => router.push(`/dashboard/${role}/social/profile`)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Profile
                </button>
              </div>
            </div>
          )}

          {/* Network Quality Card */}
          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="p-3 rounded-xl shadow-md animate-pulse"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: 'white'
                  }}
                >
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-semibold ${getTextClasses('primary')}`}>Network Quality</h3>
                  <p className={`text-sm ${getTextClasses('muted')}`}>Your network health score</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="animate-in fade-in-up duration-500">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={getTextClasses('muted')}>Following</span>
                    <span className={`font-medium ${getTextClasses('primary')}`}>{stats.following}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.primary + '20' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((stats.following / 500) * 100, 100)}%`,
                        backgroundColor: colors.primary
                      }}
                    ></div>
                  </div>
                </div>

                <div className="animate-in fade-in-up duration-500 animate-delay-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={getTextClasses('muted')}>Followers</span>
                    <span className={`font-medium ${getTextClasses('primary')}`}>{stats.followers}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.success + '20' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((stats.followers / 1000) * 100, 100)}%`,
                        backgroundColor: colors.success
                      }}
                    ></div>
                  </div>
                </div>

                <div className="animate-in fade-in-up duration-500 animate-delay-400">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={getTextClasses('muted')}>Engagement</span>
                    <span className={`font-medium ${getTextClasses('primary')}`}>
                      {stats.followers > 0 ? Math.round((stats.totalConnections / stats.followers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.secondary + '20' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((stats.totalConnections / (stats.followers || 1)) * 100, 100)}%`,
                        backgroundColor: colors.secondary
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-6 border-t animate-in fade-in-up duration-500 animate-delay-600" style={{ borderColor: colors.primary + '20' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-lg font-bold ${getTextClasses('primary')}`}>
                      {followService.getNetworkQuality(stats.followers, stats.following).label}
                    </div>
                    <div className={`px-3 py-1 text-xs font-medium rounded-full border animate-pulse ${followService.getNetworkQuality(stats.followers, stats.following).level === 'excellent'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : followService.getNetworkQuality(stats.followers, stats.following).level === 'good'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : followService.getNetworkQuality(stats.followers, stats.following).level === 'average'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                      {followService.getNetworkQuality(stats.followers, stats.following).level.toUpperCase()}
                    </div>
                  </div>
                  <p className={`text-sm ${getTextClasses('muted')}`}>
                    {followService.getNetworkQuality(stats.followers, stats.following).description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Networking Tips */}
        <div className={`rounded-xl border shadow-sm ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`} style={getCardStyle()}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="p-3 rounded-xl shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white'
                }}
              >
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-semibold ${getTextClasses('primary')}`}>Networking Tips</h3>
                <p className={`text-sm ${getTextClasses('muted')}`}>Grow your network effectively</p>
              </div>
            </div>

            <div className="space-y-4">
              {getRoleTips().map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 group hover:bg-gray-50 p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.01] animate-in fade-in-up duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-shadow"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      color: 'white'
                    }}
                  >
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className={`text-sm ${getTextClasses('primary')}`}>{tip}</p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-6 gap-2 transform hover:scale-105 active:scale-95"
              onClick={() => router.push(`/dashboard/${role}/social/help/networking`)}
              style={{
                borderColor: colors.primary,
                color: colors.primary
              }}
            >
              View More Tips
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Network Lists Tabs */}
        <div className={`rounded-xl border shadow-sm ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 animate-delay-300`} style={getCardStyle()}>
          <div className="border-b" style={{ borderColor: colors.primary + '20' }}>
            <div className="flex p-1.5 gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('followers')}
                className={cn(
                  "flex-1 min-w-0 px-2 sm:px-4 py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 whitespace-nowrap",
                  activeTab === 'followers'
                    ? "text-white shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                style={activeTab === 'followers' ? {
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                } : {}}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Followers</span>
                  <span className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full leading-none",
                    activeTab === 'followers'
                      ? "bg-white/20 text-white"
                      : `${getBgClasses('card')} ${getTextClasses('muted')}`
                  )}>
                    {stats.followers}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('following')}
                className={cn(
                  "flex-1 min-w-0 px-2 sm:px-4 py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 whitespace-nowrap",
                  activeTab === 'following'
                    ? "text-white shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                style={activeTab === 'following' ? {
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                } : {}}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Following</span>
                  <span className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full leading-none",
                    activeTab === 'following'
                      ? "bg-white/20 text-white"
                      : `${getBgClasses('card')} ${getTextClasses('muted')}`
                  )}>
                    {stats.following}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('suggestions')}
                className={cn(
                  "flex-1 min-w-0 px-2 sm:px-4 py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 whitespace-nowrap",
                  activeTab === 'suggestions'
                    ? "text-white shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                style={activeTab === 'suggestions' ? {
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                } : {}}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Suggest</span>
                </div>
              </button>

              {stats.pendingRequests > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 min-w-0 px-2 sm:px-4 py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 whitespace-nowrap",
                    activeTab === 'requests'
                      ? "text-white shadow-sm"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  style={activeTab === 'requests' ? {
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  } : { color: colors.error || '#EF4444' }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Requests</span>
                    <span className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full leading-none",
                      activeTab === 'requests'
                        ? "bg-white/20 text-white"
                        : "bg-red-100 text-red-700"
                    )}>
                      {stats.pendingRequests}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {activeTab === 'followers' && (
              <NetworkList
                type="followers"
                title="Your Followers"
                limit={10}
                showSearch={true}
                showFilter={true}
                showRefresh={true}
                currentUserId={user?._id}
                onConnectionCountChange={(count) => {
                  setStats(prev => ({ ...prev, followers: count }));
                }}
                className="p-4"
                showPagination={true}
              />
            )}

            {activeTab === 'following' && (
              <NetworkList
                type="following"
                title="People You Follow"
                limit={10}
                showSearch={true}
                showFilter={true}
                showRefresh={true}
                currentUserId={user?._id}
                onConnectionCountChange={(count) => {
                  setStats(prev => ({ ...prev, following: count }));
                }}
                className="p-4"
                showPagination={true}
              />
            )}

            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className={`text-sm sm:text-base font-semibold ${getTextClasses('primary')} truncate`}>People You May Know</h3>
                    <p className={`text-xs ${getTextClasses('muted')} hidden sm:block`}>Based on your profile and connections</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={algorithm}
                      onChange={(e) => handleAlgorithmChange(e.target.value as any)}
                      className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:border-transparent ${getBgClasses('card')}`}
                      style={{ borderColor: colors.primary + '30' }}
                    >
                      <option value="hybrid">Smart</option>
                      <option value="skills">Skills</option>
                      <option value="connections">Mutual</option>
                      <option value="popular">Popular</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      className="p-1.5 h-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {suggestionData.length > 0 ? (
                  <SuggestionList
                    algorithm={algorithm}
                    title=""
                    limit={6}
                    showHeader={false}
                    showFilters={false}
                    showRefresh={false}
                    maxSuggestions={50}
                    currentUserId={user?._id}
                    onSuggestionFollowed={(userId) => {
                      handleFollowChange(userId, true);
                      toast({
                        title: "Followed",
                        description: "User added to your network",
                        variant: "default"
                      });
                    }}
                    className="p-0"
                    variant="default"
                    initialSuggestions={suggestionData} // This now works!
                  />
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No suggestions available at the moment.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={handleRefresh}
                      style={{
                        borderColor: colors.primary,
                        color: colors.primary
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className={`grid grid-cols-3 gap-3 ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 animate-delay-600`}>
          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="p-2 rounded-lg inline-flex mb-2" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}05)` }}>
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primary }} />
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {userProfile?.socialStats?.engagementRate || 0}%
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>Engagement</div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="p-2 rounded-lg inline-flex mb-2" style={{ background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.secondary}05)` }}>
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.secondary }} />
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {userProfile?.socialStats?.averageResponseTime || 0}h
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>Response</div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300" style={getCardStyle()}>
            <div className="p-3 sm:p-5">
              <div className="p-2 rounded-lg inline-flex mb-2" style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}05)` }}>
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.accent }} />
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${getTextClasses('primary')}`}>
                {userProfile?.socialStats?.endorsementCount || 0}
              </div>
              <div className={`text-xs ${getTextClasses('muted')} mt-0.5`}>Endorsements</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`rounded-xl border shadow-sm ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 animate-delay-800`} style={getCardStyle()}>
          <div className="p-4 sm:p-5">
            <h3 className={`font-semibold text-sm ${getTextClasses('primary')} mb-3`}>Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 py-2.5 h-auto text-sm"
                onClick={() => router.push(`/dashboard/${role}/social/profile`)}
                style={{ borderColor: colors.primary + '30', color: colors.primary }}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="truncate">Edit Profile</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 py-2.5 h-auto text-sm"
                onClick={() => window.open('/api/network/export', '_blank')}
                style={{ borderColor: colors.accent + '30', color: colors.accent }}
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span className="truncate">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const NetworkPage = () => {
  const router = useRouter();
  const role = router.query.role as string || 'company';

  return (
    <>
      <Head>
        <title>Network | Banana Social</title>
      </Head>

      <SocialDashboardLayout requiredRole={role as any || 'company'}>
        <NetworkContent />
      </SocialDashboardLayout>
    </>
  );
};

export default NetworkPage;