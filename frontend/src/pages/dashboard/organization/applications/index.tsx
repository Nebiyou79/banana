/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/applications/index.tsx - PREMIUM ORGANIZATION VERSION
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Application, applicationService } from '@/services/applicationService';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { Button } from '@/components/ui/Button';
import {  CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  Heart,
  Target,
  RefreshCw,
  BarChart3,
  Star,
  GraduationCap,
  Users2,
  Globe,
 Leaf
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ApplicationStats {
  total: number;
  underReview: number;
  shortlisted: number;
  rejected: number;
  newToday: number;
  volunteer: number;
  internship: number;
  [key: string]: number;
}

const OrganizationApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewed: 0,
    rejected: 0,
    newToday: 0,
    volunteer: 0,
    internship: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchApplicationStats();
  }, []);

  const fetchApplicationStats = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getApplicationStatistics();
      
      if (!response.data?.statistics) {
        throw new Error('No statistics data received');
      }

      const statsData = response.data.statistics;
      
      // Transform stats for organization view
      const transformedStats: ApplicationStats = {
        total: statsData.totalApplications || 0,
        underReview: statsData.underReview || 0,
        shortlisted: statsData.shortlisted || 0,
        rejected: statsData.rejected || 0,
        newToday: statsData.newApplications || 0,
        volunteer: Math.floor((statsData.totalApplications || 0) * 0.6), // Mock data
        internship: Math.floor((statsData.totalApplications || 0) * 0.4) // Mock data
      };

      setStats(transformedStats);
    } catch (error: any) {
      console.error('Failed to fetch application stats:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load application statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplicationStats();
  };

  const handleApplicationSelect = (application: Application) => {
    router.push(`/dashboard/organization/applications/${application._id}`);
  };

  const getFiltersForTab = () => {
    switch (activeTab) {
      case 'review':
        return { status: 'under-review' };
      case 'shortlisted':
        return { status: 'shortlisted' };
      case 'interviewed':
        return { status: 'interviewed' };
      case 'rejected':
        return { status: 'rejected' };
      case 'volunteer':
        return { jobType: 'volunteer' };
      case 'internship':
        return { jobType: 'internship' };
      default:
        return {};
    }
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
    color = 'teal',
    trend
  }: { 
    title: string;
    value: number;
    description: string;
    icon: any;
    color?: 'teal' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'lime';
    trend?: number;
  }) => {
    const colorConfig = {
      teal: { gradient: 'from-teal-400 to-cyan-400', bg: 'bg-teal-500/20' },
      emerald: { gradient: 'from-emerald-400 to-green-400', bg: 'bg-emerald-500/20' },
      amber: { gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-500/20' },
      violet: { gradient: 'from-violet-400 to-purple-400', bg: 'bg-violet-500/20' },
      rose: { gradient: 'from-rose-400 to-pink-400', bg: 'bg-rose-500/20' },
      cyan: { gradient: 'from-cyan-400 to-blue-400', bg: 'bg-cyan-500/20' },
      lime: { gradient: 'from-lime-400 to-green-400', bg: 'bg-lime-500/20' }
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

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Premium Header */}
          <GlassCard className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-400 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-teal-700 bg-clip-text">
                      Community Applications
                    </h1>
                    <p className="text-xl text-gray-600 mt-2">
                      Premium platform for managing volunteer and internship opportunities
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-teal-600 bg-teal-500/20 px-3 py-1.5 rounded-full border border-teal-400/30">
                    <Leaf className="h-4 w-4" />
                    <span>Community Impact Platform</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {stats.total} total applications • {stats.newToday} new today
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard/organization/jobs')}
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 text-white hover:from-teal-500 hover:to-cyan-500 shadow-lg"
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Opportunities
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Premium Stats Grid */}
          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumStatCard
                  title="Total Applications"
                  value={stats.total}
                  description="All opportunity applications"
                  icon={Users}
                  color="teal"
                  trend={8}
                />
                <PremiumStatCard
                  title="Under Review"
                  value={stats.underReview}
                  description="Currently being evaluated"
                  icon={Clock}
                  color="amber"
                  trend={5}
                />
                <PremiumStatCard
                  title="Shortlisted"
                  value={stats.shortlisted}
                  description="Promising candidates"
                  icon={CheckCircle}
                  color="emerald"
                  trend={12}
                />
                <PremiumStatCard
                  title="New Today"
                  value={stats.newToday}
                  description="Recent applications"
                  icon={Star}
                  color="violet"
                />
              </div>

              {/* Opportunity Type Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumStatCard
                  title="Volunteer Applications"
                  value={stats.volunteer}
                  description="Community volunteers"
                  icon={Heart}
                  color="rose"
                  trend={15}
                />
                <PremiumStatCard
                  title="Internship Applications"
                  value={stats.internship}
                  description="Learning opportunities"
                  icon={GraduationCap}
                  color="cyan"
                  trend={10}
                />
              </div>
            </>
          )}

          {/* Applications Section */}
          <GlassCard>
            <CardHeader className="pb-4 border-b border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    Community Applications
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-2">
                    Manage applications across volunteer positions, internships, and opportunities
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/30 px-3 py-1.5 rounded-full border border-white/40">
                  <BarChart3 className="h-4 w-4" />
                  <span>Real-time Community Analytics</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-white/30 backdrop-blur-sm p-1 rounded-xl gap-1 border border-white/40">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <FileText className="h-4 w-4" />
                    <span>All</span>
                    {stats.total > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-gradient-to-r from-teal-400 to-cyan-400 text-white">
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
                    value="volunteer" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>Volunteer</span>
                    {stats.volunteer > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-rose-500/20 text-rose-700 border-rose-400/30">
                        {stats.volunteer}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="internship" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <GraduationCap className="h-4 w-4 text-cyan-500" />
                    <span>Internship</span>
                    {stats.internship > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-cyan-500/20 text-cyan-700 border-cyan-400/30">
                        {stats.internship}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="interviewed" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
                  >
                    <Users2 className="h-4 w-4 text-violet-500" />
                    <span>Interviewed</span>
                    {stats.interviewed > 0 && (
                      <Badge className="h-5 px-1.5 text-xs bg-violet-500/20 text-violet-700 border-violet-400/30">
                        {stats.interviewed}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 m-0">
                  <ApplicationList
                    viewType="organization"
                    onApplicationSelect={handleApplicationSelect}
                    showFilters={true}
                    title={getTabTitle(activeTab)}
                    description={getTabDescription(activeTab, stats)}
                    {...getFiltersForTab()}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </GlassCard>

          {/* Community Impact Footer */}
          <GlassCard className="p-6 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-400/30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Making a Difference Together
                </h3>
                <p className="text-gray-600">
                  Your organization is creating meaningful opportunities and building stronger communities through volunteer work and internships.
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-500">{stats.total > 0 ? Math.round((stats.shortlisted / stats.total) * 100) : 0}%</div>
                  <div className="text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-500">{stats.volunteer + stats.internship}</div>
                  <div className="text-gray-600">Active Opportunities</div>
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
    volunteer: 'Volunteer Applications',
    internship: 'Internship Applications',
    interviewed: 'Interviewed Candidates'
  };
  return titles[tab] || 'Applications';
};

const getTabDescription = (tab: string, stats: ApplicationStats): string => {
  const descriptions: Record<string, string> = {
    all: `All applications across your opportunities - Total ${stats.total} applications`,
    review: 'Applications currently being evaluated by your team',
    shortlisted: 'Promising candidates selected for further consideration',
    volunteer: `Community volunteer applications - ${stats.volunteer} passionate individuals`,
    internship: `Learning opportunity applications - ${stats.internship} aspiring professionals`,
    interviewed: `Candidates who have completed interviews - ${stats.interviewed} completed`
  };
  return descriptions[tab] || 'Manage opportunity applications';
};

export default OrganizationApplicationsPage;