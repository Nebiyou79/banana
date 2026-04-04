// src/components/proposals/shared/ProposalDetailHeader.tsx
// Used in pages 1.3, 2.2, 3.2. Adapts for freelancer vs owner view.
import React from 'react';
import { ArrowLeft, Calendar, Tag, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import type { Proposal, ProposalTender } from '@/services/proposalService';

interface Props {
  proposal:   Proposal;
  tender:     ProposalTender;
  viewerRole: 'freelancer' | 'owner';
  onBack:     () => void;
  isLoading?: boolean;
  /** Optional accent color for the top border (default: #F1BB03 gold) */
  accentColor?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isDeadlineSoon(dateStr?: string) {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

export function ProposalDetailHeader({
  proposal, tender, viewerRole, onBack, isLoading, accentColor = '#F1BB03',
}: Props) {
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border p-5 animate-pulse', colorClasses.bg.primary, colorClasses.border.gray200)}>
        <div className="h-3 w-24 rounded bg-current opacity-10 mb-4" />
        <div className="h-5 w-64 rounded bg-current opacity-10 mb-2" />
        <div className="h-3 w-48 rounded bg-current opacity-10" />
      </div>
    );
  }

  const freelancer = proposal.freelancer;
  const deadlineSoon = isDeadlineSoon(tender.deadline);
  const bidFormatted = proposal.proposedAmount
    ? `${proposal.currency ?? 'ETB'} ${proposal.proposedAmount.toLocaleString()}`
    : null;

  return (
    <div
      className={cn('rounded-2xl border overflow-hidden shadow-sm', colorClasses.bg.primary, colorClasses.border.gray200)}
      style={{ borderTop: `4px solid ${accentColor}` }}
    >
      <div className="px-5 py-4">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm mb-4 transition-colors',
            colorClasses.text.muted,
            'hover:' + colorClasses.text.primary,
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {viewerRole === 'freelancer' ? 'My Proposals' : 'All Proposals'}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left: identity */}
          <div className="flex-1 min-w-0">
            {viewerRole === 'owner' ? (
              /* Owner sees freelancer info */
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-[#F1BB03]/20 flex items-center justify-center text-[#F1BB03] text-sm font-bold shrink-0">
                  {freelancer?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-base font-bold truncate', colorClasses.text.primary)}>
                    {freelancer?.name ?? 'Unknown Freelancer'}
                  </p>
                  {freelancer?.location && (
                    <p className={cn('text-xs truncate', colorClasses.text.muted)}>{freelancer.location}</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Tender title */}
            <h1 className={cn('text-xl font-bold truncate', colorClasses.text.primary)}>
              {tender.title}
            </h1>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {tender.ownerEntityModel && (
                <span className={cn('inline-flex items-center gap-1 text-xs', colorClasses.text.muted)}>
                  <Building2 className="w-3.5 h-3.5" />
                  {tender.ownerEntityModel}
                </span>
              )}
              {tender.deadline && (
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  deadlineSoon ? 'text-red-500' : colorClasses.text.muted,
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  Deadline: {formatDate(tender.deadline)}
                  {deadlineSoon && ' ⚠'}
                </span>
              )}
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                colorClasses.bg.secondary, colorClasses.text.secondary, colorClasses.border.gray200,
              )}>
                {tender.status}
              </span>
            </div>
          </div>

          {/* Right: bid + status + date */}
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
            {bidFormatted && (
              <p className="text-2xl font-bold text-[#F1BB03]">{bidFormatted}</p>
            )}
            <div className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              colorClasses.bg.secondary, colorClasses.text.secondary,
            )}>
              {proposal.status.replace(/_/g, ' ')}
            </div>
            {proposal.submittedAt && (
              <p className={cn('text-xs', colorClasses.text.muted)}>
                Submitted {formatDate(proposal.submittedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
