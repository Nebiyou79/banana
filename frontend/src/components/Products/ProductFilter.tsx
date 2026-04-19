/**
 * frontend/src/components/Products/ProductFilter.tsx  (UPDATED)
 *
 * Changes from previous version:
 *  - Category filter now uses the full CategoryItem hierarchy
 *  - Subcategory filter shown when category is selected
 *  - Uses useProductCategories hook instead of receiving flat string[]
 *  - Backward compatible: still accepts `categories` prop for pre-loaded data
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ProductFilters } from '@/services/productService';
import { CategoryItem } from '@/services/productService';
import { useProductCategories } from '@/hooks/useProducts';
import { Input } from '@/components/ui/Input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { colorClasses, ThemeMode } from '@/utils/color';
import {
  X, ArrowUpDown, Tag, ChevronDown, DollarSign,
  LayoutGrid, LayoutList, Sparkles, Check, RefreshCw,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const darkInput   = 'dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-500 dark:focus:border-[#F1BB03]';
const darkSelect  = 'dark:bg-gray-800 dark:text-white dark:border-gray-600';
const darkContent = 'dark:bg-gray-800 dark:border-gray-700';
const darkItem    = 'dark:text-gray-200 dark:focus:bg-gray-700 dark:focus:text-white';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc',  label: 'Oldest first' },
  { value: 'price.amount-asc',  label: 'Price: Low → High' },
  { value: 'price.amount-desc', label: 'Price: High → Low' },
  { value: 'name-asc',  label: 'Name A – Z' },
  { value: 'name-desc', label: 'Name Z – A' },
  { value: 'views-desc',     label: 'Most Popular' },
  { value: 'savedCount-desc', label: 'Most Saved' },
];

interface ProductFilterProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  /** Deprecated: pass nothing; hook fetches automatically */
  categories?: Array<{ _id?: string; name: string } | string | CategoryItem>;
  className?: string;
  theme?: ThemeMode;
  showLayoutToggle?: boolean;
  layout?: 'grid' | 'list';
  onLayoutChange?: (layout: 'grid' | 'list') => void;
  showStatusFilter?: boolean;
  showFeaturedFilter?: boolean;
  showCategoryFilter?: boolean;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onFiltersChange,
  className,
  showLayoutToggle = false,
  layout = 'grid',
  onLayoutChange,
  showStatusFilter = false,
  showFeaturedFilter = true,
  showCategoryFilter = true,
}) => {
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice?.toString() || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice?.toString() || '');

  const { data: serverCategories = [] } = useProductCategories();

  const debouncedMin = useDebounce(minPriceInput, 400);
  const debouncedMax = useDebounce(maxPriceInput, 400);

  useEffect(() => {
    const v = debouncedMin ? parseFloat(debouncedMin) : undefined;
    if (v !== filters.minPrice) updateFilter('minPrice', v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin]);

  useEffect(() => {
    const v = debouncedMax ? parseFloat(debouncedMax) : undefined;
    if (v !== filters.maxPrice) updateFilter('maxPrice', v);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMax]);

  const updateFilter = useCallback(
    (key: keyof ProductFilters, value: any) => onFiltersChange({ ...filters, [key]: value, page: 1 }),
    [filters, onFiltersChange]
  );

  const clearAll = useCallback(() => {
    setMinPriceInput('');
    setMaxPriceInput('');
    onFiltersChange({ page: 1, limit: filters.limit, status: filters.status });
  }, [filters.limit, filters.status, onFiltersChange]);

  const currentSort = filters.sortBy && filters.sortOrder
    ? `${filters.sortBy}-${filters.sortOrder}`
    : 'createdAt-desc';

  const activeCount = Object.keys(filters).filter(k => {
    if (['page', 'limit', 'status'].includes(k)) return false;
    const v = filters[k as keyof ProductFilters];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== null;
  }).length;

  const activeCat = serverCategories.find(c => c.id === filters.category);
  const subcategories = activeCat?.subcategories ?? [];

  return (
    <div className={cn('space-y-2.5', className)}>
      {/* Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <Select
          value={currentSort}
          onValueChange={v => {
            const [sortBy, sortOrder] = v.split('-');
            onFiltersChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
          }}
        >
          <SelectTrigger className={cn('h-8 text-xs min-w-[148px]', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
            <ArrowUpDown className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className={cn(colorClasses.bg.primary, darkContent)}>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className={cn('text-xs', colorClasses.text.primary, darkItem)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        {showCategoryFilter && serverCategories.length > 0 && (
          <Select
            value={filters.category || 'all'}
            onValueChange={v => {
              updateFilter('category', v === 'all' ? undefined : v);
              updateFilter('subcategory', undefined);
            }}
          >
            <SelectTrigger className={cn('h-8 text-xs min-w-[140px]', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkContent)}>
              <SelectItem value="all" className={cn('text-xs', colorClasses.text.primary, darkItem)}>All categories</SelectItem>
              {serverCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className={cn('text-xs', colorClasses.text.primary, darkItem)}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Subcategory (shown when category selected) */}
        {filters.category && subcategories.length > 0 && (
          <Select
            value={filters.subcategory || 'all_sub'}
            onValueChange={v => updateFilter('subcategory', v === 'all_sub' ? undefined : v)}
          >
            <SelectTrigger className={cn('h-8 text-xs min-w-[140px]', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
              <SelectValue placeholder="All subcategories" />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkContent)}>
              <SelectItem value="all_sub" className={cn('text-xs', colorClasses.text.primary, darkItem)}>All subcategories</SelectItem>
              {subcategories.map(sub => (
                <SelectItem key={sub.id} value={sub.id} className={cn('text-xs', colorClasses.text.primary, darkItem)}>
                  {sub.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Price range */}
        <div className="flex items-center gap-1 shrink-0">
          <DollarSign className={cn('h-3.5 w-3.5', colorClasses.text.secondary, 'dark:text-gray-400')} />
          <Input
            type="number" placeholder="Min" value={minPriceInput}
            onChange={e => setMinPriceInput(e.target.value)}
            className={cn('h-8 w-20 text-xs', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkInput)}
          />
          <span className={cn('text-xs', colorClasses.text.secondary)}>–</span>
          <Input
            type="number" placeholder="Max" value={maxPriceInput}
            onChange={e => setMaxPriceInput(e.target.value)}
            className={cn('h-8 w-20 text-xs', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkInput)}
          />
        </div>

        {/* Featured */}
        {showFeaturedFilter && (
          <button
            type="button"
            onClick={() => updateFilter('featured', filters.featured === true ? undefined : true)}
            className={cn(
              'h-8 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-all',
              filters.featured === true
                ? 'bg-[#F1BB03] border-[#F1BB03] text-[#0A2540]'
                : cn(colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.secondary, 'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:border-[#F1BB03]/60'),
            )}
          >
            <Sparkles className="h-3 w-3" /> Featured
          </button>
        )}

        {/* Status */}
        {showStatusFilter && (
          <Select
            value={filters.status || 'all_statuses'}
            onValueChange={v => updateFilter('status', v === 'all_statuses' ? undefined : v)}
          >
            <SelectTrigger className={cn('h-8 text-xs min-w-[120px]', colorClasses.border.gray200, colorClasses.bg.primary, colorClasses.text.primary, darkSelect)}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className={cn(colorClasses.bg.primary, darkContent)}>
              {['all_statuses', 'active', 'inactive', 'draft', 'out_of_stock', 'discontinued'].map(s => (
                <SelectItem key={s} value={s} className={cn('text-xs', colorClasses.text.primary, darkItem)}>
                  {s === 'all_statuses' ? 'All statuses' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              'h-8 flex items-center gap-1.5 px-2.5 rounded-lg border text-xs font-medium transition-colors',
              colorClasses.border.gray200, colorClasses.text.secondary,
              'dark:border-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500',
            )}
          >
            <RefreshCw className="h-3 w-3" />
            Reset
            <span className="min-w-[16px] h-4 rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold flex items-center justify-center px-1">
              {activeCount}
            </span>
          </button>
        )}

        {/* Layout toggle */}
        {showLayoutToggle && onLayoutChange && (
          <div className={cn('ml-auto flex rounded-lg border overflow-hidden shrink-0', colorClasses.border.gray200, 'dark:border-gray-600')}>
            {(['grid', 'list'] as const).map(l => (
              <button
                key={l}
                onClick={() => onLayoutChange(l)}
                className={cn('p-1.5 transition-colors',
                  layout === l ? 'bg-[#F1BB03] text-[#0A2540]' : cn(colorClasses.bg.primary, colorClasses.text.secondary, 'dark:bg-gray-800 dark:text-gray-400'),
                )}
                title={`${l} view`}
              >
                {l === 'grid' ? <LayoutGrid className="h-3.5 w-3.5" /> : <LayoutList className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;
