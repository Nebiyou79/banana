// pages/dashboard/company/tenders/proposals/index.tsx
// Page 2.1 — Company Received Proposals List
// Route: /dashboard/company/tenders/proposals
// Also exported as ProposalsListPage for org reuse.
//
// KEY FIX: useMyProposals() is FREELANCER-only (403 for company users).
// Company owners must call useTenderProposals(tenderId) per tender.
// This page accepts an optional tenderId query param.
// When no tenderId is present, it shows all proposals across all tenders
// by iterating the company's posted freelance tenders.

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';
import {
  useTenderProposals,
  useTenderProposalStats,
} from '@/hooks/useProposal';
import { useMyPostedFreelanceTenders } from '@/hooks/useFreelanceTender';
import type { ProposalListItem, ProposalStatus, ProposalFilters } from '@/services/proposalService';
import {
  Search, Filter, Star, ChevronRight, FileText,
  Clock, Calendar, TrendingUp, BarChart2, X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  submitted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', label: 'Submitted' },
  under_review: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', label: 'Under Review' },
  shortlisted: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'Shortlisted' },
  interview_scheduled: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', label: 'Interview' },
  awarded: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Awarded' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Rejected' },
  withdrawn: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400', label: 'Withdrawn' },
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400', label: 'Draft' },
};

const STATUS_FILTERS: { label: string; value: ProposalStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Interview', value: 'interview_scheduled' },
  { label: 'Awarded', value: 'awarded' },
  { label: 'Rejected', value: 'rejected' },
];

function timeAgo(d?: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hrs = Math.floor(diff / 3_600_000);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return 'Just now';
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSAL CARD
// ─────────────────────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  tenderId,
  role,
  detailBasePath,
}: {
  proposal: ProposalListItem;
  tenderId: string;
  role: string;
  detailBasePath: string;
}) {
  const router = useRouter();
  const cfg = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG['submitted'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const freelancer = proposal.freelancer as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = proposal.freelancerProfile as any;
  const name = freelancer?.name ?? 'Freelancer';
  const initials = name.charAt(0).toUpperCase();
  const isAwarded = proposal.status === 'awarded';

  const href = `${detailBasePath}/${proposal._id}`;

  return (
    <article
      onClick={() => router.push(href)}
      className={[
        'group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200',
        colorClasses.bg.primary,
        isAwarded
          ? 'border-emerald-400 dark:border-emerald-600 shadow-md'
          : `${colorClasses.border.secondary} hover:border-[#F1BB03]/60 hover:shadow-lg hover:-translate-y-0.5`,
      ].join(' ')}
    >
      {/* Top status strip */}
      <div
        className="h-0.5 w-full"
        style={{
          background: isAwarded ? '#10B981' :
            proposal.isShortlisted ? '#F1BB03' :
              proposal.status === 'under_review' ? '#6366F1' :
                proposal.status === 'submitted' ? '#3B82F6' :
                  proposal.status === 'rejected' ? '#EF4444' : 'transparent',
        }}
      />

      {/* Awarded banner */}
      {isAwarded && (
        <div className="bg-emerald-500 px-4 py-1 text-[10px] font-bold text-white tracking-wide">
          🏆 CONTRACT AWARDED
        </div>
      )}
      {proposal.isShortlisted && !isAwarded && (
        <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> SHORTLISTED
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full shrink-0 bg-gradient-to-br from-[#F1BB03]/30 to-[#0A2540]/20 dark:from-[#F1BB03]/20 dark:to-white/10 flex items-center justify-center text-sm font-bold text-[#0A2540] dark:text-[#F1BB03]">
            {freelancer?.avatar
              ? <img src={freelancer.avatar} alt={name} className="w-full h-full object-cover rounded-full" />
              : initials
            }
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + status */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className={`text-sm font-bold truncate ${colorClasses.text.primary}`}>{name}</p>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>

            {/* Profile headline */}
            {profile?.headline && (
              <p className={`text-xs truncate mb-2 ${colorClasses.text.muted}`}>{profile.headline}</p>
            )}

            {/* Bid row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <p className="text-lg font-bold text-[#F1BB03]">
                {proposal.currency ?? 'ETB'} {proposal.proposedAmount?.toLocaleString()}
              </p>
              {proposal.deliveryTime && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.bg.secondary} ${colorClasses.text.muted}`}>
                  {proposal.deliveryTime.value} {proposal.deliveryTime.unit}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colorClasses.bg.secondary} ${colorClasses.text.muted}`}>
                {proposal.availability?.replace('-', ' ')}
              </span>
            </div>

            {/* Cover letter excerpt */}
            {proposal.coverLetter && (
              <p className={`text-xs line-clamp-2 mb-2 leading-relaxed ${colorClasses.text.muted}`}>
                {proposal.coverLetter}
              </p>
            )}

            {/* Footer meta */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {proposal.submittedAt && (
                <span className={`flex items-center gap-1 text-[10px] ${colorClasses.text.muted}`}>
                  <Clock className="w-3 h-3" /> {timeAgo(proposal.submittedAt)}
                </span>
              )}
              {profile?.ratings?.average ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {profile.ratings.average.toFixed(1)} ({profile.ratings.count})
                </span>
              ) : null}
              <span className={`text-[10px] font-semibold ${colorClasses.text.muted} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
                View <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-5 animate-pulse space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full ${colorClasses.bg.secondary}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 w-32 rounded-full ${colorClasses.bg.secondary}`} />
          <div className={`h-2 w-24 rounded-full ${colorClasses.bg.secondary}`} />
        </div>
        <div className={`h-5 w-20 rounded-full ${colorClasses.bg.secondary}`} />
      </div>
      <div className={`h-6 w-28 rounded ${colorClasses.bg.secondary}`} />
      <div className={`h-3 w-full rounded ${colorClasses.bg.secondary}`} />
      <div className={`h-3 w-3/4 rounded ${colorClasses.bg.secondary}`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CHIP
// ─────────────────────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INNER TENDER PROPOSALS LIST (single tender)
// ─────────────────────────────────────────────────────────────────────────────

function TenderProposalsList({
  tenderId,
  tenderTitle,
  statusFilter,
  searchQuery,
  role,
  detailBasePath,
}: {
  tenderId: string;
  tenderTitle: string;
  statusFilter: ProposalStatus | 'all';
  searchQuery: string;
  role: string;
  detailBasePath: string;
}) {
  const filters: ProposalFilters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 50,
  };

  const { data, isLoading } = useTenderProposals(tenderId, filters);
  const proposals = data?.proposals ?? [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return proposals;
    const q = searchQuery.toLowerCase();
    return proposals.filter((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = ((p.freelancer as any)?.name ?? '').toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headline = ((p.freelancerProfile as any)?.headline ?? '').toLowerCase();
      return name.includes(q) || headline.includes(q) || p.coverLetter?.toLowerCase().includes(q);
    });
  }, [proposals, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (filtered.length === 0) return null;

  return (
    <div>
      {tenderTitle && (
        <div className="flex items-center gap-2 mb-3">
          <FileText className={`w-4 h-4 ${colorClasses.text.muted}`} />
          <h3 className={`text-sm font-semibold ${colorClasses.text.secondary} truncate`}>{tenderTitle}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.bg.secondary} ${colorClasses.text.muted}`}>
            {filtered.length}
          </span>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((p) => (
          <ProposalCard
            key={p._id}
            proposal={p}
            tenderId={tenderId}
            role={role}
            detailBasePath={detailBasePath}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORTED PAGE
// ─────────────────────────────────────────────────────────────────────────────

interface ProposalsListPageProps {
  role: 'company' | 'organization';
  backHref: string;
  backLabel: string;
  ctaBg?: string;
}

export function ProposalsListPage({
  role,
  backHref,
  backLabel,
  ctaBg = 'bg-[#F1BB03]',
}: ProposalsListPageProps) {
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  // Optional: a specific tender filter from query
  const queryTenderId = router.query.tenderId as string | undefined;

  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load the company's freelance tenders (to iterate and fetch proposals per tender)
  const { data: ftData, isLoading: ftLoading } = useMyPostedFreelanceTenders({ limit: 100 });
  const tenders = ftData?.tenders ?? [];

  // Determine which tenders to show proposals for
  const activeTenderIds = useMemo(() => {
    if (queryTenderId) return [{ _id: queryTenderId, title: '' }];
    return tenders.map((t) => ({ _id: t._id, title: t.title }));
  }, [queryTenderId, tenders]);

  // Base path for detail pages
  const detailBasePath =
    role === 'company'
      ? '/dashboard/company/tenders/proposals'
      : '/dashboard/organization/proposals';

  const isLoading = ftLoading && !queryTenderId;

  return (
    <TenderDashboardLayout>
      <Head>
        <title>Proposals Received — {role === 'company' ? 'Company' : 'Organization'}</title>
      </Head>

      <div className="space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className={`rounded-2xl overflow-hidden ${colorClasses.bg.primary} border ${colorClasses.border.secondary} shadow-sm`}>
          <div className="h-1 w-full bg-gradient-to-r from-[#F1BB03] via-[#F59E0B] to-[#F1BB03]" />
          <div className="p-5 sm:p-6">
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-[#F1BB03]/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#F1BB03]" />
                  </div>
                  <h1 className={`text-xl font-bold ${colorClasses.text.primary}`}>
                    Proposals Received
                  </h1>
                </div>
                <p className={`text-sm ${colorClasses.text.muted}`}>
                  Review and manage proposals from freelancers on your tenders.
                </p>
              </div>
              <Link
                href={backHref}
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${colorClasses.text.muted} hover:${colorClasses.text.primary} transition-colors`}
              >
                {backLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Search + Filter Bar ─────────────────────────────────────── */}
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-3'}`}>
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colorClasses.text.muted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by freelancer name or keywords…"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/30 focus:border-[#F1BB03] transition-all`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${colorClasses.text.muted} hover:${colorClasses.text.primary}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${getTouchTargetSize('md')} ${showFilters ? 'border-[#F1BB03] text-[#F1BB03] bg-[#F1BB03]/10' : `${colorClasses.border.secondary} ${colorClasses.text.secondary} ${colorClasses.bg.primary}`}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Status filter pills */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                  statusFilter === value
                    ? 'bg-[#F1BB03] text-[#0A2540] border-[#F1BB03]'
                    : `${colorClasses.bg.primary} ${colorClasses.text.muted} ${colorClasses.border.secondary} hover:border-[#F1BB03]/40`,
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : activeTenderIds.length === 0 ? (
          <div className={`rounded-2xl border border-dashed ${colorClasses.border.secondary} p-16 text-center`}>
            <p className="text-4xl mb-4">📭</p>
            <p className={`text-base font-semibold ${colorClasses.text.primary} mb-2`}>No freelance tenders yet</p>
            <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
              Post a freelance tender to start receiving proposals from freelancers.
            </p>
            <Link
              href="/dashboard/company/my-tenders/create"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${ctaBg} text-white transition-all hover:opacity-90`}
            >
              Post a Tender
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTenderIds.map(({ _id, title }) => (
              <TenderProposalsList
                key={_id}
                tenderId={_id}
                tenderTitle={activeTenderIds.length > 1 ? title : ''}
                statusFilter={statusFilter}
                searchQuery={search}
                role={role}
                detailBasePath={detailBasePath}
              />
            ))}
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
}

// ─── Default export for company route ────────────────────────────────────────
export default function CompanyProposalsPage() {
  return (
    <ProposalsListPage
      role="company"
      backHref="/dashboard/company/tenders/my-tenders"
      backLabel="← My Tenders"
      ctaBg="bg-[#F1BB03]"
    />
  );
}