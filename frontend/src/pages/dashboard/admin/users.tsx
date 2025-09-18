import AdminLayout from '@/components/admin/adminLayout';
import UserManagement from '@/components/admin/UserManagment';
import React from 'react';

const UsersPage: React.FC = () => {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  );
};

export default UsersPage;