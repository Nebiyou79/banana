/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/organization/OrganizationOwnerTenderList.tsx
import React, { useState, useMemo } from 'react';
import { OrganizationOwnerTenderCard, OrganizationOwnerTenderCardSkeleton } from './OrganizationOwnerTenderCard';
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
  RefreshCw,
  Filter,
  Grid3x3,
  List,
  Download,
  Plus,
  ChevronDown,
  X,
  Building2,
  Users,
  Shield,
  TrendingUp,
  SortAsc,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

interface OrganizationOwnerTenderListProps {
  initialFilters?: {
    page?: number;
    limit?: number;
    status?: string;
    tenderCategory?: string;
    workflowType?: string;
    procurementMethod?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    cpoRequired?: boolean;
  };
  showFilters?: boolean;
  showHeader?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const OrganizationOwnerTenderList: React.FC<OrganizationOwnerTenderListProps> = ({
  initialFilters = {},
  showFilters = true,
  showHeader = true,
  viewMode: externalViewMode = 'grid',
  className = '',
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialFilters.tenderCategory || 'all');
  const [workflowFilter, setWorkflowFilter] = useState<string>(initialFilters.workflowType || 'all');
  const [procurementFilter, setProcurementFilter] = useState<string>(initialFilters.procurementMethod || 'all');
  const [cpoFilter, setCpoFilter] = useState<string>(initialFilters.cpoRequired ? 'true' : 'all');
  const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'desc');
  const [activeTab, setActiveTab] = useState<string>(statusFilter !== 'all' ? statusFilter : 'all');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>(externalViewMode);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);

  const viewMode = externalViewMode || internalViewMode;

  const {
    tenders,
    pagination,
    isLoading,
    error,
    refetch
  } = useOwnedTenders({
    page: currentPage,
    limit: initialFilters.limit || 12,
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
    const cpoRequired = tenders.filter(t =>
      t.tenderCategory === 'professional' &&
      t.professionalSpecific?.cpoRequired
    ).length;
    const sealedBid = tenders.filter(t => t.workflowType === 'closed').length;
    const endingSoon = tenders.filter(t => {
      if (t.status !== 'published') return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length;

    return { total, published, draft, totalApplications, freelance, professional, cpoRequired, sealedBid, endingSoon };
  }, [tenders]);

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'metadata.totalApplications', label: 'Most Applications' },
    { value: 'professionalSpecific.referenceNumber', label: 'Reference Number' },
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
      procurement: () => setProcurementFilter(value),
      cpo: () => setCpoFilter(value),
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

    setCurrentPage(1);
    refetch();
    
    if (isMobile) {
      setShowMobileFilters(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setStatusFilter(value === 'all' ? 'all' : value);
    setCurrentPage(1);
    refetch();
  };

  const removeFilter = (filter: string) => {
    const [type, value] = filter.split(':');
    const filterResetHandlers = {
      status: () => setStatusFilter('all'),
      category: () => setCategoryFilter('all'),
      workflow: () => setWorkflowFilter('all'),
      procurement: () => setProcurementFilter('all'),
      cpo: () => setCpoFilter('all'),
    };

    if (filterResetHandlers[type as keyof typeof filterResetHandlers]) {
      filterResetHandlers[type as keyof typeof filterResetHandlers]();
    }

    const newSet = new Set(activeFilters);
    newSet.delete(filter);
    setActiveFilters(newSet);
    setCurrentPage(1);
    refetch();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setWorkflowFilter('all');
    setProcurementFilter('all');
    setCpoFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setActiveTab('all');
    setActiveFilters(new Set());
    setCurrentPage(1);
    refetch();
  };

  const handleCreateNew = () => {
    window.location.href = '/dashboard/organization/tenders/create';
  };

  const handleExport = () => {
    console.log('Export tenders');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const EmptyState = () => (
    <Card className={cn(
      "col-span-full rounded-xl border-2 border-dashed",
      colorClasses.bg.primary,
      colorClasses.border.gray100
    )}>
      <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12 sm:px-6">
        <div className={cn(
          "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4",
          colorClasses.bg.secondary
        )}>
          <Building2 className={cn("w-8 h-8 sm:w-10 sm:h-10", colorClasses.text.muted)} />
        </div>
        <h3 className={cn("text-lg sm:text-xl font-semibold mb-2 text-center", colorClasses.text.primary)}>
          {activeFilters.size > 0 || searchQuery ? 'No Matching Tenders' : 'No Tenders Yet'}
        </h3>
        <p className={cn("text-center mb-6 max-w-md text-sm", colorClasses.text.muted)}>
          {activeFilters.size > 0 || searchQuery
            ? 'No tenders match your current filters. Try adjusting your search criteria.'
            : 'Start by creating your first tender for institutional procurement.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {(activeFilters.size > 0 || searchQuery) && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className={cn("px-6", getTouchTargetSize('lg'))}
            >
              Clear All Filters
            </Button>
          )}
          <Button
            onClick={handleCreateNew}
            className={cn(
              "px-6 gap-2 text-white",
              colorClasses.bg.blue,
              'hover:opacity-90',
              getTouchTargetSize('lg')
            )}
          >
            <Plus className="w-4 h-4" />
            Create First Tender
          </Button>
        </div>
      </div>
    </Card>
  );

  // Mobile Filters Modal
  const MobileFilters = () => {
    if (!showMobileFilters) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:hidden">
        <div className={cn(
          "w-full rounded-t-xl p-4 max-h-[80vh] overflow-y-auto",
          colorClasses.bg.primary
        )}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("text-lg font-semibold", colorClasses.text.primary)}>Filter Tenders</h3>
            <button
              onClick={() => setShowMobileFilters(false)}
              className={cn("p-2 rounded-lg", colorClasses.bg.secondary)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={cn("text-sm font-medium mb-2 block", colorClasses.text.primary)}>
                Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'published', 'draft', 'closed'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('status', status)}
                    className={cn(
                      "w-full",
                      statusFilter === status && (colorClasses.bg.blue, colorClasses.text.white)
                    )}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={cn("text-sm font-medium mb-2 block", colorClasses.text.primary)}>
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'freelance', 'professional'].map((category) => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('category', category)}
                    className={cn(
                      "w-full",
                      categoryFilter === category && (colorClasses.bg.blue, colorClasses.text.white)
                    )}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={cn("text-sm font-medium mb-2 block", colorClasses.text.primary)}>
                Workflow
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'open', 'closed'].map((workflow) => (
                  <Button
                    key={workflow}
                    variant={workflowFilter === workflow ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('workflow', workflow)}
                    className={cn(
                      "w-full",
                      workflowFilter === workflow && (colorClasses.bg.blue, colorClasses.text.white)
                    )}
                  >
                    {workflow === 'all' ? 'All' : workflow === 'open' ? 'Open' : 'Sealed'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className={cn("text-sm font-medium mb-2 block", colorClasses.text.primary)}>
                CPO Requirement
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'true', 'false'].map((cpo) => (
                  <Button
                    key={cpo}
                    variant={cpoFilter === cpo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('cpo', cpo)}
                    className={cn(
                      "w-full",
                      cpoFilter === cpo && (colorClasses.bg.blue, colorClasses.text.white)
                    )}
                  >
                    {cpo === 'all' ? 'All' : cpo === 'true' ? 'CPO Required' : 'No CPO'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setShowMobileFilters(false)}
              className={cn("flex-1", colorClasses.bg.blue, colorClasses.text.white)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className={cn("text-xl sm:text-2xl font-bold", colorClasses.text.primary)}>
              Organization Tenders
            </h1>
            <p className={cn("text-sm", colorClasses.text.muted)}>
              Manage institutional procurement processes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className={cn("gap-2", getTouchTargetSize('md'))}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", getTouchTargetSize('md'))}>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className={colorClasses.text.primary}>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator className={colorClasses.border.gray100} />
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
              className={cn(
                "gap-2 text-white flex-1 sm:flex-none",
                colorClasses.bg.blue,
                'hover:opacity-90',
                getTouchTargetSize('lg')
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Tender</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      )}

      {/* Stats Overview - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className={cn(
          "border shadow-sm",
          colorClasses.bg.primary,
          colorClasses.border.gray100
        )}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Total</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.total}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.blueLight)}>
                <Building2 className={cn("w-4 h-4", colorClasses.text.blue)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className={cn("text-xs", colorClasses.bg.blueLight, colorClasses.text.blue)}>
                {stats.freelance} F
              </Badge>
              <Badge variant="outline" className={cn("text-xs", colorClasses.bg.emeraldLight, colorClasses.text.emerald)}>
                {stats.professional} P
              </Badge>
            </div>
          </div>
        </Card>

        <Card className={cn(
          "border shadow-sm",
          colorClasses.bg.primary,
          colorClasses.border.gray100
        )}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Active</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.published}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.emeraldLight)}>
                <TrendingUp className={cn("w-4 h-4", colorClasses.text.emerald)} />
              </div>
            </div>
            <p className={cn("text-xs mt-2", colorClasses.text.muted)}>
              {stats.endingSoon} ending soon
            </p>
          </div>
        </Card>

        <Card className={cn(
          "border shadow-sm",
          colorClasses.bg.primary,
          colorClasses.border.gray100
        )}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>Apps</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.totalApplications}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.purpleLight)}>
                <Users className={cn("w-4 h-4", colorClasses.text.purple)} />
              </div>
            </div>
            <p className={cn("text-xs mt-2", colorClasses.text.muted)}>
              Total
            </p>
          </div>
        </Card>

        <Card className={cn(
          "border shadow-sm",
          colorClasses.bg.primary,
          colorClasses.border.gray100
        )}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs font-medium", colorClasses.text.muted)}>CPO</p>
                <p className={cn("text-lg sm:text-xl font-bold", colorClasses.text.primary)}>
                  {stats.cpoRequired}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", colorClasses.bg.redLight)}>
                <Shield className={cn("w-4 h-4", colorClasses.text.red)} />
              </div>
            </div>
            <p className={cn("text-xs mt-2", colorClasses.text.muted)}>
              Required
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className={cn("rounded-xl border shadow-sm", colorClasses.bg.primary, colorClasses.border.gray100)}>
        <div className={cn("p-3 sm:p-4 border-b", colorClasses.border.gray100)}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              {/* Tabs - Scrollable on mobile */}
              <TabsList className={cn(
                "p-1 overflow-x-auto flex-nowrap w-full sm:w-auto",
                colorClasses.bg.secondary
              )}>
                <TabsTrigger
                  value="all"
                  className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                >
                  All
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="published"
                  className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                >
                  Active
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stats.published}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                >
                  Draft
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stats.draft}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="closed"
                  className="px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                >
                  Closed
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {tenders.filter(t => ['closed', 'cancelled'].includes(t.status)).length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* View Mode Toggle - Hidden on mobile */}
              {!isMobile && !externalViewMode && (
                <div className={cn(
                  "flex items-center border rounded-lg overflow-hidden shrink-0",
                  colorClasses.border.gray100,
                  colorClasses.bg.secondary
                )}>
                  <Button
                    variant={internalViewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setInternalViewMode('grid')}
                    className="rounded-none border-0 px-3 py-2"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={internalViewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setInternalViewMode('list')}
                    className="rounded-none border-0 px-3 py-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {showFilters && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={isMobile ? "Search..." : "Search by title, reference, or description..."}
                      value={searchQuery}
                      onChange={handleSearch}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      className={cn("pl-10 h-10 text-sm", colorClasses.bg.primary, colorClasses.border.gray100)}
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2">
                    {!isMobile && (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={cn("gap-2", getTouchTargetSize('md'))}>
                              <SortAsc className="w-4 h-4" />
                              <span>Sort</span>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className={colorClasses.text.primary}>Sort By</DropdownMenuLabel>
                            <DropdownMenuSeparator className={colorClasses.border.gray100} />
                            {sortOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => {
                                  setSortBy(option.value);
                                  refetch();
                                }}
                                className={sortBy === option.value ? colorClasses.bg.secondary : ""}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={cn("gap-2", getTouchTargetSize('md'))}>
                              <Filter className="w-4 h-4" />
                              <span>Filters</span>
                              {activeFilters.size > 0 && (
                                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                  {activeFilters.size}
                                </Badge>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel className={colorClasses.text.primary}>Filter By</DropdownMenuLabel>
                            <DropdownMenuSeparator className={colorClasses.border.gray100} />
                            <div className="p-2 space-y-3">
                              <div>
                                <label className={cn("text-xs font-medium mb-1 block", colorClasses.text.muted)}>
                                  Category
                                </label>
                                <Select value={categoryFilter} onValueChange={(v) => handleFilterChange('category', v)}>
                                  <SelectTrigger className="h-9">
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
                                <label className={cn("text-xs font-medium mb-1 block", colorClasses.text.muted)}>
                                  Procurement Method
                                </label>
                                <Select value={procurementFilter} onValueChange={(v) => handleFilterChange('procurement', v)}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="All Methods" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="open_tender">Open Tender</SelectItem>
                                    <SelectItem value="restricted">Restricted</SelectItem>
                                    <SelectItem value="direct">Direct</SelectItem>
                                    <SelectItem value="framework">Framework</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className={cn("text-xs font-medium mb-1 block", colorClasses.text.muted)}>
                                  CPO Requirement
                                </label>
                                <Select value={cpoFilter} onValueChange={(v) => handleFilterChange('cpo', v)}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="All" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="true">CPO Required</SelectItem>
                                    <SelectItem value="false">No CPO</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {activeFilters.size > 0 && (
                              <>
                                <DropdownMenuSeparator className={colorClasses.border.gray100} />
                                <DropdownMenuItem onClick={clearAllFilters}>
                                  Clear All Filters
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}

                    {/* Mobile Filter Button */}
                    {isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMobileFilters(true)}
                        className={cn("gap-2", getTouchTargetSize('lg'))}
                      >
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                        {activeFilters.size > 0 && (
                          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                            {activeFilters.size}
                          </Badge>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Active Filters */}
                {activeFilters.size > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={cn("text-xs", colorClasses.text.muted)}>Active:</span>
                    {Array.from(activeFilters).map(filter => {
                      const [type, value] = filter.split(':');
                      const displayValue = type === 'cpo'
                        ? (value === 'true' ? 'CPO Required' : 'No CPO')
                        : value.replace('_', ' ');

                      return (
                        <Badge
                          key={filter}
                          variant="secondary"
                          className={cn(
                            "flex items-center gap-1 py-1 text-xs",
                            colorClasses.bg.secondary,
                            colorClasses.text.primary
                          )}
                        >
                          {displayValue.length > 10 ? displayValue.substring(0, 8) + '...' : displayValue}
                          <button
                            onClick={() => removeFilter(filter)}
                            className={cn("hover:text-red-500", colorClasses.text.muted)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-6 text-xs"
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
        <div className="p-3 sm:p-4">
          {error && (
            <Card className={cn(
              "mb-4 border",
              colorClasses.border.red,
              colorClasses.bg.redLight
            )}>
              <div className="flex flex-col items-center justify-center py-6 px-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", colorClasses.bg.redLight)}>
                  <AlertCircle className={cn("w-5 h-5", colorClasses.text.red)} />
                </div>
                <h3 className={cn("text-base font-semibold mb-1", colorClasses.text.error)}>
                  Error Loading Tenders
                </h3>
                <p className={cn("text-center mb-3 text-sm", colorClasses.text.muted)}>
                  {error.message}
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className={cn(
              "grid gap-3 sm:gap-4",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
            )}>
              {[...Array(initialFilters.limit || 12)].map((_, i) => (
                <OrganizationOwnerTenderCardSkeleton key={i} />
              ))}
            </div>
          ) : tenders.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className={cn(
                "grid gap-3 sm:gap-4",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                {tenders.map((tender) => (
                  <OrganizationOwnerTenderCard
                    key={tender._id}
                    tender={tender}
                    className={viewMode === 'list' ? "max-w-4xl mx-auto" : ""}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className={cn("mt-4 sm:mt-6 pt-3 sm:pt-4 border-t", colorClasses.border.gray100)}>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className={cn("text-xs sm:text-sm order-2 sm:order-1", colorClasses.text.muted)}>
                      Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={cn("h-8 w-16 sm:h-9 sm:w-20", getTouchTargetSize('sm'))}
                      >
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Prev</span>
                      </Button>

                      {/* Desktop Page Numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={cn(
                                "h-8 w-8 p-0",
                                currentPage === pageNum
                                  ? cn(colorClasses.bg.blue, colorClasses.text.white)
                                  : ""
                              )}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}

                        {pagination.pages > 5 && (
                          <>
                            <span className={cn("px-2", colorClasses.text.muted)}>...</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(pagination.pages)}
                              className="h-8 w-8 p-0"
                            >
                              {pagination.pages}
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Mobile Page Indicator */}
                      <div className="sm:hidden px-2">
                        <span className={cn("text-sm", colorClasses.text.primary)}>{currentPage}</span>
                        <span className={cn("text-sm mx-1", colorClasses.text.muted)}>/</span>
                        <span className={cn("text-sm", colorClasses.text.muted)}>{pagination.pages}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className={cn("h-8 w-16 sm:h-9 sm:w-20", getTouchTargetSize('sm'))}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <MobileFilters />
    </div>
  );
};