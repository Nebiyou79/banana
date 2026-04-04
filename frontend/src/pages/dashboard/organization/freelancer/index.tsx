/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/organizations/index.tsx
// Mirror of the Company Freelancer Marketplace but for freelancers browsing
// organizations that post tenders. Distinct navy/teal color scheme.
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Search, SlidersHorizontal, Loader2, X, ChevronLeft, ChevronRight,
  Bookmark, BookmarkCheck, Building2, MapPin, Star, BadgeCheck, Users,
  Briefcase, Globe, RotateCcw, ChevronRight as ArrowRight, TrendingUp,
  Shield, Clock, DollarSign, Zap,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';
// NOTE: Replace these with the real org-marketplace hooks/service when ready.
// The types and hook signatures below are the contract to implement.
// import { useListOrganizations, useToggleFollowOrg, useSavedOrgs } from '@/hooks/useOrgMarketplace';

// ─── Types ────────────────────────────────────────────────────────────────────
// These mirror what GET /api/v1/organizations would return.

export type OrgSize = 'startup' | 'sme' | 'enterprise';
export type OrgIndustry = string;

export interface OrgListItem {
  _id: string;
  name: string;
  logo?: string;
  tagline?: string;
  industry?: string;
  location?: string;
  size?: OrgSize;
  website?: string;
  verified: boolean;
  featured: boolean;
  activeTenders: number;
  totalSpend?: number;
  avgBudget?: number;
  avgRating?: number;
  reviewCount?: number;
  tags: string[];
  isSaved?: boolean;
  memberSince?: string;
}

export interface OrgFilters {
  search?: string;
  industry?: string;
  size?: OrgSize;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  minRating?: number;
  verified?: boolean;
  hasActiveTenders?: boolean;
  sortBy?: 'rating' | 'newest' | 'spend_desc' | 'tenders_desc';
  page?: number;
  limit?: number;
}

// ─── Theme helpers specific to org marketplace ───────────────────────────────
// Uses blue/teal accents to differentiate from the amber freelancer marketplace.

const orgTheme = {
  accent:      'bg-blue-600 hover:bg-blue-700 text-white',
  accentBorder:'border-blue-500',
  accentText:  'text-blue-600 dark:text-blue-400',
  accentBg:    'bg-blue-50 dark:bg-blue-900/20',
  accentRing:  'ring-1 ring-blue-400/60',
  chipActive:  'bg-blue-600 text-white border-blue-600 shadow-sm',
  chipIdle:    cn(colorClasses.bg.secondary, colorClasses.text.secondary, colorClasses.border.gray100, 'hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400'),
};

// ─── Filter chip ──────────────────────────────────────────────────────────────
const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150', active ? orgTheme.chipActive : orgTheme.chipIdle)}
  >
    {label}
  </button>
);

// ─── Size badge ───────────────────────────────────────────────────────────────
const sizeConfig: Record<OrgSize, { label: string; className: string }> = {
  startup:    { label: 'Startup',    className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  sme:        { label: 'SME',        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  enterprise: { label: 'Enterprise', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

// ─── Organization Card ────────────────────────────────────────────────────────
const OrgCard: React.FC<{
  org: OrgListItem;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isSaving?: boolean;
}> = ({ org, isSaved = false, onToggleSave, isSaving = false }) => {
  const [imgError, setImgError] = useState(false);

  const initials = org.name
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const size = org.size && sizeConfig[org.size];

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        colorClasses.bg.primary, colorClasses.border.gray100,
        org.featured && 'ring-1 ring-blue-400/50'
      )}
    >
      {/* Featured ribbon */}
      {org.featured && (
        <div className="absolute -top-px left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
            {org.logo && !imgError ? (
              <Image src={org.logo} alt={org.name} width={48} height={48} className="object-cover w-full h-full" onError={() => setImgError(true)} />
            ) : (
              <span className={cn('text-sm font-bold', orgTheme.accentText)}>{initials}</span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{org.name}</h3>
              {org.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              {org.featured && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Featured
                </span>
              )}
            </div>
            {org.tagline && (
              <p className={cn('text-xs mt-0.5 line-clamp-1', colorClasses.text.secondary)}>{org.tagline}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {size && (
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', size.className)}>
                  {size.label}
                </span>
              )}
              {org.location && (
                <span className={cn('flex items-center gap-0.5 text-[10px]', colorClasses.text.muted)}>
                  <MapPin className="w-3 h-3" />{org.location}
                </span>
              )}
            </div>
          </div>

          {/* Save button */}
          {onToggleSave && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleSave(org._id); }}
              disabled={isSaving}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-all duration-200',
                isSaved
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : cn('text-gray-400 hover:text-blue-500', colorClasses.bg.secondary, 'hover:bg-blue-50 dark:hover:bg-blue-900/20'),
                isSaving && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className={cn('flex items-center gap-3 mt-3 pt-3 border-t', colorClasses.border.gray100)}>
          {/* Active tenders */}
          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-teal-500" />
            <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>{org.activeTenders}</span>
            <span className={cn('text-xs', colorClasses.text.muted)}>open</span>
          </div>

          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />

          {/* Rating */}
          {(org.avgRating ?? 0) > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>{org.avgRating!.toFixed(1)}</span>
              {(org.reviewCount ?? 0) > 0 && (
                <span className={cn('text-xs', colorClasses.text.muted)}>({org.reviewCount})</span>
              )}
            </div>
          ) : (
            <span className={cn('text-xs', colorClasses.text.muted)}>No reviews</span>
          )}

          {(org.avgBudget ?? 0) > 0 && (
            <>
              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
              <span className={cn('text-xs font-semibold', orgTheme.accentText)}>
                ~${(org.avgBudget! / 1000).toFixed(0)}k avg
              </span>
            </>
          )}
        </div>

        {/* Industry / tags */}
        {(org.industry || org.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-3">
            {org.industry && (
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', orgTheme.accentBg, orgTheme.accentText)}>
                {org.industry}
              </span>
            )}
            {org.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={cn('text-[10px] px-2 py-0.5 rounded-full', colorClasses.bg.secondary, colorClasses.text.muted)}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/dashboard/freelancer/organizations/${org._id}`}
          className={cn(
            'flex items-center justify-between mt-3 pt-3 border-t text-xs font-semibold transition-colors duration-150',
            colorClasses.border.gray100, orgTheme.accentText, 'hover:opacity-80'
          )}
        >
          <span>View Organization</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

// ─── Sort + filter options ────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'tenders_desc', label: 'Most Tenders' },
  { value: 'rating',       label: 'Top Rated' },
  { value: 'spend_desc',   label: 'Highest Budget' },
  { value: 'newest',       label: 'Newest' },
] as const;

const SIZE_OPTIONS: { value: OrgSize; label: string }[] = [
  { value: 'startup',    label: 'Startup' },
  { value: 'sme',        label: 'SME' },
  { value: 'enterprise', label: 'Enterprise' },
];

const DEFAULT_FILTERS: OrgFilters = { page: 1, limit: 12, sortBy: 'tenders_desc' };

// ─── Mock hook — replace with real implementation ─────────────────────────────
// DELETE this block and import useListOrganizations from @/hooks/useOrgMarketplace
function useListOrganizations(_filters: OrgFilters) {
  // Placeholder: returns loading + empty state until real hook is wired
  return {
    data: undefined as { organizations: OrgListItem[]; pagination: { total: number; page: number; limit: number; totalPages: number } } | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
  };
}
function useToggleFollowOrg() {
  return { mutate: (_id: string, _opts?: any) => {}, isPending: false };
}
function useSavedOrgs(_page: number) {
  return { data: undefined as { organizations: OrgListItem[]; pagination: any } | undefined, isLoading: false };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganizationMarketplacePage() {
  const [filters, setFilters]       = useState<OrgFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState<'browse' | 'saved'>('browse');
  const [savedPage, setSavedPage]   = useState(1);
  const [savingId, setSavingId]     = useState<string | null>(null);

  // Search debounce — searches org name, tagline, industry
  const debouncedSearch = useDebounce(searchInput, 400);
  useEffect(() => {
    setFilters((p) => ({ ...p, search: debouncedSearch || undefined, page: 1 }));
  }, [debouncedSearch]);

  const { data, isLoading, isFetching, isError } = useListOrganizations(filters);
  const { data: savedData, isLoading: savedLoading } = useSavedOrgs(savedPage);
  const toggleFollow = useToggleFollowOrg();

  const orgs       = data?.organizations ?? [];
  const pagination = data?.pagination;
  const savedOrgs  = savedData?.organizations ?? [];
  const savedPagination = savedData?.pagination;
  const savedIds   = new Set(savedOrgs.map((o) => o._id));

  const handleToggleSave = useCallback(
    (id: string) => {
      setSavingId(id);
      toggleFollow.mutate(id, { onSettled: () => setSavingId(null) });
    },
    [toggleFollow]
  );

  const updateFilter = <K extends keyof OrgFilters>(key: K, value: OrgFilters[K]) => {
    setFilters((p) => ({ ...p, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
  };

  const hasActiveFilters = !!(
    filters.industry || filters.size || filters.location ||
    filters.minBudget || filters.maxBudget || filters.minRating ||
    filters.verified || filters.hasActiveTenders || filters.search
  );

  return (
    <DashboardLayout requiredRole="freelancer">
      <div className="p-4 sm:p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {/* Distinct blue gradient header to differentiate from amber marketplace */}
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className={cn('text-lg font-bold', colorClasses.text.primary)}>Organization Directory</h2>
            </div>
            <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>
              Discover companies and organizations actively hiring freelancers
            </p>
          </div>

          {/* View toggle */}
          <div className={cn('flex rounded-xl border p-1 self-start sm:self-auto', colorClasses.border.gray100, colorClasses.bg.secondary)}>
            {[
              { id: 'browse', label: 'Browse', icon: <Building2 className="w-3.5 h-3.5" /> },
              { id: 'saved',  label: 'Saved',  icon: <Bookmark className="w-3.5 h-3.5" /> },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id as typeof activeView)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  activeView === v.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : cn(colorClasses.text.muted, 'hover:text-blue-600 dark:hover:text-blue-400')
                )}
              >
                {v.icon}
                {v.label}
                {v.id === 'saved' && savedPagination?.total > 0 && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', activeView === 'saved' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400')}>
                    {savedPagination.total}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─────────── BROWSE VIEW ─────────── */}
        {activeView === 'browse' && (
          <>
            {/* Search + filter bar */}
            <div className="flex gap-2">
              <div className={cn('flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border', colorClasses.bg.primary, colorClasses.border.gray100)}>
                <Search className={cn('w-4 h-4 shrink-0', colorClasses.text.muted)} />
                <input
                  type="text"
                  placeholder="Search by name, industry, location…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn('flex-1 bg-transparent text-sm outline-none', colorClasses.text.primary, 'placeholder:text-gray-400')}
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')}>
                    <X className={cn('w-3.5 h-3.5', colorClasses.text.muted)} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors',
                  showFilters
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                    : cn(colorClasses.bg.primary, colorClasses.border.gray100, colorClasses.text.secondary)
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className={cn('p-4 rounded-xl border space-y-4', colorClasses.bg.secondary, colorClasses.border.gray100)}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-medium', colorClasses.text.muted)}>Sort:</span>
                    {SORT_OPTIONS.map((opt) => (
                      <FilterChip key={opt.value} label={opt.label} active={filters.sortBy === opt.value} onClick={() => updateFilter('sortBy', opt.value)} />
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className={cn('flex items-center gap-1 text-xs', colorClasses.text.muted, 'hover:text-red-500 transition-colors')}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Organization Size</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((opt) => (
                      <FilterChip key={opt.value} label={opt.label} active={filters.size === opt.value} onClick={() => updateFilter('size', filters.size === opt.value ? undefined : opt.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Min Freelancer Rating</p>
                  <div className="flex flex-wrap gap-2">
                    {[3, 3.5, 4, 4.5].map((r) => (
                      <FilterChip key={r} label={`${r}★+`} active={filters.minRating === r} onClick={() => updateFilter('minRating', filters.minRating === r ? undefined : r)} />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="verified" checked={!!filters.verified} onChange={(e) => updateFilter('verified', e.target.checked || undefined)} className="w-3.5 h-3.5 accent-blue-500 rounded" />
                    <label htmlFor="verified" className={cn('text-xs font-medium cursor-pointer flex items-center gap-1', colorClasses.text.secondary)}>
                      <Shield className="w-3 h-3 text-blue-500" />Verified only
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="activeTenders" checked={!!filters.hasActiveTenders} onChange={(e) => updateFilter('hasActiveTenders', e.target.checked || undefined)} className="w-3.5 h-3.5 accent-blue-500 rounded" />
                    <label htmlFor="activeTenders" className={cn('text-xs font-medium cursor-pointer flex items-center gap-1', colorClasses.text.secondary)}>
                      <Briefcase className="w-3 h-3 text-teal-500" />Has active tenders
                    </label>
                  </div>
                </div>

                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Location</p>
                  <input
                    type="text"
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value || undefined)}
                    placeholder="e.g., Addis Ababa, Remote"
                    className={cn('w-full max-w-xs rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-400', colorClasses.bg.primary, colorClasses.border.gray100, colorClasses.text.primary)}
                  />
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className={cn('text-xs', colorClasses.text.muted)}>
                {pagination ? `${pagination.total.toLocaleString()} organization${pagination.total !== 1 ? 's' : ''} found` : ''}
                {filters.search && <span className="ml-1 text-blue-600 dark:text-blue-400">for &quot;{filters.search}&quot;</span>}
              </p>
              {isFetching && !isLoading && <Loader2 className={cn('w-4 h-4 animate-spin', colorClasses.text.muted)} />}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className={cn('rounded-2xl h-52 animate-pulse', colorClasses.bg.secondary)} />)}
              </div>
            ) : isError ? (
              <div className={cn('flex flex-col items-center gap-3 py-16 rounded-2xl', colorClasses.bg.secondary)}>
                <p className={cn('text-sm', colorClasses.text.muted)}>Failed to load organizations.</p>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS })} className="text-xs text-blue-600 hover:underline">Try again</button>
              </div>
            ) : orgs.length === 0 ? (
              <div className={cn('flex flex-col items-center gap-3 py-16 rounded-2xl', colorClasses.bg.secondary)}>
                <Building2 className={cn('w-8 h-8', colorClasses.text.muted)} />
                <p className={cn('text-sm font-medium', colorClasses.text.primary)}>No organizations found</p>
                <p className={cn('text-xs', colorClasses.text.muted)}>
                  {filters.search ? `No results for "${filters.search}"` : 'Try adjusting your filters'}
                </p>
                {hasActiveFilters && <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Clear filters</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgs.map((org) => (
                  <OrgCard key={org._id} org={org} isSaved={savedIds.has(org._id)} onToggleSave={handleToggleSave} isSaving={savingId === org._id} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
                  disabled={(filters.page ?? 1) <= 1}
                  className={cn('flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.secondary)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const p = filters.page ?? 1;
                    const start = Math.max(1, Math.min(p - 2, pagination.totalPages - 4));
                    const pageNum = start + i;
                    if (pageNum > pagination.totalPages) return null;
                    return (
                      <button key={pageNum} onClick={() => setFilters((prev) => ({ ...prev, page: pageNum }))}
                        className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors border', pageNum === p ? 'bg-blue-600 text-white border-blue-600' : cn(colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.muted, 'hover:border-blue-300'))}>
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setFilters((p) => ({ ...p, page: Math.min(pagination.totalPages, (p.page ?? 1) + 1) }))}
                  disabled={(filters.page ?? 1) >= pagination.totalPages}
                  className={cn('flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.secondary)}
                >
                  Next<ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ─────────── SAVED VIEW ─────────── */}
        {activeView === 'saved' && (
          <>
            <div className="flex items-center justify-between">
              <p className={cn('text-xs', colorClasses.text.muted)}>
                {savedPagination ? `${savedPagination.total} saved organization${savedPagination.total !== 1 ? 's' : ''}` : 'Your saved organizations'}
              </p>
            </div>
            {savedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className={cn('rounded-2xl h-52 animate-pulse', colorClasses.bg.secondary)} />)}
              </div>
            ) : savedOrgs.length === 0 ? (
              <div className={cn('flex flex-col items-center gap-3 py-16 rounded-2xl', colorClasses.bg.secondary)}>
                <Bookmark className={cn('w-8 h-8', colorClasses.text.muted)} />
                <p className={cn('text-sm font-medium', colorClasses.text.primary)}>No saved organizations</p>
                <p className={cn('text-xs', colorClasses.text.muted)}>Save organizations from the Browse tab</p>
                <button onClick={() => setActiveView('browse')} className="text-xs text-blue-600 hover:underline">Browse organizations</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedOrgs.map((org) => <OrgCard key={org._id} org={org} isSaved onToggleSave={handleToggleSave} isSaving={savingId === org._id} />)}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}