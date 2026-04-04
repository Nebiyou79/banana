import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { companyService } from '@/services/companyService';
import { toast } from '@/hooks/use-toast';
import { colors, colorClasses } from '@/utils/color';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'company' | 'freelancer' | 'admin' | 'organization';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'company') {
      const checkCompanyProfile = async () => {
        setCheckingProfile(true);
        try {
          const companyData = await companyService.getMyCompany();
          if (!companyData && !router.pathname.includes('/company/profile')) {
            toast({
              title: 'Complete Your Profile',
              description: 'Please complete your company profile to continue',
            });
            router.push('/dashboard/company/profile');
          }
        } catch (error) {
          console.error('Error checking company profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to check company profile',
            variant: 'destructive',
          });
        } finally {
          setCheckingProfile(false);
        }
      };
      checkCompanyProfile();
    }
  }, [user, isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      toast({
        title: 'Access Denied',
        description: `You don't have permission to access this page`,
        variant: 'destructive',
      });
      router.push(`/dashboard/${user?.role}`);
    }
  }, [user, isLoading, isAuthenticated, requiredRole, router]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router.pathname, isMobile]);

  if (isLoading || checkingProfile) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 flex items-center justify-center`}
        style={{ backgroundColor: lightTheme.bg.secondary }}
      >
        <div className="text-center">
          <div className="relative">
            {/* Themed Spinner */}
            <div 
              className="w-16 h-16 rounded-full animate-spin mx-auto"
              style={{
                border: `2px solid ${lightTheme.border.default}`,
                borderTopColor: colors.goldenMustard
              }}
            />
          </div>
          <p 
            className="mt-4 font-medium transition-colors duration-300"
            style={{ color: lightTheme.text.primary }}
          >
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 flex items-center justify-center`}
        style={{ backgroundColor: lightTheme.bg.secondary }}
      >
        <div className="text-center max-w-md mx-auto px-6">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ 
              backgroundColor: `${colors.red}15`,
            }}
          >
            <svg 
              className="w-10 h-10" 
              style={{ color: colors.red }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 
            className="text-2xl font-bold mb-3"
            style={{ color: lightTheme.text.primary }}
          >
            Access Denied
          </h2>
          <p 
            className="text-lg"
            style={{ color: lightTheme.text.secondary }}
          >
            You don`t have permission to access this page.
          </p>
          <button
            onClick={() => router.push(`/dashboard/${user?.role}`)}
            className="mt-8 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: colors.goldenMustard,
              color: colors.white
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: lightTheme.bg.secondary }}
    >
      {/* Desktop Sidebar - Always visible on desktop */}
      <div 
        className="hidden lg:block fixed inset-y-0 left-0 z-30"
        style={{
          borderRight: `1px solid ${lightTheme.border.default}`,
          backgroundColor: lightTheme.bg.primary
        }}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm transition-all duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div 
            className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl"
            style={{ backgroundColor: lightTheme.bg.primary }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 lg:ml-80 transition-all duration-300">
        {/* Navbar */}
        <div className="shrink-0 z-20">
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 
                    className="text-3xl lg:text-4xl font-bold mb-2 capitalize transition-colors duration-300"
                    style={{ color: lightTheme.text.primary }}
                  >
                    {router.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                  </h1>
                  <p 
                    className="text-lg flex flex-wrap items-center gap-2 transition-colors duration-300"
                    style={{ color: lightTheme.text.muted }}
                  >
                    <span 
                      className="font-semibold"
                      style={{ color: lightTheme.text.primary }}
                    >
                      Welcome Back
                    </span>                    <span 
                      className="font-semibold"
                      style={{ color: lightTheme.text.primary }}
                    >
                      {user?.name}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span 
                      className="capitalize font-medium px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${colors.goldenMustard}15`,
                        color: colors.goldenMustard
                      }}
                    >
                      {user?.role}
                    </span>
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="hidden lg:flex items-center space-x-3">
                  <div 
                    className="flex items-center space-x-3 px-5 py-2.5 rounded-xl shadow-sm border transition-colors duration-300"
                    style={{
                      backgroundColor: lightTheme.bg.surface,
                      borderColor: lightTheme.border.default
                    }}
                  >
                    <div className="relative">
                      <div 
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: colors.green }}
                      />
                      <div 
                        className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75"
                        style={{ backgroundColor: colors.green }}
                      />
                    </div>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: lightTheme.text.secondary }}
                    >
                      All systems operational
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div 
              className="rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl"
              style={{
                backgroundColor: lightTheme.bg.primary,
                borderColor: lightTheme.border.default
              }}
            >
              {children}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        /* Dark mode overrides */
        @media (prefers-color-scheme: dark) {
          div[style*="background-color"] {
            background-color: ${darkTheme.bg.secondary} !important;
          }
          
          div[style*="border-right"] {
            border-right-color: ${darkTheme.border.default} !important;
            background-color: ${darkTheme.bg.primary} !important;
          }
          
          .fixed.inset-y-0.left-0.w-80 {
            background-color: ${darkTheme.bg.primary} !important;
          }
          
          div[style*="box-shadow"] {
            background-color: ${darkTheme.bg.primary} !important;
            border-color: ${darkTheme.border.default} !important;
          }
          
          h1, h2, p, span {
            color: ${darkTheme.text.primary} !important;
          }
          
          p[style*="color"] {
            color: ${darkTheme.text.secondary} !important;
          }
          
          .text-sm.font-medium {
            color: ${darkTheme.text.secondary} !important;
          }
          
          .backdrop-blur-sm {
            background-color: rgba(0, 0, 0, 0.7) !important;
          }
        }
      `}</style>
    </div>
  );
}

// Theme constants for styling
const lightTheme = {
  bg: {
    primary: colorClasses.bg.white,
    secondary: colorClasses.bg.gray100,
    surface: colorClasses.bg.gray100,
  },
  text: {
    primary: colorClasses.text.darkNavy,
    secondary: colorClasses.text.gray800,
    muted: colorClasses.text.gray400,
  },
  border: {
    default: colorClasses.border.gray400,
  }
};

const darkTheme = {
  bg: {
    primary: colorClasses.bg.darkNavy,
    secondary: colorClasses.bg.gray800,
    surface: colorClasses.bg.gray700,
  },
  text: {
    primary: colorClasses.text.white,
    secondary: colorClasses.text.gray100,
    muted: colorClasses.text.gray400,
  },
  border: {
    default: colorClasses.border.gray800,
  }
};