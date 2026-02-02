import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  TrendingUp,
  MessageCircle,
  Users2,
  LogOut,
  ArrowLeft,
  Bell,
  BarChart3,
  Settings,
  Shield,
  X,
  Sparkles,
  Zap,
  Edit,
  User,
  Briefcase,
  Building,
  ShieldCheck,
  Globe,
  FileText,
  Search,
  Heart,
  Bookmark
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/services/profileService";
import Image from "next/image";
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import React, { useEffect, useState } from "react";
import { getSidebarTheme, isDarkMode, SidebarThemeColors, RoleType, SidebarNavItem } from "@/components/social/theme/SideBarTheme";

interface SocialSidebarProps {
  onClose?: () => void;
  userProfile?: Profile | null;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({ onClose, userProfile }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<SidebarThemeColors | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    // Detect dark mode
    setDarkMode(isDarkMode());

    // Set theme based on user role
    if (user?.role) {
      const sidebarTheme = getSidebarTheme(user.role as RoleType, darkMode);
      setTheme(sidebarTheme);
    }
  }, [user?.role, darkMode]);

  useEffect(() => {
    // Set active tab based on current route
    setActiveTab(router.pathname);
  }, [router.pathname]);

  if (!user || !theme) return null;

  const getNavigationItems = (): SidebarNavItem[] => {
    const roleItems: Record<string, SidebarNavItem[]> = {
      candidate: [
        { href: "/dashboard/candidate/social", label: "My Feed", icon: TrendingUp, badge: "🔥" },
        { href: "/dashboard/candidate/social/posts", label: "My Posts", icon: MessageCircle },
        { href: "/dashboard/candidate/social/network", label: "Network", icon: Users2, badge: "3" },
        { href: "/dashboard/candidate/social/profile", label: "Profile", icon: User },
        { href: "/dashboard/candidate/social/profile/edit", label: "Edit Profile", icon: Edit },
        { href: "/dashboard/candidate/social/saved", label: "Saved Posts", icon: Bookmark, badge: "5" },
      ],
      freelancer: [
        { href: "/dashboard/freelancer/social", label: "My Feed", icon: TrendingUp, badge: "🔥" },
        { href: "/dashboard/freelancer/social/posts", label: "My Posts", icon: MessageCircle },
        { href: "/dashboard/freelancer/social/network", label: "Network", icon: Users2 },
        { href: "/dashboard/freelancer/social/profile", label: "Profile", icon: User },
        { href: "/dashboard/freelancer/social/profile/edit", label: "Edit Profile", icon: Edit },
        { href: "/dashboard/freelancer/social/saved", label: "Saved Posts", icon: Bookmark, badge: "5" },
      ],
      company: [
        { href: "/dashboard/company/social", label: "Company Feed", icon: TrendingUp, badge: "✨" },
        { href: "/dashboard/company/social/posts", label: "Company Posts", icon: MessageCircle },
        { href: "/dashboard/company/social/network", label: "Network", icon: Users2, badge: "12" },
        { href: "/dashboard/company/social/profile", label: "Profile", icon: Briefcase },
        { href: "/dashboard/company/social/profile/edit", label: "Edit Profile", icon: Edit },
        { href: "/dashboard/company/social/saved", label: "Saved Posts", icon: Bookmark, badge: "5" },
      ],
      organization: [
        { href: "/dashboard/organization/social", label: "Org Feed", icon: TrendingUp },
        { href: "/dashboard/organization/social/posts", label: "Org Posts", icon: MessageCircle },
        { href: "/dashboard/organization/social/network", label: "Network", icon: Users2 },
        { href: "/dashboard/organization/social/profile", label: "Profile", icon: Building },
        { href: "/dashboard/organization/social/profile/edit", label: "Edit Profile", icon: Edit },
        { href: "/dashboard/organization/social/saved", label: "Saved Posts", icon: Bookmark, badge: "5" },
      ],
      admin: [
        { href: "/dashboard/admin/social", label: "Platform Feed", icon: TrendingUp },
        { href: "/dashboard/admin/social/moderation", label: "Moderation", icon: Shield, badge: "23" },
        { href: "/dashboard/admin/social/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard/admin/social/users", label: "Users", icon: Users2, badge: "5" },
        { href: "/dashboard/admin/social/settings", label: "Settings", icon: Settings },
        { href: "/dashboard/admin/social/reports", label: "Reports", icon: FileText },
        { href: "/dashboard/admin/social/system", label: "System", icon: Settings },
      ],
    };

    return roleItems[user.role as keyof typeof roleItems] || [];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      router.push("/login");
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (role: string) => {
    const names = {
      candidate: "Candidate",
      freelancer: "Freelancer",
      company: "Company",
      organization: "Organization",
      admin: "Administrator",
    };
    return names[role as keyof typeof names] || role;
  };

  // Get avatar URL or placeholder
  const getAvatarUrl = () => {
    if (userProfile?.avatar?.secure_url) {
      return userProfile.avatar.secure_url;
    }
    if (userProfile?.user.avatar) {
      return userProfile.user.avatar;
    }
    // Use the profile service to get placeholder
    const initials = user.name?.charAt(0).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(theme.primary)}&color=fff&size=150`;
  };

  // Helper function to determine if route is active
  const isRouteActive = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <div
      className="w-80 h-full border-r backdrop-blur-xl flex flex-col relative overflow-hidden transition-all duration-300"
      style={{
        background: theme.sidebarBg,
        borderColor: theme.cardBorder
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* HEADER */}
      <div className="relative p-6 border-b" style={{ borderColor: theme.cardBorder }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="relative z-10 object-contain filter brightness-0 invert"
                />
              </div>
              <div
                className="absolute -inset-1 rounded-2xl blur opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                }}
              />
            </div>
            <div className="flex flex-col">
              <p
                className="text-xl font-bold"
                style={{ color: theme.primaryText }}
              >
                Banana
              </p>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" style={{ color: theme.accent }} />
                <p
                  className="text-xs font-semibold tracking-wider"
                  style={{ color: theme.secondaryText }}
                >
                  Social
                </p>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              style={{
                background: theme.cardBg,
                color: theme.primary
              }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Back Button */}
        <Link
          href={`/dashboard/${user.role}`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: theme.cardBg,
            borderColor: theme.cardBorder
          }}
        >
          <div
            className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
            style={{
              background: `${theme.primary}15`,
              color: theme.primary
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: theme.primaryText }}
          >
            Back to Dashboard
          </span>
        </Link>

        {/* Enhanced User Card */}
        <div
          className="mt-4 p-4 rounded-2xl border shadow-lg"
          style={{
            background: theme.cardBg,
            borderColor: theme.cardBorder
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                  color: 'white'
                }}
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('span');
                        fallback.textContent = user.name?.charAt(0).toUpperCase() || 'U';
                        fallback.className = 'text-white text-xl font-bold';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div
                className="absolute -inset-1 rounded-xl blur opacity-30"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                }}
              />
              {/* Online status indicator */}
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
                style={{
                  background: theme.success,
                  borderColor: theme.cardBg
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="font-bold truncate text-lg"
                style={{ color: theme.primaryText }}
              >
                {user.name}
              </p>
              <p
                className="truncate mt-1 text-sm"
                style={{ color: theme.secondaryText }}
              >
                {user.email}
              </p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="inline-block px-3 py-1 text-xs font-bold rounded-lg shadow-sm"
                  style={{
                    background: `${theme.primary}15`,
                    color: theme.primary
                  }}
                >
                  {getRoleDisplayName(user.role)}
                </span>
                <VerificationBadge
                  size="sm"
                  showText={true}
                  showTooltip={true}
                  className="shadow-sm"
                  autoFetch={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION - Improved with better animations and hover effects */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = isRouteActive(item.href);
          const IconComp = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setActiveTab(item.href);
                onClose?.();
              }}
              className={`group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? '' : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              style={{
                background: isActive
                  ? theme.activeBg
                  : 'transparent',
                border: isActive
                  ? `1px solid ${theme.primary}40`
                  : '1px solid transparent',
                color: isActive ? theme.primary : theme.primaryText,
                marginBottom: '4px',
                transform: isActive ? 'translateX(4px)' : 'none',
                boxShadow: isActive
                  ? `0 4px 12px ${theme.primary}20`
                  : 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-all duration-300 ${isActive
                    ? 'shadow-md scale-110 rotate-3'
                    : 'group-hover:shadow-sm group-hover:rotate-3'
                    }`}
                  style={{
                    background: isActive
                      ? `${theme.primary}25`
                      : `${theme.primary}10`,
                    transform: isActive
                      ? 'translateX(2px) scale(1.1)'
                      : 'none'
                  }}
                >
                  <IconComp
                    className="w-4 h-4 transition-colors duration-300"
                    style={{
                      color: isActive
                        ? theme.primary
                        : theme.iconPrimary
                    }}
                  />
                </div>
                <span
                  className={`font-medium text-sm transition-all duration-300 ${isActive ? 'font-semibold' : 'font-medium'
                    }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full animate-pulse"
                  style={{
                    background: theme.primary,
                    animationDuration: '1.5s'
                  }}
                />
              )}

              {/* Badge if present */}
              {item.badge && (
                <span
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-all duration-300 ${isActive
                    ? 'scale-110 animate-bounce'
                    : 'scale-100 group-hover:scale-110'
                    }`}
                  style={{
                    background: isActive
                      ? theme.badgeBg
                      : `${theme.secondary}20`,
                    color: isActive
                      ? theme.badgeText
                      : theme.secondary,
                    animationDuration: isActive ? '0.5s' : '0.3s'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div
        className="relative p-4 border-t"
        style={{ borderColor: theme.cardBorder }}
      >
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: theme.cardBg,
            borderColor: `${theme.error}30`,
            color: theme.error
          }}
        >
          <div
            className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
            style={{
              background: `${theme.error}15`,
              color: theme.error
            }}
          >
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>

        <div className="flex items-center justify-center gap-2 mt-4">
          <Zap className="w-3 h-3" style={{ color: theme.accent }} />
          <p
            className="text-xs text-center"
            style={{ color: theme.mutedText }}
          >
            Social v2.1.0 • {new Date().getFullYear()} Banana
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialSidebar;