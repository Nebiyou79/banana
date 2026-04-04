// pages/dashboard/company/tenders/my-bids/[tenderId]/bids/[bidId].tsx
// Company owner — single bid deep-evaluation page.
// Layout: BidHeader → SealedBidBanner (if sealed) → OwnerBidDetails (4-tab) + ActionSidebar.
// Desktop: 2-column (details | sidebar). Mobile: stacked.
// TenderDashboardLayout.

import { useState } from 'react';
import { useRouter } from 'next/router';
import { TenderDashboardLayout } from '@/components/tenders2.0/layout/TenderDashboardLayout';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { useGetBids, useUpdateBidStatus, useVerifyCPOReturn } from '@/hooks/useBid';
import { useProfessionalTender } from '@/hooks/useProfessionalTender';
import BidHeader from '@/components/bids/BidHeader';
import SealedBidBanner from '@/components/bids/SealedBidBanner';
import OwnerBidDetails from '@/components/bids/Ownerbiddetails';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import { Bid, BidCompany, BidStatus, BidTender, BidUser } from '@/services/bidService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = '#0A2540';
const STATUS_OPTIONS: BidStatus[] = [
  'submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'awarded', 'rejected',
];

// ─────────────────────────────────────────────────────────────────────────────
// Action Sidebar
// ─────────────────────────────────────────────────────────────────────────────

const ActionSidebar = ({ bid, tenderId }: { bid: Bid; tenderId: string }) => {
  const [notes, setNotes] = useState(bid.ownerNotes ?? '');
  const [selectedStatus, setSelectedStatus] = useState<BidStatus>(bid.status);
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateBidStatus();
  const { mutate: cpoReturn, isPending: cpoReturning } = useVerifyCPOReturn();

  const company: BidCompany | null =
    bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany
      ? (bid.bidderCompany as BidCompany) : null;
  const user =
    bid.bidder && typeof bid.bidder === 'object' && 'email' in bid.bidder
      ? (bid.bidder as BidUser) : null;

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : '—';

  const timeline: { label: string; date?: string; icon: string }[] = [
    { label: 'Submitted', date: bid.submittedAt, icon: '📤' },
    ...(bid.reviewedAt ? [{ label: 'Under Review', date: bid.reviewedAt, icon: '🔍' }] : []),
    ...(bid.evaluation?.preliminaryCheckedAt
      ? [{ label: 'Preliminary Check', date: bid.evaluation.preliminaryCheckedAt, icon: '✅' }] : []),
    ...(bid.evaluation?.technicalEvaluatedAt
      ? [{ label: 'Technical Evaluated', date: bid.evaluation.technicalEvaluatedAt, icon: '📊' }] : []),
    ...(bid.evaluation?.financialEvaluatedAt
      ? [{ label: 'Financial Evaluated', date: bid.evaluation.financialEvaluatedAt, icon: '💰' }] : []),
  ];

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      {/* Quick status */}
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${colorClasses.text.muted} mb-3`}>
          Quick Status Update
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={[
                'px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all',
                selectedStatus === s
                  ? 'border-[#F1BB03] bg-[#F1BB03]/10 text-[#F1BB03]'
                  : `${colorClasses.border.secondary} ${colorClasses.text.muted}`,
              ].join(' ')}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <button
          onClick={() => updateStatus({ tenderId, bidId: bid._id, status: selectedStatus, ownerNotes: notes })}
          disabled={updatingStatus || selectedStatus === bid.status}
          className="w-full py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 hover:opacity-90 transition-all"
          style={{ backgroundColor: ACCENT }}
        >
          {updatingStatus ? 'Saving…' : 'Update Status'}
        </button>
      </div>

      {/* Bidder info */}
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${colorClasses.text.muted} mb-3`}>
          Bidder Info
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}
          >
            {(company?.name ?? user?.firstName ?? 'B').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${colorClasses.text.primary} truncate`}>
              {(company?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || 'Bidder'}
            </p>
            {user?.email && (
              <p className={`text-xs ${colorClasses.text.muted} truncate`}>{user.email}</p>
            )}
          </div>
        </div>
        <BidStatusBadge status={bid.status} size="sm" />
      </div>

      {/* Timeline */}
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${colorClasses.text.muted} mb-3`}>
          Bid Timeline
        </p>
        <ol className="space-y-3">
          {timeline.map((entry, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-base leading-none shrink-0">{entry.icon}</span>
              <div>
                <p className={`text-xs font-semibold ${colorClasses.text.primary}`}>{entry.label}</p>
                <p className={`text-xs ${colorClasses.text.muted}`}>{fmtDate(entry.date)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Owner notes — auto-saves on blur */}
      <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${colorClasses.text.muted} mb-2`}>
          Owner Notes
        </p>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== bid.ownerNotes) {
              updateStatus({ tenderId, bidId: bid._id, status: bid.status, ownerNotes: notes });
            }
          }}
          placeholder="Add private notes about this bid…"
          className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-xs px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40`}
        />
      </div>

      {/* CPO return */}
      {bid.cpo && bid.cpo.returnStatus !== 'returned' && (
        <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} p-4`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${colorClasses.text.muted} mb-3`}>
            🏦 CPO Return
          </p>
          <p className={`text-xs ${colorClasses.text.muted} mb-3`}>
            Current: <span className="font-semibold">{bid.cpo.returnStatus ?? 'pending'}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'returned' })}
              disabled={cpoReturning}
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399] hover:opacity-80 disabled:opacity-50 transition-all"
            >
              ✓ Returned
            </button>
            <button
              onClick={() => cpoReturn({ tenderId, bidId: bid._id, returnStatus: 'forfeited' })}
              disabled={cpoReturning}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold ${colorClasses.bg.redLight} ${colorClasses.text.red} hover:opacity-80 disabled:opacity-50 transition-all`}
            >
              ✗ Forfeited
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse p-5 sm:p-8 space-y-5">
    <div className={`h-20 rounded-2xl ${colorClasses.bg.surface}`} />
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        <div className={`h-48 rounded-2xl ${colorClasses.bg.surface}`} />
        <div className={`h-32 rounded-2xl ${colorClasses.bg.surface}`} />
      </div>
      <div className="w-72 space-y-4">
        <div className={`h-40 rounded-2xl ${colorClasses.bg.surface}`} />
        <div className={`h-28 rounded-2xl ${colorClasses.bg.surface}`} />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CompanyOwnerBidDetailPage() {
  const router = useRouter();
  const { tenderId, bidId } = router.query as { tenderId: string; bidId: string };
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data: tenderMeta, isLoading: tenderLoading } = useProfessionalTender(tenderId ?? '');
  const { data: bidsData, isLoading: bidsLoading } = useGetBids(tenderId ?? '');

  const bid: Bid | undefined = bidsData?.bids?.find((b) => b._id === bidId);
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const isSealed = (tenderMeta?.workflowType ?? 'open') === 'closed';

  const tender: BidTender = tenderMeta
    ? {
        _id: tenderMeta._id,
        title: tenderMeta.title,
        status: tenderMeta.status,
        deadline: tenderMeta.deadline,
        workflowType: tenderMeta.workflowType ?? 'open',
        referenceNumber: tenderMeta.referenceNumber,
      }
    : { _id: tenderId ?? '', title: 'Tender', status: '', deadline: '', workflowType: 'open' };

  const backPath = `/dashboard/company/tenders/my-bids/${tenderId}/bids`;

  if (tenderLoading || bidsLoading) {
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
            This bid doesn`t exist or you don`t have access to it.
          </p>
          <button
            onClick={() => router.push(backPath)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#F1BB03] text-[#0A2540] hover:opacity-90 transition-all"
          >
            ← Back to Bids
          </button>
        </div>
      </TenderDashboardLayout>
    );
  }

  return (
    <TenderDashboardLayout>
      {/* Global header strip */}
      <BidHeader
        bid={bid}
        tender={tender}
        viewerRole="owner"
        onBack={() => router.push(backPath)}
      />

      <div className="p-5 sm:p-8">
        {/* Sealed banner */}
        {isSealed && tender.deadline && (
          <div className="mb-5">
            <SealedBidBanner
              workflowType="closed"
              isRevealed={isBidsRevealed}
              deadline={tender.deadline}
            />
          </div>
        )}

        {/* Two-column on desktop */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main — OwnerBidDetails 4-tab panel */}
          <div className="flex-1 min-w-0">
            <OwnerBidDetails
              bid={bid}
              tender={tender}
              tenderId={tenderId}
              isBidsRevealed={isBidsRevealed}
              variant="company"
            />
          </div>

          {/* Sidebar — hidden on mobile */}
          {!isMobile && (
            <div className="w-72 shrink-0">
              <ActionSidebar bid={bid} tenderId={tenderId} />
            </div>
          )}
        </div>

        {/* Mobile: sidebar below main */}
        {isMobile && (
          <div className="mt-6">
            <ActionSidebar bid={bid} tenderId={tenderId} />
          </div>
        )}
      </div>
    </TenderDashboardLayout>
  );
}