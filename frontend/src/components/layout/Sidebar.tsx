// Updated Sidebar with modern design
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, User, Briefcase, FileText, CheckCircle, 
  LogOut, Folder, MessageSquare, Users, Settings, 
  NutIcon
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    const iconClass = "w-5 h-5";
    
    switch (user.role) {
      case "candidate":
        return [
          { href: "/dashboard/candidate", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/candidate/profile", label: "Profile", icon: <User className={iconClass} /> },
          { href: "/dashboard/candidate/jobs", label: "Jobs", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/candidate/verification", label: "Verification", icon: <CheckCircle className={iconClass} /> },
          { href: "/about", label: "About Us", icon: <NutIcon className={iconClass} /> },
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/freelancer/profile", label: "Profile", icon: <User className={iconClass} /> },
          { href: "/dashboard/freelancer/portfolio", label: "Portfolio", icon: <Folder className={iconClass} /> },
          { href: "/dashboard/freelancer/jobs", label: "Available Jobs", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/freelancer/proposals", label: "My Proposals", icon: <FileText className={iconClass} /> },
          { href: "/about", label: "About Us", icon: <NutIcon className={iconClass} /> },
        ];
      case "company":
        return [
          { href: "/dashboard/company", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/company/profile", label: "Company Profile", icon: <User className={iconClass} /> },
          { href: "/dashboard/company/jobs", label: "Job Postings", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/company/applications", label: "Applications", icon: <FileText className={iconClass} /> },
          { href: "/about", label: "About Us", icon: <NutIcon className={iconClass} /> },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/admin/jobs", label: "Jobs", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/admin/candidates", label: "Candidates", icon: <Users className={iconClass} /> },
          { href: "/dashboard/admin/companies", label: "Companies", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/admin/exams", label: "Exams", icon: <FileText className={iconClass} /> },
          { href: "/about", label: "About Us", icon: <NutIcon className={iconClass} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-64 mt-15 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen p-4 shadow-xl">
      <div className="flex items-center space-x-3 mb-8 p-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          {user.role.toUpperCase()} DASHBOARD
        </h2>
      </div>
      
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                router.pathname === link.href
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="mt-8 pt-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;