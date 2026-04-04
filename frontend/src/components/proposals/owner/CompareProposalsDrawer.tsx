/* eslint-disable @typescript-eslint/no-explicit-any */
// components/proposals/owner/CompareProposalsDrawer.tsx
'use client';
import React from 'react';
import { useProposalDetail } from '@/hooks/useProposal';
import type { Proposal, ProposalStatus } from '@/services/proposalService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposalIds: string[];
  tenderId: string;
  onAction?: (proposalId: string, action: 'awarded' | 'rejected') => void;
}

const fmtBid = (p: Proposal) =>
  `${new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(p.proposedAmount)} ${p.currency}${p.bidType === 'hourly' ? '/hr' : ''}`;

const fmtDelivery = (p: Proposal) =>
  p.deliveryTime ? `${p.deliveryTime.value} ${p.deliveryTime.unit}` : '—';

// Convert delivery to days for comparison
const toDays = (p: Proposal): number => {
  if (!p.deliveryTime) return Infinity;
  const { value, unit } = p.deliveryTime;
  const multipliers: Record<string, number> = { hours: 1/24, days: 1, weeks: 7, months: 30 };
  return value * (multipliers[unit] ?? 1);
};

function ProposalColumn({
  proposalId,
  lowestBid,
  fastestDays,
  onAction,
}: {
  proposalId: string;
  lowestBid: number;
  fastestDays: number;
  onAction?: (id: string, action: 'awarded' | 'rejected') => void;
}) {
  const { data: proposal, isLoading } = useProposalDetail(proposalId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-5">
        <div className="h-12 w-12 rounded-full bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    );
  }

  if (!proposal) return null;

  const freelancer  = proposal.freelancer as any;
  const isLowestBid = proposal.proposedAmount === lowestBid;
  const isFastest   = toDays(proposal) === fastestDays;
  const tender      = proposal.tender as any;
  const tenderSkills: string[] = tender?.skillsRequired ?? [];
  const freelancerSkills: string[] = (proposal.freelancer as any)?.skills ?? [];
  const matchedSkills = freelancerSkills.filter((s) =>
    tenderSkills.some((ts) => ts.toLowerCase() === s.toLowerCase())
  );
  const excerpt = (proposal.coverLetter ?? '').slice(0, 200);

  const canTakeAction = (['submitted', 'under_review', 'shortlisted', 'interview_scheduled'] as ProposalStatus[]).includes(proposal.status);

  return (
    <div className="flex min-w-[200px] flex-1 flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden">

      {/* Header */}
      <div className="border-b border-slate-100 p-4 space-y-3">
        {freelancer?.avatar ? (
          <img src={freelancer.avatar} alt={freelancer.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-base font-bold text-white">
            {freelancer?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{freelancer?.name ?? '—'}</p>
          {(proposal.freelancerProfile as any)?.headline && (
            <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
              {(proposal.freelancerProfile as any).headline}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 space-y-4 p-4">
        {/* Bid */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Bid</p>
          <p className={`text-sm font-bold ${isLowestBid ? 'text-emerald-700' : 'text-slate-800'}`}>
            {fmtBid(proposal)}
            {isLowestBid && <span className="ml-1.5 text-xs font-medium">✓ Lowest</span>}
          </p>
        </div>

        {/* Delivery */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Delivery</p>
          <p className={`text-sm font-bold ${isFastest ? 'text-emerald-700' : 'text-slate-800'}`}>
            {fmtDelivery(proposal)}
            {isFastest && <span className="ml-1.5 text-xs font-medium">✓ Fastest</span>}
          </p>
        </div>

        {/* Matched skills */}
        {tenderSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
              Skills matched ({matchedSkills.length}/{tenderSkills.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {tenderSkills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    matchedSkills.some((ms) => ms.toLowerCase() === s.toLowerCase())
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cover letter excerpt */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Cover letter</p>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
            {excerpt}{proposal.coverLetter && proposal.coverLetter.length > 200 ? '…' : ''}
          </p>
        </div>

        {/* Milestone count */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Milestones</p>
          <p className="text-sm text-slate-700">
            {proposal.milestones?.length > 0 ? `${proposal.milestones.length} milestone${proposal.milestones.length > 1 ? 's' : ''}` : 'None'}
          </p>
        </div>
      </div>

      {/* Actions */}
      {onAction && canTakeAction && (
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() => onAction(proposal._id, 'awarded')}
            className="rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onAction(proposal._id, 'rejected')}
            className="rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export function CompareProposalsDrawer({ isOpen, onClose, proposalIds, tenderId, onAction }: Props) {
  if (!isOpen) return null;

  // We can't call hooks conditionally, so we render ProposalColumn per ID
  // and let each column call its own useProposalDetail hook.

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="flex h-full w-full max-w-4xl flex-col bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-base font-bold text-slate-800">Compare Proposals</p>
            <p className="text-sm text-slate-500">{proposalIds.length} proposal{proposalIds.length > 1 ? 's' : ''} selected</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Column grid — we wrap in a component to isolate hook calls */}
        <div className="flex-1 overflow-y-auto p-6">
          <CompareGrid proposalIds={proposalIds} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}

// Inner component so each column can call useProposalDetail safely
function CompareGrid({
  proposalIds,
  onAction,
}: {
  proposalIds: string[];
  onAction?: (id: string, action: 'awarded' | 'rejected') => void;
}) {
  // We need to fetch all to find lowest bid / fastest delivery
  const p1 = useProposalDetail(proposalIds[0] ?? '');
  const p2 = useProposalDetail(proposalIds[1] ?? '');
  const p3 = useProposalDetail(proposalIds[2] ?? '');
  const p4 = useProposalDetail(proposalIds[3] ?? '');

  const proposals = [p1.data, p2.data, p3.data, p4.data].filter(Boolean) as Proposal[];

  const lowestBid   = Math.min(...proposals.map((p) => p.proposedAmount));
  const fastestDays = Math.min(...proposals.map(toDays));

  return (
    <div className="flex gap-4">
      {proposalIds.slice(0, 4).map((id) => (
        <ProposalColumn
          key={id}
          proposalId={id}
          lowestBid={lowestBid}
          fastestDays={fastestDays}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
