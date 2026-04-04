// src/components/bids/BidHeader.tsx
// ══════════════════════════════════════════════════════════════════════
// Dual-role animated header:
//   BIDDER  → Gold (#F1BB03) left-border + gold amount display
//   OWNER   → Teal (#2AA198) left-border + teal accent chips
// Animations: fade-in on mount, pulse on amount, slide-in breadcrumb
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { colorClasses } from '@/utils/color';
import { Bid, BidTender, BidUser, BidCompany } from '@/services/bidService';
import BidStatusBadge from './BidStatusBadge';
import BidderInfo from './BidderInfo';

interface BidHeaderProps {
  bid: Bid;
  tender: BidTender;
  viewerRole: 'bidder' | 'owner';
  onBack: () => void;
  isLoading?: boolean;
}

const fmt = (n: number | null, currency = 'ETB') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) : null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function resolveBidderName(bid: Bid): string {
  if (bid.coverSheet?.companyName?.trim()) return bid.coverSheet.companyName.trim();
  if (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany) {
    const n = (bid.bidderCompany as BidCompany).name?.trim();
    if (n) return n;
  }
  if (bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder) {
    const u = bid.bidder as BidUser;
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    if (name) return name;
  }
  return 'Bidder';
}

export const BidHeader = ({ bid, tender, viewerRole, onBack, isLoading = false }: BidHeaderProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const isSealed  = tender.workflowType === 'closed';
  const amount    = fmt(bid.bidAmount, bid.currency);
  const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;

  // Role-specific theming
  const isBidder = viewerRole === 'bidder';
  const accentColor    = isBidder ? '#F1BB03' : '#2AA198';
  const accentBg       = isBidder ? 'bg-[#F1BB03]'  : 'bg-[#2AA198]';
  const accentText     = isBidder ? 'text-[#F1BB03]' : 'text-[#2AA198]';
  const accentRingFocal = isBidder ? 'ring-[#F1BB03]/30' : 'ring-[#2AA198]/30';

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`sticky top-0 z-20 w-full border-b ${colorClasses.border.secondary} ${colorClasses.bg.primary} backdrop-blur-sm`}
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      >
        <div className="px-4 sm:px-6 py-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="w-1 h-3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 h-3 rounded bg-gray-200 dark:bg-gray-700 max-w-xs" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-700 max-w-sm" />
            <div className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`sticky top-0 z-20 w-full border-b ${colorClasses.border.secondary} ${colorClasses.bg.primary} backdrop-blur-sm transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4">

        {/* Breadcrumb — slides in */}
        <div className={`flex items-center gap-1.5 sm:gap-2 mb-2.5 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onBack}
            className={`flex items-center gap-1 text-xs sm:text-sm font-semibold ${colorClasses.text.muted} hover:${accentText} transition-colors group`}
          >
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
            Back
          </button>
          <span className={`text-xs ${colorClasses.text.muted} opacity-40`}>/</span>
          <span className={`text-xs ${colorClasses.text.muted} truncate max-w-[100px] sm:max-w-[200px]`}>{tender.title}</span>
          <span className={`text-xs ${colorClasses.text.muted} opacity-40`}>/</span>
          <span className={`text-xs font-semibold ${accentText}`}>
            {isBidder ? 'My Bid' : `Bid #${bid.bidNumber ?? bid._id.slice(-6)}`}
          </span>
        </div>

        {/* Main content row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          {/* Left: tender info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-base sm:text-lg font-bold ${colorClasses.text.primary} truncate max-w-[240px] sm:max-w-none`}>
                {tender.title}
              </h1>
              {tender.referenceNumber && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.bg.surface} ${colorClasses.text.muted} font-mono flex-shrink-0`}>
                  Ref: {tender.referenceNumber}
                </span>
              )}
            </div>

            {/* Workflow badge */}
            <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              isSealed
                ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`
                : `${colorClasses.bg.tealLight} ${colorClasses.text.teal}`
            }`}>
              {isSealed ? '🔒 Sealed Tender' : '🔓 Open Tender'}
            </span>
          </div>

          {/* Right: role-specific data */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            {isBidder ? (
              /* ── BIDDER view: gold theme ── */
              <>
                <BidStatusBadge status={bid.status} size="md" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${colorClasses.bg.surface} border ${colorClasses.border.secondary}`}>
                  <div>
                    {isSealed && bid.bidAmount == null ? (
                      <p className={`text-sm font-bold ${colorClasses.text.amber700}`}>🔒 Sealed</p>
                    ) : (
                      <p className={`text-lg sm:text-xl font-black text-[#F1BB03] tabular-nums`}>
                        {amount ?? '—'}
                      </p>
                    )}
                    <p className={`text-xs ${colorClasses.text.muted}`}>
                      Submitted {formatDate(bid.submittedAt)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ── OWNER view: teal theme ── */
              <>
                {/* Bidder info pill */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${colorClasses.bg.surface} border ${colorClasses.border.secondary}`}>
                  <BidderInfo
                    bidder={bid.bidder}
                    company={bid.bidderCompany}
                    coverSheetName={bid.coverSheet?.companyName}
                    size="sm"
                  />
                </div>

                {/* Amount */}
                {isSealed && bid.bidAmount == null ? (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`}>
                    🔒 Sealed
                  </span>
                ) : (
                  <span className={`text-sm font-black text-[#F1BB03] px-3 py-1.5 rounded-xl ${colorClasses.bg.surface} border ${colorClasses.border.secondary}`}>
                    {amount}
                  </span>
                )}

                <BidStatusBadge status={bid.status} size="md" />

                {/* Eval score */}
                {evalScore != null && (
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-[#F1BB03]/20 text-[#F1BB03] whitespace-nowrap">
                    Score: {evalScore.toFixed(1)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Role indicator strip at the very bottom */}
        <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-40 ${accentBg}`} />
      </div>
    </div>
  );
};

export default BidHeader;