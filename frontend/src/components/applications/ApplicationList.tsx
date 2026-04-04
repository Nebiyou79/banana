/* eslint-disable @typescript-eslint/no-explicit-any */
// ApplicationList.tsx — Clean, simplified SaaS list UI
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Application, applicationService, ApplicationFilters } from '@/services/applicationService';
import { ApplicationCard } from './ApplicationCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  SlidersHorizontal,
  Save,
  Trash2,
  RotateCcw,
  ChevronDown,
  X,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  Grid,
  List,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';

interface FilterPreset {
  id: string;
  name: string;
  filters: ApplicationFilters;
  createdAt: string;
}

interface SelectedApplications {
  [key: string]: boolean;
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  includeFields: string[];
  dateRange?: { start: string; end: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'applied',             label: 'Applied',             color: 'blue'    },
  { value: 'under-review',        label: 'Under Review',        color: 'amber'   },
  { value: 'shortlisted',         label: 'Shortlisted',         color: 'green'   },
  { value: 'interview-scheduled', label: 'Interview Scheduled', color: 'purple'  },
  { value: 'interviewed',         label: 'Interview Completed', color: 'indigo'  },
  { value: 'offer-pending',       label: 'Offer Pending',       color: 'orange'  },
  { value: 'offer-made',          label: 'Offer Made',          color: 'teal'    },
  { value: 'offer-accepted',      label: 'Offer Accepted',      color: 'emerald' },
  { value: 'rejected',            label: 'Rejected',            color: 'red'     },
  { value: 'on-hold',             label: 'On Hold',             color: 'slate'   },
  { value: 'withdrawn',           label: 'Withdrawn',           color: 'gray'    },
] as const;

const SORT_OPTIONS = [
  { value: 'createdAt_desc',      label: 'Newest First'         },
  { value: 'createdAt_asc',       label: 'Oldest First'         },
  { value: 'updatedAt_desc',      label: 'Recently Updated'     },
  { value: 'candidate.name_asc',  label: 'Candidate Name (A–Z)' },
  { value: 'candidate.name_desc', label: 'Candidate Name (Z–A)' },
  { value: 'job.title_asc',       label: 'Job Title (A–Z)'      },
  { value: 'status_asc',          label: 'Status'               },
] as const;

// Quick-filter chips shown inline below the search bar
const QUICK_FILTERS = [
  { value: 'under-review',        label: 'Under Review', color: 'amber'  },
  { value: 'shortlisted',         label: 'Shortlisted',  color: 'green'  },
  { value: 'interview-scheduled', label: 'Interview',    color: 'purple' },
  { value: 'offer-made',          label: 'Offer Made',   color: 'teal'   },
  { value: 'rejected',            label: 'Rejected',     color: 'red'    },
] as const;

const DEFAULT_FILTERS: ApplicationFilters = {
  dateFrom: '', dateTo: '', page: 1, limit: 20,
  status: '', search: '', sortBy: 'createdAt', sortOrder: 'desc',
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PaginationControls
// ─────────────────────────────────────────────────────────────────────────────

const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalResults, resultsPerPage, onPageChange }) => {
  const { breakpoint } = useResponsive();
  const delta = breakpoint === 'mobile' ? 1 : 2;

  const pageNumbers = useMemo((): (number | '...')[] => {
    const range: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    const out: (number | '...')[] = [];
    let last: number | undefined;
    for (const n of range) {
      if (last !== undefined && n - last > 1) out.push('...');
      out.push(n);
      last = n;
    }
    return out;
  }, [currentPage, totalPages, delta]);

  const start = (currentPage - 1) * resultsPerPage + 1;
  const end   = Math.min(currentPage * resultsPerPage, totalResults);

  const navBtn = (disabled: boolean) =>
    cn(
      'h-8 w-8 flex items-center justify-center rounded-lg border transition-colors',
      colorClasses.border.primary,
      colorClasses.text.secondary,
      disabled ? 'opacity-40 cursor-not-allowed' : `hover:${colorClasses.bg.secondary}`,
    );

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 border-t',
      colorClasses.border.secondary,
    )}>
      <p className={cn('text-xs', colorClasses.text.muted)}>
        Showing{' '}
        <span className={cn('font-medium', colorClasses.text.primary)}>{start}–{end}</span>
        {' '}of{' '}
        <span className={cn('font-medium', colorClasses.text.primary)}>{totalResults}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(navBtn(currentPage === 1), 'hidden sm:flex')}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={navBtn(currentPage === 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pageNumbers.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className={cn('px-1 text-xs', colorClasses.text.muted)}>…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'h-8 w-8 rounded-lg text-xs font-medium transition-colors border',
                currentPage === page
                  ? cn(colorClasses.bg.blue, 'text-white border-transparent')
                  : cn(colorClasses.border.primary, colorClasses.text.secondary, `hover:${colorClasses.bg.secondary}`),
              )}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={navBtn(currentPage === totalPages || totalPages === 0)}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={cn(navBtn(currentPage === totalPages || totalPages === 0), 'hidden sm:flex')}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// StatPill — clickable filter shortcut
// ─────────────────────────────────────────────────────────────────────────────

const StatPill: React.FC<{
  label: string;
  value: number;
  colorKey: keyof typeof colorClasses.bg;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, value, colorKey, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-medium',
      active
        ? cn(colorClasses.bg[colorKey], 'text-white')
        : cn(colorClasses.bg.secondary, colorClasses.text.secondary),
    )}
  >
    <span className={cn('text-base font-semibold tabular-nums', active ? 'text-white' : colorClasses.text.primary)}>
      {value}
    </span>
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// FilterDrawerContent — extracted so it isn't re-mounted on each render
// ─────────────────────────────────────────────────────────────────────────────

const FilterDrawerContent: React.FC<{
  filters: ApplicationFilters;
  onFilterChange: (key: keyof ApplicationFilters, value: any) => void;
  onSavePreset: (name: string) => void;
  presets: FilterPreset[];
  onLoadPreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string) => void;
}> = ({ filters, onFilterChange, onSavePreset, presets, onLoadPreset, onDeletePreset }) => {
  const [presetName,     setPresetName]     = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const sectionLabel = (text: string) => (
    <p className={cn('text-xs font-semibold uppercase tracking-wide mb-2', colorClasses.text.muted)}>{text}</p>
  );

  return (
    <div className="space-y-5 p-4">

      {/* Status grid */}
      <div>
        {sectionLabel('Status')}
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const active = filters.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onFilterChange('status', active ? '' : opt.value)}
                className={cn(
                  'text-left text-xs h-9 px-3 rounded-lg border transition-all',
                  active
                    ? cn(colorClasses.bg[opt.color as keyof typeof colorClasses.bg], 'text-white border-transparent')
                    : cn(colorClasses.bg.primary, colorClasses.text.secondary, colorClasses.border.primary),
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        {sectionLabel('Sort By')}
        <Select
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onValueChange={(v) => {
            const lastUnderscore = v.lastIndexOf('_');
            const sortBy    = v.slice(0, lastUnderscore);
            const sortOrder = v.slice(lastUnderscore + 1);
            onFilterChange('sortBy',    sortBy);
            onFilterChange('sortOrder', sortOrder);
          }}
        >
          <SelectTrigger className={cn('border rounded-lg h-10', colorClasses.border.primary, colorClasses.bg.primary)}>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div>
        {sectionLabel('Date Range')}
        <div className="grid grid-cols-2 gap-2">
          {(['dateFrom', 'dateTo'] as const).map((key) => (
            <div key={key}>
              <label className={cn('text-xs block mb-1', colorClasses.text.muted)}>
                {key === 'dateFrom' ? 'From' : 'To'}
              </label>
              <Input
                type="date"
                value={(filters as any)[key] || ''}
                onChange={(e) => onFilterChange(key, e.target.value)}
                className={cn('border rounded-lg h-10', colorClasses.border.primary, colorClasses.bg.primary)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Saved presets */}
      {presets.length > 0 && (
        <div>
          {sectionLabel('Saved Filters')}
          <div className="space-y-1.5">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-lg border',
                  colorClasses.bg.secondary,
                  colorClasses.border.primary,
                )}
              >
                <button onClick={() => onLoadPreset(preset)} className="flex-1 text-left min-w-0 pr-2">
                  <p className={cn('text-sm font-medium truncate', colorClasses.text.primary)}>{preset.name}</p>
                  <p className={cn('text-xs', colorClasses.text.muted)}>
                    {new Date(preset.createdAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => onDeletePreset(preset.id)}
                  className={cn('p-1.5 rounded shrink-0', colorClasses.text.red)}
                  aria-label="Delete preset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save preset */}
      {showSavePreset ? (
        <div className="space-y-2">
          <Input
            placeholder="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className={cn('border rounded-lg h-10', colorClasses.border.primary, colorClasses.bg.primary)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePreset(false)}
              className={cn('flex-1 h-9 rounded-lg border', colorClasses.border.primary)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!presetName.trim()}
              onClick={() => {
                onSavePreset(presetName.trim());
                setPresetName('');
                setShowSavePreset(false);
              }}
              className={cn('flex-1 h-9 rounded-lg', colorClasses.bg.blue, 'text-white hover:opacity-90')}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowSavePreset(true)}
          className={cn('w-full h-9 rounded-lg border text-xs', colorClasses.border.primary)}
        >
          <Save className="h-3.5 w-3.5 mr-2" />
          Save Current Filters
        </Button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FilterDrawer — Sheet (desktop) or BottomSheet (mobile)
// ─────────────────────────────────────────────────────────────────────────────

const FilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filters: ApplicationFilters;
  onFilterChange: (key: keyof ApplicationFilters, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  onSavePreset: (name: string) => void;
  presets: FilterPreset[];
  onLoadPreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string) => void;
}> = ({ isOpen, onClose, filters, onFilterChange, onApply, onReset, ...contentProps }) => {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const footer = (
    <div className={cn('p-4 border-t flex gap-3 shrink-0', colorClasses.border.secondary, colorClasses.bg.primary)}>
      <Button
        variant="outline"
        onClick={onReset}
        className={cn('flex-1 h-10 rounded-lg border', colorClasses.border.primary)}
      >
        <RotateCcw className="h-3.5 w-3.5 mr-2" />
        Reset
      </Button>
      <Button
        onClick={onApply}
        className={cn('flex-1 h-10 rounded-lg', colorClasses.bg.blue, 'text-white hover:opacity-90')}
      >
        Apply
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter Applications">
        <div className="overflow-y-auto flex-1">
          <FilterDrawerContent filters={filters} onFilterChange={onFilterChange} {...contentProps} />
        </div>
        {footer}
      </BottomSheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className={cn('w-96 flex flex-col overflow-hidden p-0', colorClasses.bg.primary)}>
        <SheetHeader className={cn('p-5 border-b shrink-0', colorClasses.border.secondary)}>
          <SheetTitle className={colorClasses.text.primary}>Filter Applications</SheetTitle>
          <SheetDescription className={colorClasses.text.muted}>
            Refine your applications list
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <FilterDrawerContent filters={filters} onFilterChange={onFilterChange} {...contentProps} />
        </div>
        {footer}
      </SheetContent>
    </Sheet>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BulkActionsBar — floats at bottom when items are selected
// ─────────────────────────────────────────────────────────────────────────────

const BulkActionsBar: React.FC<{
  selectedCount: number;
  isAllSelected: boolean;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkExport: (options: ExportOptions) => void;
  onBulkDelete: () => void;
}> = ({ selectedCount, isAllSelected, onClearSelection, onSelectAll, onBulkExport, onBulkDelete }) => {
  const [showExport, setShowExport] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl border',
        colorClasses.bg.primary,
        colorClasses.border.primary,
      )}
    >
      <span className={cn('text-sm font-medium shrink-0', colorClasses.text.primary)}>
        {selectedCount} selected
      </span>

      {/* Divider */}
      <span className="w-px h-4 bg-gray-300 dark:bg-gray-600 shrink-0" />

      <button
        onClick={onSelectAll}
        className={cn('text-xs shrink-0 hover:opacity-70 transition-opacity', colorClasses.text.secondary)}
      >
        {isAllSelected ? 'Deselect all' : 'Select all'}
      </button>

      {/* Export dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExport((v) => !v)}
          className={cn('h-8 text-xs rounded-lg border gap-1', colorClasses.border.primary)}
        >
          Export
          <ChevronDown className="h-3 w-3" />
        </Button>
        <AnimatePresence>
          {showExport && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.1 }}
              className={cn(
                'absolute bottom-full mb-2 right-0 rounded-lg shadow-lg border p-1 min-w-[140px] z-50',
                colorClasses.bg.primary,
                colorClasses.border.primary,
              )}
            >
              {(['csv', 'pdf', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => { onBulkExport({ format: fmt, includeFields: ['all'] }); setShowExport(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-xs transition-colors',
                    colorClasses.text.secondary,
                    `hover:${colorClasses.bg.secondary}`,
                  )}
                >
                  Export as {fmt.toUpperCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onBulkDelete}
        className={cn('h-8 text-xs rounded-lg border', colorClasses.border.primary, colorClasses.text.red)}
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Delete
      </Button>

      <button
        onClick={onClearSelection}
        className={cn('p-1.5 rounded-lg transition-opacity hover:opacity-70', colorClasses.text.muted)}
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface ApplicationListProps extends ApplicationFilters {
  viewType: 'company' | 'organization' | 'candidate';
  jobId?: string;
  onApplicationUpdate?: (application: Application) => void;
  onApplicationSelect?: (application: Application) => void;
  showFilters?: boolean;
  title?: string;
  description?: string;
}

export const ApplicationList: React.FC<ApplicationListProps> = ({
  viewType,
  jobId,
  onApplicationUpdate,
  onApplicationSelect,
  showFilters = true,
  title,
  description,
  // remaining spread props are initial filter values (unused, we own filter state)
}) => {
  // ── State ─────────────────────────────────────────────────────────────────

  const [applications,          setApplications]          = useState<Application[]>([]);
  const [loading,               setLoading]               = useState(true);
  const [refreshing,            setRefreshing]            = useState(false);
  const [filters,               setFilters]               = useState<ApplicationFilters>({ ...DEFAULT_FILTERS });
  const [pagination,            setPagination]            = useState({
    current: 1, totalPages: 1, totalResults: 0, resultsPerPage: 20,
    hasNextPage: false, hasPreviousPage: false,
  });
  const [stats,                 setStats]                 = useState({
    total: 0, underReview: 0, shortlisted: 0, interviewScheduled: 0, rejected: 0,
  });
  const [viewMode,              setViewMode]              = useState<ViewMode>('grid');
  const [isFilterDrawerOpen,    setIsFilterDrawerOpen]    = useState(false);
  const [selectedApplications,  setSelectedApplications]  = useState<SelectedApplications>({});
  const [filterPresets,         setFilterPresets]         = useState<FilterPreset[]>([]);
  const [lastUpdated,           setLastUpdated]           = useState<Date | null>(null);

  const { toast }       = useToast();
  const { breakpoint }  = useResponsive();
  const isMobile        = breakpoint === 'mobile';

  // ── Debounced search ──────────────────────────────────────────────────────

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setFilters((prev) => ({ ...prev, search: value, page: 1 })), 300),
    [],
  );

  // ── Filter preset helpers (logic unchanged) ───────────────────────────────

  const saveFilterPreset = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    setFilterPresets((prev) => [...prev, preset]);
    const stored = localStorage.getItem(`filterPresets_${viewType}`);
    const list   = stored ? JSON.parse(stored) : [];
    localStorage.setItem(`filterPresets_${viewType}`, JSON.stringify([...list, preset]));
    toast({ title: 'Preset Saved', description: `"${name}" saved` });
  }, [filters, viewType, toast]);

  const loadFilterPreset = useCallback((preset: FilterPreset) => {
    setFilters({ ...preset.filters, page: 1 });
    setIsFilterDrawerOpen(false);
    toast({ title: 'Preset Loaded', description: `"${preset.name}" loaded` });
  }, [toast]);

  const deleteFilterPreset = useCallback((id: string) => {
    setFilterPresets((prev) => prev.filter((p) => p.id !== id));
    const stored = localStorage.getItem(`filterPresets_${viewType}`);
    if (stored) {
      localStorage.setItem(
        `filterPresets_${viewType}`,
        JSON.stringify(JSON.parse(stored).filter((p: FilterPreset) => p.id !== id)),
      );
    }
    toast({ title: 'Preset Deleted' });
  }, [viewType, toast]);

  useEffect(() => {
    const stored = localStorage.getItem(`filterPresets_${viewType}`);
    if (stored) setFilterPresets(JSON.parse(stored));
  }, [viewType]);

  // ── Fetch applications (logic unchanged) ─────────────────────────────────

  const fetchApplications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else             setLoading(true);

      let response: any;
      if      (viewType === 'candidate') response = await applicationService.getMyApplications(filters);
      else if (jobId)                    response = await applicationService.getJobApplications(jobId, filters);
      else if (viewType === 'company')   response = await applicationService.getCompanyApplications(filters);
      else                               response = await applicationService.getOrganizationApplications(filters);

      setApplications(response.data || []);
      setPagination({
        current:        response.pagination?.current        ?? 1,
        totalPages:     response.pagination?.totalPages     ?? 1,
        totalResults:   response.pagination?.totalResults   ?? response.data?.length ?? 0,
        resultsPerPage: response.pagination?.resultsPerPage ?? 20,
        hasNextPage:    response.pagination?.hasNextPage    ?? false,
        hasPreviousPage:response.pagination?.hasPreviousPage?? false,
      });
      setLastUpdated(new Date());
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load applications', variant: 'destructive' });
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, viewType, jobId, toast]);

  // ── Fetch statistics (logic unchanged) ───────────────────────────────────

  const fetchStatistics = useCallback(async () => {
    if (viewType === 'candidate') return;
    try {
      const response = await applicationService.getApplicationStatistics();
      if (response.data?.statistics) {
        const s = response.data.statistics;
        setStats({
          total:              s.totalApplications  || 0,
          underReview:        s.underReview        || 0,
          shortlisted:        s.shortlisted        || 0,
          interviewScheduled: s.interviewScheduled || 0,
          rejected:           s.rejected           || 0,
        });
      }
    } catch { /* non-fatal */ }
  }, [viewType]);

  useEffect(() => { fetchApplications(); },                              [fetchApplications]);
  useEffect(() => { if (viewType !== 'candidate') fetchStatistics(); }, [fetchStatistics, viewType]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedCount = Object.values(selectedApplications).filter(Boolean).length;
  const isAllSelected = applications.length > 0 && selectedCount === applications.length;

  const activeFilterCount = Object.keys(filters).filter(
    (k) => (filters as any)[k] && !['page', 'limit', 'sortBy', 'sortOrder'].includes(k),
  ).length;

  const gridColsCls = viewMode === 'list'
    ? 'grid-cols-1'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const setFilter = (key: keyof ApplicationFilters, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleSelectAll = () =>
    setSelectedApplications(
      isAllSelected ? {} : Object.fromEntries(applications.map((a) => [a._id, true])),
    );

  const handleRefresh = () => {
    fetchApplications(true);
    if (viewType !== 'candidate') fetchStatistics();
  };

  const handleWithdraw = useCallback((id: string) => {
    setApplications((prev) => prev.filter((a) => a._id !== id));
    if (viewType !== 'candidate') fetchStatistics();
  }, [viewType, fetchStatistics]);

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <div className="space-y-4">
        {viewType !== 'candidate' && (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        )}
        <Skeleton className="h-10 rounded-xl w-full" />
        <div className={cn('grid gap-3', gridColsCls)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-4 pb-20">

        {/* ── Title / description ───────────────────────────────────── */}
        {(title || description) && (
          <div>
            {title      && <h1 className={cn('text-xl font-semibold', colorClasses.text.primary)}>{title}</h1>}
            {description && <p className={cn('text-sm mt-0.5', colorClasses.text.muted)}>{description}</p>}
          </div>
        )}

        {/* ── Stat pills — company / org only ───────────────────────── */}
        {viewType !== 'candidate' && (
          <div className="flex flex-wrap gap-2">
            <StatPill
              label="Total"
              value={stats.total}
              colorKey="blue"
              active={!filters.status}
              onClick={() => setFilters((p) => ({ ...p, status: '', page: 1 }))}
            />
            <StatPill
              label="Under Review"
              value={stats.underReview}
              colorKey="amber"
              active={filters.status === 'under-review'}
              onClick={() => setFilters((p) => ({ ...p, status: 'under-review', page: 1 }))}
            />
            <StatPill
              label="Shortlisted"
              value={stats.shortlisted}
              colorKey="green"
              active={filters.status === 'shortlisted'}
              onClick={() => setFilters((p) => ({ ...p, status: 'shortlisted', page: 1 }))}
            />
            <StatPill
              label="Interviews"
              value={stats.interviewScheduled}
              colorKey="purple"
              active={filters.status === 'interview-scheduled'}
              onClick={() => setFilters((p) => ({ ...p, status: 'interview-scheduled', page: 1 }))}
            />
          </div>
        )}

        {/* ── Search bar + controls ──────────────────────────────────── */}
        {showFilters && (
          <div className="space-y-2">

            {/* Row 1: search · filter · refresh · view toggle */}
            <div className="flex items-center gap-2">

              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Input
                  placeholder="Search applications…"
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className={cn('pl-9 h-10 rounded-xl border', colorClasses.border.primary, colorClasses.bg.primary)}
                />
              </div>

              {/* Filter button */}
              <Button
                variant="outline"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={cn('h-10 px-3 rounded-xl border gap-2 shrink-0', colorClasses.border.primary)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {!isMobile && <span className="text-sm">Filters</span>}
                {activeFilterCount > 0 && (
                  <span className={cn(
                    'h-5 w-5 rounded-full text-xs flex items-center justify-center font-medium text-white',
                    colorClasses.bg.blue,
                  )}>
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refresh"
                className={cn(
                  'h-10 w-10 flex items-center justify-center rounded-xl border transition-colors shrink-0',
                  colorClasses.border.primary,
                  colorClasses.text.secondary,
                  `hover:${colorClasses.bg.secondary}`,
                  refreshing && 'opacity-50 cursor-not-allowed',
                )}
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </button>

              {/* View toggle — hidden on mobile */}
              <div className={cn(
                'hidden sm:flex items-center gap-0.5 p-1 rounded-xl shrink-0',
                colorClasses.bg.secondary,
              )}>
                {([
                  { value: 'grid' as const, Icon: Grid, label: 'Grid view' },
                  { value: 'list' as const, Icon: List, label: 'List view' },
                ]).map(({ value, Icon, label }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode(value)}
                        aria-label={label}
                        className={cn(
                          'h-8 w-8 flex items-center justify-center rounded-lg transition-all',
                          viewMode === value
                            ? cn(colorClasses.bg.primary, 'shadow-sm')
                            : 'opacity-40 hover:opacity-70',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">{label}</p></TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Row 2: quick-filter chips — company / org only */}
            {viewType !== 'candidate' && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FILTERS.map((opt) => {
                  const isActive = filters.status === opt.value;
                  const count    = applications.filter((a) => a.status === opt.value).length;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFilters((p) => ({ ...p, status: isActive ? '' : opt.value, page: 1 }))}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full border transition-all',
                        isActive
                          ? cn(colorClasses.bg[opt.color as keyof typeof colorClasses.bg], 'text-white border-transparent')
                          : cn(colorClasses.bg.primary, colorClasses.text.secondary, colorClasses.border.primary),
                      )}
                    >
                      {opt.label}
                      {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Result count + timestamp ───────────────────────────────── */}
        {applications.length > 0 && (
          <div className={cn('flex items-center justify-between text-xs', colorClasses.text.muted)}>
            <span>
              <span className={cn('font-medium', colorClasses.text.primary)}>{applications.length}</span>
              {' '}of{' '}
              <span className={cn('font-medium', colorClasses.text.primary)}>{pagination.totalResults}</span>
              {' '}applications
            </span>
            {lastUpdated && (
              <span>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* ── Cards / empty state ────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {applications.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className={cn('border rounded-xl', colorClasses.border.primary, colorClasses.bg.primary)}>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', colorClasses.bg.secondary)}>
                    <AlertCircle className={cn('h-6 w-6', colorClasses.text.muted)} />
                  </div>
                  <h3 className={cn('text-base font-semibold mb-1', colorClasses.text.primary)}>
                    No applications found
                  </h3>
                  <p className={cn('text-sm max-w-xs mb-5', colorClasses.text.muted)}>
                    {filters.search || filters.status
                      ? 'Try adjusting your filters to see more results.'
                      : viewType === 'candidate'
                        ? "You haven't applied to any jobs yet. Start browsing opportunities!"
                        : jobId
                          ? 'No applications have been submitted for this job yet.'
                          : 'No applications found for your company or organisation.'}
                  </p>
                  {viewType === 'candidate' && (
                    <Button
                      onClick={() => window.open('/jobs', '_blank')}
                      className={cn('rounded-lg px-4 h-9 text-sm', colorClasses.bg.blue, 'text-white hover:opacity-90')}
                    >
                      Browse Jobs
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn('grid gap-3', gridColsCls)}
            >
              {applications.map((app, index) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
                  className="relative"
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={!!selectedApplications[app._id]}
                      onCheckedChange={() =>
                        setSelectedApplications((prev) => ({ ...prev, [app._id]: !prev[app._id] }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={cn('border-2', colorClasses.border.primary)}
                    />
                  </div>

                  <ApplicationCard
                    application={app}
                    viewType={viewType}
                    onStatusUpdate={onApplicationUpdate}
                    onWithdraw={handleWithdraw}
                    onSelect={onApplicationSelect}
                    isSelected={!!selectedApplications[app._id]}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <PaginationControls
            currentPage={pagination.current}
            totalPages={pagination.totalPages}
            totalResults={pagination.totalResults}
            resultsPerPage={pagination.resultsPerPage}
            onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
          />
        )}

        {/* ── Filter drawer ──────────────────────────────────────────── */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onFilterChange={setFilter}
          onApply={() => {
            setFilters((p) => ({ ...p, page: 1 }));
            fetchApplications();
            setIsFilterDrawerOpen(false);
          }}
          onReset={() => setFilters({ ...DEFAULT_FILTERS })}
          onSavePreset={saveFilterPreset}
          presets={filterPresets}
          onLoadPreset={loadFilterPreset}
          onDeletePreset={deleteFilterPreset}
        />

        {/* ── Bulk actions bar ───────────────────────────────────────── */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <BulkActionsBar
              selectedCount={selectedCount}
              isAllSelected={isAllSelected}
              onClearSelection={() => setSelectedApplications({})}
              onSelectAll={handleSelectAll}
              onBulkExport={(options) => {
                toast({ title: 'Export Started', description: `Exporting ${selectedCount} as ${options.format.toUpperCase()}` });
                setSelectedApplications({});
              }}
              onBulkDelete={() => {
                toast({ title: 'Bulk Delete', description: `Deleting ${selectedCount} applications`, variant: 'destructive' });
                setSelectedApplications({});
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </TooltipProvider>
  );
};

export default ApplicationList;