// src/social/utils/chatDate.ts
/**
 * Date helpers for chat day separators.
 *   - "Today"
 *   - "Yesterday"
 *   - "Mon, Apr 26"   (this year)
 *   - "Apr 26, 2025"  (other years)
 *
 * ─── BUG FIX ────────────────────────────────────────────────────────────────
 * Both `formatDayLabel` and `dayKey` previously used `new Date(iso)` and then
 * read LOCAL date fields (getFullYear, getMonth, getDate). When an ISO string
 * is UTC (e.g. "2025-04-26T23:30:00.000Z") and the device is in a UTC+ zone,
 * the local date is one day ahead of the UTC date. This caused messages sent
 * near midnight to appear under the WRONG day separator — e.g. a message
 * timestamped Apr 26 UTC would show under "Apr 27" for a UTC+3 user, and the
 * "Today" / "Yesterday" labels would also be wrong.
 *
 * Fix: extract date parts using UTC methods (getUTCFullYear, getUTCMonth,
 * getUTCDate) consistently everywhere. The server stores timestamps in UTC,
 * so all comparisons must also be in UTC.
 *
 * Note: `now` is compared in UTC too — `todayUTC()` builds a UTC midnight
 * anchor so `sameUTCDay` comparisons are apples-to-apples.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Compare two Dates by their UTC calendar day (year/month/date). */
const sameUTCDay = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

/**
 * Return a Date representing the START of today in UTC (midnight UTC).
 * Used as a stable anchor for "Today" / "Yesterday" comparisons.
 */
const utcMidnightToday = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Format a UTC ISO string as a human-readable day label.
 *
 * Examples (assuming current date is 2025-04-27 UTC):
 *   "2025-04-27T10:00:00Z" → "Today"
 *   "2025-04-26T23:59:59Z" → "Yesterday"    ← was broken before the fix
 *   "2025-04-21T08:00:00Z" → "Mon, Apr 21"  (same year)
 *   "2024-12-01T08:00:00Z" → "Dec 1, 2024"  (different year)
 */
export const formatDayLabel = (iso: string): string => {
  const d = new Date(iso);
  const todayUTC = utcMidnightToday();

  // BUG FIX: compare UTC days, not local days
  if (sameUTCDay(d, todayUTC)) return 'Today';

  const yesterdayUTC = new Date(todayUTC);
  yesterdayUTC.setUTCDate(todayUTC.getUTCDate() - 1);
  if (sameUTCDay(d, yesterdayUTC)) return 'Yesterday';

  // BUG FIX: compare UTC years, not local years
  const sameYear = d.getUTCFullYear() === todayUTC.getUTCFullYear();

  // toLocaleDateString is fine for display — the day/month/year values
  // are set from UTC so the locale formatter just formats them visually.
  // We build an explicit UTC date to avoid the formatter interpreting local tz.
  const displayDate = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );

  return displayDate.toLocaleDateString(undefined, {
    weekday: sameYear ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
    timeZone: 'UTC', // force formatter to read UTC fields, not local
  });
};

/**
 * Return a `YYYY-MM-DD` string key for grouping messages by UTC calendar day.
 *
 * BUG FIX: was using getFullYear/getMonth/getDate (local tz).
 * Now uses getUTCFullYear/getUTCMonth/getUTCDate so the key matches the
 * UTC day the server assigned the timestamp, regardless of the device locale.
 */
export const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-');
};