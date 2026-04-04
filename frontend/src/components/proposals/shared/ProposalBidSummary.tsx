// components/proposals/shared/ProposalBidSummary.tsx
import React from 'react';
import type { Proposal, ProposalListItem } from '@/services/proposalService';

interface Props {
  proposal: Proposal | ProposalListItem;
  layout?: 'row' | 'card';
}

const formatAmount = (n: number, currency: string) =>
  new Intl.NumberFormat('en-ET', { style: 'decimal', maximumFractionDigits: 0 }).format(n) +
  ` ${currency}`;

export function ProposalBidSummary({ proposal, layout = 'row' }: Props) {
  const { bidType, proposedAmount, currency, hourlyRate, estimatedWeeklyHours, deliveryTime, availability } = proposal;

  const bidLabel =
    bidType === 'hourly'
      ? `${formatAmount(hourlyRate ?? proposedAmount, currency)}/hr${estimatedWeeklyHours ? ` · ${estimatedWeeklyHours} hrs/wk` : ''}`
      : `${formatAmount(proposedAmount, currency)} (Fixed)`;

  const timeLabel = deliveryTime
    ? `${deliveryTime.value} ${deliveryTime.unit}`
    : null;

  const availLabel =
    availability === 'full-time' ? 'Full-time' :
    availability === 'part-time' ? 'Part-time' : 'Flexible';

  if (layout === 'card') {
    return (
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bid</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{bidLabel}</p>
        </div>
        {timeLabel && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Delivery</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{timeLabel}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Availability</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{availLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
      <span className="font-semibold text-slate-800">{bidLabel}</span>
      {timeLabel && (
        <>
          <span className="text-slate-300">·</span>
          <span>{timeLabel}</span>
        </>
      )}
      <span className="text-slate-300">·</span>
      <span>{availLabel}</span>
    </span>
  );
}
