import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SocialNavbar from './SocialNavbar';
import SocialSidebar from './SocialSidebar';
import { profileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Zap, TrendingUp, Bell } from 'lucide-react';
import { Profile } from '@/services/profileService';
import CandidateAdCard from '../CandidateAdCard';
import CompanyAdCard from '../CompanyAdCard';
import FreelancerAdCard from '../FreelanceAdCard';
import OrganizationAdCard from '../OrganizationAdCard';
import { getAdsForRole, adConfig, AdData } from '@/data/ads';

interface SocialDashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'company' | 'freelancer' | 'admin' | 'organization';
  adLimit?: number; // Number of ads to show
}

export function SocialDashboardLayout({
  children,
  requiredRole,
  adLimit = 3
}: SocialDashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [ads, setAds] = useState<AdData[]>([]);
  const [adStats, setAdStats] = useState({
    totalImpressions: 0,
    totalClicks: 0
  });

  /* ------------------------ Detect Mobile ------------------------ */
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /* ------------------ Fetch User Profile ------------------ */
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchUserProfile = async () => {
        try {
          const profile = await profileService.getProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  /* ------------------ Load Ads for User Role ------------------ */
  useEffect(() => {
    if (user?.role) {
      const userAds = getAdsForRole(user.role, adConfig, adLimit);
      setAds(userAds);

      // Calculate ad statistics
      const stats = userAds.reduce((acc, ad) => ({
        totalImpressions: acc.totalImpressions + ad.impressions,
        totalClicks: acc.totalClicks + ad.clicks
      }), { totalImpressions: 0, totalClicks: 0 });

      setAdStats(stats);
    }
  }, [user?.role, adLimit]);

  /* ------------------------- Role Gate ------------------------- */
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });

      router.push(`/dashboard/${user?.role}/social`);
    }
  }, [user, isLoading, isAuthenticated, requiredRole, router]);

  /* ------------------ Auto-Close Sidebar on Mobile ------------------ */
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [router.pathname, isMobile]);

  /* -------------------- Loading State -------------------- */
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-lg font-semibold text-slate-700">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  /* ------------------ Access Denied Screen ------------------ */
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative">
        <div className="relative text-center bg-white/10 backdrop-blur-2xl p-12 rounded-3xl border border-white/20 shadow-2xl max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5.07 19h13.86L12 3 5.07 19z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-white/70 text-lg tracking-wide">You don`t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  /* ------------------- Render Ad Component ------------------- */
  const renderAdComponent = (ad: AdData) => {
    switch (ad.type) {
      case 'candidate':
        return <CandidateAdCard key={ad.id} {...ad} />;
      case 'company':
        return <CompanyAdCard key={ad.id} {...ad} />;
      case 'freelancer':
        return <FreelancerAdCard key={ad.id} {...ad} />;
      case 'organization':
        return <OrganizationAdCard key={ad.id} {...ad} />;
      default:
        return null;
    }
  };

  /* ------------------- MAIN LAYOUT ------------------- */
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <div className="h-full">
          <SocialSidebar userProfile={userProfile} />
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-in slide-in-from-left-80 duration-300">
            <SocialSidebar userProfile={userProfile} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-0 lg:ml-80">

        {/* NAVBAR */}
        <div className="flex-shrink-0 z-20">
          <SocialNavbar userProfile={userProfile} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* HEADER */}
            <div className="mb-10 text-center lg:text-left">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-slate-800">
                  {router.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </h1>

                {/* Notifications & Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Ad CTR: {adStats.totalImpressions > 0
                      ? `${((adStats.totalClicks / adStats.totalImpressions) * 100).toFixed(1)}%`
                      : '0%'}</span>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <p className="text-lg text-slate-600">
                  Welcome back,{' '}
                  <span className="font-semibold text-blue-600">
                    {user?.name}
                  </span>
                  <span className="mx-3 text-slate-400">•</span>
                  <span className="capitalize text-slate-500 font-medium">{user?.role}</span>
                </p>

                {/* LIVE TAG */}
                <div className="flex items-center justify-center lg:justify-end mt-3 lg:mt-0">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700 
                      bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Live</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* MAIN CARD */}
                <div className="bg-white rounded-2xl border border-slate-200 
                    shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
                  {children}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Profile Card */}
                {userProfile && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-md">
                          {userProfile.user.avatar ? (
                            <img
                              src={userProfile.user.avatar}
                              alt={userProfile.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-2xl font-bold">
                              {userProfile.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{userProfile.user.name}</h3>
                        <p className="text-slate-600 text-sm">{userProfile.headline || 'No headline set'}</p>
                        <div className="flex gap-6 mt-3">
                          <div className="text-center">
                            <div className="font-bold text-slate-800 text-xl">
                              {userProfile.socialStats?.followerCount || 0}
                            </div>
                            <div className="text-sm text-slate-500">Followers</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-slate-800 text-xl">
                              {userProfile.socialStats?.followingCount || 0}
                            </div>
                            <div className="text-sm text-slate-500">Following</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advertisements Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Recommended for you</h3>
                    <span className="text-xs text-slate-500">{ads.length} ads</span>
                  </div>

                  <div className="space-y-6">
                    {ads.length > 0 ? (
                      ads.map(ad => renderAdComponent(ad))
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                        <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="font-semibold text-slate-600 mb-2">No ads available</h4>
                        <p className="text-sm text-slate-500">Check back later for new opportunities</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Stats for Admin */}
                {user?.role === 'admin' && (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Platform Insights
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-white/10 rounded-xl">
                        <div className="text-xl font-bold">24k</div>
                        <div className="text-xs text-slate-300">Users</div>
                      </div>
                      <div className="text-center p-3 bg-white/10 rounded-xl">
                        <div className="text-xl font-bold">1.2k</div>
                        <div className="text-xs text-slate-300">Posts</div>
                      </div>
                      <div className="text-center p-3 bg-white/10 rounded-xl">
                        <div className="text-xl font-bold">89%</div>
                        <div className="text-xs text-slate-300">Engagement</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400">
                      {adStats.totalImpressions.toLocaleString()} total ad impressions
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER CREDITS */}
            <div className="flex items-center justify-center gap-2 mt-8 text-slate-500 text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Powered by Banana Social</span>
              <span className="text-slate-400">•</span>
              <span>v2.1.0</span>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}