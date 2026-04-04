// pages/dashboard/freelancer/proposals/index.tsx
// Page 1.2 — Freelancer My Proposals List
// Route: /dashboard/freelancer/proposals
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  FileText, Search, ChevronLeft, ChevronRight,
  Award, Briefcase, Star, Send, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/proposals/shared/StatCard';
import type { ProposalListItem, ProposalStatus } from '@/services/proposalService';
import { useMyProposals } from '@/hooks/useProposal';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all',               label: 'All' },
  { value: 'submitted',         label: 'Submitted' },
  { value: 'under_review',      label: 'Under Review' },
  { value: 'shortlisted',       label: 'Shortlisted' },
  { value: 'awarded',           label: 'Awarded' },
  { value: 'rejected',          label: 'Rejected' },
  { value: 'withdrawn',         label: 'Withdrawn' },
];

const SORT_OPTIONS = [
  { value: 'submittedAt:-1',   label: 'Newest First' },
  { value: 'submittedAt:1',    label: 'Oldest First' },
  { value: 'proposedAmount:-1',label: 'Highest Bid' },
  { value: 'proposedAmount:1', label: 'Lowest Bid' },
];

const STATUS_ACCENT: Record<string, string> = {
  awarded:           'bg-[#F1BB03]',
  shortlisted:       'bg-[#0A2540]',
  submitted:         'bg-[#2563EB]',
  under_review:      'bg-[#2563EB]',
  rejected:          'bg-red-500',
  withdrawn:         'bg-gray-400',
  draft:             'bg-gray-300',
  interview_scheduled:'bg-[#7C3AED]',
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1d ago';
  return `${d}d ago`;
}

type PopulatedTender = { title?: string; ownerEntity?: { name?: string; logo?: string } | string; ownerEntityModel?: string };

function ProposalReviewCard({ proposal }: { proposal: ProposalListItem }) {
  const router = useRouter();
  const tender = proposal.tender as unknown as PopulatedTender;
  const ownerEntity = typeof tender?.ownerEntity === 'object' && tender?.ownerEntity !== null
    ? tender.ownerEntity as { name?: string; logo?: string }
    : null;
  const ownerName = ownerEntity?.name ?? tender?.ownerEntityModel ?? 'Unknown client';
  const logoUrl   = ownerEntity?.logo ?? null;
  const isAwarded = proposal.status === 'awarded';

  return (
    <article
      onClick={() => router.push(`/dashboard/freelancer/proposals/${proposal._id}`)}
      className={cn(
        'relative overflow-hidden rounded-2xl border cursor-pointer transition-all',
        colorClasses.bg.primary, colorClasses.border.gray200,
        'hover:shadow-md hover:border-[#F1BB03]/50',
        isAwarded && 'border-[#F1BB03]',
      )}
    >
      {/* Status accent strip */}
      <div className={cn('h-1 w-full', STATUS_ACCENT[proposal.status] ?? 'bg-gray-300')} />

      {/* Awarded banner */}
      {isAwarded && (
        <div className="flex items-center gap-1.5 bg-[#F1BB03] px-4 py-1 text-[10px] font-bold text-[#0A2540]">
          🏆 Awarded
        </div>
      )}
      {/* Shortlisted banner */}
      {proposal.isShortlisted && !isAwarded && (
        <div className={cn('flex items-center gap-1.5 px-4 py-1 text-[10px] font-bold bg-[#0A2540] text-white')}>
          ⭐ Shortlisted
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg overflow-hidden', colorClasses.bg.secondary, colorClasses.border.gray200)}>
            {logoUrl ? <img src={logoUrl} alt={ownerName} className="h-full w-full object-cover" /> : '🏢'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>
                {tender?.title ?? 'Untitled Tender'}
              </p>
              <span className={cn(
                'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                colorClasses.bg.secondary, colorClasses.text.secondary,
              )}>
                {proposal.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className={cn('text-xs', colorClasses.text.muted)}>{ownerName}</p>
          </div>
        </div>

        {/* Bid amount */}
        <p className="text-xl font-bold text-[#F1BB03] mb-2">
          {proposal.currency ?? 'ETB'} {proposal.proposedAmount?.toLocaleString()}
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {proposal.deliveryTime && (
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>
              {proposal.deliveryTime.value} {proposal.deliveryTime.unit}
            </span>
          )}
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full capitalize', colorClasses.bg.secondary, colorClasses.text.muted)}>
            {proposal.bidType}
          </span>
          {proposal.availability && (
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full capitalize', colorClasses.bg.secondary, colorClasses.text.muted)}>
              {proposal.availability.replace('-', ' ')}
            </span>
          )}
        </div>

        {/* Cover letter excerpt */}
        {proposal.coverLetter && (
          <p className={cn('text-xs line-clamp-2 mb-3', colorClasses.text.secondary)}>
            {proposal.coverLetter}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={cn('text-xs', colorClasses.text.muted)}>
            {proposal.submittedAt ? timeAgo(proposal.submittedAt) : 'Draft'}
          </span>
          <span className="text-xs font-semibold text-[#F1BB03] hover:underline">
            View Proposal →
          </span>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className={cn('rounded-2xl border h-48 animate-pulse', colorClasses.bg.secondary, colorClasses.border.gray200)} />
  );
}

const LIMIT = 12;

export default function MyProposalsPage() {
  const router = useRouter();
  const { breakpoint } = useResponsive();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]             = useState('submittedAt:-1');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);

  const queryFilters = useMemo(() => ({
    ...(statusFilter !== 'all' ? { status: statusFilter as ProposalStatus } : {}),
    sortBy,
    page,
    limit: LIMIT,
  }), [statusFilter, sortBy, page]);

  const { data, isLoading } = useMyProposals(queryFilters);

  const proposals = data?.proposals ?? [];
  const pagination = data?.pagination;

  // Client-side search filter on title
  const filtered = search.trim()
    ? proposals.filter((p) => {
        const tender = p.tender as unknown as PopulatedTender;
        return tender?.title?.toLowerCase().includes(search.toLowerCase());
      })
    : proposals;

  // Stats computed from ALL proposals (no filter)
  const { data: allData } = useMyProposals({ limit: 200 });
  const allProposals = allData?.proposals ?? [];
  const stats = {
    total:      allProposals.length,
    underReview:allProposals.filter((p) => ['submitted','under_review'].includes(p.status)).length,
    shortlisted:allProposals.filter((p) => p.isShortlisted).length,
    awarded:    allProposals.filter((p) => p.status === 'awarded').length,
  };

  return (
    <DashboardLayout requiredRole="freelancer">
      <Head><title>My Proposals | Banana</title></Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Title ─────────────────────────────────────────────────── */}
        <h1 className={cn('text-2xl font-bold', colorClasses.text.primary)}>My Proposals</h1>

        {/* ── Section 1: Stat Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Proposals"  value={stats.total}      icon={<FileText className="w-5 h-5" />} colorScheme="blue"    isLoading={isLoading} />
          <StatCard label="Under Review"     value={stats.underReview} icon={<Send     className="w-5 h-5" />} colorScheme="amber"   isLoading={isLoading} />
          <StatCard label="Shortlisted"      value={stats.shortlisted} icon={<Star     className="w-5 h-5" />} colorScheme="purple"  isLoading={isLoading} />
          <StatCard label="Awarded"          value={stats.awarded}     icon={<Award    className="w-5 h-5" />} colorScheme="emerald" isLoading={isLoading} />
        </div>

        {/* ── Section 2: Filter / Sort bar ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Status pills — horizontal scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: 'none' }}>
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  statusFilter === value
                    ? 'bg-[#0A2540] text-white dark:bg-white dark:text-[#0A2540]'
                    : cn(colorClasses.bg.secondary, colorClasses.text.muted, 'hover:' + colorClasses.text.primary),
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort + Search */}
          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs outline-none',
                colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary,
                'focus:border-[#F1BB03] focus:ring-2 focus:ring-[#F1BB03]/40',
              )}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="relative flex-1 sm:w-64">
              <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5', colorClasses.text.muted)} />
              <input
                type="text"
                placeholder="Search by tender title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none',
                  colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary,
                  'focus:border-[#F1BB03] focus:ring-2 focus:ring-[#F1BB03]/40',
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Grid ─────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn('rounded-2xl border p-12 text-center', colorClasses.bg.primary, colorClasses.border.gray200)}>
            <p className="text-5xl mb-4">📭</p>
            <h3 className={cn('text-lg font-semibold mb-2', colorClasses.text.primary)}>No proposals yet</h3>
            <p className={cn('text-sm mb-5', colorClasses.text.muted)}>
              Start applying to tenders to see your proposals here.
            </p>
            <Link
              href="/dashboard/freelancer/tenders"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F1BB03] text-[#0A2540] font-semibold text-sm hover:brightness-105 transition-all"
            >
              Browse Tenders
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => <ProposalReviewCard key={p._id} proposal={p} />)}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={cn(
                'flex items-center gap-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.secondary,
                'disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#F1BB03]',
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className={cn('text-sm', colorClasses.text.muted)}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={cn(
                'flex items-center gap-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.secondary,
                'disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#F1BB03]',
              )}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
