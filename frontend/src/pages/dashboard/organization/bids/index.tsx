// pages/dashboard/organization/bids/index.tsx
// Organization owner — "Bids" dashboard.
// Stats header → large TenderBidCard grid (one card per posted tender).
// Sealed card: deadline countdown + sealed bid count.
// Open card: applicant company avatars + names.
// DashboardLayout (not TenderDashboardLayout — org uses base layout).
// Teal accent #0D9488.
// Click → /dashboard/organization/bids/[tenderId]/bids

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { colorClasses } from '@/utils/color';
import { useGetBids } from '@/hooks/useBid';
import { useMyPostedProfessionalTenders } from '@/hooks/useProfessionalTender';
import BidStatCard from '@/components/bids/BidStatCard';
import { Bid, BidCompany, BidUser } from '@/services/bidService';

// ─────────────────────────────────────────────────────────────────────────────
// Live countdown hook
// ─────────────────────────────────────────────────────────────────────────────

interface TimeLeft { days: number; hours: number; minutes: number; isPast: boolean }

function useCountdown(deadline: string): TimeLeft {
  const calc = (): TimeLeft => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isPast: true };
    return {
      days: Math.floor(diff / 864e5),
      hours: Math.floor((diff % 864e5) / 36e5),
      minutes: Math.floor((diff % 36e5) / 6e4),
      isPast: false,
    };
  };
  const [tl, setTl] = useState<TimeLeft>(calc);
  useEffect(() => {
    const id = setInterval(() => setTl(calc()), 60_000);
    return () => clearInterval(id);
  }, [deadline]);
  return tl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bidder identity helpers
// ─────────────────────────────────────────────────────────────────────────────

function getBidderName(bid: Bid): string {
  if (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany)
    return (bid.bidderCompany as BidCompany).name;
  if (bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder) {
    const u = bid.bidder as BidUser;
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Bidder';
  }
  return 'Bidder';
}

function getBidderLogo(bid: Bid): string | null {
  if (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'logo' in bid.bidderCompany)
    return (bid.bidderCompany as BidCompany).logo ?? null;
  return null;
}

const TEAL = '#0D9488';
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ─────────────────────────────────────────────────────────────────────────────
// Status pill map
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  published: 'bg-[#D1FAE5] dark:bg-[#064E3B]/60 text-[#047857] dark:text-[#34D399]',
  open: 'bg-[#D1FAE5] dark:bg-[#064E3B]/60 text-[#047857] dark:text-[#34D399]',
  closed: 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/60 text-[#B91C1C] dark:text-[#FCA5A5]',
  locked: 'bg-[#EDE9FE] dark:bg-[#4C1D95]/60 text-[#6D28D9] dark:text-[#C4B5FD]',
  revealed: 'bg-[#DBEAFE] dark:bg-[#1E3A8A]/60 text-[#1D4ED8] dark:text-[#93C5FD]',
  awarded: 'bg-[#F1BB03]/15 text-[#92400E] dark:text-[#FCD34D]',
  cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sealed card body
// ─────────────────────────────────────────────────────────────────────────────

const SealedCardBody = ({
  deadline,
  bidCount,
  sealedCount,
  isBidsRevealed,
}: {
  deadline: string;
  bidCount: number;
  sealedCount: number;
  isBidsRevealed: boolean;
}) => {
  const tl = useCountdown(deadline);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm" style={{ backgroundColor: TEAL }}>
          <span>📬</span>
          <span>{bidCount} Bid{bidCount !== 1 ? 's' : ''} Received</span>
        </div>
        {isBidsRevealed ? (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#DBEAFE] dark:bg-[#1E3A8A]/60 text-[#1D4ED8] dark:text-[#93C5FD]">
            🔓 Revealed
          </span>
        ) : (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`}>
            🔒 {sealedCount} Sealed
          </span>
        )}
      </div>

      <div className={`rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} px-4 py-3 flex items-center justify-between gap-4`}>
        <div>
          <p className={`text-xs font-medium ${colorClasses.text.muted} mb-0.5`}>Submission Deadline</p>
          <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>{fmtDate(deadline)}</p>
        </div>
        {!tl.isPast ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {[{ v: tl.days, l: 'd' }, { v: tl.hours, l: 'h' }, { v: tl.minutes, l: 'm' }].map(({ v, l }) => (
              <div key={l} className={`flex flex-col items-center px-2 py-1 rounded-lg ${colorClasses.bg.amberLight} min-w-[36px]`}>
                <span className={`text-sm font-bold ${colorClasses.text.amber700} leading-none`}>{v}</span>
                <span className={`text-[9px] ${colorClasses.text.amber700}`}>{l}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs font-bold text-[#EF4444] shrink-0">⏰ Deadline passed</span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Open card body
// ─────────────────────────────────────────────────────────────────────────────

const OpenCardBody = ({ bids, totalBidCount }: { bids: Bid[]; totalBidCount: number }) => {
  const visible = bids.slice(0, 5);
  const overflow = Math.max(0, totalBidCount - 5);

  if (totalBidCount === 0) {
    return (
      <div className={`rounded-xl border border-dashed ${colorClasses.border.secondary} ${colorClasses.bg.surface} px-4 py-5 text-center`}>
        <p className="text-2xl mb-1">📭</p>
        <p className={`text-sm ${colorClasses.text.muted}`}>No bids received yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm" style={{ backgroundColor: TEAL }}>
          <span>📬</span>
          <span>{totalBidCount} Bid{totalBidCount !== 1 ? 's' : ''} Received</span>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#D1FAE5] dark:bg-[#064E3B]/60 text-[#047857] dark:text-[#34D399]">
          🔓 Open
        </span>
      </div>

      <div className={`rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} px-4 py-3`}>
        <p className={`text-xs font-semibold ${colorClasses.text.muted} mb-3`}>Companies that applied</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex -space-x-2">
            {visible.map((bid, i) => {
              const name = getBidderName(bid);
              const logo = getBidderLogo(bid);
              return logo ? (
                <img key={bid._id} src={logo} alt={name} title={name}
                  style={{ zIndex: 10 - i }}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-900 shrink-0"
                />
              ) : (
                <div key={bid._id} title={name}
                  style={{ backgroundColor: TEAL, zIndex: 10 - i }}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-bold text-white shrink-0"
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              );
            })}
            {overflow > 0 && (
              <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold ${colorClasses.bg.secondary} ${colorClasses.text.muted}`}>
                +{overflow}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {visible.slice(0, 3).map((bid) => (
              <span key={bid._id} className={`text-xs ${colorClasses.text.secondary} font-medium leading-tight`}>
                {getBidderName(bid)}
              </span>
            ))}
            {totalBidCount > 3 && (
              <span className={`text-xs ${colorClasses.text.muted}`}>+{totalBidCount - 3} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TenderBidCard (org — teal accent)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TenderBidCard = ({ tender, onClick }: { tender: any; onClick: () => void }) => {
  const { data: bidsData } = useGetBids(tender._id);
  const bidCount = bidsData?.totalBids ?? tender.bidCount ?? 0;
  const sealedCount = bidsData?.sealedBids ?? 0;
  const isBidsRevealed = bidsData?.isBidsRevealed ?? false;
  const bids: Bid[] = bidsData?.bids ?? [];
  const isSealed = (tender.workflowType ?? 'open') === 'closed';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={[
        'rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200',
        colorClasses.bg.primary,
        colorClasses.border.secondary,
        'hover:shadow-lg hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40',
      ].join(' ')}
    >
      <div className="h-1.5" style={{ backgroundColor: isSealed ? '#8B5CF6' : '#0D9488' }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {tender.category && (
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClasses.bg.surface} ${colorClasses.text.muted} mb-1.5`}>
                {tender.category}
              </span>
            )}
            <h3 className={`text-base font-bold ${colorClasses.text.primary} leading-snug line-clamp-2`}>
              {tender.title}
            </h3>
            {tender.referenceNumber && (
              <p className={`text-xs font-mono mt-0.5 ${colorClasses.text.muted}`}>Ref: {tender.referenceNumber}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_PILL[tender.status] ?? STATUS_PILL.draft}`}>
              {tender.status}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSealed ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}` : 'bg-[#CCFBF1] dark:bg-[#0F766E]/40 text-[#0F766E] dark:text-[#2DD4BF]'}`}>
              {isSealed ? '🔒 Sealed' : '🔓 Open'}
            </span>
          </div>
        </div>

        <div className={`h-px mb-4 ${colorClasses.bg.secondary}`} />

        {isSealed ? (
          <SealedCardBody
            deadline={tender.deadline}
            bidCount={bidCount}
            sealedCount={sealedCount}
            isBidsRevealed={isBidsRevealed}
          />
        ) : (
          <OpenCardBody bids={bids} totalBidCount={bidCount} />
        )}

        <div className={`flex items-center justify-between mt-4 pt-3 border-t ${colorClasses.border.secondary}`}>
          <span className={`text-xs ${colorClasses.text.muted}`}>Deadline: {fmtDate(tender.deadline)}</span>
          <span className="text-xs font-bold" style={{ color: TEAL }}>View Bids →</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden animate-pulse`}>
    <div className="h-1.5 bg-gray-200 dark:bg-gray-700" />
    <div className="p-5 space-y-4">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className={`h-2.5 w-1/4 rounded-full ${colorClasses.bg.secondary}`} />
          <div className={`h-5 w-3/4 rounded-full ${colorClasses.bg.secondary}`} />
          <div className={`h-2.5 w-1/3 rounded-full ${colorClasses.bg.secondary}`} />
        </div>
        <div className="space-y-1.5">
          <div className={`h-5 w-16 rounded-full ${colorClasses.bg.secondary}`} />
          <div className={`h-5 w-14 rounded-full ${colorClasses.bg.secondary}`} />
        </div>
      </div>
      <div className={`h-px ${colorClasses.bg.secondary}`} />
      <div className={`h-20 rounded-xl ${colorClasses.bg.secondary}`} />
      <div className={`h-14 rounded-xl ${colorClasses.bg.secondary}`} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: '📝 Draft', value: 'draft' },
  { label: '🔵 Published', value: 'published' },
  { label: '🟢 Open', value: 'open' },
  { label: '🔒 Closed', value: 'closed' },
  { label: '🏆 Awarded', value: 'awarded' },
];

export default function OrgBidsIndexPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useMyPostedProfessionalTenders({
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    limit: 50,
  });

  const tenders = data?.tenders ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return tenders;
    const q = search.toLowerCase();
    return tenders.filter(
      (t) => t.title?.toLowerCase().includes(q) || t.referenceNumber?.toLowerCase().includes(q)
    );
  }, [tenders, search]);

  const stats = useMemo(() => ({
    totalBids: tenders.reduce((s, t) => s + (t.bidCount ?? 0), 0),
    activeTenders: tenders.filter((t) => ['published', 'open'].includes(t.status)).length,
    sealedTenders: tenders.filter((t) => t.workflowType === 'closed').length,
    awardedTenders: tenders.filter((t) => (t.metadata?.bidsByStatus?.awarded ?? 0) > 0).length,
  }), [tenders]);

  return (
    <DashboardLayout requiredRole="organization">
      <div className="p-5 sm:p-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className={`text-2xl font-bold ${colorClasses.text.primary}`}>Incoming Bids</h1>
            <div className="h-1 w-12 rounded-full hidden sm:block" style={{ backgroundColor: TEAL }} />
          </div>
          <p className={`text-sm ${colorClasses.text.muted}`}>
            Monitor bids across all your organisation's posted tenders.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BidStatCard label="Total Bids" value={isLoading ? '—' : stats.totalBids} icon={<span>📬</span>} colorScheme="blue" />
          <BidStatCard label="Active Tenders" value={isLoading ? '—' : stats.activeTenders} icon={<span>🟢</span>} colorScheme="emerald" />
          <BidStatCard label="Sealed Tenders" value={isLoading ? '—' : stats.sealedTenders} icon={<span>🔒</span>} colorScheme="purple" />
          <BidStatCard label="Awarded" value={isLoading ? '—' : stats.awardedTenders} icon={<span>🏆</span>} colorScheme="amber" />
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0',
                  statusFilter === value
                    ? 'text-white'
                    : `${colorClasses.bg.surface} ${colorClasses.text.muted} hover:opacity-80`,
                ].join(' ')}
                style={statusFilter === value ? { backgroundColor: TEAL } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${colorClasses.text.muted}`}>🔍</span>
            <input
              type="text"
              placeholder="Search tenders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm focus:outline-none focus:ring-2 w-full sm:w-64`}
              style={{ '--tw-ring-color': `${TEAL}40` } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} flex flex-col items-center justify-center py-20 text-center px-6`}>
            <p className="text-5xl mb-4">📭</p>
            <h3 className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
              {search ? 'No matching tenders' : 'No tenders posted yet'}
            </h3>
            <p className={`text-sm ${colorClasses.text.muted} mb-6`}>
              {search ? 'Try a different search term.' : 'Post your first tender to start receiving bids.'}
            </p>
            {!search && (
              <button
                onClick={() => router.push('/dashboard/organization/tenders/create')}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                style={{ backgroundColor: TEAL }}
              >
                Post a Tender →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((tender) => (
              <TenderBidCard
                key={tender._id}
                tender={tender}
                onClick={() => router.push(`/dashboard/organization/bids/${tender._id}/bids`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}