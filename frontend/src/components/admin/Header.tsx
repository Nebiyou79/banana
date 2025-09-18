import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { state, dispatch } = useAdmin();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-1"></span>
            🔔
          </button>

          <div className="relative">
            <button className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {state.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                {state.user?.name || 'Admin'}
              </span>
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                🚪 Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;