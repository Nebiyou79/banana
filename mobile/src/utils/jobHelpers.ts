/**
 * mobile/src/utils/jobHelpers.ts
 * Pure display helpers — no hardcoded colors.
 * Colors are returned as strings for callers to apply via theme.
 */

import { Job, JobSalary, SalaryModeValue } from '../services/jobService';

// ─── Salary ───────────────────────────────────────────────────────────────────

export const formatSalary = (job: Job | { salary?: JobSalary; salaryMode?: SalaryModeValue; salaryDisplay?: string }): string => {
  if (job.salaryDisplay) return job.salaryDisplay;
  const mode = job.salaryMode;
  if (!mode || mode === 'negotiable') return 'Negotiable';
  if (mode === 'hidden')        return 'Salary Hidden';
  if (mode === 'company-scale') return 'As per company scale';
  if (mode === 'range') {
    const { min, max, currency = 'ETB' } = job.salary ?? {};
    if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min)        return `${currency} ${min.toLocaleString()}+`;
    if (max)        return `Up to ${currency} ${max.toLocaleString()}`;
  }
  return 'Not specified';
};

export interface SalaryModeConfig {
  bg:    string;
  text:  string;
  icon:  string;
  label: string;
}

export const getSalaryModeConfig = (mode?: SalaryModeValue, isDark = false): SalaryModeConfig => {
  const configs: Record<string, SalaryModeConfig> = {
    range:           { bg: isDark ? '#052E16' : '#F0FDF4', text: isDark ? '#4ADE80' : '#15803D', icon: 'cash-outline',       label: 'Range' },
    negotiable:      { bg: isDark ? '#1E3A5F' : '#EFF6FF', text: isDark ? '#60A5FA' : '#1D4ED8', icon: 'hand-left-outline',  label: 'Negotiable' },
    hidden:          { bg: isDark ? '#1F2937' : '#F9FAFB', text: isDark ? '#9CA3AF' : '#6B7280', icon: 'eye-off-outline',    label: 'Hidden' },
    'company-scale': { bg: isDark ? '#1E3A5F' : '#EFF6FF', text: isDark ? '#60A5FA' : '#1D4ED8', icon: 'business-outline',  label: 'Company Scale' },
  };
  return configs[mode ?? 'negotiable'] ?? configs.negotiable;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
};

export const formatDeadline = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (d < new Date()) return 'Expired';
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0)  return 'Today';
  if (days === 1) return '1 day left';
  if (days <= 7)  return `${days} days left`;
  return `Closes ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

export const formatPostedDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0)  return 'Today';
  if (days === 1)  return 'Yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
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

// ─── Labels ───────────────────────────────────────────────────────────────────

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full Time', 'part-time': 'Part Time', 'contract': 'Contract',
  'internship': 'Internship', 'temporary': 'Temporary', 'volunteer': 'Volunteer',
  'remote': 'Remote', 'hybrid': 'Hybrid',
};
export const getJobTypeLabel = (type?: string): string => JOB_TYPE_LABELS[type ?? ''] ?? type ?? '';

const EXP_LABELS: Record<string, string> = {
  'fresh-graduate': 'Fresh Graduate', 'entry-level': 'Entry Level', 'mid-level': 'Mid Level',
  'senior-level': 'Senior Level', 'managerial': 'Managerial', 'director': 'Director', 'executive': 'Executive',
};
export const getExperienceLevelLabel = (level?: string): string => EXP_LABELS[level ?? ''] ?? level ?? '';

// ─── Color tokens (return strings, not theme refs, so they work in StyleSheet) ─

export const getJobTypeColor = (type?: string): string => {
  const map: Record<string, string> = {
    'full-time':  '#2563EB', 'part-time':  '#0EA5E9', 'contract':   '#F59E0B',
    'internship': '#10B981', 'temporary':  '#8B5CF6', 'volunteer':  '#EC4899',
    'remote':     '#14B8A6', 'hybrid':     '#6366F1',
  };
  return map[type ?? ''] ?? '#6B7280';
};

export const getJobStatusColor = (status?: string, isDark = false) => {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    active:   { bg: isDark ? '#052E16' : '#F0FDF4', text: isDark ? '#4ADE80' : '#15803D', border: isDark ? '#22C55E' : '#22C55E' },
    draft:    { bg: isDark ? '#451A03' : '#FFFBEB', text: isDark ? '#FCD34D' : '#B45309', border: isDark ? '#F59E0B' : '#F59E0B' },
    paused:   { bg: isDark ? '#451A03' : '#FFFBEB', text: isDark ? '#FCD34D' : '#B45309', border: isDark ? '#F59E0B' : '#F59E0B' },
    closed:   { bg: isDark ? '#450A0A' : '#FEF2F2', text: isDark ? '#F87171' : '#DC2626', border: isDark ? '#EF4444' : '#EF4444' },
    archived: { bg: isDark ? '#1F2937' : '#F9FAFB', text: isDark ? '#9CA3AF' : '#6B7280', border: isDark ? '#6B7280' : '#9CA3AF' },
  };
  return map[status ?? ''] ?? map.archived;
};

// ─── Initials ─────────────────────────────────────────────────────────────────

export const getCompanyInitials = (name?: string): string => {
  if (!name) return 'CO';
  return name
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CO';
};