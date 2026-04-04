// src/components/tender/professional/SealedBidPanel.tsx
import React, { useState } from 'react';
import { useRevealBids, useProfessionalTender } from '@/hooks/useProfessionalTender';
import { colorClasses } from '@/utils/color';
import type { ProfessionalTender } from '@/types/tender.types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'just now';
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    shortlisted: 'bg-blue-100 text-blue-700',
    awarded: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    submitted: 'bg-amber-100 text-amber-700',
    under_review: 'bg-purple-100 text-purple-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize
        ${map[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status?.replace('_', ' ')}
    </span>
  );
};

const CompanyAvatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'sm' }) => {
  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div
      className={`${dim} shrink-0 rounded-full flex items-center justify-center font-bold
        ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
    >
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface SealedBidPanelProps {
  tender: ProfessionalTender;
  isOwner: boolean;
}

const REVEALED_STATUSES = ['revealed', 'closed'];
const SEALED_STATUSES = ['draft', 'published', 'locked'];

// ─────────────────────────────────────────────
// Sub-panels
// ─────────────────────────────────────────────

const SealedOwnerView: React.FC<{ tender: ProfessionalTender }> = ({ tender }) => (
  <div
    className={`flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center
      border-purple-300 bg-purple-50`}
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl">
      🔒
    </div>
    <div>
      <p className="text-lg font-bold text-purple-800">Sealed Bid Tender</p>
      <p className="mt-1 text-sm text-purple-600">
        {tender.bids?.length ?? 0} bid{(tender.bids?.length ?? 0) !== 1 ? 's' : ''} submitted (sealed)
      </p>
      <p className="mt-1 text-xs text-purple-500">
        Bid content is hidden until the reveal phase.
      </p>
    </div>
  </div>
);

const SealedBidderView: React.FC = () => (
  <div
    className={`flex items-start gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4`}
  >
    <span className="text-xl">🔒</span>
    <p className="text-sm font-medium text-amber-800">
      This is a sealed bid tender. Your bid is private until the reveal phase.
    </p>
  </div>
);

const DeadlineReachedOwnerView: React.FC<{
  tender: ProfessionalTender;
  onReveal: () => void;
  isRevealing: boolean;
}> = ({ tender, onReveal, isRevealing }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4
          ${colorClasses.border.amber} ${colorClasses.bg.amber50Light}`}
      >
        <span className="text-xl">⏰</span>
        <div>
          <p className={`font-semibold ${colorClasses.text.amber800}`}>Deadline Passed</p>
          <p className={`text-sm ${colorClasses.text.amber700}`}>
            Deadline passed {tender.deadline ? timeAgo(tender.deadline) : ''}. All bids are sealed
            and ready to reveal.
          </p>
        </div>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className={`w-full rounded-xl py-4 text-base font-bold shadow-lg transition-transform hover:scale-[1.01]
            ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
        >
          🔓 Reveal Bids
        </button>
      ) : (
        <div
          className={`rounded-xl border-2 border-red-300 bg-red-50 p-5 space-y-4`}
        >
          <p className="text-sm font-semibold text-red-800">⚠️ Confirm Reveal</p>
          <p className="text-sm text-red-700">
            Revealing bids is <strong>permanent</strong>. All bidders will be notified. Continue?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium hover:opacity-70
                ${colorClasses.border.gray300} ${colorClasses.text.primary}`}
            >
              Cancel
            </button>
            <button
              onClick={onReveal}
              disabled={isRevealing}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isRevealing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Revealing…
                </span>
              ) : (
                'Yes, Reveal All Bids'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DeadlineReachedBidderView: React.FC = () => (
  <div
    className={`flex items-start gap-3 rounded-xl border p-4
      ${colorClasses.bg.secondary} ${colorClasses.border.gray300}`}
  >
    <span className="text-xl">⏳</span>
    <p className={`text-sm ${colorClasses.text.secondary}`}>
      Bids are being reviewed. Results will be published shortly.
    </p>
  </div>
);

// ─────────────────────────────────────────────
// Revealed Bids Table (Owner)
// ─────────────────────────────────────────────
const BID_STATUSES = ['shortlist', 'award', 'reject'];

const RevealedBidsOwnerView: React.FC<{
  tender: ProfessionalTender;
}> = ({ tender }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rowActions, setRowActions] = useState<Record<string, string>>({});

  const bids: any[] = tender.bids ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-bold ${colorClasses.text.primary}`}>
          All Bids ({bids.length})
        </h3>
        <StatusBadge status={tender.status} />
      </div>

      <div className={`overflow-x-auto rounded-xl border ${colorClasses.border.gray200}`}>
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className={colorClasses.bg.secondary}>
            <tr>
              {['Bidder', 'Bid Amount', 'Technical Summary', 'Status', 'Action'].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-100 ${colorClasses.bg.white}`}>
            {bids.map((bid) => {
              const isExpanded = expandedId === bid._id;
              const currentAction = rowActions[bid._id] ?? '';

              return (
                <React.Fragment key={bid._id}>
                  <tr
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : bid._id)}
                  >
                    {/* Bidder */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CompanyAvatar name={bid.company?.name ?? 'B'} />
                        <span className={`font-medium ${colorClasses.text.primary}`}>
                          {bid.company?.name ?? 'Unknown'}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className={`px-4 py-3 font-semibold ${colorClasses.text.primary}`}>
                      {bid.bidAmount != null
                        ? formatCurrency(bid.bidAmount, bid.currency ?? 'ETB')
                        : '—'}
                    </td>

                    {/* Technical Proposal Excerpt */}
                    <td className={`px-4 py-3 max-w-[200px] ${colorClasses.text.secondary}`}>
                      <span>
                        {bid.technicalProposal
                          ? bid.technicalProposal.slice(0, 50) + (bid.technicalProposal.length > 50 ? '…' : '')
                          : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={bid.status ?? 'submitted'} />
                    </td>

                    {/* Action — stops propagation to row expand */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={currentAction}
                          onChange={(e) =>
                            setRowActions((prev) => ({ ...prev, [bid._id]: e.target.value }))
                          }
                          className={`rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#FFD700]
                            ${colorClasses.border.gray300} ${colorClasses.bg.white} ${colorClasses.text.primary}`}
                        >
                          <option value="">— Action —</option>
                          <option value="shortlist">Shortlist</option>
                          <option value="award">Award</option>
                          <option value="reject">Reject</option>
                        </select>
                        <button
                          disabled={!currentAction}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40
                            ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}`}
                        >
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr className={colorClasses.bg.secondary}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Technical Proposal */}
                          <div>
                            <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}>
                              Technical Proposal
                            </p>
                            <p className={`text-sm leading-relaxed ${colorClasses.text.secondary}`}>
                              {bid.technicalProposal ?? '—'}
                            </p>
                          </div>

                          {/* Financial Proposal */}
                          <div>
                            <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}>
                              Financial Proposal
                            </p>
                            <p className={`text-sm leading-relaxed ${colorClasses.text.secondary}`}>
                              {bid.financialProposal ?? '—'}
                            </p>
                          </div>

                          {/* Attached Documents */}
                          {bid.documents?.length > 0 && (
                            <div className="md:col-span-2">
                              <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}>
                                Documents
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {bid.documents.map((doc: any) => (
                                  <a
                                    key={doc._id ?? doc.url}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:opacity-70"
                                  >
                                    📎 {doc.originalName ?? 'Document'}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Revealed Bids — Bidder (own bid only)
// ─────────────────────────────────────────────
const MyBidCard: React.FC<{ bid: any }> = ({ bid }) => (
  <div
    className={`rounded-2xl border p-5 space-y-3
      ${colorClasses.bg.white} ${colorClasses.border.gray200}`}
  >
    <div className="flex items-center justify-between">
      <p className={`font-bold ${colorClasses.text.primary}`}>My Bid</p>
      <StatusBadge status={bid?.status ?? 'submitted'} />
    </div>

    {bid ? (
      <>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className={`text-xs uppercase tracking-wide font-semibold ${colorClasses.text.muted}`}>
              Bid Amount
            </p>
            <p className={`mt-1 font-semibold ${colorClasses.text.primary}`}>
              {bid.bidAmount != null
                ? formatCurrency(bid.bidAmount, bid.currency ?? 'ETB')
                : '—'}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wide font-semibold ${colorClasses.text.muted}`}>
              Submitted
            </p>
            <p className={`mt-1 ${colorClasses.text.secondary}`}>
              {bid.createdAt ? formatDate(bid.createdAt) : '—'}
            </p>
          </div>
        </div>

        {bid.technicalProposal && (
          <div>
            <p className={`text-xs uppercase tracking-wide font-semibold ${colorClasses.text.muted}`}>
              Technical Proposal
            </p>
            <p className={`mt-1 text-sm leading-relaxed ${colorClasses.text.secondary}`}>
              {bid.technicalProposal}
            </p>
          </div>
        )}

        {bid.financialProposal && (
          <div>
            <p className={`text-xs uppercase tracking-wide font-semibold ${colorClasses.text.muted}`}>
              Financial Proposal
            </p>
            <p className={`mt-1 text-sm leading-relaxed ${colorClasses.text.secondary}`}>
              {bid.financialProposal}
            </p>
          </div>
        )}
      </>
    ) : (
      <p className={`text-sm ${colorClasses.text.muted}`}>You have not submitted a bid.</p>
    )}
  </div>
);

// ─────────────────────────────────────────────
// SealedBidPanel (main)
// ─────────────────────────────────────────────
const SealedBidPanel: React.FC<SealedBidPanelProps> = ({ tender, isOwner }) => {
  const { mutate: revealBids, isPending: isRevealing } = useRevealBids();
  const status = tender.status;

  const handleReveal = () => {
    revealBids(tender._id);
  };

  // ── SEALED statuses ──────────────────────────
  if (SEALED_STATUSES.includes(status)) {
    // CRITICAL: Never render bid content when sealed
    return isOwner ? (
      <SealedOwnerView tender={tender} />
    ) : (
      <SealedBidderView />
    );
  }

  // ── DEADLINE REACHED ─────────────────────────
  if (status === 'deadline_reached') {
    return isOwner ? (
      <DeadlineReachedOwnerView
        tender={tender}
        onReveal={handleReveal}
        isRevealing={isRevealing}
      />
    ) : (
      <DeadlineReachedBidderView />
    );
  }

  // ── REVEALED / CLOSED ────────────────────────
  if (REVEALED_STATUSES.includes(status)) {
    if (isOwner) {
      return <RevealedBidsOwnerView tender={tender} />;
    }

    // Bidder: show only their own bid
    const myBid = tender.bids?.find((b: any) => b.isOwn) ?? (tender as any).myBid ?? null;
    return <MyBidCard bid={myBid} />;
  }

  // Fallback
  return null;
};

export default SealedBidPanel;