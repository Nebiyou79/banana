import React from 'react';
import AdminLayout from '@/components/admin/adminLayout';
import Dashboard from '@/components/admin/Dashboard';

const DashboardPage: React.FC = () => {
  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
};

export default DashboardPage;