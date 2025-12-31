/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { tenderService, Tender } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Plus,
  MapPin,
  Calendar,
  FolderOpen,
  ClipboardList,
  FileText,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  BarChart3,
  Award,
  Shield,
  MoreVertical,
  Filter,
  Download,
  Mail,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  UserCheck,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import { useVerification } from '@/hooks/useVerification';
import { cn } from '@/lib/utils';

interface DashboardStats {
  // Job Stats
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalJobApplications: number;
  totalJobViews: number;

  // Tender Stats
  totalTenders: number;
  publishedTenders: number;
  draftTenders: number;
  closedTenders: number;
  totalProposals: number;
  totalTenderViews: number;

  // Combined Stats
  totalOpportunities: number;
  totalEngagements: number;
  completionRate: number;
  engagementRate: number;

  // Financial Stats
  avgJobSalary: number;
  avgTenderBudget: number;
  totalBudgetValue: number;
}

const CompanyDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { verificationData, loading: verificationLoading } = useVerification();

  // Fetch company jobs
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: async () => {
      try {
        const response = await jobService.getCompanyJobs();
        return response;
      } catch (error) {
        console.error('[CompanyDashboard] Jobs API Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && user?.role === 'company',
  });

  // Fetch company tenders
  const {
    data: tendersData,
    isLoading: tendersLoading,
    error: tendersError,
    refetch: refetchTenders
  } = useQuery({
    queryKey: ['companyTenders'],
    queryFn: async () => {
      try {
        const tenders = await tenderService.getMyTenders();
        return tenders;
      } catch (error: any) {
        console.error('[CompanyDashboard] Tenders API Error:', error);
        toast({
          title: 'Failed to load tenders',
          description: error.message || 'Please try again later',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: isAuthenticated && user?.role === 'company',
  });

  // Handle errors
  useEffect(() => {
    if (jobsError) {
      toast({
        title: 'Failed to Load Jobs',
        description: 'Unable to load your job postings.',
        variant: 'destructive',
      });
    }
  }, [jobsError, toast]);

  useEffect(() => {
    if (tendersError) {
      toast({
        title: 'Failed to Load Projects',
        description: 'Unable to load your projects.',
        variant: 'destructive',
      });
    }
  }, [tendersError, toast]);

  // Safely extract data
  const jobs = jobsData?.data || [];
  const tenders = tendersData || [];

  // Calculate dashboard statistics
  const calculateStats = (): DashboardStats => {
    // Job calculations
    const activeJobs = jobs.filter((job: Job) => job.status === 'active').length;
    const draftJobs = jobs.filter((job: Job) => job.status === 'draft').length;
    const closedJobs = jobs.filter((job: Job) => job.status === 'closed' || job.status === 'archived').length;
    const totalJobApplications = jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0);
    const totalJobViews = jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0);

    // Average job salary
    const avgJobSalary = jobs.length > 0
      ? jobs.reduce((sum: number, job: Job) => {
        const salary = job.salary;
        if (!salary) return sum;
        const avg = salary.min && salary.max
          ? (salary.min + salary.max) / 2
          : salary.min || salary.max || 0;
        return sum + avg;
      }, 0) / jobs.length
      : 0;

    // Tender calculations
    const publishedTenders = tenders.filter((tender: Tender) => tender.status === 'published').length;
    const draftTenders = tenders.filter((tender: Tender) => tender.status === 'draft').length;
    const closedTenders = tenders.filter((tender: Tender) =>
      ['closed', 'revealed', 'cancelled'].includes(tender.status)
    ).length;
    const totalProposals = tenders.reduce((sum: number, tender: Tender) => sum + (tender.proposals?.length || 0), 0);
    const totalTenderViews = tenders.reduce((sum: number, tender: Tender) => sum + (tender.metadata?.views || 0), 0);

    // Average tender budget
    const avgTenderBudget = tenders.length > 0
      ? tenders.reduce((sum: number, tender: Tender) => {
        if (tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget) {
          const budget = tender.freelanceSpecific.budget;
          const avg = budget.min && budget.max
            ? (budget.min + budget.max) / 2
            : budget.min || budget.max || 0;
          return sum + avg;
        }
        return sum;
      }, 0) / tenders.length
      : 0;

    // Total budget value estimation
    const totalBudgetValue = tenders.reduce((sum: number, tender: Tender) => {
      if (tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget) {
        const budget = tender.freelanceSpecific.budget;
        return sum + (budget.max || budget.min || 0);
      }
      return sum;
    }, 0) + avgJobSalary * jobs.length;

    // Combined stats
    const totalOpportunities = jobs.length + tenders.length;
    const totalEngagements = totalJobApplications + totalProposals;
    const completionRate = tenders.length > 0
      ? (closedTenders / tenders.length) * 100
      : 0;
    const engagementRate = totalOpportunities > 0
      ? (totalEngagements / totalOpportunities) * 100
      : 0;

    return {
      totalJobs: jobs.length,
      activeJobs,
      draftJobs,
      closedJobs,
      totalJobApplications,
      totalJobViews,
      totalTenders: tenders.length,
      publishedTenders,
      draftTenders,
      closedTenders,
      totalProposals,
      totalTenderViews,
      totalOpportunities,
      totalEngagements,
      completionRate,
      engagementRate,
      avgJobSalary,
      avgTenderBudget,
      totalBudgetValue
    };
  };

  const stats = calculateStats();

  // Formatting functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${amount.toLocaleString()} ${currency}`;
    }
  };

  const getTimeAgo = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return `${Math.floor(diffHours / 168)}w ago`;
  };

  // Status helpers
  const getJobStatusConfig = (status: string) => {
    const configs = {
      active: {
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
        icon: CheckCircle2,
        label: 'Active'
      },
      draft: {
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        icon: FileText,
        label: 'Draft'
      },
      closed: {
        color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        icon: Clock,
        label: 'Closed'
      },
      archived: {
        color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        icon: FolderOpen,
        label: 'Archived'
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getTenderStatusConfig = (status: string) => {
    const configs = {
      draft: {
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        icon: FileText,
        label: 'Draft'
      },
      published: {
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
        icon: CheckCircle2,
        label: 'Published'
      },
      locked: {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: Shield,
        label: 'Locked'
      },
      deadline_reached: {
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: Clock,
        label: 'Deadline'
      },
      revealed: {
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        icon: TrendingUp,
        label: 'Revealed'
      },
      closed: {
        color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        icon: Award,
        label: 'Closed'
      },
      cancelled: {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
        icon: Clock,
        label: 'Cancelled'
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getTenderCategoryConfig = (category: string) => {
    return category === 'freelance'
      ? { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', icon: Users, label: 'Freelance' }
      : { color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300', icon: Briefcase, label: 'Professional' };
  };

  const formatJobSalary = (job: Job): string => {
    if (!job.salary) return 'Negotiable';
    const { min, max, currency = 'ETB' } = job.salary;
    if (min && max) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
    if (min) return `From ${formatCurrency(min, currency)}`;
    if (max) return `Up to ${formatCurrency(max, currency)}`;
    return 'Negotiable';
  };

  const formatTenderBudget = (tender: Tender): string => {
    if (tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget) {
      const budget = tender.freelanceSpecific.budget;
      const { min, max, currency = 'USD' } = budget;
      if (min && max) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
      if (min) return `From ${formatCurrency(min, currency)}`;
      if (max) return `Up to ${formatCurrency(max, currency)}`;
    }
    return 'Negotiable';
  };

  // Recent items
  const recentJobs = jobs.slice(0, 3);
  const recentTenders = tenders.slice(0, 3);

  // Loading state
  if (jobsLoading || tendersLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-200">
        {/* Header */}
        <div className={cn(
          "border-b bg-white dark:bg-gray-900",
          "border-gray-200 dark:border-gray-800",
          "transition-colors duration-200"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Company Dashboard
                  </h1>
                  {/* Verification Badge */}
                  {!verificationLoading && (
                    <VerificationBadge
                      autoFetch={true}
                      size="md"
                      showText={true}
                      showTooltip={true}
                      className="shadow-sm"
                    />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Welcome back, {user?.name || 'Company'}. Manage your hiring and projects efficiently.
                </p>

                {/* Verification Status Info */}
                {verificationData && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Trust Score: </span>
                      <span className={cn(
                        "font-bold",
                        verificationData.verificationStatus === 'full' ? 'text-green-600 dark:text-green-400' :
                          verificationData.verificationStatus === 'partial' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                      )}>
                        {verificationData.verificationStatus === 'full' ? 'Excellent' :
                          verificationData.verificationStatus === 'partial' ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                    {verificationData.verificationStatus !== 'full' && (
                      <Link href="/dashboard/company/verification">
                        <Button variant="outline" size="sm" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Improve Verification
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
                <Button
                  onClick={() => refetchJobs()}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/dashboard/company/jobs/create">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                  </Button>
                </Link>
                <Link href="/dashboard/company/tender/create">
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid with Verification Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Opportunities Card */}
            <Card className={cn(
              "border shadow-sm hover:shadow-md transition-shadow",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(stats.totalOpportunities)}
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (stats.activeJobs + stats.publishedTenders) / stats.totalOpportunities * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{stats.activeJobs + stats.publishedTenders} Active</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">+12%</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Engagements Card */}
            <Card className={cn(
              "border shadow-sm hover:shadow-md transition-shadow",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Engagements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(stats.totalEngagements)}
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <Users className="w-4 h-4 mr-1 text-green-500 dark:text-green-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.totalJobApplications} job apps + {stats.totalProposals} proposals
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {stats.engagementRate.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Views Card */}
            <Card className={cn(
              "border shadow-sm hover:shadow-md transition-shadow",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(stats.totalJobViews + stats.totalTenderViews)}
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <Eye className="w-4 h-4 mr-1 text-blue-500 dark:text-blue-400" />
                      <span className="text-gray-600 dark:text-gray-400">Across all opportunities</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Views per Item</div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalOpportunities > 0
                      ? Math.round((stats.totalJobViews + stats.totalTenderViews) / stats.totalOpportunities)
                      : 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status Card */}
            <Card className={cn(
              "border shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Verification Status
                  </CardTitle>
                  {verificationData && (
                    <VerificationBadge
                      status={verificationData.verificationStatus}
                      size="sm"
                      showText={false}
                      showTooltip={true}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {verificationData ?
                        verificationData.verificationStatus === 'full' ? 'Fully Verified' :
                          verificationData.verificationStatus === 'partial' ? 'Partially Verified' : 'Not Verified'
                        : 'Loading...'
                      }
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <Shield className="w-4 h-4 mr-1 text-blue-500 dark:text-blue-400" />
                      <span className="text-gray-600 dark:text-gray-400">Company trust score</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Last Verified</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {verificationData?.verificationDetails?.lastVerified
                      ? new Date(verificationData.verificationDetails.lastVerified).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Overview
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Jobs ({stats.totalJobs})
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Projects ({stats.totalTenders})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Jobs */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-gray-900 dark:text-white">Recent Job Postings</CardTitle>
                      </div>
                      <Link href="/dashboard/company/jobs">
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentJobs.length > 0 ? (
                      <div className="space-y-4">
                        {recentJobs.map((job: Job) => {
                          const statusConfig = getJobStatusConfig(job.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <div key={job._id} className={cn(
                              "group p-4 border rounded-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all",
                              "border-gray-200 dark:border-gray-700",
                              "bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                                      <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        <Link href={`/dashboard/company/jobs/${job._id}`}>
                                          {job.title}
                                        </Link>
                                      </h4>
                                      <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className={statusConfig.color}>
                                          <StatusIcon className="w-3 h-3 mr-1" />
                                          {statusConfig.label}
                                        </Badge>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                          <MapPin className="w-3 h-3 mr-1" />
                                          {job.location?.city}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                          <Users className="w-3 h-3 mr-1" />
                                          {job.applicationCount || 0} apps
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(job.createdAt)}</div>
                                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                    {formatJobSalary(job)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <Briefcase className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No jobs yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Start by creating your first job posting</p>
                        <Link href="/dashboard/company/jobs/create">
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Job
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Projects */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <CardTitle className="text-gray-900 dark:text-white">Recent Projects</CardTitle>
                      </div>
                      <Link href="/dashboard/company/tenders">
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentTenders.length > 0 ? (
                      <div className="space-y-4">
                        {recentTenders.map((tender: Tender) => {
                          const statusConfig = getTenderStatusConfig(tender.status);
                          const categoryConfig = getTenderCategoryConfig(tender.tenderCategory);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <div key={tender._id} className={cn(
                              "group p-4 border rounded-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all",
                              "border-gray-200 dark:border-gray-700",
                              "bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg flex items-center justify-center">
                                      <categoryConfig.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        <Link href={`/dashboard/company/tender/${tender._id}`}>
                                          {tender.title}
                                        </Link>
                                      </h4>
                                      <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className={statusConfig.color}>
                                          <StatusIcon className="w-3 h-3 mr-1" />
                                          {statusConfig.label}
                                        </Badge>
                                        <Badge variant="outline" className={categoryConfig.color}>
                                          {categoryConfig.label}
                                        </Badge>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {new Date(tender.deadline).toLocaleDateString()}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                          <Users className="w-3 h-3 mr-1" />
                                          {tender.proposals?.length || 0} proposals
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{getTimeAgo(tender.createdAt)}</div>
                                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                    {formatTenderBudget(tender)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <ClipboardList className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Start by creating your first project tender</p>
                        <Link href="/dashboard/company/tender/create">
                          <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Project
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats with Verification Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Active Jobs</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.activeJobs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Draft Jobs</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.draftJobs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Closed Jobs</span>
                        <span className="font-bold text-gray-600 dark:text-gray-400">{stats.closedJobs}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Published</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{stats.publishedTenders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Draft</span>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.draftTenders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Closed</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.closedTenders}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Avg. Job Salary</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(stats.avgJobSalary, 'ETB')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Avg. Project Budget</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(stats.avgTenderBudget, 'USD')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Total Value</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(stats.totalBudgetValue, 'USD')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Details Card */}
                <Card className={cn(
                  "border-l-4 border-blue-500",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700"
                )}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Verification Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Profile Verified
                        </span>
                        <span className={`font-bold ${verificationData?.verificationDetails?.profileVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {verificationData?.verificationDetails?.profileVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          Documents Verified
                        </span>
                        <span className={`font-bold ${verificationData?.verificationDetails?.documentsVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {verificationData?.verificationDetails?.documentsVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Company Verified
                        </span>
                        <span className={`font-bold ${verificationData?.verificationDetails?.socialVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          {verificationData?.verificationDetails?.socialVerified ? 'Yes' : 'Partial'}
                        </span>
                      </div>
                      {verificationData?.verificationStatus !== 'full' && (
                        <Link href="/dashboard/company/verification" className="block">
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                            <Shield className="w-3 h-3 mr-1" />
                            Complete Verification
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Jobs Tab */}
            <TabsContent value="jobs" className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-white">All Job Postings ({stats.totalJobs})</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      {verificationData?.verificationStatus === 'full' && (
                        <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified Company
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {jobs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Job Title</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Status</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Applications</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Views</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Salary</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Created</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((job: Job) => (
                            <tr key={job._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3">
                                <Link href={`/dashboard/company/jobs/${job._id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                  {job.title}
                                </Link>
                              </td>
                              <td className="py-3">
                                <Badge variant="outline" className={getJobStatusConfig(job.status).color}>
                                  {getJobStatusConfig(job.status).label}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                  {job.applicationCount || 0}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center">
                                  <Eye className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                  {job.viewCount || 0}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {formatJobSalary(job)}
                                </div>
                              </td>
                              <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                                {getTimeAgo(job.createdAt)}
                              </td>
                              <td className="py-3">
                                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No jobs yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Start by creating your first job posting</p>
                      <Link href="/dashboard/company/jobs/create">
                        <Button size="lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Job
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-white">All Projects ({stats.totalTenders})</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tenders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Project Title</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Type</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Status</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Proposals</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Views</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Budget</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Deadline</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenders.map((tender: Tender) => (
                            <tr key={tender._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3">
                                <Link href={`/dashboard/company/tender/${tender._id}`} className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400">
                                  {tender.title}
                                </Link>
                              </td>
                              <td className="py-3">
                                <Badge variant="outline" className={getTenderCategoryConfig(tender.tenderCategory).color}>
                                  {getTenderCategoryConfig(tender.tenderCategory).label}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <Badge variant="outline" className={getTenderStatusConfig(tender.status).color}>
                                  {getTenderStatusConfig(tender.status).label}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                  {tender.proposals?.length || 0}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center">
                                  <Eye className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                  {tender.metadata?.views || 0}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {formatTenderBudget(tender)}
                                </div>
                              </td>
                              <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                                {new Date(tender.deadline).toLocaleDateString()}
                              </td>
                              <td className="py-3">
                                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ClipboardList className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Start by creating your first project tender</p>
                      <Link href="/dashboard/company/tender/create">
                        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Project
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Engagement Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Applications</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.totalJobApplications}</span>
                        </div>
                        <Progress value={(stats.totalJobApplications / Math.max(stats.totalEngagements, 1)) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Proposals</span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats.totalProposals}</span>
                        </div>
                        <Progress value={(stats.totalProposals / Math.max(stats.totalEngagements, 1)) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Views</span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatNumber(stats.totalJobViews + stats.totalTenderViews)}
                          </span>
                        </div>
                        <Progress value={Math.min(100, (stats.totalJobViews + stats.totalTenderViews) / 1000)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {stats.engagementRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</div>
                          </div>
                          <TrendingUp className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {stats.completionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                          </div>
                          <Award className="w-8 h-8 text-green-500 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {stats.totalOpportunities > 0
                                ? Math.round((stats.totalJobViews + stats.totalTenderViews) / stats.totalOpportunities)
                                : 0}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Views per Item</div>
                          </div>
                          <Eye className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600">
                      <Mail className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">Send Bulk Messages</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600">
                      <Download className="w-6 h-6 mb-2 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">Export Reports</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600">
                      <BarChart3 className="w-6 h-6 mb-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-700 dark:text-gray-300">Generate Insights</span>
                    </Button>
                    <Link href="/dashboard/company/verification">
                      <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center w-full border-gray-300 dark:border-gray-600">
                        <ShieldCheck className="w-6 h-6 mb-2 text-orange-600 dark:text-orange-400" />
                        <span className="text-gray-700 dark:text-gray-300">Verification Status</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Stats with Verification Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.activeJobs}</div>
                  <div className="text-blue-100">Active Jobs</div>
                </div>
                <Briefcase className="w-8 h-8 text-blue-200" />
              </div>
              <div className="mt-4 text-sm text-blue-200">
                {stats.draftJobs} in draft
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.publishedTenders}</div>
                  <div className="text-purple-100">Active Projects</div>
                </div>
                <ClipboardList className="w-8 h-8 text-purple-200" />
              </div>
              <div className="mt-4 text-sm text-purple-200">
                {stats.draftTenders} in draft
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalEngagements)}</div>
                  <div className="text-green-100">Total Engagements</div>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
              <div className="mt-4 text-sm text-green-200">
                {((stats.totalEngagements / stats.totalOpportunities) * 100).toFixed(1)}% engagement rate
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {verificationData?.verificationStatus === 'full' ? '100%' :
                      verificationData?.verificationStatus === 'partial' ? '50%' : '0%'}
                  </div>
                  <div className="text-indigo-100">Verification Score</div>
                </div>
                <ShieldCheck className="w-8 h-8 text-indigo-200" />
              </div>
              <div className="mt-4 text-sm text-indigo-200">
                {verificationData?.verificationStatus === 'full' ? 'Fully Verified' :
                  verificationData?.verificationStatus === 'partial' ? 'Partially Verified' : 'Not Verified'}
              </div>
              {verificationData?.verificationStatus !== 'full' && (
                <Link href="/dashboard/company/verification">
                  <Button
                    size="sm"
                    className="w-full mt-4 bg-white text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                  >
                    Improve Score
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDashboard;