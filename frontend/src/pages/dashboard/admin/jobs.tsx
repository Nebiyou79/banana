import AdminLayout from '@/components/admin/adminLayout';
import JobManagement from '@/components/admin/JobManagment';
import React from 'react';

const JobsPage: React.FC = () => {
  return (
    <AdminLayout>
      <JobManagement />
    </AdminLayout>
  );
};

export default JobsPage;