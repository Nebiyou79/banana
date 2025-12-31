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
  Bell,
  Plus,
  MessageCircle,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/services/profileService";
import Image from "next/image";

interface SocialNavbarProps {
  onMenuToggle?: () => void;
  userProfile?: Profile | null;
}

export default function SocialNavbar({ onMenuToggle, userProfile }: SocialNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          { href: "/social/candidate/feed", label: "My Feed" },
          { href: "/social/candidate/posts", label: "My Posts" },
          { href: "/social/candidate/network", label: "Network" },
          { href: "/dashboard/candidate", label: "Main Dashboard" }
        ];
      case "freelancer":
        return [
          { href: "/social/freelancer/feed", label: "My Feed" },
          { href: "/social/freelancer/posts", label: "My Posts" },
          { href: "/social/freelancer/network", label: "Network" },
          { href: "/dashboard/freelancer", label: "Main Dashboard" }
        ];
      case "company":
        return [
          { href: "/social/company/feed", label: "Company Feed" },
          { href: "/social/company/posts", label: "Company Posts" },
          { href: "/social/company/network", label: "Our Network" },
          { href: "/dashboard/company", label: "Main Dashboard" }
        ];
      case "organization":
        return [
          { href: "/social/organization/feed", label: "Org Feed" },
          { href: "/social/organization/posts", label: "Org Posts" },
          { href: "/social/organization/network", label: "Our Network" },
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${isScrolled
          ? "bg-white/95 backdrop-blur-2xl shadow-2xl border-b border-white/20"
          : "bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-2xl border-b border-white/30"
        }`}
    >
      {/* Ambient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-amber-500/5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LEFT SIDE - Logo & Menu */}
          <div className="flex items-center gap-6">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Menu className="w-5 h-5 text-slate-700 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Enhanced Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="relative z-10 object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
              </div>

              <div className="flex flex-col">
                <p className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  Banana
                </p>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <p className="text-blue-600 text-xs font-semibold tracking-wider">Social</p>
                </div>
              </div>
            </Link>
          </div>

          {/* CENTER - Quick Links */}
          <div className="hidden lg:flex flex-1 justify-center gap-2">
            {user && quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 group"
              >
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/50 backdrop-blur-sm transition-all duration-300
                  ${router.pathname === link.href
                    ? 'opacity-100 scale-100 shadow-lg shadow-blue-500/25'
                    : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                  }`}
                />
                <span className={`relative z-10 transition-colors duration-300
                  ${router.pathname === link.href
                    ? 'text-blue-700'
                    : 'text-slate-600 group-hover:text-slate-800'
                  }`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE - Actions & Profile */}
          <div className="flex items-center gap-3">

            {user && (
              <>
                {/* Create Post Button */}
                <button
                  onClick={() => router.push(`/social/${user.role}/create-post`)}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Create Post
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </>
            )}

            {/* Enhanced Profile Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden">
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
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium capitalize">
                      {user.role}
                    </p>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-2xl shadow-2xl rounded-2xl border border-white/20 py-3 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
                    {/* Header */}
                    <div className="px-4 pb-3 border-b border-white/20">
                      <p className="font-bold text-slate-800 text-lg">{user.name}</p>
                      <p className="text-slate-600 text-sm mt-1">{user.email}</p>
                      <span className="mt-2 inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-lg">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href={`/social/${user.role}/profile`}
                      className="flex items-center px-4 py-3 text-slate-700 hover:bg-blue-50/50 transition-all duration-200 group"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="ml-3 font-medium">Social Profile</span>
                    </Link>

                    <Link
                      href={`/dashboard/${user.role}`}
                      className="flex items-center px-4 py-3 text-slate-700 hover:bg-blue-50/50 transition-all duration-200 group"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-200">
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="ml-3 font-medium">Main Dashboard</span>
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50/50 transition-all duration-200 group"
                    >
                      <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors duration-200">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="ml-3 font-medium">Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-white/95 backdrop-blur-2xl shadow-2xl rounded-2xl border border-white/20 p-6 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <span className="bg-gradient-to-r from-slate-700 to-slate-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            {user && (
              <div className="border-t border-white/20 mt-4 pt-4 space-y-2">
                <Link
                  href={`/social/${user.role}/profile`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <User className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium">Social Profile</span>
                </Link>

                <Link
                  href={`/dashboard/${user.role}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600 mr-3" />
                  <span className="font-medium">Main Dashboard</span>
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50/50 transition-all duration-200 group"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}