// components/social/layout/SocialSidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  TrendingUp,
  MessageCircle,
  Users2,
  LogOut,
  ArrowLeft,
  Star,
  Bell,
  Search,
  BarChart3,
  Settings,
  Shield,
  X,
  Sparkles,
  Zap,
  Edit
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/services/profileService";
import Image from "next/image";
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import React from "react";

interface SocialSidebarProps {
  onClose?: () => void;
  userProfile?: Profile | null;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({ onClose, userProfile }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const getNavigationItems = () => {
    const baseItems = [
      {
        href: `/social/${user.role}`,
        label: "Social Dashboard",
        icon: Home,
      },
    ];

    const roleItems = {
      candidate: [
        { href: "/dashboard/candidate/social", label: "My Feed", icon: TrendingUp, badge: "Hot" },
        { href: "/dashboard/candidate/social/posts", label: "My Posts", icon: MessageCircle },
        { href: "/dashboard/candidate/social/network", label: "My Network", icon: Users2 },
        { href: "/dashboard/candidate/social/profile", label: "Profile", icon: Bell },
        { href: "/dashboard/candidate/social/Edit Profile", label: "Edit Profile", icon: Edit },
      ],
      freelancer: [
        { href: "/dashboard/freelancer/social", label: "My Feed", icon: TrendingUp, badge: "Hot" },
        { href: "/dashboard/freelancer/social/posts", label: "My Posts", icon: MessageCircle },
        { href: "/dashboard/freelancer/social/network", label: "My Network", icon: Users2 },
        { href: "/dashboard/freelancer/social/profile", label: "Profile", icon: Bell },
        { href: "/dashboard/freelancer/social/Edit Profile", label: "Edit Profile", icon: Edit },
      ],
      company: [
        { href: "/dashboard/company/social", label: "Company Feed", icon: TrendingUp, badge: "New" },
        { href: "/dashboard/company/social/posts", label: "Company Posts", icon: MessageCircle },
        { href: "/dashboard/company/social/network", label: "Our Network", icon: Users2 },
        { href: "/dashboard/company/social/profile", label: "Profile", icon: Bell },
        { href: "/dashboard/company/social/Edit Profile", label: "Edit Profile", icon: Edit },
      ],
      organization: [
        { href: "/dashboard/organization/social", label: "Organization Feed", icon: TrendingUp },
        { href: "/dashboard/organization/social/posts", label: "Organization Posts", icon: MessageCircle },
        { href: "/dashboard/organization/social/network", label: "Our Network", icon: Users2 },
        { href: "/dashboard/organization/social/profile", label: "Profile", icon: Bell },
        { href: "/dashboard/organization/social/Edit Profile", label: "Edit Profile", icon: Edit },
      ],
      admin: [
        { href: "/dashboard/admin/social", label: "Platform Feed", icon: TrendingUp },
        { href: "/dashboard/admin/social/moderation", label: "Content Moderation", icon: Shield, badge: "23" },
        { href: "/dashboard/admin/social/analytics", label: "Social Analytics", icon: BarChart3 },
        { href: "/dashboard/admin/social/users", label: "User Activity", icon: Users2 },
        { href: "/dashboard/admin/social/settings", label: "Social Settings", icon: Settings },
      ],
    };

    return [...baseItems, ...(roleItems[user.role as keyof typeof roleItems] || [])];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      router.push("/login");
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleDisplayName = (role: string) => {
    const names = {
      candidate: "Candidate",
      freelancer: "Freelancer",
      company: "Company",
      organization: "Organization",
      admin: "Administrator",
    };
    return names[role as keyof typeof names] || role;
  };

  return (
    <div className="w-80 h-full bg-gradient-to-b from-white to-slate-50/80 backdrop-blur-2xl border-r border-white/30 shadow-2xl flex flex-col relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-amber-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      {/* HEADER */}
      <div className="relative p-6 border-b border-white/30 bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-xl">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="relative z-10 object-contain filter brightness-0 invert"
                />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30" />
            </div>
            <div className="flex flex-col">
              <p className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Banana
              </p>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <p className="text-blue-600 text-xs font-semibold tracking-wider">Social</p>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl bg-white/80 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>

        {/* Back Button */}
        <Link
          href={`/dashboard/${user.role}`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
        >
          <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Back to Main Dashboard</span>
        </Link>

        {/* Enhanced User Card */}
        <div className="mt-4 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden">
                {userProfile?.user.avatar ? (
                  <img
                    src={userProfile.user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate text-lg">{user.name}</p>
              <p className="text-slate-600 text-sm truncate mt-1">{user.email}</p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-lg shadow-lg">
                  {getRoleDisplayName(user.role)}
                </span>
                {/* Verification Badge for Social Sidebar - Auto-fetches from API */}
                <VerificationBadge
                  size="sm"
                  showText={true}
                  showTooltip={true}
                  className="shadow-md"
                  autoFetch={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = router.pathname === item.href;
          const IconComp = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group relative flex items-center justify-between px-4 py-4 rounded-xl border transition-all duration-300 transform hover:scale-105 ${isActive
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/25 border-transparent"
                : "bg-white/80 backdrop-blur-sm text-slate-700 border-white/50 shadow-lg hover:shadow-xl hover:border-white/80"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${isActive
                  ? "bg-white/20"
                  : "bg-slate-100 group-hover:bg-blue-100"
                  }`}>
                  <IconComp
                    className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-white" : "text-slate-600 group-hover:text-blue-600"
                      }`}
                  />
                </div>
                <span className={`font-semibold text-sm transition-colors duration-300 ${isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
                  }`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="relative p-4 border-t border-white/30 bg-gradient-to-t from-white/50 to-transparent">
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 text-red-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
        >
          <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors duration-300">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>

        <div className="flex items-center justify-center gap-2 mt-3">
          <Zap className="w-3 h-3 text-amber-500" />
          <p className="text-xs text-slate-500 text-center">
            Social v2.1.0 • {new Date().getFullYear()} Banana
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialSidebar;