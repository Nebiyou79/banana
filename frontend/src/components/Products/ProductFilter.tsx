/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ProductFilters } from '@/services/productService';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import {
  X,
  SlidersHorizontal,
  Tag,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  DollarSign,
  LayoutGrid,
  LayoutList,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses, ThemeMode } from '@/utils/color';

// ─────────────────────────────────────────────
// Dark-mode helper strings
// ─────────────────────────────────────────────
const darkInput =
  'dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-500 dark:focus:border-[#F1BB03]';
const darkSelect =
  'dark:bg-gray-800 dark:text-white dark:border-gray-600';
const darkSelectContent = 'dark:bg-gray-800 dark:border-gray-700';
const darkSelectItem =
  'dark:text-gray-200 dark:focus:bg-gray-700 dark:focus:text-white';
const darkLabel = 'dark:text-gray-200';
const darkSecondary = 'dark:bg-gray-800/60 dark:border-gray-700';
const darkMuted = 'dark:text-gray-400';
const darkCard = 'dark:bg-gray-900 dark:border-gray-700';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ProductFilterProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  availableTags?: string[];
  availableCategories?: string[];
  /** alias used by index.tsx — maps to availableCategories */
  categories?: Array<{ _id?: string; name: string } | string>;
  className?: string;
  theme?: ThemeMode;
  showLayoutToggle?: boolean;
  layout?: 'grid' | 'list';
  onLayoutChange?: (layout: 'grid' | 'list') => void;
  showStatusFilter?: boolean;
  showFeaturedFilter?: boolean;
  showCategoryFilter?: boolean;
  syncWithUrl?: boolean;
  compact?: boolean;
}

// ─────────────────────────────────────────────
// Sort options
// ─────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc',  label: 'Oldest first' },
  { value: 'price.amount-asc',  label: 'Price: Low → High' },
  { value: 'price.amount-desc', label: 'Price: High → Low' },
  { value: 'name-asc',  label: 'Name A – Z' },
  { value: 'name-desc', label: 'Name Z – A' },
  { value: 'views-desc', label: 'Most Popular' },
];

// ─────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────
const FilterSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: number;
}> = ({ title, icon, defaultOpen = true, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('border rounded-xl overflow-hidden', colorClasses.border.gray200, darkCard)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors',
          'hover:bg-gray-50 dark:hover:bg-gray-800/80',
          colorClasses.bg.primary,
          'dark:bg-gray-900',
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <span className={cn('shrink-0', colorClasses.text.goldenMustard)}>{icon}</span>}
          <span className={cn('text-xs font-semibold uppercase tracking-wide', colorClasses.text.primary, darkLabel)}>
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold flex items-center justify-center px-1">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className={cn('h-3.5 w-3.5 shrink-0', colorClasses.text.secondary, darkMuted)} />
          : <ChevronDown className={cn('h-3.5 w-3.5 shrink-0', colorClasses.text.secondary, darkMuted)} />
        }
      </button>
      {open && (
        <div className={cn('px-3.5 pb-3.5 pt-0', colorClasses.bg.primary, 'dark:bg-gray-900')}>
          <Separator className={cn('mb-3', colorClasses.border.gray200, 'dark:bg-gray-700/60')} />
          {children}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onFiltersChange,
  availableTags = [],
  availableCategories = [],
  categories = [],
  className,
  theme = 'light',
  showLayoutToggle = false,
  layout = 'grid',
  onLayoutChange,
  showStatusFilter = false,
  showFeaturedFilter = true,
  showCategoryFilter = true,
  syncWithUrl = false,
  compact = false,
}) => {
  // ── Local state ──
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice?.toString() || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice?.toString() || '');

  const { breakpoint } = useResponsive();

  const debouncedMinPrice = useDebounce(minPriceInput, 400);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 400);

  // ── Normalise categories prop ──
  const validCategories: string[] = [
    ...availableCategories,
    ...categories.map(c => (typeof c === 'string' ? c : c.name)),
  ].filter((c, i, arr) => c && c.trim() !== '' && arr.indexOf(c) === i);

  const validTags = availableTags.filter(t => t && t.trim() !== '');

  // ── Sync debounced price → filters ──
  useEffect(() => {
    const v = debouncedMinPrice ? parseFloat(debouncedMinPrice) : undefined;
    if (v !== filters.minPrice) updateFilter('minPrice', v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinPrice]);

  useEffect(() => {
    const v = debouncedMaxPrice ? parseFloat(debouncedMaxPrice) : undefined;
    if (v !== filters.maxPrice) updateFilter('maxPrice', v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaxPrice]);

  useEffect(() => {
    if (JSON.stringify(selectedTags) !== JSON.stringify(filters.tags || [])) {
      updateFilter('tags', selectedTags.length > 0 ? selectedTags : undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags]);

  // ── Helpers ──
  const updateFilter = useCallback(
    (key: keyof ProductFilters, value: any) => {
      onFiltersChange({ ...filters, [key]: value, page: 1 });
    },
    [filters, onFiltersChange],
  );

  const removeFilter = useCallback(
    (key: keyof ProductFilters) => {
      const next = { ...filters };
      delete next[key];
      if (key === 'tags') setSelectedTags([]);
      if (key === 'minPrice') setMinPriceInput('');
      if (key === 'maxPrice') setMaxPriceInput('');
      onFiltersChange({ ...next, page: 1 });
    },
    [filters, onFiltersChange],
  );

  const clearAllFilters = useCallback(() => {
    setSelectedTags([]);
    setMinPriceInput('');
    setMaxPriceInput('');
    onFiltersChange({ page: 1, limit: filters.limit, status: filters.status });
  }, [filters.limit, filters.status, onFiltersChange]);

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );

  const currentSort =
    filters.sortBy && filters.sortOrder
      ? `${filters.sortBy}-${filters.sortOrder}`
      : 'createdAt-desc';

  const activeCount = Object.keys(filters).filter(k => {
    const v = filters[k as keyof ProductFilters];
    if (k === 'page' || k === 'limit' || k === 'status') return false;
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '' && v !== null;
  }).length;

  // ── Active filter pills ──
  const ActivePills = () => {
    if (activeCount === 0) return null;
    return (
      <div className={cn(
        'flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg border',
        colorClasses.bg.secondary, colorClasses.border.gray200,
        darkSecondary,
      )}>
        <span className={cn('text-[11px] font-medium mr-0.5', colorClasses.text.secondary, darkMuted)}>
          Active:
        </span>
        {filters.search && (
          <Pill label={`"${filters.search}"`} onRemove={() => removeFilter('search')} />
        )}
        {filters.category && (
          <Pill label={filters.category} onRemove={() => removeFilter('category')} icon={<Tag className="h-2.5 w-2.5" />} />
        )}
        {filters.featured !== undefined && (
          <Pill label="Featured" onRemove={() => removeFilter('featured')} icon={<Sparkles className="h-2.5 w-2.5" />} />
        )}
        {filters.minPrice !== undefined && (
          <Pill label={`Min $${filters.minPrice}`} onRemove={() => removeFilter('minPrice')} icon={<DollarSign className="h-2.5 w-2.5" />} />
        )}
        {filters.maxPrice !== undefined && (
          <Pill label={`Max $${filters.maxPrice}`} onRemove={() => removeFilter('maxPrice')} icon={<DollarSign className="h-2.5 w-2.5" />} />
        )}
        {selectedTags.length > 0 && (
          <Pill label={`${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`} onRemove={() => removeFilter('tags')} icon={<Tag className="h-2.5 w-2.5" />} />
        )}
        <button
          onClick={clearAllFilters}
          className={cn('ml-auto text-[11px] underline hover:no-underline', colorClasses.text.secondary, darkMuted)}
        >
          Clear all
        </button>
      </div>
    );
  };

  // ── RENDER: top-bar horizontal layout (used by index.tsx) ──
  return (
    <div className={cn('space-y-2.5', className)}>
      {/* Row 1: Sort + Category + Price + Featured + Layout toggle */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ArrowUpDown className={cn('h-3.5 w-3.5', colorClasses.text.secondary, darkMuted)} />
          <Select
            value={currentSort}
            onValueChange={(v) => {
              const [sortBy, sortOrder] = v.split('-');
              onFiltersChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
            }}
          >
            <SelectTrigger
              className={cn(
                'h-8 text-xs min-w-[148px]',
                colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary,
                darkSelect,
              )}
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category (if available) */}
        {showCategoryFilter && validCategories.length > 0 && (
          <Select
            value={filters.category || 'all_categories'}
            onValueChange={(v) => updateFilter('category', v === 'all_categories' ? undefined : v)}
          >
            <SelectTrigger
              className={cn(
                'h-8 text-xs min-w-[140px]',
                colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary,
                darkSelect,
              )}
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
              <SelectItem value="all_categories" className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>All categories</SelectItem>
              {validCategories.map(cat => (
                <SelectItem key={cat} value={cat} className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Price range inline */}
        <div className="flex items-center gap-1 shrink-0">
          <DollarSign className={cn('h-3.5 w-3.5', colorClasses.text.secondary, darkMuted)} />
          <Input
            type="number"
            placeholder="Min"
            value={minPriceInput}
            onChange={e => setMinPriceInput(e.target.value)}
            className={cn(
              'h-8 w-20 text-xs',
              colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary,
              darkInput,
            )}
          />
          <span className={cn('text-xs', colorClasses.text.secondary, darkMuted)}>–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPriceInput}
            onChange={e => setMaxPriceInput(e.target.value)}
            className={cn(
              'h-8 w-20 text-xs',
              colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary,
              darkInput,
            )}
          />
        </div>

        {/* Featured toggle */}
        {showFeaturedFilter && (
          <button
            type="button"
            onClick={() => updateFilter('featured', filters.featured === true ? undefined : true)}
            className={cn(
              'h-8 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-all',
              filters.featured === true
                ? 'bg-[#F1BB03] border-[#F1BB03] text-[#0A2540]'
                : cn(colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.secondary, 'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:border-[#F1BB03]/60 hover:text-[#F1BB03]'),
            )}
          >
            <Sparkles className="h-3 w-3" />
            Featured
          </button>
        )}

        {/* Status (dashboard use) */}
        {showStatusFilter && (
          <Select
            value={filters.status || 'all_statuses'}
            onValueChange={(v) => updateFilter('status', v === 'all_statuses' ? undefined : v)}
          >
            <SelectTrigger className={cn('h-8 text-xs min-w-[120px]', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
              <SelectItem value="all_statuses" className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>All statuses</SelectItem>
              <SelectItem value="active"   className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>Active</SelectItem>
              <SelectItem value="inactive" className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>Inactive</SelectItem>
              <SelectItem value="draft"    className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>Draft</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Tags (if available — pill cloud) */}
        {validTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {validTags.slice(0, 6).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'h-7 flex items-center gap-1 px-2.5 rounded-full border text-[11px] font-medium transition-all',
                  selectedTags.includes(tag)
                    ? 'bg-[#F1BB03] border-[#F1BB03] text-[#0A2540]'
                    : cn(colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.secondary, 'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:border-[#F1BB03]/50'),
                )}
              >
                {selectedTags.includes(tag) && <Check className="h-2.5 w-2.5" />}
                {tag}
              </button>
            ))}
            {validTags.length > 6 && (
              <span className={cn('text-[11px]', colorClasses.text.secondary, darkMuted)}>
                +{validTags.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Clear all — only shown when filters active */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className={cn(
              'h-8 flex items-center gap-1.5 px-2.5 rounded-lg border text-xs font-medium transition-colors',
              colorClasses.border.gray200, colorClasses.text.secondary,
              'dark:border-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400',
            )}
          >
            <RefreshCw className="h-3 w-3" />
            Reset
            <span className="min-w-[16px] h-4 rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold flex items-center justify-center px-1">
              {activeCount}
            </span>
          </button>
        )}

        {/* Layout toggle (rightmost) */}
        {showLayoutToggle && onLayoutChange && (
          <div className={cn('ml-auto flex rounded-lg border overflow-hidden shrink-0', colorClasses.border.gray200, 'dark:border-gray-600')}>
            <button
              onClick={() => onLayoutChange('grid')}
              className={cn(
                'p-1.5 transition-colors',
                layout === 'grid' ? 'bg-[#F1BB03] text-[#0A2540]' : cn(colorClasses.bg.primary, colorClasses.text.secondary, 'dark:bg-gray-800 dark:text-gray-400'),
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onLayoutChange('list')}
              className={cn(
                'p-1.5 transition-colors',
                layout === 'list' ? 'bg-[#F1BB03] text-[#0A2540]' : cn(colorClasses.bg.primary, colorClasses.text.secondary, 'dark:bg-gray-800 dark:text-gray-400'),
              )}
              title="List view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Active filter pills */}
      <ActivePills />
    </div>
  );
};

// ─────────────────────────────────────────────
// Pill helper
// ─────────────────────────────────────────────
const Pill: React.FC<{ label: string; onRemove: () => void; icon?: React.ReactNode }> = ({
  label, onRemove, icon,
}) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-[#F1BB03]/40 bg-[#F1BB03]/10 text-[#b38b00] dark:text-[#F1BB03] dark:bg-[#F1BB03]/10 dark:border-[#F1BB03]/30">
    {icon}
    {label}
    <button type="button" onClick={onRemove} className="ml-0.5 hover:text-red-500 transition-colors">
      <X className="h-2.5 w-2.5" />
    </button>
  </span>
);

// ─────────────────────────────────────────────
// Sidebar variant (kept for dashboard compatibility)
// ─────────────────────────────────────────────
export const ProductFilterSidebar: React.FC<Omit<ProductFilterProps, 'compact'>> = ({
  filters,
  onFiltersChange,
  availableTags = [],
  availableCategories = [],
  categories = [],
  className,
  theme = 'light',
  showStatusFilter = false,
  showFeaturedFilter = true,
  showCategoryFilter = true,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice?.toString() || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice?.toString() || '');

  const debouncedMin = useDebounce(minPriceInput, 400);
  const debouncedMax = useDebounce(maxPriceInput, 400);

  const validCategories: string[] = [
    ...availableCategories,
    ...categories.map(c => (typeof c === 'string' ? c : (c as any).name)),
  ].filter((c, i, arr) => c && c.trim() !== '' && arr.indexOf(c) === i);
  const validTags = availableTags.filter(t => t && t.trim() !== '');

  useEffect(() => {
    const v = debouncedMin ? parseFloat(debouncedMin) : undefined;
    if (v !== filters.minPrice) onFiltersChange({ ...filters, minPrice: v, page: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin]);

  useEffect(() => {
    const v = debouncedMax ? parseFloat(debouncedMax) : undefined;
    if (v !== filters.maxPrice) onFiltersChange({ ...filters, maxPrice: v, page: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMax]);

  useEffect(() => {
    if (JSON.stringify(selectedTags) !== JSON.stringify(filters.tags || [])) {
      onFiltersChange({ ...filters, tags: selectedTags.length > 0 ? selectedTags : undefined, page: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags]);

  const updateFilter = (key: keyof ProductFilters, value: any) =>
    onFiltersChange({ ...filters, [key]: value, page: 1 });

  const clearAll = () => {
    setSelectedTags([]);
    setMinPriceInput('');
    setMaxPriceInput('');
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  const activeCount = Object.keys(filters).filter(k => {
    if (k === 'page' || k === 'limit' || k === 'status') return false;
    const v = filters[k as keyof ProductFilters];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '' && v !== null;
  }).length;

  const currentSort =
    filters.sortBy && filters.sortOrder
      ? `${filters.sortBy}-${filters.sortOrder}`
      : 'createdAt-desc';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className={cn('h-4 w-4', colorClasses.text.goldenMustard)} />
          <h3 className={cn('font-semibold text-sm', colorClasses.text.primary, darkLabel)}>Filters</h3>
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold flex items-center justify-center px-1">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className={cn('text-[11px] underline', colorClasses.text.secondary, darkMuted)}>
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <FilterSection title="Sort By" icon={<ArrowUpDown className="h-3.5 w-3.5" />}>
        <Select
          value={currentSort}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split('-');
            onFiltersChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
          }}
        >
          <SelectTrigger className={cn('h-8 text-xs w-full', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Category */}
      {showCategoryFilter && validCategories.length > 0 && (
        <FilterSection title="Category" icon={<Tag className="h-3.5 w-3.5" />} badge={filters.category ? 1 : 0}>
          <div className="space-y-1">
            {['all_categories', ...validCategories].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => updateFilter('category', cat === 'all_categories' ? undefined : cat)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                  filters.category === cat || (cat === 'all_categories' && !filters.category)
                    ? 'bg-[#F1BB03]/15 text-[#b38b00] dark:text-[#F1BB03] font-medium border border-[#F1BB03]/30'
                    : cn(colorClasses.text.secondary, darkMuted, 'hover:bg-gray-50 dark:hover:bg-gray-800/60'),
                )}
              >
                <span>{cat === 'all_categories' ? 'All categories' : cat}</span>
                {(filters.category === cat || (cat === 'all_categories' && !filters.category)) && (
                  <Check className="h-3 w-3 text-[#F1BB03]" />
                )}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection
        title="Price Range"
        icon={<DollarSign className="h-3.5 w-3.5" />}
        badge={(filters.minPrice !== undefined || filters.maxPrice !== undefined) ? 1 : 0}
      >
        <div className="flex items-center gap-2">
          <Input
            type="number" placeholder="Min"
            value={minPriceInput}
            onChange={e => setMinPriceInput(e.target.value)}
            className={cn('h-8 text-xs', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkInput)}
          />
          <span className={cn('text-xs', colorClasses.text.secondary, darkMuted)}>–</span>
          <Input
            type="number" placeholder="Max"
            value={maxPriceInput}
            onChange={e => setMaxPriceInput(e.target.value)}
            className={cn('h-8 text-xs', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkInput)}
          />
        </div>
      </FilterSection>

      {/* Featured */}
      {showFeaturedFilter && (
        <FilterSection title="Availability" icon={<Sparkles className="h-3.5 w-3.5" />} badge={filters.featured !== undefined ? 1 : 0}>
          <div className="flex items-center gap-2">
            <Checkbox
              id="sidebar-featured"
              checked={filters.featured === true}
              onCheckedChange={checked => updateFilter('featured', checked ? true : undefined)}
              className="data-[state=checked]:bg-[#F1BB03] data-[state=checked]:border-[#F1BB03]"
            />
            <Label htmlFor="sidebar-featured" className={cn('text-xs cursor-pointer', colorClasses.text.primary, darkLabel)}>
              Featured products only
            </Label>
          </div>
        </FilterSection>
      )}

      {/* Tags */}
      {validTags.length > 0 && (
        <FilterSection title="Tags" icon={<Tag className="h-3.5 w-3.5" />} badge={selectedTags.length}>
          <div className="flex flex-wrap gap-1.5">
            {validTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
                  );
                }}
                className={cn(
                  'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all',
                  selectedTags.includes(tag)
                    ? 'bg-[#F1BB03] border-[#F1BB03] text-[#0A2540] font-medium'
                    : cn(colorClasses.border.gray200, colorClasses.text.secondary, 'dark:border-gray-600 dark:text-gray-400 hover:border-[#F1BB03]/50'),
                )}
              >
                {selectedTags.includes(tag) && <Check className="h-2.5 w-2.5" />}
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <p className={cn('text-[11px] mt-2', colorClasses.text.secondary, darkMuted)}>
              {selectedTags.length} / {validTags.length} selected
            </p>
          )}
        </FilterSection>
      )}

      {/* Status (dashboard only) */}
      {showStatusFilter && (
        <FilterSection title="Status" badge={filters.status && filters.status !== 'active' ? 1 : 0}>
          <Select
            value={filters.status || 'all_statuses'}
            onValueChange={(v) => updateFilter('status', v === 'all_statuses' ? undefined : v)}
          >
            <SelectTrigger className={cn('h-8 text-xs w-full', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
              <SelectItem value="all_statuses" className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>All</SelectItem>
              <SelectItem value="active"   className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>Active</SelectItem>
              <SelectItem value="inactive" className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>Inactive</SelectItem>
              <SelectItem value="draft"    className={cn('text-xs', colorClasses.text.primary, darkSelectItem)}>Draft</SelectItem>
            </SelectContent>
          </Select>
        </FilterSection>
      )}
    </div>
  );
};

export const ProductFilterCompact: React.FC<Omit<ProductFilterProps, 'compact'>> = (props) => (
  <ProductFilter {...props} compact={true} />
);