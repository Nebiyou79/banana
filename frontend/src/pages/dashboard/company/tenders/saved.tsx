/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/saved.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Search,
  Bookmark,
  Clock,
  Shield,
  Trash2,
  Eye,
  AlertCircle,
  Banknote,
  ChevronRight,
  ChevronLeft,
  Grid3x3,
  List,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  Target,
} from 'lucide-react';
import { useSavedTenders, useTenderUtils, useToggleSaveTender, useCPOUtils } from '@/hooks/useTenders';
import { Tender, isTenderActive } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ProfessionalTenderCard from '@/components/tenders/ProfesionalTenderCard';

export default function CompanySavedTendersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: savedTenders = [], isLoading, refetch } = useSavedTenders();
  const utils = useTenderUtils();
  const { mutate: toggleSave } = useToggleSaveTender();
  const { isCPORequired } = useCPOUtils();
  
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired' | 'cpo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenders, setSelectedTenders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter saved tenders (only professional ones for company)
  const professionalTenders = savedTenders.filter(tender => 
    tender.tenderCategory === 'professional' && 
    tender.owner._id !== user?.id
  );

  // Filter based on tab and search
  const filteredTenders = professionalTenders.filter(tender => {
    if (activeTab === 'active') {
      if (!isTenderActive(tender)) return false;
    } else if (activeTab === 'expired') {
      if (isTenderActive(tender)) return false;
    } else if (activeTab === 'cpo') {
      if (!isCPORequired(tender)) return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tender.title.toLowerCase().includes(query) ||
        tender.description.toLowerCase().includes(query) ||
        tender.procurementCategory.toLowerCase().includes(query) ||
        tender.professionalSpecific?.referenceNumber?.toLowerCase().includes(query) ||
        tender.professionalSpecific?.procuringEntity?.toLowerCase().includes(query) ||
        false
      );
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
  const paginatedTenders = filteredTenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    // Reset selection when filters change
    setSelectedTenders([]);
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleViewTender = (tenderId: string) => {
    router.push(`/dashboard/company/tenders/${tenderId}`);
  };

  const handleRemoveSaved = (tenderId: string) => {
    toggleSave(tenderId);
    setSelectedTenders(prev => prev.filter(id => id !== tenderId));
    toast({
      title: 'Removed from saved',
      description: 'Tender removed from your saved list',
      variant: 'default',
    });
  };

  const handleBulkRemove = () => {
    selectedTenders.forEach(tenderId => {
      toggleSave(tenderId);
    });
    setSelectedTenders([]);
    toast({
      title: 'Bulk removal complete',
      description: `${selectedTenders.length} tender(s) removed from saved list`,
      variant: 'default',
    });
  };

  const handleApplyNow = (tenderId: string) => {
    router.push(`/dashboard/company/tenders/${tenderId}/apply`);
  };

  const getEligibilityStatus = (tender: Tender) => {
    const { visibility } = tender;
    
    if (visibility.visibilityType === 'companies_only' || visibility.visibilityType === 'public') {
      return { eligible: true, label: 'Eligible', variant: 'success' as const };
    }
    
    if (visibility.visibilityType === 'invite_only') {
      const isInvited = visibility.invitedEmails?.some((invite: any) => 
        invite.email === user?.email && invite.status === 'accepted'
      ) || visibility.allowedCompanies?.includes(user?.company || '');
      
      return { 
        eligible: isInvited, 
        label: isInvited ? 'Invited' : 'Invite Required', 
        variant: isInvited ? 'success' as const : 'warning' as const 
      };
    }
    
    return { eligible: false, label: 'Not Eligible', variant: 'secondary' as const };
  };

  const toggleSelectTender = (tenderId: string) => {
    setSelectedTenders(prev =>
      prev.includes(tenderId)
        ? prev.filter(id => id !== tenderId)
        : [...prev, tenderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTenders.length === filteredTenders.length) {
      setSelectedTenders([]);
    } else {
      setSelectedTenders(filteredTenders.map(t => t._id));
    }
  };

  // Calculate stats
  const stats = {
    total: professionalTenders.length,
    active: professionalTenders.filter(t => isTenderActive(t)).length,
    cpoRequired: professionalTenders.filter(t => isCPORequired(t)).length,
    eligible: professionalTenders.filter(t => getEligibilityStatus(t).eligible).length,
    invited: professionalTenders.filter(t => 
      t.visibility.visibilityType === 'invite_only' && getEligibilityStatus(t).eligible
    ).length,
    urgent: professionalTenders.filter(t => 
      new Date(t.deadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
    ).length,
  };

  const renderEmptyState = () => {
    return (
      <Card className="border-slate-200 dark:border-slate-800 text-center py-16">
        <CardContent className="space-y-6">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto">
            <Bookmark className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {searchQuery ? 'No Matching Saved Tenders' : 'No Saved Tenders'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search.'
                : 'Save interesting tenders while browsing to plan your bidding strategy.'
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push('/dashboard/company/tenders')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Browse Tenders
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/company/tenders?cpoRequired=true')}
              className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Banknote className="h-4 w-4 mr-2" />
              View CPO Tenders
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSavedTenderCard = (tender: Tender) => {
    const isSelected = selectedTenders.includes(tender._id);
    const eligibility = getEligibilityStatus(tender);
    const isActive = isTenderActive(tender);
    const hasCPO = isCPORequired(tender);
    const daysRemaining = Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <div className={`relative transition-all duration-300 ${isSelected ? 'scale-[0.98] opacity-90' : ''}`}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleSelectTender(tender._id)}
          className="absolute top-4 left-4 z-20 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-lg"
        />
        <div className={isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 rounded-xl' : ''}>
          <ProfessionalTenderCard tender={tender} />
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {!isActive && (
            <Badge variant="destructive" className="shadow-sm">
              <Clock className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}
          {!eligibility.eligible && (
            <Badge variant="secondary" className="shadow-sm">
              <XCircle className="h-3 w-3 mr-1" />
              {eligibility.label}
            </Badge>
          )}
          {hasCPO && (
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 shadow-sm">
              <Banknote className="h-3 w-3 mr-1" />
              CPO Required
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Saved</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Active</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">CPO Required</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.cpoRequired}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center">
                <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Eligible</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.eligible}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Invited</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.invited}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Urgent</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.urgent}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout requiredRole="company">
      <Head>
        <title>Saved Tenders | Company Dashboard</title>
        <meta name="description" content="Manage your saved professional tenders" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-950 dark:to-amber-950/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-lg">
                    <Bookmark className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-amber-800 dark:from-slate-100 dark:to-amber-300 bg-clip-text text-transparent">
                      Saved Tenders
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      Manage your bidding opportunities and priorities
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <Bookmark className="h-3 w-3 mr-1" />
                    {stats.total} Saved
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {stats.eligible} Eligible
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <Zap className="h-3 w-3 mr-1" />
                    {stats.urgent} Urgent
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {selectedTenders.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={handleBulkRemove}
                    className="shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Selected ({selectedTenders.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/company/tenders')}
                  className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Browse More
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/company/tenders?cpoRequired=true')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  View CPO Tenders
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          {renderStats()}
          
          {/* Info Alert */}
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 mt-6 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-300">Bid Planning Strategy</p>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                    Use this space to organize tender opportunities. Prioritize based on eligibility,
                    deadlines, CPO requirements, and strategic importance. Remove tenders after making bidding decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Controls */}
          <div className="mb-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-900 p-1">
                        <TabsTrigger 
                          value="all" 
                          className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                        >
                          All
                          <Badge variant="secondary" className="ml-2">
                            {professionalTenders.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="active" 
                          className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                        >
                          Active
                          <Badge variant="secondary" className="ml-2">
                            {stats.active}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="cpo" 
                          className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                        >
                          CPO
                          <Badge variant="secondary" className="ml-2">
                            {stats.cpoRequired}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="expired" 
                          className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                        >
                          Expired
                          <Badge variant="secondary" className="ml-2">
                            {stats.total - stats.active}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* View Controls */}
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
                    
                    {/* Filters Toggle */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="border-slate-300 dark:border-slate-700"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                  </div>
                </div>
                
                {/* Search and Bulk Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search saved tenders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="border-slate-300 dark:border-slate-700"
                    >
                      {selectedTenders.length === filteredTenders.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedTenders.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTenders([])}
                        className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Bulk Actions Bar */}
          {selectedTenders.length > 0 && (
            <div className="mb-6">
              <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-300">
                          {selectedTenders.length} tender(s) selected
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          You can remove them all at once or apply in bulk
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedTenders([])}
                        className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Clear Selection
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleBulkRemove}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Tender List */}
          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-slate-200 dark:border-slate-800 animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedTenders.length > 0 ? (
            <>
              {/* Tenders Grid */}
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid grid-cols-1'
                } 
                gap-6
              `}>
                {paginatedTenders.map((tender) => renderSavedTenderCard(tender))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {paginatedTenders.length} of {filteredTenders.length} saved tenders
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-slate-300 dark:border-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`
                              h-8 w-8 p-0
                              ${currentPage === pageNum 
                                ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white' 
                                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }
                            `}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && (
                        <>
                          <span className="px-2 text-slate-500">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className={`
                              h-8 w-8 p-0
                              ${currentPage === totalPages 
                                ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white' 
                                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }
                            `}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-slate-300 dark:border-slate-700"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            renderEmptyState()
          )}
          
          {/* Quick Actions Footer */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Bidding Strategy Guide
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Learn how to win more contracts
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto group-hover:text-blue-500 transition-colors" />
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
                      CPO Preparation Guide
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      How to prepare Certified Payment Orders
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 group-hover:from-emerald-600 group-hover:to-green-600 transition-all duration-300">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Winning Strategies
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Tips for successful bidding
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-auto group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}