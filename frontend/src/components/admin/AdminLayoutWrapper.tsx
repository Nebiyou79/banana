import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext'; // Use AuthProvider instead of AdminProvider
import AdminLayout from './AdminLayout';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

const AdminLayoutWrapper: React.FC<AdminLayoutWrapperProps> = ({ children }) => {
  return (
    <AuthProvider> {/* Changed from AdminProvider to AuthProvider */}
      <AdminLayout>
        {children}
      </AdminLayout>
    </AuthProvider>
  );
};

export default AdminLayoutWrapper;