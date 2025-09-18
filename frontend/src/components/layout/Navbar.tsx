// Updated Navbar with modern design
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Briefcase, User, Building, LogOut, Menu, X, 
  Bell, MessageSquare, Search, ChevronDown 
} from 'lucide-react';

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getNavLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case "candidate":
        return [
          { href: "/dashboard/candidate/jobs", label: "Find Jobs", icon: <Search className="w-4 h-4" /> },
          { href: "/dashboard/candidate", label: "Dashboard", icon: <User className="w-4 h-4" /> },
          { href: "/dashboard/candidate/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer/jobs", label: "Find Work", icon: <Search className="w-4 h-4" /> },
          { href: "/dashboard/freelancer", label: "Dashboard", icon: <User className="w-4 h-4" /> },
          { href: "/dashboard/freelancer/portfolio", label: "Portfolio", icon: <Briefcase className="w-4 h-4" /> },
        ];
      case "company":
        return [
          { href: "/talents", label: "Find Talent", icon: <Search className="w-4 h-4" /> },
          { href: "/dashboard/company", label: "Dashboard", icon: <Building className="w-4 h-4" /> },
          { href: "/dashboard/company/jobs", label: "Post Job", icon: <Briefcase className="w-4 h-4" /> },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Dashboard", icon: <Building className="w-4 h-4" /> },
          { href: "/dashboard/admin/jobs", label: "Manage Jobs", icon: <Briefcase className="w-4 h-4" /> },
          { href: "/dashboard/admin/users", label: "Users", icon: <User className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-md shadow-lg py-2' 
        : 'bg-white py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Banana <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-gray-500">Jobs</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Find Jobs
                </Link>
                <Link href="/companies" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Find Companies
                </Link>
                <Link href="/freelancers" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Find Talent
                </Link>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    5
                  </span>
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link 
                        href={`/dashboard/${user.role}/profile`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Your Profile
                      </Link>
                      <Link 
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex flex-col space-y-3">
              {!user ? (
                <>
                  <Link href="/jobs" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                    Find Jobs
                  </Link>
                  <Link href="/companies" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                    Find Companies
                  </Link>
                  <Link href="/freelancers" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                    Find Talent
                  </Link>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </>
              )}
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                {!user ? (
                  <div className="flex flex-col space-y-3">
                    <Link 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-center py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold text-center hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors font-medium w-full py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}