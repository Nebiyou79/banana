/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/ProfessionalTenderList.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Calendar,
  FileText,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  X,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { Tender, ProfessionalTenderFilter } from '@/services/tenderService';
import ProfessionalTenderFilters from './ProfessionalTenderFilters';
import ProfessionalTenderCard from './ProfessionalTenderCard';

interface ProfessionalTenderListProps {
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  tenders?: Tender[];
  isLoading?: boolean;
  error?: any;
  filters?: ProfessionalTenderFilter;
  onFilterChange?: (filters: Partial<ProfessionalTenderFilter>) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
  onToggleSave?: (tenderId: string) => void;
  savedTenderIds?: Set<string>;
  showFilters?: boolean;
  showPagination?: boolean;
  showSorting?: boolean;
  className?: string;
}

// Pagination Controls Component - FIXED
const PaginationControls: React.FC<{
  page: number;
  pages: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}> = ({ page, pages, onPageChange, isLoading }) => {
  const getPageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots: any[] = [];
    let l: number;

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [page, pages]);

  const handlePageClick = useCallback((newPage: number) => {
    if (onPageChange && !isLoading && newPage !== page) {
      onPageChange(newPage);
    }
  }, [onPageChange, isLoading, page]);

  const handleNext = useCallback(() => {
    if (page < pages && !isLoading) {
      handlePageClick(page + 1);
    }
  }, [page, pages, isLoading, handlePageClick]);

  const handlePrev = useCallback(() => {
    if (page > 1 && !isLoading) {
      handlePageClick(page - 1);
    }
  }, [page, isLoading, handlePageClick]);

  const handleFirst = useCallback(() => {
    if (page > 1 && !isLoading) {
      handlePageClick(1);
    }
  }, [page, isLoading, handlePageClick]);

  const handleLast = useCallback(() => {
    if (page < pages && !isLoading) {
      handlePageClick(pages);
    }
  }, [page, pages, isLoading, handlePageClick]);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handleFirst}
        disabled={page === 1 || isLoading}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        disabled={page === 1 || isLoading}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="hidden sm:flex items-center gap-1">
        {getPageNumbers.map((pageNum, index) => (
          typeof pageNum === 'number' ? (
            <Button
              key={index}
              variant={page === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageClick(pageNum)}
              disabled={isLoading}
              className={cn(
                "h-8 w-8",
                page === pageNum
                  ? cn(colorClasses.bg.blue600, "text-white hover:bg-blue-700")
                  : colorClasses.border.primary
              )}
            >
              {pageNum}
            </Button>
          ) : (
            <span key={index} className={cn("px-2", colorClasses.text.muted)}>...</span>
          )
        ))}
      </div>

      <div className="sm:hidden px-2">
        <span className={cn("text-sm", colorClasses.text.primary)}>{page}</span>
        <span className={cn("text-sm mx-1", colorClasses.text.muted)}>/</span>
        <span className={cn("text-sm", colorClasses.text.muted)}>{pages}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={page === pages || isLoading}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleLast}
        disabled={page === pages || isLoading}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn(
            "border rounded-lg p-4 animate-pulse",
            colorClasses.border.secondary,
            colorClasses.bg.primary
          )}>
            <div className="flex gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
              </div>
              <div className="w-48 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={cn(
          "border rounded-lg p-4 animate-pulse",
          colorClasses.border.secondary,
          colorClasses.bg.primary
        )}>
          <div className="space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Empty State
const EmptyState: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <div className="text-center py-12 sm:py-16">
    <div className={cn(
      "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
      colorClasses.bg.blueLight
    )}>
      <FileText className={cn("h-10 w-10", colorClasses.text.blue)} />
    </div>
    <h3 className={cn("text-xl font-semibold mb-2", colorClasses.text.primary)}>
      No professional tenders found
    </h3>
    <p className={cn("text-sm max-w-md mx-auto mb-6", colorClasses.text.secondary)}>
      Try adjusting your filters or search criteria to find more opportunities.
    </p>
    {onReset && (
      <Button
        variant="outline"
        onClick={onReset}
        className={cn("gap-2", colorClasses.border.primary)}
      >
        <RotateCcw className="h-4 w-4" />
        Clear Filters
      </Button>
    )}
  </div>
);

// Error State
const ErrorState: React.FC<{ error: any; onRetry?: () => void }> = ({ error, onRetry }) => (
  <Alert
    variant="destructive"
    className={cn("border", colorClasses.border.red, colorClasses.bg.redLight)}
  >
    <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <X className="h-4 w-4" />
        <span className={colorClasses.text.red}>
          Error loading tenders: {error.message || 'Please try again later.'}
        </span>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className={cn(colorClasses.border.red, colorClasses.text.red)}
        >
          Retry
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

const ProfessionalTenderList: React.FC<ProfessionalTenderListProps> = ({
  viewMode = 'grid',
  onViewModeChange,
  tenders = [],
  isLoading = false,
  error,
  filters,
  onFilterChange,
  pagination,
  onPageChange,
  onToggleSave,
  savedTenderIds = new Set(),
  showFilters = true,
  showPagination = true,
  showSorting = true,
  className,
}) => {
  const router = useRouter();
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewMode);
  const [showStats, setShowStats] = useState(true);

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setLocalViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
    localStorage.setItem('company-browse-view-mode', mode);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: pagination?.total || tenders.length,
      cpoRequired: tenders.filter(t => t.professionalSpecific?.cpoRequired).length,
      sealedBids: tenders.filter(t => t.workflowType === 'closed').length,
      openBids: tenders.filter(t => t.workflowType === 'open').length,
      urgent: tenders.filter(t => {
        const deadline = new Date(t.deadline);
        const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 7 && daysRemaining > 0;
      }).length,
      inviteOnly: tenders.filter(t => t.visibility?.visibilityType === 'invite_only').length,
      avgProposals: Math.round(
        tenders.reduce((sum, t) => sum + (t.metadata?.totalApplications || 0), 0) / (tenders.length || 1)
      ),
      avgViews: Math.round(
        tenders.reduce((sum, t) => sum + (t.metadata?.views || 0), 0) / (tenders.length || 1)
      ),
    };
  }, [tenders, pagination]);

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    onFilterChange?.({
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    onFilterChange?.({
      search: undefined,
      procurementMethod: undefined,
      cpoRequired: undefined,
      workflowType: undefined,
      visibilityType: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      minExperience: undefined,
      evaluationMethod: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      procuringEntity: undefined,
      referenceNumber: undefined,
    });
  };

  if (error) {
    return <ErrorState error={error} onRetry={() => router.reload()} />;
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Filters */}
      {showFilters && filters && onFilterChange && (
        <ProfessionalTenderFilters
          filters={filters}
          onFiltersChange={onFilterChange}
          totalCount={pagination?.total}
          isLoading={isLoading}
        />
      )}

      {/* Stats Cards */}
      {showStats && !isLoading && tenders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Total */}
          <div className={cn(
            "p-3 sm:p-4 rounded-xl border border-l-4",
            colorClasses.bg.primary,
            colorClasses.border.secondary,
            colorClasses.border.blue
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Total</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.total}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.blueLight)}>
                <FileText className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.blue)} />
              </div>
            </div>
          </div>

          {/* CPO Required */}
          <div className={cn(
            "p-3 sm:p-4 rounded-xl border border-l-4",
            colorClasses.bg.primary,
            colorClasses.border.secondary,
            colorClasses.border.rose
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>CPO Required</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.cpoRequired}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.roseLight)}>
                <Banknote className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.rose)} />
              </div>
            </div>
          </div>

          {/* Sealed Bids */}
          <div className={cn(
            "p-3 sm:p-4 rounded-xl border border-l-4",
            colorClasses.bg.primary,
            colorClasses.border.secondary,
            colorClasses.border.purple
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Sealed Bids</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.sealedBids}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.purpleLight)}>
                <Shield className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.purple)} />
              </div>
            </div>
          </div>

          {/* Urgent */}
          <div className={cn(
            "p-3 sm:p-4 rounded-xl border border-l-4",
            colorClasses.bg.primary,
            colorClasses.border.secondary,
            colorClasses.border.amber
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Ending Soon</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.urgent}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.amberLight)}>
                <Calendar className={cn("h-4 w-4 sm:h-5 sm:w-5", colorClasses.text.amber)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      {(showSorting || onViewModeChange) && (
        <div className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border",
          colorClasses.bg.primary,
          colorClasses.border.secondary
        )}>
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {onViewModeChange && (
              <div className={cn("flex items-center rounded-md border p-1", colorClasses.border.secondary)}>
                <Button
                  variant={localViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  disabled={isLoading}
                  className={cn(
                    "h-8 px-3",
                    localViewMode === 'grid'
                      ? cn(colorClasses.bg.blue600, "text-white hover:bg-blue-700")
                      : cn(colorClasses.text.secondary)
                  )}
                >
                  <Grid3x3 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Grid</span>
                </Button>
                <Separator orientation="vertical" className={cn("h-6 mx-1", colorClasses.bg.muted)} />
                <Button
                  variant={localViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  disabled={isLoading}
                  className={cn(
                    "h-8 px-3",
                    localViewMode === 'list'
                      ? cn(colorClasses.bg.blue600, "text-white hover:bg-blue-700")
                      : cn(colorClasses.text.secondary)
                  )}
                >
                  <List className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">List</span>
                </Button>
              </div>
            )}

            {/* Stats Toggle */}
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Switch
                id="show-stats"
                checked={showStats}
                onCheckedChange={setShowStats}
                disabled={isLoading}
              />
              <Label htmlFor="show-stats" className={cn("text-sm", colorClasses.text.secondary)}>
                Show Stats
              </Label>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sorting */}
            {showSorting && filters && onFilterChange && (
              <Select
                value={`${filters.sortBy || 'createdAt'}_${filters.sortOrder || 'desc'}`}
                onValueChange={handleSortChange}
                disabled={isLoading}
              >
                <SelectTrigger className={cn("w-full sm:w-48", colorClasses.border.primary)}>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt_desc">Newest First</SelectItem>
                  <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                  <SelectItem value="deadline_asc">Deadline (Soonest)</SelectItem>
                  <SelectItem value="deadline_desc">Deadline (Latest)</SelectItem>
                  <SelectItem value="views_desc">Most Viewed</SelectItem>
                  <SelectItem value="views_asc">Least Viewed</SelectItem>
                  <SelectItem value="totalApplications_desc">Most Bids</SelectItem>
                  <SelectItem value="totalApplications_asc">Least Bids</SelectItem>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Results Count */}
            {pagination && (
              <div className="hidden lg:flex items-center">
                <Badge variant="outline" className={cn(colorClasses.border.secondary)}>
                  {pagination.total} {pagination.total === 1 ? 'tender' : 'tenders'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && pagination && pagination.total > 0 && (
        <div className={cn("flex justify-between items-center text-sm", colorClasses.text.muted)}>
          <div>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tenders
          </div>
          <div className="hidden sm:block">
            Page {pagination.page} of {pagination.pages}
          </div>
        </div>
      )}

      {/* Tender List/Grid */}
      {isLoading ? (
        <LoadingSkeleton viewMode={localViewMode} />
      ) : tenders.length > 0 ? (
        <div className={cn(
          localViewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
            : "space-y-3 sm:space-y-4"
        )}>
          {tenders.map((tender) => (
            <ProfessionalTenderCard
              key={tender._id}
              tender={tender}
              variant={localViewMode}
              onToggleSave={onToggleSave}
              isSaved={savedTenderIds.has(tender._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onReset={handleResetFilters} />
      )}

      {/* Pagination */}
      {showPagination && pagination && pagination.pages > 1 && onPageChange && (
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t",
          colorClasses.border.secondary
        )}>
          <div className={cn("text-sm", colorClasses.text.muted)}>
            Page {pagination.page} of {pagination.pages}
          </div>
          <PaginationControls
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={onPageChange}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ProfessionalTenderList;