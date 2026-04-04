// components/proposals/shared/TenderProposalsListView.tsx
// Shared view used by both /company and /organization proposals list pages.
// Pages Router compatible — no useParams, no 'use client' directive.
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  useTenderProposals,
  useTenderProposalStats,
  useToggleShortlist,
} from '@/hooks/useProposal';

import { ProposalReviewCard } from '@/components/proposals/owner/ProposalReviewCard';
import { ProposalStatsBar } from '@/components/proposals/owner/ProposalStatsBar';
import { CompareProposalsDrawer } from '@/components/proposals/owner/CompareProposalsDrawer';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { ProposalStatus, ProposalListItem } from '@/services/proposalService';

// ─── Types ────────────────────────────────────────────────────────────────────
export type RolePrefix = 'company' | 'organization';

interface Props {
  tenderId: string;
  rolePrefix: RolePrefix;
}

type SortOption = 'newest' | 'highest_bid' | 'lowest_bid' | 'best_rating';

const OWNER_STATUSES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest_bid', label: 'Highest Bid' },
  { value: 'lowest_bid', label: 'Lowest Bid' },
  { value: 'best_rating', label: 'Best Rating' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className={`animate-pulse rounded-2xl border p-5 ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}>
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-full ${colorClasses.bg.gray100}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 w-1/3 rounded ${colorClasses.bg.gray100}`} />
          <div className={`h-3 w-1/2 rounded ${colorClasses.bg.gray100}`} />
        </div>
        <div className={`h-5 w-20 rounded-full ${colorClasses.bg.gray100}`} />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tenderId }: { tenderId: string }) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/freelancer/tenders/${tenderId}`
      : '';
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="text-5xl">📭</span>
      <p className={`text-base font-semibold ${colorClasses.text.primary}`}>No proposals yet</p>
      <p className={`max-w-xs text-sm ${colorClasses.text.muted}`}>
        Share this tender to attract more applicants.
      </p>
      {shareUrl && (
        <button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all ${colorClasses.border.goldenMustard} ${colorClasses.text.goldenMustard} hover:opacity-90`}
        >
          📋 Copy Tender Link
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TenderProposalsListView({ tenderId, rolePrefix }: Props) {
  const router = useRouter();
  const { getTouchTargetSize } = useResponsive();

  const [activeStatus, setActiveStatus] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const LIMIT = 10;

  const filters = {
    status: activeStatus !== 'all' ? (activeStatus as ProposalStatus) : undefined,
    sortBy,
    isShortlisted: shortlistedOnly || undefined,
    page,
    limit: LIMIT,
  };

  const { data: statsData } = useTenderProposalStats(tenderId);
  const { data, isLoading } = useTenderProposals(tenderId, filters);
  const toggleShortlistMutation = useToggleShortlist();

  const proposals: ProposalListItem[] = data?.proposals ?? [];
  const pagination = data?.pagination;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCardClick = (proposalId: string) => {
    router.push(`/${rolePrefix}/proposals/${proposalId}`);
  };

  const selectedArray = Array.from(selected);
  const canCompare = selectedArray.length >= 2 && selectedArray.length <= 4;

  return (
    <div className="space-y-6">

      {/* Stats bar */}
      {statsData && <ProposalStatsBar stats={statsData} />}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className={`rounded-xl border px-3 py-2 text-sm outline-none ${colorClasses.border.secondary} ${colorClasses.bg.primary} ${colorClasses.text.primary} ${getTouchTargetSize('sm')}`}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Shortlisted toggle */}
        <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all select-none ${getTouchTargetSize('sm')} ${shortlistedOnly
            ? `${colorClasses.bg.amberLight} ${colorClasses.border.amber} ${colorClasses.text.amber}`
            : `${colorClasses.border.secondary} ${colorClasses.text.muted}`
          }`}>
          <input
            type="checkbox"
            checked={shortlistedOnly}
            onChange={(e) => setShortlistedOnly(e.target.checked)}
            className="sr-only"
          />
          ⭐ Shortlisted only
        </label>

        {/* Compare */}
        {selected.size > 0 && (
          <button
            onClick={() => setCompareOpen(true)}
            disabled={!canCompare}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 ${colorClasses.bg.darkNavy} hover:opacity-90 ${getTouchTargetSize('sm')}`}
          >
            Compare ({selected.size})
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className={`flex gap-1 overflow-x-auto rounded-2xl border p-1.5 ${colorClasses.border.secondary} ${colorClasses.bg.gray100}`}>
        {OWNER_STATUSES.map((s) => {
          const isActive = activeStatus === s.key;
          const count =
            s.key === 'all'
              ? (statsData?.total ?? 0)
              : (statsData?.byStatus?.[s.key as ProposalStatus] ?? 0);
          return (
            <button
              key={s.key}
              onClick={() => { setActiveStatus(s.key); setPage(1); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${getTouchTargetSize('sm')} ${isActive
                  ? `${colorClasses.bg.darkNavy} text-white shadow-sm`
                  : `${colorClasses.text.muted}`
                }`}
            >
              {s.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : `${colorClasses.bg.gray200} ${colorClasses.text.muted}`
                  }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <RowSkeleton key={i} />)}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState tenderId={tenderId} />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <ProposalReviewCard
              key={p._id}
              proposal={p}
              isSelected={selected.has(p._id)}
              onSelect={toggleSelect}
              onShortlist={(id) => toggleShortlistMutation.mutate(id)}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40 ${colorClasses.border.secondary} ${colorClasses.text.primary} ${getTouchTargetSize('sm')}`}
          >
            ← Prev
          </button>
          <span className={`text-sm ${colorClasses.text.muted}`}>
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className={`rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40 ${colorClasses.border.secondary} ${colorClasses.text.primary} ${getTouchTargetSize('sm')}`}
          >
            Next →
          </button>
        </div>
      )}

      {/* Compare drawer */}
      <CompareProposalsDrawer
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        proposalIds={selectedArray}
        tenderId={tenderId}
      />
    </div>
  );
}