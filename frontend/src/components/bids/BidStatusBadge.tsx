// src/components/bids/BidStatusBadge.tsx
import { colorClasses } from '@/utils/color';
import { BidStatus } from '@/services/bidService';

interface BidStatusBadgeProps {
  status: BidStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  BidStatus,
  { bg: string; text: string; label: string; extra?: string }
> = {
  submitted: {
    bg: colorClasses.bg.amberLight,
    text: colorClasses.text.amber700,
    label: '⏳ Submitted',
  },
  under_review: {
    bg: colorClasses.bg.blueLight,
    text: colorClasses.text.blue600,
    label: '🔍 Under Review',
  },
  shortlisted: {
    bg: colorClasses.bg.tealLight,
    text: colorClasses.text.teal,
    label: '⭐ Shortlisted',
  },
  interview_scheduled: {
    bg: colorClasses.bg.purpleLight,
    text: colorClasses.text.purple,
    label: '📅 Interview Scheduled',
  },
  awarded: {
    bg: 'bg-[#F1BB03]',
    text: 'text-[#0A2540]',
    label: '🏆 Awarded',
    extra: 'font-bold',
  },
  rejected: {
    bg: colorClasses.bg.grayLight,
    text: colorClasses.text.muted,
    label: '✗ Rejected',
  },
  withdrawn: {
    bg: colorClasses.bg.grayLight,
    text: colorClasses.text.muted,
    label: '↩ Withdrawn',
    extra: 'italic',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export const BidStatusBadge = ({ status, size = 'md' }: BidStatusBadgeProps) => {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        config.bg,
        config.text,
        config.extra ?? '',
        sizeClasses[size],
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {config.label}
    </span>
  );
};

export default BidStatusBadge;
