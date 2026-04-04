// components/tenders/FreelanceTenderList.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  Grid,
  List,
  LayoutGrid,
  LayoutList,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Tender } from '@/services/tenderService';
import FreelancerTenderCard from '@/components/tenders/FreelancerTenderCard';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useTenderSorting } from '@/hooks/useTenders';
import { FreelanceTenderFilter } from '@/services/tenderService';

interface FreelanceTenderListProps {
  tenders: Tender[];
  isLoading?: boolean;
  error?: any;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  cardSize?: 'small' | 'medium' | 'large';
  onCardSizeChange?: (size: 'small' | 'medium' | 'large') => void;
  filters?: FreelanceTenderFilter;
  onFiltersChange?: (filters: Partial<FreelanceTenderFilter>) => void;
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
  onToggleSave?: (tenderId: string) => void;
  savedTenderIds?: Set<string>;
  showFilters?: boolean;
  showSorting?: boolean;
  showPagination?: boolean;
  className?: string;
}

// Pagination Controls Component
const PaginationControls: React.FC<{
  page: number;
  pages: number;
  onPageChange?: (page: number) => void;
}> = ({ page, pages, onPageChange }) => {
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

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(1)}
        disabled={page === 1}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(page - 1)}
        disabled={page === 1}
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
              onClick={() => onPageChange?.(pageNum)}
              className={cn(
                "h-8 w-8",
                page === pageNum
                  ? cn(colorClasses.bg.emerald600, "text-white hover:bg-emerald-700")
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
        onClick={() => onPageChange?.(page + 1)}
        disabled={page === pages}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(pages)}
        disabled={page === pages}
        className={cn("h-8 w-8", colorClasses.border.primary)}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton: React.FC<{ viewMode: 'grid' | 'list'; cardSize: 'small' | 'medium' | 'large' }> = ({ viewMode, cardSize }) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={cn("animate-pulse", colorClasses.border.secondary, colorClasses.bg.primary)}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className={cn("h-5 w-2/3 rounded", colorClasses.bg.gray200)} />
                  <div className={cn("h-4 w-full rounded", colorClasses.bg.gray200)} />
                  <div className={cn("h-4 w-3/4 rounded", colorClasses.bg.gray200)} />
                  <div className="flex gap-2">
                    <div className={cn("h-6 w-16 rounded", colorClasses.bg.gray200)} />
                    <div className={cn("h-6 w-16 rounded", colorClasses.bg.gray200)} />
                  </div>
                </div>
                <div className="w-48 space-y-3">
                  <div className={cn("h-4 w-24 rounded", colorClasses.bg.gray200)} />
                  <div className={cn("h-4 w-20 rounded", colorClasses.bg.gray200)} />
                  <div className={cn("h-8 w-full rounded", colorClasses.bg.gray200)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const gridCols = {
    small: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    medium: "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
    large: "sm:grid-cols-1 lg:grid-cols-2"
  };

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridCols[cardSize])}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className={cn("animate-pulse", colorClasses.border.secondary, colorClasses.bg.primary)}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className={cn("h-5 w-3/4 rounded", colorClasses.bg.gray200)} />
              <div className={cn("h-4 w-full rounded", colorClasses.bg.gray200)} />
              <div className={cn("h-4 w-2/3 rounded", colorClasses.bg.gray200)} />
              <div className="flex gap-2">
                <div className={cn("h-6 w-16 rounded", colorClasses.bg.gray200)} />
                <div className={cn("h-6 w-16 rounded", colorClasses.bg.gray200)} />
              </div>
              <div className={cn("h-8 w-full rounded mt-4", colorClasses.bg.gray200)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onReset?: () => void; hasFilters?: boolean }> = ({ onReset, hasFilters }) => (
  <Card className={cn("border-2 border-dashed text-center py-12 px-4", colorClasses.bg.primary, colorClasses.border.primary)}>
    <CardContent className="space-y-4">
      <div className={cn(
        "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
        colorClasses.bg.emeraldLight
      )}>
        <AlertCircle className={cn("h-8 w-8", colorClasses.text.emerald)} />
      </div>
      <div>
        <h3 className={cn("text-lg font-medium mb-2", colorClasses.text.primary)}>
          {hasFilters ? 'No matching projects found' : 'No projects available'}
        </h3>
        <p className={cn("text-sm max-w-md mx-auto", colorClasses.text.muted)}>
          {hasFilters
            ? 'Try adjusting your filters or search criteria to find more projects.'
            : 'Check back later for new freelance opportunities.'}
        </p>
      </div>
      {hasFilters && onReset && (
        <Button
          variant="outline"
          onClick={onReset}
          className={cn("mt-2 gap-2", colorClasses.border.primary)}
        >
          <RefreshCw className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </CardContent>
  </Card>
);

const FreelanceTenderList: React.FC<FreelanceTenderListProps> = ({
  tenders,
  isLoading = false,
  error,
  viewMode = 'grid',
  onViewModeChange,
  cardSize = 'medium',
  onCardSizeChange,
  filters,
  onFiltersChange,
  pagination,
  onPageChange,
  onToggleSave,
  savedTenderIds = new Set(),
  showSorting = true,
  showPagination = true,
  className,
}) => {
  // Use internal sorting
  const { sortedTenders, sortConfig, updateSort } = useTenderSorting(tenders);

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    updateSort(sortBy, sortOrder as 'asc' | 'desc');
    // Also update parent filters if needed
    onFiltersChange?.({
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1
    });
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    onViewModeChange?.(mode);
  };

  // Handle card size change
  const handleCardSizeChange = (size: 'small' | 'medium' | 'large') => {
    onCardSizeChange?.(size);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        search: undefined,
        engagementType: undefined,
        minBudget: undefined,
        maxBudget: undefined,
        experienceLevel: undefined,
        projectType: undefined,
        skills: undefined,
        urgency: undefined,
        ndaRequired: undefined,
        portfolioRequired: undefined,
        languagePreference: undefined,
        timezonePreference: undefined,
        estimatedDurationMin: undefined,
        estimatedDurationMax: undefined,
        estimatedDurationUnit: undefined,
        weeklyHoursMin: undefined,
        weeklyHoursMax: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton viewMode={viewMode} cardSize={cardSize} />;
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 dark:border-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading tenders</AlertTitle>
        <AlertDescription>
          {error.message || 'Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (tenders.length === 0) {
    const hasFilters = filters && Object.keys(filters).some(key =>
      key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder' && filters[key as keyof typeof filters]
    );
    return <EmptyState onReset={hasFilters ? handleResetFilters : undefined} hasFilters={hasFilters} />;
  }

  // Grid column classes based on card size
  const gridCols = {
    small: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    medium: "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
    large: "sm:grid-cols-1 lg:grid-cols-2"
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls Bar */}
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border",
        colorClasses.bg.primary,
        colorClasses.border.secondary
      )}>
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className={cn("text-sm mr-2 hidden sm:inline", colorClasses.text.secondary)}>View:</span>
          <div className={cn("flex items-center rounded-md border p-1", colorClasses.border.secondary)}>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className={cn(
                "h-8 px-2",
                viewMode === 'grid'
                  ? cn(colorClasses.bg.emerald600, "text-white hover:bg-emerald-700")
                  : cn(colorClasses.text.secondary)
              )}
            >
              <Grid className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Separator orientation="vertical" className={cn("h-6 mx-1", colorClasses.bg.secondary)} />
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className={cn(
                "h-8 px-2",
                viewMode === 'list'
                  ? cn(colorClasses.bg.emerald600, "text-white hover:bg-emerald-700")
                  : cn(colorClasses.text.secondary)
              )}
            >
              <List className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Card Size Toggle (only for grid view) */}
          {viewMode === 'grid' && onCardSizeChange && (
            <>
              <Separator orientation="vertical" className={cn("h-6 mx-1 hidden sm:block", colorClasses.bg.secondary)} />
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCardSizeChange('small')}
                  className={cn(
                    "h-8 w-8",
                    cardSize === 'small'
                      ? cn(colorClasses.bg.secondary, colorClasses.text.primary)
                      : colorClasses.text.muted
                  )}
                  title="Small cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCardSizeChange('medium')}
                  className={cn(
                    "h-8 w-8",
                    cardSize === 'medium'
                      ? cn(colorClasses.bg.secondary, colorClasses.text.primary)
                      : colorClasses.text.muted
                  )}
                  title="Medium cards"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCardSizeChange('large')}
                  className={cn(
                    "h-8 w-8",
                    cardSize === 'large'
                      ? cn(colorClasses.bg.secondary, colorClasses.text.primary)
                      : colorClasses.text.muted
                  )}
                  title="Large cards"
                >
                  <ListTodo className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Sorting */}
        {showSorting && (
          <div className="flex items-center gap-2">
            <span className={cn("text-sm hidden sm:inline", colorClasses.text.secondary)}>Sort by:</span>
            <Select
              value={`${sortConfig.sortBy}_${sortConfig.sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className={cn("w-full sm:w-48", colorClasses.border.primary)}>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt_desc">Newest First</SelectItem>
                <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                <SelectItem value="deadline_asc">Deadline (Soonest)</SelectItem>
                <SelectItem value="deadline_desc">Deadline (Latest)</SelectItem>
                <SelectItem value="budget_desc">Budget (High to Low)</SelectItem>
                <SelectItem value="budget_asc">Budget (Low to High)</SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
                <SelectItem value="views_desc">Most Viewed</SelectItem>
                <SelectItem value="applications_desc">Most Bids</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results Count */}
        {pagination && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("hidden sm:flex", colorClasses.border.secondary)}>
              {pagination.total} {pagination.total === 1 ? 'project' : 'projects'}
            </Badge>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!isLoading && pagination && pagination.total > 0 && (
        <div className={cn("flex justify-between items-center text-sm", colorClasses.text.muted)}>
          <div>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
          </div>
          <div className="hidden sm:block">
            Page {pagination.page} of {pagination.pages}
          </div>
        </div>
      )}

      {/* Tender Grid/List */}
      <div className={cn(
        viewMode === 'grid' ? "grid grid-cols-1 gap-4" : "space-y-3",
        viewMode === 'grid' && gridCols[cardSize]
      )}>
        {sortedTenders.map((tender) => (
          <FreelancerTenderCard
            key={tender._id}
            tender={tender}
            variant={viewMode}
            size={cardSize}
            isSaved={savedTenderIds.has(tender._id)}
            onToggleSave={onToggleSave ? () => onToggleSave(tender._id) : undefined}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && pagination && pagination.pages > 1 && onPageChange && (
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border",
          colorClasses.bg.primary,
          colorClasses.border.secondary
        )}>
          <div className={cn("text-sm order-2 sm:order-1", colorClasses.text.secondary)}>
            Showing page {pagination.page} of {pagination.pages} • {pagination.total} total projects
          </div>
          <PaginationControls
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default FreelanceTenderList;