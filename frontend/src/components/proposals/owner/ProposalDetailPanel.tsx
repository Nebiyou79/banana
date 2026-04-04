/* eslint-disable @typescript-eslint/no-explicit-any */
// components/proposals/owner/ProposalDetailPanel.tsx
'use client';
import React from 'react';
import { ProposalStatusBadge }    from './shared/ProposalStatusBadge';
import { ProposalBidSummary }     from './shared/ProposalBidSummary';
import { MilestoneTimeline }      from './shared/MilestoneTimeline';
import { ScreeningAnswersView }   from './shared/ScreeningAnswersView';
import { ProposalAttachmentList } from './shared/ProposalAttachmentList';
import { FreelancerProfilePreview } from './FreelancerProfilePreview';
import type { Proposal, ProposalStatus } from '@/services/proposalService';

interface Props {
  proposal: Proposal;
  onStatusUpdate: (status: ProposalStatus, data?: Record<string, unknown>) => void;
  onShortlist: () => void;
  isUpdatingStatus?: boolean;
}

const ShortlistButton = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
      active
        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        : 'border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600'
    }`}
  >
    {active ? '⭐ Shortlisted' : '☆ Shortlist'}
  </button>
);

export function ProposalDetailPanel({ proposal, onStatusUpdate, onShortlist, isUpdatingStatus }: Props) {
  const freelancer = proposal.freelancer as any;
  const profile    = proposal.freelancerProfile as any;
  const tender     = proposal.tender as any;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {freelancer?.avatar ? (
            <img src={freelancer.avatar} alt={freelancer.name} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xl font-bold text-white">
              {freelancer?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-slate-800">{freelancer?.name ?? 'Unknown Freelancer'}</p>
            <p className="text-sm text-slate-500">{freelancer?.location ?? ''}</p>
            <div className="mt-1.5">
              <ProposalStatusBadge status={proposal.status} size="md" />
            </div>
          </div>
        </div>

        <ShortlistButton active={proposal.isShortlisted} onClick={onShortlist} />
      </div>

      {/* ── Bid Summary ─────────────────────────────────────────────────── */}
      <ProposalBidSummary proposal={proposal} layout="card" />

      {/* ── Cover Letter ────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Cover Letter</h3>
        {proposal.coverLetterHtml ? (
          <div
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: proposal.coverLetterHtml }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
            {proposal.coverLetter}
          </p>
        )}
      </section>

      {/* ── Milestones ──────────────────────────────────────────────────── */}
      {proposal.milestones && proposal.milestones.length > 0 && (
        <section>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Milestones</h3>
          <MilestoneTimeline
            milestones={proposal.milestones}
            currency={proposal.currency}
            totalBid={proposal.proposedAmount}
          />
        </section>
      )}

      {/* ── Proposal Plan ───────────────────────────────────────────────── */}
      {proposal.proposalPlan && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Work Plan</h3>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
              {proposal.proposalPlan}
            </p>
          </div>
        </section>
      )}

      {/* ── Screening Answers ───────────────────────────────────────────── */}
      {proposal.screeningAnswers && proposal.screeningAnswers.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Screening Answers</h3>
          <ScreeningAnswersView answers={proposal.screeningAnswers} />
        </section>
      )}

      {/* ── Attachments ─────────────────────────────────────────────────── */}
      {proposal.attachments && proposal.attachments.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Attachments</h3>
          <ProposalAttachmentList attachments={proposal.attachments} />
        </section>
      )}

      {/* ── Freelancer Profile Preview ───────────────────────────────────── */}
      {profile && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">About the Freelancer</h3>
          <FreelancerProfilePreview freelancerProfile={profile} user={freelancer} />
        </section>
      )}

      {/* ── Action Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        {proposal.status === 'submitted' && (
          <button
            onClick={() => onStatusUpdate('under_review')}
            disabled={isUpdatingStatus}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            Mark Under Review
          </button>
        )}
        {(proposal.status === 'under_review' || proposal.status === 'submitted') && (
          <button
            onClick={() => onStatusUpdate('shortlisted')}
            disabled={isUpdatingStatus}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            Shortlist
          </button>
        )}
        {proposal.status === 'shortlisted' && (
          <button
            onClick={() => onStatusUpdate('interview_scheduled')}
            disabled={isUpdatingStatus}
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            Schedule Interview
          </button>
        )}
        {(proposal.status === 'shortlisted' || proposal.status === 'interview_scheduled') && (
          <button
            onClick={() => onStatusUpdate('awarded')}
            disabled={isUpdatingStatus}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            Accept & Award
          </button>
        )}
        {(['submitted', 'under_review', 'shortlisted', 'interview_scheduled'] as ProposalStatus[]).includes(proposal.status) && (
          <button
            onClick={() => onStatusUpdate('rejected')}
            disabled={isUpdatingStatus}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}
