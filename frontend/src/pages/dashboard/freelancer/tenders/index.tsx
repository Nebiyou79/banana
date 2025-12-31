/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelance/tenders/index.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FreelanceTenderList from '@/components/tenders/FreelanceTenderList';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Bookmark,
  RefreshCw,
  DollarSign,
  Target,
  Users,
  Award,
  Briefcase,
  Grid,
  List,
} from 'lucide-react';
import { 
  useTenders, 
  useSavedTenders, 
  useToggleSaveTender, 
  useTenderViewMode,
  useTenderSorting 
} from '@/hooks/useTenders';
import { TenderFilter, Tender } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { sortTenders } from '@/services/tenderService';

export default function FreelanceTendersPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Main filters state
  const [filters, setFilters] = useState<TenderFilter>({
    page: 1,
    limit: 12,
    tenderCategory: 'freelance',
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    cpoRequired: false,
  });

  // Use the actual useTenders hook
  const {
    tenders,
    pagination,
    updateFilters,
    setPage,
    refetch,
  } = useTenders(filters);

  const { data: savedTendersData } = useSavedTenders();
  const { mutate: toggleSave } = useToggleSaveTender();
  const viewMode = useTenderViewMode('freelance');

  const savedTenders = savedTendersData || [];
  const savedTenderIds = new Set(savedTenders.map(t => t._id));
  const [activeTab, setActiveTab] = useState('recommended');

  // User data
  const userSkills = user?.skills || ['React', 'TypeScript', 'Next.js', 'Node.js', 'UI/UX'];
  const hourlyRate = user?.hourlyRate || 50;

  // Handle filter updates
  const handleApplyFilter = (newFilters: Partial<TenderFilter>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    updateFilters(updated);
  };

  const handleResetFilters = () => {
    const resetFilters: TenderFilter = {
      page: 1,
      limit: 12,
      tenderCategory: 'freelance',
      status: 'published',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      cpoRequired: false,
      search: '',
      engagementType: undefined,
      experienceLevel: undefined,
      projectType: undefined,
      minBudget: undefined,
      maxBudget: undefined,
      skills: undefined,
      procurementCategory: undefined,
      workflowType: undefined,
      urgency: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    };
    setFilters(resetFilters);
    updateFilters(resetFilters);
  };

  // Filter tenders based on active tab
  const getFilteredTenders = () => {
    let filtered = tenders;
    
    switch (activeTab) {
      case 'recommended':
        filtered = tenders.filter(t =>
          t.skillsRequired?.some(skill =>
            userSkills.some(userSkill =>
              userSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(userSkill.toLowerCase())
            )
          )
        );
        break;
      case 'urgent':
        filtered = tenders.filter(t => t.freelanceSpecific?.urgency === 'urgent');
        break;
      case 'highPaying':
        filtered = tenders.filter(t =>
          t.freelanceSpecific?.budget?.max &&
          t.freelanceSpecific.budget.max > hourlyRate * 40
        );
        break;
      case 'saved':
        filtered = tenders.filter(t => savedTenderIds.has(t._id));
        break;
      default:
        filtered = tenders;
    }
    
    // Apply current filters to the filtered list
    return sortTenders(filtered, filters.sortBy || 'createdAt', filters.sortOrder || 'desc');
  };

  const filteredTenders = getFilteredTenders();

  // Format budget for display
  const formatBudgetRange = (tender: any) => {
    if (!tender.freelanceSpecific?.budget) return 'Negotiable';
    const { budget } = tender.freelanceSpecific;
    return `${budget.currency} ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
  };

  // Get deadline text
  const getDeadlineText = (deadline: Date) => {
    const now = new Date();
    const daysRemaining = Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return 'Tomorrow';
    if (daysRemaining < 7) return `${daysRemaining} days`;
    if (daysRemaining < 30) return `${Math.floor(daysRemaining / 7)} weeks`;
    return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    viewMode.updateViewMode({ type: mode });
  };

  return (
    <>
      <Head>
        <title>Find Projects | Freelance Dashboard</title>
        <meta name="description" content="Browse and apply to freelance projects matching your skills" />
      </Head>

      <DashboardLayout requiredRole="freelancer">
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Browse Freelance Projects
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Discover opportunities that match your skills and expertise
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 p-1">
                    <Button
                      variant={viewMode.isGridView ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('grid')}
                      className={cn(
                        "h-8 px-3",
                        viewMode.isGridView 
                          ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button
                      variant={viewMode.isListView ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('list')}
                      className={cn(
                        "h-8 px-3",
                        viewMode.isListView 
                          ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white" 
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                    <Users className="h-3 w-3 mr-1.5" />
                    {filteredTenders.length} projects
                  </Badge>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {tenders.length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Available
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {tenders.filter(t => t.freelanceSpecific?.urgency === 'urgent').length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Urgent
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          ${hourlyRate}/hr
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Your Rate
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {savedTenders.length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Saved
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Bookmark className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6 bg-slate-100 dark:bg-slate-900 p-1">
                <TabsTrigger 
                  value="recommended" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Recommended
                  {activeTab === 'recommended' && filteredTenders.length > 0 && (
                    <Badge className="ml-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                      {filteredTenders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="urgent" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Urgent
                  {tenders.filter(t => t.freelanceSpecific?.urgency === 'urgent').length > 0 && (
                    <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      {tenders.filter(t => t.freelanceSpecific?.urgency === 'urgent').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="highPaying" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  High Paying
                </TabsTrigger>
                <TabsTrigger 
                  value="saved" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved
                  {savedTenders.length > 0 && (
                    <Badge className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {savedTenders.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="mt-0">
                {filteredTenders.length > 0 ? (
                  <FreelanceTenderList 
                    viewMode={viewMode.viewMode.type}
                    onViewModeChange={handleViewModeChange}
                    tenders={filteredTenders}
                    filters={filters}
                    onFilterChange={handleApplyFilter}
                    pagination={pagination}
                    onPageChange={setPage}
                    showFilters={true}
                  />
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <Target className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No Recommended Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        We couldn`t find any projects matching your skills and preferences. Try adjusting your filters.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        className="border-slate-300 dark:border-slate-700"
                      >
                        Reset Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="urgent" className="mt-0">
                {filteredTenders.length > 0 ? (
                  <FreelanceTenderList 
                    viewMode={viewMode.viewMode.type}
                    onViewModeChange={handleViewModeChange}
                    tenders={filteredTenders}
                    filters={filters}
                    onFilterChange={handleApplyFilter}
                    pagination={pagination}
                    onPageChange={setPage}
                    showFilters={false}
                  />
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <Zap className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No Urgent Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        There are currently no urgent projects available. Check back later or browse other categories.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('recommended')}
                        className="border-slate-300 dark:border-slate-700"
                      >
                        Browse All Projects
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="highPaying" className="mt-0">
                {filteredTenders.length > 0 ? (
                  <FreelanceTenderList 
                    viewMode={viewMode.viewMode.type}
                    onViewModeChange={handleViewModeChange}
                    tenders={filteredTenders}
                    filters={filters}
                    onFilterChange={handleApplyFilter}
                    pagination={pagination}
                    onPageChange={setPage}
                    showFilters={false}
                  />
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No High Paying Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        No high budget projects match your current filters. Try adjusting your budget range.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleApplyFilter({ minBudget: 5000 });
                          setActiveTab('recommended');
                        }}
                        className="border-slate-300 dark:border-slate-700"
                      >
                        Show All High Budget
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-0">
                {filteredTenders.length > 0 ? (
                  <FreelanceTenderList 
                    viewMode={viewMode.viewMode.type}
                    onViewModeChange={handleViewModeChange}
                    tenders={filteredTenders}
                    filters={filters}
                    onFilterChange={handleApplyFilter}
                    pagination={pagination}
                    onPageChange={setPage}
                    showFilters={false}
                    showSorting={false}
                  />
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <Bookmark className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No Saved Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        You haven`t saved any projects yet. Browse projects and click the bookmark icon to save them for later.
                      </p>
                      <Button
                        onClick={() => {
                          setActiveTab('recommended');
                          handleResetFilters();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Browse Projects
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}