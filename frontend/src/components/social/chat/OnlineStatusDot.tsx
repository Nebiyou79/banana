/**
 * frontend/src/components/social/chat/OnlineStatusDot.tsx
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Online status dot (web, NEW)
 *
 * Tiers:
 *   isOnline=true OR lastSeen < 5min   → green  (#10B981) "active_now"
 *   5min <= lastSeen < 24h             → yellow (#EAB308) "recently/today"
 *   24h <= lastSeen < 14 days          → gray   (#6B7280) "older"
 *   lastSeen >= 14 days OR missing     → no dot
 * ────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type PresenceLevel =
  | 'active_now'
  | 'recently'
  | 'older'
  | 'inactive';

interface OnlineStatusDotProps {
  lastSeen?: Date | string | null;
  isOnline?: boolean;
  size?: number;
  showBorder?: boolean;
  className?: string;
  title?: string;
}

export function getPresenceLevel(
  lastSeen?: Date | string | null,
  isOnline?: boolean
): PresenceLevel {
  if (isOnline) return 'active_now';
  if (!lastSeen) return 'inactive';

  const last = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (Number.isNaN(last.getTime())) return 'inactive';

  const diffMs = Date.now() - last.getTime();
  const diffMin = diffMs / 60_000;
  const diffHour = diffMin / 60;
  const diffDay = diffHour / 24;

  if (diffMin < 5) return 'active_now';
  if (diffHour < 24) return 'recently';
  if (diffDay < 14) return 'older';
  return 'inactive';
}

export function getPresenceLabel(
  lastSeen?: Date | string | null,
  isOnline?: boolean
): string {
  if (isOnline) return 'Active now';
  if (!lastSeen) return 'Offline';

  const last = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (Number.isNaN(last.getTime())) return 'Offline';

  const diffMs = Date.now() - last.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Active now';
  if (diffMin < 5) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  if (diffHour < 24) return `Active ${diffHour}h ago`;
  if (diffDay < 14) return `Active ${diffDay}d ago`;
  return 'Active a while ago';
}

const COLORS: Record<PresenceLevel, string> = {
  active_now: '#10B981',
  recently: '#EAB308',
  older: '#6B7280',
  inactive: 'transparent',
};

const OnlineStatusDot: React.FC<OnlineStatusDotProps> = ({
  lastSeen,
  isOnline,
  size = 10,
  showBorder = true,
  className = '',
  title,
}) => {
  const level = getPresenceLevel(lastSeen, isOnline);
  if (level === 'inactive') return null;

  const color = COLORS[level];
  const tooltip = title ?? getPresenceLabel(lastSeen, isOnline);

  return (
    <span
      aria-label={tooltip}
      title={tooltip}
      className={cn('inline-block rounded-full', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: showBorder ? '0 0 0 2px white' : 'none',
      }}
    />
  );
};

export default OnlineStatusDot;