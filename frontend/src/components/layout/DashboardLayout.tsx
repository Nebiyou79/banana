import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { companyService } from '@/services/companyService';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'candidate' | 'company' | 'freelancer' | 'admin';
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'company') {
      // Check if company user has a profile
      const checkCompanyProfile = async () => {
        try {
          const companyData = await companyService.getMyCompany();
          if (!companyData && !router.pathname.includes('/company/profile')) {
            router.push('/dashboard/company/profile');
          }
        } catch (error) {
          console.error('Error checking company profile:', error);
        }
      };
      
      checkCompanyProfile();
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Redirect if required role doesn't match
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      router.push(`/dashboard/${user?.role}`);
    }
  }, [user, isLoading, isAuthenticated, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show loading while redirecting for role mismatch
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

 return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 mt-16"> {/* Added mt-16 to account for fixed navbar */}
          {children}
        </main>
      </div>
    </div>
  );
}