// pages/dashboard/freelance/tenders/saved/index.tsx
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FreelanceTenderList from '@/components/tenders/FreelanceTenderList';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import {
  Trash2,
  Clock,
  Zap,
  CheckCircle,
  Bookmark,
  Download,
  RefreshCw,
  DollarSign,
  ArrowRight,
  Grid,
  List,
} from 'lucide-react';
import { useSavedTenders, useToggleSaveTender, useTenders, useTenderViewMode } from '@/hooks/useTenders';
import { TenderFilter } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SavedTendersPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: savedTendersData, isLoading, refetch } = useSavedTenders();
  const { mutate: toggleSave } = useToggleSaveTender();
  const viewMode = useTenderViewMode('freelance');
  
  // Get similar tenders for suggestions
  const { tenders: similarTenders } = useTenders({
    page: 1,
    limit: 4,
    tenderCategory: 'freelance',
    status: 'published',
  });

  const savedTenders = savedTendersData || [];
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTenders, setSelectedTenders] = useState<string[]>([]);
  const [filters, setFilters] = useState<TenderFilter>({
    page: 1,
    limit: 12,
    status: 'published',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Filter tenders by status
  const activeTenders = useMemo(() => savedTenders.filter(tender => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    return deadline > now && tender.status === 'published';
  }), [savedTenders]);

  const expiredTenders = useMemo(() => savedTenders.filter(tender => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    return deadline <= now;
  }), [savedTenders]);

  const appliedTenders = useMemo(() => savedTenders.filter(tender =>
    tender.proposals?.some(p => p.applicant === user?.id)
  ), [savedTenders, user?.id]);

  const getTendersForTab = useMemo(() => {
    switch (activeTab) {
      case 'active': return activeTenders;
      case 'expired': return expiredTenders;
      case 'applied': return appliedTenders;
      default: return activeTenders;
    }
  }, [activeTab, activeTenders, expiredTenders, appliedTenders]);

  const handleApplyFilter = (newFilters: Partial<TenderFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      status: 'published',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleBulkRemove = () => {
    selectedTenders.forEach(tenderId => {
      toggleSave(tenderId);
    });
    setSelectedTenders([]);
  };

  const handleExportList = () => {
    const data = getTendersForTab.map(tender => ({
      title: tender.title,
      deadline: format(new Date(tender.deadline), 'yyyy-MM-dd'),
      budget: tender.freelanceSpecific?.budget
        ? `${tender.freelanceSpecific.budget.currency} ${tender.freelanceSpecific.budget.min}-${tender.freelanceSpecific.budget.max}`
        : 'Negotiable',
      status: tender.status,
      skills: tender.skillsRequired?.join(', ') || '',
    }));

    const csv = [
      ['Title', 'Deadline', 'Budget', 'Status', 'Skills'],
      ...data.map(item => [item.title, item.deadline, item.budget, item.status, item.skills])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `saved-projects-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getDeadlineText = (deadline: Date) => {
    const now = new Date();
    const daysRemaining = Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return 'Tomorrow';
    if (daysRemaining < 7) return `${daysRemaining} days`;
    if (daysRemaining < 30) return `${Math.floor(daysRemaining / 7)} weeks`;
    return format(new Date(deadline), 'MMM dd');
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    viewMode.updateViewMode({ type: mode });
  };

  return (
    <>
      <Head>
        <title>Saved Projects | Freelance Dashboard</title>
        <meta name="description" content="Manage your saved freelance projects" />
      </Head>

      <DashboardLayout requiredRole="freelancer">
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Saved Projects
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Manage and track projects you`ve bookmarked
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
                    onClick={handleExportList}
                    disabled={getTendersForTab.length === 0}
                    className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {activeTenders.length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Active</div>
                      </div>
                      <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <Bookmark className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {appliedTenders.length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Applied</div>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {expiredTenders.length}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Expired</div>
                      </div>
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTenders.length > 0 && (
              <Card className="mb-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-emerald-600 text-white">
                        {selectedTenders.length}
                      </Badge>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        project{selectedTenders.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTenders([])}
                        className="border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                      >
                        Clear Selection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkRemove}
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-900 p-1">
                <TabsTrigger 
                  value="active" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Active
                  <Badge className="ml-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                    {activeTenders.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="applied" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applied
                  <Badge className="ml-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                    {appliedTenders.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="expired" 
                  className="data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Expired
                  <Badge className="ml-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                    {expiredTenders.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-0">
                {activeTenders.length > 0 ? (
                  <FreelanceTenderList 
                    viewMode={viewMode.viewMode.type}
                    onViewModeChange={handleViewModeChange}
                    tenders={activeTenders}
                    filters={filters}
                    onFilterChange={handleApplyFilter}
                    showFilters={false}
                    showPagination={false}
                  />
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <Bookmark className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No Active Saved Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Projects you save will appear here. Browse available projects and save interesting ones.
                      </p>
                      <Button
                        onClick={() => router.push('/dashboard/freelance/tenders')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Browse Projects
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="applied" className="mt-0">
                {appliedTenders.length > 0 ? (
                  <FreelanceTenderList 
                    viewMode={viewMode.viewMode.type}
                    onViewModeChange={handleViewModeChange}
                    tenders={appliedTenders}
                    filters={filters}
                    onFilterChange={handleApplyFilter}
                    showFilters={false}
                    showPagination={false}
                  />
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No Applied Saved Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        When you apply to saved projects, they will appear here.
                      </p>
                      <Button
                        onClick={() => router.push('/dashboard/freelance/tenders')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Browse Projects
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="expired" className="mt-0">
                {expiredTenders.length > 0 ? (
                  <>
                    <FreelanceTenderList 
                      viewMode={viewMode.viewMode.type}
                      onViewModeChange={handleViewModeChange}
                      tenders={expiredTenders}
                      filters={filters}
                      onFilterChange={handleApplyFilter}
                      showFilters={false}
                      showPagination={false}
                    />
                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg mt-6">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {expiredTenders.length} expired projects
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          These projects are no longer accepting applications
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          expiredTenders.forEach(tender => toggleSave(tender._id));
                        }}
                        className="border-slate-300 dark:border-slate-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove All Expired
                      </Button>
                    </div>
                  </>
                ) : (
                  <Card className="border border-slate-200 dark:border-slate-800">
                    <CardContent className="text-center py-12">
                      <Clock className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No Expired Saved Projects
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Projects with passed deadlines will automatically move here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Similar Projects Suggestions */}
            {similarTenders.length > 0 && getTendersForTab.length < 5 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Similar Projects You Might Like
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      Based on your saved projects
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/freelance/tenders')}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {similarTenders.slice(0, 4).map((tender) => (
                    <Card
                      key={tender._id}
                      className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => router.push(`/dashboard/freelance/tenders/${tender._id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                            >
                              Freelance
                            </Badge>
                            {tender.freelanceSpecific?.urgency === 'urgent' && (
                              <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                <Zap className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>

                          <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {tender.title}
                          </h4>

                          {tender.freelanceSpecific?.budget && (
                            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                {tender.freelanceSpecific.budget.currency}{' '}
                                {tender.freelanceSpecific.budget.min.toLocaleString()}-
                                {tender.freelanceSpecific.budget.max.toLocaleString()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>{getDeadlineText(new Date(tender.deadline))}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSave(tender._id);
                              }}
                            >
                              <Bookmark className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}