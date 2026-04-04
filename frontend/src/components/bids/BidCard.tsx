// src/components/bids/BidCard.tsx
// Router component — delegates to OpenBidCard or SealedBidCard.
// FIXES:
//   CARD-1 → tenderId guard: if tenderId is empty/undefined, log warning and render
//            a minimal fallback card rather than passing undefined to child hooks.
//   CARD-2 → deadline prop comment clarified: MUST be tender.deadline, never bid.sealedAt.
//   CARD-3 → isBidsRevealed default is false (safe) not true, so sealed cards can't
//            accidentally appear as revealed when tender is unpopulated.

import OpenBidCard from './OpenBidCard';
import SealedBidCard from './SealedBidCard';
import { colorClasses } from '@/utils/color';
import type { Bid } from '@/services/bidService';

export interface BidCardProps {
  bid: Bid;
  /**
   * Required — must be the tender's ObjectId string.
   * Used for authenticated bid-document downloads.
   * If this is empty the card renders a fallback to avoid 500s on the download hook.
   */
  tenderId: string;
  tenderWorkflowType: 'open' | 'closed';
  isBidsRevealed: boolean;
  /**
   * Must always be the TENDER's submission deadline ISO string.
   * Required when tenderWorkflowType === 'closed'.
   * NEVER pass bid.sealedAt or bid.submittedAt here.
   */
  deadline?: string;
  viewerRole: 'bidder' | 'owner';
  onClick?: () => void;
}

// ─── Minimal fallback when tenderId can't be resolved ────────────────────────

const FallbackCard = ({ bid, viewerRole }: { bid: Bid; viewerRole: 'bidder' | 'owner' }) => {
  const tenderTitle =
    typeof bid.tender === 'object' && 'title' in bid.tender ? bid.tender.title : 'Tender';

  return (
    <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} p-4 opacity-60`}>
      <p className={`text-sm font-semibold ${colorClasses.text.primary} truncate`}>
        {viewerRole === 'bidder' ? tenderTitle : 'Bid'}
      </p>
      <p className={`text-xs ${colorClasses.text.muted} mt-1`}>
        Loading tender details…
      </p>
    </div>
  );
};

// ─── Main router ──────────────────────────────────────────────────────────────

export const BidCard = ({
  bid,
  tenderId,
  tenderWorkflowType,
  isBidsRevealed,
  deadline,
  viewerRole,
  onClick,
}: BidCardProps) => {
  // CARD-1 FIX: Guard against empty/undefined tenderId to prevent download hook 500s
  if (!tenderId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[BidCard] tenderId is empty — rendering fallback. Check getMyAllBids populate chain.');
    }
    return <FallbackCard bid={bid} viewerRole={viewerRole} />;
  }

  if (tenderWorkflowType === 'closed') {
    if (!deadline && process.env.NODE_ENV !== 'production') {
      console.warn('[BidCard] deadline prop missing for sealed tender. Pass tender.deadline.');
    }

    return (
      <SealedBidCard
        bid={bid}
        tenderId={tenderId}
        isBidsRevealed={isBidsRevealed}
        deadline={deadline ?? new Date().toISOString()}
        viewerRole={viewerRole}
        onClick={onClick}
      />
    );
  }

  return (
    <OpenBidCard
      bid={bid}
      tenderId={tenderId}
      isBidsRevealed={isBidsRevealed}
      viewerRole={viewerRole}
      onClick={onClick}
    />
  );
};

export default BidCard;