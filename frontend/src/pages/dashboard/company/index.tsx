import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { 
  Briefcase, 
  Users, 
  Eye, 
  TrendingUp, 
  Calendar,
  Plus,
  FileText,
  Building2,
  MapPin,
  Clock
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const CompanyDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [authLoading, setAuthLoading] = useState(true);

  console.log('[CompanyDashboard] authLoading:', authLoading);

  // Fetch company jobs with proper typing
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError 
  } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: async () => {
      const response = await jobService.getCompanyJobs();
      console.log('[CompanyDashboard] Jobs API Response:', response);
      return response;
    },
    enabled: isAuthenticated && user?.role === 'company',
  });

  useEffect(() => {
    if (isAuthenticated !== undefined) {
      setAuthLoading(false);
      console.log('[CompanyDashboard] Authenticated as company, fetching company data');
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

  // Safely extract jobs array from the response
  const jobs = jobsData?.data || [];

  console.log('[CompanyDashboard] Processed jobs:', jobs);

  // Calculate stats from jobs data
  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job: Job) => job.status === 'active').length,
    draftJobs: jobs.filter((job: Job) => job.status === 'draft').length,
    totalApplications: jobs.reduce((sum: number, job: Job) => sum + (job.applicationCount || 0), 0),
    totalViews: jobs.reduce((sum: number, job: Job) => sum + (job.viewCount || 0), 0),
    avgSalary: 0 // You can calculate this if needed
  };

  // Recent jobs - safely handle the jobs array
  const recentJobs = Array.isArray(jobs) ? jobs.slice(0, 5) : [];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
                Welcome back, {user?.name || 'Company'}! Here`s your hiring overview.
              </p>
            </div>
            <Link href="/dashboard/company/jobs/create">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Job
              </button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalJobs)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{stats.activeJobs} active</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalApplications)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Across all job postings
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalViews)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Job posting impressions
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.avgSalary ? formatCurrency(stats.avgSalary) : 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Average offered salary
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
                      onClick={() => window.location.reload()}
                      className="text-blue-600 hover:text-blue-700 text-sm"
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
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              {job.company.name}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location.city}, {job.location.region}
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
                            {jobService.formatSalary(job.salary)}
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
            </div>

            {/* Quick Actions & Insights */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/dashboard/company/jobs/create">
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Job
                    </button>
                  </Link>
                  <Link href="/dashboard/company/jobs">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Manage Jobs
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

              {/* Job Status Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Jobs</span>
                    <span className="font-semibold text-green-600">{stats.activeJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Draft Jobs</span>
                    <span className="font-semibold text-yellow-600">{stats.draftJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Closed Jobs</span>
                    <span className="font-semibold text-red-600">{stats.totalJobs - stats.activeJobs - stats.draftJobs}</span>
                  </div>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">💡 Hiring Tips</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• Write clear job descriptions</li>
                  <li>• Set competitive salaries</li>
                  <li>• Respond to applicants quickly</li>
                  <li>• Use featured listings for better visibility</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job: Job) => (
                  <div key={job._id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        New application for <Link href={`/dashboard/company/jobs/${job._id}`} className="text-blue-600 hover:text-blue-700">{job.title}</Link>
                      </p>
                      <p className="text-sm text-gray-600">
                        {job.applicationCount || 0} total applications • {getTimeAgo(job.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent activity. Create your first job to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDashboard;