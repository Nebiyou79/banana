// src/utils/text.ts
// ─── Text/string utilities ────────────────────────────────────────────────────

export const plural = (n: number, one: string, many: string): string =>
  n === 1 ? one : many;

export const truncate = (str: string, max: number): string =>
  str.length > max ? str.slice(0, max - 1) + '…' : str;

export const initials = (name?: string | null): string => {
  if (!name || !name.trim()) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};