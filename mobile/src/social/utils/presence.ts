/**
 * Presence utilities — shared between header, contact cards, and online dots.
 * -----------------------------------------------------------------------------
 * Thresholds mirror the blueprint (§5.2 + Appendix A).
 *
 * ─── BUG FIXES ──────────────────────────────────────────────────────────────
 *
 * BUG A — `active_now` false-positive on lastSeen < 5 min:
 *   Original code returned `active_now` for anyone last-seen < 5 minutes ago,
 *   even when `isOnline` was false. This showed a green "Active now" dot for
 *   users who had already disconnected up to 5 minutes ago. The server sets
 *   `isOnline: false` as soon as the socket disconnects; the lastSeen grace
 *   period should only be a 1-minute buffer (covers minor network jitter
 *   before the server flushes presence). Anything older falls to 'recently'.
 *
 * BUG B — PresenceLevel strings mismatched in OnlineStatusDot:
 *   `OnlineStatusDot.tsx` used `level === 'online'` and `level === 'recently'`
 *   in its accessibilityLabel ternary, but this file exports 'active_now' and
 *   'recently'/'today'/etc. The 'online' branch NEVER matched, so every dot
 *   got the 'Away' label regardless of actual status.
 *
 *   Fix: the accessibilityLabel in OnlineStatusDot.tsx is corrected in its
 *   own file (see OnlineStatusDot.tsx output). This file is the authoritative
 *   source for PresenceLevel strings — no changes needed to the enum itself,
 *   but the threshold for 'active_now' is tightened to < 1 min.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { PresenceLevel } from '../types/chat';

/**
 * Derive a PresenceLevel from lastSeen + isOnline.
 *
 * Level hierarchy (highest → lowest):
 *   active_now  — socket says online, OR last seen < 1 min ago (jitter grace)
 *   recently    — last seen 1 – 59 min ago
 *   today       — last seen 1 – 23 h ago
 *   this_week   — last seen 1 – 6 days ago
 *   two_weeks   — last seen 7 – 13 days ago
 *   inactive    — last seen ≥ 14 days ago, or no lastSeen at all
 *
 * BUG A FIX: grace period tightened from < 5 min → < 1 min.
 * The 5-minute window caused green "Active now" to show for users who had
 * been offline for up to 4:59 — very misleading in a chat context.
 */
export const getPresenceLevel = (
  lastSeen?: Date | string | null,
  isOnline?: boolean,
): PresenceLevel => {
  // Server explicitly says the socket is connected → always active_now
  if (isOnline) return 'active_now';

  if (!lastSeen) return 'inactive';

  const diff = Date.now() - new Date(lastSeen).getTime();
  const minutes = diff / 60_000;

  // BUG A FIX: was `< 5`, now `< 1` — only a 60-second jitter grace period
  if (minutes < 1) return 'active_now';
  if (minutes < 60) return 'recently';
  if (minutes < 1440) return 'today';       // < 24 h
  if (minutes < 10_080) return 'this_week'; // < 7 days
  if (minutes < 20_160) return 'two_weeks'; // < 14 days
  return 'inactive';
};

/**
 * Human-readable presence label for the chat header subtitle.
 *
 * Examples:
 *   active_now  → "Active now"
 *   recently    → "Active 4m ago"
 *   today       → "Active 3h ago"
 *   this_week   → "Active 2d ago"
 *   two_weeks   → "Active recently"
 *   inactive    → "Active a while ago"
 *   (no lastSeen) → "Offline"
 */
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

/**
 * Semantic color for the presence dot.
 *
 * Keep these exact values — they are part of the design system.
 *   active_now             → #10B981 green
 *   recently / today       → #EAB308 yellow
 *   this_week / two_weeks  → #94A3B8 gray
 *   inactive               → transparent (dot hidden entirely)
 */
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
      return 'transparent'; // no dot rendered
  }
};