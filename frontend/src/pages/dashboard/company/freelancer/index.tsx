/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/freelancer/index.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FreelancerCard from '@/components/freelancer-marketplace/FreelancerCard';
import {
  Search, SlidersHorizontal, Loader2, X, ChevronLeft, ChevronRight,
  Bookmark, Users, RotateCcw, ChevronDown,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import {
  useListFreelancers, useToggleShortlist, useShortlist,
} from '@/hooks/useFreelancerMarketplace';
import {
  FreelancerFilters, AvailabilityStatus, ExperienceLevel, SortOption,
} from '@/services/freelancerMarketplaceService';
import freelancerMarketplaceService from '@/services/freelancerMarketplaceService';
import { useDebounce } from '@/hooks/useDebounce';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rating',      label: 'Top Rated' },
  { value: 'rate_asc',    label: 'Rate: Low → High' },
  { value: 'rate_desc',   label: 'Rate: High → Low' },
  { value: 'newest',      label: 'Newest' },
  { value: 'most_active', label: 'Most Active' },
];
const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: 'available',     label: 'Available Now' },
  { value: 'part-time',     label: 'Part-time' },
  { value: 'not-available', label: 'Unavailable' },
];
const LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry',        label: 'Entry' },
  { value: 'intermediate', label: 'Mid-level' },
  { value: 'expert',       label: 'Expert' },
];
const DEFAULT_FILTERS: FreelancerFilters = { page: 1, limit: 12, sortBy: 'rating' };

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
      active
        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
        : cn(colorClasses.bg.secondary, colorClasses.text.secondary, colorClasses.border.gray100, 'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400')
    )}
  >
    {label}
  </button>
);

export default function FreelancerMarketplacePage() {
  const [filters, setFilters]     = useState<FreelancerFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearch]  = useState('');
  const [showFilters, setShowFlt] = useState(false);
  const [rateRange, setRateRange] = useState<[number, number]>([0, 500]);
  const [activeView, setView]     = useState<'browse' | 'shortlist'>('browse');
  const [shortlistPage, setSlPage]= useState(1);
  const [savingId, setSavingId]   = useState<string | null>(null);

  // Profession state
  const [professions, setProfessions] = useState<string[]>([]);
  const [profOpen, setProfOpen]       = useState(false);

  // Load profession list once
  useEffect(() => {
    freelancerMarketplaceService.getProfessions()
      .then(setProfessions)
      .catch(() => {/* silently ignore */});
  }, []);

  // FIX 1: debounce search → passes to backend which searches name + headline + profession
  const debounced = useDebounce(searchInput, 400);
  useEffect(() => {
    setFilters(p => ({ ...p, search: debounced || undefined, page: 1 }));
  }, [debounced]);

  const { data, isLoading, isFetching, isError } = useListFreelancers(filters);
  const { data: slData, isLoading: slLoading }    = useShortlist(shortlistPage);
  const toggleSave = useToggleShortlist();

  const freelancers  = data?.freelancers ?? [];
  const pagination   = data?.pagination;
  const shortlist    = slData?.freelancers ?? [];
  const slPagination = slData?.pagination;
  const savedIds     = new Set(shortlist.map(f => f._id));

  const handleToggleSave = useCallback((id: string) => {
    setSavingId(id);
    toggleSave.mutate(id, { onSettled: () => setSavingId(null) });
  }, [toggleSave]);

  const setFilter = <K extends keyof FreelancerFilters>(k: K, v: FreelancerFilters[K]) =>
    setFilters(p => ({ ...p, [k]: v, page: 1 }));

  const reset = () => { setFilters(DEFAULT_FILTERS); setSearch(''); setRateRange([0, 500]); };

  const hasActive = !!(
    filters.availability || filters.experienceLevel || filters.profession ||
    filters.minRate || filters.maxRate || filters.minRating || filters.featured || filters.search
  );

  return (
    <DashboardLayout requiredRole="company">
      <div className="p-4 sm:p-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className={cn('text-lg font-bold', colorClasses.text.primary)}>Freelancer Marketplace</h2>
            <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>Find and hire skilled freelancers for your projects</p>
          </div>
          <div className={cn('flex rounded-xl border p-1 self-start sm:self-auto', colorClasses.border.gray100, colorClasses.bg.secondary)}>
            {[{id:'browse',label:'Browse',icon:<Users className="w-3.5 h-3.5" />},{id:'shortlist',label:'Shortlist',icon:<Bookmark className="w-3.5 h-3.5" />}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id as any)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150', activeView===v.id?'bg-amber-500 text-white shadow-sm':cn(colorClasses.text.muted,'hover:text-amber-600 dark:hover:text-amber-400'))}>
                {v.icon}{v.label}
                {v.id==='shortlist'&&(slPagination?.total??0)>0&&<span className={cn('text-[10px] px-1.5 py-0.5 rounded-full',activeView==='shortlist'?'bg-white/20':'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>{slPagination!.total}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* BROWSE VIEW */}
        {activeView === 'browse' && (
          <>
            {/* Search + filter toggle */}
            <div className="flex gap-2">
              <div className={cn('flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border', colorClasses.bg.primary, colorClasses.border.gray100)}>
                <Search className={cn('w-4 h-4 shrink-0', colorClasses.text.muted)} />
                {/* FIX 1: placeholder clarifies name/headline search */}
                <input type="text" placeholder="Search by name, headline, profession, skill…" value={searchInput} onChange={e=>setSearch(e.target.value)} className={cn('flex-1 bg-transparent text-sm outline-none', colorClasses.text.primary,'placeholder:text-gray-400')} />
                {searchInput&&<button onClick={()=>setSearch('')}><X className={cn('w-3.5 h-3.5', colorClasses.text.muted)} /></button>}
              </div>
              <button onClick={()=>setShowFlt(p=>!p)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors',showFilters?'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800':cn(colorClasses.bg.primary,colorClasses.border.gray100,colorClasses.text.secondary))}>
                <SlidersHorizontal className="w-3.5 h-3.5" /><span className="hidden sm:inline">Filters</span>
                {hasActive&&<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </button>
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className={cn('p-4 rounded-xl border space-y-4', colorClasses.bg.secondary, colorClasses.border.gray100)}>

                {/* Sort + reset */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-medium', colorClasses.text.muted)}>Sort:</span>
                    {SORT_OPTIONS.map(o=><FilterChip key={o.value} label={o.label} active={filters.sortBy===o.value} onClick={()=>setFilter('sortBy',o.value)} />)}
                  </div>
                  {hasActive&&<button onClick={reset} className={cn('flex items-center gap-1 text-xs', colorClasses.text.muted,'hover:text-red-500 transition-colors')}><RotateCcw className="w-3 h-3" />Reset</button>}
                </div>

                {/* Profession dropdown — FIX 2: lets company filter by profession */}
                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Profession</p>
                  <div className="relative">
                    <button
                      onClick={()=>setProfOpen(p=>!p)}
                      className={cn('w-full sm:w-72 flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors', colorClasses.bg.primary, colorClasses.border.gray100, colorClasses.text.primary, 'focus:ring-1 focus:ring-amber-400')}
                    >
                      <span className={filters.profession ? colorClasses.text.primary : colorClasses.text.muted}>
                        {filters.profession || 'All professions'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {filters.profession && (
                          <button onClick={e=>{e.stopPropagation();setFilter('profession',undefined);}} className="text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', colorClasses.text.muted, profOpen && 'rotate-180')} />
                      </div>
                    </button>
                    {profOpen && (
                      <div className={cn('absolute z-20 mt-1 w-full sm:w-72 max-h-64 overflow-y-auto rounded-xl border shadow-lg', colorClasses.bg.primary, colorClasses.border.gray100)}>
                        <button onClick={()=>{setFilter('profession',undefined);setProfOpen(false);}} className={cn('w-full text-left px-3 py-2 text-xs transition-colors', colorClasses.text.muted,'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600')}>
                          All professions
                        </button>
                        {professions.map(prof=>(
                          <button key={prof} onClick={()=>{setFilter('profession',prof);setProfOpen(false);}} className={cn('w-full text-left px-3 py-2 text-xs transition-colors', filters.profession===prof?'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-semibold':cn(colorClasses.text.secondary,'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600'))}>
                            {prof}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Availability</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_OPTIONS.map(o=><FilterChip key={o.value} label={o.label} active={filters.availability===o.value} onClick={()=>setFilter('availability',filters.availability===o.value?undefined:o.value)} />)}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Experience Level</p>
                  <div className="flex flex-wrap gap-2">
                    {LEVEL_OPTIONS.map(o=><FilterChip key={o.value} label={o.label} active={filters.experienceLevel===o.value} onClick={()=>setFilter('experienceLevel',filters.experienceLevel===o.value?undefined:o.value)} />)}
                  </div>
                </div>

                {/* Hourly rate */}
                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>
                    Hourly Rate: ${rateRange[0]} – ${rateRange[1]>=500?'500+':rateRange[1]}
                  </p>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={500} step={10} value={rateRange[0]} onChange={e=>{const v=Number(e.target.value);setRateRange([v,Math.max(v+10,rateRange[1])]);setFilter('minRate',v||undefined);}} className="flex-1 accent-amber-500" />
                    <input type="range" min={0} max={500} step={10} value={rateRange[1]} onChange={e=>{const v=Number(e.target.value);setRateRange([Math.min(rateRange[0],v-10),v]);setFilter('maxRate',v>=500?undefined:v);}} className="flex-1 accent-amber-500" />
                  </div>
                </div>

                {/* Min rating */}
                <div>
                  <p className={cn('text-xs font-medium mb-2', colorClasses.text.muted)}>Min Rating</p>
                  <div className="flex flex-wrap gap-2">
                    {[3,3.5,4,4.5].map(r=><FilterChip key={r} label={`${r}★+`} active={filters.minRating===r} onClick={()=>setFilter('minRating',filters.minRating===r?undefined:r)} />)}
                  </div>
                </div>

                {/* Featured */}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="featured" checked={!!filters.featured} onChange={e=>setFilter('featured',e.target.checked||undefined)} className="w-3.5 h-3.5 accent-amber-500 rounded" />
                  <label htmlFor="featured" className={cn('text-xs font-medium cursor-pointer', colorClasses.text.secondary)}>Featured freelancers only</label>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className={cn('text-xs', colorClasses.text.muted)}>
                {pagination ? `${pagination.total.toLocaleString()} freelancer${pagination.total!==1?'s':''} found` : ''}
                {filters.search && <span className="ml-1 text-amber-600 dark:text-amber-400">for &quot;{filters.search}&quot;</span>}
                {filters.profession && <span className="ml-1 text-amber-600 dark:text-amber-400">· {filters.profession}</span>}
              </p>
              {isFetching&&!isLoading&&<Loader2 className={cn('w-4 h-4 animate-spin', colorClasses.text.muted)} />}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({length:6}).map((_,i)=><div key={i} className={cn('rounded-2xl h-48 animate-pulse', colorClasses.bg.secondary)} />)}
              </div>
            ) : isError ? (
              <div className={cn('flex flex-col items-center gap-3 py-16 rounded-2xl', colorClasses.bg.secondary)}>
                <p className={cn('text-sm', colorClasses.text.muted)}>Failed to load freelancers.</p>
                <button onClick={()=>setFilters({...DEFAULT_FILTERS})} className="text-xs text-amber-600 hover:underline">Try again</button>
              </div>
            ) : freelancers.length===0 ? (
              <div className={cn('flex flex-col items-center gap-3 py-16 rounded-2xl', colorClasses.bg.secondary)}>
                <Users className={cn('w-8 h-8', colorClasses.text.muted)} />
                <p className={cn('text-sm font-medium', colorClasses.text.primary)}>No freelancers found</p>
                <p className={cn('text-xs', colorClasses.text.muted)}>
                  {filters.search ? `No results for "${filters.search}"` : filters.profession ? `No ${filters.profession} freelancers found` : 'Try adjusting your filters'}
                </p>
                {hasActive&&<button onClick={reset} className="text-xs text-amber-600 hover:underline">Clear filters</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {freelancers.map(f=><FreelancerCard key={f._id} freelancer={f} isSaved={savedIds.has(f._id)} onToggleSave={handleToggleSave} isSaving={savingId===f._id} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination&&pagination.totalPages>1&&(
              <div className="flex items-center justify-center gap-3 mt-2">
                <button onClick={()=>setFilters(p=>({...p,page:Math.max(1,(p.page??1)-1)}))} disabled={(filters.page??1)<=1} className={cn('flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.secondary)}>
                  <ChevronLeft className="w-3.5 h-3.5" />Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({length:Math.min(5,pagination.totalPages)},(_,i)=>{const p=filters.page??1;const start=Math.max(1,Math.min(p-2,pagination.totalPages-4));const pn=start+i;if(pn>pagination.totalPages)return null;return<button key={pn} onClick={()=>setFilters(prev=>({...prev,page:pn}))} className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors border',pn===p?'bg-amber-500 text-white border-amber-500':cn(colorClasses.bg.secondary,colorClasses.border.gray100,colorClasses.text.muted,'hover:border-amber-300'))}>{pn}</button>;})}
                </div>
                <button onClick={()=>setFilters(p=>({...p,page:Math.min(pagination.totalPages,(p.page??1)+1)}))} disabled={(filters.page??1)>=pagination.totalPages} className={cn('flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100, colorClasses.text.secondary)}>
                  Next<ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* SHORTLIST VIEW */}
        {activeView==='shortlist'&&(
          <>
            <div className="flex items-center justify-between">
              <p className={cn('text-xs', colorClasses.text.muted)}>{slPagination?`${slPagination.total} saved freelancer${slPagination.total!==1?'s':''}`:'Your saved freelancers'}</p>
            </div>
            {slLoading?(
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><div key={i} className={cn('rounded-2xl h-48 animate-pulse', colorClasses.bg.secondary)} />)}</div>
            ):shortlist.length===0?(
              <div className={cn('flex flex-col items-center gap-3 py-16 rounded-2xl', colorClasses.bg.secondary)}>
                <Bookmark className={cn('w-8 h-8', colorClasses.text.muted)} />
                <p className={cn('text-sm font-medium', colorClasses.text.primary)}>No saved freelancers</p>
                <p className={cn('text-xs', colorClasses.text.muted)}>Save freelancers from the Browse tab</p>
                <button onClick={()=>setView('browse')} className="text-xs text-amber-600 hover:underline">Browse freelancers</button>
              </div>
            ):(
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shortlist.map(f=><FreelancerCard key={f._id} freelancer={f} isSaved onToggleSave={handleToggleSave} isSaving={savingId===f._id} />)}
              </div>
            )}
            {slPagination&&slPagination.totalPages>1&&(
              <div className="flex items-center justify-center gap-3 mt-2">
                <button onClick={()=>setSlPage(p=>Math.max(1,p-1))} disabled={shortlistPage<=1} className={cn('p-1.5 rounded-lg border transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100)}><ChevronLeft className={cn('w-4 h-4', colorClasses.text.muted)} /></button>
                <span className={cn('text-xs', colorClasses.text.muted)}>{shortlistPage} / {slPagination.totalPages}</span>
                <button onClick={()=>setSlPage(p=>Math.min(slPagination.totalPages,p+1))} disabled={shortlistPage>=slPagination.totalPages} className={cn('p-1.5 rounded-lg border transition-colors disabled:opacity-40', colorClasses.bg.secondary, colorClasses.border.gray100)}><ChevronRight className={cn('w-4 h-4', colorClasses.text.muted)} /></button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}