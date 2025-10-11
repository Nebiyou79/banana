import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { companyService } from '@/services/companyService';
import { toast } from '@/hooks/use-toast';
import { colors } from '@/utils/color';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'company' | 'freelancer' | 'admin' | 'organization';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              style: { backgroundColor: colors.goldenMustard, color: colors.darkNavy }
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

  if (isLoading || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.gray100 }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.goldenMustard }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: colors.gray100 }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.goldenMustard }}></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.gray100 }}>
      {/* Navbar always visible */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar />
      </div>

      <div className="flex flex-1 pt-16"> 
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 fixed top-16 left-0 bottom-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar Drawer */}
            <div className="fixed top-0 left-0 bottom-0 w-64 z-50 bg-white">
              <Sidebar />
            </div>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6 relative z-0">
          {/* Mobile toggle button */}
          <button
            className="lg:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg"
            style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {children}
        </main>
      </div>
    </div>
  );
}
