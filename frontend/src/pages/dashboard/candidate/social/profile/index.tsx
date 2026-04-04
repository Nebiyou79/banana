// app/dashboard/candidate/social/profile/page.tsx - FIXED FOR MOBILE & DESKTOP
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
  BarChart3,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { profileService, Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/Card';

interface ProfileStats {
  totalPosts: number;
  totalConnections: number;
  profileViews: number;
  profileStrength: number;
}

const CandidateProfilePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
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
    router.push('/dashboard/candidate/social/profile/edit');
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
          <div className="space-y-6 md:space-y-8">
            {/* Stats Grid - Full width on mobile, proper spacing on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {[
                { label: 'Total Posts', value: stats.totalPosts, icon: '📝', color: 'from-blue-500 to-cyan-500' },
                { label: 'Connections', value: stats.totalConnections, icon: '🤝', color: 'from-purple-500 to-pink-500' },
                { label: 'Profile Views', value: stats.profileViews, icon: '👁️', color: 'from-amber-500 to-orange-500' },
                { label: 'Profile Strength', value: `${stats.profileStrength}%`, icon: '📈', color: 'from-green-500 to-emerald-500' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-card dark:bg-gray-800 rounded-xl p-3 md:p-6 text-center border border-border dark:border-gray-700 hover:scale-[1.02] transition-transform duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full mb-2 bg-linear-to-br ${stat.color}`}>
                    <span className="text-sm md:text-lg">{stat.icon}</span>
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-foreground dark:text-gray-100">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Skills Preview */}
            {enhancedProfile.roleSpecific.skills.length > 0 && (
              <Card className="border-border dark:border-gray-700 shadow-lg">
                <CardContent className="p-4 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-500">
                        <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-2xl font-bold text-foreground dark:text-gray-100">Skills & Expertise</h3>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                          {enhancedProfile.roleSpecific.skills.length} skills
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('skills')}
                      className="group w-full md:w-auto"
                      size="sm"
                    >
                      View All
                      <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {enhancedProfile.roleSpecific.skills.slice(0, 8).map((skill, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg md:rounded-xl text-sm border border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Posts */}
            {profile?.user?._id && (
              <Card className="border-border dark:border-gray-700 shadow-lg">
                <CardContent className="p-4 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 md:p-3 rounded-xl bg-linear-to-br from-green-500 to-emerald-500">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-2xl font-bold text-foreground dark:text-gray-100">Recent Activity</h3>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                          Your latest posts and updates
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('posts')}
                      className="group w-full md:w-auto"
                      size="sm"
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
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground dark:text-gray-100">Skills & Expertise</h2>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    {enhancedProfile.roleSpecific.skills.length} skills total
                  </p>
                </div>
              </div>
              <Button
                onClick={handleEditProfile}
                variant="outline"
                className="w-full md:w-auto"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Skills
              </Button>
            </div>

            <Card className="border-border dark:border-gray-700 shadow-lg">
              <CardContent className="p-4 md:p-8">
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {enhancedProfile.roleSpecific.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 md:px-4 md:py-3 bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-800 dark:text-blue-300 rounded-lg md:rounded-xl text-sm md:text-base font-medium border border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-500">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground dark:text-gray-100">Profile Analytics</h2>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Track your profile performance and growth
                </p>
              </div>
            </div>

            <ProfileSocialAnalytics
              stats={profile?.socialStats}
              variant="default"
              showTrends={true}
              timeRange="monthly"
            />

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="border-border dark:border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-foreground dark:text-gray-100">Profile Growth</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-2xl md:text-3xl font-bold text-foreground dark:text-gray-100">+24%</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">This month</div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-linear-to-r from-blue-500 to-cyan-500 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border dark:border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-purple-500 to-pink-500">
                      <Globe className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-foreground dark:text-gray-100">Engagement</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-2xl md:text-3xl font-bold text-foreground dark:text-gray-100">12.4%</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Above average</div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-linear-to-r from-purple-500 to-pink-500 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border dark:border-gray-700">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-green-500 to-emerald-500">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-foreground dark:text-gray-100">Network Reach</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="text-2xl md:text-3xl font-bold text-foreground dark:text-gray-100">1.2K</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Total reach</div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-linear-to-r from-green-500 to-emerald-500 w-4/5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      <>
        <Head>
          <title>Profile | Banana Social</title>
          <meta name="description" content="Your candidate profile" />
        </Head>
        <SocialDashboardLayout requiredRole="candidate">
          <RoleThemeProvider>
            <div className="min-h-screen bg-background">
              <div className="px-4 py-4 md:px-6 md:py-8">
                <div className="space-y-6 md:space-y-8">
                  {/* Header Skeleton */}
                  <div className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden">
                    <Skeleton className="h-40 md:h-48 w-full" />
                    <div className="relative px-4 md:px-8 pb-4 md:pb-8 -mt-12 md:-mt-16">
                      <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full absolute -top-8 md:-top-12" />
                      <div className="mt-14 md:mt-20 space-y-3 md:space-y-4">
                        <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
                        <Skeleton className="h-4 md:h-5 w-32 md:w-48" />
                        <Skeleton className="h-4 md:h-5 w-40 md:w-56" />
                      </div>
                    </div>
                  </div>

                  {/* Tabs Skeleton */}
                  <Skeleton className="h-12 md:h-14 rounded-xl md:rounded-2xl" />

                  {/* Content Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-48 md:h-64 rounded-xl md:rounded-2xl" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </RoleThemeProvider>
        </SocialDashboardLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Profile | Banana Social</title>
          <meta name="description" content="Your candidate profile" />
        </Head>
        <SocialDashboardLayout requiredRole="candidate">
          <RoleThemeProvider>
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground dark:text-gray-100 mb-3">Failed to Load Profile</h3>
                <p className="text-muted-foreground dark:text-gray-400 mb-6">{error}</p>
                <Button
                  onClick={fetchProfileData}
                  variant="default"
                  className="w-full md:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </RoleThemeProvider>
        </SocialDashboardLayout>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head>
          <title>Profile | Banana Social</title>
          <meta name="description" content="Your candidate profile" />
        </Head>
        <SocialDashboardLayout requiredRole="candidate">
          <RoleThemeProvider>
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground dark:text-gray-100 mb-3">No Profile Found</h3>
                <p className="text-muted-foreground dark:text-gray-400 mb-6">Please complete your profile setup.</p>
                <Button
                  onClick={handleEditProfile}
                  variant="default"
                  className="w-full md:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            </div>
          </RoleThemeProvider>
        </SocialDashboardLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.user.name} | Banana Social</title>
        <meta name="description" content={`${profile.user.name}'s candidate profile`} />
      </Head>
      <SocialDashboardLayout requiredRole="candidate">
        <RoleThemeProvider>
          <div className="min-h-screen bg-background">
            <div className="px-4 py-4 md:px-6 md:py-8">
              <div className="space-y-6 md:space-y-8">
                {/* Profile Header - Simplified container */}
                {profile && (
                  <div className="bg-card border border-border rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
                    <ProfileHeader
                      profile={profile}
                      isOwnProfile={isOwnProfile}
                      onFollow={handleFollow}
                      onRefresh={handleRefreshProfile}
                    />
                  </div>
                )}

                {/* Profile Tabs - Clean mobile layout */}
                <div className="bg-card border border-border rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
                  <ProfileTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    userRole="candidate"
                    profileType="candidate"
                    variant="default"
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
                </div>

                {/* Tab Content with Transition - Full width */}
                <TabTransitionWrapper activeTab={activeTab}>
                  <div className="min-h-[400px]">
                    {renderTabContent()}
                  </div>
                </TabTransitionWrapper>

                {/* Quick Action Footer - Mobile optimized */}
                {isOwnProfile && (
                  <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3">
                    {refreshing ? (
                      <div className="px-4 py-2 md:px-5 md:py-3 bg-blue-500 text-white rounded-xl flex items-center gap-2 shadow-xl">
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        <span className="text-sm">Refreshing...</span>
                      </div>
                    ) : (
                      <Button
                        onClick={handleRefreshProfile}
                        variant="outline"
                        size="sm"
                        className="bg-card backdrop-blur-xl shadow-xl hover:scale-105 transition-transform group"
                      >
                        <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="hidden md:inline">Refresh</span>
                        <span className="md:hidden">↻</span>
                      </Button>
                    )}

                    <Button
                      onClick={handleEditProfile}
                      variant="default"
                      size="sm"
                      className="bg-linear-to-r from-primary to-secondary text-primary-foreground shadow-xl hover:scale-105 transition-transform group"
                    >
                      <Edit className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                      <span className="hidden md:inline">Edit Profile</span>
                      <span className="md:hidden">Edit</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </RoleThemeProvider>
      </SocialDashboardLayout>
    </>
  );
};

export default CandidateProfilePage;