// src/components/bids/MyBidCard.tsx
// ══════════════════════════════════════════════════════════════════════
// Standalone card for a BIDDER viewing their OWN bids.
// Does NOT need tenderId for display — only uses it for the optional
// RFQ download (gracefully disabled if tenderId is empty).
//
// Layout:
//   Header strip  — status-coloured accent
//   Row 1         — Workflow badge (🔒 Sealed / 🔓 Open)  +  Status badge
//   Row 2         — Tender title (bold)  +  Ref number
//   Row 3         — Bid amount (gold) or 🔒 Sealed
//   Row 4         — Submission date · Bid number
//   Row 5 (cond.) — Sealed: live countdown; Revealed: 🔓 chip
//   Row 6 (cond.) — RFQ download button (only when doc exists + tenderId known)
//   Row 7         — "View My Bid →" gold pill
// ══════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Bid, BidCompany } from '@/services/bidService';
import { useDownloadBidDocument } from '@/hooks/useBid';
import BidStatusBadge from './BidStatusBadge';

interface MyBidCardProps {
  bid: Bid;
  /** Optional — only needed for RFQ download. Card renders fine without it. */
  tenderId?: string;
  onClick?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | null, currency = 'ETB') =>
  n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) : null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; isPast: boolean; }
const calcTimeLeft = (target: string): TimeLeft => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast:  false,
  };
};

const STATUS_ACCENT: Record<string, string> = {
  submitted:           '#F59E0B',
  under_review:        '#2563EB',
  shortlisted:         '#2AA198',
  interview_scheduled: '#8B5CF6',
  awarded:             '#F1BB03',
  rejected:            '#A0A0A0',
  withdrawn:           '#A0A0A0',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const MyBidCard = ({ bid, tenderId, onClick }: MyBidCardProps) => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  // Derive tender info
  const tenderObj = typeof bid.tender === 'object' && '_id' in bid.tender ? bid.tender : null;
  const tenderTitle  = (tenderObj as { title?: string })?.title ?? 'Tender';
  const tenderRef    = (tenderObj as { referenceNumber?: string })?.referenceNumber ?? null;
  const workflowType = (tenderObj as { workflowType?: 'open' | 'closed' })?.workflowType ?? 'open';
  const tenderDeadline = (tenderObj as { deadline?: string })?.deadline ?? null;
  const tenderStatus = (tenderObj as { status?: string })?.status ?? '';
  const isSealed = workflowType === 'closed';
  const isBidsRevealed = ['revealed', 'closed', 'awarded'].includes(tenderStatus);

  // Countdown for sealed bids
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    tenderDeadline ? calcTimeLeft(tenderDeadline) : { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  );
  useEffect(() => {
    if (!isSealed || isBidsRevealed || !tenderDeadline) return;
    const t = setInterval(() => setTimeLeft(calcTimeLeft(tenderDeadline)), 1000);
    return () => clearInterval(t);
  }, [isSealed, isBidsRevealed, tenderDeadline]);

  const countdownText = [
    timeLeft.days > 0 && `${timeLeft.days}d`,
    `${String(timeLeft.hours).padStart(2, '0')}h`,
    `${String(timeLeft.minutes).padStart(2, '0')}m`,
    !isMobile && `${String(timeLeft.seconds).padStart(2, '0')}s`,
  ].filter(Boolean).join(' ');

  // RFQ doc
  const rfqDoc = bid.documents?.find((d) => d.documentType === 'opening_page');
  const canDownload = !!rfqDoc && !!tenderId && (!isSealed || isBidsRevealed);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rfqDoc || !tenderId) return;
    downloadDoc({ tenderId, bidId: bid._id, fileName: rfqDoc.fileName });
  };

  // Company name for display
  const companyName =
    bid.coverSheet?.companyName?.trim() ||
    (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany
      ? (bid.bidderCompany as BidCompany).name
      : null);

  const amount = fmt(bid.bidAmount, bid.currency);
  const showAmount = !isSealed || isBidsRevealed;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'relative rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col select-none',
        colorClasses.bg.primary,
        colorClasses.border.secondary,
        onClick
          ? 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40 active:scale-[0.99]'
          : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Status-coloured accent strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: STATUS_ACCENT[bid.status] ?? '#A0A0A0' }} />

      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">

        {/* ── Row 1: Workflow + Status ── */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
            isSealed
              ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`
              : `${colorClasses.bg.tealLight} ${colorClasses.text.teal}`
          }`}>
            {isSealed ? '🔒 Sealed' : '🔓 Open'}
          </span>
          <BidStatusBadge status={bid.status} size="sm" />
        </div>

        {/* ── Row 2: Tender title + ref ── */}
        <div className="min-w-0">
          <p
            className={`text-base font-bold ${colorClasses.text.primary} line-clamp-2 leading-snug`}
            title={tenderTitle}
          >
            {tenderTitle}
          </p>
          {tenderRef && (
            <p className={`text-xs font-mono ${colorClasses.text.muted} mt-0.5`}>
              Ref: {tenderRef}
            </p>
          )}
          {companyName && (
            <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>
              🏢 {companyName}
            </p>
          )}
        </div>

        {/* ── Row 3: Amount ── */}
        <div>
          {showAmount ? (
            <p className="text-2xl font-black text-[#F1BB03] leading-none tabular-nums">
              {amount ?? '—'}
            </p>
          ) : (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${colorClasses.bg.purpleLight} border border-purple-200 dark:border-purple-700`}>
              <span className="text-base">🔒</span>
              <p className={`text-sm font-semibold ${colorClasses.text.purple}`}>Amount Sealed</p>
            </div>
          )}
        </div>

        {/* ── Row 4: Meta ── */}
        <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-xs ${colorClasses.text.muted}`}>
          <span>📅 {formatDate(bid.submittedAt)}</span>
          {bid.bidNumber && <span className="font-mono">#{bid.bidNumber}</span>}
        </div>

        {/* ── Row 5: Sealed countdown / Revealed badge ── */}
        {isSealed && (
          isBidsRevealed ? (
            <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full ${colorClasses.bg.tealLight} ${colorClasses.text.teal}`}>
              🔓 Bids Revealed
            </span>
          ) : !timeLeft.isPast ? (
            <div className={`rounded-xl px-4 py-2.5 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-700 flex items-center justify-between gap-2`}>
              <span className={`text-xs font-medium ${colorClasses.text.amber700}`}>⏳ Reveal in:</span>
              <span className={`text-sm font-black ${colorClasses.text.amber700} tabular-nums`}>{countdownText}</span>
            </div>
          ) : (
            <div className={`rounded-xl px-4 py-2.5 ${colorClasses.bg.amberLight} border border-amber-200 dark:border-amber-700`}>
              <p className={`text-xs font-medium ${colorClasses.text.amber700}`}>⏰ Deadline passed — awaiting reveal</p>
            </div>
          )
        )}

        <div className="flex-1" />

        {/* ── Row 6: RFQ download ── */}
        {rfqDoc && (
          canDownload ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all group',
                colorClasses.border.secondary, colorClasses.bg.surface,
                'hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5 disabled:opacity-50',
              ].join(' ')}
            >
              <span className="text-base flex-shrink-0">📋</span>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-xs font-semibold truncate ${colorClasses.text.primary} group-hover:text-[#2563EB] transition-colors`}>
                  {downloading ? 'Downloading…' : (rfqDoc.originalName ?? 'Download My RFQ')}
                </p>
                <p className={`text-xs ${colorClasses.text.muted}`}>Your submitted quote document</p>
              </div>
              <span className={`text-xs font-bold ${colorClasses.text.muted} group-hover:text-[#2563EB] flex-shrink-0 transition-colors`}>
                {downloading ? '⏳' : '📥'}
              </span>
            </button>
          ) : isSealed && !isBidsRevealed ? (
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${colorClasses.bg.purpleLight} border border-purple-200 dark:border-purple-700`}>
              <span className="text-base flex-shrink-0">🔒</span>
              <p className={`text-xs font-medium ${colorClasses.text.purple}`}>
                Quote sealed until bids are revealed
              </p>
            </div>
          ) : null
        )}

        {/* ── Row 7: View My Bid pill ── */}
        {onClick && (
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-[#F1BB03] text-[#0A2540] hover:bg-[#D9A800] transition-all shadow-md">
              View My Bid →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBidCard;