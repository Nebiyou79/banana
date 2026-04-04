/* eslint-disable @typescript-eslint/no-explicit-any */
// components/profile/ProfileTabs.tsx
import React, { useEffect, useState } from 'react';
import {
  Home,
  User,
  FileText,
  Globe,
  Users,
  Award,
  Target,
  Star,
  BarChart3,
  Mail,
  Settings,
  TrendingUp,
  ChevronRight,
  Sparkles,
  FolderOpen,
  ShoppingCart,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FreelancerPortfolioDisplay } from '@/components/profile/FreelancePortfolioSection';
import { CompanyProductsSection } from '@/components/profile/CompanyProductsSection';
import { ProfileAboutSection } from '@/components/profile/ProfileAboutSection';
import { ProfilePostsSection } from '@/components/profile/ProfilePostsSection';
import { ProfileConnectionsSection } from '@/components/profile/ProfileConnectionsSection';
import { ProfileSocialAnalytics } from '@/components/profile/ProfileSocialAnalytics';
import CandidateProfileView from './CandidateProfileSection';
import PublicCandidateProfileView from './PublicCandidateProfileView';
import { getTheme } from '@/utils/color';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/social/theme/RoleThemeProvider';

interface ProfileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[];
  profileTypes?: string[];
  condition?: boolean;
  premium?: boolean;
  trending?: boolean;
  count?: number;
  disabled?: boolean;
  component?: string;
}

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: ProfileTab[];
  userRole: string;
  profileType?: 'candidate' | 'freelancer' | 'company' | 'organization' | 'admin' | 'user';
  variant?: 'default' | 'glass' | 'floating' | 'compact' | 'pill' | 'underline';
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
  themeMode?: 'light' | 'dark';
  className?: string;
}

// Role-based gradient configuration
const ROLE_GRADIENTS = {
  candidate: 'from-blue-500 to-cyan-500',
  freelancer: 'from-amber-500 to-orange-500',
  company: 'from-teal-500 to-emerald-500',
  organization: 'from-indigo-500 to-purple-500',
  admin: 'from-purple-500 to-pink-500'
};

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
  themeMode = 'light',
  className = ''
}) => {
  const { mode } = useTheme();
  const [availableTabs, setAvailableTabs] = useState<ProfileTab[]>([]);
  const [previousTab, setPreviousTab] = useState<string>('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const theme = getTheme(themeMode);
  const roleGradient = ROLE_GRADIENTS[profileType as keyof typeof ROLE_GRADIENTS] || ROLE_GRADIENTS.candidate;

  // Track previous tab for animations
  useEffect(() => {
    if (activeTab !== previousTab) {
      setPreviousTab(activeTab);
    }
  }, [activeTab]);

  // Generate tabs structure
  useEffect(() => {
    const generateRoleTabs = (): ProfileTab[] => {
      const commonTabs: ProfileTab[] = [
        {
          id: 'overview',
          label: 'Overview',
          icon: <Home className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          count: 0
        },
        {
          id: 'about',
          label: 'About',
          icon: <User className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          component: 'ProfileAboutSection',
          count: 0
        },
        {
          id: 'network',
          label: 'Network',
          icon: <Users className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          component: 'ProfileConnectionsSection',
          count: stats.connections || 0
        },
        {
          id: 'posts',
          label: 'Posts',
          icon: <Globe className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          component: 'ProfilePostsSection',
          count: stats.posts || 0
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <BarChart3 className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin', 'user'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          condition: isOwnProfile || isPremium,
          premium: !isPremium,
          component: 'ProfileSocialAnalytics',
          count: stats.profileViews || 0
        },
      ];

      if (profileType === 'candidate') {
        commonTabs.push({
          id: 'candidate-data',
          label: 'Candidate Data',
          icon: <FileText className="w-4 h-4" />,
          roles: ['candidate'],
          profileTypes: ['candidate'],
          component: 'CandidateProfileView',
          count: stats.applications || 0
        });
      }

      if (profileType === 'freelancer') {
        commonTabs.push({
          id: 'portfolio',
          label: 'Portfolio',
          icon: <FolderOpen className="w-4 h-4" />,
          roles: ['freelancer'],
          profileTypes: ['freelancer'],
          component: 'FreelancerPortfolioDisplay',
          count: stats.portfolio || 0,
          trending: true
        });
      }

      if (profileType === 'company') {
        commonTabs.push({
          id: 'products',
          label: 'Products',
          icon: <ShoppingCart className="w-4 h-4" />,
          roles: ['company'],
          profileTypes: ['company'],
          component: 'CompanyProductsSection',
          count: stats.products || 0
        });
      }

      if (profileType === 'organization') {
        commonTabs.push({
          id: 'projects',
          label: 'Projects',
          icon: <Target className="w-4 h-4" />,
          roles: ['organization'],
          profileTypes: ['organization'],
          component: 'ProjectsSection',
          count: 0
        });
      }

      if (isOwnProfile) {
        commonTabs.push({
          id: 'messages',
          label: 'Messages',
          icon: <Mail className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          disabled: true,
          count: stats.messages || 0
        });

        commonTabs.push({
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4" />,
          roles: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          profileTypes: ['candidate', 'freelancer', 'company', 'organization', 'admin'],
          disabled: true,
          count: 0
        });

        commonTabs.push({
          id: 'achievements',
          label: 'Achievements',
          icon: <Award className="w-4 h-4" />,
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
      const roleAllowed = !tab.roles || tab.roles.includes(userRole);
      const profileTypeAllowed = !tab.profileTypes || tab.profileTypes.includes(profileType);
      const conditionsMet = tab.condition === undefined || tab.condition === true;
      return roleAllowed && profileTypeAllowed && conditionsMet;
    });

    setAvailableTabs(filteredTabs);
  }, [userRole, profileType, isOwnProfile, isPremium, stats]);

  const getTabClasses = (tab: ProfileTab, isActive: boolean) => {
    const baseClasses = cn(
      "flex items-center gap-2 font-medium transition-all duration-300 relative group",
      "px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      themeMode === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
    );

    // Variant-specific base styles
    const variantStyles = {
      pill: cn(
        "rounded-full",
        isActive
          ? `bg-linear-to-r ${roleGradient} text-white shadow-lg`
          : themeMode === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
      ),
      underline: cn(
        "rounded-none border-b-2",
        isActive
          ? `border-transparent bg-linear-to-r ${roleGradient} bg-clip-text text-transparent font-bold`
          : themeMode === 'dark'
            ? 'text-gray-400 hover:text-gray-300 border-transparent'
            : 'text-gray-600 hover:text-gray-900 border-transparent',
        "border-b-2",
        isActive && `border-${roleGradient.split(' ')[0].replace('from-', '')}`
      ),
      glass: cn(
        "rounded-xl backdrop-blur-sm",
        isActive
          ? `bg-linear-to-r ${roleGradient} text-white shadow-lg`
          : themeMode === 'dark'
            ? 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/50 border border-gray-700/30'
            : 'bg-white/50 text-gray-700 hover:bg-white/80 border border-gray-200/50',
        "border"
      ),
      floating: cn(
        "rounded-xl shadow-md",
        isActive
          ? `bg-linear-to-r ${roleGradient} text-white shadow-xl -translate-y-1`
          : themeMode === 'dark'
            ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200',
        "border hover:shadow-lg transition-all"
      ),
      compact: cn(
        "rounded-lg text-sm",
        isActive
          ? `bg-linear-to-r ${roleGradient} text-white`
          : themeMode === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      ),
      default: cn(
        "rounded-lg",
        isActive
          ? `bg-linear-to-r ${roleGradient} text-white`
          : themeMode === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      )
    }[variant];

    const disabledStyles = tab.disabled
      ? cn(
          "opacity-50 cursor-not-allowed hover:bg-transparent",
          themeMode === 'dark' ? 'text-gray-600' : 'text-gray-400'
        )
      : '';

    return cn(baseClasses, variantStyles, disabledStyles);
  };

  const getContainerClasses = () => {
    const baseClasses = cn(
      "flex flex-wrap items-center gap-1 md:gap-2 p-2 md:p-3 rounded-2xl relative overflow-hidden",
      "backdrop-blur-xl transition-all duration-300"
    );

    const variantClasses = {
      pill: cn(
        themeMode === 'dark'
          ? 'bg-gray-900/50 border border-gray-800'
          : 'bg-white/50 border border-gray-200',
        "shadow-lg"
      ),
      underline: cn(
        themeMode === 'dark'
          ? 'border-b border-gray-800'
          : 'border-b border-gray-200',
        "rounded-none bg-transparent shadow-none"
      ),
      glass: cn(
        themeMode === 'dark'
          ? 'bg-gray-900/30 border border-gray-800/50'
          : 'bg-white/30 border border-gray-200/50',
        "shadow-xl"
      ),
      floating: cn(
        themeMode === 'dark'
          ? 'bg-gray-900/80 border border-gray-800'
          : 'bg-white/80 border border-gray-200',
        "shadow-2xl"
      ),
      compact: cn(
        themeMode === 'dark'
          ? 'bg-gray-900/90 border border-gray-800'
          : 'bg-white/90 border border-gray-200',
        "shadow-md"
      ),
      default: cn(
        themeMode === 'dark'
          ? 'bg-gray-900/50 border border-gray-800'
          : 'bg-white/50 border border-gray-200',
        "shadow-lg"
      )
    }[variant];

    return cn(baseClasses, variantClasses);
  };

  const getCountBadge = (count: number, tabId: string) => {
    if (count <= 0) return null;

    let badgeClasses = cn(
      "inline-flex items-center justify-center min-w-5 h-5 md:min-w-6 md:h-6 px-1 text-xs font-semibold rounded-full",
      "shadow-sm"
    );

    if (tabId === 'analytics' && count > 1000) {
      badgeClasses = cn(
        badgeClasses,
        themeMode === 'dark'
          ? 'bg-linear-to-r from-amber-600 to-yellow-600 text-white'
          : 'bg-linear-to-r from-amber-500 to-yellow-500 text-white'
      );
    } else if (tabId === 'messages' && count > 0) {
      badgeClasses = cn(
        badgeClasses,
        themeMode === 'dark'
          ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white'
          : 'bg-linear-to-r from-green-500 to-emerald-500 text-white'
      );
    } else if (tabId === 'applications' && count > 0) {
      badgeClasses = cn(
        badgeClasses,
        themeMode === 'dark'
          ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white'
          : 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
      );
    } else {
      badgeClasses = cn(
        badgeClasses,
        themeMode === 'dark'
          ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white'
          : 'bg-linear-to-r from-blue-500 to-cyan-500 text-white'
      );
    }

    return (
      <span className={badgeClasses}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const handleTabChange = (tabId: string) => {
    const tab = availableTabs.find(t => t.id === tabId);
    if (!tab || tab.disabled) return;

    setPreviousTab(activeTab);
    onTabChange(tabId);
    setShowMobileMenu(false);
  };

  const tabsToRender = customTabs && customTabs.length > 0 ? customTabs : availableTabs;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Tabs */}
      <div className={cn("hidden md:block", getContainerClasses())}>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }}
            />
          ))}
        </div>

        <nav className="relative z-10 flex flex-wrap items-center gap-1 md:gap-2 w-full">
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
                {/* Tab content */}
                <div className="relative z-10 flex items-center gap-1 md:gap-2">
                  {showIcons && tab.icon && (
                    <span className={cn(
                      "shrink-0 transition-transform",
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}>
                      {tab.icon}
                    </span>
                  )}

                  <span className="whitespace-nowrap font-medium">
                    {tab.label}
                    {tab.disabled && (
                      <span className="ml-1 text-xs opacity-75">(Soon)</span>
                    )}
                  </span>

                  {/* Count badge */}
                  {tab.count !== undefined && getCountBadge(tab.count, tab.id)}

                  {/* Premium badge */}
                  {tab.premium && !isActive && !tab.disabled && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}

                  {/* Trending indicator */}
                  {tab.trending && !isActive && !tab.disabled && (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  )}
                </div>

                {/* Active indicator for underline variant */}
                {isActive && !tab.disabled && variant === 'underline' && (
                  <div className={cn(
                    "absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full",
                    `bg-linear-to-r ${roleGradient}`
                  )} />
                )}
              </button>
            );
          })}

          {/* Extra action button for premium users */}
          {isPremium && variant !== 'compact' && (
            <button
              onClick={() => window.location.href = '/premium/features'}
              className="group flex items-center gap-1 md:gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 text-white font-medium hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl text-sm md:text-base ml-auto"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Premium</span>
              <span className="sm:hidden">Pro</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </nav>

        {/* Scroll indicator for many tabs */}
        {tabsToRender.length > 5 && (
          <div className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center gap-1">
            <div className={cn(
              "w-1 h-1 rounded-full animate-pulse",
              themeMode === 'dark' ? 'bg-gray-600/50' : 'bg-gray-400/50'
            )} />
            <div className={cn(
              "w-1 h-1 rounded-full animate-pulse",
              themeMode === 'dark' ? 'bg-gray-500/50' : 'bg-gray-500/50'
            )} />
            <div className={cn(
              "w-1 h-1 rounded-full animate-pulse",
              themeMode === 'dark' ? 'bg-gray-400/50' : 'bg-gray-600/50'
            )} />
          </div>
        )}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden space-y-3">
        {/* Mobile Tab Selector */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-xl backdrop-blur-xl border",
          themeMode === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white/50 border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              `bg-linear-to-r ${roleGradient}`
            )}>
              {tabsToRender.find(t => t.id === activeTab)?.icon || <Home className="w-4 h-4 text-white" />}
            </div>
            <div>
              <span className={cn(
                "text-xs",
                themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Current Tab
              </span>
              <p className={cn(
                "font-medium text-sm",
                themeMode === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {tabsToRender.find(t => t.id === activeTab)?.label || 'Overview'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              themeMode === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className={cn(
            "rounded-xl backdrop-blur-xl border overflow-hidden animate-in slide-in-from-top-2 duration-200",
            themeMode === 'dark'
              ? 'bg-gray-900/90 border-gray-800'
              : 'bg-white/90 border-gray-200'
          )}>
            <div className="max-h-96 overflow-y-auto p-2">
              {tabsToRender.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={tab.disabled}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg transition-all",
                      isActive
                        ? `bg-linear-to-r ${roleGradient} text-white`
                        : tab.disabled
                          ? themeMode === 'dark'
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 cursor-not-allowed'
                          : themeMode === 'dark'
                            ? 'text-gray-300 hover:bg-gray-800'
                            : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">
                        {tab.icon}
                      </span>
                      <span className="font-medium">{tab.label}</span>
                      {tab.disabled && (
                        <span className="text-xs opacity-75">(Soon)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          themeMode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        )}>
                          {tab.count > 99 ? '99+' : tab.count}
                        </span>
                      )}
                      {tab.premium && !isActive && !tab.disabled && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                      {tab.trending && !isActive && !tab.disabled && (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
  themeMode?: 'light' | 'dark';
}> = ({
  activeTab,
  userRole,
  profileType = 'candidate',
  isPremium = false,
  isOwnProfile = false,
  profileData = {},
  socialStats = {},
  componentProps = {},
  className = '',
  themeMode = 'light'
}) => {
    const { mode } = useTheme();
    const roleGradient = ROLE_GRADIENTS[profileType as keyof typeof ROLE_GRADIENTS] || ROLE_GRADIENTS.candidate;

    // Map tab IDs to component names - FIXED COMPONENT MAPPING
    const tabComponentMap: Record<string, React.ComponentType<any>> = {
      'about': ProfileAboutSection,
      'posts': ProfilePostsSection,
      'network': ProfileConnectionsSection,
      'analytics': ProfileSocialAnalytics,
      'candidate-data': (props) => {
        // Use different components based on whether it's own profile
        if (props.isOwnProfile) {
          return <CandidateProfileView {...props} />;
        } else {
          return <PublicCandidateProfileView 
            profile={props.profileData}
            themeMode={props.themeMode}
          />;
        }
      },
      'portfolio': (props) => {
        return (
          <FreelancerPortfolioDisplay
            portfolioItems={props.portfolioItems || props.profileData?.portfolio || []}
            freelancerName={props.freelancerName || props.profileData?.user?.name || 'Freelancer'}
            freelancerId={props.userId}
            isOwnProfile={props.isOwnProfile}
            themeMode={props.themeMode}
          />
        );
      },
      'products': (props) => {
        // For company products, use the CompanyProductsSection
        return (
          <CompanyProductsSection
            companyId={props.companyId || props.userId}
            companyName={props.companyName || props.profileData?.user?.name || 'Company'}
            isOwnCompany={props.isOwnProfile}
            currentUser={props.currentUser}
            themeMode={props.themeMode}
          />
        );
      },
    };

    // Check if this is a "Coming Soon" tab
    const comingSoonTabs = ['messages', 'settings', 'achievements'];

    if (comingSoonTabs.includes(activeTab)) {
      return (
        <div className={cn(
          "backdrop-blur-xl rounded-3xl border p-8 md:p-12 shadow-xl",
          themeMode === 'dark'
            ? 'bg-linear-to-b from-gray-900/90 to-gray-800/90 border-gray-700/50'
            : 'bg-linear-to-b from-white/90 to-gray-50/90 border-gray-200/50',
          className
        )}>
          <div className="text-center max-w-md mx-auto">
            <div className={cn(
              "w-20 h-20 rounded-full bg-linear-to-br flex items-center justify-center mx-auto mb-6",
              roleGradient
            )}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className={cn(
              "text-2xl font-bold mb-3",
              themeMode === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Coming Soon
            </h3>
            <p className={cn(
              "mb-6",
              themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              This feature is currently under development. We're working hard to bring it to you soon!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/feedback'}
                className={cn(
                  "px-4 py-2 border rounded-lg font-medium transition-colors",
                  themeMode === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                Give Feedback
              </button>
              <button
                onClick={() => window.location.href = '/updates'}
                className={cn(
                  "px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all",
                  `bg-linear-to-r ${roleGradient}`
                )}
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
          <div className={cn(
            "backdrop-blur-xl rounded-3xl border p-8 md:p-12 shadow-xl",
            themeMode === 'dark'
              ? 'bg-linear-to-b from-gray-900/90 to-gray-800/90 border-gray-700/50'
              : 'bg-linear-to-b from-white/90 to-gray-50/90 border-gray-200/50',
            className
          )}>
            <div className="text-center max-w-md mx-auto">
              <div className={cn(
                "w-20 h-20 rounded-full bg-linear-to-br flex items-center justify-center mx-auto mb-6",
                roleGradient
              )}>
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className={cn(
                "text-2xl font-bold mb-3",
                themeMode === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Analytics Unavailable
              </h3>
              <p className={cn(
                "mb-6",
                themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {isOwnProfile
                  ? 'Upgrade to Premium to access detailed analytics and insights about your profile performance.'
                  : 'Analytics are only available to profile owners. Connect with this user to learn more about them.'
                }
              </p>
              {isOwnProfile && !isPremium && (
                <button
                  onClick={() => window.location.href = '/premium/analytics'}
                  className={cn(
                    "px-6 py-3 rounded-lg text-white font-medium hover:shadow-lg transition-all hover:scale-105",
                    "bg-linear-to-r from-amber-500 to-yellow-500"
                  )}
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
      if (activeTab === 'overview') {
        return (
          <div className={cn(
            "backdrop-blur-xl rounded-3xl border p-8 md:p-12 shadow-xl",
            themeMode === 'dark'
              ? 'bg-linear-to-b from-gray-900/90 to-gray-800/90 border-gray-700/50'
              : 'bg-linear-to-b from-white/90 to-gray-50/90 border-gray-200/50',
            className
          )}>
            <div className="text-center max-w-md mx-auto">
              <div className={cn(
                "w-16 h-16 rounded-full bg-linear-to-br flex items-center justify-center mx-auto mb-4",
                roleGradient
              )}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className={cn(
                "text-xl font-bold mb-2",
                themeMode === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Overview
              </h3>
              <p className={cn(
                themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Welcome to your profile overview. Select a tab to view specific sections.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className={cn(
          "backdrop-blur-xl rounded-3xl border p-8 md:p-12 shadow-xl",
          themeMode === 'dark'
            ? 'bg-linear-to-b from-gray-900/90 to-gray-800/90 border-gray-700/50'
            : 'bg-linear-to-b from-white/90 to-gray-50/90 border-gray-200/50',
          className
        )}>
          <div className="text-center max-w-md mx-auto">
            <div className={cn(
              "w-16 h-16 rounded-full bg-linear-to-br flex items-center justify-center mx-auto mb-4",
              roleGradient
            )}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className={cn(
              "text-xl font-bold mb-2",
              themeMode === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h3>
            <p className={cn(
              themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Content for this section will be displayed here.
            </p>
          </div>
        </div>
      );
    }

    const getComponentProps = () => {
      const baseProps = { ...componentProps, themeMode };

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
      <div className={cn(
        "backdrop-blur-xl rounded-3xl border p-6 md:p-8 shadow-xl",
        themeMode === 'dark'
          ? 'bg-linear-to-b from-gray-900/90 to-gray-800/90 border-gray-700/50'
          : 'bg-linear-to-b from-white/90 to-gray-50/90 border-gray-200/50',
        className
      )}>
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
  themeMode?: 'light' | 'dark';
}> = ({ children, activeTab, className = '', themeMode = 'light' }) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        key={activeTab}
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
      >
        {children}
      </div>
    </div>
  );
};

// Mobile Tab Switcher Component
export const MobileTabSwitcher: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: ProfileTab[];
  themeMode?: 'light' | 'dark';
}> = ({ activeTab, onTabChange, tabs, themeMode = 'light' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const roleGradient = ROLE_GRADIENTS[tabs[0]?.profileTypes?.[0] as keyof typeof ROLE_GRADIENTS] || ROLE_GRADIENTS.candidate;

  return (
    <div className="lg:hidden">
      <div className={cn(
        "rounded-xl border shadow-lg p-4 backdrop-blur-xl",
        themeMode === 'dark'
          ? 'bg-gray-900/90 border-gray-800'
          : 'bg-white/90 border-gray-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <span className={cn(
            "font-semibold",
            themeMode === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Navigation
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              themeMode === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full p-3 rounded-lg transition-all",
                    isActive
                      ? `bg-linear-to-r ${roleGradient} text-white`
                      : themeMode === 'dark'
                        ? 'hover:bg-gray-800 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      themeMode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    )}>
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!isExpanded && (
          <div className="text-center py-4">
            <span className={cn(
              "text-sm",
              themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Tap to expand navigation
            </span>
          </div>
        )}
      </div>
    </div>
  );
};