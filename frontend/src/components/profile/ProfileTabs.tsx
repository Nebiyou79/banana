/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/ProfileTabs.tsx
import React, { useEffect, useState } from 'react';
import {
  Home,
  User,
  FileText,
  Globe,
  Users,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Package,
  Target,
  Zap,
  Star,
  BarChart3,
  ShoppingBag,
  Mail,
  Settings,
  Building,
  Users2,
  Image,
  Calendar,
  DollarSign,
  BookOpen,
  Layers,
  Shield,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Book,
  FolderOpen,
  CreditCard,
  Headphones,
  Heart,
  MessageSquare,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid,
  ShoppingCart,
  Briefcase as BriefcaseIcon,
  Award as AwardIcon,
  Globe as GlobeIcon
} from 'lucide-react';
import { CandidateProfileDisplay } from '@/components/profile/CandidateProfileSection';
import { FreelancerPortfolioDisplay } from '@/components/profile/FreelancePortfolioSection';
import { CompanyProductsSection } from '@/components/profile/CompanyProductsSection';
import { ProfileAboutSection } from '@/components/profile/ProfileAboutSection';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';
import { ProfileConnectionsSection } from '@/components/profile/ProfileConnectionsSection';
import { ProfileSocialAnalytics } from '@/components/profile/ProfileSocialAnalytics';

interface ProfileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[]; // User roles that can see this tab
  profileTypes?: string[]; // Profile types where this tab is relevant
  condition?: boolean; // Additional condition for showing tab
  premium?: boolean; // Premium feature indicator
  trending?: boolean; // Trending indicator
  count?: number; // Badge count
  disabled?: boolean; // If tab is disabled
  component?: string; // Component name to render for this tab
}

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: ProfileTab[];
  userRole: string;
  profileType?: 'candidate' | 'freelancer' | 'company' | 'organization' | 'admin' | 'user';
  variant?: 'default' | 'glass' | 'floating' | 'compact';
  showIcons?: boolean;
  isOwnProfile?: boolean;
  isPremium?: boolean;
  stats?: {
    posts?: number;
    connections?: number;
    followers?: number;
    following?: number;
    products?: number;
    portfolio?: number;
    profileViews?: number;
    applications?: number;
    messages?: number;
    achievements?: number;
  };
  // Component props for different tabs
  componentProps?: {
    candidateData?: any;
    freelancerData?: any;
    companyData?: any;
    userId?: string;
    companyId?: string;
    companyName?: string;
    currentUserId?: string;
    portfolioItems?: any[];
    freelancerName?: string;
    profileData?: any;
    socialStats?: any;
  };
  onRenderComponent?: (componentName: string, tabId: string) => React.ReactNode;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  tabs: customTabs,
  userRole,
  profileType = 'candidate',
  variant = 'glass',
  showIcons = true,
  isOwnProfile = false,
  isPremium = false,
  stats = {},
  componentProps = {},
  onRenderComponent
}) => {
  const [availableTabs, setAvailableTabs] = useState<ProfileTab[]>([]);
  const [previousTab, setPreviousTab] = useState<string>('');

  // Track previous tab for animations
  useEffect(() => {
    if (activeTab !== previousTab) {
      setPreviousTab(activeTab);
    }
  }, [activeTab]);

  // Generate tabs structure based on your requirements
  useEffect(() => {
    const generateRoleTabs = (): ProfileTab[] => {
      // COMMON TABS FOR ALL PROFILES
      const commonTabs: ProfileTab[] = [
        {
          id: 'overview',
          label: 'Overview',
          icon: <Home className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          count: 0
        },
        {
          id: 'about',
          label: 'About',
          icon: <User className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          component: 'ProfileAboutSection',
          count: 0
        },
        {
          id: 'network',
          label: 'Network',
          icon: <Users className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          component: 'ProfileConnectionsSection',
          count: stats.connections || 0
        },
        {
          id: 'posts',
          label: 'Posts',
          icon: <Globe className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          component: 'ProfilePostsSection',
          count: stats.posts || 0
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <BarChart3 className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          condition: isOwnProfile || isPremium,
          premium: !isPremium,
          component: 'ProfileSocialAnalytics',
          count: stats.profileViews || 0
        },
      ];

      // ========== ROLE-SPECIFIC TABS ==========

      // CANDIDATE SPECIFIC TABS
      if (profileType === 'candidate') {
        commonTabs.push({
          id: 'candidate-data',
          label: 'Candidate Data',
          icon: <FileText className="h-4 w-4" />,
          roles: ['candidate'],
          profileTypes: ['candidate'],
          component: 'CandidateProfileDisplay',
          count: stats.applications || 0
        });
      }

      // FREELANCER SPECIFIC TABS
      if (profileType === 'freelancer') {
        commonTabs.push({
          id: 'portfolio',
          label: 'Portfolio',
          icon: <FolderOpen className="h-4 w-4" />,
          roles: ['freelancer'],
          profileTypes: ['freelancer'],
          component: 'FreelancerPortfolioDisplay',
          count: stats.portfolio || 0,
          trending: true
        });
      }

      // COMPANY SPECIFIC TABS
      if (profileType === 'company') {
        commonTabs.push({
          id: 'products',
          label: 'Products',
          icon: <ShoppingCart className="h-4 w-4" />,
          roles: ['company'],
          profileTypes: ['company'],
          component: 'CompanyProductsSection',
          count: stats.products || 0
        });
      }

      // ORGANIZATION SPECIFIC TABS
      if (profileType === 'organization') {
        commonTabs.push({
          id: 'projects',
          label: 'Projects',
          icon: <Target className="h-4 w-4" />,
          roles: ['organization'],
          profileTypes: ['organization'],
          component: 'ProjectsSection',
          count: 0
        });
      }

      // ========== PERSONAL TABS (OWN PROFILE ONLY) ==========
      if (isOwnProfile) {
        // Messages Tab (Coming Soon)
        commonTabs.push({
          id: 'messages',
          label: 'Messages',
          icon: <Mail className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          disabled: true,
          count: stats.messages || 0
        });

        // Settings Tab (Coming Soon)
        commonTabs.push({
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          disabled: true,
          count: 0
        });

        // Achievements Tab (Coming Soon)
        commonTabs.push({
          id: 'achievements',
          label: 'Achievements',
          icon: <Award className="h-4 w-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization'],
          disabled: true,
          count: stats.achievements || 0
        });
      }

      return commonTabs;
    };

    const roleTabs = generateRoleTabs();
    const filteredTabs = roleTabs.filter(tab => {
      // Check if tab is for current user role
      const roleAllowed = !tab.roles || tab.roles.includes(userRole);

      // Check if tab is for current profile type
      const profileTypeAllowed = !tab.profileTypes || tab.profileTypes.includes(profileType);

      // Check conditions
      const conditionsMet = tab.condition === undefined || tab.condition === true;

      // Check if tab should be visible
      return roleAllowed && profileTypeAllowed && conditionsMet;
    });

    setAvailableTabs(filteredTabs);
  }, [userRole, profileType, isOwnProfile, isPremium, stats]);

  const getTabClasses = (tab: ProfileTab, isActive: boolean) => {
    const baseClasses = "flex items-center gap-2 font-medium transition-all duration-300 relative group px-4 py-3 rounded-xl";

    const activeClasses = isActive
      ? tab.premium
        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-xl'
        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
      : tab.disabled
        ? 'text-gray-400 cursor-not-allowed'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50';

    const variantClasses = {
      compact: 'text-sm px-3 py-2 rounded-lg',
      floating: 'shadow-lg hover:shadow-xl hover:-translate-y-0.5',
      glass: 'backdrop-blur-sm bg-white/50 hover:bg-white/80 border border-gray-200/50',
      default: 'border hover:border-gray-300'
    }[variant];

    const disabledClasses = tab.disabled ? 'opacity-60 cursor-not-allowed hover:bg-transparent' : '';

    return `${baseClasses} ${activeClasses} ${variantClasses} ${disabledClasses}`;
  };

  const getContainerClasses = () => {
    const baseClasses = "flex flex-wrap gap-2 p-4 backdrop-blur-xl rounded-2xl relative overflow-hidden";

    const variantClasses = {
      compact: 'bg-gradient-to-b from-gray-50 to-white border border-gray-200',
      floating: 'bg-gradient-to-b from-white/80 to-gray-50/80 border border-gray-200/50 shadow-2xl',
      glass: 'bg-gradient-to-b from-white/60 to-gray-50/60 border border-gray-200/30 shadow-xl',
      default: 'bg-white border border-gray-200 shadow-lg'
    }[variant];

    return `${baseClasses} ${variantClasses}`;
  };

  const getGlowEffect = (tab: ProfileTab) => {
    if (tab.disabled) return null;

    if (tab.premium) {
      return (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      );
    }
    if (tab.trending) {
      return (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      );
    }
    return null;
  };

  const getCountBadge = (count: number, tabId: string) => {
    if (count <= 0) return null;

    let badgeClass = 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';

    if (tabId === 'analytics' && count > 1000) {
      badgeClass = 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white';
    } else if (tabId === 'messages' && count > 0) {
      badgeClass = 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
    } else if (tabId === 'applications' && count > 0) {
      badgeClass = 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    }

    return (
      <span className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-semibold rounded-full ${badgeClass}`}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    const tab = availableTabs.find(t => t.id === tabId);
    if (!tab || tab.disabled) return;

    setPreviousTab(activeTab);
    onTabChange(tabId);
  };

  // Use custom tabs if provided, otherwise use generated tabs
  const tabsToRender = customTabs && customTabs.length > 0 ? customTabs : availableTabs;

  return (
    <div className={getContainerClasses()}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <nav className="relative z-10 flex flex-wrap items-center gap-2">
        {tabsToRender.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={getTabClasses(tab, isActive)}
              aria-label={`View ${tab.label}`}
              disabled={tab.disabled}
              title={tab.disabled ? 'Coming Soon' : ''}
            >
              {/* Glow effect */}
              {getGlowEffect(tab)}

              {/* Tab content */}
              <div className="relative z-10 flex items-center gap-2">
                {showIcons && tab.icon && (
                  <span className={`flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                    {tab.icon}
                  </span>
                )}

                <span className="whitespace-nowrap font-medium">
                  {tab.label}
                  {tab.disabled && (
                    <span className="ml-1 text-xs text-gray-500">(Soon)</span>
                  )}
                </span>

                {/* Count badge */}
                {tab.count !== undefined && getCountBadge(tab.count, tab.id)}

                {/* Premium badge */}
                {tab.premium && !isActive && !tab.disabled && (
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                )}

                {/* Trending indicator */}
                {tab.trending && !isActive && !tab.disabled && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
              </div>

              {/* Active indicator */}
              {isActive && !tab.disabled && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
            </button>
          );
        })}

        {/* Extra action button for premium users */}
        {isPremium && variant !== 'compact' && (
          <button
            onClick={() => window.location.href = '/premium/features'}
            className="group flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4" />
            <span>Premium</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </nav>

      {/* Scroll indicator for many tabs */}
      {tabsToRender.length > 6 && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-400/50 animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-gray-600/50 animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-gray-800/50 animate-pulse" />
        </div>
      )}
    </div>
  );
};

// Tab Content Wrapper Component
export const ProfileTabContent: React.FC<{
  activeTab: string;
  userRole: string;
  profileType?: string;
  isPremium?: boolean;
  isOwnProfile?: boolean;
  profileData?: any;
  socialStats?: any;
  componentProps?: Record<string, any>;
  className?: string;
}> = ({
  activeTab,
  userRole,
  profileType = 'candidate',
  isPremium = false,
  isOwnProfile = false,
  profileData = {},
  socialStats = {},
  componentProps = {},
  className = ''
}) => {
    // Map tab IDs to component names
    const tabComponentMap: Record<string, React.ComponentType<any>> = {
      'about': ProfileAboutSection,
      'posts': ProfilePostsSection,
      'network': ProfileConnectionsSection,
      'analytics': ProfileSocialAnalytics,
      'candidate-data': CandidateProfileDisplay,
      'portfolio': FreelancerPortfolioDisplay,
      'products': CompanyProductsSection,
    };

    // Check if this is a "Coming Soon" tab
    const comingSoonTabs = ['messages', 'settings', 'achievements'];

    if (comingSoonTabs.includes(activeTab)) {
      return (
        <div className={`backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 p-8 shadow-xl ${className}`}>
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This feature is currently under development. We`re working hard to bring it to you soon!
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.href = '/feedback'}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Give Feedback
              </button>
              <button
                onClick={() => window.location.href = '/updates'}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transition-shadow"
              >
                Get Updates
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Handle analytics tab access control
    if (activeTab === 'analytics') {
      if (!isOwnProfile && !isPremium) {
        return (
          <div className={`backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 p-8 shadow-xl ${className}`}>
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Analytics Unavailable</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {isOwnProfile
                  ? 'Upgrade to Premium to access detailed analytics and insights about your profile performance.'
                  : 'Analytics are only available to profile owners. Connect with this user to learn more about them.'
                }
              </p>
              {isOwnProfile && !isPremium && (
                <button
                  onClick={() => window.location.href = '/premium/analytics'}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-lg hover:shadow-lg transition-shadow hover:scale-105 transform duration-300"
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Upgrade to Premium Analytics
                </button>
              )}
            </div>
          </div>
        );
      }
    }

    // Get component for active tab
    const Component = tabComponentMap[activeTab];

    if (!Component) {
      // Default content for tabs without specific components (Overview)
      if (activeTab === 'overview') {
        return (
          <div className={`backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 p-6 md:p-8 shadow-xl ${className}`}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Overview
              </h3>
              <p className="text-gray-600">Welcome to your profile overview. Select a tab to view specific sections.</p>
            </div>
          </div>
        );
      }

      // For other undefined tabs
      return (
        <div className={`backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 p-6 md:p-8 shadow-xl ${className}`}>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h3>
            <p className="text-gray-600">Content for this section will be displayed here.</p>
          </div>
        </div>
      );
    }

    // Prepare props for specific components
    const getComponentProps = () => {
      const baseProps = { ...componentProps };

      switch (activeTab) {
        case 'about':
          return { profile: profileData, ...baseProps };
        case 'posts':
          return {
            userId: profileData?.user?._id || profileData?._id,
            isOwnProfile,
            currentUserId: profileData?.user?._id || profileData?._id,
            ...baseProps
          };
        case 'network':
          return {
            userId: profileData?.user?._id || profileData?._id,
            isOwnProfile,
            ...baseProps
          };
        case 'analytics':
          return {
            stats: socialStats,
            variant: 'glass',
            showTrends: true,
            timeRange: 'monthly',
            ...baseProps
          };
        case 'candidate-data':
          return {
            profile: profileData?.candidateProfile || profileData,
            ...baseProps
          };
        case 'portfolio':
          return {
            portfolioItems: profileData?.portfolio || profileData?.roleSpecific?.portfolio || [],
            freelancerName: profileData?.user?.name || profileData?.name,
            showFullList: true,
            showStats: true,
            ...baseProps
          };
        case 'products':
          return {
            companyId: profileData?.user?._id || profileData?._id || componentProps.companyId,
            companyName: profileData?.user?.name || profileData?.name || componentProps.companyName,
            isOwnCompany: isOwnProfile,
            ...baseProps
          };
        default:
          return baseProps;
      }
    };

    return (
      <div className={`backdrop-blur-xl bg-gradient-to-b from-white/90 to-gray-50/90 rounded-3xl border border-gray-200/50 p-6 md:p-8 shadow-xl ${className}`}>
        <Component {...getComponentProps()} />
      </div>
    );
  };

// Tab Transition Wrapper
export const TabTransitionWrapper: React.FC<{
  children: React.ReactNode;
  activeTab: string;
  previousTab?: string;
  className?: string;
}> = ({ children, activeTab, previousTab, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        key={activeTab}
        className="animate-in fade-in-0 duration-300"
      >
        {children}
      </div>
    </div>
  );
};