// src/theme/utils.ts
// ─── Color utility helpers ────────────────────────────────────────────────────

/**
 * Appends an alpha channel to a hex color.
 * @param hex  — 3 or 6-char hex string, with or without leading '#'
 * @param alpha — 0..1 float
 * @returns    — 8-char hex string '#RRGGBBAA'
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  const clean = hex.replace('#', '').slice(0, 6);
  return `#${clean}${a}`.toUpperCase();
};

/**
 * Lightens a hex color by mixing with white.
 */
export const lighten = (hex: string, amount: number): string =>
  withAlpha(hex, 1 - amount);

// ─── Date helpers ─────────────────────────────────────────────────────────────
 
/**
 * formatRelativeDate
 * Human-readable relative date string.
 *
 * @example
 *   formatRelativeDate(new Date()) // 'Today'
 *   formatRelativeDate(yesterday)  // '1d ago'
 */
export const formatRelativeDate = (d?: string | Date): string => {
  if (!d) return '';
  const diff = Math.floor(
    (Date.now() - new Date(d).getTime()) / 86_400_000,
  );
  if (diff === 0)  return 'Today';
  if (diff === 1)  return '1d ago';
  if (diff < 7)    return `${diff}d ago`;
  if (diff < 30)   return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
};
 
/**
 * formatShortDate
 * 'Apr 5, 2025' style.
 */
export const formatShortDate = (d?: string | Date): string => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
};
 