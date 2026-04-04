/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// pages/dashboard/company/tenders/my-tenders/index.tsx
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Plus, Send, FileEdit, Users, RefreshCw } from 'lucide-react';
import { PageStatsBar } from '@/components/tenders2.0/shared/PageStatsBar';
import { PageTabs } from '@/components/tenders2.0/shared/PageTabs';
import ProfessionalTenderCard from '@/components/tenders2.0/ProfessionalTenderCard';
import FreelanceTenderCard from '@/components/tenders2.0/FreelanceTenderCard';
import {
  useMyPostedProfessionalTenders, useDeleteProfessionalTender, usePublishProfessionalTender,
} from '@/hooks/useProfessionalTender';
import {
  useMyPostedFreelanceTenders, useDeleteFreelanceTender, usePublishFreelanceTender,
} from '@/hooks/useFreelanceTender';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className={cn('rounded-2xl border p-4 animate-pulse', colorClasses.bg.primary, colorClasses.border.secondary)}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
      </div>
      <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab, onCreateClick }: { tab: string; onCreateClick: () => void }) {
  const msgs: Record<string, { title: string; sub: string }> = {
    all:          { title: 'No tenders posted yet',     sub: 'Create your first tender to get started.' },
    professional: { title: 'No professional tenders',   sub: 'Post a government or institutional procurement tender.' },
    freelance:    { title: 'No freelance tenders',      sub: 'Post a freelance project to find talent.' },
    published:    { title: 'No published tenders',      sub: 'Publish a draft tender to make it live.' },
    draft:        { title: 'No drafts',                 sub: 'Start creating a tender — it will appear here as a draft.' },
  };
  const msg = msgs[tab] ?? msgs.all;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 sm:py-16 px-4"
    >
      <div
        className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${colors.goldenMustard}18` }}
      >
        <FileText className="h-7 w-7" style={{ color: colors.goldenMustard }} />
      </div>
      <h3 className={cn('text-base sm:text-lg font-bold mb-2', colorClasses.text.primary)}>{msg.title}</h3>
      <p className={cn('text-xs sm:text-sm mb-6 max-w-xs mx-auto', colorClasses.text.muted)}>{msg.sub}</p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 min-h-[44px]"
        style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}
      >
        <Plus className="h-4 w-4" />
        Create Tender
      </button>
    </motion.div>
  );
}

// ─── Page header (dark banner) — MOBILE FIXED ────────────────────────────────
function PageHeader({ stats, onRefresh, isLoading, onCreateClick }: {
  stats: { total: number; published: number; draft: number; bids: number };
  onRefresh: () => void;
  isLoading: boolean;
  onCreateClick: () => void;
}) {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(135deg, #0A2540 0%, #1a3a5c 60%, #0A2540 100%)' }}
    >
      {/* Subtle orb — smaller on mobile */}
      <div
        className="absolute top-0 right-0 rounded-full blur-3xl pointer-events-none"
        style={{
          width: isMobile ? 120 : 220,
          height: isMobile ? 120 : 220,
          backgroundColor: `${colors.goldenMustard}12`,
          transform: 'translate(30%,-30%)',
        }}
      />
      {/* Gold accent bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colors.goldenMustard }} />

      <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-6">
        {/* Row 1: icon + title + refresh */}
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="p-2 sm:p-2.5 rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${colors.goldenMustard}25` }}
            >
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: colors.goldenMustard }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-white leading-tight truncate">
                My Tenders
              </h1>
              <p className="text-white/55 text-xs mt-0.5 leading-snug hidden sm:block">
                Manage and track your procurement postings
              </p>
            </div>
          </div>

          {/* Refresh — icon only on mobile */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 min-h-[36px]"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Row 2: stat badges (wrappable) + CTA */}
        <div className="flex items-center justify-between gap-3">
          {/* Stat pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'total',     value: stats.total },
              { label: 'live',      value: stats.published },
              { label: 'draft',     value: stats.draft },
              { label: 'bids',      value: stats.bids },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/15"
                style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
              >
                <span className="font-black text-white text-xs sm:text-sm">{s.value}</span>
                <span className="text-white/50 text-[10px] sm:text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Create CTA */}
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex-shrink-0 min-h-[36px] sm:min-h-[44px]"
            style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Create</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <h2 className={cn('text-xs sm:text-sm font-bold', colorClasses.text.primary)}>{label}</h2>
      <span
        className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {count}
      </span>
      <div className={cn('flex-1 h-px border-t', colorClasses.border.secondary)} />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function PaginationBar({ pagination, isLoading, onPageChange }: {
  pagination: any; isLoading: boolean; onPageChange: (p: number) => void;
}) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className={cn('flex items-center justify-between pt-4 border-t gap-3', colorClasses.border.secondary)}>
      <p className={cn('text-xs', colorClasses.text.muted)}>
        {pagination.page}/{pagination.pages} · {pagination.total} total
      </p>
      <div className="flex items-center gap-1">
        {[
          { label: '«', to: 1,               dis: pagination.page <= 1 },
          { label: '‹', to: pagination.page - 1, dis: pagination.page <= 1 },
          { label: '›', to: pagination.page + 1, dis: pagination.page >= pagination.pages },
          { label: '»', to: pagination.pages,    dis: pagination.page >= pagination.pages },
        ].map(({ label, to, dis }) => (
          <button
            key={label}
            disabled={dis || isLoading}
            onClick={() => onPageChange(to)}
            className={cn(
              'h-8 w-8 rounded-lg border flex items-center justify-center text-sm font-medium transition-all',
              colorClasses.border.secondary, colorClasses.text.primary,
              'disabled:opacity-30 hover:enabled:bg-[#F1BB03]/10',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'all',          label: 'All',          tint: 'navy'    as const },
  { id: 'professional', label: 'Professional', tint: 'blue'    as const },
  { id: 'freelance',    label: 'Freelance',    tint: 'teal'    as const },
  { id: 'published',    label: 'Published',    tint: 'emerald' as const },
  { id: 'draft',        label: 'Draft',        tint: 'amber'   as const },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompanyMyTendersPage() {
  const router   = useRouter();
  const { toast }  = useToast();
  const { user }   = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [profPage, setProfPage]   = useState(1);
  const [freePage, setFreePage]   = useState(1);

  const profStatus = activeTab === 'published' ? 'published' : activeTab === 'draft' ? 'draft' : undefined;
  const freeStatus = activeTab === 'published' ? 'published' : activeTab === 'draft' ? 'draft' : undefined;

  const { data: profData, isLoading: profLoading, refetch: refetchProf } =
    useMyPostedProfessionalTenders({ status: profStatus, page: profPage, limit: 12 });
  const { data: freeData, isLoading: freeLoading, refetch: refetchFree } =
    useMyPostedFreelanceTenders({ status: freeStatus, page: freePage, limit: 12 });

  const { mutate: deleteProfTender } = useDeleteProfessionalTender();
  const { mutate: deleteFreeTender } = useDeleteFreelanceTender();
  const { mutate: publishFreeTender } = usePublishFreelanceTender();

  const profTenders    = (profData as any)?.tenders     ?? [];
  const freeTenders    = (freeData as any)?.tenders     ?? [];
  const profPagination = (profData as any)?.pagination;
  const freePagination = (freeData as any)?.pagination;

  const statsData = useMemo(() => {
    const published = [
      ...profTenders.filter((t: any) => ['published','active','locked'].includes(t.status)),
      ...freeTenders.filter((t: any) => t.status === 'published'),
    ].length;
    const draft = [
      ...profTenders.filter((t: any) => t.status === 'draft'),
      ...freeTenders.filter((t: any) => t.status === 'draft'),
    ].length;
    const bids =
      profTenders.reduce((s: number, t: any) => s + (t.bidCount ?? 0), 0) +
      freeTenders.reduce((s: number, t: any) => s + (t.applicationCount ?? 0), 0);
    return {
      total: (profPagination?.total ?? 0) + (freePagination?.total ?? 0),
      published, draft, bids,
    };
  }, [profTenders, freeTenders, profPagination, freePagination]);

  const tabsWithCounts = TABS.map((t) => {
    if (t.id === 'professional') return { ...t, count: profPagination?.total ?? 0 };
    if (t.id === 'freelance')    return { ...t, count: freePagination?.total ?? 0 };
    if (t.id === 'published')    return { ...t, count: statsData.published };
    if (t.id === 'draft')        return { ...t, count: statsData.draft };
    return t;
  });

  const showProf    = ['all','professional','published','draft'].includes(activeTab);
  const showFree    = ['all','freelance','published','draft'].includes(activeTab);
  const displayProf = showProf ? profTenders : [];
  const displayFree = showFree ? freeTenders : [];
  const isLoading   = (showProf && profLoading) || (showFree && freeLoading);
  const isEmpty     = !isLoading && displayProf.length === 0 && displayFree.length === 0;

  const handleView      = useCallback((id: string) => router.push(`/dashboard/company/tenders/my-tenders/${id}`), [router]);
  const handleEdit      = useCallback((id: string) => router.push(`/dashboard/company/tenders/my-tenders/${id}/edit`), [router]);
  const handleCreate    = useCallback(() => router.push('/dashboard/company/tenders/my-tenders/create'), [router]);
  const handleTabChange = useCallback((id: string) => { setActiveTab(id); setProfPage(1); setFreePage(1); }, []);
  const handleRefresh   = useCallback(() => { refetchProf(); refetchFree(); }, [refetchProf, refetchFree]);

  const handleDeleteProf = useCallback((id: string) => {
    deleteProfTender(id, { onSuccess: () => toast({ title: 'Deleted', variant: 'success' }) });
  }, [deleteProfTender, toast]);

  const handleDeleteFree = useCallback((id: string) => {
    deleteFreeTender(id, { onSuccess: () => toast({ title: 'Deleted', variant: 'success' }) });
  }, [deleteFreeTender, toast]);

  const handlePublishFree = useCallback((id: string) => {
    publishFreeTender(id, { onSuccess: () => toast({ title: 'Published!', variant: 'success' }) });
  }, [publishFreeTender, toast]);

  const statsBarData = [
    { label: 'Total Posted', value: statsData.total,     subValue: 'All time',    colorScheme: 'blue'    as const, icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: 'Published',    value: statsData.published, subValue: 'Live now',    colorScheme: 'emerald' as const, icon: <Send    className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: 'Draft',        value: statsData.draft,     subValue: 'Unpublished', colorScheme: 'amber'   as const, icon: <FileEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: 'Total Bids',   value: statsData.bids,      subValue: 'Received',    colorScheme: 'purple'  as const, icon: <Users   className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <TenderDashboardLayout>
      {/*
       * KEY FIX: No extra px/py here — TenderDashboardLayout already
       * applies px-3 sm:px-5 lg:px-8 and py-4 sm:py-6 lg:py-8.
       * Adding another wrapper with padding was doubling the gutters on mobile.
       */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">

        <PageHeader
          stats={statsData}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          onCreateClick={handleCreate}
        />

        {/* Stats bar — 2×2 on mobile, 4-col on sm+ */}
        <PageStatsBar stats={statsBarData} isLoading={isLoading && statsData.total === 0} />

        {/* Tabs — always horizontally scrollable */}
        <PageTabs tabs={tabsWithCounts} activeTab={activeTab} onChange={handleTabChange} />

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : isEmpty ? (
          <EmptyState tab={activeTab} onCreateClick={handleCreate} />
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {showProf && displayProf.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <SectionLabel
                    label="Professional Tenders"
                    count={profPagination?.total ?? displayProf.length}
                    color="#3B82F6"
                  />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {displayProf.map((tender: any) => (
                    <ProfessionalTenderCard
                      key={tender._id}
                      tender={tender}
                      viewerRole="company"
                      viewerId={user?._id}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDeleteProf}
                      onAddendum={(id) => router.push(`/dashboard/company/tenders/tenders/${id}/addendum`)}
                    />
                  ))}
                </div>
                {activeTab === 'professional' && (
                  <div className="mt-3">
                    <PaginationBar
                      pagination={profPagination}
                      isLoading={profLoading}
                      onPageChange={(p) => { setProfPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    />
                  </div>
                )}
              </div>
            )}

            {showFree && displayFree.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <SectionLabel
                    label="Freelance Tenders"
                    count={freePagination?.total ?? displayFree.length}
                    color="#14B8A6"
                  />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {displayFree.map((tender: any) => (
                    <FreelanceTenderCard
                      key={tender._id}
                      tender={tender}
                      viewerRole="company"
                      viewerId={user?._id}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDeleteFree}
                      onPublish={handlePublishFree}
                    />
                  ))}
                </div>
                {activeTab === 'freelance' && (
                  <div className="mt-3">
                    <PaginationBar
                      pagination={freePagination}
                      isLoading={freeLoading}
                      onPageChange={(p) => { setFreePage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
}