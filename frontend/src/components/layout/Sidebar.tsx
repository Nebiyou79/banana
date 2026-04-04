// components/layout/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  User,
  Briefcase,
  FileText,
  CheckCircle,
  LogOut,
  Folder,
  Users,
  ClipboardList,
  List,
  Plus,
  Building2,
  Award,
  Shield,
  BarChart3,
  Settings,
  Search,
  Star,
  X,
  Package,
  TrendingUp,
  Package2Icon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';
import Image from "next/image";
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import React from "react";
import { FreeBreakfast } from "@mui/icons-material";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const getNavigationItems = () => {
    const baseItems = [
      {
        href: `/dashboard/${user.role}`,
        label: "Dashboard",
        icon: Home,
        badge: null
      }
    ];

    const roleItems = {
      candidate: [
        { href: "/dashboard/candidate/social", label: "Social Feed", icon: TrendingUp, badge: "New" },
        { href: "/dashboard/candidate/jobs", label: "Find Jobs", icon: Search, badge: "New" },
        { href: "/dashboard/candidate/applications", label: "My Applications", icon: FileText, badge: "5" },
        { href: "/dashboard/candidate/profile", label: "My Profile", icon: User },
        { href: "/dashboard/candidate/saved-jobs", label: "Saved Jobs", icon: Star },
        { href: "/products", label: "Product MarketPlace", icon: Package },
        { href: "/dashboard/candidate/verification", label: "Verification", icon: CheckCircle },
      ],
      freelancer: [
        { href: "/dashboard/freelancer/social", label: "Social Feed", icon: TrendingUp, badge: "New" },
        { href: "/dashboard/freelancer/proposals", label: "My Proposals", icon: FileText, badge: "3" },
        { href: "/dashboard/freelancer/profile", label: "My Profile", icon: User },
        { href: "/dashboard/freelancer/portfolio", label: "Portfolio", icon: Folder },
        { href: "/dashboard/freelancer/tenders", label: "Browse Tenders", icon: ClipboardList },
        { href: "/dashboard/freelancer/tenders/saved", label: "Saved Tenders", icon: BarChart3 },
        { href: "/products", label: "Product MarketPlace", icon: Package },
        { href: "/dashboard/freelancer/verifcation", label: "Verification", icon: CheckCircle },
      ],
      company: [
        { href: "/dashboard/company/social", label: "Social Feed", icon: TrendingUp, badge: "New" },
        { href: "/dashboard/company/tenders", label: "Tender Dashboard", icon: List },
        { href: "/dashboard/company/jobs", label: "Job Postings", icon: Briefcase, badge: "12" },
        { href: "/dashboard/company/jobs/create", label: "Post New Job", icon: Plus },
        { href: "/dashboard/company/applications", label: "Applications", icon: FileText, badge: "24" },
        { href: "/dashboard/company/profile", label: "Company Profile", icon: Building2 },
        { href: "/dashboard/company/freelancer", label: "Freelance MarketPlace", icon: FreeBreakfast },
        { href: "/dashboard/company/products", label: "Company Products", icon: Package },
        { href: "/products", label: "Product MarketPlace", icon: Package2Icon },
        { href: "/dashboard/company/verifcation", label: "Verification", icon: CheckCircle },
      ],
      organization: [
        { href: "/dashboard/organization/social", label: "Social Feed", icon: TrendingUp, badge: "New" },
        { href: "/dashboard/organization/jobs", label: "Job Postings", icon: Briefcase },
        { href: "/dashboard/organization/jobs/create", label: "Create Job", icon: Award },
        { href: "/dashboard/organization/applications", label: "Applications", icon: FileText },
        { href: "/dashboard/organization/tenders", label: "My Tenders", icon: List },
        { href: "/dashboard/organization/tenders/create", label: "Create Tender", icon: Award },
        { href: "/dashboard/organization/bids", label: "Bids", icon: ClipboardList },
        { href: "/dashboard/organization/proposals", label: "Proposals", icon: Award },
        { href: "/dashboard/organization/freelancer", label: "Freelance MarketPlace", icon: FreeBreakfast },
        { href: "/dashboard/organization/profile", label: "Organization Profile", icon: Building2 },
        { href: "/products", label: "Product MarketPlace", icon: Package },
        { href: "/dashboard/organization/verification", label: "Verification", icon: Shield },
      ],
      admin: [
        { href: "/dashboard/admin/social", label: "Platform Feed", icon: TrendingUp },
        { href: "/dashboard/admin/users", label: "User Management", icon: Users, badge: "New" },
        { href: "/dashboard/admin/jobs", label: "Job Management", icon: Briefcase },
        { href: "/dashboard/admin/tenders", label: "Tender Management", icon: ClipboardList },
        { href: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
        { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard/admin/settings", label: "System Settings", icon: Settings },
      ]
    };

    return [...baseItems, ...(roleItems[user.role as keyof typeof roleItems] || [])];
  };

  const navigationItems = getNavigationItems();

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

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      candidate: "Candidate",
      freelancer: "Freelancer",
      company: "Company",
      organization: "Organization",
      admin: "Administrator"
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <div className={`w-80 h-full ${colorClasses.bg.primary} flex flex-col shadow-xl border-r ${colorClasses.border.primary} transition-colors duration-300`}>
      {/* Header */}
      <div className={`p-6 border-b ${colorClasses.border.primary}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Banana"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${colorClasses.text.goldenMustard}`}>Banana</h1>
            </div>
          </div>

          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className={`lg:hidden p-2 rounded-lg ${colorClasses.text.muted} ${colorClasses.bg.surface} hover:${colorClasses.bg.secondary} transition-colors duration-200 focus:ring-2 focus:ring-primary/20`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <div className={`${colorClasses.bg.surface} rounded-xl p-4 border ${colorClasses.border.primary} shadow-sm transition-colors duration-300`}>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${colorClasses.bg.goldenMustard} rounded-xl flex items-center justify-center ${colorClasses.text.inverse} font-semibold shadow-lg`}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${colorClasses.text.primary} truncate`}>{user.name}</p>
              <p className={`${colorClasses.text.muted} text-sm truncate`}>{user.email}</p>
              <div className="flex items-center mt-1 gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
  ${colorClasses.bg.goldenMustard}
  ${colorClasses.text.inverse}
  border ${colorClasses.border.goldenMustard}`}
                >
                  {getRoleDisplayName(user.role)}
                </span>
                {/* Verification Badge - Auto-fetches from API */}
                <VerificationBadge
                  size="sm"
                  showText={true}
                  showTooltip={true}
                  autoFetch={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {navigationItems.map((item) => {
          const isActive = router.pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group border ${isActive
                ? `${colorClasses.bg.goldenMustard} ${colorClasses.text.inverse} border-transparent shadow-md scale-[1.02]`
                : `border-transparent ${colorClasses.text.secondary} hover:${colorClasses.bg.surface} hover:${colorClasses.text.primary} hover:border hover:${colorClasses.border.secondary}`
                }`}
              onClick={onClose}
            >
              <div className="flex items-center space-x-3">
                <div className={`transition-all duration-200 ${isActive
                  ? `${colorClasses.text.inverse} transform scale-110`
                  : `${colorClasses.text.muted} group-hover:${colorClasses.text.primary}`
                  }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isActive
                  ? `${colorClasses.bg.teal} ${colorClasses.text.primary}`
                  : `${colorClasses.bg.goldenMustard} ${colorClasses.text.inverse}`
                  }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t ${colorClasses.border.primary}`}>
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className={`flex items-center justify-center space-x-2 w-full px-4 py-3 ${colorClasses.text.secondary} rounded-xl transition-all duration-200 hover:${colorClasses.bg.surface} hover:${colorClasses.text.error} border border-transparent hover:border hover:${colorClasses.border.secondary} group`}
        >
          <LogOut className={`w-4 h-4 group-hover:${colorClasses.text.error} transition-colors duration-200`} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>

        <div className="mt-3 text-center">
          <p className={`text-xs ${colorClasses.text.muted}`}>
            v2.1.0 • {new Date().getFullYear()} Banana
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;