// components/dashboard/CompanyDashboard.tsx - UPDATED WITH TOAST ERROR HANDLING
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { TenderService, Tender } from '@/services/tenderService';
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
  FileText,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  FolderOpen,
  ClipboardList
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';

// Define proper types for salary and budget
interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
}

interface TenderBudget {
  min?: number;
  max?: number;
  currency?: string;
  isNegotiable?: boolean;
}

const CompanyDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch company jobs
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError 
  } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: async () => {
      try {
        const response = await jobService.getCompanyJobs();
        console.log('[CompanyDashboard] Jobs API Response:', response);
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
    error: tendersError 
  } = useQuery({
    queryKey: ['companyTenders'],
    queryFn: async () => {
      try {
        const response = await TenderService.getMyTenders();
        console.log('[CompanyDashboard] Tenders API Response:', response);
        return response;
      } catch (error) {
        console.error('[CompanyDashboard] Tenders API Error:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && user?.role === 'company',
  });

  // Handle errors with toast notifications
  useEffect(() => {
    if (jobsError) {
      toast({
        title: 'Failed to Load Jobs',
        description: 'Unable to load your job postings. Please try again.',
        variant: 'destructive',
      });
    }
  }, [jobsError, toast]);

  useEffect(() => {
    if (tendersError) {
      toast({
        title: 'Failed to Load Projects',
        description: 'Unable to load your projects. Please try again.',
        variant: 'destructive',
      });
    }
  }, [tendersError, toast]);

  useEffect(() => {
    if (isAuthenticated !== undefined) {
      setAuthLoading(false);
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Safely extract data from responses
  const jobs = jobsData?.data || [];
  const tenders = tendersData?.data?.tenders || [];

  // Fixed salary calculation with proper type handling
  const calculateAvgSalary = (jobs: Job[]): number => {
    if (jobs.length === 0) return 0;
    
    const total = jobs.reduce((sum: number, job: Job) => {
      const minSalary = job.salary?.min || 0;
      const maxSalary = job.salary?.max || 0;
      const avgSalary = minSalary > 0 && maxSalary > 0 ? (minSalary + maxSalary) / 2 : minSalary || maxSalary || 0;
      return sum + avgSalary;
    }, 0);
    
    return total / jobs.length;
  };

  // Fixed budget calculation with proper type handling
  const calculateAvgBudget = (tenders: Tender[]): number => {
    if (tenders.length === 0) return 0;
    
    const total = tenders.reduce((sum: number, tender: Tender) => {
      const minBudget = tender.budget?.min || 0;
      const maxBudget = tender.budget?.max || 0;
      const avgBudget = minBudget > 0 && maxBudget > 0 ? (minBudget + maxBudget) / 2 : minBudget || maxBudget || 0;
      return sum + avgBudget;
    }, 0);
    
    return total / tenders.length;
  };

  // Calculate combined stats
  const stats = {
    // Job stats
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job: Job) => job.status === 'active').length,
    draftJobs: jobs.filter((job: Job) => job.status === 'draft').length,
    totalApplications: jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0),
    totalJobViews: jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0),
    avgSalary: calculateAvgSalary(jobs),

    // Tender stats
    totalTenders: tenders.length,
    activeTenders: tenders.filter((tender: Tender) => tender.status === 'published' || tender.status === 'open').length,
    draftTenders: tenders.filter((tender: Tender) => tender.status === 'draft').length,
    completedTenders: tenders.filter((tender: Tender) => tender.status === 'completed').length,
    cancelledTenders: tenders.filter((tender: Tender) => tender.status === 'cancelled').length,
    totalProposals: tenders.reduce((sum: number, tender: Tender) => sum + (tender.proposals?.length || 0), 0),
    totalTenderViews: tenders.reduce((sum: number, tender: Tender) => sum + (tender.metadata?.views || 0), 0),
    avgBudget: calculateAvgBudget(tenders),

    // Combined stats
    totalOpportunities: jobs.length + tenders.length,
    totalEngagements: (jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0)) + 
                     (tenders.reduce((sum: number, tender: Tender) => sum + (tender.proposals?.length || 0), 0))
  };

  // Recent items
  const recentJobs = Array.isArray(jobs) ? jobs.slice(0, 3) : [];
  const recentTenders = Array.isArray(tenders) ? tenders.slice(0, 3) : [];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number, currency: string = 'ETB') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTenderStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'open': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTenderStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Published';
      case 'open': return 'Open';
      case 'draft': return 'Draft';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Fixed budget formatting with proper type handling
  const formatBudget = (budget: TenderBudget | undefined) => {
    if (!budget) return 'Negotiable';
    const min = budget.min || 0;
    const max = budget.max || 0;
    const currency = budget.currency || 'ETB';
    
    if (min === 0 && max === 0) return 'Negotiable';
    if (min > 0 && max > 0) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
    if (min > 0) return `From ${formatCurrency(min, currency)}`;
    if (max > 0) return `Up to ${formatCurrency(max, currency)}`;
    
    return 'Negotiable';
  };

  // Fixed salary formatting with proper type handling
  const formatSalary = (salary: JobSalary | undefined) => {
    if (!salary) return 'Negotiable';
    const min = salary.min || 0;
    const max = salary.max || 0;
    const currency = salary.currency || 'ETB';
    
    if (min === 0 && max === 0) return 'Negotiable';
    if (min > 0 && max > 0) return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
    if (min > 0) return `From ${formatCurrency(min, currency)}`;
    if (max > 0) return `Up to ${formatCurrency(max, currency)}`;
    
    return 'Negotiable';
  };

  const handleRetryJobs = () => {
    window.location.reload();
  };

  const handleRetryTenders = () => {
    window.location.reload();
  };

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name || 'Company'}! Manage your hiring and projects.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard/company/jobs/create">
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Job
                </button>
              </Link>
              <Link href="/dashboard/company/tenders/create">
                <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project
                </button>
              </Link>
            </div>
          </div>

          {/* Combined Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalOpportunities)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{stats.activeJobs + stats.activeTenders} active</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Engagements</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalEngagements)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Applications & proposals
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalJobViews + stats.totalTenderViews)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Combined impressions
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.activeJobs)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {stats.totalJobs} total jobs
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Jobs */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Job Postings</h2>
                  <Link href="/dashboard/company/jobs">
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View All
                    </button>
                  </Link>
                </div>

                {jobsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : jobsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-2">Failed to load jobs</div>
                    <button 
                      onClick={handleRetryJobs}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : recentJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recentJobs.map((job: Job) => (
                      <div key={job._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              <Link href={`/dashboard/company/jobs/${job._id}`}>
                                {job.title}
                              </Link>
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(job.status)}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              {job.company?.name || 'Your Company'}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location?.city}, {job.location?.region}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {job.applicationCount || 0} applications
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">
                            {getTimeAgo(job.createdAt)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatSalary(job.salary)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">No job postings yet</div>
                    <Link href="/dashboard/company/jobs/create">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Create Your First Job
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Recent Projects */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
                  <Link href="/dashboard/company/tenders">
                    <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      View All
                    </button>
                  </Link>
                </div>

                {tendersLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : tendersError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-2">Failed to load projects</div>
                    <button 
                      onClick={handleRetryTenders}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : recentTenders.length > 0 ? (
                  <div className="space-y-4">
                    {recentTenders.map((tender: Tender) => (
                      <div key={tender._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                              <Link href={`/dashboard/company/tenders/${tender._id}`}>
                                {tender.title}
                              </Link>
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTenderStatusColor(tender.status)}`}>
                              {getTenderStatusText(tender.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatBudget(tender.budget)}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(tender.deadline).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {tender.proposals?.length || 0} proposals
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">
                            {getTimeAgo(tender.createdAt)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {tender.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">No projects yet</div>
                    <Link href="/dashboard/company/tenders/create">
                      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Create Your First Project
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Insights */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-col space-y-3">
                  <Link href="/dashboard/company/jobs/create">
                    <Button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Job
                    </Button>
                  </Link>

                  <Link href="/dashboard/company/tenders/create">
                    <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Project
                    </button>
                  </Link>

                  <Link href="/dashboard/company/jobs">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Manage Jobs
                    </button>
                  </Link>

                  <Link href="/dashboard/company/tenders">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 mr-2" />
                      Manage Projects
                    </button>
                  </Link>

                  <Link href="/dashboard/company/profile">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Company Profile
                    </button>
                  </Link>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Jobs</span>
                      <span className="font-semibold text-blue-600">{stats.totalJobs}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Active: {stats.activeJobs}</span>
                      <span>Draft: {stats.draftJobs}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Projects</span>
                      <span className="font-semibold text-purple-600">{stats.totalTenders}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Active: {stats.activeTenders}</span>
                      <span>Draft: {stats.draftTenders}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Status */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Projects</span>
                    <span className="font-semibold text-green-600">{stats.activeTenders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Draft Projects</span>
                    <span className="font-semibold text-yellow-600">{stats.draftTenders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold text-blue-600">{stats.completedTenders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cancelled</span>
                    <span className="font-semibold text-red-600">{stats.cancelledTenders}</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">💡 Quick Tips</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• Post clear job descriptions</li>
                  <li>• Set realistic project budgets</li>
                  <li>• Respond to applicants quickly</li>
                  <li>• Review proposals promptly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDashboard;