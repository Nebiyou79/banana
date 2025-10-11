import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/components/admin/Dashboard';
import { Loader2 } from 'lucide-react';

const AdminIndex: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[AdminDashboard] isLoading:', isLoading, '| isAuthenticated:', isAuthenticated, '| user:', user);
    if (!isLoading && !isAuthenticated) {
      console.log('[AdminDashboard] Not authenticated, redirecting to /login');
      router.push('/login');
      return;
    }
    if (!isLoading && isAuthenticated && user?.role !== 'admin') {
      console.log(`[AdminDashboard] Authenticated but wrong role (${user?.role}), redirecting to /dashboard/${user?.role}`);
      router.push(`/dashboard/${user?.role}`);
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
};

export default AdminIndex;