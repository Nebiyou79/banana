import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAdmin } from '../../contexts/AdminContext';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useAdmin();
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: '👥', path: '/admin/users' },
    { id: 'jobs', label: 'Job Management', icon: '💼', path: '/admin/jobs' },
    { id: 'templates', label: 'Templates', icon: '📋', path: '/admin/templates' },
    { id: 'reports', label: 'Reports', icon: '📈', path: '/admin/reports' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${state.sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`
                flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-800 hover:shadow-lg
                ${router.pathname === item.path ? 'bg-blue-600 shadow-lg' : ''}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="font-bold text-white">
                {state.user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{state.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">{state.user?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {state.sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}
    </>
  );
};

export default Sidebar;