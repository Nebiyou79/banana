// components/proposals/shared/MilestoneTimeline.tsx
import React from 'react';
import type { ProposalMilestone } from '@/services/proposalService';

interface Props {
  milestones: ProposalMilestone[];
  currency: string;
  totalBid: number;
}

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('en-ET', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ` ${currency}`;

const TOLERANCE = 0.05;

export function MilestoneTimeline({ milestones, currency, totalBid }: Props) {
  if (!milestones || milestones.length === 0) return null;

  const total       = milestones.reduce((s, m) => s + (m.amount ?? 0), 0);
  const diff        = Math.abs(total - totalBid);
  const isMatch     = totalBid === 0 || diff / totalBid <= TOLERANCE;

  return (
    <div className="space-y-0">
      <div className="relative">
        {milestones.map((m, i) => (
          <div key={m._id ?? i} className="flex gap-4">
            {/* Left: connector line + number */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 bg-white text-xs font-bold text-indigo-600">
                {i + 1}
              </div>
              {i < milestones.length - 1 && (
                <div className="w-0.5 flex-1 bg-slate-200" style={{ minHeight: '1.5rem' }} />
              )}
            </div>

            {/* Middle: title + description */}
            <div className="min-w-0 flex-1 pb-6">
              <p className="text-sm font-semibold text-slate-800">{m.title}</p>
              {m.description && (
                <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{m.description}</p>
              )}
            </div>

            {/* Right: amount + duration */}
            <div className="shrink-0 text-right pb-6">
              <p className="text-sm font-semibold text-slate-800">{fmt(m.amount, currency)}</p>
              <p className="text-xs text-slate-400">{m.duration} {m.durationUnit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer total */}
      <div className={[
        'flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold',
        isMatch ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600',
      ].join(' ')}>
        <span>Milestone total</span>
        <span className="flex items-center gap-2">
          {fmt(total, currency)}
          {isMatch
            ? <span className="text-emerald-500">✓</span>
            : <span title={`Bid is ${fmt(totalBid, currency)}`}>⚠ Bid mismatch</span>
          }
        </span>
      </div>
    </div>
  );
}
