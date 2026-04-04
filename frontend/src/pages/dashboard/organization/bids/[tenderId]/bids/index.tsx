// pages/dashboard/organization/bids/[tenderId]/bids/index.tsx
// Organization owner — all bids for a specific tender.
// FIX: BidCard now receives tenderId={tenderId} (was missing the prop entirely)

import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { colorClasses } from '@/utils/color';
import { useGetBids } from '@/hooks/useBid';
import { useProfessionalTender } from '@/hooks/useProfessionalTender';
import BidCard from '@/components/bids/BidCard';
import BidStatCard from '@/components/bids/BidStatCard';
import SealedBidBanner from '@/components/bids/SealedBidBanner';
import { Bid, BidStatus } from '@/services/bidService';
import { api } from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

const TEAL = '#0D9488';

const RevealDialog = ({
  onConfirm, onCancel, loading,
}: { onConfirm: () => void; onCancel: () => void; loading: boolean; }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className={`rounded-2xl ${colorClasses.bg.primary} border ${colorClasses.border.secondary} p-6 max-w-sm w-full shadow-2xl`}>
      <p className="text-3xl mb-3">🔓</p>
      <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>Reveal Bids?</h3>
      <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
        This will unlock all sealed bids. This action cannot be undone and will be recorded for the committee audit trail.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 ${colorClasses.border.secondary} ${colorClasses.text.primary} hover:opacity-80`}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
          style={{ backgroundColor: TEAL }}>
          {loading ? 'Revealing…' : 'Yes, Reveal'}
        </button>
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden animate-pulse`}>
    <div className="h-1 bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-xl ${colorClasses.bg.secondary}`} />
        <div className={`h-3 w-32 rounded-full ${colorClasses.bg.secondary}`} />
      </div>
      <div className={`h-7 w-2/3 rounded-full ${colorClasses.bg.secondary}`} />
      <div className={`h-3 w-1/3 rounded-full ${colorClasses.bg.secondary}`} />
    </div>
  </div>
);

const BID_STATUS_FILTERS: { label: string; value: BidStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '⏳ Submitted', value: 'submitted' },
  { label: '🔍 Under Review', value: 'under_review' },
  { label: '⭐ Shortlisted', value: 'shortlisted' },
  { label: '📅 Interview', value: 'interview_scheduled' },
  { label: '🏆 Awarded', value: 'awarded' },
  { label: '✗ Rejected', value: 'rejected' },
];

export default function OrgTenderBidsListPage() {
  const router = useRouter();
  const { tenderId } = router.query as { tenderId: string };

  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId ?? '');
  const { data: bidsData, isLoading: bidsLoading, refetch } = useGetBids(tenderId ?? '');

  const [statusFilter, setStatusFilter] = useState<BidStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showReveal, setShowReveal] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const allBids: Bid[] = bidsData?.bids ?? [];
  const isSealed = (tender?.workflowType ?? 'open') === 'closed';
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const canReveal = isSealed && !isBidsRevealed && !!tender?.status && ['closed', 'locked'].includes(tender.status);

  const filteredBids = allBids.filter((bid) => {
    if (statusFilter !== 'all' && bid.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const coverName = bid.coverSheet?.companyName ?? '';
    const company = bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany
      ? (bid.bidderCompany as { name: string }).name : '';
    const firstName = bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder
      ? (bid.bidder as { firstName?: string }).firstName ?? '' : '';
    return coverName.toLowerCase().includes(q) || company.toLowerCase().includes(q) || firstName.toLowerCase().includes(q);
  });

  const stats = {
    total: bidsData?.totalBids ?? allBids.length,
    sealed: bidsData?.sealedBids ?? allBids.filter((b) => b.sealed).length,
    shortlisted: allBids.filter((b) => b.status === 'shortlisted').length,
    awarded: allBids.filter((b) => b.status === 'awarded').length,
  };

  const handleReveal = async () => {
    setRevealing(true);
    try {
      await api.post(`/professional-tenders/${tenderId}/reveal-bids`);
      toast({ title: '🔓 Bids revealed for the committee.' });
      await refetch();
      setShowReveal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Please try again.';
      toast({ title: 'Failed to reveal bids', description: msg, variant: 'destructive' });
    } finally {
      setRevealing(false);
    }
  };

  if (tenderLoading && !tender) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2px solid #E5E5E5', borderTopColor: TEAL }} />
            <p className={`text-sm ${colorClasses.text.muted}`}>Loading tender…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      {showReveal && <RevealDialog onConfirm={handleReveal} onCancel={() => setShowReveal(false)} loading={revealing} />}

      <div className="p-5 sm:p-8 space-y-8">
        {/* Header */}
        <div>
          <button onClick={() => router.push('/dashboard/organization/bids')}
            className={`flex items-center gap-1 text-sm ${colorClasses.text.muted} hover:opacity-80 mb-3 transition-colors`}>
            ← Incoming Bids
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${colorClasses.text.primary}`}>{tender?.title ?? 'Incoming Bids'}</h1>
              {tender?.referenceNumber && (
                <p className={`text-sm ${colorClasses.text.muted} mt-0.5 font-mono`}>Ref: {tender.referenceNumber}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {tender?.deadline && (
                  <span className={`text-xs ${colorClasses.text.muted}`}>
                    Deadline: {new Date(tender.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {isSealed && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`}>
                    🔒 Sealed
                  </span>
                )}
              </div>
            </div>
            {canReveal && (
              <button onClick={() => setShowReveal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 shadow-md shrink-0 transition-all"
                style={{ backgroundColor: TEAL }}>
                🔓 Reveal Bids
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BidStatCard label="Total Bids" value={tenderLoading || bidsLoading ? '—' : stats.total} icon={<span>📋</span>} colorScheme="blue" />
          <BidStatCard
            label={isSealed && !isBidsRevealed ? 'Sealed Bids' : 'Under Review'}
            value={tenderLoading || bidsLoading ? '—' : isSealed ? stats.sealed : allBids.filter((b) => b.status === 'under_review').length}
            icon={<span>{isSealed && !isBidsRevealed ? '🔒' : '🔍'}</span>} colorScheme="amber"
          />
          <BidStatCard label="Shortlisted" value={tenderLoading || bidsLoading ? '—' : stats.shortlisted} icon={<span>⭐</span>} colorScheme="purple" />
          <BidStatCard label="Awarded" value={tenderLoading || bidsLoading ? '—' : stats.awarded} icon={<span>🏆</span>} colorScheme="emerald" />
        </div>

        {isSealed && tender?.deadline && (
          <SealedBidBanner workflowType="closed" isRevealed={isBidsRevealed} deadline={tender.deadline} />
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {BID_STATUS_FILTERS.map(({ label, value }) => (
              <button key={value} onClick={() => setStatusFilter(value)}
                className={['px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0',
                  statusFilter === value ? 'text-white' : `${colorClasses.bg.surface} ${colorClasses.text.muted} hover:opacity-80`,
                ].join(' ')}
                style={statusFilter === value ? { backgroundColor: TEAL } : undefined}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${colorClasses.text.muted}`}>🔍</span>
            <input type="text" placeholder="Search bidder or company…" value={search} onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm focus:outline-none w-full sm:w-64`}
            />
          </div>
        </div>

        {/* Cards */}
        {bidsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredBids.length === 0 ? (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} flex flex-col items-center justify-center py-20 text-center px-6`}>
            <p className="text-5xl mb-4">{allBids.length === 0 ? '📭' : '🔍'}</p>
            <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
              {allBids.length === 0 ? 'No bids received yet' : 'No matching bids'}
            </h3>
            <p className={`text-sm ${colorClasses.text.muted}`}>
              {allBids.length === 0 ? 'Share this tender to attract bidders.' : 'Try a different filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBids.map((bid) => (
              <BidCard
                key={bid._id}
                bid={bid}
                // FIX: was missing tenderId prop entirely — now passes the route param
                tenderId={tenderId}
                tenderWorkflowType={tender?.workflowType ?? 'open'}
                isBidsRevealed={isBidsRevealed}
                deadline={tender?.deadline}
                viewerRole="owner"
                onClick={() => router.push(`/dashboard/organization/bids/${tenderId}/bids/${bid._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}