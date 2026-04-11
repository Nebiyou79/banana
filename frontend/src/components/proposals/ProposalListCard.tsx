// components/proposals/freelancer/ProposalListCard.tsx
'use client';
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import type { ProposalListItem, ProposalTender } from '@/services/proposalService';

interface Props {
  proposal: ProposalListItem;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft:               { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-500 dark:text-gray-400',     dot: 'bg-gray-400',   label: 'Draft' },
  submitted:           { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500',   label: 'Submitted' },
  under_review:        { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', label: 'Under Review' },
  shortlisted:         { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',  label: 'Shortlisted' },
  interview_scheduled: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', label: 'Interview' },
  awarded:             { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Awarded' },
  rejected:            { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    label: 'Not Selected' },
  withdrawn:           { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-500 dark:text-gray-400',     dot: 'bg-gray-400',   label: 'Withdrawn' },
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'Just now';
}

type PopulatedOwnerEntity = { name?: string; logo?: string };

function getOwnerInfo(tender: ProposalTender): { name: string; logo: string | null } {
  const oe = tender.ownerEntity;
  if (typeof oe === 'object' && oe !== null) {
    const pop = oe as PopulatedOwnerEntity;
    return { name: pop.name ?? tender.ownerEntityModel ?? 'Unknown client', logo: pop.logo ?? null };
  }
  return { name: tender.ownerEntityModel ?? 'Unknown client', logo: null };
}

export function ProposalListCard({ proposal, onClick }: Props) {
  const tender = proposal.tender as ProposalTender;
  const { name: ownerName, logo: logoUrl } = getOwnerInfo(tender);
  const cfg      = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG['submitted'];
  const isAwarded = proposal.status === 'awarded';

  return (
    <article
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'relative overflow-hidden rounded-2xl border transition-all',
        colorClasses.bg.primary,
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#F1BB03]/50' : '',
        proposal.status === 'rejected'  ? 'opacity-60' : '',
        isAwarded ? 'border-emerald-400 dark:border-emerald-600' : colorClasses.border.gray200,
      )}
    >
      {/* Top accent strip */}
      <div
        className="h-0.5 w-full"
        style={{
          background:
            isAwarded                          ? '#10B981' :
            proposal.isShortlisted             ? '#F1BB03' :
            proposal.status === 'under_review' ? '#6366F1' :
            proposal.status === 'submitted'    ? '#3B82F6' :
            proposal.status === 'rejected'     ? '#EF4444' : 'transparent',
        }}
      />

      {/* Awarded / shortlisted pill banners */}
      {isAwarded && (
        <div className="bg-emerald-500 px-4 py-1 text-[10px] font-bold text-white">
          🏆 Awarded
        </div>
      )}
      {proposal.isShortlisted && !isAwarded && (
        <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Shortlisted
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Company logo / fallback */}
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg overflow-hidden',
            colorClasses.bg.secondary, colorClasses.border.gray200,
          )}>
            {logoUrl
              ? <img src={logoUrl} alt={ownerName} className="h-full w-full object-cover" />
              : '🏢'}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className={cn('text-sm font-bold truncate', colorClasses.text.primary)}>
                {tender?.title ?? 'Untitled Tender'}
              </p>
              <span className={cn(
                'shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                cfg.bg, cfg.text,
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                {cfg.label}
              </span>
            </div>
            <p className={cn('text-xs mb-3', colorClasses.text.muted)}>{ownerName}</p>

            {/* Bid + delivery */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-lg font-bold text-[#F1BB03]">
                {proposal.currency ?? 'ETB'} {proposal.proposedAmount?.toLocaleString()}
              </p>
              {proposal.deliveryTime && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>
                  {proposal.deliveryTime.value} {proposal.deliveryTime.unit}
                </span>
              )}
            </div>

            {/* Cover letter excerpt */}
            {proposal.coverLetter && (
              <p className={cn('text-xs line-clamp-2 mb-2', colorClasses.text.muted)}>
                {proposal.coverLetter}
              </p>
            )}

            {/* Footer */}
            {proposal.submittedAt && (
              <p className={cn('text-[10px]', colorClasses.text.muted)}>
                Submitted {timeAgo(proposal.submittedAt)}
              </p>
            )}
          </div>
          {/* View Details button — always visible */}
          {onClick && (
            <div className="mt-3 flex justify-end">
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                'bg-[#F1BB03]/10 text-[#0A2540] dark:text-[#F1BB03] hover:bg-[#F1BB03]/20',
                'border border-[#F1BB03]/30',
              )}>
                View Details
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}