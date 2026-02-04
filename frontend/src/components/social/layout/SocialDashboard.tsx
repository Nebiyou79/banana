import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState} from 'react';
import SocialSidebar from './SocialSidebar';
import { profileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Zap, TrendingUp, Bell, ChevronRight, ChevronUp } from 'lucide-react';
import { Profile } from '@/services/profileService';
import CandidateAdCard from '../CandidateAdCard';
import CompanyAdCard from '../CompanyAdCard';
import FreelancerAdCard from '../FreelanceAdCard';
import OrganizationAdCard from '../OrganizationAdCard';
import { getAdsForRole, adConfig, AdData } from '@/data/ads';
import { RoleThemeProvider, useTheme } from '@/components/social/theme/RoleThemeProvider';
import React from 'react';
import SocialNavbar from './SocialNavbar';

interface SocialDashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'company' | 'freelancer' | 'admin' | 'organization';
  adLimit?: number;
}

// Main layout component with RoleThemeProvider
export function SocialDashboardLayout({
  children,
  requiredRole,
  adLimit = 3
}: SocialDashboardLayoutProps) {
  return (
    <RoleThemeProvider overrideRole={requiredRole}>
      <SocialDashboardContent
        requiredRole={requiredRole}
        adLimit={adLimit}
      >
        {children}
      </SocialDashboardContent>
    </RoleThemeProvider>
  );
}

// Separate component for content that uses the theme
function SocialDashboardContent({
  children,
  requiredRole,
  adLimit = 3
}: SocialDashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { getPageBgStyle, getCardStyle, getButtonClasses, colors, role } = useTheme();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [ads, setAds] = useState<AdData[]>([]);
  const [adStats, setAdStats] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    totalEngagement: 0
  });
  const [adsExpanded, setAdsExpanded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  /* ------------------------ Animation States ------------------------ */
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [adsLoaded, setAdsLoaded] = useState(false);

  /* ------------------------ Detect Screen Size ------------------------ */
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      setWindowWidth(width);
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
      if (mobile) setAdsExpanded(false);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /* ------------------ Page Load Animation ------------------ */
  useEffect(() => {
    setPageLoaded(true);

    // Staggered animations
    const timer1 = setTimeout(() => setHeroLoaded(true), 300);
    const timer2 = setTimeout(() => setStatsLoaded(true), 600);
    const timer3 = setTimeout(() => setAdsLoaded(true), 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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
        totalClicks: acc.totalClicks + ad.clicks,
        totalEngagement: acc.totalEngagement
      }), { totalImpressions: 0, totalClicks: 0, totalEngagement: 0 });

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

  /* -------------------- Loading State with Animation -------------------- */
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={getPageBgStyle()}>
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-ping animate-duration-[2000ms] animate-infinite"
            style={{ backgroundColor: colors.primary + '10' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse animate-delay-[1000ms] animate-duration-[3000ms]"
            style={{ backgroundColor: colors.secondary + '10' }}
          />
        </div>

        {/* Animated loader with theme colors */}
        <div className="relative text-center animate-in zoom-in duration-300">
          <div className="relative">
            {/* Outer ring */}
            <div
              className="w-24 h-24 border-4 rounded-full"
              style={{ borderColor: colors.primary + '20' }}
            ></div>
            {/* Spinning ring */}
            <div
              className="absolute inset-0 w-24 h-24 border-4 rounded-full animate-spin"
              style={{ borderColor: `${colors.primary} transparent transparent transparent` }}
            ></div>
            {/* Inner pulsing dot */}
            <div
              className="absolute inset-4 w-16 h-16 rounded-full animate-pulse"
              style={{ backgroundColor: colors.primary + '30' }}
            ></div>
          </div>
          <p
            className="mt-6 text-lg font-semibold animate-in fade-in-up duration-500"
            style={{ color: colors.primary }}
          >
            Loading your dashboard...
          </p>
          <p
            className="mt-2 text-sm animate-in fade-in-up duration-500 animate-delay-300"
            style={{ color: colors.secondary }}
          >
            Role: <span className="font-medium">{role}</span>
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  /* ------------------ Access Denied Screen with Animation ------------------ */
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center relative animate-in fade-in duration-500" style={getPageBgStyle()}>
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/10 animate-pulse" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-shimmer animate-duration-[2000ms] animate-infinite" />
        </div>

        <div
          className="relative text-center p-8 md:p-12 rounded-2xl border backdrop-blur-2xl shadow-2xl max-w-md mx-4 animate-in zoom-in duration-700"
          style={getCardStyle()}
        >
          {/* Animated icon */}
          <div className="relative mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-in bounce-in duration-1000"
              style={{ background: `linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)` }}
            >
              <svg className="w-10 h-10 text-white animate-pulse" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M5.07 19h13.86L12 3 5.07 19z" />
              </svg>
            </div>
            {/* Ring animation */}
            <div
              className="absolute inset-0 w-20 h-20 border-4 rounded-full animate-ping"
              style={{ borderColor: '#EF4444' + '30' }}
            ></div>
          </div>

          <h2
            className="text-3xl font-bold mb-3 animate-in fade-in-up duration-700 animate-delay-300"
            style={{ color: colors.error || '#EF4444' }}
          >
            Access Denied
          </h2>
          <p
            className="text-lg tracking-wide animate-in fade-in-up duration-700 animate-delay-500"
            style={{ color: colors.secondary }}
          >
            You don`t have permission to access this page.
          </p>

          {/* Animated button */}
          <button
            onClick={() => router.push(`/dashboard/${user?.role}/social`)}
            className="mt-6 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 animate-in fade-in-up duration-700 animate-delay-700"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              color: 'white'
            }}
          >
            Go to Your Dashboard
          </button>
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

  // Get avatar URL with placeholder
  const getAvatarUrl = () => {
    if (userProfile?.avatar?.secure_url) {
      return userProfile.avatar.secure_url;
    }
    if (userProfile?.user.avatar) {
      return userProfile.user.avatar;
    }
    const initials = user?.name?.charAt(0).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(colors.primary)}&color=fff&size=150`;
  };

  // Determine sidebar width based on screen size
  const getSidebarWidth = () => {
    if (windowWidth < 1280) return 'w-[340px]'; // For 1024px - 1279px screens
    if (windowWidth < 1536) return 'w-[380px]'; // For 1280px - 1535px screens
    return 'w-[420px]'; // For 1536px+ screens
  };

  const getMainMargin = () => {
    if (windowWidth < 1280) return 'lg:mr-[340px]';
    if (windowWidth < 1536) return 'lg:mr-[380px]';
    return 'lg:mr-[420px]';
  };

  const isCompactMode = windowWidth < 1280;

  /* ------------------- MAIN LAYOUT ------------------- */
  return (
    <div className={`flex min-h-screen relative overflow-hidden animate-in fade-in duration-500 transition-all duration-300 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`} style={getPageBgStyle()}>
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl animate-float animate-duration-[15s] animate-delay-0"
          style={{ backgroundColor: colors.primary + '5' }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl animate-float animate-duration-[20s] animate-delay-1000"
          style={{ backgroundColor: colors.secondary + '5' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full blur-3xl animate-float animate-duration-[25s] animate-delay-2000"
          style={{ backgroundColor: colors.accent + '5' }}
        />
      </div>

      {/* DESKTOP LEFT SIDEBAR with Animation */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 animate-in slide-in-from-left-0 duration-500 w-80">
        <div className="h-full">
          <SocialSidebar userProfile={userProfile} />
        </div>
      </div>

      {/* MOBILE SIDEBAR with Animation */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-in slide-in-from-left-80 duration-300">
            <SocialSidebar
              userProfile={userProfile}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* DESKTOP RIGHT ADS SIDEBAR - RESPONSIVE WIDTH */}
      {!isMobile && (
        <div className={`hidden lg:block fixed right-0 top-0 bottom-0 z-20 animate-in slide-in-from-right-0 duration-500 ${getSidebarWidth()}`}>
          <div className={`h-full overflow-y-auto pt-24 pb-8 ${isCompactMode ? 'px-3' : 'px-4'} ${windowWidth >= 1536 ? 'px-5' : ''}`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${colors.primary + '30'} transparent`,
            }}
          >
            {/* Custom scrollbar styles */}
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background: ${colors.primary}30;
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: ${colors.primary}50;
              }
            `}</style>

            <div className="space-y-5">
              {/* Profile Card - RESPONSIVE */}
              {userProfile && (
                <div
                  className={`rounded-xl shadow-sm ${isCompactMode ? 'p-3' : 'p-4'} animate-in slide-in-from-right-0 duration-500`}
                  style={{
                    ...getCardStyle(),
                    border: `1px solid ${colors.cardBorderLight || '#e5e7eb'}`
                  }}
                >
                  <div className={`flex items-center ${isCompactMode ? 'gap-3' : 'gap-4'}`}>
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className={`${isCompactMode ? 'w-14 h-14' : 'w-16 h-16'} rounded-lg flex items-center justify-center overflow-hidden shadow-lg border-2`}
                        style={{
                          borderColor: colors.cardBgLight || 'white',
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                        }}
                      >
                        {getAvatarUrl() ? (
                          <img
                            src={getAvatarUrl()}
                            alt={userProfile.user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('span');
                                fallback.textContent = userProfile.user.name?.charAt(0).toUpperCase() || 'U';
                                fallback.className = 'text-white text-lg font-bold';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span className={`${isCompactMode ? 'text-base' : 'text-lg'} text-white font-bold`}>
                            {userProfile.user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      {/* Online status indicator */}
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border"
                        style={{
                          background: colors.success,
                          borderColor: colors.cardBgLight || 'white'
                        }}
                      />
                    </div>

                    {/* User Info - COMPACT */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold truncate ${isCompactMode ? 'text-sm' : ''}`}
                        style={{ color: colors.primary }}
                      >
                        {userProfile.user.name}
                      </h3>
                      <p
                        className={`truncate mt-1 ${isCompactMode ? 'text-xs' : 'text-sm'}`}
                        style={{ color: colors.secondary }}
                      >
                        {isCompactMode 
                          ? (userProfile.headline?.substring(0, 40) || 'No headline')
                          : (userProfile.headline?.substring(0, 50) || 'No headline set')}
                        {userProfile.headline && ((isCompactMode && userProfile.headline.length > 40) || (!isCompactMode && userProfile.headline.length > 50)) ? '...' : ''}
                      </p>

                      {/* Stats - HORIZONTAL */}
                      <div className={`flex ${isCompactMode ? 'gap-3 mt-2' : 'gap-4 mt-3'}`}>
                        <div className="text-center">
                          <div
                            className={`font-semibold ${isCompactMode ? 'text-xs' : 'text-sm'}`}
                            style={{ color: colors.primary }}
                          >
                            {userProfile.socialStats?.followerCount || 0}
                          </div>
                          <div
                            className={isCompactMode ? 'text-[10px]' : 'text-xs'}
                            style={{ color: colors.secondary }}
                          >
                            Followers
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`font-semibold ${isCompactMode ? 'text-xs' : 'text-sm'}`}
                            style={{ color: colors.primary }}
                          >
                            {userProfile.socialStats?.followingCount || 0}
                          </div>
                          <div
                            className={isCompactMode ? 'text-[10px]' : 'text-xs'}
                            style={{ color: colors.secondary }}
                          >
                            Following
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sponsored Ads Section */}
              {ads.length > 0 && (
                <div
                  className="rounded-xl overflow-hidden animate-in slide-in-from-right-0 duration-500 animate-delay-300"
                  style={{
                    ...getCardStyle(),
                    border: `1px solid ${colors.cardBorderLight || '#e5e7eb'}`
                  }}
                >
                  {/* Ad Header */}
                  <div
                    className={`${isCompactMode ? 'px-3 py-2' : 'px-4 py-3'} border-b flex items-center justify-between`}
                    style={{
                      borderColor: colors.primary + '20',
                      background: colors.cardBgLight
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className={`${isCompactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: colors.accent }} />
                      <span
                        className={`font-semibold ${isCompactMode ? 'text-xs' : 'text-sm'}`}
                        style={{ color: colors.primary }}
                      >
                        Sponsored
                      </span>
                    </div>
                    <span
                      className={`${isCompactMode ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded-full`}
                      style={{
                        background: colors.primary + '10',
                        color: colors.primary
                      }}
                    >
                      {ads.length}
                    </span>
                  </div>

                  {/* Ads Content */}
                  <div className={`${isCompactMode ? 'p-3 space-y-4' : 'p-4 space-y-5'}`}>
                    {ads.map((ad, index) => (
                      <div
                        key={ad.id}
                        className="animate-in fade-in-up duration-500"
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        <div className="w-full">
                          {renderAdComponent(ad)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats Card */}
              <div
                className={`rounded-xl animate-in slide-in-from-right-0 duration-500 animate-delay-500 ${isCompactMode ? 'p-3' : 'p-4'}`}
                style={{
                  ...getCardStyle(),
                  border: `1px solid ${colors.cardBorderLight || '#e5e7eb'}`
                }}
              >
                <h4
                  className={`font-semibold mb-3 flex items-center gap-2 ${isCompactMode ? 'text-xs' : 'text-sm'}`}
                  style={{ color: colors.primary }}
                >
                  <TrendingUp className={`${isCompactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                  Ad Performance
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={isCompactMode ? 'text-xs' : 'text-sm'} style={{ color: colors.secondary }}>Impressions</span>
                    <span style={{ color: colors.primary }} className={`font-semibold ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
                      {adStats.totalImpressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isCompactMode ? 'text-xs' : 'text-sm'} style={{ color: colors.secondary }}>Clicks</span>
                    <span style={{ color: colors.primary }} className={`font-semibold ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
                      {adStats.totalClicks.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isCompactMode ? 'text-xs' : 'text-sm'} style={{ color: colors.secondary }}>CTR</span>
                    <span style={{ color: colors.primary }} className={`font-semibold ${isCompactMode ? 'text-xs' : 'text-sm'}`}>
                      {adStats.totalImpressions > 0
                        ? `${((adStats.totalClicks / adStats.totalImpressions) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* View All Button */}
                <button
                  className={`w-full mt-3 rounded-lg font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${isCompactMode ? 'py-2 text-xs' : 'py-2.5 text-sm'}`}
                  style={{
                    background: `${colors.primary}10`,
                    color: colors.primary
                  }}
                >
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA - RESPONSIVE MARGINS */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${!isMobile ? `lg:ml-80 ${getMainMargin()}` : ''}`}>
        {/* STICKY NAVBAR - Animated entrance */}
        <div className="sticky top-0 z-50 shrink-0 animate-in slide-in-from-top-0 duration-500"
          style={{ background: colors.cardBgLight || 'white' }}>
          <SocialNavbar
            userProfile={userProfile}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            colors={colors}
            role={role}
          />
        </div>

        {/* MOBILE ADS TOGGLE with Animation */}
        {isMobile && ads.length > 0 && (
          <div className="lg:hidden pt-20 px-4 animate-in fade-in-up duration-500">
            <button
              onClick={() => setAdsExpanded(!adsExpanded)}
              className="w-full flex items-center justify-between p-4 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] animate-in fade-in-up duration-500 animate-delay-300"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Recommended Ads</p>
                  <p className="text-sm text-white/80 opacity-90">{ads.length} available</p>
                </div>
              </div>
              <div className={`p-2 bg-white/20 rounded-lg transition-transform duration-300 ${adsExpanded ? 'rotate-180' : ''}`}>
                <ChevronUp className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}

        {/* MOBILE ADS EXPANDED VIEW with Animation */}
        {isMobile && adsExpanded && (
          <div className="lg:hidden px-4 py-4 animate-in slide-in-from-top-0 duration-300">
            <div className="rounded-xl border shadow-lg p-4 space-y-4 animate-in fade-in-up duration-300" style={getCardStyle()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold" style={{ color: colors.primary }}>Sponsored Content</h3>
                <span className="text-xs" style={{ color: colors.secondary }}>{ads.length} ads</span>
              </div>
              {ads.map((ad, index) => (
                <div
                  key={ad.id}
                  className="animate-in fade-in-up duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {renderAdComponent(ad)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* HEADER with Animation */}
            <div className="mb-6 lg:mb-8 animate-in fade-in-up duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div
                    className="flex pt-15 items-center gap-2 text-sm mb-2 animate-in slide-in-from-left-0 duration-700"
                    style={{ color: colors.secondary }}
                  >
                    <span>Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                    <span
                      className="font-medium"
                      style={{ color: colors.primary }}
                    >
                      {router.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Home'}
                    </span>
                  </div>
                  <h1
                    className="text-2xl sm:text-3xl font-bold animate-in fade-in-up duration-500"
                    style={{
                      color: colors.primary,
                      opacity: heroLoaded ? 1 : 0
                    }}
                  >
                    Welcome back, <span style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>{user?.name}</span>
                  </h1>
                  <p
                    className="mt-1 text-sm animate-in fade-in-up duration-500 animate-delay-200"
                    style={{ color: colors.secondary }}
                  >
                    Role: <span className="font-medium">{role}</span> • Stay connected with your network
                  </p>
                </div>

                <div className="flex items-center gap-3 animate-in fade-in-up duration-500 animate-delay-300">
                  {/* Live Status with Pulse Animation */}
                  <div
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm animate-pulse animate-duration-[2000ms] animate-infinite"
                    style={getCardStyle()}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-ping animate-duration-[1000ms] animate-infinite"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <span style={{ color: colors.primary }}>Live</span>
                    <Sparkles
                      className="w-4 h-4 animate-bounce animate-duration-[3000ms]"
                      style={{ color: colors.accent }}
                    />
                  </div>
                  <button className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${getButtonClasses('ghost')}`}>
                    <Bell className="w-5 h-5" style={{ color: colors.primary }} />
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="animate-in fade-in-up duration-500">
              <div className="space-y-6">
                {React.Children.map(children, (child, index) => (
                  <div
                    className="animate-in fade-in-up duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {child}
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-center gap-2 mt-12 pt-8 pb-4 text-sm animate-in fade-in-up duration-500 animate-delay-700 border-t"
              style={{
                borderColor: colors.primary + '20',
                borderTopWidth: '1px'
              }}>
              <Zap
                className="w-4 h-4 animate-pulse animate-duration-[2000ms]"
                style={{ color: colors.accent }}
              />
              <span style={{ color: colors.secondary }}>Banana Social v2.1.0 • </span>
              <span className="font-medium" style={{ color: colors.primary }}>{role} Edition</span>
            </div>

            {/* SECOND FOOTER LINE */}
            <div className="text-center pb-8 text-xs animate-in fade-in-up duration-500 animate-delay-800"
              style={{ color: colors.info || '#6b7280' }}>
              {new Date().getFullYear()} • All rights reserved
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}