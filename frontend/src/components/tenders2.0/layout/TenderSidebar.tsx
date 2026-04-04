// src/components/tender-dashboard/TenderSidebar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Search,
  FileText,
  Inbox,
  LogOut,
  X,
  ChevronRight,
  Award,
  Briefcase,
  ArrowLeft,
  Plus,
  Building2,
  Zap,
  Sparkles,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import VerificationBadge from '@/components/verifcation/VerificationBadge';

interface TenderSidebarProps {
  onClose?: () => void;
}

const navItems = [
  {
    href: '/dashboard/company/tenders',
    label: 'Tender Overview',
    icon: LayoutDashboard,
    description: 'Stats & summary',
    exact: true,
  },
  {
    href: '/dashboard/company/tenders/my-tenders',
    label: 'My Tenders',
    icon: ClipboardList,
    description: 'Tenders you posted',
  },
  {
    href: '/dashboard/company/tenders/my-tenders/create',
    label: 'Create Tender',
    icon: Plus,
    description: 'Post a new tender',
    highlight: true,
  },
  {
    href: '/dashboard/company/tenders/tenders',
    label: 'Browse Tenders',
    icon: Search,
    description: 'Find opportunities',
  },
  {
    href: '/dashboard/company/tenders/bids',
    label: 'Incoming Bids',
    icon: Inbox,
    description: 'Bids on your tenders',
    badge: '5',
  },
  {
    href: '/dashboard/company/tenders/my-bids',
    label: 'My Bids',
    icon: Briefcase,
    description: 'Bids you submitted',
  },
  {
    href: '/dashboard/company/tenders/proposals',
    label: 'Proposals',
    icon: FileText,
    description: 'Freelancer proposals',
  },
];

const TenderSidebar: React.FC<TenderSidebarProps> = ({ onClose }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out' });
      router.push('/login');
    } catch {
      toast({ title: 'Logout Error', variant: 'destructive' });
    }
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return router.pathname === href;
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  if (!user) return null;

  return (
    <div
      className={`w-72 h-full flex flex-col ${colorClasses.bg.primary} overflow-hidden relative`}
      style={{ borderRight: '1px solid rgba(241,187,3,0.12)' }}
    >
      {/* Subtle gradient overlay — matches SocialSidebar */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(241,187,3,0.03) 0%, transparent 30%)',
        }}
      />

      {/* ── Brand header ── */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{ borderBottom: '1px solid rgba(241,187,3,0.10)' }}
      >
        {/* Back link + close */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/dashboard/company"
            onClick={onClose}
            className={`flex items-center gap-1.5 text-xs font-medium ${colorClasses.text.muted} hover:text-[#F1BB03] transition-all duration-200 group`}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Main Dashboard
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className={`lg:hidden w-7 h-7 flex items-center justify-center rounded-lg ${colorClasses.text.muted} hover:text-[#F1BB03] hover:bg-[#F1BB03]/10 transition-all duration-200`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Logo wordmark */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative shrink-0">
            {/* Logo glow */}
            <div
              className="absolute -inset-1 rounded-2xl blur opacity-25 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #F1BB03, #D9A800)' }}
            />
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)' }}
            >
              <Image src="/logo.png" alt="Banana" width={40} height={40} className="object-contain filter brightness-0" />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center shadow-md"
              style={{ backgroundColor: '#0A2540' }}
            >
              <Award className="w-3 h-3 text-[#F1BB03]" />
            </div>
          </div>
          <div className="leading-none">
            <h2 className="text-lg font-black text-[#F1BB03] tracking-widest uppercase">Banana</h2>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5 text-[#F1BB03]/60" />
              <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${colorClasses.text.muted}`}>
                Tender Center
              </p>
            </div>
          </div>
        </div>

        {/* ── User profile card — mirrors SocialSidebar style ── */}
        <button
          onClick={() => { router.push('/dashboard/company/profile'); onClose?.(); }}
          className={`
            w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left
            ${colorClasses.bg.surface}
            transition-all duration-300 group hover:scale-[1.01] hover:shadow-md
          `}
          style={{ border: '1px solid rgba(241,187,3,0.15)' }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)', color: '#0A2540' }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? 'C'}
            </div>
            {/* Online dot */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ backgroundColor: '#10B981', borderColor: 'white' }}
            />
            {/* Glow */}
            <div
              className="absolute -inset-1 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #F1BB03, #D9A800)' }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${colorClasses.text.primary} truncate leading-tight`}>
              {user?.name}
            </p>
            <p className={`text-[10px] truncate mt-0.5 ${colorClasses.text.muted}`}>
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md shadow-sm"
                style={{ background: 'rgba(241,187,3,0.15)', color: '#F1BB03' }}
              >
                Company
              </span>
              {mounted && (
                <VerificationBadge
                  size="sm"
                  showText={true}
                  showTooltip={true}
                  autoFetch={true}
                />
              )}
            </div>
          </div>

          <ChevronRight
            className={`w-3.5 h-3.5 ${colorClasses.text.muted} opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mt-1`}
          />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#F1BB03]/20">
        <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${colorClasses.text.muted} px-3 mb-3 opacity-50`}>
          Navigation
        </p>

        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          const hovered = hoveredItem === item.href;

          if (item.highlight && !active) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group hover:scale-[1.01]"
                style={{
                  border: '1px solid rgba(241,187,3,0.25)',
                  background: hovered ? 'rgba(241,187,3,0.08)' : 'rgba(241,187,3,0.04)',
                  color: '#B8860B',
                  boxShadow: hovered ? '0 4px 12px rgba(241,187,3,0.10)' : 'none',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: 'rgba(241,187,3,0.15)', color: '#F1BB03' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-none truncate dark:text-[#F1BB03]">{item.label}</p>
                  <p className={`text-[10px] mt-0.5 truncate font-medium ${colorClasses.text.muted}`}>{item.description}</p>
                </div>
                <Plus className="w-3.5 h-3.5 opacity-50" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group"
              style={{
                background: active
                  ? 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)'
                  : hovered
                    ? 'rgba(241,187,3,0.06)'
                    : 'transparent',
                border: active
                  ? '1px solid rgba(241,187,3,0.4)'
                  : '1px solid transparent',
                color: active ? '#0A2540' : undefined,
                transform: active ? 'translateX(4px)' : hovered ? 'translateX(2px)' : 'none',
                boxShadow: active ? '0 4px 14px rgba(241,187,3,0.3)' : 'none',
              }}
            >
              {/* Active left indicator */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ background: '#0A2540', opacity: 0.3 }}
                />
              )}

              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`}
                style={{
                  background: active
                    ? 'rgba(10,37,64,0.12)'
                    : hovered
                      ? 'rgba(241,187,3,0.12)'
                      : 'rgba(241,187,3,0.08)',
                }}
              >
                <Icon
                  className="w-3.5 h-3.5 transition-colors duration-200"
                  style={{
                    color: active ? '#0A2540' : hovered ? '#F1BB03' : undefined,
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none truncate ${active ? 'text-[#0A2540]' : colorClasses.text.primary}`}>
                  {item.label}
                </p>
                <p
                  className="text-[10px] mt-0.5 truncate font-medium"
                  style={{ color: active ? 'rgba(10,37,64,0.55)' : undefined }}
                >
                  {!active && <span className={colorClasses.text.muted}>{item.description}</span>}
                  {active && item.description}
                </p>
              </div>

              {item.badge && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 transition-all duration-200"
                  style={{
                    background: active ? 'rgba(10,37,64,0.12)' : 'rgba(241,187,3,0.15)',
                    color: active ? '#0A2540' : '#F1BB03',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div
        className="relative px-3 pb-4 pt-3"
        style={{ borderTop: '1px solid rgba(241,187,3,0.10)' }}
      >
        <Link
          href="/dashboard/company/profile"
          onClick={onClose}
          className={`
            flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1
            text-xs font-medium ${colorClasses.text.secondary}
            hover:bg-[#F1BB03]/8 hover:text-[#F1BB03]
            transition-all duration-200 group
          `}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
          Company Settings
        </Link>

        <button
          onClick={handleLogout}
          className={`
            flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl
            text-xs font-medium ${colorClasses.text.muted}
            hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500
            transition-all duration-200 group
          `}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
          Sign Out
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Zap className="w-2.5 h-2.5 text-[#F1BB03]/50" />
          <p className={`text-[10px] ${colorClasses.text.muted} opacity-50`}>
            Tender Center v2.1 · {new Date().getFullYear()} Banana
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenderSidebar;