// components/layout/Navbar.tsx
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  LayoutDashboardIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from "next/image";
import { colorClasses } from '@/utils/color';
import Sidebar from './Sidebar';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're on the home page
  const isHomePage = router.pathname === '/';
  // Check if we're on a dashboard page
  const isDashboardPage = router.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobile);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile && localSidebarOpen) {
      setLocalSidebarOpen(false);
    }
  }, [router.pathname, isMobile]);

  const handleMenuToggle = () => {
    if (onMenuToggle) {
      // If parent provided toggle function (dashboard layout), use it
      onMenuToggle();
    } else if (isHomePage) {
      // Only manage sidebar locally on home page
      setLocalSidebarOpen(!localSidebarOpen);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: 'Logout Error',
        description: 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getQuickLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case "candidate":
        return [
          { href: "/dashboard/candidate/jobs", label: "Find Jobs" },
          { href: "/dashboard/candidate", label: "Dashboard" },
          { href: "/dashboard/candidate/social", label: "Social Feed" },
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer/tenders", label: "Browse Tenders" },
          { href: "/dashboard/freelancer", label: "Dashboard" },
          { href: "/dashboard/freelancer/social", label: "Social Feed" },
        ];
      case "company":
        return [
          { href: "/dashboard/company/tenders/tenders", label: "Browse Tenders" },
          { href: "/dashboard/company", label: "Dashboard" },
          { href: "/dashboard/company/social", label: "Social Feed" },
        ];
      case "organization":
        return [
          { href: "/dashboard/organization/tenders", label: "My Tenders" },
          { href: "/dashboard/organization", label: "Dashboard" },
          { href: "/dashboard/organization/social", label: "Social Feed" },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin/users", label: "User Management" },
          { href: "/dashboard/admin/jobs", label: "Job Management" },
        ];
      default:
        return [];
    }
  };

  const quickLinks = getQuickLinks();

  // Navigation links for logged-out users
  const publicNavLinks = [
    { href: "/login", label: "Find Jobs" },
    { href: "/login", label: "Find Tenders" },
    { href: "/login", label: "Find Candidates" },
    { href: "/login", label: "Find Talent" }
  ];

  // Determine if we should show the mobile menu button
  const showMobileMenuButton = () => {
    if (isDashboardPage && user) {
      // On dashboard pages with user logged in, show the button for sidebar toggle
      return true;
    }
    if (!isDashboardPage) {
      // On non-dashboard pages, show the button for mobile menu
      return true;
    }
    return false;
  };

  // Determine what the mobile menu button should do
  const handleMobileButtonClick = () => {
    if (isDashboardPage && user && onMenuToggle) {
      // On dashboard, toggle sidebar
      onMenuToggle();
    } else {
      // On other pages, toggle mobile menu
      setIsMobileMenuOpen(!isMobileMenuOpen);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled
        ? `${colorClasses.bg.primary}/95 backdrop-blur-lg shadow-lg border-b ${colorClasses.border.primary} py-3`
        : `${colorClasses.bg.primary} py-4 border-b ${colorClasses.border.secondary}`
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button - Show on home page OR dashboard pages */}
              {(isHomePage && user) || (isDashboardPage && user && onMenuToggle) ? (
                <button
                  onClick={handleMenuToggle}
                  className={`lg:hidden p-2 rounded-lg ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} transition-colors duration-200`}
                >
                  <Menu className="w-6 h-6" />
                </button>
              ) : null}

              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Banana"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                </div>
                <span className={`text-2xl font-bold ${colorClasses.text.primary} group-hover:${colorClasses.text.goldenMustard} transition-colors duration-200`}>Banana</span>
              </Link>
            </div>

            {/* Center Section - Navigation Links (Desktop) */}
            <div className="hidden lg:flex items-center space-x-4 flex-1 justify-center">
              {/* Navigation Links for logged-out users */}
              {!user && (
                <div className="flex items-center space-x-2">
                  {publicNavLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`px-5 py-2.5 text-base font-bold ${colorClasses.text.secondary} transition-all duration-200 rounded-lg hover:${colorClasses.bg.goldenMustard} hover:${colorClasses.text.inverse} border border-transparent hover:border hover:${colorClasses.border.goldenMustard} shadow-sm hover:shadow-md`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* Quick Links for logged-in users - Hide on dashboard pages since they have sidebar */}
              {user && !isDashboardPage && (
                <div className="flex items-center space-x-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-5 py-2.5 text-base font-bold ${colorClasses.text.secondary} transition-all duration-200 rounded-lg hover:${colorClasses.bg.goldenMustard} hover:${colorClasses.text.inverse} border border-transparent hover:border hover:${colorClasses.border.goldenMustard} shadow-sm hover:shadow-md`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Section - Auth Buttons or User Menu */}
            <div className="flex items-center space-x-4">
              {/* Auth Buttons - Show when user is NOT logged in - Hidden on mobile */}
              {!user && (
                <div className="hidden lg:flex items-center space-x-3">
                  <Link
                    href="/login"
                    className={`px-5 py-2.5 text-sm font-medium ${colorClasses.text.secondary} hover:${colorClasses.text.primary} transition-colors rounded-lg hover:${colorClasses.bg.surface}`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`px-5 py-2.5 text-sm font-medium ${colorClasses.text.inverse} ${colorClasses.bg.goldenMustard} hover:brightness-110 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* User Profile Dropdown - Show when user is logged in */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`flex items-center space-x-3 p-1 rounded-xl ${colorClasses.text.primary} hover:${colorClasses.bg.surface} transition-colors duration-200 group`}
                  >
                    <div className={`w-8 h-8 ${colorClasses.bg.goldenMustard} rounded-full flex items-center justify-center ${colorClasses.text.inverse} font-semibold text-sm shadow-md`}>
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className={`text-sm font-medium ${colorClasses.text.primary}`}>{user.name}</p>
                      <p className={`text-xs ${colorClasses.text.muted} capitalize`}>{user.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${colorClasses.text.muted} transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-64 ${colorClasses.bg.primary} rounded-2xl shadow-xl border ${colorClasses.border.primary} py-2 z-50 animate-in fade-in-80 transition-colors duration-300`}>
                      {/* User Info */}
                      <div className={`px-4 py-3 border-b ${colorClasses.border.secondary}`}>
                        <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>{user.name}</p>
                        <p className={`text-sm ${colorClasses.text.muted} mt-1`}>{user.email}</p>
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg.goldenMustard} ${colorClasses.text.inverse} capitalize`}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href={`/dashboard/${user.role}/profile`}
                          className={`flex items-center px-4 py-2.5 text-sm ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} transition-colors duration-200 group`}
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className={`w-4 h-4 mr-3 ${colorClasses.text.muted} group-hover:${colorClasses.text.primary}`} />
                          Your Profile
                        </Link>
                        <Link
                          href={`/dashboard/${user.role}`}
                          className={`flex items-center px-4 py-2.5 text-sm ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} transition-colors duration-200 group`}
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <LayoutDashboardIcon className={`w-4 h-4 mr-3 ${colorClasses.text.muted} group-hover:${colorClasses.text.primary}`} />
                          Dashboard
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className={`border-t ${colorClasses.border.secondary} pt-2`}>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileDropdownOpen(false);
                          }}
                          className={`flex items-center w-full px-4 py-2.5 text-sm ${colorClasses.text.error} hover:${colorClasses.bg.redLight} transition-colors duration-200 group`}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button - Show on non-dashboard pages OR when no onMenuToggle */}
              {!isDashboardPage && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`lg:hidden p-2 rounded-lg ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} transition-colors duration-200`}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu - Only show on non-dashboard pages */}
          {!isDashboardPage && isMobileMenuOpen && (
            <div className={`lg:hidden mt-4 ${colorClasses.bg.primary} rounded-2xl shadow-xl border ${colorClasses.border.primary} p-4 animate-in slide-in-from-top-5 transition-colors duration-300`}>
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                {/* Show different links based on auth status */}
                {(user ? quickLinks : publicNavLinks).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-lg ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} transition-colors duration-200 font-medium`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Mobile Auth Buttons - Show when user is NOT logged in */}
              {!user && (
                <div className={`border-t ${colorClasses.border.secondary} mt-4 pt-4 space-y-2`}>
                  <Link
                    href="/login"
                    className={`block px-4 py-3 rounded-lg ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} transition-colors duration-200 font-medium text-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`block px-4 py-3 rounded-lg ${colorClasses.text.inverse} ${colorClasses.bg.goldenMustard} hover:brightness-110 transition-all duration-200 font-medium text-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile User Actions - Show when user is logged in */}
              {user && (
                <div className={`border-t ${colorClasses.border.secondary} mt-4 pt-4`}>
                  <Link
                    href={`/dashboard/${user.role}/profile`}
                    className={`flex items-center px-4 py-3 rounded-lg ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} transition-colors duration-200`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className={`w-5 h-5 mr-3 ${colorClasses.text.muted}`} />
                    Your Profile
                  </Link>
                  <Link
                    href={`/dashboard/${user.role}`}
                    className={`flex items-center px-4 py-3 rounded-lg ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} transition-colors duration-200`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboardIcon className={`w-5 h-5 mr-3 ${colorClasses.text.muted}`} />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-lg ${colorClasses.text.error} hover:${colorClasses.bg.redLight} transition-colors duration-200`}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Sidebar - Only shown on home page when user is logged in and sidebar is open */}
      {isHomePage && user && localSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 lg:hidden backdrop-blur-sm transition-all duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setLocalSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div
            className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl"
            style={{
              backgroundColor: 'white',
              transform: localSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}
          >
            <Sidebar onClose={() => setLocalSidebarOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}