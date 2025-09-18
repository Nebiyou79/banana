import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export const RoleRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPaths: Record<string, string> = {
        candidate: '/dashboard/candidate',
        freelancer: '/dashboard/freelancer',
        company: '/dashboard/company',
        organization: '/dashboard/organization',
        admin: '/dashboard/admin'
      };
      
      const dashboardPath = dashboardPaths[user.role] || '/dashboard';
      router.replace(dashboardPath);
    }
  }, [user, isAuthenticated, router]);

  return null;
};