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
      <div className={`min-h-screen ${colorClasses.bg.gray100} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className={`mt-4 ${colorClasses.text.gray800} font-medium`}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className={`min-h-screen ${colorClasses.bg.gray100} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${colorClasses.bg.orange} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-9V4m0 2V4m0 2h2M9 6H7m10 6a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${colorClasses.text.darkNavy} mb-2`}>Access Denied</h2>
          <p className={colorClasses.text.gray800}>You don`t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 lg:ml-80">
        {/* Navbar */}
        <div className="flex-shrink-0 z-20">
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-16">
          <div className="max-w-7xl pt-10 mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy} capitalize`}>
                    {router.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                  </h1>
                  <p className={`${colorClasses.text.gray800} mt-2 flex items-center`}>
                    <span>Welcome Back,</span>
                    <span className={`font-semibold ${colorClasses.text.blue} ml-1`}>{user?.name}</span>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{user?.role}</span>
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="hidden lg:flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 text-sm ${colorClasses.text.gray800} ${colorClasses.bg.white} px-4 py-2 rounded-lg shadow-sm border ${colorClasses.border.gray400}`}>
                    <div className={`w-2 h-2 rounded-full ${colorClasses.bg.teal} animate-pulse`}></div>
                    <span>All systems operational</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className={`${colorClasses.bg.white} rounded-2xl shadow-sm border ${colorClasses.border.gray400} overflow-hidden`}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}