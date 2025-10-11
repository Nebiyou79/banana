// pages/dashboard/organization/index.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
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
  Building2,
  MapPin,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const OrganizationDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [authLoading, setAuthLoading] = useState(true);

  console.log('[OrganizationDashboard] authLoading:', authLoading);

  // ✅ UPDATED: Use organization-specific service
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError 
  } = useQuery({
    queryKey: ['organizationJobs'],
    queryFn: async () => {
      const response = await jobService.getOrganizationJobs();
      console.log('[OrganizationDashboard] Organization Jobs API Response:', response);
      return response;
    },
    enabled: isAuthenticated && user?.role === 'organization',
  });

  useEffect(() => {
    if (isAuthenticated !== undefined) {
      setAuthLoading(false);
      console.log('[OrganizationDashboard] Authenticated as organization, fetching organization data');
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Safely extract jobs array from the response
  const jobs = jobsData?.data || [];

  console.log('[OrganizationDashboard] Processed jobs:', jobs);

  // Calculate stats from jobs data
  const stats = {
    totalOpportunities: jobs.length,
    activeOpportunities: jobs.filter((job: Job) => job.status === 'active').length,
    draftOpportunities: jobs.filter((job: Job) => job.status === 'draft').length,
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
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name || 'Organization'}! Here`s your projects overview.
              </p>
            </div>
            <Link href="/dashboard/organization/jobs/create">
              <button className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Opportunity
              </button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatNumber(stats.totalOpportunities)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-teal-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{stats.activeOpportunities} active</span>
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
                Across all opportunities
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
                Opportunity impressions
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Budget</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.avgSalary ? formatCurrency(stats.avgSalary) : 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Average project budget
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Opportunities */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Opportunities</h2>
                  <Link href="/dashboard/organization/jobs">
                    <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">
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
                    <div className="text-red-600 mb-2">Failed to load opportunities</div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-teal-600 hover:text-teal-700 text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : recentJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recentJobs.map((job: Job) => (
                      <div key={job._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                              <Link href={`/dashboard/organization/jobs/${job._id}`}>
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
                    <div className="text-gray-500 mb-4">No opportunities yet</div>
                    <Link href="/dashboard/organization/jobs/create">
                      <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                        Create Your First Opportunity
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
                  <Link href="/dashboard/organization/jobs/create">
                    <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Opportunity
                    </button>
                  </Link>
                  <Link href="/dashboard/organization/jobs">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                      <Target className="w-5 h-5 mr-2" />
                      Manage Opportunities
                    </button>
                  </Link>
                  <Link href="/dashboard/organization/profile">
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Organization Profile
                    </button>
                  </Link>
                </div>
              </div>

              {/* Opportunity Status Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Opportunities</span>
                    <span className="font-semibold text-green-600">{stats.activeOpportunities}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Draft Opportunities</span>
                    <span className="font-semibold text-yellow-600">{stats.draftOpportunities}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Closed Opportunities</span>
                    <span className="font-semibold text-red-600">{stats.totalOpportunities - stats.activeOpportunities - stats.draftOpportunities}</span>
                  </div>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">💡 Project Success Tips</h3>
                <ul className="space-y-2 text-sm text-teal-100">
                  <li>• Write clear project descriptions</li>
                  <li>• Set realistic project timelines</li>
                  <li>• Respond to applicants promptly</li>
                  <li>• Provide detailed requirements</li>
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
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        New application for <Link href={`/dashboard/organization/jobs/${job._id}`} className="text-teal-600 hover:text-teal-700">{job.title}</Link>
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
                  No recent activity. Create your first opportunity to get started!
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