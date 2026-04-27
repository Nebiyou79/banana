/**
 * Presence utilities — shared between header, contact cards, and online dots.
 * -----------------------------------------------------------------------------
 * Thresholds mirror the blueprint (§5.2 + Appendix A).
 */

import type { PresenceLevel } from '../types/chat';

export const getPresenceLevel = (
  lastSeen?: Date | string | null,
  isOnline?: boolean,
): PresenceLevel => {
  if (isOnline) return 'active_now';
  if (!lastSeen) return 'inactive';

  const diff = Date.now() - new Date(lastSeen).getTime();
  const minutes = diff / 60_000;

  if (minutes < 5) return 'active_now';
  if (minutes < 60) return 'recently';
  if (minutes < 1440) return 'today';
  if (minutes < 10_080) return 'this_week';
  if (minutes < 20_160) return 'two_weeks';
  return 'inactive';
};

export const formatPresenceLabel = (
  lastSeen?: Date | string | null,
  isOnline?: boolean,
): string => {
  const level = getPresenceLevel(lastSeen, isOnline);
  if (level === 'active_now') return 'Active now';
  if (!lastSeen) return 'Offline';

  const diff = Date.now() - new Date(lastSeen).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  switch (level) {
    case 'recently':
      return `Active ${minutes}m ago`;
    case 'today':
      return `Active ${hours}h ago`;
    case 'this_week':
      return `Active ${days}d ago`;
    case 'two_weeks':
      return 'Active recently';
    case 'inactive':
    default:
      return 'Active a while ago';
  }
};

/** Tight label for contact-card right side (e.g. "2m", "3h", "4d"). */
export const formatRelativeTime = (date?: Date | string | null): string => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const w = Math.floor(d / 7);

  if (s < 60) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  if (w < 52) return `${w}w`;
  return `${Math.floor(w / 52)}y`;
};

/** Semantic color for the presence dot. Keep these exact — design system. */
export const getPresenceColor = (level: PresenceLevel): string => {
  switch (level) {
    case 'active_now':
      return '#10B981'; // green
    case 'recently':
    case 'today':
      return '#EAB308'; // yellow
    case 'this_week':
    case 'two_weeks':
      return '#94A3B8'; // gray
    case 'inactive':
    default:
      return 'transparent'; // no dot
  }
};