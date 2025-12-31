/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { freelancerService, UserProfile } from '@/services/freelancerService';
import DashboardStats from '@/components/freelancer/DashboardStats';
import ProfileCompletion from '@/components/freelancer/ProfileCompletion';
import {
  BriefcaseIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  EyeIcon,
  CheckBadgeIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import { useVerification } from '@/hooks/useVerification';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const FreelancerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [professionalStats, setProfessionalStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { verificationData, loading: verificationLoading } = useVerification();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load profile data first
      const profile = await freelancerService.getProfile();

      // Load certifications
      let certificationsData: React.SetStateAction<any[]> = [];
      try {
        certificationsData = await freelancerService.getCertifications();
        setCertifications(certificationsData);
      } catch (error) {
        console.warn('Certifications not available yet');
        certificationsData = [];
      }

      const profileWithCertifications = {
        ...profile,
        certifications: certificationsData
      };

      setUserProfile(profileWithCertifications);

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
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
            <div className="text-emerald-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unable to Load Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Please try refreshing the page</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white">
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
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl lg:text-3xl font-bold">
                        Welcome back, {userProfile.name}!
                      </h1>
                      {/* Verification Badge */}
                      {!verificationLoading && (
                        <VerificationBadge
                          autoFetch={true}
                          size="md"
                          showText={true}
                          showTooltip={true}
                          className="shadow-lg border border-white/30"
                        />
                      )}
                    </div>
                    <p className="text-emerald-100 dark:text-emerald-200 mt-1">
                      {userProfile.freelancerProfile?.headline || 'Ready to find your next project'}
                    </p>
                  </div>
                </div>

                {/* Verification Status Info */}
                {verificationData && (
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <div className="text-sm text-emerald-100">
                        <span className="font-medium">Trust Score: </span>
                        <span className={cn(
                          "font-bold",
                          verificationData.verificationStatus === 'full' ? 'text-emerald-300' :
                            verificationData.verificationStatus === 'partial' ? 'text-amber-300' :
                              'text-red-300'
                        )}>
                          {verificationData.verificationStatus === 'full' ? 'Excellent' :
                            verificationData.verificationStatus === 'partial' ? 'Good' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>

                    {verificationData.verificationStatus !== 'full' && (
                      <Link href="/dashboard/freelancer/verification">
                        <button className="bg-white text-emerald-700 dark:text-emerald-800 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center text-sm">
                          <ShieldCheckIcon className="w-4 h-4 mr-2" />
                          Improve Verification
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 lg:mt-0">
                <Link href="/dashboard/freelancer/tenders">
                  <button className="bg-white text-emerald-600 dark:text-emerald-700 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center">
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
              {/* Profile Strength & Verification */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2">
                  <div className={cn(
                    "rounded-2xl shadow-sm border overflow-hidden",
                    "bg-white dark:bg-gray-800",
                    "border-gray-200 dark:border-gray-700",
                    "transition-colors duration-200"
                  )}>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                          <DocumentCheckIcon className="w-6 h-6 mr-3 text-emerald-500" />
                          Profile & Verification Status
                        </h3>
                        <div className="flex items-center gap-2">
                          <VerificationBadge
                            autoFetch={true}
                            size="sm"
                            showText={false}
                            showTooltip={true}
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Profile Completion */}
                        <div>
                          <ProfileCompletion
                            profile={userProfile}
                            showActions={true}
                            onImprove={() => window.location.href = '/dashboard/freelancer/profile'}
                          />
                        </div>

                        {/* Verification Details */}
                        {verificationData && (
                          <div className={cn(
                            "rounded-xl p-4 border",
                            "bg-gradient-to-r from-emerald-50 to-emerald-100",
                            "dark:from-emerald-900/20 dark:to-emerald-800/20",
                            "border-emerald-200 dark:border-emerald-800"
                          )}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                <ShieldCheckIcon className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                                Verification Details
                              </h4>
                              <span className={cn(
                                "text-sm font-medium",
                                verificationData.verificationStatus === 'full' ? 'text-emerald-600 dark:text-emerald-400' :
                                  verificationData.verificationStatus === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-red-600 dark:text-red-400'
                              )}>
                                {verificationData.verificationStatus === 'full' ? 'Fully Verified' :
                                  verificationData.verificationStatus === 'partial' ? 'Partially Verified' : 'Not Verified'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className={cn(
                                "p-3 rounded-lg",
                                verificationData.verificationDetails?.profileVerified
                                  ? 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700'
                                  : 'bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                              )}>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    verificationData.verificationDetails?.profileVerified ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'
                                  )} />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {verificationData.verificationDetails?.profileVerified
                                    ? '✅ Verified'
                                    : '⚠️ Needs completion'}
                                </p>
                              </div>

                              <div className={cn(
                                "p-3 rounded-lg",
                                verificationData.verificationDetails?.documentsVerified
                                  ? 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700'
                                  : 'bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                              )}>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    verificationData.verificationDetails?.documentsVerified ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'
                                  )} />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {verificationData.verificationDetails?.documentsVerified
                                    ? '✅ Verified'
                                    : '📄 Upload required'}
                                </p>
                              </div>

                              <div className={cn(
                                "p-3 rounded-lg",
                                verificationData.verificationDetails?.socialVerified
                                  ? 'bg-emerald-100 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700'
                                  : 'bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                              )}>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    verificationData.verificationDetails?.socialVerified ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'
                                  )} />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Profile</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {verificationData.verificationDetails?.socialVerified
                                    ? '✅ Verified'
                                    : '🔗 Connect accounts'}
                                </p>
                              </div>
                            </div>

                            {verificationData.verificationStatus !== 'full' && (
                              <div className="mt-4">
                                <Link href="/dashboard/freelancer/verification">
                                  <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md">
                                    Complete Verification Steps
                                  </button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className={cn(
                "rounded-2xl shadow-sm border p-6",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "transition-colors duration-200"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <ArrowTrendingUpIcon className="w-6 h-6 mr-3 text-emerald-500" />
                    Performance Metrics
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last 90 days</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckBadgeIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      {professionalStats?.jobSuccessScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Job Success</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                      {professionalStats?.onTimeDelivery || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">On Time</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-1">
                      {professionalStats?.responseRate || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Response Rate</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <EyeIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-1">
                      {professionalStats?.profileViews || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Profile Views</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Insights */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className={cn(
                "rounded-2xl shadow-sm border p-6",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "transition-colors duration-200"
              )}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <RocketLaunchIcon className="w-6 h-6 mr-3 text-emerald-500" />
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  <Link href="/tenders">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <BriefcaseIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mr-4 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          Find Projects
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Browse available opportunities</div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/dashboard/freelancer/profile">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <UserGroupIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-4 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          Update Profile
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Improve your visibility</div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/dashboard/freelancer/portfolio">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <StarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-4 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400">
                          Add Portfolio
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Showcase your work</div>
                      </div>
                    </button>
                  </Link>

                  {/* Verification Action */}
                  <Link href="/dashboard/freelancer/verification">
                    <button className="w-full flex items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:shadow-md transition-all duration-200 group text-left">
                      <ShieldCheckIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 mr-4 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">
                          Verification Status
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Increase your trust score</div>
                        {verificationData && verificationData.verificationStatus === 'partial' && (
                          <Badge className="mt-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                            In Progress
                          </Badge>
                        )}
                      </div>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-gray-950 rounded-2xl p-6 text-white">
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
                    <span>Complete verification for better opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Ask clients for reviews after project completion</span>
                  </li>
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-700 dark:border-gray-800">
                  <div className="text-xs text-gray-400">
                    Tips based on top-performing freelancers
                  </div>
                </div>
              </div>

              {/* Verification Benefits */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 mr-3 text-white" />
                  Verification Benefits
                </h3>

                <ul className="space-y-3 text-sm text-emerald-100">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Get 3x more project invites</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Higher trust score with clients</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Featured in search results</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Priority support access</span>
                  </li>
                </ul>

                <div className="mt-6">
                  <Link href="/dashboard/freelancer/verification">
                    <button className="w-full bg-white text-emerald-700 dark:text-emerald-800 px-4 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Complete Verification Now
                    </button>
                  </Link>
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