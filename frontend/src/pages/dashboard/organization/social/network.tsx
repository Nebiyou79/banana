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
  Target,
  BarChart3,
  Loader2,
  Eye,
  RefreshCw,
  Filter,
  ChevronRight,
  Bell,
  MessageSquare,
  Star,
  Zap,
  Heart,
  Award,
  Mail,
  ExternalLink,
  Users,
  Network
} from 'lucide-react';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import { cn } from '@/lib/utils';

// Component that uses theme context
const NetworkContent = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { colors, role } = useTheme();
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-3 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  color: 'white'
                }}
              >
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
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

          <div className="flex flex-wrap gap-3">
            <button
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-300",
                "flex items-center gap-3",
                "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              )}
              style={{
                backgroundColor: colors.primary,
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
              className="gap-3 px-6"
              onClick={() => router.push(`/dashboard/${role}/social/invite`)}
            >
              <Mail className="w-5 h-5" />
              Invite Contacts
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Followers</span>
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${colors.primary}15`,
                  }}
                >
                  <Users2 className="w-5 h-5" style={{ color: colors.primary }} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {followService.formatFollowerCount(stats.followers)}
              </div>
              <div className="text-sm text-gray-500">
                People who follow you
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Following</span>
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${colors.accent}15`,
                  }}
                >
                  <UserCheck className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {followService.formatFollowerCount(stats.following)}
              </div>
              <div className="text-sm text-gray-500">
                People you follow
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Requests</span>
                <div className="p-2 rounded-lg bg-amber-50">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.pendingRequests}
              </div>
              <div className="text-sm text-gray-500">
                Pending requests
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Growth</span>
                <div className="p-2 rounded-lg bg-green-50">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.followers > 0 ? Math.round((stats.following / stats.followers) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">
                Following ratio
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connections by name, title, company, or skills..."
              className="w-full pl-12 pr-6 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              style={{
                borderColor: colors.primary + '30'
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Main Content - Single Column */}
      <div className="space-y-8">
        {/* Profile & Network Quality Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          {userProfile && (
            <Card className="border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
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
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{userProfile.user.name}</h3>
                    <p className="text-gray-600 text-sm">{userProfile.headline || 'No headline set'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {profileService.getDisplayRole(userProfile.user.role)}
                      </span>
                      {userProfile.verificationStatus === 'verified' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {userProfile.socialStats?.profileViews || 0}
                    </div>
                    <div className="text-xs text-gray-500">Profile Views</div>
                  </div>
                </div>

                <button
                  className={cn(
                    "w-full py-2 rounded-lg font-medium transition-all duration-300",
                    "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  )}
                  style={{
                    backgroundColor: colors.primary,
                    color: 'white'
                  }}
                  onClick={() => router.push(`/dashboard/${role}/social/profile`)}
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  View Profile
                </button>
              </div>
            </Card>
          )}

          {/* Network Quality Card */}
          <Card className="border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="p-3 rounded-xl shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                    color: 'white'
                  }}
                >
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Network Quality</h3>
                  <p className="text-sm text-gray-600">Your network health score</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Following</span>
                    <span className="font-medium text-gray-900">{stats.following}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min((stats.following / 500) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Followers</span>
                    <span className="font-medium text-gray-900">{stats.followers}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${Math.min((stats.followers / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Engagement</span>
                    <span className="font-medium text-gray-900">
                      {stats.followers > 0 ? Math.round((stats.totalConnections / stats.followers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${Math.min((stats.totalConnections / (stats.followers || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-gray-900">
                      {followService.getNetworkQuality(stats.followers, stats.following).label}
                    </div>
                    <div className={`px-3 py-1 text-xs font-medium rounded-full ${followService.getNetworkQuality(stats.followers, stats.following).level === 'excellent'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : followService.getNetworkQuality(stats.followers, stats.following).level === 'good'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : followService.getNetworkQuality(stats.followers, stats.following).level === 'average'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                      {followService.getNetworkQuality(stats.followers, stats.following).level.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {followService.getNetworkQuality(stats.followers, stats.following).description}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Networking Tips */}
        <Card className="border border-gray-200 shadow-sm">
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
                <h3 className="font-semibold text-gray-900">Networking Tips</h3>
                <p className="text-sm text-gray-600">Grow your network effectively</p>
              </div>
            </div>

            <div className="space-y-4">
              {getRoleTips().map((tip, index) => (
                <div key={index} className="flex items-start gap-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-shadow"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                      color: 'white'
                    }}
                  >
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-6 gap-2"
              onClick={() => router.push(`/dashboard/${role}/social/help/networking`)}
            >
              View More Tips
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Network Lists Tabs */}
        <Card className="border border-gray-200 shadow-sm">
          <div className="border-b border-gray-100">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('followers')}
                className={cn(
                  "flex-1 px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300",
                  activeTab === 'followers'
                    ? "text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'followers' ? {
                  backgroundColor: colors.primary,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                } : {}}
              >
                <div className="flex items-center justify-center gap-3">
                  <Users2 className="w-5 h-5" />
                  Followers
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    activeTab === 'followers'
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {stats.followers}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('following')}
                className={cn(
                  "flex-1 px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300",
                  activeTab === 'following'
                    ? "text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'following' ? {
                  backgroundColor: colors.primary,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                } : {}}
              >
                <div className="flex items-center justify-center gap-3">
                  <UserCheck className="w-5 h-5" />
                  Following
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    activeTab === 'following'
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {stats.following}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('suggestions')}
                className={cn(
                  "flex-1 px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300",
                  activeTab === 'suggestions'
                    ? "text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'suggestions' ? {
                  backgroundColor: colors.primary,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                } : {}}
              >
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  Suggestions
                </div>
              </button>

              {stats.pendingRequests > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 px-6 py-4 font-medium text-sm rounded-lg transition-all duration-300",
                    activeTab === 'requests'
                      ? "text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  style={activeTab === 'requests' ? {
                    backgroundColor: colors.primary,
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
                  } : {}}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Bell className="w-5 h-5" />
                    Requests
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

          <div className="p-6">
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">People You May Know</h3>
                    <p className="text-sm text-gray-600">Based on your profile and connections</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={algorithm}
                      onChange={(e) => handleAlgorithmChange(e.target.value as any)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hybrid">Smart Suggestions</option>
                      <option value="skills">Skills Match</option>
                      <option value="connections">Mutual Connections</option>
                      <option value="popular">Popular Profiles</option>
                    </select>
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
        </Card>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userProfile?.socialStats?.engagementRate || 0}%
                </div>
                <div className="text-sm text-gray-600">Engagement Rate</div>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userProfile?.socialStats?.averageResponseTime || 0} hrs
                </div>
                <div className="text-sm text-gray-600">Avg. Response Time</div>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
                <Heart className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userProfile?.socialStats?.endorsementCount || 0}
                </div>
                <div className="text-sm text-gray-600">Skill Endorsements</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Quick Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 py-3 h-auto"
                onClick={() => router.push(`/dashboard/${role}/social/explore`)}
              >
                <UserPlus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Find New Connections</div>
                  <div className="text-xs text-gray-500">Discover people to connect with</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 py-3 h-auto"
                onClick={() => router.push(`/dashboard/${role}/social/invite`)}
              >
                <Mail className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Invite Contacts</div>
                  <div className="text-xs text-gray-500">Invite friends and colleagues</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 py-3 h-auto"
                onClick={() => window.open('/api/network/export', '_blank')}
              >
                <RefreshCw className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Export Network</div>
                  <div className="text-xs text-gray-500">Download your connections</div>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Main Component
const NetworkPage = () => {
  const router = useRouter();
  const role = router.query.role as string || 'organization';

  return (
    <RoleThemeProvider>
      <Head>
        <title>Network | Banana Social</title>
      </Head>

      <SocialDashboardLayout requiredRole={role as any | "organization"}>
        <NetworkContent />
      </SocialDashboardLayout>
    </RoleThemeProvider>
  );
};

export default NetworkPage;