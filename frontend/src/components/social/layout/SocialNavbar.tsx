// components/social/layout/SocialNavbar.tsx
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  ArrowLeft,
  Sparkles,
  Home,
  Users,
  FileText,
  TrendingUp,
  Bell,
  Settings,
  HelpCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RoleThemeColors, RoleType } from "../theme/RoleThemeProvider";
import { Profile } from "@/services/profileService";

interface SocialNavbarProps {
  onMenuToggle?: () => void;
  userProfile?: Profile | null;
  colors: RoleThemeColors;
  role: RoleType;
}

// Helper function to get icon for each link
const getLinkIcon = (label: string) => {
  switch (label) {
    case "My Feed":
    case "Company Feed":
    case "Org Feed":
    case "Platform Feed":
      return Home;
    case "My Posts":
    case "Company Posts":
    case "Org Posts":
      return FileText;
    case "Network":
    case "Our Network":
      return Users;
    case "Moderation":
      return TrendingUp;
    default:
      return ArrowLeft;
  }
};

// Helper function to get user initials
const getInitials = (name?: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to get avatar URL or generate fallback
const getAvatarUrl = (userProfile?: Profile | null, user?: any, colors?: RoleThemeColors): string | null => {
  if (userProfile?.user?.avatar) {
    return userProfile.user.avatar;
  }
  if (userProfile?.avatar?.secure_url) {
    return userProfile.avatar.secure_url;
  }
  return null;
};

// Avatar component for consistency
const AvatarDisplay = ({
  userProfile,
  user,
  colors,
  size = "md"
}: {
  userProfile?: Profile | null;
  user?: any;
  colors: RoleThemeColors;
  size?: "sm" | "md" | "lg";
}) => {
  const avatarUrl = getAvatarUrl(userProfile, user, colors);
  const initials = getInitials(user?.name);
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden shadow-md`}
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
      }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user?.name || "User"}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-white font-semibold">${initials}</span>`;
            }
          }}
        />
      ) : (
        <span className="text-white font-semibold">{initials}</span>
      )}
    </div>
  );
};

export default function SocialNavbar({ onMenuToggle, userProfile, colors, role }: SocialNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);

  const router = useRouter();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getQuickLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case "candidate":
        return [
          { href: "/dashboard/candidate/social", label: "My Feed", badge: "🔥" },
          { href: "/dashboard/candidate/social/posts", label: "My Posts" },
          { href: "/dashboard/candidate/social/network", label: "Network" },
          { href: "/dashboard/candidate", label: "Main Dashboard" }
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer/social", label: "My Feed", badge: "🔥" },
          { href: "/dashboard/freelancer/social/posts", label: "My Posts" },
          { href: "/dashboard/freelancer/social/network", label: "Network" },
          { href: "/dashboard/freelancer", label: "Main Dashboard" }
        ];
      case "company":
        return [
          { href: "/dashboard/company/social", label: "Company Feed", badge: "✨" },
          { href: "/dashboard/company/social/posts", label: "Company Posts" },
          { href: "/dashboard/company/social/network", label: "Our Network" },
          { href: "/dashboard/company", label: "Main Dashboard" }
        ];
      case "organization":
        return [
          { href: "/dashboard/organization/social", label: "Org Feed" },
          { href: "/dashboard/organization/social/posts", label: "Org Posts" },
          { href: "/dashboard/organization/social/network", label: "Our Network" },
          { href: "/dashboard/organization", label: "Main Dashboard" }
        ];
      case "admin":
        return [
          { href: "/social/admin/feed", label: "Platform Feed" },
          { href: "/social/admin/moderation", label: "Moderation", badge: "23" },
          { href: "/dashboard/admin", label: "Main Dashboard" }
        ];
      default:
        return [];
    }
  };

  const quickLinks = getQuickLinks();

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg border-b"
            : "bg-white/90 backdrop-blur-xl border-b"
          }`}
        style={{
          borderColor: `${colors.primary}15`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LEFT SIDE - Menu Toggle & Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 group"
                style={{
                  background: `${colors.primary}08`
                }}
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 transition-colors duration-200 group-hover:scale-110"
                  style={{ color: colors.primary }} />
              </button>

              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105`}
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    }}>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                    <img
                      src="/logo.png"
                      alt="Logo"
                      width={22}
                      height={22}
                      className="relative z-10 object-contain filter brightness-0 invert transition-transform duration-300 group-hover:rotate-12"
                    />
                  </div>
                  <div className="absolute -inset-1 rounded-xl blur opacity-30 transition-all duration-300 group-hover:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                    }} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 tracking-tight">Banana</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" style={{ color: colors.accent }} />
                    <span className="text-xs font-semibold tracking-wider" style={{ color: colors.primary }}>
                      Social
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* CENTER - Quick Links (Desktop) */}
            <div className="hidden lg:flex flex-1 justify-center gap-1">
              {user && quickLinks.map((link) => {
                const Icon = getLinkIcon(link.label);
                const isActive = router.pathname === link.href || router.pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 
                      ${isActive ? '' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    style={{
                      background: isActive
                        ? `${colors.primary}12`
                        : 'transparent',
                      color: isActive ? colors.primary : colors.secondary,
                      border: isActive
                        ? `1px solid ${colors.primary}30`
                        : '1px solid transparent',
                    }}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-all duration-300 ${isActive
                        ? 'scale-110 rotate-3'
                        : 'group-hover:rotate-3'
                        }`}
                      style={{
                        background: isActive
                          ? `${colors.primary}20`
                          : `${colors.primary}08`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4 transition-colors duration-200"
                        style={{ color: isActive ? colors.primary : colors.secondary }}
                      />
                    </div>
                    <span>{link.label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full"
                        style={{ background: colors.primary }}
                      />
                    )}

                    {/* Badge if present */}
                    {link.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'
                          }`}
                        style={{
                          background: isActive
                            ? colors.primary
                            : `${colors.secondary}20`,
                          color: isActive ? 'white' : colors.secondary
                        }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT SIDE - Profile & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 relative"
                style={{
                  background: `${colors.primary}08`
                }}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" style={{ color: colors.primary }} />
                {hasNotification && (
                  <div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping"
                    style={{ background: colors.accent }}
                  />
                )}
              </button>

              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 p-1.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                    style={{
                      background: isProfileDropdownOpen
                        ? `${colors.primary}12`
                        : 'transparent'
                    }}
                    aria-label="Profile menu"
                  >
                    <div className="relative">
                      <AvatarDisplay
                        userProfile={userProfile}
                        user={user}
                        colors={colors}
                        size="md"
                      />
                      {/* Online status indicator */}
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{
                          background: colors.success,
                          borderColor: 'white'
                        }}
                      />
                    </div>

                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                        {user.name}
                      </p>
                      <p className="text-xs capitalize transition-colors duration-200 group-hover:opacity-80"
                        style={{ color: colors.secondary }}>
                        {user.role}
                      </p>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 transition-all duration-300 ${isProfileDropdownOpen
                        ? 'rotate-180 scale-110'
                        : 'group-hover:scale-110'
                        }`}
                      style={{ color: colors.primary }}
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-5 duration-200 overflow-hidden"
                      style={{
                        borderColor: `${colors.primary}20`,
                        background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)`
                      }}
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: `${colors.primary}15` }}>
                        <div className="flex items-center gap-3">
                          <AvatarDisplay
                            userProfile={userProfile}
                            user={user}
                            colors={colors}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href={`/social/${user.role}/profile`}
                          className="flex items-center px-4 py-3 text-gray-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          style={{
                            background: 'transparent'
                          }}
                        >
                          <div className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110 mr-3"
                            style={{
                              background: `${colors.primary}10`,
                              color: colors.primary
                            }}>
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Social Profile</span>
                        </Link>

                        <Link
                          href={`/dashboard/${user.role}`}
                          className="flex items-center px-4 py-3 text-gray-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <div className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110 mr-3"
                            style={{
                              background: `${colors.primary}10`,
                              color: colors.primary
                            }}>
                            <ArrowLeft className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Main Dashboard</span>
                        </Link>

                        <div className="border-t my-1" style={{ borderColor: `${colors.primary}15` }} />
                      </div>

                      {/* Sign Out */}
                      <div className="border-t" style={{ borderColor: `${colors.primary}15` }}>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                          style={{
                            color: colors.error
                          }}
                        >
                          <div className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110 mr-3"
                            style={{
                              background: `${colors.error}15`,
                              color: colors.error
                            }}>
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `${colors.primary}08`
                }}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" style={{ color: colors.primary }} />
                ) : (
                  <Menu className="w-5 h-5" style={{ color: colors.primary }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute right-0 top-0 h-full w-80 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)`,
              borderLeft: `1px solid ${colors.primary}20`
            }}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: `${colors.primary}15` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    userProfile={userProfile}
                    user={user}
                    colors={colors}
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm capitalize transition-colors duration-200"
                      style={{ color: colors.secondary }}>
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: `${colors.primary}10`,
                    color: colors.primary
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-4 flex-1 overflow-y-auto h-[calc(100vh-160px)]">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: colors.secondary }}>
                Navigation
              </p>
              <div className="space-y-1 mb-6">
                {quickLinks.map((link) => {
                  const Icon = getLinkIcon(link.label);
                  const isActive = router.pathname === link.href || router.pathname.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive ? '' : 'hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      style={{
                        background: isActive
                          ? `${colors.primary}12`
                          : 'transparent',
                        color: isActive ? colors.primary : colors.secondary,
                        border: isActive
                          ? `1px solid ${colors.primary}30`
                          : '1px solid transparent',
                      }}
                    >
                      <div
                        className={`p-2 rounded-lg transition-all duration-300 ${isActive
                          ? 'scale-110 rotate-3'
                          : 'group-hover:rotate-3'
                          }`}
                        style={{
                          background: isActive
                            ? `${colors.primary}20`
                            : `${colors.primary}08`,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium flex-1">{link.label}</span>

                      {link.badge && (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-semibold"
                          style={{
                            background: isActive
                              ? colors.primary
                              : `${colors.secondary}20`,
                            color: isActive ? 'white' : colors.secondary
                          }}
                        >
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Actions Section */}
              <div className="pt-6 border-t" style={{ borderColor: `${colors.primary}15` }}>
                <p className="px-4 text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: colors.secondary }}>
                  Account
                </p>
                <div className="space-y-1">
                  <Link
                    href={`/social/${user?.role}/profile`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `${colors.primary}10`,
                        color: colors.primary
                      }}>
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Social Profile</span>
                  </Link>

                  <Link
                    href={`/dashboard/${user?.role}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `${colors.primary}10`,
                        color: colors.primary
                      }}>
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Main Dashboard</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ color: colors.error }}
                  >
                    <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `${colors.error}15`,
                        color: colors.error
                      }}>
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: `${colors.primary}15` }}>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3" style={{ color: colors.accent }} />
                <p className="text-xs" style={{ color: colors.secondary }}>
                  Banana Social v2.1.0
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
