/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tender/shared/FilterBar.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses, colors } from '@/utils/color';

interface FilterBarProps {
    tenderType: 'freelance' | 'professional';
    filters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onClearAll: () => void;
    categories?: { category: string; subcategories: string[] }[];
}

const SORT_OPTIONS = [
    { value: 'createdAt_desc', label: 'Newest First' },
    { value: 'createdAt_asc', label: 'Oldest First' },
    { value: 'deadline_asc', label: 'Deadline (Soonest)' },
    { value: 'deadline_desc', label: 'Deadline (Latest)' },
];

const PROCUREMENT_METHODS = [
    { value: 'open_tender', label: 'Open Tender' },
    { value: 'restricted_tender', label: 'Restricted Tender' },
    { value: 'request_for_proposal', label: 'RFP' },
    { value: 'request_for_quotation', label: 'RFQ' },
    { value: 'sole_source', label: 'Sole Source' },
    { value: 'two_stage_tender', label: 'Two-Stage' },
    { value: 'framework_agreement', label: 'Framework Agreement' },
];

const ENGAGEMENT_TYPES = ['fixed_price', 'hourly'];
const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];

function FilterPill({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-lg border h-9 px-3 text-sm font-medium transition-all whitespace-nowrap',
                active
                    ? 'bg-[#0A2540] text-white border-[#0A2540] dark:bg-white dark:text-[#0A2540] dark:border-white'
                    : cn('border', colorClasses.border.primary, colorClasses.text.primary, colorClasses.bg.primary, 'hover:bg-secondary/50')
            )}
        >
            {children}
        </button>
    );
}

export function FilterBar({ tenderType, filters, onFilterChange, onClearAll, categories }: FilterBarProps) {
    const [searchValue, setSearchValue] = useState(filters.search || '');

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            if (searchValue !== (filters.search || '')) {
                onFilterChange('search', searchValue || undefined);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [searchValue]); // eslint-disable-line

    // Active filter labels for chips
    const activeChips: { key: string; label: string }[] = [];
    if (filters.search) activeChips.push({ key: 'search', label: `"${filters.search}"` });
    if (filters.engagementType) activeChips.push({ key: 'engagementType', label: filters.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly' });
    if (filters.experienceLevel) activeChips.push({ key: 'experienceLevel', label: filters.experienceLevel });
    if (filters.urgency) activeChips.push({ key: 'urgency', label: 'Urgent' });
    if (filters.workflowType) activeChips.push({ key: 'workflowType', label: filters.workflowType === 'open' ? 'Open Bids' : 'Sealed Bids' });
    if (filters.procurementMethod) activeChips.push({ key: 'procurementMethod', label: PROCUREMENT_METHODS.find(m => m.value === filters.procurementMethod)?.label || filters.procurementMethod });
    if (filters.cpoRequired) activeChips.push({ key: 'cpoRequired', label: 'CPO Required' });
    if (filters.procurementCategory) activeChips.push({ key: 'procurementCategory', label: filters.procurementCategory });
    if (filters.minBudget || filters.maxBudget) {
        const label = [filters.minBudget && `Min ${filters.minBudget}`, filters.maxBudget && `Max ${filters.maxBudget}`].filter(Boolean).join(' – ');
        activeChips.push({ key: 'budget', label });
    }

    const sortValue = `${filters.sortBy || 'createdAt'}_${filters.sortOrder || 'desc'}`;

    return (
        <div className={cn('space-y-3 p-4 rounded-xl border', colorClasses.bg.primary, colorClasses.border.secondary)}>
            {/* Row 1: Search */}
            <div className="relative">
                <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', colorClasses.text.muted)} />
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={tenderType === 'freelance'
                        ? 'Search projects, skills, or keywords...'
                        : 'Search tenders, categories, or reference numbers...'}
                    className={cn(
                        'w-full pl-9 pr-4 h-10 rounded-lg border text-sm outline-none transition-all',
                        colorClasses.bg.primary,
                        colorClasses.border.primary,
                        colorClasses.text.primary,
                        'placeholder:text-[#A0A0A0] dark:placeholder:text-gray-500',
                        'focus:ring-2 focus:ring-[#F1BB03]/60 focus:border-[#F1BB03]'
                    )}
                />
                {searchValue && (
                    <button
                        type="button"
                        onClick={() => { setSearchValue(''); onFilterChange('search', undefined); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                        <X className={cn('h-4 w-4', colorClasses.text.muted)} />
                    </button>
                )}
            </div>

            {/* Row 2: Filter Pills */}
            <div className="flex gap-2 flex-wrap">
                {tenderType === 'freelance' ? (
                    <>
                        {/* Engagement Type */}
                        <div className="flex gap-1">
                            {ENGAGEMENT_TYPES.map((et) => (
                                <FilterPill
                                    key={et}
                                    active={filters.engagementType === et}
                                    onClick={() => onFilterChange('engagementType', filters.engagementType === et ? undefined : et)}
                                >
                                    {et === 'fixed_price' ? 'Fixed' : 'Hourly'}
                                </FilterPill>
                            ))}
                        </div>

                        {/* Experience Level */}
                        <div className="flex gap-1">
                            {EXPERIENCE_LEVELS.map((lv) => (
                                <FilterPill
                                    key={lv}
                                    active={filters.experienceLevel === lv}
                                    onClick={() => onFilterChange('experienceLevel', filters.experienceLevel === lv ? undefined : lv)}
                                >
                                    {lv.charAt(0).toUpperCase() + lv.slice(1)}
                                </FilterPill>
                            ))}
                        </div>

                        {/* Urgency */}
                        <FilterPill
                            active={filters.urgency === 'urgent'}
                            onClick={() => onFilterChange('urgency', filters.urgency === 'urgent' ? undefined : 'urgent')}
                        >
                            ⚡ Urgent
                        </FilterPill>
                    </>
                ) : (
                    <>
                        {/* Workflow Type */}
                        <div className="flex gap-1">
                            {(['open', 'closed'] as const).map((wt) => (
                                <FilterPill
                                    key={wt}
                                    active={filters.workflowType === wt}
                                    onClick={() => onFilterChange('workflowType', filters.workflowType === wt ? undefined : wt)}
                                >
                                    {wt === 'open' ? 'Open Bids' : '🔒 Sealed Bids'}
                                </FilterPill>
                            ))}
                        </div>

                        {/* Procurement Method dropdown */}
                        <div className="relative">
                            <select
                                value={filters.procurementMethod || ''}
                                onChange={(e) => onFilterChange('procurementMethod', e.target.value || undefined)}
                                className={cn(
                                    'h-9 rounded-lg border text-sm px-3 pr-8 outline-none appearance-none cursor-pointer',
                                    colorClasses.bg.primary,
                                    colorClasses.border.primary,
                                    colorClasses.text.primary,
                                    'focus:ring-2 focus:ring-[#F1BB03]/60'
                                )}
                            >
                                <option value="">Procurement Method</option>
                                {PROCUREMENT_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <ChevronDown className={cn('absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none', colorClasses.text.muted)} />
                        </div>

                        {/* CPO Toggle */}
                        <FilterPill
                            active={!!filters.cpoRequired}
                            onClick={() => onFilterChange('cpoRequired', filters.cpoRequired ? undefined : true)}
                        >
                            CPO Required
                        </FilterPill>
                    </>
                )}

                {/* Category dropdown (shared) */}
                {categories && categories.length > 0 && (
                    <div className="relative">
                        <select
                            value={filters.procurementCategory || ''}
                            onChange={(e) => onFilterChange('procurementCategory', e.target.value || undefined)}
                            className={cn(
                                'h-9 rounded-lg border text-sm px-3 pr-8 outline-none appearance-none cursor-pointer max-w-[180px]',
                                colorClasses.bg.primary,
                                colorClasses.border.primary,
                                colorClasses.text.primary,
                                'focus:ring-2 focus:ring-[#F1BB03]/60'
                            )}
                        >
                            <option value="">Category</option>
                            {categories.map((cat) => (
                                <optgroup key={cat.category} label={cat.category}>
                                    {cat.subcategories.map((sub) => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <ChevronDown className={cn('absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none', colorClasses.text.muted)} />
                    </div>
                )}

                {/* Sort */}
                <div className="relative ml-auto">
                    <select
                        value={sortValue}
                        onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split('_');
                            onFilterChange('sortBy', sortBy);
                            onFilterChange('sortOrder', sortOrder);
                        }}
                        className={cn(
                            'h-9 rounded-lg border text-sm px-3 pr-8 outline-none appearance-none cursor-pointer',
                            colorClasses.bg.primary,
                            colorClasses.border.primary,
                            colorClasses.text.primary,
                            'focus:ring-2 focus:ring-[#F1BB03]/60'
                        )}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown className={cn('absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none', colorClasses.text.muted)} />
                </div>
            </div>

            {/* Row 3: Active chips */}
            {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    {activeChips.map((chip) => (
                        <span
                            key={chip.key}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#F1BB03]/10 text-[#B45309] dark:text-[#F1BB03] px-2.5 py-1 text-xs font-medium"
                        >
                            {chip.label}
                            <button
                                type="button"
                                onClick={() => {
                                    if (chip.key === 'budget') {
                                        onFilterChange('minBudget', undefined);
                                        onFilterChange('maxBudget', undefined);
                                    } else {
                                        onFilterChange(chip.key, undefined);
                                    }
                                }}
                                className="hover:opacity-70"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    {activeChips.length > 1 && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            className={cn('text-xs font-medium ml-1', colorClasses.text.muted, 'hover:text-primary')}
                        >
                            Clear All
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}