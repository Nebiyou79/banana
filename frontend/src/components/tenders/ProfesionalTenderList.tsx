/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders/professional/ProfessionalTenderList.tsx
import React, { useState } from 'react';
import { useTenders } from '@/hooks/useTenders';
import { TenderFilter } from '@/services/tenderService';
import ProfessionalTenderCard from './ProfesionalTenderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  X,
  TrendingUp,
  Scale,
  Globe
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/social/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';

const ProfessionalTenderList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);
  
  const {
    tenders,
    isLoading,
    error,
    filters,
    updateFilters,
    pagination,
    setPage,
    setLimit
  } = useTenders({ 
    tenderCategory: 'professional',
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const handleClearFilters = () => {
    updateFilters({
      search: undefined,
      workflowType: undefined,
      procurementMethod: undefined,
      visibilityType: undefined,
      cpoRequired: undefined,
      dateFrom: undefined,
      dateTo: undefined
    });
  };

  const handleCPOFilter = (value: boolean | undefined) => {
    updateFilters({ cpoRequired: value });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({ status: status === 'all' ? undefined : status });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.search || 
      filters.workflowType || 
      filters.procurementMethod || 
      filters.visibilityType ||
      filters.cpoRequired !== undefined ||
      filters.dateFrom ||
      filters.dateTo
    );
  };

  // Calculate stats
  const stats = {
    total: pagination.total,
    openBids: tenders.filter(t => t.workflowType === 'open').length,
    cpoRequired: tenders.filter(t => t.professionalSpecific?.cpoRequired).length,
    urgent: tenders.filter(t => 
      new Date(t.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
    ).length,
    sealedBids: tenders.filter(t => t.workflowType === 'closed').length,
    avgProposals: Math.round(
      tenders.reduce((sum, t) => sum + (t.metadata?.totalApplications || 0), 0) / tenders.length || 0
    ),
    avgViews: Math.round(
      tenders.reduce((sum, t) => sum + (t.metadata?.views || 0), 0) / tenders.length || 0
    ),
    mostCommonMethod: (() => {
      const methods = tenders.map(t => t.professionalSpecific?.procurementMethod).filter(Boolean);
      const counts: Record<string, number> = {};
      methods.forEach(m => counts[m!] = (counts[m!] || 0) + 1);
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return mostCommon ? mostCommon[0].replace('_', ' ') : 'Open Tender';
    })()
  };

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <AlertDescription className="text-red-800 dark:text-red-300">
          Error loading tenders: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
        
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        
        {/* Skeleton Grid */}
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className={`${viewMode === 'grid' ? 'h-[450px]' : 'h-[250px]'} rounded-xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tenders.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6">
          <Search className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {hasActiveFilters() ? 'No Matching Tenders Found' : 'No Procurement Opportunities Available'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-8">
          {hasActiveFilters() 
            ? 'Try adjusting your filters or check back later for new opportunities.'
            : 'There are currently no professional tenders available. New opportunities are added regularly.'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {hasActiveFilters() ? (
            <>
              <Button
                onClick={handleClearFilters}
                variant="default"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
              <Button
                onClick={() => setShowFilters(true)}
                variant="outline"
                className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Filter className="h-4 w-4 mr-2" />
                Adjust Filters
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                Subscribe to Notifications
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Procurement Tenders</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Professional bidding opportunities for registered companies
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="show-stats" 
                checked={showStats}
                onCheckedChange={setShowStats}
              />
              <Label htmlFor="show-stats" className="text-sm text-gray-600 dark:text-gray-400">
                Show Stats
              </Label>
            </div>
            
            <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-200 dark:border-gray-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
            {hasActiveFilters() && (
              <Badge className="ml-2 h-5 w-5 p-0 bg-blue-600 text-white">
                {Object.keys(filters).filter(k => filters[k as keyof TenderFilter] !== undefined).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  <Search className="h-4 w-4 inline mr-2" />
                  Search Tenders
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by title, reference, or entity..."
                    value={filters.search || ''}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              {/* Procurement Method & Workflow */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Procurement Method
                  </Label>
                  <Select
                    value={filters.procurementMethod || 'all'}
                    onValueChange={(value) => updateFilters({ 
                      procurementMethod: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Bid Type
                  </Label>
                  <Select
                    value={filters.workflowType || 'all'}
                    onValueChange={(value) => updateFilters({ 
                      workflowType: value === 'all' ? undefined : value as any 
                    })}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bid Types</SelectItem>
                      <SelectItem value="open">Open Bid</SelectItem>
                      <SelectItem value="closed">Sealed Bid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Visibility & CPO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Visibility
                  </Label>
                  <Select
                    value={filters.visibilityType || 'all'}
                    onValueChange={(value) => updateFilters({ 
                      visibilityType: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
                      <SelectValue placeholder="All Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visibility</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="companies_only">Companies Only</SelectItem>
                      <SelectItem value="invite_only">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    CPO Requirement
                  </Label>
                  <Select
                    value={filters.cpoRequired === undefined ? 'all' : filters.cpoRequired ? 'required' : 'not_required'}
                    onValueChange={(value) => {
                      if (value === 'all') handleCPOFilter(undefined);
                      else if (value === 'required') handleCPOFilter(true);
                      else handleCPOFilter(false);
                    }}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
                      <SelectValue placeholder="CPO Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenders</SelectItem>
                      <SelectItem value="required">CPO Required</SelectItem>
                      <SelectItem value="not_required">No CPO Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status Filter</Label>
                <Tabs 
                  value={filters.status || 'published'} 
                  onValueChange={handleStatusFilter}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="published" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="deadline_reached" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                      Expired
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Results & Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Items per page</Label>
                  <Select
                    value={filters.limit?.toString() || '12'}
                    onValueChange={(value) => setLimit(Number(value))}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 per page</SelectItem>
                      <SelectItem value="12">12 per page</SelectItem>
                      <SelectItem value="24">24 per page</SelectItem>
                      <SelectItem value="48">48 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort by</Label>
                  <Select
                    value={filters.sortBy || 'createdAt'}
                    onValueChange={(value) => updateFilters({ sortBy: value })}
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Posted</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="metadata.views">Most Viewed</SelectItem>
                      <SelectItem value="metadata.totalApplications">Most Bids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters() && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Active Filters</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        Search: `{filters.search}`
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => updateFilters({ search: undefined })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.procurementMethod && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.procurementMethod.replace('_', ' ')}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => updateFilters({ procurementMethod: undefined })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.workflowType && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.workflowType === 'open' ? 'Open Bid' : 'Sealed Bid'}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => updateFilters({ workflowType: undefined })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.visibilityType && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.visibilityType.replace('_', ' ')}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => updateFilters({ visibilityType: undefined })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.cpoRequired !== undefined && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.cpoRequired ? 'CPO Required' : 'No CPO'}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2"
                          onClick={() => updateFilters({ cpoRequired: undefined })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {stats.openBids} open • {stats.sealedBids} sealed
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPO Required</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.cpoRequired}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {Math.round((stats.cpoRequired / stats.total) * 100) || 0}% of tenders
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent Tenders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.urgent}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Ends within 3 days
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Proposals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgProposals}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {stats.avgViews} avg. views per tender
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="md:col-span-2 lg:col-span-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.mostCommonMethod}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Most Common Method</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {tenders.filter(t => t.visibility.visibilityType === 'public').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Public Tenders</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {tenders.filter(t => t.visibility.visibilityType === 'invite_only').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Invite Only</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {new Set(tenders.map(t => t.ownerEntity._id)).size}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Unique Entities</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tender Grid/List */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid grid-cols-1'
        } 
        gap-6
      `}>
        {tenders.map((tender) => (
          <ProfessionalTenderCard key={tender._id} tender={tender} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="border-gray-300 dark:border-gray-600"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
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
                
                if (pageNum > pagination.pages || pageNum < 1) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`
                      h-8 w-8 p-0
                      ${pagination.page === pageNum 
                        ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' 
                        : 'border-gray-300 dark:border-gray-600'
                      }
                    `}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {pagination.pages > 5 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.pages)}
                    className={`
                      h-8 w-8 p-0
                      ${pagination.page === pagination.pages 
                        ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' 
                        : 'border-gray-300 dark:border-gray-600'
                      }
                    `}
                  >
                    {pagination.pages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="border-gray-300 dark:border-gray-600"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalTenderList;