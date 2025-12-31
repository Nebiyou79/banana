/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard/organization/tenders/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OrganizationOwnerTenderList } from '@/components/tenders/OrganizationOwnerTenderList';
import { TenderFilter } from '@/services/tenderService';
import { useToast } from '@/hooks/use-toast';
import { useOwnedTenders } from '@/hooks/useTenders';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Plus, 
  BarChart3, 
  Download, 
  Filter, 
  Grid3x3, 
  List as ListIcon,
  Building2,
  ShieldCheck,
  Users,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const OrganizationTendersPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Convert URL query params to filters
  const getInitialFilters = (): TenderFilter => {
    const query = router.query;
    return {
      page: query.page ? parseInt(query.page as string) : 1,
      limit: query.limit ? parseInt(query.limit as string) : 12,
      status: query.status as string || undefined,
      tenderCategory: query.tenderCategory as any,
      workflowType: query.workflowType as any,
      procurementMethod: query.procurementMethod as string,
      search: query.search as string,
      sortBy: query.sortBy as string || 'createdAt',
      sortOrder: query.sortOrder as 'asc' | 'desc' || 'desc',
      cpoRequired: query.cpoRequired === 'true',
    };
  };

  const [filters, setFilters] = useState<TenderFilter>(getInitialFilters());

  // Fetch owned tenders using useOwnedTenders hook
  const { tenders, pagination, isLoading: isLoadingOwnedTenders, error, refetch } = useOwnedTenders({
    page: filters.page || 1,
    limit: filters.limit || 12,
    status: filters.status,
    tenderCategory: filters.tenderCategory,
    workflowType: filters.workflowType,
    //search: filters.search,
    // sortBy: filters.sortBy,
    // sortOrder: filters.sortOrder,
  });

  // Calculate stats from fetched data
  const stats = useMemo(() => {
    const published = tenders.filter(t => t.status === 'published').length;
    const draft = tenders.filter(t => t.status === 'draft').length;
    const closed = tenders.filter(t => 
      ['closed', 'cancelled', 'deadline_reached', 'revealed'].includes(t.status)
    ).length;
    const freelance = tenders.filter(t => t.tenderCategory === 'freelance').length;
    const professional = tenders.filter(t => t.tenderCategory === 'professional').length;
    
    // Calculate total applications
    const totalApplications = tenders.reduce((acc, tender) => {
      return acc + (tender.metadata?.totalApplications || 0);
    }, 0);
    
    // Calculate average budget
    let totalBudget = 0;
    let budgetCount = 0;
    
    tenders.forEach(tender => {
      if (tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget?.max) {
        totalBudget += tender.freelanceSpecific.budget.max;
        budgetCount++;
      } else if (tender.tenderCategory === 'professional' && tender.professionalSpecific?.financialCapacity?.minAnnualTurnover) {
        totalBudget += tender.professionalSpecific.financialCapacity.minAnnualTurnover;
        budgetCount++;
      }
    });
    
    const avgBudget = budgetCount > 0 ? totalBudget / budgetCount : 0;
    
    return {
      total: tenders.length,
      published,
      draft,
      closed,
      freelance,
      professional,
      totalApplications,
      avgBudget,
    };
  }, [tenders]);

  // Update filters when URL changes
  useEffect(() => {
    setFilters(getInitialFilters());
  }, [router.query]);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<TenderFilter>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    
    // Update URL query params
    const query: any = {};
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query[key] = value;
      }
    });
    
    router.push({
      pathname: router.pathname,
      query,
    }, undefined, { shallow: true });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      updateFilters({ status: undefined });
    } else if (value === 'closed') {
      // For closed tab, we'll handle filtering in the component
      updateFilters({ status: 'closed' });
    } else {
      updateFilters({ status: value });
    }
  };

  // Handle create new tender
  const handleCreateTender = () => {
    router.push('/dashboard/organization/tenders/create');
  };

  // Handle export
  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your tenders are being exported. You will receive a notification when ready.',
    });
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing',
      description: 'Tenders data is being refreshed...',
    });
  };

  // Handle error
  if (error) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
                  Error Loading Tenders
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {error.message || 'Failed to load your tenders. Please try again.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={handleCreateTender}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Create New Tender
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Loading skeleton for stats
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Head>
        <title>Organization Tenders | Procurement Platform</title>
        <meta name="description" content="Manage your organization's tenders and procurement processes" />
      </Head>

      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Organization Tenders
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage procurement processes and evaluate proposals
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="gap-2"
                    disabled={isLoadingOwnedTenders}
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoadingOwnedTenders && "animate-spin")} />
                    Refresh
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ ...filters })}
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>

                  <Button
                    onClick={handleCreateTender}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    disabled={isLoadingOwnedTenders}
                  >
                    <Plus className="w-4 h-4" />
                    Create Tender
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {isLoadingOwnedTenders ? (
              <StatsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenders</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {stats.total}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <Badge variant="outline" className="mr-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                        {stats.freelance} Freelance
                      </Badge>
                      <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300">
                        {stats.professional} Professional
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tenders</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {stats.published}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      {stats.draft} in draft • {stats.closed} closed
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {stats.totalApplications}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      Across all tenders
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Budget</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          ${(stats.avgBudget / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      Average tender value
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Area with Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              {/* Tabs Header */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 w-full sm:w-auto">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
                      disabled={isLoadingOwnedTenders}
                    >
                      All Tenders
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {stats.total}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="published" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
                      disabled={isLoadingOwnedTenders}
                    >
                      Active
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {stats.published}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="draft" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
                      disabled={isLoadingOwnedTenders}
                    >
                      Draft
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {stats.draft}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="closed" 
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
                      disabled={isLoadingOwnedTenders}
                    >
                      Closed
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {stats.closed}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                      View:
                    </span>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "rounded-md",
                          viewMode === 'grid' 
                            ? "bg-white dark:bg-gray-900 shadow-sm" 
                            : "text-gray-500 dark:text-gray-400"
                        )}
                        disabled={isLoadingOwnedTenders}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "rounded-md",
                          viewMode === 'list' 
                            ? "bg-white dark:bg-gray-900 shadow-sm" 
                            : "text-gray-500 dark:text-gray-400"
                        )}
                        disabled={isLoadingOwnedTenders}
                      >
                        <ListIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Search and Quick Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by title, reference number, or description..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      value={filters.search || ''}
                      onChange={(e) => updateFilters({ search: e.target.value || undefined })}
                      disabled={isLoadingOwnedTenders}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilters({ tenderCategory: 'freelance' })}
                      className={cn(
                        filters.tenderCategory === 'freelance' 
                          ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                          : '',
                        isLoadingOwnedTenders && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={isLoadingOwnedTenders}
                    >
                      Freelance
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilters({ tenderCategory: 'professional' })}
                      className={cn(
                        filters.tenderCategory === 'professional' 
                          ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400' 
                          : '',
                        isLoadingOwnedTenders && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={isLoadingOwnedTenders}
                    >
                      Professional
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFilters({ cpoRequired: true })}
                      className={cn(
                        filters.cpoRequired 
                          ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' 
                          : '',
                        isLoadingOwnedTenders && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={isLoadingOwnedTenders}
                    >
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      CPO Required
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tab Content: All Tenders */}
              <TabsContent value="all" className="space-y-6">
                {isLoadingOwnedTenders ? (
                  <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <Skeleton className="h-6 w-20" />
                              <Skeleton className="h-6 w-16" />
                            </div>
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <div className="space-y-2 pt-4">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : stats.total === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Tenders Yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                        Start by creating your first tender. You can create freelance projects or professional procurement tenders.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => router.push('/dashboard/organization/tenders/create?category=freelance')}
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          Create Freelance Tender
                        </Button>
                        <Button
                          onClick={() => router.push('/dashboard/organization/tenders/create?category=professional')}
                          variant="outline"
                          className="border-teal-500 text-teal-600 hover:bg-teal-50 dark:border-teal-600 dark:text-teal-400 dark:hover:bg-teal-900/20"
                        >
                          Create Professional Tender
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'list' ? 'space-y-6' : ''}>
                    <OrganizationOwnerTenderList
                      initialFilters={filters}
                      showFilters={false}
                      showHeader={false}
                      viewMode={viewMode}
                      // useOwnedTenders={true} // Add this prop
                    />
                  </div>
                )}
              </TabsContent>

              {/* Tab Content: Active Tenders */}
              <TabsContent value="published" className="space-y-6">
                {isLoadingOwnedTenders ? (
                  <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : stats.published === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Active Tenders
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                        You don`t have any published tenders. Publish your draft tenders to make them visible.
                      </p>
                      <Button
                        onClick={() => setActiveTab('draft')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        View Draft Tenders
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'list' ? 'space-y-6' : ''}>
                    <OrganizationOwnerTenderList
                      initialFilters={{ ...filters, status: 'published' }}
                      showFilters={false}
                      showHeader={false}
                      viewMode={viewMode}
                      // useOwnedTenders={true} // Add this prop
                    />
                  </div>
                )}
              </TabsContent>

              {/* Tab Content: Draft Tenders */}
              <TabsContent value="draft" className="space-y-6">
                {isLoadingOwnedTenders ? (
                  <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : stats.draft === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Draft Tenders
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                        You don`t have any tenders in draft. Create a new tender or check your published tenders.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={handleCreateTender}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Create New Tender
                        </Button>
                        <Button
                          onClick={() => setActiveTab('published')}
                          variant="outline"
                        >
                          View Active Tenders
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'list' ? 'space-y-6' : ''}>
                    <OrganizationOwnerTenderList
                      initialFilters={{ ...filters, status: 'draft' }}
                      showFilters={false}
                      showHeader={false}
                      viewMode={viewMode}
                      // useOwnedTenders={true} // Add this prop
                    />
                  </div>
                )}
              </TabsContent>

              {/* Tab Content: Closed Tenders */}
              <TabsContent value="closed" className="space-y-6">
                {isLoadingOwnedTenders ? (
                  <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : stats.closed === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Closed Tenders
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                        You don`t have any closed tenders. Tenders are automatically closed when they reach their deadline.
                      </p>
                      <Button
                        onClick={() => setActiveTab('published')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        View Active Tenders
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={viewMode === 'list' ? 'space-y-6' : ''}>
                    <OrganizationOwnerTenderList
                      initialFilters={{ ...filters, status: 'closed' }}
                      showFilters={false}
                      showHeader={false}
                      viewMode={viewMode}
                      // useOwnedTenders={true} // Add this prop
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default OrganizationTendersPage;