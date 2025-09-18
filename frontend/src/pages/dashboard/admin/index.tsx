import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAdmin } from '@/contexts/AdminContext';

const AdminIndex: React.FC = () => {
  const { state } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [state.isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default AdminIndex;