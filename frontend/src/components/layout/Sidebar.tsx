import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, User, Briefcase, FileText, CheckCircle, 
  LogOut, Folder, Users, 
  ClipboardList, Award, Bookmark,
  TestTubeIcon, List, Plus, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colors } from '@/utils/color';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
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
        ];
      case "freelancer":
        return [
          { href: "/dashboard/freelancer", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/freelancer/profile", label: "Profile", icon: <User className={iconClass} /> },
          { href: "/dashboard/freelancer/portfolio", label: "Portfolio", icon: <Folder className={iconClass} /> },
          { href: "/tenders", label: "Browse Tenders", icon: <ClipboardList className={iconClass} /> },
          // { href: "/dashboard/freelancer/proposals", label: "My Proposals", icon: <FileText className={iconClass} /> },
          // { href: "/dashboard/freelancer/saved-tenders", label: "Saved Tenders", icon: <Bookmark className={iconClass} /> },
        ];
      case "company":
        return [
          { href: "/dashboard/company", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/company/jobs", label: "Jobs", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/company/profile", label: "Company Profile", icon: <User className={iconClass} /> },
          { href: "/dashboard/company/tenders", label: "My Tenders", icon: <List className={iconClass} /> },
          { href: "/dashboard/company/tenders/create", label: "Create Tender", icon: <Plus className={iconClass} /> },
          { href: "/dashboard/company/applications", label: "Applications", icon: <FileText className={iconClass} /> },
          { href: "/dashboard/company/verifcation", label: "Verifcation", icon: <TestTubeIcon className={iconClass} /> },
        ];
              case "organization":
        return [
          { href: "/dashboard/organization", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/organization/jobs", label: "Jobs", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/organization/profile", label: "Company Profile", icon: <User className={iconClass} /> },
          { href: "/dashboard/organization/tenders", label: "My Tenders", icon: <List className={iconClass} /> },
          { href: "/dashboard/organization/tenders/create", label: "Create Tender", icon: <Plus className={iconClass} /> },
          { href: "/dashboard/organization/applications", label: "Applications", icon: <FileText className={iconClass} /> },
          { href: "/dashboard/organization/verifcation", label: "Verifcation", icon: <TestTubeIcon className={iconClass} /> },
        ];
      case "admin":
        return [
          { href: "/dashboard/admin", label: "Dashboard", icon: <Home className={iconClass} /> },
          { href: "/dashboard/admin/tenders", label: "Tenders", icon: <ClipboardList className={iconClass} /> },
          { href: "/dashboard/admin/jobs", label: "Jobs", icon: <Briefcase className={iconClass} /> },
          { href: "/dashboard/admin/candidates", label: "Candidates", icon: <Users className={iconClass} /> },
          { href: "/dashboard/admin/companies", label: "Companies", icon: <Briefcase className={iconClass} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: 'Logout Error',
        description: 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <aside className="w-64 min-h-screen p-4 shadow-xl relative z-50"
      style={{ backgroundColor: colors.darkNavy, color: colors.white }}
    >
      {/* Close button for mobile */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg"
          style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center space-x-3 mb-8 p-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.goldenMustard }}>
          <Briefcase className="w-5 h-5" style={{ color: colors.darkNavy }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.gold }}>
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
                  ? "text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              style={router.pathname === link.href ? { backgroundColor: colors.goldenMustard, color: colors.darkNavy } : {}}
              onClick={onClose} // Close sidebar when clicking a link (mobile only)
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="mt-8 pt-6" style={{ borderColor: colors.gray800 }}>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-black rounded-lg transition-all duration-200"
          style={{ color: colors.darkNavy, backgroundColor: colors.goldenMustard }}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
