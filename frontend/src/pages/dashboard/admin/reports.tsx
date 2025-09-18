import AdminLayout from '@/components/admin/adminLayout';
import React from 'react';

const ReportsPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and view system reports</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-500 dark:text-gray-400">Reports dashboard coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;