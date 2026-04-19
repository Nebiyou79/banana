/**
 * frontend/src/components/Products/CategorySelector.tsx  (NEW)
 *
 * A two-level category/subcategory selector used in ProductForm.
 * Supports both compact inline mode (form) and full-page modal mode.
 */
'use client';
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CategoryItem, SubcategoryItem } from '@/services/productService';
import { useProductCategories } from '@/hooks/useProducts';
import { colorClasses } from '@/utils/color';
import {
  ChevronDown, ChevronRight, Check, X, Search,
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/Popover';
import { Badge } from '@/components/social/ui/Badge';

// ── Ionicons → Lucide fallback map ─────────────────────────────────────────────
const iconMap: Record<string, string> = {
  'hardware-chip-outline':  '💻',
  'shirt-outline':          '👕',
  'home-outline':           '🏠',
  'restaurant-outline':     '🍽️',
  'heart-outline':          '❤️',
  'football-outline':       '⚽',
  'construct-outline':      '🔧',
  'car-outline':            '🚗',
  'briefcase-outline':      '💼',
  'color-palette-outline':  '🎨',
  'book-outline':           '📚',
  'leaf-outline':           '🌿',
  'cog-outline':            '⚙️',
  'grid-outline':           '📦',
};

interface CategorySelectorProps {
  value: { category: string; subcategory?: string };
  onChange: (val: { category: string; subcategory?: string }) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select category…',
  className,
}) => {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const [step, setStep]           = useState<'category' | 'subcategory'>('category');

  const { data: categories = [] }   = useProductCategories();
  const activeCat = categories.find(c => c.id === value.category);

  const filteredCats = useMemo(
    () => search
      ? categories.filter(c =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.subcategories.some(s => s.label.toLowerCase().includes(search.toLowerCase()))
        )
      : categories,
    [categories, search]
  );

  const handleCategoryClick = (cat: CategoryItem) => {
    onChange({ category: cat.id, subcategory: undefined });
    if (cat.subcategories.length > 0) {
      setStep('subcategory');
    } else {
      setOpen(false);
    }
  };

  const handleSubcategoryClick = (sub: SubcategoryItem) => {
    onChange({ category: value.category, subcategory: sub.id });
    setOpen(false);
    setStep('category');
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ category: '', subcategory: undefined });
  };

  const subcatLabel = activeCat?.subcategories.find(s => s.id === value.subcategory)?.label;

  const triggerLabel = activeCat
    ? subcatLabel
      ? `${activeCat.label} › ${subcatLabel}`
      : activeCat.label
    : placeholder;

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep('category'); setSearch(''); } }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between gap-2',
              'rounded-lg border px-3 py-2.5 text-sm',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/40',
              value.category
                ? cn(colorClasses.text.primary, colorClasses.border.gray200, 'dark:text-white dark:border-gray-600')
                : cn(colorClasses.text.secondary, colorClasses.border.gray200, 'dark:text-gray-400 dark:border-gray-600'),
              colorClasses.bg.primary, 'dark:bg-gray-800',
              error && 'border-red-400 focus:ring-red-400/40',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              {activeCat && (
                <span className="text-base shrink-0">
                  {iconMap[activeCat.icon ?? ''] ?? '📦'}
                </span>
              )}
              <span className="truncate">{triggerLabel}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {value.category && (
                <X
                  className={cn('h-3.5 w-3.5 hover:text-red-500 transition-colors', colorClasses.text.secondary)}
                  onClick={handleClear}
                />
              )}
              <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180', colorClasses.text.secondary)} />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            'w-[340px] p-0 shadow-xl border',
            colorClasses.bg.primary, colorClasses.border.gray200,
            'dark:bg-gray-900 dark:border-gray-700',
          )}
          align="start"
          sideOffset={4}
        >
          {/* Header */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-2.5 border-b',
            colorClasses.border.gray200, 'dark:border-gray-700',
          )}>
            {step === 'subcategory' && (
              <button
                type="button"
                onClick={() => setStep('category')}
                className={cn('p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800', colorClasses.text.secondary)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            )}
            <div className={cn(
              'flex items-center gap-2 flex-1 rounded-md px-2 py-1.5',
              'bg-gray-50 dark:bg-gray-800',
            )}>
              <Search className={cn('h-3.5 w-3.5 shrink-0', colorClasses.text.secondary)} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={step === 'category' ? 'Search categories…' : `Search ${activeCat?.label}…`}
                className={cn(
                  'w-full bg-transparent text-sm outline-none',
                  colorClasses.text.primary, 'dark:text-white placeholder:text-gray-400',
                )}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}>
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto py-1.5">
            {step === 'category' ? (
              filteredCats.length === 0 ? (
                <p className={cn('px-4 py-6 text-center text-sm', colorClasses.text.secondary)}>
                  No categories found
                </p>
              ) : (
                filteredCats.map(cat => {
                  const isActive = value.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm',
                        'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                        isActive && 'bg-[#F1BB03]/10 dark:bg-[#F1BB03]/10',
                      )}
                    >
                      <span className="text-base shrink-0 w-6 text-center">
                        {iconMap[cat.icon ?? ''] ?? '📦'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={cn(
                          'font-medium',
                          isActive ? 'text-[#F1BB03]' : cn(colorClasses.text.primary, 'dark:text-white'),
                        )}>
                          {cat.label}
                        </span>
                        {cat.subcategories.length > 0 && (
                          <span className={cn('block text-xs mt-0.5', colorClasses.text.secondary, 'dark:text-gray-400')}>
                            {cat.subcategories.length} subcategories
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 flex items-center gap-1">
                        {isActive && !cat.subcategories.length && (
                          <Check className="h-3.5 w-3.5 text-[#F1BB03]" />
                        )}
                        {cat.subcategories.length > 0 && (
                          <ChevronRight className={cn('h-4 w-4', colorClasses.text.secondary)} />
                        )}
                      </span>
                    </button>
                  );
                })
              )
            ) : (
              /* Subcategory list */
              (() => {
                const subs = activeCat?.subcategories.filter(s =>
                  !search || s.label.toLowerCase().includes(search.toLowerCase())
                ) ?? [];
                return subs.length === 0 ? (
                  <p className={cn('px-4 py-6 text-center text-sm', colorClasses.text.secondary)}>
                    No subcategories found
                  </p>
                ) : (
                  subs.map(sub => {
                    const isActive = value.subcategory === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubcategoryClick(sub)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm',
                          'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                          isActive && 'bg-[#F1BB03]/10',
                        )}
                      >
                        <span className={cn(
                          'flex-1 font-medium',
                          isActive ? 'text-[#F1BB03]' : cn(colorClasses.text.primary, 'dark:text-white'),
                        )}>
                          {sub.label}
                        </span>
                        {isActive && <Check className="h-3.5 w-3.5 text-[#F1BB03] shrink-0" />}
                      </button>
                    );
                  })
                );
              })()
            )}
          </div>

          {/* Footer: skip subcategory */}
          {step === 'subcategory' && (
            <div className={cn('px-3 py-2 border-t', colorClasses.border.gray200, 'dark:border-gray-700')}>
              <button
                type="button"
                onClick={() => { setOpen(false); setStep('category'); }}
                className={cn('text-xs', colorClasses.text.secondary, 'hover:underline dark:text-gray-400')}
              >
                Skip — use "{activeCat?.label}" without subcategory
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

/** Compact display badge for category + subcategory (used in cards, filters) */
export const CategoryBadge: React.FC<{
  category: string;
  subcategory?: string;
  categories?: CategoryItem[];
  size?: 'sm' | 'md';
}> = ({ category, subcategory, categories = [], size = 'sm' }) => {
  const cat = categories.find(c => c.id === category);
  const sub = cat?.subcategories.find(s => s.id === subcategory);
  const catLabel = cat?.label ?? category;
  const icon     = cat ? (iconMap[cat.icon ?? ''] ?? '📦') : '📦';

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        'border-[#F1BB03]/40 text-[#b38b00] bg-[#F1BB03]/8 dark:text-[#F1BB03] dark:bg-[#F1BB03]/10',
      )}
    >
      <span>{icon}</span>
      <span>
        {catLabel}
        {sub ? ` › ${sub.label}` : ''}
      </span>
    </Badge>
  );
};
