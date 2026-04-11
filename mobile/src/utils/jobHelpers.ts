import { JobSalary, Job } from '../services/jobService';

// ─── Salary ───────────────────────────────────────────────────────────────────

export const formatSalary = (salary?: JobSalary): string => {
  if (!salary) return 'Not specified';
  if (salary.negotiable || salary.mode === 'negotiable') return 'Negotiable';
  if (salary.mode === 'hidden' || salary.mode === 'company_scale') return 'As per company scale';
  if (salary.display) return salary.display;
  if (salary.min && salary.max) {
    const fmt = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
    return `$${fmt(salary.min)} – $${fmt(salary.max)} ${salary.currency ?? 'USD'}`;
  }
  if (salary.min) return `From $${salary.min.toLocaleString()} ${salary.currency ?? 'USD'}`;
  if (salary.max) return `Up to $${salary.max.toLocaleString()} ${salary.currency ?? 'USD'}`;
  return 'Not specified';
};

// ─── Deadline ────────────────────────────────────────────────────────────────

export const formatDeadline = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `Closes ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

export const isDeadlineSoon = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};

export const isDeadlinePast = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
};

// ─── Experience ───────────────────────────────────────────────────────────────

export const EXPERIENCE_LABELS: Record<string, string> = {
  entry:      'Entry Level',
  mid:        'Mid Level',
  senior:     'Senior Level',
  executive:  'Executive',
  junior:     'Junior',
  'entry-level': 'Entry Level',
  'mid-level':   'Mid Level',
  'senior-level':'Senior Level',
};

export const getExperienceLevelLabel = (level?: string): string =>
  level ? EXPERIENCE_LABELS[level] ?? level : '';

// ─── Job type badge colours ───────────────────────────────────────────────────

export const JOB_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'full-time':   { bg: '#2563EB18', text: '#2563EB' },
  'part-time':   { bg: '#0EA5E918', text: '#0EA5E9' },
  'contract':    { bg: '#F59E0B18', text: '#D97706' },
  'internship':  { bg: '#10B98118', text: '#059669' },
  'freelance':   { bg: '#8B5CF618', text: '#7C3AED' },
};

export const getJobTypeColor = (type?: string) =>
  JOB_TYPE_COLORS[type ?? ''] ?? { bg: '#94A3B818', text: '#64748B' };

// ─── Status badge colours ─────────────────────────────────────────────────────

export const JOB_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active:   { bg: '#10B98118', text: '#059669', border: '#10B981' },
  inactive: { bg: '#94A3B818', text: '#64748B', border: '#94A3B8' },
  draft:    { bg: '#F59E0B18', text: '#D97706', border: '#F59E0B' },
  expired:  { bg: '#EF444418', text: '#DC2626', border: '#EF4444' },
  paused:   { bg: '#F59E0B18', text: '#D97706', border: '#F59E0B' },
  closed:   { bg: '#EF444418', text: '#DC2626', border: '#EF4444' },
  archived: { bg: '#94A3B818', text: '#64748B', border: '#94A3B8' },
};

export const getJobStatusColor = (status?: string) =>
  JOB_STATUS_COLORS[status ?? ''] ?? { bg: '#94A3B818', text: '#64748B', border: '#94A3B8' };

// ─── Posted date ──────────────────────────────────────────────────────────────

export const formatPostedDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
};

// ─── Initials for company logo placeholder ────────────────────────────────────

export const getCompanyInitials = (name?: string): string => {
  if (!name) return 'CO';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};
