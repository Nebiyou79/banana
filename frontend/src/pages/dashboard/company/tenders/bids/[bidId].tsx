// pages/dashboard/company/tenders/bids/[bidId].tsx
// Company bidder — full detail view of their own bid
// BUG-07 FIX: TenderDashboardLayout
// BUG-08 FIX: correct route /dashboard/company/tenders/bids/[bidId]
// BUG-13 FIX: simplified resolvedTenderId — always require query param, no circular useEffect

import { useRouter } from 'next/router';
import { TenderDashboardLayout } from '@/components/tenders2.0/layout/TenderDashboardLayout';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { useGetMyBid, useWithdrawBid } from '@/hooks/useBid';
import BidHeader from '@/components/bids/BidHeader';
import SealedBidBanner from '@/components/bids/SealedBidBanner';
import BidderDetails from '@/components/bids/BidderDetails';
import { BidTender } from '@/services/bidService';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse p-5 sm:p-8 space-y-5">
    <div className={`h-20 rounded-2xl ${colorClasses.bg.surface}`} />
    <div className="space-y-4">
      <div className={`h-48 rounded-2xl ${colorClasses.bg.surface}`} />
      <div className={`h-32 rounded-2xl ${colorClasses.bg.surface}`} />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyBidDetailPage() {
  const router = useRouter();
  // BUG-13 FIX: always require tenderId as query param; no circular useEffect
  const { bidId, tenderId } = router.query as { bidId: string; tenderId: string };
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data: bid, isLoading } = useGetMyBid(tenderId ?? '');
  const { mutate: withdraw, isPending: withdrawing } = useWithdrawBid();

  // BUG-13 FIX: if no tenderId in query, redirect rather than run circular useEffect
  if (router.isReady && !tenderId) {
    router.replace('/dashboard/company/tenders/bids');
    return null;
  }

  if (isLoading || !tenderId) {
    return (
      <TenderDashboardLayout>
        <Skeleton />
      </TenderDashboardLayout>
    );
  }

  if (!bid) {
    return (
      <TenderDashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>Bid not found</h3>
          <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
            This bid doesn`t exist or you don`t have permission to view it.
          </p>
          <button
            onClick={() => router.push('/dashboard/company/tenders/bids')}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F1BB03] text-[#0A2540] hover:opacity-90 transition-all"
          >
            ← My Bids
          </button>
        </div>
      </TenderDashboardLayout>
    );
  }

  const tender: BidTender =
    typeof bid.tender === 'object' && '_id' in bid.tender
      ? (bid.tender as BidTender)
      : { _id: tenderId, title: 'Tender', status: '', deadline: '', workflowType: 'open' };

  const isSealed = tender.workflowType === 'closed';
  const isBidsRevealed = ['revealed', 'closed', 'awarded'].includes(tender.status);
  const isBeforeDeadline = tender.deadline ? new Date(tender.deadline) > new Date() : false;
  const canWithdraw = bid.status === 'submitted' && isBeforeDeadline;

  const handleWithdraw = () => {
    withdraw(
      { tenderId, bidId: bid._id },
      { onSuccess: () => router.push('/dashboard/company/tenders/bids') }
    );
  };

  return (
    <TenderDashboardLayout>
      <div className="relative">
        {/* Header */}
        <BidHeader
          bid={bid}
          tender={tender}
          viewerRole="bidder"
          onBack={() => router.push('/dashboard/company/tenders/bids')}
        />

        {/* BUG-08 FIX: all back paths use /dashboard/company/tenders/bids */}
        <div className={`p-5 sm:p-8 space-y-5 ${isMobile ? 'pb-24' : 'pb-8'}`}>
          {isSealed && (
            <SealedBidBanner
              workflowType={tender.workflowType}
              isRevealed={isBidsRevealed}
              deadline={tender.deadline}
            />
          )}

          {/* BidderDetails — 4-tab component */}
          <BidderDetails
            bid={bid}
            tender={tender}
            tenderId={tenderId}
            isBidsRevealed={isBidsRevealed}
          />
        </div>

        {/* Mobile sticky bottom bar */}
        {isMobile && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t ${colorClasses.border.secondary} ${colorClasses.bg.primary} flex gap-3`}
          >
            {canWithdraw ? (
              <>
                <button
                  onClick={() =>
                    router.push(`/dashboard/company/tenders/apply/${tenderId}?edit=${bid._id}`)
                  }
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#F1BB03] text-[#F1BB03] hover:bg-[#F1BB03]/10 transition-all"
                >
                  ✏ Update Bid
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${colorClasses.bg.redLight} ${colorClasses.text.red} disabled:opacity-50 hover:opacity-80 transition-all`}
                >
                  {withdrawing ? 'Withdrawing…' : '↩ Withdraw'}
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/dashboard/company/tenders/bids')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 ${colorClasses.border.secondary} ${colorClasses.text.primary} hover:opacity-80 transition-all`}
              >
                ← My Bids
              </button>
            )}
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
}