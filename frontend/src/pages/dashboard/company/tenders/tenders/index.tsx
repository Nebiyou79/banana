/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/tenders/index.tsx
// Original polished design preserved (PageTabs, PageStatsBar, ProfessionalTenderCard, FilterBar)
// FIX 3: Invitations tab uses InvitedTenderCard — built-in Accept/Decline, declined locked out
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';
import {
  useProfessionalTenders,
  useSavedProfessionalTenders,
  useToggleSaveProfessionalTender,
  useMyInvitations,
  useProfessionalTenderCategories,
} from '@/hooks/useProfessionalTender';
import type { ProfessionalTenderFilters } from '@/types/tender.types';
import {
  Building2, Briefcase, Banknote, Bookmark, Zap, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses, colors } from '@/utils/color';
import { PageTabs } from '@/components/tenders2.0/shared/PageTabs';
import type { Tab } from '@/components/tenders2.0/shared/PageTabs';
import { PageStatsBar } from '@/components/tenders2.0/shared/PageStatsBar';
import ProfessionalTenderCard from '@/components/tenders2.0/ProfessionalTenderCard';
import { FilterBar } from '@/components/tenders2.0/shared/FilterBar';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';
import InvitedTenderCard, { type InvitedTenderCardItem } from '@/components/tenders2.0/InvitedtenderCard';

const TABS: Tab[] = [
  { id: 'browse',      label: 'Browse',      tint: 'blue'  },
  { id: 'invitations', label: 'Invitations', tint: 'teal'  },
  { id: 'saved',       label: 'Saved',       tint: 'amber' },
];

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={cn('rounded-2xl border p-4 animate-pulse', colorClasses.border.secondary, colorClasses.bg.primary)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InvitationSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={cn('rounded-2xl border p-5 animate-pulse', colorClasses.border.secondary, colorClasses.bg.primary)}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="flex gap-3">
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-32" />
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BrowsePageHeader({ total, newThisWeek, isLoading, onRefresh }: {
  total: number; newThisWeek: number; isLoading: boolean; onRefresh: () => void;
}) {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  return (
    <div className="relative overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(135deg, #0A2540 0%, #1a3a5c 60%, #0A2540 100%)' }}>
      <div className="absolute top-0 right-0 rounded-full blur-3xl pointer-events-none"
        style={{ width: isMobile ? 100 : 200, height: isMobile ? 100 : 200, backgroundColor: `${colors.blue}15`, transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/60" />
      <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(74,166,255,0.2)' }}>
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight">Professional Tenders</h1>
              <p className="text-white/50 text-xs mt-0.5 hidden sm:block">High-value procurement from government & institutions</p>
            </div>
          </div>
          <button onClick={onRefresh} disabled={isLoading}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
            aria-label="Refresh">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[{ label: 'opportunities', value: total }, { label: 'new this week', value: newThisWeek }].map((s) => (
            <div key={s.label} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/15"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
              <span className="font-black text-white text-xs sm:text-sm">{s.value}</span>
              <span className="text-white/50 text-[10px] sm:text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaginationBar({ pagination, onPageChange, isLoading }: {
  pagination: { page: number; pages: number; total?: number; limit: number };
  onPageChange: (p: number) => void; isLoading: boolean;
}) {
  const { page, pages } = pagination;
  return (
    <div className={cn('flex items-center justify-between pt-4 border-t gap-3', colorClasses.border.secondary)}>
      <span className={cn('text-xs', colorClasses.text.muted)}>
        Page {page} of {pages}{pagination.total ? ` · ${pagination.total} total` : ''}
      </span>
      <div className="flex items-center gap-1">
        {[
          { icon: <ChevronsLeft className="h-3.5 w-3.5" />,  onClick: () => onPageChange(1),        disabled: page === 1 },
          { icon: <ChevronLeft  className="h-3.5 w-3.5" />,  onClick: () => onPageChange(page - 1), disabled: page === 1 },
          { icon: <ChevronRight className="h-3.5 w-3.5" />,  onClick: () => onPageChange(page + 1), disabled: page === pages },
          { icon: <ChevronsRight className="h-3.5 w-3.5" />, onClick: () => onPageChange(pages),    disabled: page === pages },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} disabled={btn.disabled || isLoading}
            className={cn('h-8 w-8 flex items-center justify-center rounded-lg border transition-colors',
              colorClasses.border.secondary, colorClasses.text.primary,
              'disabled:opacity-40 hover:enabled:bg-[#F1BB03]/10')}>
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CompanyBrowseTendersPage() {
  const router    = useRouter();
  const { toast } = useToast();
  const { user }  = useAuth();

  const [activeTab, setActiveTab] = useState<'browse' | 'invitations' | 'saved'>('browse');
  const [filters, setFilters] = useState<ProfessionalTenderFilters>({
    page: 1, limit: 15, status: 'published', sortBy: 'createdAt', sortOrder: 'desc',
  });
  const [inviteStatusFilter, setInviteStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  const { data, isLoading, refetch }                               = useProfessionalTenders(filters);
  const { data: savedData,       isLoading: isLoadingSaved }       = useSavedProfessionalTenders();
  const { data: invitationsData, isLoading: isLoadingInvitations } = useMyInvitations({
    status: inviteStatusFilter === 'all' ? undefined : inviteStatusFilter,
  });
  const { data: categories } = useProfessionalTenderCategories();
  useToggleSaveProfessionalTender(); // keep the mutation available for ProfessionalTenderCard internal usage

  const tenders        = data?.tenders ?? [];
  const pagination     = data?.pagination;
  const savedTenders   = savedData?.tenders ?? [];
  const rawInvitations = invitationsData?.invitations ?? [];

  // FIX 3: normalise invitation shape → InvitedTenderCardItem
  const invitations: InvitedTenderCardItem[] = rawInvitations.map((inv: any) => {
    const tender = inv.tender ?? inv;
    return {
      _id:            tender._id ?? inv.tenderId,
      title:          tender.title ?? '—',
      referenceNumber:tender.professionalSpecific?.referenceNumber ?? tender.referenceNumber,
      deadline:       tender.deadline ?? tender.submissionDeadline ?? new Date().toISOString(),
      status:         tender.status ?? 'published',
      visibilityType: tender.visibilityType ?? tender.visibility?.visibilityType ?? 'invite_only',
      workflowType:   tender.workflowType ?? 'open',
      owner:          tender.owner ?? { _id: '', name: '—', email: '' },
      myInvitations:  inv.myInvitations ?? [{
        _id:              inv._id,
        invitationStatus: inv.invitationStatus ?? 'pending',
        invitationType:   inv.invitationType ?? 'company',
        message:          inv.message,
        tokenExpires:     inv.tokenExpires ?? new Date().toISOString(),
        respondedAt:      inv.respondedAt,
      }],
    };
  });

  const pendingCount = invitations.filter(i => i.myInvitations?.[0]?.invitationStatus === 'pending').length;

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : (value as number) }));
  }, []);
  const handleClearAll = useCallback(() => {
    setFilters({ page: 1, limit: 15, status: 'published', sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const handleView = useCallback((id: string) => router.push(`/dashboard/company/tenders/tenders/${id}`), [router]);
  const handleRefresh = useCallback(() => { refetch(); toast({ title: 'Refreshed', variant: 'success' }); }, [refetch, toast]);

  const insights = useMemo(() => ({
    total:       pagination?.total ?? 0,
    newThisWeek: Math.floor((pagination?.total ?? 0) * 0.3),
    cpoCount:    tenders.filter((t: any) => t.cpoRequired).length,
  }), [tenders, pagination]);

  const pageStats = [
    { label: 'Opportunities', value: insights.total,       colorScheme: 'blue'    as const, icon: <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />, subValue: '↑ 12% this month' },
    { label: 'New This Week', value: insights.newThisWeek, colorScheme: 'amber'   as const, icon: <Zap       className="h-4 w-4 sm:h-5 sm:w-5" />, subValue: 'Updated daily' },
    { label: 'CPO Required',  value: insights.cpoCount,    colorScheme: 'purple'  as const, icon: <Banknote  className="h-4 w-4 sm:h-5 sm:w-5" /> },
    { label: 'Saved',         value: savedTenders.length,  colorScheme: 'emerald' as const, icon: <Bookmark  className="h-4 w-4 sm:h-5 sm:w-5" /> },
  ];

  const tabsWithCounts: Tab[] = TABS.map(t => {
    if (t.id === 'saved')       return { ...t, count: savedTenders.length };
    if (t.id === 'invitations') return { ...t, count: pendingCount || invitations.length };
    return t;
  });

  return (
    <TenderDashboardLayout>
      <Head>
        <title>Browse Professional Tenders | Company Dashboard</title>
        <meta name="description" content="Browse and apply to professional tenders and procurement opportunities" />
      </Head>

      <div className="space-y-3 sm:space-y-4 lg:space-y-5">

        <BrowsePageHeader total={insights.total} newThisWeek={insights.newThisWeek} isLoading={isLoading} onRefresh={handleRefresh} />
        <PageStatsBar stats={pageStats} />
        <PageTabs tabs={tabsWithCounts} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

        {/* ── Browse ── */}
        {activeTab === 'browse' && (
          <div className="space-y-3 sm:space-y-4">
            <FilterBar tenderType="professional" filters={filters} onFilterChange={handleFilterChange} onClearAll={handleClearAll} categories={categories} />
            {!isLoading && pagination && (
              <div className={cn('flex justify-between items-center text-xs', colorClasses.text.muted)}>
                <span>{((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
                <span>Page {pagination.page}/{pagination.pages}</span>
              </div>
            )}
            {isLoading ? <LoadingSkeleton /> : tenders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {tenders.map((tender: any) => (
                  <ProfessionalTenderCard key={tender._id} tender={tender} viewerRole="company" viewerId={user?._id} onView={handleView}
                    onEdit={(id: any) => router.push(`/dashboard/company/tenders/tenders/${id}/edit`)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <div className={cn('w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4', colorClasses.bg.blueLight)}>
                  <Briefcase className={cn('h-7 w-7', colorClasses.text.blue600)} />
                </div>
                <h3 className={cn('text-base font-semibold mb-3', colorClasses.text.primary)}>No tenders found</h3>
                <button onClick={handleClearAll} className="px-4 py-2 rounded-xl text-sm font-semibold border-2 min-h-[40px]"
                  style={{ borderColor: colors.goldenMustard, color: colors.amber700 }}>Clear Filters</button>
              </div>
            )}
            {pagination && pagination.pages > 1 && <PaginationBar pagination={pagination} onPageChange={handlePageChange} isLoading={isLoading} />}
          </div>
        )}

        {/* ── Invitations — FIX 3 ── */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {/* Status filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'pending', 'accepted', 'declined'] as const).map(s => (
                <button key={s} onClick={() => setInviteStatusFilter(s)}
                  className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    inviteStatusFilter === s
                      ? 'bg-[#F1BB03] text-[#0A2540] border-[#F1BB03]'
                      : cn(colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.muted, 'hover:border-[#F1BB03]/50'))}>
                  {s === 'all' ? 'All Invitations' : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-[#0A2540] text-[#F1BB03]">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {isLoadingInvitations ? <InvitationSkeleton /> : invitations.length > 0 ? (
              <div className="space-y-3">
                {invitations.map(inv => <InvitedTenderCard key={inv._id} invitation={inv} />)}
              </div>
            ) : (
              <div className={cn('rounded-2xl border py-16 text-center', colorClasses.border.secondary, colorClasses.bg.surface)}>
                <Inbox className={cn('w-12 h-12 mx-auto mb-3 opacity-30', colorClasses.text.muted)} />
                <p className={cn('font-semibold mb-1', colorClasses.text.primary)}>No invitations</p>
                <p className={cn('text-sm max-w-xs mx-auto', colorClasses.text.muted)}>
                  When companies invite you to a private tender, it will appear here with accept & decline options.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Saved ── */}
        {activeTab === 'saved' && (
          <div className="space-y-3 sm:space-y-4">
            {isLoadingSaved ? <LoadingSkeleton /> : savedTenders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {savedTenders.map((tender: any) => (
                  <ProfessionalTenderCard key={tender._id} tender={{ ...tender, isSaved: true }} viewerRole="company" viewerId={user?._id} onView={handleView} />
                ))}
              </div>
            ) : (
              <div className={cn('rounded-2xl border py-14 text-center', colorClasses.border.secondary, colorClasses.bg.surface)}>
                <Bookmark className={cn('h-10 w-10 mx-auto mb-3', colorClasses.text.muted)} />
                <p className={cn('font-semibold mb-1', colorClasses.text.primary)}>No saved tenders yet</p>
                <p className={cn('text-sm', colorClasses.text.muted)}>Bookmark tenders from the Browse tab.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
}