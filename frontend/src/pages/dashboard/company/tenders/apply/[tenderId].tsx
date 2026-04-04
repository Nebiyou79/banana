// pages/dashboard/company/tenders/apply/[tenderId].tsx
// Company bidder — submit / update a bid for a professional tender
// BUG-01 FIX: useProfessionalTender imported as NAMED export
// BUG-07 FIX: TenderDashboardLayout
// BUG-08 FIX: correct route paths

import { useRouter } from 'next/router';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
// BUG-01 FIX: named import — NOT default import
import { useProfessionalTender } from '@/hooks/useProfessionalTender';
import { useGetMyBid } from '@/hooks/useBid';
import BidForm from '@/components/bids/BidForm';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <div
      className="w-10 h-10 rounded-full animate-spin"
      style={{ border: '2px solid #E5E5E5', borderTopColor: '#0A2540' }}
    />
    <p className={`text-sm ${colorClasses.text.muted}`}>Loading tender…</p>
  </div>
);

export default function BidPage() {
  const router = useRouter();
  const { tenderId } = router.query as { tenderId: string };
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId);
  const { data: existingBid, hasBid } = useGetMyBid(tenderId);

  if (!tenderId || tenderLoading) {
    return (
      <TenderDashboardLayout>
        <LoadingSpinner />
      </TenderDashboardLayout>
    );
  }

  if (!tender) {
    return (
      <TenderDashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>Tender not found</h3>
          <button
            onClick={() => router.push('/dashboard/company/tenders')}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F1BB03] text-[#0A2540] hover:opacity-90 transition-all"
          >
            ← Browse Tenders
          </button>
        </div>
      </TenderDashboardLayout>
    );
  }

  // Guard: tender no longer accepting bids
  const isClosed = ['closed', 'awarded'].includes(tender.status);
  const isPastDeadline = tender.deadline ? new Date(tender.deadline) < new Date() : false;

  if (isClosed || (isPastDeadline && !hasBid)) {
    return (
      <TenderDashboardLayout >
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
            This tender is no longer accepting bids
          </h3>
          <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
            {isClosed ? 'The tender has been closed or awarded.' : 'The submission deadline has passed.'}
          </p>
          <button
            onClick={() => router.push(`/dashboard/company/tenders/${tenderId}`)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F1BB03] text-[#0A2540] hover:opacity-90 transition-all"
          >
            View Tender
          </button>
        </div>
      </TenderDashboardLayout>
    );
  }

  return (
    <TenderDashboardLayout>
      {/* Full page layout: max-width centered */}
      <div className="p-5 sm:p-8">
        {/* Back + page header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-1 text-sm font-medium ${colorClasses.text.muted} hover:${colorClasses.text.primary} mb-3 transition-colors`}
          >
            ← Back
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className={`text-xl font-bold ${colorClasses.text.primary}`}>
                {hasBid ? 'Update Your Bid' : 'Submit a Bid'}
              </h1>
              <p className={`text-sm ${colorClasses.text.muted} mt-0.5`}>
                {tender.title}
                {tender.referenceNumber && (
                  <span className="ml-2 font-mono opacity-70">Ref: {tender.referenceNumber}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  tender.workflowType === 'closed'
                    ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`
                    : `${colorClasses.bg.tealLight} ${colorClasses.text.teal}`
                }`}
              >
                {tender.workflowType === 'closed' ? '🔒 Sealed Tender' : '🔓 Open Tender'}
              </span>
              {tender.deadline && (
                <span className={`text-xs px-3 py-1.5 rounded-full ${colorClasses.bg.surface} ${colorClasses.text.muted}`}>
                  Deadline: {new Date(tender.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active bid guard — already has a bid, redirect to view/update */}
        {hasBid && existingBid && existingBid.status !== 'withdrawn' && existingBid.status !== 'submitted' && (
          <div className={`mb-6 rounded-2xl border border-[#F1BB03]/40 bg-[#F1BB03]/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div>
                <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>
                  You have an active bid for this tender
                </p>
                <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>
                  Status: <span className="font-semibold">{existingBid.status.replace(/_/g, ' ')}</span> — you can only update bids with "submitted" status.
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                router.push(
                  `/dashboard/company/tenders/bids/${existingBid._id}?tenderId=${tenderId}`
                )
              }
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:opacity-90 transition-all"
            >
              View My Bid →
            </button>
          </div>
        )}

        {/* Bid form container */}
        <div
          className={[
            'rounded-2xl overflow-hidden shadow-sm',
            colorClasses.bg.primary,
            `border ${colorClasses.border.secondary}`,
            isMobile ? '' : 'max-w-3xl mx-auto',
          ].join(' ')}
        >
          <BidForm
            tenderId={tenderId}
            tender={tender}
            existingBid={hasBid ? existingBid : null}
            onSuccess={() =>
              router.push('/dashboard/company/tenders/bids')
            }
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </TenderDashboardLayout>
  );
}