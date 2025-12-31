// pages/dashboard/company/applications/index.tsx - PREMIUM VERSION
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Application, applicationService } from '@/services/applicationService';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  FileText, 
  Clock,
  CheckCircle,
  Building,
  Download,
  RefreshCw,
  BarChart3,
  Briefcase,
  Users2,
  DollarSign,
  Star,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Eye,
  Crown,
  Sparkles,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CompanyApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    rejected: 0,
    newApplications: 0,
    hired: 0,
    jobsPosted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await applicationService.getApplicationStatistics();
      if (response.data?.statistics) {
        setStats({
          total: response.data.statistics.totalApplications || 0,
          underReview: response.data.statistics.underReview || 0,
          shortlisted: response.data.statistics.shortlisted || 0,
          interviewScheduled: response.data.statistics.interviewScheduled || 0,
          rejected: response.data.statistics.rejected || 0,
          newApplications: response.data.statistics.newApplications || 0,
          hired: response.data.statistics.hired || 0,
          jobsPosted: response.data.statistics.jobsPosted || 0
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      setError(error.message || 'Failed to load application statistics');
      toast({
        title: 'Error',
        description: 'Failed to load application statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleRefresh = () => {
    fetchStatistics();
    toast({
      title: 'Refreshing...',
      description: 'Updating application data',
    });
  };

  const handleApplicationSelect = (application: Application) => {
    router.push(`/dashboard/company/applications/${application._id}`);
  };

  const handleStatusUpdate = (updatedApplication: Application) => {
    fetchStatistics();
    toast({
      title: 'Status Updated',
      description: `Application status updated to ${applicationService.getStatusLabel(updatedApplication.status)}`,
      variant: 'default',
    });
  };

  // Premium Glass Card Component
  const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children, 
    className = '' 
  }) => (
    <div 
      className={`rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-2xl shadow-black/5 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
      }}
    >
      {children}
    </div>
  );

  // Premium Stat Card
  const PremiumStatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    color = 'blue',
    trend
  }: { 
    title: string;
    value: number;
    description: string;
    icon: any;
    color?: 'blue' | 'amber' | 'emerald' | 'violet' | 'rose';
    trend?: number;
  }) => {
    const colorConfig = {
      blue: { gradient: 'from-blue-400 to-cyan-400', bg: 'bg-blue-500/20' },
      amber: { gradient: 'from-amber-400 to-yellow-400', bg: 'bg-amber-500/20' },
      emerald: { gradient: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-500/20' },
      violet: { gradient: 'from-violet-400 to-purple-400', bg: 'bg-violet-500/20' },
      rose: { gradient: 'from-rose-400 to-pink-400', bg: 'bg-rose-500/20' }
    };

    const config = colorConfig[color];

    return (
      <GlassCard className="p-6 hover:scale-105 transition-transform duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-r ${config.gradient} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-semibold text-gray-700">{title}</p>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 text-sm font-semibold ${
              trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-gray-400'
            }`}>
              <TrendingUp className={`h-4 w-4 ${trend > 0 ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </GlassCard>
    );
  };

  if (error) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <GlassCard className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-rose-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                Unable to Load Applications
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mb-2">
                {error}
              </CardDescription>
              <p className="text-gray-500 text-sm mb-8 max-w-md">
                There was an issue loading your application data. This might be due to network issues or permission problems.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Try Again'}
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/company/jobs')}
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 hover:from-amber-500 hover:to-yellow-500 shadow-lg"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Jobs
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Premium Header */}
          <GlassCard className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 shadow-lg">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Talent Marketplace
                    </h1>
                    <p className="text-xl text-gray-600 mt-2">
                      Premium candidate management platform
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-400/30">
                    <Sparkles className="h-4 w-4" />
                    <span>Premium Glass UI</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {stats.total} total applications • {stats.newApplications} new today
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 hover:from-amber-500 hover:to-yellow-500 shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/company/jobs')}
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Jobs
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Premium Stats Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PremiumStatCard
                title="Total Applications"
                value={stats.total}
                description="All candidates"
                icon={Users}
                color="blue"
                trend={12}
              />
              <PremiumStatCard
                title="Under Review"
                value={stats.underReview}
                description="Being evaluated"
                icon={Clock}
                color="amber"
                trend={5}
              />
              <PremiumStatCard
                title="Shortlisted"
                value={stats.shortlisted}
                description="Top candidates"
                icon={CheckCircle}
                color="emerald"
                trend={8}
              />
              <PremiumStatCard
                title="Interviews"
                value={stats.interviewScheduled}
                description="Scheduled meetings"
                icon={Users2}
                color="violet"
                trend={15}
              />
            </div>
          )}

          {/* Secondary Stats */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PremiumStatCard
                title="New Today"
                value={stats.newApplications}
                description="Fresh applications"
                icon={Star}
                color="blue"
              />
              <PremiumStatCard
                title="Successful Hires"
                value={stats.hired}
                description="Placements"
                icon={DollarSign}
                color="emerald"
              />
              <PremiumStatCard
                title="Active Jobs"
                value={stats.jobsPosted}
                description="Open positions"
                icon={Building}
                color="violet"
              />
            </div>
          )}

          {/* Search and Filters */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search candidates, skills, or job titles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 backdrop-blur-sm border-white/40 focus:bg-white/70 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50">
                  <Target className="h-4 w-4 mr-2" />
                  Insights
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Applications Section */}
          <GlassCard>
            <CardHeader className="pb-4 border-b border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    Candidate Applications
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-2">
                    Manage and review applications across your job postings
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/30 px-3 py-1.5 rounded-full border border-white/40">
                  <BarChart3 className="h-4 w-4" />
                  <span>Real-time Analytics</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white/30 backdrop-blur-sm p-1 rounded-xl gap-1 border border-white/40">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    <span>All</span>
                    {stats.total > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900">
                        {stats.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="review" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Review</span>
                    {stats.underReview > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-amber-500/20 text-amber-700 border-amber-400/30">
                        {stats.underReview}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="shortlisted" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Shortlisted</span>
                    {stats.shortlisted > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-emerald-500/20 text-emerald-700 border-emerald-400/30">
                        {stats.shortlisted}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="interview" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <Users2 className="h-4 w-4 text-violet-500" />
                    <span>Interview</span>
                    {stats.interviewScheduled > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-violet-500/20 text-violet-700 border-violet-400/30">
                        {stats.interviewScheduled}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hired" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>Hired</span>
                    {stats.hired > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-green-500/20 text-green-700 border-green-400/30">
                        {stats.hired}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 m-0">
                  <ApplicationList
                    viewType="company"
                    onApplicationUpdate={handleStatusUpdate}
                    onApplicationSelect={handleApplicationSelect}
                    showFilters={false}
                    title={getTabTitle(activeTab)}
                    description={getTabDescription(activeTab, stats)}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </GlassCard>

          {/* Performance Footer */}
          <GlassCard className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  Hiring Performance
                </h3>
                <p className="text-gray-600">
                  Your hiring process is performing exceptionally well. Continue reviewing to maintain quality.
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">{stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : 0}%</div>
                  <div className="text-gray-600">Hire Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{stats.interviewScheduled}</div>
                  <div className="text-gray-600">Active Interviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.newApplications}</div>
                  <div className="text-gray-600">New Today</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helper functions
const getTabTitle = (tab: string): string => {
  const titles: Record<string, string> = {
    all: 'All Applications',
    review: 'Applications Under Review',
    shortlisted: 'Shortlisted Candidates',
    interview: 'Interview Stage',
    hired: 'Successful Hires'
  };
  return titles[tab] || 'Applications';
};

const getTabDescription = (tab: string, stats: any): string => {
  const descriptions: Record<string, string> = {
    all: `All applications across your job postings - Total ${stats.total} applications`,
    review: 'Applications currently being evaluated by your team',
    shortlisted: 'Promising candidates selected for further consideration',
    interview: 'Candidates scheduled for interviews',
    hired: 'Successfully placed candidates in your organization'
  };
  return descriptions[tab] || 'Manage job applications';
};

export default CompanyApplicationsPage;