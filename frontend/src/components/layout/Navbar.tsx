// /src/components/layouts/Navbar.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Briefcase, User, Building, LogOut, Menu, X, 
  Bell, MessageSquare, Search, ChevronDown, ClipboardList,
  FileText,
  Award
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colors } from '@/utils/color';
import Image from "next/image";

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
          { href: "/tenders", label: "Browse Tenders", icon: <ClipboardList className="w-4 h-4" /> },
          { href: "/dashboard/freelancer/proposals", label: "My Proposals", icon: <FileText className="w-4 h-4" /> },
          { href: "/dashboard/freelancer", label: "Dashboard", icon: <User className="w-4 h-4" /> },
          { href: "/dashboard/freelancer/portfolio", label: "Portfolio", icon: <Briefcase className="w-4 h-4" /> },
        ];
      case "company":
        return [
          { href: "/tenders", label: "Browse Tenders", icon: <ClipboardList className="w-4 h-4" /> },
          { href: "/dashboard/company/tenders/create", label: "Create Tender", icon: <Award className="w-4 h-4" /> },
          { href: "/talents", label: "Find Talent", icon: <Search className="w-4 h-4" /> },
          { href: "/dashboard/company", label: "Dashboard", icon: <Building className="w-4 h-4" /> },
        ];
      case "organization":
        return [
          { href: "/organization/company/tenders/create", label: "Create Tender", icon: <Award className="w-4 h-4" /> },
          { href: "/talents", label: "Find Talent", icon: <Search className="w-4 h-4" /> },
          { href: "/organization/company", label: "Dashboard", icon: <Building className="w-4 h-4" /> },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin/tenders", label: "Manage Tenders", icon: <ClipboardList className="w-4 h-4" /> },
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
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: colors.white }}
            >
              <Image src="/logo2.png" alt="Banana Jobs" width={370} height={170} />
            </div>
            <span className="text-2xl font-bold" style={{ color: colors.darkNavy }}>
              Banana <span style={{ color: colors.gold }}>Jobs</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                <Link href="/jobs" className="transition-colors font-medium" style={{ color: colors.darkNavy }}>
                  Find Jobs
                </Link>
                <Link href="/tenders" className="transition-colors font-medium" style={{ color: colors.darkNavy }}>
                  Browse Tenders
                </Link>
                <Link href="/companies" className="transition-colors font-medium" style={{ color: colors.darkNavy }}>
                  Find Companies
                </Link>
                <Link href="/freelancers" className="transition-colors font-medium" style={{ color: colors.darkNavy }}>
                  Find Talent
                </Link>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-1 transition-colors font-medium"
                    style={{ color: colors.darkNavy }}
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
                <button className="p-2 transition-colors relative" style={{ color: colors.darkNavy }}>
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center" style={{ backgroundColor: colors.orange, color: colors.white }}>
                    3
                  </span>
                </button>
                <button className="p-2 transition-colors relative" style={{ color: colors.darkNavy }}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center" style={{ backgroundColor: colors.blue, color: colors.white }}>
                    5
                  </span>
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: colors.goldenMustard }}
                    >
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4" style={{ color: colors.darkNavy }} />
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border" style={{ borderColor: colors.gray100 }}>
                      <div className="px-4 py-2 border-b" style={{ borderColor: colors.gray100 }}>
                        <p className="text-sm font-medium" style={{ color: colors.darkNavy }}>{user.name}</p>
                        <p className="text-xs" style={{ color: colors.gray400 }}>{user.email}</p>
                      </div>
                      <Link 
                        href={`/dashboard/${user.role}/profile`}
                        className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100"
                        style={{ color: colors.darkNavy }}
                      >
                        Your Profile
                      </Link>
                      <Link 
                        href="/settings"
                        className="block px-4 py-2 text-sm transition-colors hover:bg-gray-100"
                        style={{ color: colors.darkNavy }}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-100"
                        style={{ color: colors.orange }}
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
                  className="font-medium transition-colors"
                  style={{ color: colors.darkNavy }}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: colors.goldenMustard }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: colors.darkNavy }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4 border" style={{ borderColor: colors.gray100 }}>
            <div className="flex flex-col space-y-3">
              {!user ? (
                <>
                  <Link href="/jobs" className="font-medium py-2 transition-colors" style={{ color: colors.darkNavy }}>
                    Find Jobs
                  </Link>
                  <Link href="/tenders" className="font-medium py-2 transition-colors" style={{ color: colors.darkNavy }}>
                    Browse Tenders
                  </Link>
                  <Link href="/companies" className="font-medium py-2 transition-colors" style={{ color: colors.darkNavy }}>
                    Find Companies
                  </Link>
                  <Link href="/freelancers" className="font-medium py-2 transition-colors" style={{ color: colors.darkNavy }}>
                    Find Talent
                  </Link>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center space-x-2 font-medium py-2 transition-colors"
                      style={{ color: colors.darkNavy }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </>
              )}
              
              <div className="border-t pt-3 mt-3" style={{ borderColor: colors.gray100 }}>
                {!user ? (
                  <div className="flex flex-col space-y-3">
                    <Link 
                      href="/login" 
                      className="font-medium text-center py-2 transition-colors"
                      style={{ color: colors.goldenMustard }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="text-white px-6 py-2 rounded-xl font-semibold text-center transition-all duration-300"
                      style={{ backgroundColor: colors.goldenMustard }}
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
                    className="flex items-center space-x-2 transition-colors font-medium w-full py-2"
                    style={{ color: colors.orange }}
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