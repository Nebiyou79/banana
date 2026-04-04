// src/components/bids/OpenBidCard.tsx
// ══════════════════════════════════════════════════════════════════════
// LAYOUT (per spec):
//   Row 1 — Status badge  +  tender title  +  ref (bidder view)
//            OR status badge + bidder company name (owner view)
//   Row 2 — Bid amount (gold)
//   Row 3 — Submission date · bid number
//   Row 4 — (owner only) eval score / compliance / CPO chips
//   Row 5 — RFQ / Quote document download button (secure hook)
//   Row 6 — "View Details →" gold pill
// FIXES:
//   FIX-C1  "Unknown Bidder" — show from coverSheet.companyName as first
//            fallback (populated even when bidderCompany is not).
//   FIX-C2  Download uses useDownloadBidDocument (auth-safe, no bare href).
//   FIX-C3  "View Details →" pill has explicit gold colour visible in both modes.
// ══════════════════════════════════════════════════════════════════════

import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Bid, BidCompany, BidUser } from '@/services/bidService';
import { useDownloadBidDocument } from '@/hooks/useBid';
import BidStatusBadge from './BidStatusBadge';

interface OpenBidCardProps {
  bid: Bid;
  tenderId: string;
  isBidsRevealed: boolean;
  viewerRole: 'bidder' | 'owner';
  onClick?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | null, currency = 'ETB') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) : null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const accentColor: Record<string, string> = {
  submitted: '#F59E0B',
  under_review: '#2563EB',
  shortlisted: '#2AA198',
  interview_scheduled: '#8B5CF6',
  awarded: '#F1BB03',
  rejected: '#A0A0A0',
  withdrawn: '#A0A0A0',
};

// FIX-C1: Resolve bidder display name from multiple sources, most reliable first.
function resolveBidderName(bid: Bid): string {
  // 1. CoverSheet company name — always populated when bidder filled the form
  if (bid.coverSheet?.companyName?.trim()) return bid.coverSheet.companyName.trim();
  // 2. Populated bidderCompany object
  if (
    bid.bidderCompany &&
    typeof bid.bidderCompany === 'object' &&
    'name' in bid.bidderCompany &&
    (bid.bidderCompany as BidCompany).name?.trim()
  ) return (bid.bidderCompany as BidCompany).name.trim();
  // 3. Populated bidder user object
  if (bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder) {
    const u = bid.bidder as BidUser;
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    if (name) return name;
  }
  return 'Bidder';
}

function resolveBidderLogo(bid: Bid): string | null {
  if (
    bid.bidderCompany &&
    typeof bid.bidderCompany === 'object' &&
    'logo' in bid.bidderCompany
  ) return (bid.bidderCompany as BidCompany).logo ?? null;
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const OpenBidCard = ({ bid, tenderId, viewerRole, onClick }: OpenBidCardProps) => {
  const { isTouch, getTouchTargetSize } = useResponsive();
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  const amount = fmt(bid.bidAmount, bid.currency);
  const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;
  const complianceItems = bid.complianceChecklist ?? [];
  const allCompliant = complianceItems.length > 0 && complianceItems.every((c) => c.submitted);
  const cpoReturn = bid.cpo?.returnStatus;

  // Quote / RFQ document submitted by the bidder
  const quoteDoc = bid.documents?.find((d) => d.documentType === 'opening_page');

  // Tender info (from populated object)
  const tenderObj = typeof bid.tender === 'object' && '_id' in bid.tender ? bid.tender : null;
  const tenderTitle = (tenderObj as { title?: string })?.title ?? null;
  const tenderRef = (tenderObj as { referenceNumber?: string })?.referenceNumber ?? null;

  // Bidder name + avatar
  const bidderName = resolveBidderName(bid);
  const bidderLogo = resolveBidderLogo(bid);
  const bidderInitial = bidderName.charAt(0).toUpperCase();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!quoteDoc || !tenderId) return;
    downloadDoc({ tenderId, bidId: bid._id, fileName: quoteDoc.fileName });
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'relative rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col',
        colorClasses.bg.primary,
        colorClasses.border.secondary,
        onClick
          ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40'
          : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Status accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor[bid.status] ?? '#A0A0A0' }} />

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* ── Row 1: Header ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {viewerRole === 'bidder' ? (
              /* Bidder view: show tender they bid on */
              <>
                <p className={`text-sm font-bold ${colorClasses.text.primary} line-clamp-2`} title={tenderTitle ?? 'Tender'}>
                  {tenderTitle ?? 'Tender'}
                </p>
                {tenderRef && (
                  <p className={`text-xs ${colorClasses.text.muted} font-mono mt-0.5`}>Ref: {tenderRef}</p>
                )}
              </>
            ) : (
              /* Owner view: show the bidding company */
              <div className="flex items-center gap-2.5">
                {bidderLogo ? (
                  <img src={bidderLogo} alt={bidderName} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#F1BB03]/20 flex items-center justify-center text-sm font-black text-[#F1BB03] flex-shrink-0">
                    {bidderInitial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${colorClasses.text.primary} truncate`} title={bidderName}>
                    {bidderName}
                  </p>
                  {bid.bidNumber && (
                    <p className={`text-xs font-mono ${colorClasses.text.muted}`}>#{bid.bidNumber}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <BidStatusBadge status={bid.status} size="sm" />
          </div>
        </div>

        {/* ── Row 2: Bid amount ── */}
        <div>
          <p className="text-2xl font-black text-[#F1BB03] leading-none">
            {amount ?? '—'}
          </p>
          {viewerRole === 'bidder' && bidderName !== 'Bidder' && (
            <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>by {bidderName}</p>
          )}
        </div>

        {/* ── Row 3: Meta ── */}
        <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-xs ${colorClasses.text.muted}`}>
          <span>📅 {formatDate(bid.submittedAt)}</span>
          {viewerRole === 'bidder' && bid.bidNumber && (
            <span className="font-mono">#{bid.bidNumber}</span>
          )}
          <span className="px-1.5 py-0.5 rounded-full bg-[#2AA198]/15 text-[#2AA198] font-semibold">
            🔓 Open
          </span>
        </div>

        {/* ── Row 4: Owner chips ── */}
        {viewerRole === 'owner' && (
          <div className="flex flex-wrap gap-1.5">
            {evalScore != null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F1BB03]/20 text-[#F1BB03]">
                Score: {evalScore.toFixed(1)}
              </span>
            )}
            {complianceItems.length > 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allCompliant ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]' : `${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`}`}>
                {allCompliant ? '✅ Compliant' : '⚠ Docs pending'}
              </span>
            )}
            {bid.cpo && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClasses.bg.tealLight} ${colorClasses.text.teal}`}>
                🏦 CPO
              </span>
            )}
            {cpoReturn && cpoReturn !== 'pending' && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cpoReturn === 'returned' ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]' : `${colorClasses.bg.redLight} ${colorClasses.text.red}`}`}>
                CPO: {cpoReturn}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Row 5: RFQ / Quote document ── */}
        {quoteDoc ? (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !tenderId}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all group',
              colorClasses.border.secondary,
              colorClasses.bg.surface,
              'hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5 disabled:opacity-50 disabled:cursor-not-allowed',
              isTouch ? getTouchTargetSize('sm') : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="text-base flex-shrink-0">📋</span>
            <div className="flex-1 min-w-0 text-left">
              <p className={`text-xs font-semibold truncate ${colorClasses.text.primary} group-hover:text-[#2563EB] transition-colors`}>
                {downloading ? 'Downloading…' : (quoteDoc.originalName ?? 'Download RFQ')}
              </p>
              <p className={`text-xs ${colorClasses.text.muted}`}>
                {viewerRole === 'owner' ? "Bidder's submitted quote" : 'Your submitted quote'}
              </p>
            </div>
            <span className={`text-xs ${colorClasses.text.muted} group-hover:text-[#2563EB] flex-shrink-0 transition-colors font-bold`}>
              {downloading ? '⏳' : '📥'}
            </span>
          </button>
        ) : (
          viewerRole === 'owner' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed ${colorClasses.border.secondary} opacity-40`}>
              <span className="text-sm opacity-60">📋</span>
              <p className={`text-xs ${colorClasses.text.muted} italic`}>No quote document</p>
            </div>
          )
        )}

        {/* ── Row 6: View Details pill ── */}
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
};

export default OpenBidCard;