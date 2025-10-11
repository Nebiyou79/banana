// components/admin/Sidebar.tsx
import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  BarChart3, 
  Settings,
  Menu,
  X,
  FileIcon
} from 'lucide-react';

// Sidebar Context
const SidebarContext = React.createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const router = useRouter();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" />, 
      path: '/dashboard/admin' 
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: <Users className="w-5 h-5" />, 
      path: '/dashboard/admin/users' 
    },
    { 
      id: 'jobs', 
      label: 'Job Management', 
      icon: <Briefcase className="w-5 h-5" />, 
      path: '/dashboard/admin/jobs' 
    },
    { 
      id: 'tenders', 
      label: 'Tender Mangment', 
      icon: <FileIcon className="w-5 h-5" />, 
      path: '/dashboard/admin/tender' 
    },
    { 
      id: 'templates', 
      label: 'Templates', 
      icon: <FileText className="w-5 h-5" />, 
      path: '/dashboard/admin/templates' 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: <BarChart3 className="w-5 h-5" />, 
      path: '/dashboard/admin/reports' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      path: '/dashboard/admin/settings' 
    },
  ];

  const userName = user?.name || 'Admin';
  const userEmail = user?.email || 'admin@example.com';
  const userInitial = userName.charAt(0).toUpperCase();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 
        w-64 h-screen bg-gray-900 text-white 
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-gray-400">Management Console</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
                onClick={handleLinkClick}
              >
                <div className={`
                  transition-colors duration-200
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                `}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 w-full p-6 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="font-bold text-white text-sm">
                {userInitial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              <p className="text-xs text-blue-400 font-medium capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;