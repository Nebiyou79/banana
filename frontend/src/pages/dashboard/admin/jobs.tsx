import AdminLayout from '@/components/admin/AdminLayout';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import JobManagement from '@/components/admin/JobManagment';
import React from 'react';

const JobsPage: React.FC = () => {
  return (
  <AdminRouteGuard>
     <AdminLayout>
      <JobManagement />
    </AdminLayout>
  </AdminRouteGuard>
  );
};

export default JobsPage;