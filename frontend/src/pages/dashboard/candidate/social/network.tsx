/* eslint-disable @typescript-eslint/no-explicit-any */
// /pages/dashboard/[role]/social/network.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { followService, FollowStats, FollowSuggestion } from '@/services/followService';
import { profileService, Profile } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import NetworkList from '@/components/social/network/NetworkList';
import { SuggestionList } from '@/components/social/network/SuggestionList';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { Card } from '@/components/social/ui/Card';
import { Button } from '@/components/social/ui/Button';
import {
  Users2,
  UserCheck,
  UserPlus,
  Search,
  TrendingUp,
  Sparkles,
  BarChart3,
  Loader2,
  Eye,
  RefreshCw,
  ChevronRight,
  Bell,
  MessageSquare,
  Star,
  Zap,
  Heart,
  Award,
  Mail,
  ExternalLink,
  Network,
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';
// Component that uses theme context
const NetworkContent = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { colors, getButtonClasses, getTextClasses, getCardStyle, getPageBgStyle, getBgClasses } = useTheme();

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

  // Fetch all network data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setIsLoading(true);

        // Fetch user profile
        const profile = await profileService.getProfile();
        setUserProfile(profile);

        // Fetch follow stats
        const statsData = await followService.getFollowStats();
        setStats(statsData);

        // Fetch suggestions
        const suggestions = await followService.getFollowSuggestions({
          limit: 12,
          algorithm
        });
        setSuggestionData(suggestions);

      } catch (error) {
        console.error('Error fetching network data:', error);
        toast({
          title: "Error",
          description: "Failed to load network data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, toast, algorithm]);

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
    <div className={`max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 animate-in slide-in-from-top-0 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-3 rounded-2xl shadow-lg animate-in spin-in duration-1000"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: 'white'
                }}
              >
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-text">
                  {role === 'candidate' ? 'Professional Network' :
                    role === 'company' ? 'Business Connections' :
                      role === 'freelancer' ? 'Client Network' :
                        role === 'admin' ? 'Admin Network' : 'Organization Network'}
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage connections and grow your professional circle
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 animate-in fade-in-up duration-500 animate-delay-300">
            <button
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-300",
                "flex items-center gap-3 transform hover:scale-105 active:scale-95",
                "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:shadow-xl"
              )}
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white'
              }}
              onClick={() => router.push(`/dashboard/${role}/social/explore`)}
            >
              <UserPlus className="w-5 h-5" />
              Find People
            </button>

            <Button
              variant="outline"
              size="lg"
              className="gap-3 px-6 transform hover:scale-105 active:scale-95"
              onClick={() => router.push(`/dashboard/${role}/social/invite`)}
              style={{
                borderColor: colors.primary,
                color: colors.primary
              }}
            >
              <Mail className="w-5 h-5" />
              Invite Contacts
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 ${statsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${getTextClasses('muted')}`}>Followers</span>
                <div
                  className="p-2 rounded-lg animate-pulse"
                  style={{
                    backgroundColor: colors.primary + '15',
                  }}
                >
                  <Users2 className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 animate-countup animate-duration-1000 ${getTextClasses('primary')}`}>
                {followService.formatFollowerCount(stats.followers)}
              </div>
              <div className={`text-sm ${getTextClasses('muted')}`}>
                People who follow you
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-delay-100" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${getTextClasses('muted')}`}>Following</span>
                <div
                  className="p-2 rounded-lg animate-pulse animate-delay-200"
                  style={{
                    backgroundColor: colors.secondary + '15',
                  }}
                >
                  <UserCheck className="w-5 h-5" style={{ color: colors.secondary }} />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 animate-countup animate-duration-1000 animate-delay-200 ${getTextClasses('primary')}`}>
                {followService.formatFollowerCount(stats.following)}
              </div>
              <div className={`text-sm ${getTextClasses('muted')}`}>
                People you follow
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-delay-200" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${getTextClasses('muted')}`}>Requests</span>
                <div className="p-2 rounded-lg animate-pulse animate-delay-400" style={{ backgroundColor: colors.warning + '15' }}>
                  <Bell className="w-5 h-5" style={{ color: colors.warning }} />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 animate-countup animate-duration-1000 animate-delay-400 ${getTextClasses('primary')}`}>
                {stats.pendingRequests}
              </div>
              <div className={`text-sm ${getTextClasses('muted')}`}>
                Pending requests
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-delay-300" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${getTextClasses('muted')}`}>Growth</span>
                <div className="p-2 rounded-lg animate-pulse animate-delay-600" style={{ backgroundColor: colors.success + '15' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: colors.success }} />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 animate-countup animate-duration-1000 animate-delay-600 ${getTextClasses('primary')}`}>
                {stats.followers > 0 ? Math.round((stats.following / stats.followers) * 100) : 0}%
              </div>
              <div className={`text-sm ${getTextClasses('muted')}`}>
                Following ratio
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 animate-in fade-in-up duration-500">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connections by name, title, company, or skills..."
              className={`w-full pl-12 pr-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${getBgClasses('card')} border`}
              style={{
                ...getCardStyle(),
                borderColor: colors.primary + '30',
                color: getTextClasses('primary').includes('text-') ? '' : colors.primary,
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors"
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
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${cardsLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
          {/* Profile Card */}
          {userProfile && (
            <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-in slide-in-from-left-0 duration-500" style={getCardStyle()}>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg animate-float animate-duration-[6s]"
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
                        <span className="text-white text-xl font-bold">
                          {profileService.getInitials(userProfile.user.name)}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full shadow-lg" style={{ backgroundColor: colors.info }}>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${getTextClasses('primary')}`}>{userProfile.user.name}</h3>
                    <p className={`text-sm ${getTextClasses('muted')}`}>{userProfile.headline || 'No headline set'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getBgClasses('card')} ${getTextClasses('secondary')}`}>
                        {profileService.getDisplayRole(userProfile.user.role)}
                      </span>
                      {userProfile.verificationStatus === 'verified' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1 animate-pulse">
                          <Award className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="animate-in fade-in-up duration-500">
                    <div className={`text-2xl font-bold ${getTextClasses('primary')}`}>{stats.followers}</div>
                    <div className={`text-xs ${getTextClasses('muted')}`}>Followers</div>
                  </div>
                  <div className="animate-in fade-in-up duration-500 animate-delay-200">
                    <div className={`text-2xl font-bold ${getTextClasses('primary')}`}>{stats.following}</div>
                    <div className={`text-xs ${getTextClasses('muted')}`}>Following</div>
                  </div>
                  <div className="animate-in fade-in-up duration-500 animate-delay-400">
                    <div className={`text-2xl font-bold ${getTextClasses('primary')}`}>
                      {userProfile.socialStats?.profileViews || 0}
                    </div>
                    <div className={`text-xs ${getTextClasses('muted')}`}>Profile Views</div>
                  </div>
                </div>

                <button
                  className={cn(
                    "w-full py-2 rounded-lg font-medium transition-all duration-300",
                    "flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95",
                    "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: 'white'
                  }}
                  onClick={() => router.push(`/dashboard/${role}/social/profile`)}
                >
                  <ExternalLink className="w-4 h-4" />
                  View Profile
                </button>
              </div>
            </div>
          )}

          {/* Network Quality Card */}
          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-in slide-in-from-right-0 duration-500 animate-delay-300" style={getCardStyle()}>
            <div className="p-6">
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
        <div className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`} style={getCardStyle()}>
          <div className="p-6">
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
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-shadow"
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
        <div className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 animate-delay-300`} style={getCardStyle()}>
          <div className="border-b" style={{ borderColor: colors.primary + '20' }}>
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('followers')}
                className={cn(
                  "flex-1 px-4 lg:px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
                  activeTab === 'followers'
                    ? "text-white shadow-md"
                    : "hover:bg-gray-50"
                )}
                style={activeTab === 'followers' ? {
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                } : {
                  color: getTextClasses('muted').includes('text-') ? '' : colors.primary + '80'
                }}
              >
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  <Users2 className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Followers</span>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
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
                  "flex-1 px-4 lg:px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
                  activeTab === 'following'
                    ? "text-white shadow-md"
                    : "hover:bg-gray-50"
                )}
                style={activeTab === 'following' ? {
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                } : {
                  color: getTextClasses('muted').includes('text-') ? '' : colors.primary + '80'
                }}
              >
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  <UserCheck className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Following</span>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
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
                  "flex-1 px-4 lg:px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
                  activeTab === 'suggestions'
                    ? "text-white shadow-md"
                    : "hover:bg-gray-50"
                )}
                style={activeTab === 'suggestions' ? {
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                } : {
                  color: getTextClasses('muted').includes('text-') ? '' : colors.primary + '80'
                }}
              >
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Suggestions</span>
                </div>
              </button>

              {stats.pendingRequests > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 px-4 lg:px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
                    activeTab === 'requests'
                      ? "text-white shadow-md"
                      : "hover:bg-gray-50"
                  )}
                  style={activeTab === 'requests' ? {
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  } : {
                    color: colors.error || '#EF4444'
                  }}
                >
                  <div className="flex items-center justify-center gap-2 lg:gap-3">
                    <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="hidden sm:inline">Requests</span>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
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

          <div className="p-4 lg:p-6">
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${getTextClasses('primary')}`}>People You May Know</h3>
                    <p className={`text-sm ${getTextClasses('muted')}`}>Based on your profile and connections</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={algorithm}
                      onChange={(e) => handleAlgorithmChange(e.target.value as any)}
                      className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:border-transparent ${getBgClasses('card')}`}
                      style={{
                        borderColor: colors.primary + '30',
                        color: getTextClasses('primary').includes('text-') ? '' : colors.primary
                      }}
                    >
                      <option value="hybrid">Smart Suggestions</option>
                      <option value="skills">Skills Match</option>
                      <option value="connections">Mutual Connections</option>
                      <option value="popular">Popular Profiles</option>
                    </select>
                    <button
                      onClick={() => setShowMobileFilters(true)}
                      className="lg:hidden p-2 rounded-lg transition-colors"
                      style={{ color: colors.primary }}
                    >
                      <Filter className="w-5 h-5" />
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Refresh suggestions
                        toast({
                          title: "Refreshing",
                          description: "Finding new suggestions for you...",
                          variant: "default"
                        });
                      }}
                      className="hidden lg:flex"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

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
                />
              </div>
            )}

            {activeTab === 'requests' && (
              <NetworkList
                type="requests"
                title="Pending Follow Requests"
                limit={10}
                showSearch={true}
                showFilter={false}
                showRefresh={true}
                currentUserId={user?._id}
                onConnectionCountChange={(count) => {
                  setStats(prev => ({ ...prev, pendingRequests: count }));
                }}
                className="p-4"
                showPagination={true}
              />
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 animate-delay-600`}>
          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in-up duration-500" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl animate-pulse" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}5)` }}>
                  <Zap className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getTextClasses('primary')}`}>
                    {userProfile?.socialStats?.engagementRate || 0}%
                  </div>
                  <div className={`text-sm ${getTextClasses('muted')}`}>Engagement Rate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in-up duration-500 animate-delay-200" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl animate-pulse animate-delay-400" style={{ background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.secondary}5)` }}>
                  <MessageSquare className="w-6 h-6" style={{ color: colors.secondary }} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getTextClasses('primary')}`}>
                    {userProfile?.socialStats?.averageResponseTime || 0} hrs
                  </div>
                  <div className={`text-sm ${getTextClasses('muted')}`}>Avg. Response Time</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in-up duration-500 animate-delay-400" style={getCardStyle()}>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl animate-pulse animate-delay-600" style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.accent}5)` }}>
                  <Heart className="w-6 h-6" style={{ color: colors.accent }} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getTextClasses('primary')}`}>
                    {userProfile?.socialStats?.endorsementCount || 0}
                  </div>
                  <div className={`text-sm ${getTextClasses('muted')}`}>Skill Endorsements</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${contentLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 animate-delay-800`} style={getCardStyle()}>
          <div className="p-6">
            <h3 className={`font-semibold ${getTextClasses('primary')} mb-6`}>Quick Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 py-3 h-auto transform hover:scale-105 active:scale-95 transition-all duration-300"
                onClick={() => router.push(`/dashboard/${role}/social/explore`)}
                style={{
                  borderColor: colors.primary + '30',
                  color: colors.primary
                }}
              >
                <UserPlus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Find New Connections</div>
                  <div className={`text-xs ${getTextClasses('muted')}`}>Discover people to connect with</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 py-3 h-auto transform hover:scale-105 active:scale-95 transition-all duration-300 animate-delay-200"
                onClick={() => router.push(`/dashboard/${role}/social/invite`)}
                style={{
                  borderColor: colors.secondary + '30',
                  color: colors.secondary
                }}
              >
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Invite Contacts</div>
                  <div className={`text-xs ${getTextClasses('muted')}`}>Invite friends and colleagues</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 py-3 h-auto transform hover:scale-105 active:scale-95 transition-all duration-300 animate-delay-400"
                onClick={() => window.open('/api/network/export', '_blank')}
                style={{
                  borderColor: colors.accent + '30',
                  color: colors.accent
                }}
              >
                <RefreshCw className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Export Network</div>
                  <div className={`text-xs ${getTextClasses('muted')}`}>Download your connections</div>
                </div>
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
  const role = router.query.role as string || 'candidate';

  return (
    <>
      <Head>
        <title>Network | Banana Social</title>
      </Head>

      <SocialDashboardLayout requiredRole={role as any || 'candidate'}>
        <NetworkContent />
      </SocialDashboardLayout>
    </>
  );
};

export default NetworkPage;