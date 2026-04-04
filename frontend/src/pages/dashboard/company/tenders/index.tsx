/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/index.tsx
// Company Tender Center Dashboard — all stats in one view
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/contexts/AuthContext';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useMyPostedProfessionalTenders } from '@/hooks/useProfessionalTender';
import { useMyPostedFreelanceTenders } from '@/hooks/useFreelanceTender';
import { useGetMyAllBids } from '@/hooks/useBid';
// FIX: Companies need to fetch proposals they RECEIVED, not their own proposals
// The correct hook is useTenderProposals, but that requires a tenderId
// Instead, we'll get proposals from the freelance tenders' application data
// No separate useMyProposals import needed

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  ClipboardList,
  Inbox,
  Briefcase,
  FileText,
  TrendingUp,
  ChevronRight,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  BarChart2,
  Layers,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number | undefined | null, currency = 'ETB') => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

const fmtNum = (n: number | undefined | null) => {
  if (n == null) return '—';
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n);
};

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;        // hex
  href?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, icon, accent, href, loading }: StatCardProps) {
  const inner = (
    <div
      className={[
        'relative rounded-2xl p-5 border overflow-hidden transition-all duration-200 group',
        colorClasses.bg.primary,
        colorClasses.border.secondary,
        href ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Faint bg accent circle */}
      <div
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-[0.07] transition-opacity duration-200 group-hover:opacity-[0.12]"
        style={{ backgroundColor: accent }}
      />

      <div className="relative flex items-start justify-between gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {icon}
        </div>

        {href && (
          <ChevronRight
            className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity shrink-0 mt-1"
            style={{ color: accent }}
          />
        )}
      </div>

      <div className="relative mt-3">
        {loading ? (
          <div className={`h-8 w-20 rounded-lg ${colorClasses.bg.secondary} animate-pulse`} />
        ) : (
          <p className={`text-2xl font-bold ${colorClasses.text.primary} leading-none`}>{value}</p>
        )}
        <p className={`text-xs font-semibold mt-1 ${colorClasses.text.muted}`}>{label}</p>
        {sub && !loading && (
          <p className="text-xs mt-0.5" style={{ color: accent }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function QuickAction({
  label,
  icon,
  href,
  accent,
  description,
}: {
  label: string;
  icon: React.ReactNode;
  href: string;
  accent: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colorClasses.text.primary} leading-tight`}>{label}</p>
        <p className={`text-xs ${colorClasses.text.muted} leading-tight mt-0.5 truncate`}>{description}</p>
      </div>
      <ChevronRight className={`w-4 h-4 ${colorClasses.text.muted} group-hover:translate-x-0.5 transition-transform`} />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BREAKDOWN ROW
// ─────────────────────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className={`text-xs flex-1 truncate ${colorClasses.text.secondary}`}>{label}</span>
      <div className={`w-20 h-1.5 rounded-full overflow-hidden ${colorClasses.bg.secondary}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-xs font-semibold ${colorClasses.text.primary} w-8 text-right`}>
        {count}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function TenderCenterDashboard() {
  const { user } = useAuth();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  // ── Data fetching ──────────────────────────────────────────────────────────

  // Professional tenders (company posted)
  const { data: profData, isLoading: profLoading } = useMyPostedProfessionalTenders({
    limit: 100,
  });

  // Freelance tenders (company posted)
  const { data: ftData, isLoading: ftLoading } = useMyPostedFreelanceTenders({
    limit: 100,
  });

  // Bids submitted by company on professional tenders
  const { data: myBidsData, isLoading: bidsLoading } = useGetMyAllBids({ limit: 100 });

  // FIX: No useMyProposals call here — it's freelancer-only and would 403
  // Proposal data is derived from the freelance tenders' applicationCount and
  // application data (which we don't fetch here to keep the dashboard fast)
  // The proposals received section will use the applicationCount aggregated
  // from the freelance tenders

  const loading = profLoading || ftLoading || bidsLoading;

  // ── Derived stats ──────────────────────────────────────────────────────────

  const profTenders = profData?.tenders ?? [];
  const ftTenders = ftData?.tenders ?? [];
  const myBids = myBidsData?.data ?? [];

  // FIX: Collect all proposals from freelance tenders' applications
  // Since we don't fetch full application data here, we'll use the applicationCount
  // from each tender. For detailed proposals, users will go to the proposals page
  // which makes the necessary API calls per tender.

  // However, for the dashboard summary, we can aggregate applicationCounts
  const totalApplications = ftTenders.reduce((s, t) => s + (t.applicationCount ?? 0), 0);

  // For status breakdown, we'd need to fetch applications per tender
  // This is too heavy for the dashboard, so we'll rely on the stats endpoint
  // or guide users to the proposals page for detailed breakdown
  const pendingProposals = 0; // Placeholder — actual value requires fetching application data
  const shortlistedProposals = 0; // Placeholder
  const awardedProposals = 0; // Placeholder
  const totalProposals = totalApplications; // Total applications across all freelance tenders

  const stats = useMemo(() => {
    // Professional tender stats
    const totalProfTenders = profData?.pagination?.total ?? profTenders.length;
    const openProfTenders = profTenders.filter((t) => ['published', 'open'].includes(t.status)).length;
    const closedProfTenders = profTenders.filter((t) => ['closed', 'awarded'].includes(t.status)).length;
    const totalProfBidsReceived = profTenders.reduce((s, t) => s + ((t as any).bidCount ?? 0), 0);

    // Freelance tender stats
    const totalFtTenders = ftData?.pagination?.total ?? ftTenders.length;
    const openFtTenders = ftTenders.filter((t) => ['published', 'open'].includes(t.status)).length;

    // FIX: Use aggregated application count from freelance tenders
    const totalFtApplications = ftTenders.reduce((s, t) => s + (t.applicationCount ?? 0), 0);

    // My bids (bids I submitted to professional tenders)
    const totalMyBids = myBidsData?.pagination?.total ?? myBids.length;
    const awardedBids = myBids.filter((b) => b.status === 'awarded').length;
    const pendingBids = myBids.filter((b) => ['submitted', 'under_review', 'shortlisted'].includes(b.status)).length;
    const rejectedBids = myBids.filter((b) => b.status === 'rejected').length;

    return {
      // Prof tenders
      totalProfTenders,
      openProfTenders,
      closedProfTenders,
      totalProfBidsReceived,

      // FT tenders
      totalFtTenders,
      openFtTenders,
      totalApplications: totalFtApplications,

      // My bids
      totalMyBids,
      awardedBids,
      pendingBids,
      rejectedBids,

      // Proposals (from freelance tenders)
      totalProposals: totalFtApplications,
      pendingProposals: 0, // Would need application detail fetch
      shortlistedProposals: 0, // Would need application detail fetch
      awardedProposals: 0, // Would need application detail fetch
    };
  }, [profData, ftData, myBidsData, profTenders, ftTenders, myBids]);

  // ── Recent activity ────────────────────────────────────────────────────────

  const recentBids = myBids.slice(0, 4);
  // FIX: Recent proposals would need application data from freelance tenders
  // We'll show a placeholder or omit for now
  const recentProposals: any[] = []; // Empty until we fetch application data

  // ── Status colors ──────────────────────────────────────────────────────────

  const bidStatusColor: Record<string, string> = {
    submitted: '#F59E0B',
    under_review: '#3B82F6',
    shortlisted: '#2AA198',
    interview_scheduled: '#8B5CF6',
    awarded: '#F1BB03',
    rejected: '#6B7280',
    withdrawn: '#6B7280',
  };

  const proposalStatusColor: Record<string, string> = {
    submitted: '#F59E0B',
    under_review: '#3B82F6',
    shortlisted: '#2AA198',
    interview_scheduled: '#8B5CF6',
    awarded: '#10B981',
    rejected: '#6B7280',
    draft: '#94A3B8',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4';

  return (
    <TenderDashboardLayout>
      <div className="space-y-7">

        {/* ── Welcome Header ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl overflow-hidden relative ${colorClasses.bg.primary} border ${colorClasses.border.secondary} shadow-sm`}>
          {/* Decorative gold gradient strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#F1BB03] via-[#F59E0B] to-[#F1BB03]" />

          {/* Background texture */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#F1BB03]/5" />
            <div className="absolute right-32 bottom-0 w-40 h-40 rounded-full bg-[#F1BB03]/4" />
          </div>

          <div className="relative p-6 sm:p-8">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F1BB03] flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#0A2540]" />
                  </div>
                  <h1 className={`text-xl font-bold ${colorClasses.text.primary}`}>
                    Tender Center
                  </h1>
                </div>
                <p className={`text-sm ${colorClasses.text.muted} max-w-md leading-relaxed`}>
                  Manage all your tenders, track incoming bids, review freelancer proposals, and monitor your bid submissions — all in one place.
                </p>
                {/* Animated status pill */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                  </span>
                  <span className={`text-xs font-medium ${colorClasses.text.muted}`}>
                    {stats.openProfTenders + stats.openFtTenders} active tender{stats.openProfTenders + stats.openFtTenders !== 1 ? 's' : ''}
                    {stats.pendingBids > 0 && ` · ${stats.pendingBids} pending bid${stats.pendingBids !== 1 ? 's' : ''}`}
                    {stats.totalApplications > 0 && ` · ${stats.totalApplications} application${stats.totalApplications !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className={`flex gap-2 flex-wrap ${isMobile ? '' : 'shrink-0'}`}>
                <Link
                  href="/dashboard/company/tenders/my-tenders/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:bg-[#D9A800] transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Tender
                </Link>
                <Link
                  href="/dashboard/company/tenders/tenders"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-[#F1BB03]/30 text-[#F1BB03] hover:bg-[#F1BB03]/10 transition-all`}
                >
                  <Search className="w-4 h-4" />
                  Browse
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Professional Tender Stats ────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-[#3B82F6]/15 flex items-center justify-center">
              <Layers className="w-3 h-3 text-[#3B82F6]" />
            </div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text.muted}`}>
              Professional Tenders
            </h2>
          </div>

          <div className={`grid ${gridCols} gap-4`}>
            <StatCard
              label="Total Tenders Posted"
              value={loading ? '—' : fmtNum(stats.totalProfTenders)}
              icon={<ClipboardList className="w-5 h-5" />}
              accent="#3B82F6"
              href="/dashboard/company/tenders/my-tenders"
              loading={loading}
            />
            <StatCard
              label="Open / Active"
              value={loading ? '—' : fmtNum(stats.openProfTenders)}
              sub={stats.closedProfTenders > 0 ? `${stats.closedProfTenders} closed` : undefined}
              icon={<TrendingUp className="w-5 h-5" />}
              accent="#10B981"
              href="/dashboard/company/tenders/my-tenders"
              loading={loading}
            />
            <StatCard
              label="Bids Received"
              value={loading ? '—' : fmtNum(stats.totalProfBidsReceived)}
              icon={<Inbox className="w-5 h-5" />}
              accent="#F1BB03"
              href="/dashboard/company/tenders/bids"
              loading={loading}
            />
            <StatCard
              label="Awarded Tenders"
              value={loading ? '—' : fmtNum(stats.closedProfTenders)}
              icon={<Award className="w-5 h-5" />}
              accent="#8B5CF6"
              href="/dashboard/company/tenders/my-tenders"
              loading={loading}
            />
          </div>
        </section>

        {/* ── SECTION 2: Freelance Tender Stats ───────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-[#10B981]/15 flex items-center justify-center">
              <FileText className="w-3 h-3 text-[#10B981]" />
            </div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text.muted}`}>
              Freelance Tenders
            </h2>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
            <StatCard
              label="Freelance Tenders Posted"
              value={loading ? '—' : fmtNum(stats.totalFtTenders)}
              icon={<ClipboardList className="w-5 h-5" />}
              accent="#10B981"
              loading={loading}
            />
            <StatCard
              label="Open for Proposals"
              value={loading ? '—' : fmtNum(stats.openFtTenders)}
              icon={<Search className="w-5 h-5" />}
              accent="#F59E0B"
              loading={loading}
            />
            <StatCard
              label="Total Applications"
              value={loading ? '—' : fmtNum(stats.totalApplications)}
              icon={<FileText className="w-5 h-5" />}
              accent="#3B82F6"
              href="/dashboard/company/tenders/proposals"
              loading={loading}
            />
          </div>
        </section>

        {/* ── SECTION 3: My Bids + Proposals (side by side on desktop) ─────── */}
        <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-5' : 'grid-cols-2 gap-6'}`}>

          {/* My Bids Panel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#F1BB03]/15 flex items-center justify-center">
                  <Briefcase className="w-3 h-3 text-[#F1BB03]" />
                </div>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text.muted}`}>
                  My Bids
                </h2>
              </div>
              <Link
                href="/dashboard/company/tenders/my-bids"
                className={`text-xs font-semibold text-[#F1BB03] hover:underline`}
              >
                View all →
              </Link>
            </div>

            {/* Mini stat row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total', value: stats.totalMyBids, color: '#3B82F6' },
                { label: 'Pending', value: stats.pendingBids, color: '#F59E0B' },
                { label: 'Awarded', value: stats.awardedBids, color: '#10B981' },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-xl p-3 text-center border ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}
                >
                  {loading ? (
                    <div className={`h-6 w-10 mx-auto rounded ${colorClasses.bg.secondary} animate-pulse`} />
                  ) : (
                    <p className="text-lg font-bold" style={{ color: s.color }}>
                      {fmtNum(s.value)}
                    </p>
                  )}
                  <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div
              className={`rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4 space-y-2.5`}
            >
              <p className={`text-xs font-semibold ${colorClasses.text.muted} mb-3 uppercase tracking-wide`}>
                Status Breakdown
              </p>
              {[
                { label: 'Submitted', count: myBids.filter((b) => b.status === 'submitted').length, color: '#F59E0B' },
                { label: 'Under Review', count: myBids.filter((b) => b.status === 'under_review').length, color: '#3B82F6' },
                { label: 'Shortlisted', count: myBids.filter((b) => b.status === 'shortlisted').length, color: '#2AA198' },
                { label: 'Awarded', count: stats.awardedBids, color: '#10B981' },
                { label: 'Rejected', count: stats.rejectedBids, color: '#6B7280' },
              ].map((row) => (
                <BreakdownRow
                  key={row.label}
                  {...row}
                  total={stats.totalMyBids || 1}
                />
              ))}
            </div>

            {/* Recent bids list */}
            {recentBids.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className={`text-xs font-semibold ${colorClasses.text.muted} uppercase tracking-wide`}>
                  Recent Bids
                </p>
                {recentBids.map((bid) => {
                  const tenderTitle =
                    typeof bid.tender === 'object' && 'title' in bid.tender
                      ? bid.tender.title
                      : 'Tender';
                  return (
                    <div
                      key={bid._id}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} hover:${colorClasses.bg.primary} transition-colors`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${colorClasses.text.primary} truncate`}>
                          {tenderTitle}
                        </p>
                        {bid.bidAmount != null && (
                          <p className={`text-xs ${colorClasses.text.muted}`}>
                            {fmt(bid.bidAmount, bid.currency)}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize"
                        style={{
                          backgroundColor: `${bidStatusColor[bid.status] ?? '#6B7280'}18`,
                          color: bidStatusColor[bid.status] ?? '#6B7280',
                        }}
                      >
                        {bid.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Proposals Received Panel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#8B5CF6]/15 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-[#8B5CF6]" />
                </div>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text.muted}`}>
                  Proposals Received
                </h2>
              </div>
              <Link
                href="/dashboard/company/tenders/proposals"
                className={`text-xs font-semibold text-[#8B5CF6] hover:underline`}
              >
                View all →
              </Link>
            </div>

            {/* Mini stat row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total', value: stats.totalProposals, color: '#8B5CF6' },
                { label: 'Applications', value: stats.totalApplications, color: '#F59E0B' },
                { label: 'Awarded', value: stats.awardedProposals, color: '#10B981' },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-xl p-3 text-center border ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}
                >
                  {loading ? (
                    <div className={`h-6 w-10 mx-auto rounded ${colorClasses.bg.secondary} animate-pulse`} />
                  ) : (
                    <p className="text-lg font-bold" style={{ color: s.color }}>
                      {fmtNum(s.value)}
                    </p>
                  )}
                  <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Status breakdown - placeholder since full data requires per-tender fetch */}
            <div
              className={`rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4`}
            >
              <p className={`text-xs font-semibold ${colorClasses.text.muted} mb-3 uppercase tracking-wide`}>
                Status Breakdown
              </p>
              <p className={`text-xs ${colorClasses.text.muted} text-center py-4`}>
                View detailed breakdown on the Proposals page
              </p>
            </div>

            {/* Recent proposals - placeholder */}
            <div className="mt-4">
              <div className={`flex items-center justify-between gap-2 px-3 py-4 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} text-center`}>
                <p className={`text-xs ${colorClasses.text.muted} w-full`}>
                  Click "View all" to see recent applications and manage freelancer proposals
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── SECTION 4: Quick Actions ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-[#F1BB03]/15 flex items-center justify-center">
              <BarChart2 className="w-3 h-3 text-[#F1BB03]" />
            </div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text.muted}`}>
              Quick Actions
            </h2>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
            <QuickAction
              label="Create Professional Tender"
              icon={<Plus className="w-4 h-4" />}
              href="/dashboard/company/tenders/my-tenders/create"
              accent="#F1BB03"
              description="Post a sealed or open procurement tender"
            />
            <QuickAction
              label="Browse Active Tenders"
              icon={<Search className="w-4 h-4" />}
              href="/dashboard/company/tenders/tenders"
              accent="#3B82F6"
              description="Bid on professional tenders"
            />
            <QuickAction
              label="Review Incoming Bids"
              icon={<Inbox className="w-4 h-4" />}
              href="/dashboard/company/tenders/bids"
              accent="#10B981"
              description={`${stats.totalProfBidsReceived} bids across your tenders`}
            />
            <QuickAction
              label="View My Bid Submissions"
              icon={<Briefcase className="w-4 h-4" />}
              href="/dashboard/company/tenders/my-bids"
              accent="#F59E0B"
              description={`${stats.totalMyBids} submitted, ${stats.awardedBids} awarded`}
            />
            <QuickAction
              label="Freelancer Proposals"
              icon={<FileText className="w-4 h-4" />}
              href="/dashboard/company/tenders/proposals"
              accent="#8B5CF6"
              description={`${stats.totalApplications} proposals awaiting review`}
            />
            <QuickAction
              label="My Freelance Tenders"
              icon={<ClipboardList className="w-4 h-4" />}
              href="/dashboard/company/tenders/my-tenders"
              accent="#2AA198"
              description={`${stats.totalFtTenders} freelance tenders posted`}
            />
          </div>
        </section>

        {/* ── SECTION 5: Ads ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-5 h-5 rounded-md ${colorClasses.bg.surface} flex items-center justify-center`}>
              <TrendingUp className={`w-3 h-3 ${colorClasses.text.muted}`} />
            </div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text.muted}`}>
              Resources & Services
            </h2>
          </div>
        </section>

      </div>
    </TenderDashboardLayout>
  );
}