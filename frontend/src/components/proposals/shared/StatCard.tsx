// src/components/proposals/shared/StatCard.tsx
// Matches Proposify reference: label top-left, big number bottom-left,
// icon bottom-right, solid colored background, optional trend chip.
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type ColorScheme = 'emerald' | 'blue' | 'amber' | 'purple';

interface TrendInfo { value: number; label: string }

interface Props {
  label:       string;
  value:       number | string;
  icon:        React.ReactNode;
  colorScheme: ColorScheme;
  trend?:      TrendInfo;
  isLoading?:  boolean;
}

const BG: Record<ColorScheme, string> = {
  emerald: 'bg-[#059669]',
  blue:    'bg-[#2563EB]',
  amber:   'bg-[#D97706]',
  purple:  'bg-[#7C3AED]',
};

export function StatCard({ label, value, icon, colorScheme, trend, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl p-5 w-full animate-pulse', BG[colorScheme], 'opacity-60')}>
        <div className="h-3 w-24 rounded bg-white/30 mb-4" />
        <div className="h-8 w-16 rounded bg-white/30" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl p-5 w-full relative overflow-hidden', BG[colorScheme])}>
      {/* Label */}
      <p className="text-sm font-medium text-white/80 mb-3">{label}</p>

      {/* Bottom row: value + icon */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white leading-none">{value}</p>
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold',
              trend.value >= 0 ? 'bg-white/20 text-white' : 'bg-white/20 text-white',
            )}>
              {trend.value >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        {/* Icon — semi-transparent large */}
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
      </div>

      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
    </div>
  );
}
