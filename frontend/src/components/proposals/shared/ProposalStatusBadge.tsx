// components/proposals/shared/ProposalStatusBadge.tsx
import React from 'react';
import type { ProposalStatus } from '@/services/proposalService';

interface Props {
  status: ProposalStatus;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG: Record<
  ProposalStatus,
  { label: string; icon?: string; classes: string; textDecoration?: string }
> = {
  draft:                { label: 'Draft',              classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  submitted:            { label: 'Submitted',          classes: 'bg-blue-50  text-blue-700  border-blue-200' },
  under_review:         { label: 'Under Review',       classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  shortlisted:          { label: 'Shortlisted',  icon: '⭐', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  interview_scheduled:  { label: 'Interview',    icon: '📅', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  awarded:              { label: 'Awarded',       icon: '✓',  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:             { label: 'Rejected',           classes: 'bg-red-50 text-red-600 border-red-200' },
  withdrawn:            { label: 'Withdrawn',          classes: 'bg-slate-100 text-slate-400 border-slate-200', textDecoration: 'line-through' },
};

const SIZE: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-0.5',
  lg: 'text-base px-4 py-1',
};

export function ProposalStatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.draft;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap',
        SIZE[size],
        cfg.classes,
      ].join(' ')}
      style={cfg.textDecoration ? { textDecoration: cfg.textDecoration } : undefined}
    >
      {cfg.icon && <span aria-hidden="true">{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}
