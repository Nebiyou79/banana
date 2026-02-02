/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/freelance/FreelanceTenderList.tsx
import React from 'react';
import { useTenders, useTenderViewMode, useTenderSorting } from '@/hooks/useTenders';
import FreelanceTenderCard from './FreelancerTenderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Search,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  ListTodo,
  LayoutList
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/social/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface FreelanceTenderListProps {
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showFilters?: boolean;
  showSorting?: boolean;
  showPagination?: boolean;
  tenders?: any[];
  isLoading?: boolean;
  error?: any;
  filters?: any;
  onFilterChange?: (filters: any) => void;
  pagination?: any;
  onPageChange?: (page: number) => void;
}

const FreelanceTenderList: React.FC<FreelanceTenderListProps> = ({
  viewMode: externalViewMode,
  onViewModeChange,
  showFilters = true,
  showSorting = true,
  showPagination = true,
  tenders: externalTenders,
  isLoading: externalLoading,
  error: externalError,
  filters: externalFilters,
  onFilterChange: externalOnFilterChange,
  pagination: externalPagination,
  onPageChange: externalOnPageChange,
}) => {
  // Use internal hooks if no external props provided
  const internalTenders = useTenders({
    tenderCategory: 'freelance',
    status: 'published'
  });

  const {
    tenders,
    isLoading,
    error,
    filters,
    updateFilters,
    pagination,
    setPage,
    refetch
  } = externalTenders ? {
    tenders: externalTenders,
    isLoading: externalLoading || false,
    error: externalError,
    filters: externalFilters || {},
    updateFilters: externalOnFilterChange || (() => { }),
    pagination: externalPagination || { page: 1, pages: 1, total: 0 },
    setPage: externalOnPageChange || (() => { }),
    refetch: () => { }
  } : internalTenders;

  // View mode management
  const internalViewMode = useTenderViewMode('freelance');
  const viewMode = externalViewMode || internalViewMode.viewMode.type;
  const { sortedTenders, sortConfig, updateSort } = useTenderSorting(tenders);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      internalViewMode.updateViewMode({ type: mode });
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    updateSort(sortBy, sortOrder as 'asc' | 'desc');
  };

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <AlertDescription className="text-red-800 dark:text-red-300">
          Error loading tenders: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Skeleton for filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 sm:h-12 rounded-md" />
            ))}
          </div>
        )}

        {/* Skeleton for cards */}
        <div className={cn(
          "gap-4 sm:gap-6",
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
        )}>
          {[...Array(6)].map((_, i) => (
            viewMode === 'grid' ? (
              <Skeleton key={i} className="h-64 sm:h-80 rounded-xl" />
            ) : (
              <Skeleton key={i} className="h-32 sm:h-40 rounded-xl" />
            )
          ))}
        </div>
      </div>
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <Search className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-400 dark:text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No Freelance Tenders Found
        </h3>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          There are currently no freelance projects available. Check back soon or try adjusting your filters.
        </p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="border-border-primary hover:bg-bg-secondary"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-bg-primary rounded-lg border border-border-secondary">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary mr-2">View:</span>
          <div className="flex items-center rounded-md border border-border-secondary p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className={cn(
                "h-8 px-2 sm:px-3",
                viewMode === 'grid'
                  ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Grid className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className={cn(
                "h-8 px-2 sm:px-3",
                viewMode === 'list'
                  ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <List className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Card Size Toggle (only for grid view) */}
          {viewMode === 'grid' && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1 sm:mx-2" />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => internalViewMode.setCardSize('small')}
                  className={cn(
                    "h-8 w-8",
                    internalViewMode.viewMode.cardSize === 'small'
                      ? "bg-bg-secondary text-text-primary"
                      : "text-text-muted"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => internalViewMode.setCardSize('medium')}
                  className={cn(
                    "h-8 w-8",
                    internalViewMode.viewMode.cardSize === 'medium'
                      ? "bg-bg-secondary text-text-primary"
                      : "text-text-muted"
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => internalViewMode.setCardSize('large')}
                  className={cn(
                    "h-8 w-8",
                    internalViewMode.viewMode.cardSize === 'large'
                      ? "bg-bg-secondary text-text-primary"
                      : "text-text-muted"
                  )}
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
            <span className="text-sm text-text-secondary hidden sm:inline">Sort by:</span>
            <Select
              value={`${sortConfig.sortBy}_${sortConfig.sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full sm:w-48 border-border-primary bg-bg-primary">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="border-border-secondary bg-bg-primary">
                <SelectItem value="createdAt_desc">Newest First</SelectItem>
                <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                <SelectItem value="deadline_asc">Deadline (Soonest)</SelectItem>
                <SelectItem value="deadline_desc">Deadline (Latest)</SelectItem>
                <SelectItem value="budget_desc">Budget (High to Low)</SelectItem>
                <SelectItem value="budget_asc">Budget (Low to High)</SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border-secondary">
            {pagination.total} {pagination.total === 1 ? 'project' : 'projects'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-bg-secondary dark:bg-bg-surface/50 rounded-lg border border-border-secondary">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search freelance tenders..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full border-border-primary bg-bg-primary"
            />
          </div>
          <Select
            value={filters.workflowType || 'all'}
            onValueChange={(value) => updateFilters({
              workflowType: value === 'all' ? undefined : value as any
            })}
          >
            <SelectTrigger className="border-border-primary bg-bg-primary">
              <SelectValue placeholder="Workflow Type" />
            </SelectTrigger>
            <SelectContent className="border-border-secondary bg-bg-primary">
              <SelectItem value="all">All Workflows</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.engagementType || 'all'}
            onValueChange={(value) => updateFilters({
              engagementType: value === 'all' ? undefined : value as any
            })}
          >
            <SelectTrigger className="border-border-primary bg-bg-primary">
              <SelectValue placeholder="Engagement Type" />
            </SelectTrigger>
            <SelectContent className="border-border-secondary bg-bg-primary">
              <SelectItem value="all">All Engagements</SelectItem>
              <SelectItem value="fixed_price">Fixed Price</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tender Grid/List */}
      <div className={cn(
        viewMode === 'grid' ? "grid grid-cols-1 gap-4 sm:gap-6" : "space-y-3 sm:space-y-4",
        viewMode === 'grid' && internalViewMode.viewMode.cardSize === 'small' && "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        viewMode === 'grid' && internalViewMode.viewMode.cardSize === 'medium' && "sm:grid-cols-2 lg:grid-cols-3",
        viewMode === 'grid' && internalViewMode.viewMode.cardSize === 'large' && "sm:grid-cols-1 lg:grid-cols-2"
      )}>
        {sortedTenders.map((tender) => (
          <FreelanceTenderCard
            key={tender._id}
            tender={tender}
            variant={viewMode}
            size={internalViewMode.viewMode.cardSize}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-bg-primary rounded-lg border border-border-secondary">
          <div className="text-sm text-text-secondary">
            Showing page {pagination.page} of {pagination.pages} • {pagination.total} total projects
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={pagination.page === 1}
              className="h-8 w-8 sm:h-9 sm:w-9 border-border-primary disabled:opacity-50"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="h-8 w-8 sm:h-9 sm:w-9 border-border-primary disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "h-8 min-w-[36px] sm:h-9 sm:min-w-[40px]",
                      pagination.page === pageNum
                        ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                        : "border-border-primary"
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="h-8 w-8 sm:h-9 sm:w-9 border-border-primary disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className="h-8 w-8 sm:h-9 sm:w-9 border-border-primary disabled:opacity-50"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelanceTenderList;