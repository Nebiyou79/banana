/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BriefcaseIcon, 
  UserIcon, 
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dashboardService, DashboardStats, Activity } from '@/services/dashboardService';

const FreelancerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    portfolioItems: 0,
    profileCompleteness: 0,
    activeProposals: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsData, activitiesData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getActivities()
        ]);

        setStats(statsData);
        setActivities(activitiesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const statsCards = [
    {
      title: 'Portfolio Items',
      value: stats.portfolioItems.toString(),
      change: stats.portfolioItems > 0 ? '+2 today' : 'Add your first',
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Profile Completeness',
      value: `${stats.profileCompleteness}%`,
      change: stats.profileCompleteness > 0 ? 
        `${Math.max(0, stats.profileCompleteness - 5)}% → ${stats.profileCompleteness}%` : 
        'Start building',
      icon: UserIcon,
      color: stats.profileCompleteness >= 80 ? 'text-green-600' : 
             stats.profileCompleteness >= 50 ? 'text-yellow-600' : 'text-red-600',
      bgColor: stats.profileCompleteness >= 80 ? 'bg-green-50' : 
               stats.profileCompleteness >= 50 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Active Proposals',
      value: stats.activeProposals.toString(),
      change: stats.activeProposals > 0 ? '+1 new' : 'No active proposals',
      icon: DocumentTextIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const quickActions = [
    {
      title: 'Update Profile',
      description: 'Complete your professional profile',
      icon: UserIcon,
      href: '/dashboard/freelancer/profile',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Add Portfolio Item',
      description: 'Showcase your best work',
      icon: BriefcaseIcon,
      href: '/dashboard/freelancer/portfolio',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Browse Jobs',
      description: 'Find new opportunities',
      icon: DocumentTextIcon,
      href: '/dashboard/freelancer/jobs',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'portfolio': return BriefcaseIcon;
      case 'proposal': return DocumentTextIcon;
      case 'profile': return UserIcon;
      case 'message': return ClockIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return CheckCircleIcon;
      case 'pending': return ClockIcon;
      case 'rejected': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="freelancer">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="freelancer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here`s what`s happening with your freelancer account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.title === 'Profile Completeness' ? 
                  (stats.profileCompleteness >= 80 ? 'text-green-600 bg-green-50' : 
                   stats.profileCompleteness >= 50 ? 'text-yellow-600 bg-yellow-50' : 
                   'text-red-600 bg-red-50') : 
                  'text-green-600 bg-green-50'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                {action.title}
              </h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <ActivityIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Your activity will appear here as you add portfolio items
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FreelancerDashboard;