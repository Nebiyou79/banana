import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext'; // Use useAuth instead of useAdmin
import { useToast } from '@/hooks/use-toast'; // Add toast for error handling

export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth(); // Use AuthContext properties
  const { toast } = useToast(); // Initialize toast
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      console.log('AdminRouteGuard: Redirecting to login - not authenticated or not admin');
      
      // Show toast notification for unauthorized access
      if (isAuthenticated && user?.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin panel.',
          variant: 'destructive',
        });
      }
      
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null; // Will redirect automatically
  }

  return <>{children}</>;
};