// pages/dashboard/company/tenders/bids/index.tsx
// Company bidder — paginated list of all their submitted bids.
// USES MyBidCard instead of BidCard — no tenderId required for display,
// eliminates "[BidCard] tenderId is empty" warning entirely.

import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { TenderDashboardLayout } from '@/components/tenders2.0/layout/TenderDashboardLayout';
import { colorClasses } from '@/utils/color';
import { useGetMyAllBids } from '@/hooks/useBid';
import MyBidCard from '@/components/bids/MybidCard';
import BidStatCard from '@/components/bids/BidStatCard';
import { Bid, BidStatus, BidTender } from '@/services/bidService';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: BidStatus | 'all' }[] = [
  { label: 'All',               value: 'all' },
  { label: '⏳ Submitted',      value: 'submitted' },
  { label: '🔍 Under Review',   value: 'under_review' },
  { label: '⭐ Shortlisted',    value: 'shortlisted' },
  { label: '📅 Interview',      value: 'interview_scheduled' },
  { label: '🏆 Awarded',        value: 'awarded' },
  { label: '✗ Rejected',        value: 'rejected' },
];

const LIMIT = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTenderObj = (bid: Bid): BidTender | null =>
  typeof bid.tender === 'object' && bid.tender !== null && '_id' in bid.tender
    ? (bid.tender as BidTender)
    : null;

const getTenderId = (bid: Bid): string => {
  const obj = getTenderObj(bid);
  if (obj?._id) return obj._id;
  if (typeof bid.tender === 'string' && bid.tender) return bid.tender;
  return '';
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden animate-pulse`}>
    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700" />
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`h-5 w-16 rounded-full ${colorClasses.bg.secondary}`} />
        <div className={`h-5 w-20 rounded-full ${colorClasses.bg.secondary}`} />
      </div>
      <div className={`h-4 w-4/5 rounded-full ${colorClasses.bg.secondary}`} />
      <div className={`h-3 w-2/5 rounded-full ${colorClasses.bg.secondary}`} />
      <div className={`h-8 w-3/5 rounded-full ${colorClasses.bg.secondary}`} />
      <div className={`h-3 w-1/3 rounded-full ${colorClasses.bg.secondary}`} />
      <div className={`h-10 w-full rounded-xl ${colorClasses.bg.secondary}`} />
      <div className="flex justify-end">
        <div className={`h-8 w-32 rounded-full ${colorClasses.bg.secondary}`} />
      </div>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyBidsPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<BidStatus | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);

  const { data, isLoading } = useGetMyAllBids({
    page,
    limit: LIMIT,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  });

  const bids: Bid[]  = data?.data ?? [];
  const pagination   = data?.pagination;
  const isMultiPage  = (pagination?.totalPages ?? 1) > 1;

  const filtered = useMemo(() => {
    if (!search.trim()) return bids;
    const q = search.toLowerCase();
    return bids.filter((b) =>
      (getTenderObj(b)?.title ?? '').toLowerCase().includes(q)
    );
  }, [bids, search]);

  const stats = useMemo(() => ({
    total:        pagination?.total ?? bids.length,
    under_review: bids.filter((b) => b.status === 'under_review').length,
    shortlisted:  bids.filter((b) => b.status === 'shortlisted').length,
    awarded:      bids.filter((b) => b.status === 'awarded').length,
  }), [bids, pagination]);

  const handleBidClick = (bid: Bid) => {
    const tenderId = getTenderId(bid);
    if (!tenderId) {
      console.warn('[MyBidsPage] tenderId empty for bid', bid._id, '— navigating without it');
      // Still allow navigation — the detail page will show what it can
      router.push(`/dashboard/company/tenders/bids/${bid._id}`);
      return;
    }
    router.push(`/dashboard/company/tenders/bids/${bid._id}?tenderId=${tenderId}`);
  };

  return (
    <TenderDashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

        {/* Page header */}
        <div>
          <h1 className={`text-2xl font-bold ${colorClasses.text.primary}`}>My Bids</h1>
          <p className={`text-sm ${colorClasses.text.muted} mt-1`}>
            Track all your submitted bids across all tenders.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <BidStatCard label="Total Bids"    value={isLoading ? '—' : stats.total}        icon={<span>📋</span>} colorScheme="blue" />
          <BidStatCard label="Under Review"  value={isLoading ? '—' : stats.under_review} icon={<span>🔍</span>} colorScheme="amber"   subtitle={isMultiPage ? 'this page' : undefined} />
          <BidStatCard label="Shortlisted"   value={isLoading ? '—' : stats.shortlisted}  icon={<span>⭐</span>} colorScheme="purple"  subtitle={isMultiPage ? 'this page' : undefined} />
          <BidStatCard label="Awarded"       value={isLoading ? '—' : stats.awarded}      icon={<span>🏆</span>} colorScheme="emerald" subtitle={isMultiPage ? 'this page' : undefined} />
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0',
                  statusFilter === value
                    ? 'bg-[#0A2540] text-white dark:bg-white dark:text-[#0A2540]'
                    : `${colorClasses.bg.surface} ${colorClasses.text.muted} hover:opacity-80 border ${colorClasses.border.secondary}`,
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative sm:ml-auto">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${colorClasses.text.muted}`}>🔍</span>
            <input
              type="text"
              placeholder="Search by tender title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 w-full sm:w-64 transition-all`}
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} flex flex-col items-center justify-center py-20 text-center px-6`}>
            <p className="text-5xl mb-4">📭</p>
            <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
              {search ? 'No matching bids' : 'No bids yet'}
            </h3>
            <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
              {search ? 'Try a different search term.' : "You haven't submitted any bids yet."}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/dashboard/company/tenders')}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F1BB03] text-[#0A2540] hover:opacity-90 transition-all shadow-md"
              >
                Browse Tenders →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((bid) => (
              <MyBidCard
                key={bid._id}
                bid={bid}
                tenderId={getTenderId(bid)}   // optional — passed for RFQ download only
                onClick={() => handleBidClick(bid)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${colorClasses.border.secondary} ${colorClasses.text.primary} disabled:opacity-40 hover:opacity-80 transition-all`}
            >
              ← Prev
            </button>
            <span className={`text-sm font-medium ${colorClasses.text.muted}`}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${colorClasses.border.secondary} ${colorClasses.text.primary} disabled:opacity-40 hover:opacity-80 transition-all`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
}