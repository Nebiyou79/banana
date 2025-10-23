/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/index.tsx - UPDATED
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { TenderService } from '@/services/tenderService';
import { organizationService } from '@/services/organizationService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { 
  Target, 
  Users, 
  Eye, 
  TrendingUp, 
  Plus,
  FileText,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { handleApiError } from '@/utils/apiErrorHandler';

const OrganizationDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Fetch organization profile
  const { 
    data: organization, 
    isLoading: orgLoading 
  } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: () => organizationService.getMyOrganization(),
    enabled: isAuthenticated && user?.role === 'organization',
  });

  // Fetch organization jobs with error handling
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError 
  } = useQuery({
    queryKey: ['organizationJobs'],
    queryFn: async () => {
      try {
        const response = await jobService.getOrganizationJobs();
        return response;
      } catch (error: any) {
        // Error is handled by the service layer
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: isAuthenticated && user?.role === 'organization',
  });

  // Fetch organization tenders with error handling
  const { 
    data: tendersData, 
    isLoading: tendersLoading, 
    error: tendersError 
  } = useQuery({
    queryKey: ['organizationTenders'],
    queryFn: async () => {
      try {
        const response = await TenderService.getMyOrganizationTenders();
        return response;
      } catch (error: any) {
        // Error is handled by the service layer
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: isAuthenticated && user?.role === 'organization',
  });

  // Show loading state
  if (orgLoading || jobsLoading || tendersLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Safely extract data from responses
  const jobs = jobsData?.data || [];
  const tenders = tendersData?.data?.tenders || [];
  
  const recentJobs = Array.isArray(jobs) ? jobs.slice(0, 3) : [];
  const recentTenders = Array.isArray(tenders) ? tenders.slice(0, 3) : [];

  // Calculate stats for jobs
  const jobStats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job: any) => job.status === 'active').length,
    draftJobs: jobs.filter((job: any) => job.status === 'draft').length,
    totalJobApplications: jobs.reduce((sum: number, job: any) => sum + (job.applicationCount || 0), 0),
    totalJobViews: jobs.reduce((sum: number, job: any) => sum + (job.viewCount || 0), 0),
  };

  // Calculate stats for tenders
  const tenderStats = {
    totalTenders: tenders.length,
    publishedTenders: tenders.filter((tender: any) => tender.status === 'published').length,
    draftTenders: tenders.filter((tender: any) => tender.status === 'draft').length,
    totalProposals: tenders.reduce((sum: number, tender: any) => sum + (tender.proposals?.length || 0), 0),
    totalTenderViews: tenders.reduce((sum: number, tender: any) => sum + (tender.metadata?.views || 0), 0),
  };

  // Combined stats
  const totalOpportunities = jobStats.totalJobs + tenderStats.totalTenders;
  const totalApplications = jobStats.totalJobApplications + tenderStats.totalProposals;
  const totalViews = jobStats.totalJobViews + tenderStats.totalTenderViews;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getJobStatusConfig = (status: string) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      draft: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      closed: { color: 'bg-red-100 text-red-800 border-red-200', icon: Clock },
      paused: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getTenderStatusConfig = (status: string) => {
    const configs = {
      published: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      draft: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: FileText },
      completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: Clock },
      open: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Target },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {organization?.name || 'Organization'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your jobs, tenders, and track all opportunities.
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex gap-3">
              <Link href="/dashboard/organization/jobs/create">
                <button className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create Job</span>
                </button>
              </Link>
              <Link href="/dashboard/organization/tenders/create">
                <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create Tender</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Combined Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(totalOpportunities)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-teal-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{jobStats.activeJobs + tenderStats.publishedTenders} active</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(totalApplications)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {jobStats.totalJobApplications} job apps + {tenderStats.totalProposals} proposals
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(totalViews)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Across all opportunities
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(jobStats.draftJobs + tenderStats.draftTenders)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Ready to publish
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Jobs Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Jobs</h3>
                  <p className="text-sm text-gray-600">{jobStats.totalJobs} total opportunities</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">{jobStats.activeJobs}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{jobStats.draftJobs}</div>
                  <div className="text-sm text-gray-600">Draft</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(jobStats.totalJobApplications)}</div>
                  <div className="text-sm text-gray-600">Applications</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(jobStats.totalJobViews)}</div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
              </div>
            </div>

            {/* Tenders Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tenders</h3>
                  <p className="text-sm text-gray-600">{tenderStats.totalTenders} total opportunities</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{tenderStats.publishedTenders}</div>
                  <div className="text-sm text-gray-600">Published</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{tenderStats.draftTenders}</div>
                  <div className="text-sm text-gray-600">Draft</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(tenderStats.totalProposals)}</div>
                  <div className="text-sm text-gray-600">Proposals</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(tenderStats.totalTenderViews)}</div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Jobs */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
                <Link href="/dashboard/organization/jobs">
                  <button className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center space-x-1">
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {jobsError ? (
                <div className="text-center py-4">
                  <div className="text-red-600 mb-2">Failed to load jobs</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {recentJobs.map((job: any) => {
                    const statusConfig = getJobStatusConfig(job.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div key={job._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200 group">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors text-sm">
                              <Link href={`/dashboard/organization/jobs/${job._id}`}>
                                {job.title}
                              </Link>
                            </h3>
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            {job.location && typeof job.location === 'object' && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {[job.location.city, job.location.subCity, job.location.country]
                                    .filter(Boolean)
                                    .join(', ')}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{job.applicationCount || 0} applications</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                            {getTimeAgo(job.createdAt)}
                          </div>
                          {job.salary && (
                            <div className="text-xs font-medium text-gray-900">
                              {jobService.formatSalary(job.salary)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-500 mb-3">No jobs created yet</div>
                  <Link href="/dashboard/organization/jobs/create">
                    <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold flex items-center space-x-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      <span>Create Job</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Tenders */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Tenders</h2>
                <Link href="/dashboard/organization/tenders">
                  <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1">
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {tendersError ? (
                <div className="text-center py-4">
                  <div className="text-red-600 mb-2">Failed to load tenders</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : recentTenders.length > 0 ? (
                <div className="space-y-4">
                  {recentTenders.map((tender: any) => {
                    const statusConfig = getTenderStatusConfig(tender.status);
                    const StatusIcon = statusConfig.icon;
                    const daysRemaining = getDaysRemaining(tender.deadline);
                    const isExpired = daysRemaining < 0;
                    
                    return (
                      <div key={tender._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 group">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm">
                              <Link href={`/dashboard/organization/tenders/${tender._id}`}>
                                {tender.title}
                              </Link>
                            </h3>
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            {tender.budget && (
                              <span className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>
                                  {formatCurrency(tender.budget.min, tender.budget.currency)}
                                  {tender.budget.max > tender.budget.min && ` - ${formatCurrency(tender.budget.max, tender.budget.currency)}`}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{tender.proposals?.length || 0} proposals</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{isExpired ? 'Expired' : `${daysRemaining}d left`}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                            {getTimeAgo(tender.createdAt)}
                          </div>
                          {tender.category && (
                            <div className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded capitalize">
                              {tender.category.replace('_', ' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-500 mb-3">No tenders created yet</div>
                  <Link href="/dashboard/organization/tenders/create">
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold flex items-center space-x-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      <span>Create Tender</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDashboard;