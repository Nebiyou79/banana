import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/authService';

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
      // router.asPath ensures query strings like /terms?ref=signup still work
      const currentPath = router.asPath.split('?')[0].replace(/\/$/, '');

      const isPublic = PUBLIC_ROUTES.some(route => 
        currentPath === route || currentPath.startsWith(`${route}/`)
      );

      console.log('Auth Check:', { currentPath, isAuthenticated, isPublic });

      // 🚫 Not authenticated and not on a public route → redirect to login
      if (!isAuthenticated && !isPublic) {
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
        const userRole = localStorage.getItem('role') || 'candidate';
        router.replace(`/dashboard/${userRole}`);
      }
    };

    checkAuth();
  }, [router]);
};