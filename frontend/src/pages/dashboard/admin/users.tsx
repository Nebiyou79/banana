import AdminLayout from '@/components/admin/AdminLayout';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import UserManagement from '@/components/admin/UserManagment';
import React from 'react';

const UsersPage: React.FC = () => {
  return (
  <AdminRouteGuard>
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  </AdminRouteGuard>
  );
};

export default UsersPage;