/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/tenders/index.tsx
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Send, FileEdit, Users,
  BadgeCheck, RefreshCw, Building,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageStatsBar } from '@/components/tenders2.0/shared/PageStatsBar';
import { PageTabs } from '@/components/tenders2.0/shared/PageTabs';
import ProfessionalTenderCard from '@/components/tenders2.0/ProfessionalTenderCard';
import FreelanceTenderCard from '@/components/tenders2.0/FreelanceTenderCard';
import {
  useMyPostedProfessionalTenders,
  useDeleteProfessionalTender,
  usePublishProfessionalTender,
} from '@/hooks/useProfessionalTender';
import {
  useMyPostedFreelanceTenders,
  useDeleteFreelanceTender,
  usePublishFreelanceTender,
} from '@/hooks/useFreelanceTender';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { colors, colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className={cn('rounded-2xl border p-4 sm:p-5 animate-pulse', colorClasses.bg.primary, colorClasses.border.secondary)}>
      <div className="flex items-start gap-3 mb-4">
        <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0', colorClasses.bg.gray200, 'dark:bg-gray-700')} />
        <div className="flex-1 space-y-2 min-w-0">
          <div className={cn('h-3 rounded w-3/4', colorClasses.bg.gray200, 'dark:bg-gray-700')} />
          <div className={cn('h-3 rounded w-1/2', colorClasses.bg.gray200, 'dark:bg-gray-700')} />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className={cn('h-4 rounded w-full',  colorClasses.bg.gray200, 'dark:bg-gray-700')} />
        <div className={cn('h-4 rounded w-5/6',   colorClasses.bg.gray200, 'dark:bg-gray-700')} />
      </div>
      <div className="flex gap-2 mb-4">
        <div className={cn('h-5 rounded-full w-16', colorClasses.bg.gray200, 'dark:bg-gray-700')} />
        <div className={cn('h-5 rounded-full w-12', colorClasses.bg.gray200, 'dark:bg-gray-700')} />
      </div>
      <div className={cn('h-9 rounded-lg w-full mt-4', colorClasses.bg.gray200, 'dark:bg-gray-700')} />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ tab, onCreateClick }: { tab: string; onCreateClick: () => void }) {
  const messages: Record<string, { title: string; sub: string }> = {
    all:          { title: 'No tenders posted yet',   sub: 'Create your first tender to get started.' },
    professional: { title: 'No professional tenders', sub: 'Post a procurement tender for your organization.' },
    freelance:    { title: 'No freelance tenders',    sub: 'Post a freelance project to find talent.' },
    published:    { title: 'No published tenders',    sub: 'Publish a draft tender to make it live.' },
    draft:        { title: 'No drafts',               sub: 'Start creating a tender — it will appear here.' },
  };
  const msg = messages[tab] ?? messages.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 sm:py-20"
    >
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 sm:mb-5"
        style={{ backgroundColor: `${colors.teal}18` }}
      >
        <FileText className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: colors.teal }} />
      </div>
      <h3 className={cn('text-lg sm:text-xl font-bold mb-2', colorClasses.text.primary)}>{msg.title}</h3>
      <p className={cn('text-sm mb-5 sm:mb-6 max-w-xs mx-auto', colorClasses.text.muted)}>{msg.sub}</p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)' }}
      >
        <Plus className="h-4 w-4" /> Create Tender
      </button>
    </motion.div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────

function OrgPageHeader({
  orgName, orgVerified, orgInitial, stats,
  onRefresh, isLoading, onCreateClick,
}: {
  orgName: string; orgVerified?: boolean; orgInitial: string;
  stats: { total: number; published: number; draft: number; bids: number };
  onRefresh: () => void; isLoading: boolean; onCreateClick: () => void;
}) {
  const statBadges = [
    { label: 'total posted',  value: stats.total     },
    { label: 'published',     value: stats.published  },
    { label: 'draft',         value: stats.draft      },
    { label: 'bids received', value: stats.bids       },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-10"
      style={{ background: 'linear-gradient(135deg, #0F766E 0%, #059669 50%, #0F7490 100%)' }}
    >
      {/* Orbs */}
      <motion.div
        animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-56 sm:w-72 h-56 sm:h-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.10)', transform: 'translate(30%, -30%)' }}
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 28, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-44 sm:w-56 h-44 sm:h-56 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.07)', transform: 'translate(-30%, 30%)' }}
      />

      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 flex overflow-hidden">
        <motion.div initial={{ width: '0%' }} animate={{ width: '40%' }} transition={{ duration: 1, delay: 0.2 }} style={{ backgroundColor: colors.teal }} />
        <motion.div initial={{ width: '0%' }} animate={{ width: '40%' }} transition={{ duration: 1, delay: 0.5 }} style={{ backgroundColor: colors.emerald }} />
        <motion.div initial={{ width: '0%' }} animate={{ width: '20%' }} transition={{ duration: 1, delay: 0.8 }} style={{ backgroundColor: colors.goldenMustard }} />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        {/* Left */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white">My Tenders</h1>
              <p className="text-white/75 text-xs sm:text-base mt-0.5">Organization procurement management</p>
            </div>
          </div>

          {/* Stat badges — wrap on small screens */}
          <motion.div
            className="flex flex-wrap gap-2"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {statBadges.map(s => (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm border border-white/25"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <span className="font-bold text-white text-xs sm:text-sm">{s.value}</span>
                <span className="text-white/65 text-[10px] sm:text-xs">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white rounded-lg hover:bg-white/15 transition-colors"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-teal-800 bg-white hover:bg-white/90 transition-all hover:scale-105 active:scale-100 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">Create New Tender</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Identity Strip ────────────────────────────────────────────────────────────

function OrgIdentityStrip({ orgName, orgInitial, orgVerified }: {
  orgName: string; orgInitial: string; orgVerified?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border',
      colorClasses.bg.tealLight, colorClasses.border.teal,
    )}>
      <div
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white shrink-0"
        style={{ backgroundColor: colors.teal }}
      >
        {orgInitial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-semibold truncate', colorClasses.text.primary)}>{orgName}</span>
          {orgVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
        </div>
        <p className={cn('text-[10px]', colorClasses.text.muted)}>Posting as Organization</p>
      </div>
      <Building className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0', colorClasses.text.teal)} />
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function PaginationBar({ pagination, isLoading, onPageChange }: {
  pagination: any; isLoading: boolean; onPageChange: (p: number) => void;
}) {
  if (!pagination || pagination.pages <= 1) return null;
  const controls = [
    { label: '«', disabled: pagination.page <= 1,              to: 1 },
    { label: '‹', disabled: pagination.page <= 1,              to: pagination.page - 1 },
    { label: '›', disabled: pagination.page >= pagination.pages, to: pagination.page + 1 },
    { label: '»', disabled: pagination.page >= pagination.pages, to: pagination.pages   },
  ];
  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t', colorClasses.border.secondary)}>
      <p className={cn('text-xs sm:text-sm', colorClasses.text.muted)}>
        Page {pagination.page} of {pagination.pages} · {pagination.total} tenders
      </p>
      <div className="flex items-center gap-1">
        {controls.map(({ label, disabled, to }) => (
          <button
            key={label}
            disabled={disabled || isLoading}
            onClick={() => onPageChange(to)}
            className={cn(
              'h-7 w-7 sm:h-8 sm:w-8 rounded-lg border flex items-center justify-center text-sm font-medium transition-all',
              colorClasses.border.secondary, colorClasses.text.primary,
              'disabled:opacity-35 hover:enabled:bg-teal-50 dark:hover:enabled:bg-teal-950/20',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',          label: 'All',          tint: 'teal'    as const },
  { id: 'professional', label: 'Professional',  tint: 'blue'    as const },
  { id: 'freelance',    label: 'Freelance',     tint: 'emerald' as const },
  { id: 'published',    label: 'Published',     tint: 'emerald' as const },
  { id: 'draft',        label: 'Draft',         tint: 'amber'   as const },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrganizationMyTendersPage() {
  const router      = useRouter();
  const { toast }   = useToast();
  const { user }    = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [profPage,  setProfPage]  = useState(1);
  const [freePage,  setFreePage]  = useState(1);

  const orgName     = (user as any)?.organization?.name ?? (user as any)?.name ?? 'My Organization';
  const orgInitial  = orgName[0]?.toUpperCase() ?? 'O';
  const orgVerified = (user as any)?.organization?.verified ?? false;

  const profStatus = activeTab === 'published' ? 'published' : activeTab === 'draft' ? 'draft' : undefined;
  const freeStatus = profStatus;

  const { data: profData, isLoading: profLoading, refetch: refetchProf } =
    useMyPostedProfessionalTenders({ status: profStatus, page: profPage, limit: 12 });
  const { data: freeData, isLoading: freeLoading, refetch: refetchFree } =
    useMyPostedFreelanceTenders({ status: freeStatus, page: freePage, limit: 12 });

  const { mutate: deleteProfTender  } = useDeleteProfessionalTender();
  const { mutate: deleteFreeTender  } = useDeleteFreelanceTender();
  const { mutate: publishProfTender } = usePublishProfessionalTender();
  const { mutate: publishFreeTender } = usePublishFreelanceTender();

  const profTenders    = (profData as any)?.tenders    ?? [];
  const freeTenders    = (freeData as any)?.tenders    ?? [];
  const profPagination = (profData as any)?.pagination;
  const freePagination = (freeData as any)?.pagination;

  // ── Stats
  const statsData = useMemo(() => {
    const profTotal = profPagination?.total ?? 0;
    const freeTotal = freePagination?.total ?? 0;
    const published = [
      ...profTenders.filter((t: any) => ['published','active','locked'].includes(t.status)),
      ...freeTenders.filter((t: any) => t.status === 'published'),
    ].length;
    const draft = [
      ...profTenders.filter((t: any) => t.status === 'draft'),
      ...freeTenders.filter((t: any) => t.status === 'draft'),
    ].length;
    const bids = profTenders.reduce((s: number, t: any) => s + (t.bidCount ?? 0), 0)
               + freeTenders.reduce((s: number, t: any) => s + (t.applicationCount ?? 0), 0);
    return { total: profTotal + freeTotal, published, draft, bids };
  }, [profTenders, freeTenders, profPagination, freePagination]);

  const tabsWithCounts = TABS.map(t => {
    if (t.id === 'professional') return { ...t, count: profPagination?.total ?? 0 };
    if (t.id === 'freelance')    return { ...t, count: freePagination?.total  ?? 0 };
    if (t.id === 'published')    return { ...t, count: statsData.published };
    if (t.id === 'draft')        return { ...t, count: statsData.draft };
    return t;
  });

  const showProf = ['all','professional','published','draft'].includes(activeTab);
  const showFree = ['all','freelance','published','draft'].includes(activeTab);

  const displayProf = showProf ? profTenders : [];
  const displayFree = showFree ? freeTenders : [];
  const isLoading   = (showProf && profLoading) || (showFree && freeLoading);
  const isEmpty     = !isLoading && displayProf.length === 0 && displayFree.length === 0;

  // ── Handlers
  const handleView = useCallback((id: string, type: 'professional' | 'freelance') => {
    const base = type === 'freelance' ? '/dashboard/organization/freelance-tenders' : '/dashboard/organization/tenders';
    router.push(`${base}/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: string, type: 'professional' | 'freelance') => {
    const base = type === 'freelance' ? '/dashboard/organization/freelance-tenders' : '/dashboard/organization/tenders';
    router.push(`${base}/${id}/edit`);
  }, [router]);

  const handleDeleteProf = useCallback((id: string) => {
    deleteProfTender(id, {
      onSuccess: () => toast({ title: 'Tender deleted', variant: 'success' }),
      onError:   () => toast({ title: 'Delete failed',  variant: 'destructive' }),
    });
  }, [deleteProfTender, toast]);

  const handleDeleteFree = useCallback((id: string) => {
    deleteFreeTender(id, {
      onSuccess: () => toast({ title: 'Tender deleted', variant: 'success' }),
      onError:   () => toast({ title: 'Delete failed',  variant: 'destructive' }),
    });
  }, [deleteFreeTender, toast]);

  const handlePublishFree = useCallback((id: string) => {
    publishFreeTender(id, {
      onSuccess: () => toast({ title: 'Tender published!', variant: 'success' }),
      onError:   () => toast({ title: 'Publish failed',    variant: 'destructive' }),
    });
  }, [publishFreeTender, toast]);

  const handleRefresh = useCallback(() => {
    refetchProf(); refetchFree();
    toast({ title: 'Refreshed', variant: 'success' });
  }, [refetchProf, refetchFree, toast]);

  const handleCreate    = useCallback(() => router.push('/dashboard/organization/my-tenders/create'), [router]);
  const handleTabChange = useCallback((id: string) => { setActiveTab(id); setProfPage(1); setFreePage(1); }, []);

  // ── Stats bar data
  const statsBarData = [
    { label: 'Total Posted',  value: statsData.total,     subValue: 'All time',    colorScheme: 'emerald' as const, icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: 'Published',     value: statsData.published, subValue: 'Live now',    colorScheme: 'blue'    as const, icon: <Send    className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: 'Draft',         value: statsData.draft,     subValue: 'Unpublished', colorScheme: 'amber'   as const, icon: <FileEdit className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { label: 'Total Bids',    value: statsData.bids,      subValue: 'Received',    colorScheme: 'purple'  as const, icon: <Users  className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  // Section header used for "All" tab sub-sections
  const SectionHeader = ({ color, title, count, bgClass, textClass }: {
    color: string; title: string; count: number; bgClass: string; textClass: string;
  }) => (
    <div className="flex items-center gap-3 mb-3 sm:mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-1 h-4 sm:h-5 rounded-full`} style={{ backgroundColor: color }} />
        <h2 className={cn('text-sm sm:text-base font-semibold', colorClasses.text.primary)}>{title}</h2>
        <span className={cn('text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full', bgClass, textClass)}>
          {count}
        </span>
      </div>
      <div className={cn('flex-1 h-px border-t', colorClasses.border.secondary)} />
    </div>
  );

  return (
    <DashboardLayout requiredRole="organization">
      <Head>
        <title>My Tenders | Organization Dashboard</title>
        <meta name="description" content="Manage your organization's posted tenders" />
      </Head>

      <div className={cn('min-h-screen', colorClasses.bg.primary)}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 sm:py-8 space-y-4 sm:space-y-6">

          <OrgPageHeader
            orgName={orgName} orgVerified={orgVerified} orgInitial={orgInitial}
            stats={statsData} onRefresh={handleRefresh} isLoading={isLoading} onCreateClick={handleCreate}
          />

          <PageStatsBar stats={statsBarData} isLoading={isLoading && statsData.total === 0} />

          <OrgIdentityStrip orgName={orgName} orgInitial={orgInitial} orgVerified={orgVerified} />

          <PageTabs tabs={tabsWithCounts} activeTab={activeTab} onChange={handleTabChange} />

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : isEmpty ? (
            <EmptyState tab={activeTab} onCreateClick={handleCreate} />
          ) : (
            <div className="space-y-6 sm:space-y-8">

              {/* Professional tenders */}
              {showProf && displayProf.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <SectionHeader
                      color={colors.blue}
                      title="Professional Tenders"
                      count={profPagination?.total ?? displayProf.length}
                      bgClass={colorClasses.bg.blueLight}
                      textClass={colorClasses.text.blue}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                    {displayProf.map((tender: any) => (
                      <ProfessionalTenderCard
                        key={tender._id}
                        tender={tender}
                        viewerRole="organization"
                        viewerId={user?._id}
                        onView={id => handleView(id, 'professional')}
                        onEdit={id => handleEdit(id, 'professional')}
                        onDelete={handleDeleteProf}
                        onAddendum={id => router.push(`/dashboard/organization/tenders/${id}/addendum`)}
                      />
                    ))}
                  </div>
                  {activeTab === 'professional' && (
                    <div className="mt-4">
                      <PaginationBar
                        pagination={profPagination}
                        isLoading={profLoading}
                        onPageChange={p => { setProfPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Freelance tenders */}
              {showFree && displayFree.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <SectionHeader
                      color={colors.teal}
                      title="Freelance Tenders"
                      count={freePagination?.total ?? displayFree.length}
                      bgClass={colorClasses.bg.tealLight}
                      textClass={colorClasses.text.teal}
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                    {displayFree.map((tender: any) => (
                      <FreelanceTenderCard
                        key={tender._id}
                        tender={tender}
                        viewerRole="organization"
                        viewerId={user?._id}
                        onView={id => handleView(id, 'freelance')}
                        onEdit={id => handleEdit(id, 'freelance')}
                        onDelete={handleDeleteFree}
                        onPublish={handlePublishFree}
                      />
                    ))}
                  </div>
                  {activeTab === 'freelance' && (
                    <div className="mt-4">
                      <PaginationBar
                        pagination={freePagination}
                        isLoading={freeLoading}
                        onPageChange={p => { setFreePage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}