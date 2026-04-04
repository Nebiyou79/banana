// src/components/tender/shared/TenderStatusBadge.tsx
import { colorClasses } from '@/utils/color';

type StatusValue =
  | 'draft'
  | 'published'
  | 'closed'
  | 'archived'
  | 'deadline_reached'
  | 'pending'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'awarded'
  | 'sealed'
  | 'verified'
  | 'invite-only'
  | 'locked'
  | 'revealed'
  | 'cancelled';

interface TenderStatusBadgeProps {
  status: StatusValue;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const statusConfig: Record<
  StatusValue,
  { text: string; bg: string; label: string; dot?: boolean }
> = {
  draft: {
    text: colorClasses.text.amber,
    bg: colorClasses.bg.amberLight,
    label: 'Draft',
  },
  published: {
    text: colorClasses.text.emerald,
    bg: colorClasses.bg.emeraldLight,
    label: 'Published',
    dot: true,
  },
  closed: {
    text: colorClasses.text.gray600,
    bg: colorClasses.bg.gray100,
    label: 'Closed',
  },
  deadline_reached: {
    text: colorClasses.text.red,
    bg: colorClasses.bg.redLight,
    label: 'Deadline Reached',
  },
  archived: {
    text: colorClasses.text.gray600,
    bg: colorClasses.bg.gray100,
    label: 'Archived',
  },
  pending: {
    text: colorClasses.text.amber,
    bg: colorClasses.bg.amberLight,
    label: 'Pending',
  },
  shortlisted: {
    text: colorClasses.text.blue,
    bg: colorClasses.bg.blueLight,
    label: 'Shortlisted',
  },
  accepted: {
    text: colorClasses.text.emerald,
    bg: colorClasses.bg.emeraldLight,
    label: 'Accepted',
  },
  awarded: {
    text: colorClasses.text.emerald,
    bg: colorClasses.bg.emeraldLight,
    label: 'Awarded',
  },
  rejected: {
    text: colorClasses.text.red,
    bg: colorClasses.bg.redLight,
    label: 'Rejected',
  },
  sealed: {
    text: colorClasses.text.purple,
    bg: colorClasses.bg.purpleLight,
    label: 'Sealed 🔒',
  },
  verified: {
    text: colorClasses.text.emerald,
    bg: colorClasses.bg.emeraldLight,
    label: 'Verified ✓',
  },
  locked: {
    text: colorClasses.text.purple,
    bg: colorClasses.bg.purpleLight,
    label: 'Locked',
  },
  revealed: {
    text: colorClasses.text.blue,
    bg: colorClasses.bg.blueLight,
    label: 'Revealed',
  },
  'invite-only': {
    text: colorClasses.text.teal,
    bg: colorClasses.bg.tealLight,
    label: 'Invite Only',
  },
  cancelled: {
    text: colorClasses.text.red,
    bg: colorClasses.bg.redLight,
    label: 'Cancelled',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function TenderStatusBadge({
  status,
  size = 'md',
  showDot = false,
}: TenderStatusBadgeProps) {
  const config = statusConfig[status];

  // Fallback for unknown status values
  if (!config) {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 rounded-full font-semibold
          ${sizeClasses[size]}
          ${colorClasses.text.secondary}
          ${colorClasses.bg.secondary}
        `}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${sizeClasses[size]}
        ${config.text}
        ${config.bg}
      `}
    >
      {showDot && config.dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}