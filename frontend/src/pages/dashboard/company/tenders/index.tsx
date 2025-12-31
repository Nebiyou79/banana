/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenderFilters } from '@/components/tenders/TenderFilters';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/use-toast';
import { useTenders, useTenderUtils } from '@/hooks/useTenders';
import { TenderFilter } from '@/services/tenderService';
import {
  Search,
  Bell,
  Download,
  RefreshCw,
  Building2,
  AlertTriangle,
  Banknote,
  FileText,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Eye,
  Star,
  Filter,
  Grid3x3,
  List,
  Plus,
  TrendingUp,
  Calendar,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import ProfessionalTenderCard from '@/components/tenders/ProfesionalTenderCard';

export default function CompanyBrowseTendersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = useTenderUtils();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [savedSearches, setSavedSearches] = useState<Array<{
    id: string;
    name: string;
    filters: Partial<TenderFilter>;
  }>>([]);
  
  // Initial filters for professional tenders
  const initialFilters: TenderFilter = {
    page: 1,
    limit: 12,
    tenderCategory: 'professional',
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const {
    tenders,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    setPage,
    setLimit,
  } = useTenders(initialFilters);
  
  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value });
  };
  
  const handleResetFilters = () => {
    updateFilters(initialFilters);
    setSearchQuery('');
  };
  
  // Handle save search
  const handleSaveSearch = () => {
    const searchName = `Search ${savedSearches.length + 1}`;
    const newSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters, page: 1 },
    };
    
    setSavedSearches(prev => [...prev, newSearch]);
    toast({
      title: 'Search Saved',
      description: `"${searchName}" has been saved to your profile`,
      variant: 'success',
    });
  };
  
  // Handle load saved search
  const handleLoadSavedSearch = (savedFilters: Partial<TenderFilter>) => {
    updateFilters({ ...filters, ...savedFilters, page: 1 });
  };
  
  // Handle set email alert
  const handleSetAlert = () => {
    toast({
      title: 'Alert Set',
      description: 'You will receive notifications for new matching tenders',
      variant: 'success',
    });
  };
  
  // Handle export tenders
  const handleExportTenders = () => {
    toast({
      title: 'Export Started',
      description: 'Your tender data is being prepared for download',
      variant: 'success',
    });
  };
  
  // Handle view tender
  const handleViewTender = (id: string) => {
    router.push(`/dashboard/company/tenders/${id}`);
  };
  
  // Handle apply to tender
  const handleApply = (id: string) => {
    router.push(`/dashboard/company/tenders/${id}/apply`);
  };
  
  // Calculate stats
  const stats = {
    total: pagination?.total || 0,
    cpoRequired: tenders.filter(t => t.professionalSpecific?.cpoRequired).length,
    urgent: tenders.filter(t => 
      new Date(t.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
    ).length,
    avgProposals: Math.round(
      tenders.reduce((sum, t) => sum + (t.metadata?.totalApplications || 0), 0) / (tenders.length || 1) || 0
    ),
    openBids: tenders.filter(t => t.workflowType === 'open').length,
    sealedBids: tenders.filter(t => t.workflowType === 'closed').length,
    avgViews: Math.round(
      tenders.reduce((sum, t) => sum + (t.metadata?.views || 0), 0) / (tenders.length || 1) || 0
    ),
    mostCommonMethod: (() => {
      const methods = tenders.map(t => t.professionalSpecific?.procurementMethod).filter(Boolean);
      const counts: Record<string, number> = {};
      methods.forEach(m => counts[m!] = (counts[m!] || 0) + 1);
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return mostCommon ? mostCommon[0].replace('_', ' ') : 'Open Tender';
    })()
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    const ignoreKeys = ['page', 'limit', 'status', 'sortBy', 'sortOrder'];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (!ignoreKeys.includes(key) && value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) count++;
        } else if (typeof value === 'object') {
          if (Object.keys(value).length > 0) count++;
        } else {
          count++;
        }
      }
    });
    
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Handle filter changes for ProfessionalTenderList
  const handleFilterChange = (newFilters: TenderFilter) => {
    updateFilters(newFilters);
  };

  const handleCPOFilter = (value: boolean | undefined) => {
    updateFilters({ cpoRequired: value });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({ status: status === 'all' ? undefined : status });
  };

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

  // Custom ProfessionalTenderList with enhanced controls
  const CustomProfessionalTenderList = () => (
    <div className="space-y-6">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Procurement Tenders</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Professional bidding opportunities for registered companies
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600 dark:text-slate-400">View:</div>
              <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-slate-700 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400'
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
                      ? 'bg-white dark:bg-slate-700 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-300 dark:border-slate-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
              {hasActiveFilters() && (
                <Badge className="ml-2 h-5 w-5 p-0 bg-blue-600 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tenders</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {stats.openBids} open • {stats.sealedBids} sealed
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">CPO Required</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.cpoRequired}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {Math.round((stats.cpoRequired / stats.total) * 100) || 0}% of tenders
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Urgent Tenders</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.urgent}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Ends within 3 days
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Proposals</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.avgProposals}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {stats.avgViews} avg. views per tender
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Tenders
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by title, reference, or entity..."
                    value={filters.search || ''}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="pl-10 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Procurement Method & Workflow */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Procurement Method
                  </div>
                  <select
                    value={filters.procurementMethod || 'all'}
                    onChange={(e) => updateFilters({ 
                      procurementMethod: e.target.value === 'all' ? undefined : e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Methods</option>
                    <option value="open_tender">Open Tender</option>
                    <option value="restricted">Restricted</option>
                    <option value="direct">Direct</option>
                    <option value="framework">Framework</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Bid Type
                  </div>
                  <select
                    value={filters.workflowType || 'all'}
                    onChange={(e) => updateFilters({ 
                      workflowType: e.target.value === 'all' ? undefined : e.target.value as any 
                    })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Bid Types</option>
                    <option value="open">Open Bid</option>
                    <option value="closed">Sealed Bid</option>
                  </select>
                </div>
              </div>

              {/* Visibility & CPO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Visibility
                  </div>
                  <select
                    value={filters.visibilityType || 'all'}
                    onChange={(e) => updateFilters({ 
                      visibilityType: e.target.value === 'all' ? undefined : e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Visibility</option>
                    <option value="public">Public</option>
                    <option value="companies_only">Companies Only</option>
                    <option value="invite_only">Invite Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    CPO Requirement
                  </div>
                  <select
                    value={filters.cpoRequired === undefined ? 'all' : filters.cpoRequired ? 'required' : 'not_required'}
                    onChange={(e) => {
                      if (e.target.value === 'all') handleCPOFilter(undefined);
                      else if (e.target.value === 'required') handleCPOFilter(true);
                      else handleCPOFilter(false);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all">All Tenders</option>
                    <option value="required">CPO Required</option>
                    <option value="not_required">No CPO Required</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Results & Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Items per page</div>
                  <select
                    value={filters.limit?.toString() || '12'}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="6">6 per page</option>
                    <option value="12">12 per page</option>
                    <option value="24">24 per page</option>
                    <option value="48">48 per page</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Sort by</div>
                  <select
                    value={filters.sortBy || 'createdAt'}
                    onChange={(e) => updateFilters({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="createdAt">Date Posted</option>
                    <option value="deadline">Deadline</option>
                    <option value="metadata.views">Most Viewed</option>
                    <option value="metadata.totalApplications">Most Bids</option>
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters() && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Active Filters</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        Search: `{filters.search}`
                        <button
                          onClick={() => updateFilters({ search: undefined })}
                          className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.procurementMethod && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.procurementMethod.replace('_', ' ')}
                        <button
                          onClick={() => updateFilters({ procurementMethod: undefined })}
                          className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.workflowType && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.workflowType === 'open' ? 'Open Bid' : 'Sealed Bid'}
                        <button
                          onClick={() => updateFilters({ workflowType: undefined })}
                          className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.cpoRequired !== undefined && (
                      <Badge variant="secondary" className="pl-3 pr-1 py-1">
                        {filters.cpoRequired ? 'CPO Required' : 'No CPO'}
                        <button
                          onClick={() => updateFilters({ cpoRequired: undefined })}
                          className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
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

      {/* Empty State */}
      {tenders.length === 0 && !isLoading && (
        <div className="text-center py-16 px-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6">
            <Search className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {hasActiveFilters() ? 'No Matching Tenders Found' : 'No Procurement Opportunities Available'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
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
                  onClick={() => refetch()}
                  variant="default"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe to Notifications
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
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
              className="border-slate-300 dark:border-slate-600"
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
                        : 'border-slate-300 dark:border-slate-600'
                      }
                    `}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {pagination.pages > 5 && (
                <>
                  <span className="px-2 text-slate-500">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.pages)}
                    className={`
                      h-8 w-8 p-0
                      ${pagination.page === pagination.pages 
                        ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' 
                        : 'border-slate-300 dark:border-slate-600'
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
              className="border-slate-300 dark:border-slate-600"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout requiredRole="company">
      <Head>
        <title>Browse Professional Tenders | Company Dashboard</title>
        <meta name="description" content="Browse and apply to professional tenders" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-300 bg-clip-text text-transparent">
                      Professional Tenders
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      Browse and apply to exclusive procurement opportunities
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stats.total} Opportunities
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <Banknote className="h-3 w-3 mr-1" />
                    {stats.cpoRequired} Require CPO
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <Zap className="h-3 w-3 mr-1" />
                    {stats.urgent} Urgent
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveSearch}
                  variant="outline"
                  className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
                <Button
                  onClick={handleSetAlert}
                  variant="outline"
                  className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Set Alert
                </Button>
                <Button
                  onClick={handleExportTenders}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export List
                </Button>
              </div>
            </div>
          </div>
          
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="mb-6">
              <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                        <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Saved Searches</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Quickly access your frequently used filters</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map((search) => (
                        <Button
                          key={search.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadSavedSearch(search.filters)}
                          className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          {search.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Main Content */}
          {error ? (
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Error Loading Tenders
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                    {error.message || 'Failed to load tenders. Please check your connection and try again.'}
                  </p>
                  <Button
                    onClick={() => refetch()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CustomProfessionalTenderList />
          )}
          
          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      View My Applications
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Track submitted proposals and their status
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600 transition-all duration-300">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Deadline Approaching
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {stats.urgent} tenders ending within 3 days
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto group-hover:text-amber-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                    <Banknote className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      CPO Management
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Upload and manage Certified Payment Orders
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}