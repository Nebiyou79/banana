// pages/dashboard/company/my-tenders/index.tsx
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CompanyOwnerTenderList } from '@/components/tenders/ComapnyOwnerTenderList';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/social/ui/Button';
import { 
  Plus, 
  Filter, 
  RefreshCw, 
  Download, 
  Grid3x3, 
  List,
  TrendingUp,
  FileText,
  Users,
  Clock,
  Search,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import { useOwnedTenders } from '@/hooks/useTenders';

export default function CompanyMyTendersPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Fetch owned tenders
  const { tenders, isLoading, refetch } = useOwnedTenders({
    page: 1,
    limit: 12,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    tenderCategory: categoryFilter !== 'all' ? categoryFilter : undefined,
    workflowType: workflowFilter !== 'all' ? workflowFilter : undefined,
    // search: searchQuery || undefined,
    // sortBy: 'createdAt',
    // sortOrder: 'desc',
  });
  
  // Calculate statistics
  const calculateStats = () => {
    const total = tenders.length || 0;
    const active = tenders.filter(t => t.status === 'published').length;
    const draft = tenders.filter(t => t.status === 'draft').length;
    const totalApplications = tenders.reduce((sum, t) => sum + (t.metadata?.totalApplications || 0), 0);
    const endingSoon = tenders.filter(t => {
      if (t.status !== 'published') return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length;
    
    const freelance = tenders.filter(t => t.tenderCategory === 'freelance').length;
    const professional = tenders.filter(t => t.tenderCategory === 'professional').length;
    
    return { total, active, draft, totalApplications, endingSoon, freelance, professional };
  };
  
  const stats = calculateStats();
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setStatusFilter(value === 'all' ? 'all' : value);
    refetch();
  };
  
  const handleCreateNew = () => {
    router.push('/dashboard/company/my-tenders/create');
  };
  
  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your tenders are being prepared for download.',
      variant: 'success',
    });
  };
  
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing...',
      description: 'Updating tender list.',
      variant: 'default',
    });
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = () => {
    refetch();
  };
  
  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
        {/* Header */}
        <div className={cn(
          "bg-white dark:bg-gray-900",
          "border-b border-gray-200 dark:border-gray-800",
          "px-6 py-8"
        )}>
          <div className="max-w-7xl mx-auto">
            {/* Header with Title and Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  My Tenders
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                  Manage and track all your created tenders in one place.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0 px-3 py-2"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0 px-3 py-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleRefresh} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport} className="gap-2">
                      <Download className="w-4 h-4" />
                      Export All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Create New Button */}
                <Button 
                  onClick={handleCreateNew} 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Plus className="w-4 h-4" />
                  New Tender
                </Button>
              </div>
            </div>
            
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenders</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats.total}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {stats.freelance} Freelance
                        </Badge>
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                          {stats.professional} Professional
                        </Badge>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats.active}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        {stats.endingSoon} ending soon
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats.totalApplications}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Across all tenders
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draft</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {stats.draft}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Ready to publish
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by title, description, or ID..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  Refresh
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                          Category
                        </label>
                        <select 
                          value={categoryFilter}
                          onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            refetch();
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                        >
                          <option value="all">All Categories</option>
                          <option value="freelance">Freelance</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                          Workflow
                        </label>
                        <select 
                          value={workflowFilter}
                          onChange={(e) => {
                            setWorkflowFilter(e.target.value);
                            refetch();
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                        >
                          <option value="all">All Workflows</option>
                          <option value="open">Open Tender</option>
                          <option value="closed">Sealed Bid</option>
                        </select>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Tabs for quick filtering */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="bg-gray-100 dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-800">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                >
                  All Tenders
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="published" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                >
                  Active
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {stats.active}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="draft" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                >
                  Draft
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {stats.draft}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="closed" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                >
                  Closed
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {tenders.filter(t => t.status === 'closed').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tenders List */}
          <CompanyOwnerTenderList
            initialFilters={{
              status: statusFilter !== 'all' ? statusFilter : undefined,
              tenderCategory: categoryFilter !== 'all' ? categoryFilter : undefined,
              workflowType: workflowFilter !== 'all' ? workflowFilter : undefined,
              search: searchQuery || undefined,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            }}
            showFilters={false}
            showHeader={false}
            itemsPerPage={12}
            className="bg-transparent"
          />
          
          {/* Empty State */}
          {!isLoading && tenders.length === 0 && (
            <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center p-12">
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Tenders Created Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Start creating your first tender to connect with freelancers or companies and get proposals for your projects.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push('/dashboard/company/my-tenders/create?category=freelance')}
                    variant="outline"
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Create Freelance Tender
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/company/my-tenders/create?category=professional')}
                    variant="outline"
                    className="gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    Create Professional Tender
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading your tenders...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}