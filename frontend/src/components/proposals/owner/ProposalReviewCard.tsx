/* eslint-disable @typescript-eslint/no-explicit-any */
// components/proposals/owner/ProposalReviewCard.tsx
'use client';
import React from 'react';
import { ProposalStatusBadge } from './shared/ProposalStatusBadge';
import { ProposalBidSummary }  from './shared/ProposalBidSummary';
import type { ProposalListItem } from '@/services/proposalService';

interface Props {
  proposal: ProposalListItem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onShortlist?: (id: string) => void;
  onClick?: (id: string) => void;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`h-5 w-5 transition-colors ${filled ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
    viewBox="0 0 20 20"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const RatingStars = ({ avg }: { avg: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`h-3.5 w-3.5 ${s <= Math.round(avg) ? 'text-amber-400' : 'text-slate-200'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export function ProposalReviewCard({ proposal, isSelected, onSelect, onShortlist, onClick }: Props) {
  const freelancer = proposal.freelancer as any;
  const profile    = proposal.freelancerProfile as any;
  const avgRating  = profile?.ratings?.average ?? 0;
  const milestoneCount = proposal.milestones?.length ?? 0;

  return (
    <article
      className={[
        'group relative rounded-2xl border bg-white transition-all',
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : '',
        isSelected ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-slate-200',
      ].join(' ')}
      onClick={() => onClick?.(proposal._id)}
    >
      {/* Checkbox for compare feature */}
      {onSelect && (
        <div
          className="absolute left-3 top-3 z-10"
          onClick={(e) => { e.stopPropagation(); onSelect(proposal._id); }}
        >
          <input
            type="checkbox"
            checked={isSelected ?? false}
            onChange={() => onSelect(proposal._id)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
      )}

      <div className={`flex items-center gap-4 p-5 ${onSelect ? 'pl-10' : ''}`}>

        {/* Col 1: Avatar + name + badge */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {freelancer?.avatar ? (
            <img
              src={freelancer.avatar}
              alt={freelancer.name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
              {freelancer?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {freelancer?.name ?? 'Unknown'}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <ProposalStatusBadge status={proposal.status} size="sm" />
            </div>
          </div>
        </div>

        {/* Col 2: Bid + milestones */}
        <div className="hidden min-w-0 flex-1 sm:block">
          <ProposalBidSummary proposal={proposal} layout="row" />
          {milestoneCount > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {milestoneCount} milestone{milestoneCount > 1 ? 's' : ''}
            </p>
          )}
          {profile?.headline && (
            <p className="mt-1 truncate text-xs text-slate-500">{profile.headline}</p>
          )}
        </div>

        {/* Col 3: Rating + shortlist star */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {avgRating > 0 ? (
            <div className="flex items-center gap-1.5">
              <RatingStars avg={avgRating} />
              <span className="text-xs tabular-nums text-slate-500">{avgRating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-300">No rating</span>
          )}

          {onShortlist && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onShortlist(proposal._id); }}
              className="p-1 rounded-lg hover:bg-amber-50 transition-colors"
              aria-label={proposal.isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            >
              <StarIcon filled={proposal.isShortlisted} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
