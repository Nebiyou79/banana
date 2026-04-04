// src/components/tender-dashboard/TenderDashboardLayout.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import TenderSidebar from './TenderSidebar';
import TenderNavbar from './TenderNavbar';
import TenderFooter from './TenderFooter';
import { TenderTopAdBanner, TenderBottomAdBanner, MobileAdStrip, CompanyIndustry } from './TenderAds';
import { toast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { companyService } from '@/services/companyService';

interface TenderDashboardLayoutProps {
  children: React.ReactNode;
  showAds?: boolean;
}

function mapIndustry(raw?: string): CompanyIndustry {
  if (!raw) return 'general';
  const lower = raw.toLowerCase();
  if (lower.includes('construct')) return 'construction';
  if (lower.includes('tech') || lower.includes('software') || lower.includes('it') || lower.includes('digital')) return 'it';
  if (lower.includes('financ') || lower.includes('bank') || lower.includes('insurance')) return 'finance';
  if (lower.includes('health') || lower.includes('pharma') || lower.includes('medical')) return 'healthcare';
  if (lower.includes('agri') || lower.includes('farm') || lower.includes('food')) return 'agriculture';
  if (lower.includes('logistics') || lower.includes('transport') || lower.includes('shipping')) return 'logistics';
  if (lower.includes('educ') || lower.includes('school') || lower.includes('university')) return 'education';
  return 'general';
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className={`min-h-screen flex items-center justify-center ${colorClasses.bg.secondary}`}>
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo placeholder */}
        <div className="relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #F1BB03 0%, #D9A800 100%)',
              animation: 'logoBreath 2s ease-in-out infinite',
            }}
          >
            <span className="text-2xl font-black text-[#0A2540]">B</span>
          </div>
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-40 pointer-events-none"
            style={{
              background: '#F1BB03',
              animation: 'logoBreath 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Spinner */}
        <div
          className="w-8 h-8 rounded-full border-2 border-[#F1BB03]/15 border-t-[#F1BB03]"
          style={{ animation: 'spin 0.7s linear infinite' }}
        />
        <p className={`text-xs font-semibold ${colorClasses.text.muted}`}>
          Loading Tender Center…
        </p>
      </div>

      <style jsx>{`
        @keyframes logoBreath {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function TenderDashboardLayout({ children, showAds = true }: TenderDashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { breakpoint } = useResponsive();

  const isMobile = breakpoint === 'mobile';
  const isDesktop = breakpoint === 'desktop';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyIndustry, setCompanyIndustry] = useState<CompanyIndustry>('general');
  const [pageReady, setPageReady] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'company') {
      toast({ title: 'Access Denied', variant: 'destructive' });
      router.push(`/dashboard/${user?.role}`);
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Close drawer on route change
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [router.pathname, isDesktop]);

  // Auto-close when viewport grows to desktop
  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  // Personalise ads
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'company') return;
    companyService.getMyCompany().then((company) => {
      if (company?.industry) setCompanyIndustry(mapIndustry(company.industry));
    });
  }, [isAuthenticated, user]);

  // Page-ready animation delay
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setPageReady(true), 80);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (isLoading) return <LoadingState />;
  if (!isAuthenticated || user?.role !== 'company') return null;

  return (
    <div className={`min-h-screen ${colorClasses.bg.secondary} transition-colors duration-300`}>

      {/* ── Fixed sidebar — desktop ── */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30 w-72">
        <TenderSidebar />
      </aside>

      {/* ── Off-canvas sidebar — mobile & tablet ── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'rgba(10,37,64,0.55)',
              backdropFilter: 'blur(3px)',
              animation: 'overlayIn 0.22s ease-out both',
            }}
          />
          <div
            className="fixed inset-y-0 left-0 z-50 lg:hidden w-72 max-w-[85vw] shadow-2xl"
            style={{ animation: 'slideInLeft 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
          >
            <TenderSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Fixed navbar ── */}
      <TenderNavbar onMenuToggle={() => setSidebarOpen((o) => !o)} />

      {/* ── Scrollable content area ── */}
      <div
        className="lg:ml-72 pt-16 flex flex-col min-h-screen"
        style={{
          opacity: pageReady ? 1 : 0,
          transform: pageReady ? 'none' : 'translateY(8px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        <main className="flex-1">
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-8 py-5 sm:py-7 lg:py-8">

            {/* ── Ads ── */}
            {showAds && isMobile && <MobileAdStrip industry={companyIndustry} />}
            {showAds && !isMobile && <TenderTopAdBanner industry={companyIndustry} />}

            {/* ── Page content ── */}
            <div
              style={{
                animation: pageReady ? 'contentIn 0.4s ease-out 0.1s both' : 'none',
              }}
            >
              {children}
            </div>

            {/* ── Bottom ad ── */}
            {showAds && (
              <TenderBottomAdBanner industry={companyIndustry} isMobileOverride={isMobile} />
            )}
          </div>
        </main>

        <TenderFooter />
      </div>

      <style jsx global>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes contentIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default TenderDashboardLayout;