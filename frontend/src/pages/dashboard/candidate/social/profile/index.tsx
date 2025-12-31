// app/social/candidate/profile/page.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SocialDashboardLayout } from '@/components/social/layout/SocialDashboard';
import { RoleThemeProvider } from '@/components/social/theme/RoleThemeProvider';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';
import { ProfileTabs, ProfileTabContent, TabTransitionWrapper } from '@/components/profile/ProfileTabs';
import { ProfileSocialAnalytics } from '@/components/profile/ProfileSocialAnalytics';
import { Button } from '@/components/social/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Edit,
  Globe,
  Users,
  Award,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import profileService, { Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileStats {
  totalPosts: number;
  totalConnections: number;
  profileViews: number;
  profileStrength: number;
}

const CandidateProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roleSpecificData, setRoleSpecificData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalPosts: 0,
    totalConnections: 0,
    profileViews: 0,
    profileStrength: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = true; // Since this is the candidate's own profile page

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both profile and candidate-specific data in parallel
      const [profileResponse, candidateResponse] = await Promise.allSettled([
        profileService.getProfile(),
        roleProfileService.getCandidateProfile()
      ]);

      // Handle profile response
      if (profileResponse.status === 'fulfilled') {
        setProfile(profileResponse.value as Profile);

        // Calculate stats
        const profileStats: ProfileStats = {
          totalPosts: profileResponse.value.socialStats?.postCount || 0,
          totalConnections: profileResponse.value.socialStats?.connectionCount || 0,
          profileViews: profileResponse.value.socialStats?.profileViews || 0,
          profileStrength: profileResponse.value.profileCompletion?.percentage || 0
        };
        setStats(profileStats);
      } else {
        console.error('Profile fetch failed:', profileResponse.reason);
        throw new Error('Failed to load profile');
      }

      // Handle role-specific data
      if (candidateResponse.status === 'fulfilled') {
        setRoleSpecificData(candidateResponse.value);
      } else {
        console.warn('Role-specific data not available:', candidateResponse.reason);
        setRoleSpecificData(null);
      }

    } catch (err: any) {
      console.error('Failed to fetch profile data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    try {
      await fetchProfileData();
      toast.success('Profile refreshed');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/social/candidate/profile/edit');
  };

  const handleFollow = (isFollowing: boolean) => {
    console.log('Follow status changed:', isFollowing);
  };

  const getProfileWithRoleSpecific = (): Profile => {
    if (!profile) return profileService.createSafeProfile();

    return {
      ...profile,
      roleSpecific: {
        ...profile.roleSpecific,
        skills: roleSpecificData?.skills || profile.roleSpecific.skills || [],
        education: roleSpecificData?.education || profile.roleSpecific.education || [],
        experience: roleSpecificData?.experience || profile.roleSpecific.experience || [],
        certifications: roleSpecificData?.certifications || profile.roleSpecific.certifications || [],
      }
    };
  };

  // Render custom content for specific tabs
  const renderTabContent = () => {
    const enhancedProfile = getProfileWithRoleSpecific();

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Posts', value: stats.totalPosts, icon: '📝', color: 'from-blue-500 to-cyan-500' },
                { label: 'Connections', value: stats.totalConnections, icon: '🤝', color: 'from-purple-500 to-pink-500' },
                { label: 'Profile Views', value: stats.profileViews, icon: '👁️', color: 'from-amber-500 to-orange-500' },
                { label: 'Profile Strength', value: `${stats.profileStrength}%`, icon: '📈', color: 'from-green-500 to-emerald-500' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="backdrop-blur-lg bg-white rounded-xl p-4 text-center border border-gray-200 hover:scale-105 transition-transform duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 bg-gradient-to-br ${stat.color}`}>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Skills Preview */}
            {enhancedProfile.roleSpecific.skills.length > 0 && (
              <div className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Skills & Expertise</h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('skills')}
                    className="group"
                  >
                    View All
                    <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {enhancedProfile.roleSpecific.skills.slice(0, 12).map((skill, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 backdrop-blur-md bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-200 hover:border-blue-500 hover:scale-105 transition-all duration-300"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {profile?.user?._id && (
              <div className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Recent Posts</h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('posts')}
                    className="group"
                  >
                    View All
                    <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <ProfilePostsSection
                  userId={profile.user._id}
                  isOwnProfile={isOwnProfile}
                  currentUserId={user?.id}
                  limit={3}
                  showLoadMore={false}
                  variant="compact"
                />
              </div>
            )}
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Skills & Expertise</h2>
              </div>
              <Button
                onClick={handleEditProfile}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Skills
              </Button>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">All Skills ({enhancedProfile.roleSpecific.skills.length})</h3>
              <div className="flex flex-wrap gap-3">
                {enhancedProfile.roleSpecific.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 backdrop-blur-md bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 rounded-xl text-base font-medium border border-blue-200 hover:border-blue-500 hover:scale-105 transition-all duration-300 shadow-sm"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Analytics</h2>
              </div>
            </div>

            <ProfileSocialAnalytics
              stats={profile?.socialStats}
              variant="glass"
              showTrends={true}
              timeRange="monthly"
            />

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Profile Growth</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-gray-900">+24%</div>
                  <div className="text-sm text-gray-600">This month</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-3/4" />
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Engagement</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-gray-900">12.4%</div>
                  <div className="text-sm text-gray-600">Above average</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-2/3" />
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-lg bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Network Reach</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-gray-900">1.2K</div>
                  <div className="text-sm text-gray-600">Total reach</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        // Use ProfileTabContent for other tabs
        return (
          <ProfileTabContent
            activeTab={activeTab}
            userRole="candidate"
            profileType="candidate"
            isOwnProfile={isOwnProfile}
            isPremium={profile?.premium?.isPremium || false}
            profileData={enhancedProfile}
            socialStats={profile?.socialStats}
          />
        );
    }
  };

  if (loading) {
    return (
      <SocialDashboardLayout requiredRole="candidate">
        <RoleThemeProvider>
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl">
              <Skeleton className="h-64 md:h-72 w-full" />
              <div className="relative px-8 pb-8 -mt-12">
                <Skeleton className="w-36 h-36 rounded-full absolute -top-12" />
                <div className="mt-12 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <Skeleton className="h-16 rounded-3xl" />

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  if (error) {
    return (
      <SocialDashboardLayout requiredRole="candidate">
        <RoleThemeProvider>
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Failed to Load Profile</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={fetchProfileData}
              variant="premium"
              className="backdrop-blur-lg border-gray-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  if (!profile) {
    return (
      <SocialDashboardLayout requiredRole="candidate">
        <RoleThemeProvider>
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Profile Found</h3>
            <p className="text-gray-600 mb-6">Please complete your profile setup.</p>
            <Button
              onClick={handleEditProfile}
              variant="premium"
              className="backdrop-blur-lg border-gray-300"
            >
              <Edit className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    );
  }

  return (
    <RoleThemeProvider>
      <SocialDashboardLayout requiredRole="candidate">
        <div className="space-y-8">
          {/* Profile Header */}
          {profile && (
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
              onFollow={handleFollow}
              onRefresh={handleRefreshProfile}
            />
          )}

          {/* Profile Tabs */}
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole="candidate"
            profileType="candidate"
            variant="glass"
            showIcons={true}
            isOwnProfile={isOwnProfile}
            isPremium={profile?.premium?.isPremium || false}
            stats={{
              posts: stats.totalPosts,
              connections: stats.totalConnections,
              followers: profile?.socialStats?.followerCount || 0,
              following: profile?.socialStats?.followingCount || 0,
              portfolio: 0,
              products: 0,
              profileViews: stats.profileViews,
              applications: 0,
              messages: 0,
              achievements: 0
            }}
          />

          {/* Tab Content with Transition */}
          <TabTransitionWrapper activeTab={activeTab}>
            {renderTabContent()}
          </TabTransitionWrapper>

          {/* Quick Action Footer */}
          {isOwnProfile && (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
              {refreshing ? (
                <div className="px-4 py-3 bg-blue-500 text-white rounded-xl flex items-center gap-2 backdrop-blur-xl shadow-2xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Refreshing...</span>
                </div>
              ) : (
                <Button
                  onClick={handleRefreshProfile}
                  variant="outline"
                  size="lg"
                  className="backdrop-blur-xl shadow-2xl hover:scale-105 transition-transform group"
                >
                  <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Refresh Profile
                </Button>
              )}

              <Button
                onClick={handleEditProfile}
                variant="premium"
                size="lg"
                className="backdrop-blur-xl shadow-2xl hover:scale-105 transition-transform group"
              >
                <Edit className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </SocialDashboardLayout>
    </RoleThemeProvider>
  );
};

export default CandidateProfilePage;