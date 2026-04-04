/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/tenders/index.tsx
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';
import {
  useFreelanceTenders,
  useSavedFreelanceTenders,
  useToggleSaveFreelanceTender,
  useFreelanceTenderCategories,
} from '@/hooks/useFreelanceTender';
import type { FreelanceTenderFilters } from '@/types/tender.types';
import {
  Award, Briefcase, CheckCircle, Bookmark, DollarSign,
  RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses, colors } from '@/utils/color';

// ─── Correct import paths (tenders not tenders2.0) ───────────────────────────
import { PageTabs } from '@/components/tenders2.0/shared/PageTabs';
import type { Tab } from '@/components/tenders2.0/shared/PageTabs';
import { PageHeader } from '@/components/tenders2.0/shared/PageHeader';
import { PageStatsBar } from '@/components/tenders2.0/shared/PageStatsBar';
import FreelanceTenderCard from '@/components/tenders2.0/FreelanceTenderCard';
import { FilterBar } from '@/components/tenders2.0/shared/FilterBar';

// ─── Tabs — use `tint` (not `panelTint`) matching the PageTabs Tab interface ─
const TABS: Tab[] = [
  { id: 'browse', label: 'Browse', tint: 'blue' },
  { id: 'saved', label: 'Saved', tint: 'amber' },
];

export default function FreelancerBrowseTendersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { breakpoint } = useResponsive();

  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');
  const [filters, setFilters] = useState<FreelanceTenderFilters>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, error, refetch } = useFreelanceTenders(filters);
  const { data: savedData, isLoading: isLoadingSaved } = useSavedFreelanceTenders();
  const { mutate: toggleSave } = useToggleSaveFreelanceTender();
  const { data: categories } = useFreelanceTenderCategories();

  const tenders = data?.tenders ?? [];
  const pagination = data?.pagination;
  const savedTenders = savedData?.tenders ?? [];

  const savedIds = useMemo(() => new Set(savedTenders.map((t: any) => t._id)), [savedTenders]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number),
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({ page: 1, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleSave = useCallback((tenderId: string) => {
    if (!user) {
      toast({ title: 'Login required', description: 'Please log in to save tenders', variant: 'destructive' });
      return;
    }
    toggleSave(tenderId);
  }, [toggleSave, user, toast]);

  const handleView = useCallback((id: string) => {
    router.push(`/dashboard/freelancer/tenders/${id}`);
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast({ title: 'Refreshed', description: 'Tender list updated', variant: 'success' });
  }, [refetch, toast]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const avgBudget = useMemo(() => {
    let total = 0; let count = 0;
    tenders.forEach((t: any) => {
      const budget = t.details?.budget ?? t.budget;
      if (budget?.min) { total += budget.min; count++; }
    });
    return count > 0 ? Math.round(total / count) : 0;
  }, [tenders]);

  const headerStats = [
    { label: 'opportunities', value: pagination?.total ?? tenders.length, icon: <Briefcase className="h-3.5 w-3.5" /> },
    { label: 'saved', value: savedTenders.length, icon: <Bookmark className="h-3.5 w-3.5" /> },
    { label: 'avg budget', value: avgBudget > 0 ? `ETB ${Math.round(avgBudget / 1000)}K` : '—', icon: <DollarSign className="h-3.5 w-3.5" /> },
  ];

  const pageStats = [
    { label: 'Total Projects', value: pagination?.total ?? tenders.length, colorScheme: 'blue' as const, icon: <Briefcase className="h-5 w-5" />, subValue: 'Updated daily' },
    { label: 'Applied', value: 0, colorScheme: 'emerald' as const, icon: <CheckCircle className="h-5 w-5" /> },
    { label: 'Saved', value: savedTenders.length, colorScheme: 'amber' as const, icon: <Bookmark className="h-5 w-5" /> },
    { label: 'Avg Budget', value: avgBudget > 0 ? `ETB ${Math.round(avgBudget / 1000)}K` : '—', colorScheme: 'purple' as const, icon: <DollarSign className="h-5 w-5" /> },
  ];

  // ── Tabs with counts ───────────────────────────────────────────────────────
  const tabsWithCount: Tab[] = TABS.map((t) =>
    t.id === 'saved' ? { ...t, count: savedTenders.length } : t
  );

  // ── Sub-components ─────────────────────────────────────────────────────────
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={cn('rounded-2xl border p-5 animate-pulse', colorClasses.border.secondary, colorClasses.bg.primary)}>
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

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className={cn('w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4', colorClasses.bg.emeraldLight)}>
        <Briefcase className={cn('h-8 w-8', colorClasses.text.emerald)} />
      </div>
      <h3 className={cn('text-lg font-semibold mb-2', colorClasses.text.primary)}>No tenders found</h3>
      <p className={cn('text-sm mb-4', colorClasses.text.muted)}>Try adjusting your filters</p>
      <button
        onClick={handleClearAll}
        className="px-4 py-2 rounded-lg text-sm font-medium border"
        style={{ borderColor: colors.goldenMustard, color: colors.amber700 }}
      >
        Clear Filters
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout requiredRole="freelancer">
      <Head>
        <title>Find Freelance Work | Freelancer Dashboard</title>
        <meta name="description" content="Browse freelance projects and opportunities" />
      </Head>

      <div className={cn('min-h-screen', colorClasses.bg.primary)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6">

            {/* Animated Header */}
            <PageHeader
              theme="freelancer"
              title="Find Freelance Work"
              subtitle="Browse projects matching your skills"
              icon={<Award className="h-6 w-6 md:h-7 md:w-7 text-white" />}
              stats={headerStats}
              actions={
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-white hover:bg-white/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              }
            />

            {/* Stats Bar */}
            <PageStatsBar stats={pageStats} />

            {/* Tabs — `onChange` prop (not `onTabChange`) */}
            <PageTabs
              tabs={tabsWithCount}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as 'browse' | 'saved')}
            />

            {/* ── Browse Tab ─────────────────────────────────────────────── */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                <FilterBar
                  tenderType="freelance"
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearAll={handleClearAll}
                  categories={categories}
                />

                {/* Results count */}
                {!isLoading && pagination && (
                  <div className={cn('flex justify-between items-center text-sm', colorClasses.text.muted)}>
                    <span>
                      Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                  </div>
                )}

                {isLoading ? (
                  <LoadingSkeleton />
                ) : tenders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {tenders.map((tender: any) => (
                      <FreelanceTenderCard
                        key={tender._id}
                        tender={tender}
                        viewerRole="freelancer"
                        viewerId={user?._id}
                        onView={handleView}
                        onEdit={(id) => router.push(`/dashboard/freelancer/tenders/${id}/edit`)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}

                {pagination && pagination.pages > 1 && (
                  <PaginationBar pagination={pagination} onPageChange={handlePageChange} isLoading={isLoading} />
                )}
              </div>
            )}

            {/* ── Saved Tab ──────────────────────────────────────────────── */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                {isLoadingSaved ? (
                  <LoadingSkeleton />
                ) : savedTenders.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {savedTenders.map((tender: any) => (
                      <FreelanceTenderCard
                        key={tender._id}
                        tender={{ ...tender, isSaved: true }}
                        viewerRole="freelancer"
                        viewerId={user?._id}
                        onView={handleView}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Bookmark className={cn('h-12 w-12 mx-auto mb-4', colorClasses.text.muted)} />
                    <p className={cn('text-sm', colorClasses.text.muted)}>No saved tenders yet.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  pagination,
  onPageChange,
  isLoading,
}: {
  pagination: { page: number; pages: number };
  onPageChange: (p: number) => void;
  isLoading: boolean;
}) {
  const { page, pages } = pagination;
  return (
    <div className={cn('flex items-center justify-between pt-4 border-t', colorClasses.border.secondary)}>
      <span className={cn('text-sm', colorClasses.text.muted)}>Page {page} of {pages}</span>
      <div className="flex items-center gap-1">
        {[
          { icon: <ChevronsLeft className="h-4 w-4" />, onClick: () => onPageChange(1), disabled: page === 1 },
          { icon: <ChevronLeft className="h-4 w-4" />, onClick: () => onPageChange(page - 1), disabled: page === 1 },
          { icon: <ChevronRight className="h-4 w-4" />, onClick: () => onPageChange(page + 1), disabled: page === pages },
          { icon: <ChevronsRight className="h-4 w-4" />, onClick: () => onPageChange(pages), disabled: page === pages },
        ].map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={btn.onClick}
            disabled={btn.disabled || isLoading}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-lg border transition-colors',
              colorClasses.border.primary,
              colorClasses.text.primary,
              'disabled:opacity-40 hover:bg-secondary/50'
            )}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}