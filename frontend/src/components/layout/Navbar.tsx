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

interface NavbarProps {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          { href: "/dashboard/candidate/profile", label: "Profile" },
          { href: "/dashboard/candidate", label: "Dashboard" },
          { href: "/dashboard/candidate/social", label: "Social Feed" },
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer/tenders", label: "Browse Tenders" },
          { href: "/dashboard/freelancer/profile", label: "Profile" },
          { href: "/dashboard/freelancer", label: "Dashboard" },
          { href: "/dashboard/freelancer/social", label: "Social Feed" },
        ];
      case "company":
        return [
          { href: "/dashboard/company/jobs", label: "Manage Jobs" },
          { href: "/tenders", label: "Browse Tenders" },
          { href: "/dashboard/company/profile", label: "Profile" },
          { href: "/dashboard/company", label: "Dashboard" },
          { href: "/dashboard/company/social", label: "Social Feed" },
        ];
      case "organization":
        return [
          { href: "/dashboard/organization/tenders", label: "My Tenders" },
          { href: "/dashboard/organization/profile", label: "Profile" },
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled
      ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200 py-3'
      : 'bg-white py-4 border-b border-gray-100'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Logo - Bigger size */}
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
              <span className="text-2xl font-bold text-gray-900">Banana</span>
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
                    className="px-5 py-2.5 text-base font-bold text-gray-900 transition-all duration-200 rounded-lg hover:bg-yellow-500 hover:text-blue-900 border border-transparent hover:border-blue-500 shadow-sm hover:shadow-md"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Quick Links for logged-in users */}
            {user && (
              <div className="flex items-center space-x-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-5 py-2.5 text-base font-bold text-gray-900 transition-all duration-200 rounded-lg hover:bg-yellow-500 hover:text-blue-900 border border-transparent hover:border-blue-500 shadow-sm hover:shadow-md"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - Auth Buttons (when logged out) or User Menu (when logged in) */}
          <div className="flex items-center space-x-4">
            {/* Auth Buttons - Show when user is NOT logged in - Hidden on mobile */}
            {!user && (
              <div className="hidden lg:flex items-center space-x-3">
                <Link
                  href="/signin"
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
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
                  className="flex items-center space-x-3 p-1 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''
                    }`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in-80">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                      <div className="flex items-center mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href={`/dashboard/${user.role}/profile`}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-600" />
                        Your Profile
                      </Link>
                      <Link
                        href="/dashboard/${user.role}"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <LayoutDashboardIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-600" />
                        Dashboard
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-top-5">

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {/* Show different links based on auth status */}
              {(user ? quickLinks : publicNavLinks).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth Buttons - Show when user is NOT logged in */}
            {!user && (
              <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                <Link
                  href="/login"
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block px-4 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile User Actions - Show when user is logged in */}
            {user && (
              <div className="border-t border-gray-200 mt-4 pt-4">
                <Link
                  href={`/dashboard/${user.role}/profile`}
                  className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  Your Profile
                </Link>
                <Link
                  href="/dashboard/${user.role}"
                  className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboardIcon className="w-5 h-5 mr-3 text-gray-400" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
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
  );
}