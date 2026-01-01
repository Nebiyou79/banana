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
  TrendingUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/services/profileService";
import Image from "next/image";

interface SocialNavbarProps {
  onMenuToggle?: () => void;
  userProfile?: Profile | null;
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

export default function SocialNavbar({ onMenuToggle, userProfile }: SocialNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          { href: "/dashboard/candidate/social", label: "My Feed" },
          { href: "/dashboard/candidate/social/posts", label: "My Posts" },
          { href: "/dashboard/candidate/social/network", label: "Network" },
          { href: "/dashboard/candidate", label: "Main Dashboard" }
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer/social", label: "My Feed" },
          { href: "/dashboard/freelancer/social/posts", label: "My Posts" },
          { href: "/dashboard/freelancer/social/network", label: "Network" },
          { href: "/dashboard/freelancer", label: "Main Dashboard" }
        ];
      case "company":
        return [
          { href: "/dashboard/company/social", label: "Company Feed" },
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
          { href: "/social/admin/moderation", label: "Moderation" },
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
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100"
            : "bg-white/90 backdrop-blur-xl border-b border-gray-100"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LEFT SIDE - Menu Toggle & Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              <Link href="/" className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={20}
                      height={20}
                      className="object-contain filter brightness-0 invert"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-900">Banana</span>
                  <span className="text-xs font-medium text-blue-600">Social</span>
                </div>
              </Link>
            </div>

            {/* CENTER - Quick Links (Desktop) */}
            <div className="hidden lg:flex flex-1 justify-center gap-1">
              {user && quickLinks.map((link) => {
                const Icon = getLinkIcon(link.label);
                const isActive = router.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT SIDE - Profile & Mobile Menu */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold flex items-center justify-center overflow-hidden">
                      {userProfile?.user.avatar ? (
                        <img
                          src={userProfile.user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={`/social/${user.role}/profile`}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">Social Profile</span>
                      </Link>
                      <Link
                        href={`/dashboard/${user.role}`}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="text-sm">Main Dashboard</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors duration-150 border-t border-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        <span className="text-sm">Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
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
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold flex items-center justify-center overflow-hidden">
                    {userProfile?.user.avatar ? (
                      <img
                        src={userProfile.user.avatar}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-4">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
              <div className="space-y-1">
                {quickLinks.map((link) => {
                  const Icon = getLinkIcon(link.label);
                  const isActive = router.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Actions Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Account
                </p>
                <div className="space-y-1">
                  <Link
                    href={`/social/${user?.role}/profile`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Social Profile</span>
                  </Link>
                  <Link
                    href={`/dashboard/${user?.role}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Main Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}