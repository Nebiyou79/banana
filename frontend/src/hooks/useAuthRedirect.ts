// src/hooks/useAuthRedirect.ts
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/authService';
import { toast } from '@/hooks/use-toast';

// Define all routes accessible without login
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth',
];

export const useAuthRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      const currentPath = router.asPath.split('?')[0].replace(/\/$/, '');
      const isPublic = PUBLIC_ROUTES.some(route => 
        currentPath === route || currentPath.startsWith(`${route}/`)
      );
      const userRole = localStorage.getItem('role');
      console.log('[useAuthRedirect] isAuthenticated:', isAuthenticated, '| currentPath:', currentPath, '| isPublic:', isPublic, '| userRole:', userRole);

      // 🚫 Not authenticated and not on a public route → redirect to login
      if (!isAuthenticated && !isPublic) {
        toast({
          title: 'Authentication Required',
          description: 'Login to access this page',
          variant: 'warning',
        });
        console.log('[useAuthRedirect] Redirecting to /login');
        router.replace('/login');
        return;
      }

      // ✅ Authenticated and visiting auth pages → redirect to dashboard
      const isAuthRoute = [
        '/login', 
        '/register', 
        '/forgot-password', 
        '/reset-password', 
        '/verify-email'
      ].includes(currentPath);
      
      if (isAuthenticated && isAuthRoute) {
        const role = userRole || 'candidate';
        console.log('[useAuthRedirect] Redirecting to /dashboard/' + role);
        router.replace(`/dashboard/${role}`);
      }
    };

    checkAuth();
  }, [router]);
};