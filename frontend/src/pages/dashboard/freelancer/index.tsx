/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { freelancerService, UserProfile } from '@/services/freelancerService';
import DashboardStats from '@/components/freelancer/DashboardStats';
import ProfileCompletion from '@/components/freelancer/ProfileCompletion';
import ProfileCompletionProgress from '@/components/freelancer/ProfileCompletion';
import { colorClasses } from '@/utils/color';
import {
  BriefcaseIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CheckBadgeIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const FreelancerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [professionalStats, setProfessionalStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data first for accurate completion calculation
      const profile = await freelancerService.getProfile();
      setUserProfile(profile);
      
      // Load certifications
      try {
        const certs = await freelancerService.getCertifications();
        setCertifications(certs);
      } catch (error) {
        console.warn('Certifications not available yet');
        setCertifications([]);
      }
      
      // Load dashboard overview
      const dashboard = await freelancerService.getDashboardOverview();
      setDashboardData(dashboard);
      
      // Load professional stats
      try {
        const stats = await freelancerService.getFreelancerStats();
        setProfessionalStats(stats);
      } catch (error) {
        console.warn('Professional stats not available yet');
        setProfessionalStats({
          profileStrength: dashboard.stats.profile.completion,
          jobSuccessScore: dashboard.stats.earnings.successRate,
          onTimeDelivery: 85,
          responseRate: 92,
          totalEarnings: dashboard.stats.earnings.total,
          totalJobs: dashboard.stats.proposals.accepted,
          activeProposals: dashboard.stats.proposals.pending,
          profileViews: dashboard.stats.profile.views,
          clientReviews: dashboard.stats.ratings.count,
          averageRating: dashboard.stats.ratings.average
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  if (!dashboardData || !userProfile) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">⚠️</div>
            <h2 className={`text-2xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
              Unable to Load Dashboard
            </h2>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    {userProfile.avatar ? (
                      <img 
                        src={userProfile.avatar} 
                        alt={userProfile.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="text-white text-xl font-bold">
                        {userProfile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                      Welcome back, {userProfile.name}!
                    </h1>
                    <p className="text-green-100 mt-1">
                      {userProfile.freelancerProfile?.headline || 'Ready to find your next project'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0">
                <Link href="/dashboard/freelancer/tenders">
                  <button className="bg-white text-yellow-500 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
                    <RocketLaunchIcon className="w-5 h-5 mr-2" />
                    Find New Projects
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
          {/* Stats Overview */}
          <div className="mb-8">
            <DashboardStats 
              stats={{
                ...dashboardData.stats,
                certifications: {
                  total: certifications.length
                }
              }} 
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Profile & Activity */}
            <div className="xl:col-span-2 space-y-8">
              {/* Profile Strength */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                  <ProfileCompletion
                    profile={userProfile}
                    showActions={true}
                    onImprove={() => window.location.href = '/dashboard/freelancer/profile'}
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} flex items-center`}>
                    <ArrowTrendingUpIcon className="w-6 h-6 mr-3 text-green-500" />
                    Performance Metrics
                  </h3>
                  <span className="text-sm text-gray-500">Last 90 days</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckBadgeIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-700 mb-1">
                      {professionalStats?.jobSuccessScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Job Success</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ClockIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mb-1">
                      {professionalStats?.onTimeDelivery || 0}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">On Time</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700 mb-1">
                      {professionalStats?.responseRate || 0}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Response Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <EyeIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 mb-1">
                      {professionalStats?.profileViews || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Profile Views</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} flex items-center`}>
                    <CalendarIcon className="w-6 h-6 mr-3 text-green-500" />
                    Recent Activity
                  </h3>
                  <Link href="/dashboard/freelancer/proposals">
                    <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
                      View All
                    </button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {dashboardData.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 transition-colors group">
                      <div className={`w-3 h-3 rounded-full mt-2 mr-4 ${
                        activity.status === 'success' ? 'bg-green-500' : 
                        activity.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'success' ? 'bg-green-100 text-green-800' :
                        activity.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.recentActivities.length === 0 && (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No recent activity</p>
                      <p className="text-sm text-gray-500">Start applying to projects to see activity here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Insights */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} mb-6 flex items-center`}>
                  <RocketLaunchIcon className="w-6 h-6 mr-3 text-green-500" />
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <Link href="/tenders">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <BriefcaseIcon className="w-8 h-8 text-green-600 mr-4 p-2 bg-white rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-green-700">
                          Find Projects
                        </div>
                        <div className="text-sm text-gray-600">Browse available opportunities</div>
                      </div>
                    </button>
                  </Link>
                  
                  <Link href="/dashboard/freelancer/profile">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <UserGroupIcon className="w-8 h-8 text-blue-600 mr-4 p-2 bg-white rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                          Update Profile
                        </div>
                        <div className="text-sm text-gray-600">Improve your visibility</div>
                      </div>
                    </button>
                  </Link>
                  
                  <Link href="/dashboard/freelancer/portfolio">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <StarIcon className="w-8 h-8 text-purple-600 mr-4 p-2 bg-white rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-purple-700">
                          Add Portfolio
                        </div>
                        <div className="text-sm text-gray-600">Showcase your work</div>
                      </div>
                    </button>
                  </Link>
                  
                  <Link href="/dashboard/freelancer/proposals">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-orange-600 mr-4 p-2 bg-white rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-orange-700">
                          View Proposals
                        </div>
                        <div className="text-sm text-gray-600">Manage your applications</div>
                      </div>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Earnings Summary */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 mr-3" />
                  Earnings Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-green-500/30">
                    <span className="text-green-100">Total Earnings</span>
                    <span className="font-bold text-2xl">
                      ${professionalStats?.totalEarnings?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-green-500/30">
                    <span className="text-green-100">Active Projects</span>
                    <span className="font-bold text-lg">{professionalStats?.activeProposals || '0'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-green-500/30">
                    <span className="text-green-100">Success Rate</span>
                    <span className="font-bold text-lg">{professionalStats?.jobSuccessScore || 0}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-green-100">Avg. Rating</span>
                    <span className="font-bold text-lg flex items-center">
                      {professionalStats?.averageRating?.toFixed(1) || '0.0'}
                      <StarIcon className="w-4 h-4 ml-1 text-amber-300" />
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-green-500/30">
                  <div className="text-center text-green-200 text-sm">
                    Updated in real-time
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <StarIcon className="w-6 h-6 mr-3 text-amber-400" />
                  Pro Tips
                </h3>
                
                <ul className="space-y-3 text-sm text-gray-200">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Customize your proposals for each project</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Respond to client messages within 24 hours</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Keep your portfolio updated with recent work</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Ask clients for reviews after project completion</span>
                  </li>
                </ul>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    Tips based on top-performing freelancers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerDashboard;