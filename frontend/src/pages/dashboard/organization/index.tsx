/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job, Organization } from '@/services/jobService';
import { tenderService, Tender } from '@/services/tenderService';
import { organizationService } from '@/services/organizationService';
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
  Target,
  MapPin,
  Calendar,
  DollarSign,
  ClipboardList,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Heart,
  Award,
  Shield,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  MessageSquare,
  Mail,
  ShieldCheck,
  UserCheck,
  FileCheck,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import { useVerification } from '@/hooks/useVerification';
import { cn } from '@/lib/utils';

interface OrganizationDashboardStats {
  // Job Stats
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  volunteerJobs: number;
  internshipJobs: number;
  totalJobApplications: number;
  totalJobViews: number;

  // Tender Stats
  totalTenders: number;
  publishedTenders: number;
  draftTenders: number;
  freelanceTenders: number;
  professionalTenders: number;
  totalProposals: number;
  totalTenderViews: number;

  // Combined Stats
  totalOpportunities: number;
  totalEngagements: number;
  completionRate: number;
  impactScore: number;

  // Financial Stats (if applicable for organizations)
  avgBudget: number;
  totalSaved: number;
}

const OrganizationDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);

  const { verificationData, loading: verificationLoading } = useVerification();

  // Fetch organization profile
  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: async () => {
      try {
        const org = await organizationService.getMyOrganization();
        return org;
      } catch (error) {
        console.error('[OrganizationDashboard] Profile API Error:', error);
        return null;
      }
    },
    enabled: isAuthenticated && user?.role === 'organization',
  });

  // Fetch organization jobs
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['organizationJobs'],
    queryFn: async () => {
      try {
        const response = await jobService.getOrganizationJobs();
        return response;
      } catch (error) {
        console.error('[OrganizationDashboard] Jobs API Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && user?.role === 'organization',
  });

  // Fetch organization tenders
  const {
    data: tendersData,
    isLoading: tendersLoading,
    error: tendersError,
    refetch: refetchTenders
  } = useQuery({
    queryKey: ['organizationTenders'],
    queryFn: async () => {
      try {
        const tenders = await tenderService.getMyTenders();
        return tenders;
      } catch (error: any) {
        console.error('[OrganizationDashboard] Tenders API Error:', error);
        return [];
      }
    },
    enabled: isAuthenticated && user?.role === 'organization',
  });

  // Handle errors
  useEffect(() => {
    if (orgError) {
      toast({
        title: 'Failed to Load Profile',
        description: 'Unable to load organization profile.',
        variant: 'destructive',
      });
    }
  }, [orgError, toast]);

  useEffect(() => {
    if (jobsError) {
      toast({
        title: 'Failed to Load Jobs',
        description: 'Unable to load job postings.',
        variant: 'destructive',
      });
    }
  }, [jobsError, toast]);

  useEffect(() => {
    if (tendersError) {
      toast({
        title: 'Failed to Load Tenders',
        description: 'Unable to load tenders.',
        variant: 'destructive',
      });
    }
  }, [tendersError, toast]);

  useEffect(() => {
    if (organization) {
      setOrganizationData(organization);
    }
  }, [organization]);

  // Safely extract data
  const jobs = jobsData?.data || [];
  const tenders = tendersData || [];

  // Calculate dashboard statistics
  const calculateStats = (): OrganizationDashboardStats => {
    // Job calculations
    const activeJobs = jobs.filter((job: Job) => job.status === 'active').length;
    const draftJobs = jobs.filter((job: Job) => job.status === 'draft').length;
    const volunteerJobs = jobs.filter((job: Job) => job.opportunityType === 'volunteer').length;
    const internshipJobs = jobs.filter((job: Job) => job.opportunityType === 'internship').length;
    const totalJobApplications = jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0);
    const totalJobViews = jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0);

    // Tender calculations
    const publishedTenders = tenders.filter((tender: Tender) => tender.status === 'published').length;
    const draftTenders = tenders.filter((tender: Tender) => tender.status === 'draft').length;
    const freelanceTenders = tenders.filter((tender: Tender) => tender.tenderCategory === 'freelance').length;
    const professionalTenders = tenders.filter((tender: Tender) => tender.tenderCategory === 'professional').length;
    const totalProposals = tenders.reduce((sum: number, tender: Tender) => sum + (tender.proposals?.length || 0), 0);
    const totalTenderViews = tenders.reduce((sum: number, tender: Tender) => sum + (tender.metadata?.views || 0), 0);

    // Calculate total saved count
    const totalSaved = tenders.reduce((sum: number, tender: Tender) =>
      sum + (tender.metadata?.savedBy?.length || 0), 0
    );

    // Average budget calculation
    const avgBudget = tenders.length > 0
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

    // Combined stats
    const totalOpportunities = jobs.length + tenders.length;
    const totalEngagements = totalJobApplications + totalProposals;
    const closedTenders = tenders.filter((tender: Tender) =>
      ['closed', 'revealed'].includes(tender.status)
    ).length;
    const completionRate = tenders.length > 0
      ? (closedTenders / tenders.length) * 100
      : 0;

    // Impact score (weighted calculation)
    const impactScore = Math.min(100,
      (totalEngagements * 0.4) +
      ((totalJobViews + totalTenderViews) * 0.2) +
      (completionRate * 0.4)
    );

    return {
      totalJobs: jobs.length,
      activeJobs,
      draftJobs,
      volunteerJobs,
      internshipJobs,
      totalJobApplications,
      totalJobViews,
      totalTenders: tenders.length,
      publishedTenders,
      draftTenders,
      freelanceTenders,
      professionalTenders,
      totalProposals,
      totalTenderViews,
      totalOpportunities,
      totalEngagements,
      completionRate,
      impactScore,
      avgBudget,
      totalSaved
    };
  };

  const stats = calculateStats();

  // Formatting functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
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

  // Status helpers with dark mode support
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
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getJobTypeConfig = (type: string) => {
    const configs = {
      job: {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
        icon: Briefcase,
        label: 'Job'
      },
      volunteer: {
        color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
        icon: Heart,
        label: 'Volunteer'
      },
      internship: {
        color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
        icon: Award,
        label: 'Internship'
      },
      training: {
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
        icon: Target,
        label: 'Training'
      },
    };
    return configs[type as keyof typeof configs] || configs.job;
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
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getTenderCategoryConfig = (category: string) => {
    return category === 'freelance'
      ? {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
        icon: Users,
        label: 'Freelance'
      }
      : {
        color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
        icon: Briefcase,
        label: 'Professional'
      };
  };

  const formatJobSalary = (job: Job): string => {
    if (!job.salary) {
      if (job.opportunityType === 'volunteer') return 'Volunteer';
      if (job.opportunityType === 'internship') return 'Stipend';
      return 'Negotiable';
    }
    const { min, max, currency = 'USD' } = job.salary;
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
  if (orgLoading || jobsLoading || tendersLoading) {
    return (
      <DashboardLayout requiredRole="organization">
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
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-teal-50 dark:from-gray-900 dark:to-teal-950/10 transition-colors duration-200">
        {/* Header with Organization Info */}
        <div className={cn(
          "border-b bg-white dark:bg-gray-900",
          "border-gray-200 dark:border-gray-800"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-teal-100 dark:border-teal-900">
                  <AvatarImage src={organizationData?.logoFullUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-xl">
                    {organizationData?.name?.charAt(0) || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {organizationData?.name || 'Organization'} Dashboard
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
                    {organizationData?.mission || 'Manage your opportunities and create impact'}
                  </p>

                  {/* Verification Status Info */}
                  {verificationData && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Trust Level: </span>
                        <span className={cn(
                          "font-bold",
                          verificationData.verificationStatus === 'full' ? 'text-green-600 dark:text-green-400' :
                            verificationData.verificationStatus === 'partial' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                        )}>
                          {verificationData.verificationStatus === 'full' ? 'Verified Partner' :
                            verificationData.verificationStatus === 'partial' ? 'Trusted' : 'New Organization'}
                        </span>
                      </div>
                      {verificationData.verificationStatus !== 'full' && (
                        <Link href="/dashboard/organization/verification">
                          <Button variant="outline" size="sm" className="border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Complete Verification
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    refetchJobs();
                    refetchTenders();
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/dashboard/organization/jobs/create">
                  <Button className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Opportunity
                  </Button>
                </Link>
                <Link href="/dashboard/organization/tender/create">
                  <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tender
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Impact Score and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Impact Score Card */}
            <Card className="lg:col-span-1 border-0 shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-teal-100 dark:text-teal-200">Impact Score</div>
                    <div className="text-4xl font-bold mt-1">{stats.impactScore.toFixed(0)}</div>
                  </div>
                  <div className="w-16 h-16 relative">
                    <div className="w-full h-full rounded-full border-4 border-teal-300 dark:border-teal-400 flex items-center justify-center">
                      <span className="text-2xl font-bold">{stats.impactScore.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-teal-100 dark:text-teal-200">Engagement</span>
                    <span className="font-bold">{formatNumber(stats.totalEngagements)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-teal-100 dark:text-teal-200">Completion</span>
                    <span className="font-bold">{stats.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-teal-100 dark:text-teal-200">Reach</span>
                    <span className="font-bold">{formatNumber(stats.totalJobViews + stats.totalTenderViews)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opportunities Stats */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className={cn(
                "border shadow-sm hover:shadow-md transition-shadow",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Opportunities</div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatNumber(stats.totalOpportunities)}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${Math.min(100, (stats.activeJobs + stats.publishedTenders) / stats.totalOpportunities * 100)}%` }}
                      />
                    </div>
                    <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                      {stats.activeJobs + stats.publishedTenders} active
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "border shadow-sm hover:shadow-md transition-shadow",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Engagements</div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatNumber(stats.totalEngagements)}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {stats.totalJobApplications} applications + {stats.totalProposals} proposals
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status Card */}
              <Card className={cn(
                "border shadow-sm hover:shadow-md transition-shadow border-l-4 border-teal-500",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Verification Status</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {verificationData ?
                          verificationData.verificationStatus === 'full' ? 'Verified' :
                            verificationData.verificationStatus === 'partial' ? 'Partial' : 'Pending'
                          : 'Loading...'
                        }
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    {!verificationLoading && (
                      <VerificationBadge
                        status={verificationData?.verificationStatus || 'none'}
                        size="sm"
                        showText={true}
                        showTooltip={false}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Overview
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Opportunities ({stats.totalJobs})
              </TabsTrigger>
              <TabsTrigger value="tenders" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Tenders ({stats.totalTenders})
              </TabsTrigger>
              <TabsTrigger value="impact" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
                Impact Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Opportunities */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <CardTitle className="text-gray-900 dark:text-white">Recent Opportunities</CardTitle>
                      </div>
                      <Link href="/dashboard/organization/jobs">
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
                          const typeConfig = getJobTypeConfig(job.opportunityType || 'job');
                          const StatusIcon = statusConfig.icon;

                          return (
                            <div key={job._id} className={cn(
                              "group p-4 border rounded-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all",
                              "border-gray-200 dark:border-gray-700",
                              "bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 rounded-lg flex items-center justify-center">
                                      <typeConfig.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                        <Link href={`/dashboard/organization/jobs/${job._id}`}>
                                          {job.title}
                                        </Link>
                                      </h4>
                                      <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className={statusConfig.color}>
                                          <StatusIcon className="w-3 h-3 mr-1" />
                                          {statusConfig.label}
                                        </Badge>
                                        <Badge variant="outline" className={typeConfig.color}>
                                          {typeConfig.label}
                                        </Badge>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                          <MapPin className="w-3 h-3 mr-1" />
                                          {job.location?.city}
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No opportunities yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Create jobs, volunteer positions, or internships</p>
                        <Link href="/dashboard/organization/jobs/create">
                          <Button className="bg-gradient-to-r from-teal-600 to-teal-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Opportunity
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Tenders */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <CardTitle className="text-gray-900 dark:text-white">Recent Tenders</CardTitle>
                      </div>
                      <Link href="/dashboard/organization/tenders">
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
                              "group p-4 border rounded-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all",
                              "border-gray-200 dark:border-gray-700",
                              "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg flex items-center justify-center">
                                      <categoryConfig.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        <Link href={`/dashboard/organization/tender/${tender._id}`}>
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tenders yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Create freelance or professional tenders</p>
                        <Link href="/dashboard/organization/tender/create">
                          <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Tender
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats with Verification Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.volunteerJobs}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Volunteer Positions</div>
                      </div>
                      <Heart className="w-8 h-8 text-blue-400 dark:text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.internshipJobs}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Internships</div>
                      </div>
                      <Award className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.freelanceTenders}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Freelance Projects</div>
                      </div>
                      <Users className="w-8 h-8 text-teal-400 dark:text-teal-500" />
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Details Card */}
                <Card className={cn(
                  "border-l-4 border-teal-500",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Verification</div>
                      {!verificationLoading && (
                        <VerificationBadge
                          status={verificationData?.verificationStatus || 'none'}
                          size="sm"
                          showText={false}
                          showTooltip={true}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Profile</span>
                        <span className={`font-bold ${verificationData?.verificationDetails?.profileVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {verificationData?.verificationDetails?.profileVerified ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Documents</span>
                        <span className={`font-bold ${verificationData?.verificationDetails?.documentsVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {verificationData?.verificationDetails?.documentsVerified ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Social</span>
                        <span className={`font-bold ${verificationData?.verificationDetails?.socialVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {verificationData?.verificationDetails?.socialVerified ? '✓' : '○'}
                        </span>
                      </div>
                    </div>
                    {verificationData?.verificationStatus !== 'full' && (
                      <Link href="/dashboard/organization/verification" className="block mt-4">
                        <Button size="sm" className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Complete Verification
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-white">All Opportunities ({stats.totalJobs})</CardTitle>
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
                          Verified Organization
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
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Opportunity</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Type</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Status</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Applications</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Views</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Compensation</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((job: Job) => {
                            const typeConfig = getJobTypeConfig(job.opportunityType || 'job');

                            return (
                              <tr key={job._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                                <td className="py-3">
                                  <Link href={`/dashboard/organization/jobs/${job._id}`} className="font-medium text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400">
                                    {job.title}
                                  </Link>
                                </td>
                                <td className="py-3">
                                  <Badge variant="outline" className={typeConfig.color}>
                                    {typeConfig.label}
                                  </Badge>
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No opportunities yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first opportunity to get started</p>
                      <Link href="/dashboard/organization/jobs/create">
                        <Button size="lg" className="bg-gradient-to-r from-teal-600 to-teal-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Opportunity
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tenders Tab */}
            <TabsContent value="tenders" className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-white">All Tenders ({stats.totalTenders})</CardTitle>
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
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Tender Title</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Category</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Status</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Proposals</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Views</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Budget</th>
                            <th className="py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300">Deadline</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenders.map((tender: Tender) => (
                            <tr key={tender._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                              <td className="py-3">
                                <Link href={`/dashboard/organization/tender/${tender._id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ClipboardList className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tenders yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first tender to find partners</p>
                      <Link href="/dashboard/organization/tender/create">
                        <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-indigo-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Tender
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Impact Analytics Tab */}
            <TabsContent value="impact" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Engagement Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Opportunity Applications</span>
                          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{stats.totalJobApplications}</span>
                        </div>
                        <Progress value={(stats.totalJobApplications / Math.max(stats.totalEngagements, 1)) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tender Proposals</span>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.totalProposals}</span>
                        </div>
                        <Progress value={(stats.totalProposals / Math.max(stats.totalEngagements, 1)) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Reach</span>
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
                    <CardTitle className="text-gray-900 dark:text-white">Verification Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                              {verificationData?.verificationStatus === 'full' ? '100%' :
                                verificationData?.verificationStatus === 'partial' ? '50%' : '0%'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Verification Score</div>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-teal-500 dark:text-teal-400" />
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {verificationData?.verificationStatus === 'full' ? '3x' :
                                verificationData?.verificationStatus === 'partial' ? '2x' : '1x'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Engagement Boost</div>
                          </div>
                          <TrendingUp className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {verificationData?.verificationStatus === 'full' ? 'High' :
                                verificationData?.verificationStatus === 'partial' ? 'Medium' : 'Low'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Trust Level</div>
                          </div>
                          <Award className="w-8 h-8 text-green-500 dark:text-green-400" />
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
                      <Mail className="w-6 h-6 mb-2 text-teal-600 dark:text-teal-400" />
                      <span className="text-gray-700 dark:text-gray-300">Send Updates</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600">
                      <Download className="w-6 h-6 mb-2 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-gray-700 dark:text-gray-300">Export Impact Report</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600">
                      <BarChart3 className="w-6 h-6 mb-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-gray-700 dark:text-gray-300">View Analytics</span>
                    </Button>
                    <Link href="/dashboard/organization/verification">
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

          {/* Bottom Impact Cards with Verification */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.volunteerJobs + stats.internshipJobs}</div>
                  <div className="text-teal-100 dark:text-teal-200">Impact Opportunities</div>
                </div>
                <Heart className="w-8 h-8 text-teal-200 dark:text-teal-300" />
              </div>
              <div className="mt-4 text-sm text-teal-200 dark:text-teal-300">
                {stats.volunteerJobs} volunteer + {stats.internshipJobs} internship positions
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.publishedTenders}</div>
                  <div className="text-indigo-100 dark:text-indigo-200">Active Tenders</div>
                </div>
                <ClipboardList className="w-8 h-8 text-indigo-200 dark:text-indigo-300" />
              </div>
              <div className="mt-4 text-sm text-indigo-200 dark:text-indigo-300">
                {stats.freelanceTenders} freelance + {stats.professionalTenders} professional
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatNumber(stats.totalEngagements)}</div>
                  <div className="text-green-100 dark:text-green-200">Total Impact</div>
                </div>
                <Users className="w-8 h-8 text-green-200 dark:text-green-300" />
              </div>
              <div className="mt-4 text-sm text-green-200 dark:text-green-300">
                People engaged through your opportunities
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {verificationData?.verificationStatus === 'full' ? 'Verified' :
                      verificationData?.verificationStatus === 'partial' ? 'Partial' : 'Pending'}
                  </div>
                  <div className="text-amber-100 dark:text-amber-200">Verification Status</div>
                </div>
                <ShieldCheck className="w-8 h-8 text-amber-200 dark:text-amber-300" />
              </div>
              <div className="mt-4 text-sm text-amber-200 dark:text-amber-300">
                {verificationData?.verificationMessage || 'Complete verification for better trust'}
              </div>
              {verificationData?.verificationStatus !== 'full' && (
                <Link href="/dashboard/organization/verification">
                  <Button
                    size="sm"
                    className="w-full mt-4 bg-white text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:bg-white dark:hover:bg-amber-100"
                  >
                    Improve Verification
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

export default OrganizationDashboard;