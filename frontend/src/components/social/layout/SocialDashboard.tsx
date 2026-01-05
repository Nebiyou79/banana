import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SocialNavbar from './SocialNavbar';
import SocialSidebar from './SocialSidebar';
import { profileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Zap, TrendingUp, Bell, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Profile } from '@/services/profileService';
import CandidateAdCard from '../CandidateAdCard';
import CompanyAdCard from '../CompanyAdCard';
import FreelancerAdCard from '../FreelanceAdCard';
import OrganizationAdCard from '../OrganizationAdCard';
import { getAdsForRole, adConfig, AdData } from '@/data/ads';

interface SocialDashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'company' | 'freelancer' | 'admin' | 'organization';
  adLimit?: number;
}

export function SocialDashboardLayout({
  children,
  requiredRole,
  adLimit = 2
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
  const [adsExpanded, setAdsExpanded] = useState(false);

  /* ------------------------ Detect Mobile ------------------------ */
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
      // On mobile, collapse ads by default
      if (mobile) setAdsExpanded(false);
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
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative">
        <div className="relative text-center bg-white/10 backdrop-blur-2xl p-12 rounded-3xl border border-white/20 shadow-2xl max-w-md mx-4">
          <div className="w-20 h-20 bg-linear-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 dark:from-slate-900 dark:via-slate-800/20 dark:to-purple-900/20 relative overflow-hidden">
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
      <div className="flex-1 flex flex-col min-h-screen lg:ml-80">
        {/* STICKY NAVBAR - Fixed at top */}
        <div className="sticky top-0 z-50 shrink-0">
          <SocialNavbar userProfile={userProfile} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* MOBILE ADS TOGGLE */}
        {isMobile && ads.length > 0 && (
          <div className="lg:hidden pt-20 px-4">
            <button
              onClick={() => setAdsExpanded(!adsExpanded)}
              className="w-full flex items-center justify-between p-4 bg-linear-to-br from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Recommended Ads</p>
                  <p className="text-sm text-white/80 opacity-90">{ads.length} available</p>
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                {adsExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>
          </div>
        )}

        {/* MOBILE ADS EXPANDED VIEW */}
        {isMobile && adsExpanded && (
          <div className="lg:hidden px-4 py-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Sponsored Content</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{ads.length} ads</span>
              </div>
              {ads.map(ad => renderAdComponent(ad))}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="pt-5 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* HEADER - Simplified */}
            <div className="mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <span>Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {router.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Home'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                    Welcome back, {user?.name}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-slate-700 dark:text-slate-300">Live</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content - Clean Layout WITHOUT extra card wrapper */}
              <div className="lg:col-span-2">
                {/* Direct children rendering without extra wrapper */}
                {children}
              </div>

              {/* DESKTOP RIGHT SIDEBAR - Fixed position with independent scroll */}
              <div className="hidden lg:block space-y-6 sticky top-20 self-start">
                {/* Profile Card - Simplified */}
                {userProfile && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                          {userProfile.user.avatar ? (
                            <img
                              src={userProfile.user.avatar}
                              alt={userProfile.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xl font-bold">
                              {userProfile.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 dark:text-white">{userProfile.user.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{userProfile.headline || 'No headline set'}</p>
                        <div className="flex gap-4 mt-3">
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-white">
                              {userProfile.socialStats?.followerCount || 0}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Followers</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-white">
                              {userProfile.socialStats?.followingCount || 0}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Following</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advertisements Section - Independent scrolling */}
                {ads.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800 dark:text-white">Recommended</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{ads.length} ads</span>
                      </div>
                    </div>

                    {/* Scrollable container that doesn't affect page scroll */}
                    <div className="h-[calc(100vh-400px)] min-h-75 max-h-150 overflow-y-auto">
                      <div className="p-5 space-y-5">
                        {ads.map(ad => renderAdComponent(ad))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="bg-linear-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 rounded-xl p-5 text-white">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Your Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-lg font-bold">
                        {adStats.totalImpressions > 0
                          ? `${((adStats.totalClicks / adStats.totalImpressions) * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">Ad CTR</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-lg font-bold">
                        {adStats.totalImpressions.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">Impressions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Banana Social v2.1.0</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}