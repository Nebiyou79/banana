// src/components/bids/SealedBidCard.tsx
// ══════════════════════════════════════════════════════════════════════
// SEALED STATE layout:
//   Row 1 — Status badge + tender title + ref (bidder) OR bidder company (owner)
//   Row 2 — Amount: 🔒 Sealed
//   Row 3 — Submission date · bid number
//   Row 4 — Countdown to deadline (live) OR "deadline passed" pill
//   Row 5 — Quote doc: 🔒 locked placeholder
//   Row 6 — View My Bid → (bidder always) / View Details → (owner after deadline)
//
// REVEALED STATE layout:
//   Row 1 — Status badge + 🔓 Revealed chip + tender title/bidder
//   Row 2 — Amount (gold, now visible)
//   Row 3 — Meta
//   Row 4 — Owner chips (score, compliance, CPO)
//   Row 5 — Quote doc: Download button (secure hook)
//   Row 6 — View Details →
//
// FIXES:
//   FIX-S1  Bidder name resolved from coverSheet.companyName first (same as OpenBidCard)
//   FIX-S2  Download only appears after reveal (isBidsRevealed=true)
//   FIX-S3  View Details only appears after reveal for sealed; always for bidder
//   FIX-S4  View Details pill is solid gold (#F1BB03 bg) — never invisible
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Bid, BidCompany, BidUser } from '@/services/bidService';
import { useDownloadBidDocument } from '@/hooks/useBid';
import BidStatusBadge from './BidStatusBadge';

interface SealedBidCardProps {
  bid: Bid;
  tenderId: string;
  isBidsRevealed: boolean;
  /** Must be tender.deadline ISO string — NEVER bid.sealedAt */
  deadline: string;
  viewerRole: 'bidder' | 'owner';
  onClick?: () => void;
}

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; isPast: boolean; }

const calcTimeLeft = (target: string): TimeLeft => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: false,
  };
};

const fmt = (n: number | null, currency = 'ETB') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) : null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const accentColor: Record<string, string> = {
  submitted: '#F59E0B', under_review: '#2563EB', shortlisted: '#2AA198',
  interview_scheduled: '#8B5CF6', awarded: '#F1BB03', rejected: '#A0A0A0', withdrawn: '#A0A0A0',
};

// FIX-S1: same multi-source resolver as OpenBidCard
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

function resolveBidderLogo(bid: Bid): string | null {
  if (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'logo' in bid.bidderCompany)
    return (bid.bidderCompany as BidCompany).logo ?? null;
  return null;
}

export const SealedBidCard = ({ bid, tenderId, isBidsRevealed, deadline, viewerRole, onClick }: SealedBidCardProps) => {
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(deadline));

  useEffect(() => {
    if (isBidsRevealed) return;
    const t = setInterval(() => setTimeLeft(calcTimeLeft(deadline)), 1000);
    return () => clearInterval(t);
  }, [deadline, isBidsRevealed]);

  const quoteDoc = bid.documents?.find((d) => d.documentType === 'opening_page');
  const bidderName = resolveBidderName(bid);
  const bidderLogo = resolveBidderLogo(bid);
  const bidderInitial = bidderName.charAt(0).toUpperCase();
  const tenderObj = typeof bid.tender === 'object' && '_id' in bid.tender ? bid.tender : null;
  const tenderTitle = (tenderObj as { title?: string })?.title ?? null;
  const tenderRef = (tenderObj as { referenceNumber?: string })?.referenceNumber ?? null;

  const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;
  const complianceItems = bid.complianceChecklist ?? [];
  const allCompliant = complianceItems.length > 0 && complianceItems.every((c) => c.submitted);
  const cpoReturn = bid.cpo?.returnStatus;

  const countdownText = [
    timeLeft.days > 0 && `${timeLeft.days}d`,
    `${String(timeLeft.hours).padStart(2,'0')}h`,
    `${String(timeLeft.minutes).padStart(2,'0')}m`,
    !isMobile && `${String(timeLeft.seconds).padStart(2,'0')}s`,
  ].filter(Boolean).join(' ');

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quoteDoc || !tenderId) return;
    downloadDoc({ tenderId, bidId: bid._id, fileName: quoteDoc.fileName });
  };

  // ── BidderRow — reused in both states ────────────────────────────────────
  const BidderRow = () => (
    viewerRole === 'bidder' ? (
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${colorClasses.text.primary} line-clamp-2`}>{tenderTitle ?? 'Tender'}</p>
        {tenderRef && <p className={`text-xs ${colorClasses.text.muted} font-mono mt-0.5`}>Ref: {tenderRef}</p>}
      </div>
    ) : (
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {bidderLogo ? (
          <img src={bidderLogo} alt={bidderName} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-sm font-black text-[#8B5CF6] flex-shrink-0">
            {bidderInitial}
          </div>
        )}
        <div className="min-w-0">
          <p className={`text-sm font-bold ${colorClasses.text.primary} truncate`}>{bidderName}</p>
          {bid.bidNumber && <p className={`text-xs font-mono ${colorClasses.text.muted}`}>#{bid.bidNumber}</p>}
        </div>
      </div>
    )
  );

  // ═══════════════════════════════════════════════════════════════
  // STATE B: REVEALED
  // ═══════════════════════════════════════════════════════════════
  if (isBidsRevealed) {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        className={[
          'relative rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col',
          colorClasses.bg.primary, colorClasses.border.secondary,
          onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40' : '',
        ].filter(Boolean).join(' ')}
      >
        <div className="h-1 w-full" style={{ backgroundColor: accentColor[bid.status] ?? '#2AA198' }} />

        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Row 1 */}
          <div className="flex items-start justify-between gap-2">
            <BidderRow />
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <BidStatusBadge status={bid.status} size="sm" />
              <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses.bg.tealLight} ${colorClasses.text.teal} font-semibold`}>
                🔓 Revealed
              </span>
            </div>
          </div>

          {/* Row 2: Amount now visible */}
          <p className="text-2xl font-black text-[#F1BB03] leading-none">
            {fmt(bid.bidAmount, bid.currency) ?? '—'}
          </p>

          {/* Row 3: Meta */}
          <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-xs ${colorClasses.text.muted}`}>
            <span>📅 {formatDate(bid.submittedAt)}</span>
            {viewerRole === 'bidder' && bid.bidNumber && <span className="font-mono">#{bid.bidNumber}</span>}
          </div>

          {/* Row 4: Owner chips */}
          {viewerRole === 'owner' && (
            <div className="flex flex-wrap gap-1.5">
              {evalScore != null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F1BB03]/20 text-[#F1BB03]">
                  Score: {evalScore.toFixed(1)}
                </span>
              )}
              {complianceItems.length > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allCompliant ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]' : `${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`}`}>
                  {allCompliant ? '✅ Compliant' : '⚠ Pending'}
                </span>
              )}
              {bid.cpo && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClasses.bg.tealLight} ${colorClasses.text.teal}`}>🏦 CPO</span>}
              {cpoReturn && cpoReturn !== 'pending' && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cpoReturn === 'returned' ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]' : `${colorClasses.bg.redLight} ${colorClasses.text.red}`}`}>
                  CPO: {cpoReturn}
                </span>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Row 5: Quote doc — now downloadable */}
          {quoteDoc ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !tenderId}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all group',
                colorClasses.border.secondary, colorClasses.bg.surface,
                'hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5 disabled:opacity-50',
                isTouch ? getTouchTargetSize('sm') : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="text-base flex-shrink-0">📋</span>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-xs font-semibold truncate ${colorClasses.text.primary} group-hover:text-[#2563EB] transition-colors`}>
                  {downloading ? 'Downloading…' : (quoteDoc.originalName ?? 'Download RFQ')}
                </p>
                <p className={`text-xs ${colorClasses.text.muted}`}>
                  {viewerRole === 'owner' ? "Bidder's submitted quote (now revealed)" : 'Your submitted quote'}
                </p>
              </div>
              <span className={`text-xs font-bold ${colorClasses.text.muted} group-hover:text-[#2563EB] flex-shrink-0`}>
                {downloading ? '⏳' : '📥'}
              </span>
            </button>
          ) : (
            viewerRole === 'owner' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed ${colorClasses.border.secondary} opacity-40`}>
                <span className="text-sm">📋</span>
                <p className={`text-xs ${colorClasses.text.muted} italic`}>No quote document</p>
              </div>
            )
          )}

          {/* Row 6: View Details — FIX-S4: solid gold pill */}
          {onClick && (
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-[#F1BB03] text-[#0A2540] hover:bg-[#D9A800] transition-all shadow-sm">
                View Details →
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE A: SEALED (not yet revealed)
  // ═══════════════════════════════════════════════════════════════
  // Bidder can always view their own bid
  // Owner can only click after deadline has passed
  const ownerCanClick = viewerRole === 'owner' && timeLeft.isPast && !!onClick;
  const bidderCanClick = viewerRole === 'bidder' && !!onClick;
  const isClickable = ownerCanClick || bidderCanClick;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick!() : undefined}
      className={[
        'relative rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col',
        colorClasses.bg.primary, colorClasses.border.secondary,
        isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40' : 'cursor-default',
      ].filter(Boolean).join(' ')}
    >
      {/* Purple sealed strip */}
      <div className="h-1 w-full" style={{ backgroundColor: '#8B5CF6' }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Row 1 */}
        <div className="flex items-start justify-between gap-2">
          <BidderRow />
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <BidStatusBadge status={bid.status} size="sm" />
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`}>
              🔒 Sealed
            </span>
          </div>
        </div>

        {/* Row 2: Amount sealed */}
        <div className={`rounded-xl px-4 py-3 ${colorClasses.bg.surface} border ${colorClasses.border.secondary} flex items-center gap-3`}>
          <span className="text-xl flex-shrink-0">🔒</span>
          <div>
            <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>Bid Amount: Sealed</p>
            <p className={`text-xs ${colorClasses.text.muted}`}>Visible after bids are revealed</p>
          </div>
        </div>

        {/* Row 3: Meta */}
        <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-xs ${colorClasses.text.muted}`}>
          <span>📅 {formatDate(bid.submittedAt)}</span>
          {bid.bidNumber && <span className="font-mono">#{bid.bidNumber}</span>}
        </div>

        {/* Row 4: Countdown / past message */}
        {!timeLeft.isPast ? (
          <div className={`rounded-xl px-4 py-2.5 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-700 flex items-center justify-between gap-2`}>
            <span className={`text-xs font-medium ${colorClasses.text.amber700}`}>⏳ Reveal in:</span>
            <span className={`text-sm font-black ${colorClasses.text.amber700} tabular-nums`}>{countdownText}</span>
          </div>
        ) : (
          <div className={`rounded-xl px-4 py-2.5 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-700`}>
            <p className={`text-xs font-medium ${colorClasses.text.amber700}`}>⏰ Deadline passed — awaiting owner to reveal bids</p>
          </div>
        )}

        <div className="flex-1" />

        {/* Row 5: Quote doc — locked */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${colorClasses.bg.purpleLight} border border-purple-200 dark:border-purple-700`}>
          <span className="text-xl flex-shrink-0">🔒</span>
          <div>
            <p className={`text-sm font-semibold ${colorClasses.text.purple}`}>
              {quoteDoc ? 'Quote Document Sealed' : 'No Quote Document'}
            </p>
            <p className={`text-xs ${colorClasses.text.muted}`}>
              {viewerRole === 'owner' ? 'Available after bids are revealed' : 'Your quote is on file — visible after reveal'}
            </p>
          </div>
        </div>

        {/* Row 6: View button — FIX-S3/S4: bidder always, owner only after deadline */}
        {isClickable && (
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-[#F1BB03] text-[#0A2540] hover:bg-[#D9A800] transition-all shadow-sm">
              {viewerRole === 'bidder' ? 'View My Bid →' : 'View Details →'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SealedBidCard;