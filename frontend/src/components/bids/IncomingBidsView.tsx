// src/components/bids/IncomingBidsView.tsx
// Shared component used by both company and org incoming-bids pages.
// BUG-07 FIX: TenderDashboardLayout instead of DashboardLayout
// BUG-08 FIX: correct base paths
// BUG-09 FIX: this component now exists (was previously missing)

import { useState } from 'react';
import { useRouter } from 'next/router';
import { TenderDashboardLayout } from '@/components/tenders2.0/layout/TenderDashboardLayout';
import { colorClasses } from '@/utils/color';
import { useGetBids } from '@/hooks/useBid';
// BUG-01 pattern FIX: named import
import { useProfessionalTender } from '@/hooks/useProfessionalTender';
import BidCard from '@/components/bids/BidCard';
import BidStatCard from '@/components/bids/BidStatCard';
import SealedBidBanner from '@/components/bids/SealedBidBanner';
import { Bid } from '@/services/bidService';
import { api } from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

// ─── Reveal Dialog ────────────────────────────────────────────────────────────

const RevealDialog = ({
  onConfirm,
  onCancel,
  loading,
  isOrg,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  isOrg: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className={`rounded-2xl ${colorClasses.bg.primary} border ${colorClasses.border.secondary} p-6 max-w-sm w-full shadow-2xl`}>
      <p className="text-3xl mb-3">🔓</p>
      <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>Reveal Bids?</h3>
      <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
        {isOrg
          ? 'This will unlock all sealed bids. This action cannot be undone and will be recorded for the committee audit trail.'
          : 'This will unlock all sealed bids and make financial details visible. This action cannot be undone.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 ${colorClasses.border.secondary} ${colorClasses.text.primary} hover:opacity-80 transition-all`}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
          style={{ backgroundColor: isOrg ? '#0D9488' : '#0A2540' }}
        >
          {loading ? 'Revealing…' : 'Yes, Reveal'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden animate-pulse`}>
    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full ${colorClasses.bg.secondary}`} />
        <div className={`h-3 w-32 rounded-full ${colorClasses.bg.secondary}`} />
      </div>
      <div className={`h-7 w-2/3 rounded-full ${colorClasses.bg.secondary}`} />
      <div className={`h-3 w-1/3 rounded-full ${colorClasses.bg.secondary}`} />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface IncomingBidsViewProps {
  role: 'company' | 'organization';
}

export const IncomingBidsView = ({ role }: IncomingBidsViewProps) => {
  const router = useRouter();
  const { tenderId } = router.query as { tenderId: string };

  const isOrg = role === 'organization';
  const accentHex = isOrg ? '#0D9488' : '#0A2540';
  // BUG-08 FIX: correct base paths
  const basePath = isOrg
    ? '/dashboard/organization/my-tenders'
    : '/dashboard/company/tenders/my-bids';

  // BUG-12 pattern FIX: named hook import
  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId ?? '');
  const { data: bidsData, isLoading: bidsLoading, refetch } = useGetBids(tenderId ?? '');

  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const bids: Bid[] = bidsData?.bids ?? [];
  const isSealed = tender?.workflowType === 'closed';
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;

  // FIX: correct backend status values
  const canReveal =
    isSealed &&
    !isBidsRevealed &&
    !!tender?.status &&
    ['closed', 'locked'].includes(tender.status);

  const handleReveal = async () => {
    setRevealing(true);
    try {
      await api.post(`/professional-tenders/${tenderId}/reveal-bids`);
      toast({ title: '🔓 Bids revealed! Financial details are now visible.' });
      await refetch();
      setShowRevealDialog(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Please try again.';
      toast({ title: 'Failed to reveal bids', description: message, variant: 'destructive' });
    } finally {
      setRevealing(false);
    }
  };

  const stats = {
    total: bidsData?.totalBids ?? bids.length,
    sealed: bidsData?.sealedBids ?? bids.filter((b) => b.sealed).length,
    shortlisted: bids.filter((b) => b.status === 'shortlisted').length,
    awarded: bids.filter((b) => b.status === 'awarded').length,
  };

  const isLoading = tenderLoading || bidsLoading;

  // Loading guard
  if (tenderLoading && !tender) {
    return (
      <TenderDashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{ border: '2px solid #E5E5E5', borderTopColor: accentHex }}
            />
            <p className={`text-sm ${colorClasses.text.muted}`}>Loading tender…</p>
          </div>
        </div>
      </TenderDashboardLayout>
    );
  }

  return (
    <TenderDashboardLayout>
      {showRevealDialog && (
        <RevealDialog
          onConfirm={handleReveal}
          onCancel={() => setShowRevealDialog(false)}
          loading={revealing}
          isOrg={isOrg}
        />
      )}

      <div className="p-5 sm:p-8 space-y-8">
        {/* Tender context header */}
        <div>
          <button
            onClick={() => router.push(isOrg ? '/dashboard/organization/my-tenders' : '/dashboard/company/tenders/my-tenders')}
            className={`flex items-center gap-1 text-sm ${colorClasses.text.muted} hover:${colorClasses.text.primary} mb-3 transition-colors`}
          >
            ← My Tenders
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-2xl font-bold ${colorClasses.text.primary}`}>
                  {tender?.title ?? 'Incoming Bids'}
                </h1>
                <div
                  className="h-1 w-12 rounded-full mt-0.5 hidden sm:block"
                  style={{ backgroundColor: isOrg ? '#0D9488' : '#F1BB03' }}
                />
              </div>

              {tender?.referenceNumber && (
                <p className={`text-sm ${colorClasses.text.muted} mt-0.5 font-mono`}>
                  Ref: {tender.referenceNumber}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {tender?.deadline && (
                  <p className={`text-xs ${colorClasses.text.muted}`}>
                    Deadline:{' '}
                    {new Date(tender.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
                {tender?.status && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClasses.bg.surface} ${colorClasses.text.muted}`}>
                    {tender.status}
                  </span>
                )}
                {isSealed && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`}>
                    🔒 Sealed Tender
                  </span>
                )}
              </div>
            </div>

            {canReveal && (
              <button
                onClick={() => setShowRevealDialog(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-md shrink-0"
                style={{ backgroundColor: accentHex }}
              >
                🔓 Reveal Bids
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BidStatCard
            label="Total Bids"
            value={isLoading ? '—' : stats.total}
            icon={<span>📋</span>}
            colorScheme="blue"
          />
          <BidStatCard
            label={isSealed && !isBidsRevealed ? 'Sealed Bids' : 'Under Review'}
            value={isLoading ? '—' : stats.sealed}
            icon={<span>{isSealed && !isBidsRevealed ? '🔒' : '🔍'}</span>}
            colorScheme="amber"
          />
          <BidStatCard
            label="Shortlisted"
            value={isLoading ? '—' : stats.shortlisted}
            icon={<span>⭐</span>}
            colorScheme="purple"
            subtitle={bids.length > 0 ? 'this page' : undefined}
          />
          <BidStatCard
            label="Awarded"
            value={isLoading ? '—' : stats.awarded}
            icon={<span>🏆</span>}
            colorScheme="emerald"
            subtitle={bids.length > 0 ? 'this page' : undefined}
          />
        </div>

        {/* Sealed banner */}
        {isSealed && tender?.deadline && (
          <SealedBidBanner
            workflowType="closed"
            isRevealed={isBidsRevealed}
            deadline={tender.deadline}
          />
        )}

        {/* Bids grid */}
        {bidsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : bids.length === 0 ? (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} flex flex-col items-center justify-center py-20 text-center px-6`}>
            <p className="text-5xl mb-4">📭</p>
            <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>No bids received yet</h3>
            <p className={`text-sm ${colorClasses.text.muted}`}>Share this tender to attract bidders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bids.map((bid) => (
              <BidCard
                key={bid._id}
                bid={bid}
                tenderWorkflowType={tender?.workflowType ?? 'open'}
                isBidsRevealed={isBidsRevealed}
                deadline={tender?.deadline}
                viewerRole="owner"
                onClick={() =>
                  router.push(`${basePath}/${tenderId}/bids/${bid._id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
};

export default IncomingBidsView;