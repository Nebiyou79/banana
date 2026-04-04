// components/proposals/owner/ProposalStatsBar.tsx
import React from 'react';
import type { ProposalStats } from '@/services/proposalService';

interface Props {
  stats: ProposalStats;
}

const fmt = (n: number | undefined): string => {
  if (n === undefined || n === null) return '—';
  return new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n);
};

const fmtAvg = (n: number | undefined): string => {
  if (!n) return '—';
  return new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(n);
};

interface StatItem {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export function ProposalStatsBar({ stats }: Props) {
  const items: StatItem[] = [
    {
      label: 'Total',
      value: fmt(stats.total),
      accent: 'text-slate-800',
    },
    {
      label: 'Shortlisted',
      value: fmt(stats.shortlistedCount),
      accent: 'text-indigo-700',
    },
    {
      label: 'Avg Bid',
      value: fmtAvg(stats.avgBid),
      sub: 'ETB',
      accent: 'text-slate-800',
    },
    {
      label: 'Min Bid',
      value: fmtAvg(stats.minBid),
      sub: 'ETB',
      accent: 'text-emerald-700',
    },
    {
      label: 'Max Bid',
      value: fmtAvg(stats.maxBid),
      sub: 'ETB',
      accent: 'text-red-600',
    },
    {
      label: 'Reviewed',
      value: fmt(stats.viewedByOwner),
      sub: `of ${fmt(stats.total)}`,
      accent: 'text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-6">
      {items.map(({ label, value, sub, accent }) => (
        <div key={label} className="flex flex-col items-center justify-center bg-white px-3 py-4 text-center">
          <p className={`text-2xl font-bold tabular-nums leading-none ${accent}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
          <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
