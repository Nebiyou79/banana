import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import Header from './Header';
import Sidebar from './Sidebar';
import NotificationContainer from './NotificationContainer';


interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { state } = useAdmin();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      <NotificationContainer/>
    </div>
  );
};

export default AdminLayout;