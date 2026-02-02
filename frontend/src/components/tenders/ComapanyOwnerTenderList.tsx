/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/company/CompanyOwnerTenderList.tsx
import React, { useState, useMemo } from 'react';
import { CompanyOwnerTenderCard, CompanyOwnerTenderCardSkeleton } from './CompanyOwnerTenderCard';
import { useOwnedTenders } from '@/hooks/useTenders';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Pagination';
import {
  RefreshCw,
  Search,
  Filter,
  Grid3x3,
  List,
  Download,
  Plus,
  ChevronDown,
  X,
  FileText,
  Users,
  Eye,
  SortAsc,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { colors, lightTheme, darkTheme } from '@/utils/color';

interface CompanyOwnerTenderListProps {
  initialFilters?: {
    page?: number;
    limit?: number;
    status?: string;
    tenderCategory?: string;
    workflowType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  showFilters?: boolean;
  showHeader?: boolean;
  className?: string;
  itemsPerPage?: number;
}

export const CompanyOwnerTenderList: React.FC<CompanyOwnerTenderListProps> = ({
  initialFilters = {},
  showFilters = true,
  showHeader = true,
  className,
  itemsPerPage = 12
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialFilters.tenderCategory || 'all');
  const [workflowFilter, setWorkflowFilter] = useState<string>(initialFilters.workflowType || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'desc');
  const [activeTab, setActiveTab] = useState<string>(statusFilter !== 'all' ? statusFilter : 'all');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const {
    tenders,
    pagination,
    isLoading,
    error,
    refetch
  } = useOwnedTenders({
    page: initialFilters.page || 1,
    limit: itemsPerPage,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    tenderCategory: categoryFilter !== 'all' ? categoryFilter : undefined,
    workflowType: workflowFilter !== 'all' ? workflowFilter : undefined,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const total = tenders.length || 0;
    const published = tenders.filter(t => t.status === 'published').length;
    const draft = tenders.filter(t => t.status === 'draft').length;
    const totalApplications = tenders.reduce((sum, t) => sum + (t.metadata?.totalApplications || 0), 0);
    const freelance = tenders.filter(t => t.tenderCategory === 'freelance').length;
    const professional = tenders.filter(t => t.tenderCategory === 'professional').length;
    const endingSoon = tenders.filter(t => {
      if (t.status !== 'published') return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length;

    return { total, published, draft, totalApplications, freelance, professional, endingSoon };
  }, [tenders]);

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'metadata.totalApplications', label: 'Most Applications' },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    refetch();
  };

  const handleFilterChange = (type: string, value: string) => {
    const filterHandlers = {
      status: () => {
        setStatusFilter(value);
        setActiveTab(value === 'all' ? 'all' : value);
      },
      category: () => setCategoryFilter(value),
      workflow: () => setWorkflowFilter(value),
    };

    if (filterHandlers[type as keyof typeof filterHandlers]) {
      filterHandlers[type as keyof typeof filterHandlers]();
    }

    if (value !== 'all') {
      setActiveFilters(prev => new Set(prev).add(`${type}:${value}`));
    } else {
      const newSet = new Set(activeFilters);
      for (const filter of newSet) {
        if (filter.startsWith(`${type}:`)) newSet.delete(filter);
      }
      setActiveFilters(newSet);
    }

    refetch();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setStatusFilter(value === 'all' ? 'all' : value);
    refetch();
  };

  const removeFilter = (filter: string) => {
    const [type, value] = filter.split(':');
    const filterResetHandlers = {
      status: () => setStatusFilter('all'),
      category: () => setCategoryFilter('all'),
      workflow: () => setWorkflowFilter('all'),
    };

    if (filterResetHandlers[type as keyof typeof filterResetHandlers]) {
      filterResetHandlers[type as keyof typeof filterResetHandlers]();
    }

    const newSet = new Set(activeFilters);
    newSet.delete(filter);
    setActiveFilters(newSet);
    refetch();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setWorkflowFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setActiveTab('all');
    setActiveFilters(new Set());
    refetch();
  };

  const handleCreateNew = () => {
    window.location.href = '/dashboard/company/my-tenders/create';
  };

  const handleExport = () => {
    console.log('Export tenders');
  };

  const EmptyState = () => (
    <Card className="col-span-full bg-bg-primary dark:bg-bg-secondary rounded-xl border-2 border-dashed border-border-primary dark:border-border-secondary">
      <div className="flex flex-col items-center justify-center py-12 px-4 sm:py-16 sm:px-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-bg-secondary dark:bg-bg-surface flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted" />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-text-primary mb-3 text-center">
          {activeFilters.size > 0 || searchQuery ? 'No Matching Tenders' : 'No Tenders Yet'}
        </h3>
        <p className="text-text-muted text-center mb-8 max-w-md">
          {activeFilters.size > 0 || searchQuery
            ? 'No tenders match your current filters. Try adjusting your search criteria.'
            : 'Start by creating your first tender to connect with talented professionals.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {(activeFilters.size > 0 || searchQuery) && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="px-6"
            >
              Clear All Filters
            </Button>
          )}
          <Button
            onClick={handleCreateNew}
            className="px-6 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Create First Tender
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className={cn("space-y-6 sm:space-y-8", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Company Tenders
            </h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Manage and track all your project tenders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleExport}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleCreateNew}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Tender</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary dark:from-bg-surface dark:to-bg-primary border border-border-secondary dark:border-border-secondary shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Tenders</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-2">
                  {stats.total}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                    {stats.freelance} Freelance
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                    {stats.professional} Professional
                  </Badge>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary dark:from-bg-surface dark:to-bg-primary border border-border-secondary dark:border-border-secondary shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Tenders</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-2">
                  {stats.published}
                </p>
                <p className="text-sm text-text-muted mt-3">
                  {stats.endingSoon} ending soon
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary dark:from-bg-surface dark:to-bg-primary border border-border-secondary dark:border-border-secondary shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Applications</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-2">
                  {stats.totalApplications}
                </p>
                <p className="text-sm text-text-muted mt-3">
                  Across all tenders
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-bg-primary to-bg-secondary dark:from-bg-surface dark:to-bg-primary border border-border-secondary dark:border-border-secondary shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Draft Tenders</p>
                <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-2">
                  {stats.draft}
                </p>
                <p className="text-sm text-text-muted mt-3">
                  Ready to publish
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="bg-bg-primary dark:bg-bg-surface rounded-xl border border-border-secondary dark:border-border-secondary shadow-sm">
        <div className="p-4 sm:p-6 border-b border-border-secondary dark:border-border-secondary">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-bg-secondary dark:bg-bg-surface p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-bg-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-bg-primary">
                  All Tenders
                  <Badge variant="secondary" className="ml-2">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="published" className="data-[state=active]:bg-bg-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-bg-primary">
                  Active
                  <Badge variant="secondary" className="ml-2">
                    {stats.published}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="data-[state=active]:bg-bg-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-bg-primary">
                  Draft
                  <Badge variant="secondary" className="ml-2">
                    {stats.draft}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="data-[state=active]:bg-bg-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-bg-primary">
                  Closed
                  <Badge variant="secondary" className="ml-2">
                    {tenders.filter(t => t.status === 'closed').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border-primary dark:border-border-secondary rounded-lg overflow-hidden bg-bg-secondary dark:bg-bg-surface">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                      placeholder="Search by title, description, or ID..."
                      value={searchQuery}
                      onChange={handleSearch}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      className="pl-10 bg-bg-primary dark:bg-bg-surface border-border-primary dark:border-border-secondary"
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <SortAsc className="w-4 h-4" />
                          <span className="hidden sm:inline">Sort</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sortOptions.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              refetch();
                            }}
                            className={sortBy === option.value ? "bg-bg-secondary dark:bg-bg-surface" : ""}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Filter className="w-4 h-4" />
                          <span className="hidden sm:inline">Filters</span>
                          {activeFilters.size > 0 && (
                            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                              {activeFilters.size}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="p-2 space-y-3">
                          <div>
                            <label className="text-xs font-medium text-text-muted mb-1 block">
                              Category
                            </label>
                            <Select value={categoryFilter} onValueChange={(v) => handleFilterChange('category', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="freelance">Freelance</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-text-muted mb-1 block">
                              Workflow
                            </label>
                            <Select value={workflowFilter} onValueChange={(v) => handleFilterChange('workflow', v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Workflows" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Workflows</SelectItem>
                                <SelectItem value="open">Open Tender</SelectItem>
                                <SelectItem value="closed">Sealed Bid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {activeFilters.size > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={clearAllFilters}>
                              Clear All Filters
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {activeFilters.size > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-text-muted">Active filters:</span>
                    {Array.from(activeFilters).map(filter => (
                      <Badge
                        key={filter}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1 bg-bg-secondary text-text-primary dark:bg-bg-surface dark:text-text-secondary"
                      >
                        {filter.split(':')[1]}
                        <button
                          onClick={() => removeFilter(filter)}
                          className="text-text-muted hover:text-text-primary dark:hover:text-text-secondary"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-7 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {error && (
            <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-text-error dark:text-text-error mb-2">
                  Error Loading Tenders
                </h3>
                <p className="text-text-muted text-center mb-4">
                  {error.message}
                </p>
                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className={cn(
              "grid gap-4 sm:gap-6",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {[...Array(itemsPerPage)].map((_, i) => (
                <CompanyOwnerTenderCardSkeleton key={i} />
              ))}
            </div>
          ) : tenders.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className={cn(
                "grid gap-4 sm:gap-6",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {tenders.map((tender) => (
                  <CompanyOwnerTenderCard
                    key={tender._id}
                    tender={tender}
                    className={viewMode === 'list' ? "max-w-4xl" : ""}
                  />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border-secondary dark:border-border-secondary">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-text-muted">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tenders
                    </div>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => {
                              if (pagination.page > 1) {
                                // Handle page change
                              }
                            }}
                            className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(
                            pagination.pages - 4,
                            pagination.page - 2
                          )) + i;

                          if (pageNum > pagination.pages) return null;

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => {
                                  // Handle page change
                                }}
                                isActive={pageNum === pagination.page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        {pagination.pages > 5 && pagination.page < pagination.pages - 2 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => {
                                  // Handle page change
                                }}
                                isActive={pagination.page === pagination.pages}
                              >
                                {pagination.pages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              if (pagination.page < pagination.pages) {
                                // Handle page change
                              }
                            }}
                            className={pagination.page === pagination.pages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};