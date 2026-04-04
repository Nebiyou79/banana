// src/components/tender-dashboard/TenderNavbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Award,
  Search,
  X,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface TenderNavbarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

const breadcrumbMap: Record<string, string> = {
  '/dashboard/company/tenders': 'Overview',
  '/dashboard/company/tenders/my-tenders': 'My Tenders',
  '/dashboard/company/tenders/my-tenders/create': 'Create Tender',
  '/dashboard/company/tenders/tenders': 'Browse Tenders',
  '/dashboard/company/tenders/bids': 'Incoming Bids',
  '/dashboard/company/tenders/my-bids': 'My Bids',
  '/dashboard/company/tenders/proposals': 'Proposals',
};

const mockNotifications = [
  { icon: '📋', title: 'New bid received', sub: 'Bid on "IT Infrastructure" tender', time: '2m ago', unread: true },
  { icon: '✅', title: 'Tender approved', sub: 'Construction Supply Q2 2025', time: '1h ago', unread: true },
  { icon: '💬', title: 'Proposal updated', sub: 'UI/UX Design proposal reviewed', time: '3h ago', unread: false },
];

export default function TenderNavbar({ onMenuToggle, pageTitle }: TenderNavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(2);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentPage = breadcrumbMap[router.pathname] ?? pageTitle ?? 'Tender Center';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    window.addEventListener('scroll', onScroll);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out' });
      router.push('/login');
    } catch {
      toast({ title: 'Logout Error', variant: 'destructive' });
    }
  };

  const handleNotifOpen = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) setNotifCount(0);
  };

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-20 h-16 flex items-center',
        'transition-all duration-300 ease-out lg:pl-72',
        colorClasses.bg.primary,
      ].join(' ')}
      style={{
        borderBottom: '1px solid rgba(241,187,3,0.10)',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Mobile brand section ── */}
      <div
        className="lg:hidden flex items-center gap-3 pl-4 pr-3 h-full shrink-0"
        style={{ borderRight: '1px solid rgba(241,187,3,0.12)' }}
      >
        {/* Logo with glow */}
        <div className="relative">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)' }}
          >
            <Image src="/logo.png" alt="Banana" width={34} height={34} className="object-contain filter brightness-0" />
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md flex items-center justify-center"
            style={{ backgroundColor: '#0A2540' }}
          >
            <Award className="w-2.5 h-2.5 text-[#F1BB03]" />
          </div>
        </div>
        <div className="leading-none">
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-[#F1BB03] tracking-widest uppercase">Banana</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Sparkles className="w-2 h-2 text-[#F1BB03]/50" />
            <span className={`text-[9px] font-semibold tracking-[0.18em] uppercase ${colorClasses.text.muted}`}>
              Tender Center
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full px-3 sm:px-5">
        {/* ── Left: hamburger + breadcrumb ── */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className={`
              lg:hidden flex items-center justify-center w-9 h-9 rounded-xl
              ${colorClasses.bg.surface} ${colorClasses.text.muted}
              hover:bg-[#F1BB03]/10 hover:text-[#F1BB03]
              border ${colorClasses.border.secondary} hover:border-[#F1BB03]/30
              transition-all duration-200 hover:scale-105 active:scale-95
            `}
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb — desktop */}
          <nav className="hidden sm:flex items-center gap-2">
            <Link
              href="/dashboard/company/tenders"
              className={`text-xs font-semibold ${colorClasses.text.muted} hover:text-[#F1BB03] transition-colors duration-150 flex items-center gap-1.5`}
            >
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(241,187,3,0.12)' }}
              >
                <Award className="w-3 h-3 text-[#F1BB03]" />
              </div>
              Banana Tender
            </Link>
            <span className={`text-xs ${colorClasses.text.muted} select-none opacity-40`}>/</span>
            <span className={`text-sm font-bold ${colorClasses.text.primary}`}>{currentPage}</span>
          </nav>

          {/* Mobile — current page only */}
          <div className="flex sm:hidden items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: '#F1BB03' }}
            >
              <Award className="w-3 h-3 text-[#0A2540]" />
            </div>
            <span className={`text-sm font-semibold ${colorClasses.text.primary}`}>{currentPage}</span>
          </div>
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Search pill — md+ */}
          <Link
            href="/dashboard/company/tenders/tenders"
            className={`
              hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full
              text-xs ${colorClasses.bg.surface} ${colorClasses.text.muted}
              border ${colorClasses.border.secondary}
              hover:border-[#F1BB03]/40 hover:text-[#F1BB03] hover:bg-[#F1BB03]/5
              transition-all duration-200 group
            `}
          >
            <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />
            <span className="hidden lg:inline">Browse tenders…</span>
            <kbd className="hidden lg:inline text-[10px] bg-[#F1BB03]/12 text-[#F1BB03] px-1.5 py-0.5 rounded-md font-mono leading-none">
              ⌘K
            </kbd>
          </Link>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={handleNotifOpen}
              className={`
                relative flex items-center justify-center w-9 h-9 rounded-xl
                ${colorClasses.bg.surface} ${colorClasses.text.muted}
                hover:bg-[#F1BB03]/10 hover:text-[#F1BB03]
                border ${colorClasses.border.secondary} hover:border-[#F1BB03]/30
                transition-all duration-200 hover:scale-105 active:scale-95
              `}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{
                    background: '#F1BB03',
                    boxShadow: '0 0 0 2px white',
                    animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                  }}
                />
              )}
            </button>

            {notifOpen && (
              <div
                className={`
                  absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50
                  ${colorClasses.bg.primary}
                  shadow-2xl
                `}
                style={{
                  border: '1px solid rgba(241,187,3,0.15)',
                  animation: 'slideDown 0.18s cubic-bezier(0.25,0.46,0.45,0.94) both',
                }}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3`}
                  style={{ borderBottom: '1px solid rgba(241,187,3,0.10)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(241,187,3,0.12)' }}
                    >
                      <Bell className="w-3 h-3 text-[#F1BB03]" />
                    </div>
                    <p className={`text-xs font-bold ${colorClasses.text.primary}`}>Notifications</p>
                    {notifCount > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(241,187,3,0.15)', color: '#F1BB03' }}
                      >
                        {notifCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className={`w-6 h-6 flex items-center justify-center rounded-lg ${colorClasses.text.muted} hover:text-[#F1BB03] hover:bg-[#F1BB03]/10 transition-all`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  {mockNotifications.map((n, i) => (
                    <div
                      key={i}
                      className={`
                        flex items-start gap-3 px-4 py-3 cursor-pointer
                        hover:bg-[#F1BB03]/4
                        transition-colors duration-150
                      `}
                      style={{
                        background: n.unread ? 'rgba(241,187,3,0.03)' : 'transparent',
                        borderBottom: i < mockNotifications.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <div className="relative mt-0.5">
                        <span className="text-base">{n.icon}</span>
                        {n.unread && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                            style={{ background: '#F1BB03' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${colorClasses.text.primary} truncate`}>{n.title}</p>
                        <p className={`text-[11px] ${colorClasses.text.muted} truncate mt-0.5 leading-snug`}>{n.sub}</p>
                      </div>
                      <span className={`text-[10px] ${colorClasses.text.muted} whitespace-nowrap mt-0.5`}>{n.time}</span>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2.5">
                  <button className="w-full text-xs text-[#F1BB03] font-bold hover:underline text-center block py-0.5 transition-opacity hover:opacity-80">
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`
                flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl
                ${colorClasses.bg.surface}
                hover:bg-[#F1BB03]/8
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              `}
              style={{
                border: dropdownOpen ? '1px solid rgba(241,187,3,0.40)' : '1px solid rgba(241,187,3,0.15)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shadow-sm"
                style={{ background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)', color: '#0A2540' }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? 'C'}
              </div>
              <div className="hidden sm:block text-left">
                <p className={`text-xs font-semibold ${colorClasses.text.primary} max-w-[80px] truncate leading-tight`}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p className={`text-[10px] ${colorClasses.text.muted} leading-tight`}>Company</p>
              </div>
              <ChevronDown
                className={`w-3 h-3 ${colorClasses.text.muted} transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div
                className={`
                  absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden z-50
                  ${colorClasses.bg.primary}
                  shadow-2xl
                `}
                style={{
                  border: '1px solid rgba(241,187,3,0.15)',
                  animation: 'slideDown 0.18s cubic-bezier(0.25,0.46,0.45,0.94) both',
                }}
              >
                {/* User info header */}
                <div
                  className="px-4 py-4"
                  style={{ borderBottom: '1px solid rgba(241,187,3,0.10)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-md"
                        style={{ background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)', color: '#0A2540' }}
                      >
                        {user?.name?.charAt(0).toUpperCase() ?? 'C'}
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                        style={{ background: '#10B981' }}
                      >
                        <CheckCircle className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${colorClasses.text.primary} truncate`}>{user?.name}</p>
                      <p className={`text-[11px] ${colorClasses.text.muted} truncate`}>{user?.email}</p>
                      <span
                        className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1"
                        style={{ background: 'rgba(241,187,3,0.12)', color: '#F1BB03' }}
                      >
                        Company Account
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nav links */}
                <div className="p-1.5 space-y-0.5">
                  {[
                    { href: '/dashboard/company', icon: LayoutDashboard, label: 'Main Dashboard' },
                    { href: '/dashboard/company/profile', icon: User, label: 'Company Profile' },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDropdownOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                        text-xs font-medium ${colorClasses.text.secondary}
                        hover:bg-[#F1BB03]/8 hover:text-[#F1BB03]
                        transition-all duration-150 group
                      `}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150"
                        style={{ background: 'rgba(241,187,3,0.10)' }}
                      >
                        <Icon className="w-3.5 h-3.5 text-[#F1BB03]" />
                      </div>
                      {label}
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <div
                  className="p-1.5"
                  style={{ borderTop: '1px solid rgba(241,187,3,0.08)' }}
                >
                  <button
                    onClick={handleLogout}
                    className={`
                      flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl
                      text-xs font-medium ${colorClasses.text.muted}
                      hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500
                      transition-all duration-150 group
                    `}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-900/20 group-hover:scale-110 transition-transform duration-150">
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}