/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { freelancerService, UserProfile } from '@/services/freelancerService';
import DashboardStats from '@/components/freelancer/DashboardStats';
import ProfileCompletion from '@/components/freelancer/ProfileCompletion';
import PromoCodeDashboard from '@/components/layout/PromoCodeDashboard';
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
  DocumentCheckIcon,
  GiftIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import { useVerification } from '@/hooks/useVerification';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';

const FreelancerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [professionalStats, setProfessionalStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { verificationData, loading: verificationLoading } = useVerification();
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const profile = await freelancerService.getProfile();
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
      const dashboard = await freelancerService.getDashboardOverview();
      setDashboardData(dashboard);

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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
            <p className={cn("text-gray-600 dark:text-gray-400")}>
              Loading your dashboard...
            </p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  if (!dashboardData || !userProfile) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className={cn("text-6xl mb-4", colorClasses.text.amber)}>⚠️</div>
            <h2 className={cn("text-2xl font-bold mb-2", colorClasses.text.primary)}>
              Unable to Load Dashboard
            </h2>
            <p className={colorClasses.text.muted}>Please try refreshing the page</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      <div className={cn(
        "min-h-screen transition-colors duration-200",
        "bg-gray-50 dark:bg-gray-900"
      )}>
        {/* Header Section - Fixed spacing */}
        <div className={cn(
          "bg-gradient-to-r",
          "from-emerald-600 to-emerald-700",
          "dark:from-emerald-800 dark:to-emerald-900",
          "text-white"
        )}>
          <div className={cn(
            "max-w-7xl mx-auto",
            "px-4 sm:px-6 lg:px-8",
            "py-6 sm:py-8" // Responsive padding
          )}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className={cn(
                  "flex items-center",
                  "space-x-3 sm:space-x-4", // Responsive spacing
                  "mb-3 sm:mb-4"
                )}>
                  <div className={cn(
                    "rounded-full flex items-center justify-center",
                    "bg-white/20 dark:bg-white/10",
                    "w-12 h-12 sm:w-16 sm:h-16" // Responsive sizing
                  )}>
                    {userProfile.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt={userProfile.name}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className={cn(
                        "font-bold",
                        "text-sm sm:text-xl", // Responsive text
                        "text-white"
                      )}>
                        {userProfile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h1 className={cn(
                        "font-bold",
                        "text-xl sm:text-2xl lg:text-3xl" // Responsive text
                      )}>
                        Welcome Back, {userProfile.name.split(' ')[0]}!
                      </h1>
                      {!verificationLoading && (
                        <VerificationBadge
                          autoFetch={true}
                          size={breakpoint === 'mobile' ? 'sm' : 'md'}
                          showText={breakpoint !== 'mobile'}
                          showTooltip={true}
                          className="shadow-lg border border-white/30"
                        />
                      )}
                    </div>
                    <p className={cn(
                      "mt-1",
                      "text-sm sm:text-base", // Responsive text
                      "text-emerald-100 dark:text-emerald-200"
                    )}>
                      {userProfile.freelancerProfile?.headline || 'Ready to find your next project'}
                    </p>
                  </div>
                </div>

                {/* Verification Status Info */}
                {verificationData && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className={cn(
                      "rounded-lg px-3 sm:px-4 py-2",
                      "bg-white/20 dark:bg-white/10",
                      "backdrop-blur-sm"
                    )}>
                      <div className={cn(
                        "text-xs sm:text-sm", // Responsive text
                        "text-emerald-100"
                      )}>
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
                        <button className={cn(
                          "flex items-center",
                          "px-3 sm:px-4 py-2",
                          "text-xs sm:text-sm", // Responsive text
                          "bg-white text-emerald-700 dark:text-emerald-800",
                          "rounded-lg font-semibold",
                          "hover:bg-emerald-50 transition-all duration-200",
                          "shadow-sm hover:shadow-md",
                          getTouchTargetSize('sm')
                        )}>
                          <ShieldCheckIcon className="w-4 h-4 mr-2" />
                          {breakpoint === 'mobile' ? 'Verify' : 'Improve Verification'}
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 lg:mt-0 flex gap-2 sm:gap-3">
                <Link href="/dashboard/freelancer/tenders">
                  <button className={cn(
                    "flex items-center",
                    "px-4 sm:px-6 py-2 sm:py-3",
                    "text-sm sm:text-base", // Responsive text
                    "bg-white text-emerald-600 dark:text-emerald-700",
                    "rounded-xl font-semibold",
                    "hover:bg-emerald-50 transition-all duration-200",
                    "shadow-lg hover:shadow-xl",
                    getTouchTargetSize('md')
                  )}>
                    <RocketLaunchIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {breakpoint === 'mobile' ? 'Projects' : 'Find Projects'}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Fixed spacing with pt-16 for proper separation */}
        <div className={cn(
          "max-w-7xl mx-auto",
          "px-4 sm:px-6 lg:px-8",
          "pt-6 sm:pt-8 lg:pt-10", // Responsive top padding
          "pb-8 sm:pb-12 lg:pb-16" // Responsive bottom padding
        )}>
          {/* Stats Overview - Added margin top for spacing from header */}
          <div className="mb-6 sm:mb-8">
            <DashboardStats
              stats={{
                ...dashboardData.stats,
                certifications: {
                  total: certifications.length
                }
              }}
            />
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className={cn(
              "grid w-full grid-cols-2",
              "bg-gray-100 dark:bg-gray-800",
              "p-1 rounded-lg",
              "max-w-full sm:max-w-md mx-auto lg:mx-0"
            )}>
              <TabsTrigger
                value="overview"
                className={cn(
                  "text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                  "data-[state=active]:shadow-sm",
                  "text-gray-600 dark:text-gray-400",
                  "data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400",
                  getTouchTargetSize('sm')
                )}
              >
                <BriefcaseIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 inline-block" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className={cn(
                  "text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                  "data-[state=active]:shadow-sm",
                  "text-gray-600 dark:text-gray-400",
                  "data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400",
                  getTouchTargetSize('sm')
                )}
              >
                <GiftIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 inline-block" />
                <span className="hidden sm:inline">Referrals & Rewards</span>
                <span className="sm:hidden">Rewards</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Left Column - Profile & Activity */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Profile Strength & Verification */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
                    <div className="lg:col-span-2">
                      <Card className={cn(
                        "border shadow-sm overflow-hidden",
                        "bg-white dark:bg-gray-800",
                        "border-gray-200 dark:border-gray-700"
                      )}>
                        <CardHeader className="p-4 sm:p-6">
                          <div className="flex items-center justify-between">
                            <CardTitle className={cn(
                              "font-bold flex items-center",
                              "text-lg sm:text-xl", // Responsive text
                              "text-gray-900 dark:text-white"
                            )}>
                              <DocumentCheckIcon className={cn(
                                "mr-2 sm:mr-3",
                                "w-5 h-5 sm:w-6 sm:h-6",
                                "text-emerald-600 dark:text-emerald-400"
                              )} />
                              Profile & Verification
                            </CardTitle>
                            <VerificationBadge
                              autoFetch={true}
                              size="sm"
                              showText={false}
                              showTooltip={true}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <div className="space-y-4 sm:space-y-6">
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
                                "rounded-xl p-3 sm:p-4 border",
                                "bg-gradient-to-r",
                                "from-emerald-50 to-emerald-100",
                                "dark:from-emerald-900/30 dark:to-emerald-800/30",
                                "border-emerald-200 dark:border-emerald-800"
                              )}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className={cn(
                                    "font-semibold flex items-center",
                                    "text-sm sm:text-base", // Responsive text
                                    "text-gray-900 dark:text-white"
                                  )}>
                                    <ShieldCheckIcon className={cn(
                                      "mr-2",
                                      "w-4 h-4 sm:w-5 sm:h-5",
                                      "text-emerald-600 dark:text-emerald-400"
                                    )} />
                                    Verification Details
                                  </h4>
                                  <span className={cn(
                                    "text-xs sm:text-sm font-medium",
                                    verificationData.verificationStatus === 'full' ? 'text-emerald-600 dark:text-emerald-400' :
                                      verificationData.verificationStatus === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                                        'text-red-600 dark:text-red-400'
                                  )}>
                                    {verificationData.verificationStatus === 'full' ? 'Fully Verified' :
                                      verificationData.verificationStatus === 'partial' ? 'Partially Verified' : 'Not Verified'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                                  <VerificationStatusItem
                                    label="Profile"
                                    verified={verificationData.verificationDetails?.profileVerified}
                                    icon={DocumentCheckIcon}
                                  />
                                  <VerificationStatusItem
                                    label="Docs"
                                    verified={verificationData.verificationDetails?.documentsVerified}
                                    icon={ShieldCheckIcon}
                                  />
                                  <VerificationStatusItem
                                    label="Social"
                                    verified={verificationData.verificationDetails?.socialVerified}
                                    icon={UserGroupIcon}
                                  />
                                </div>

                                {verificationData.verificationStatus !== 'full' && (
                                  <div className="mt-3 sm:mt-4">
                                    <Link href="/dashboard/freelancer/verification">
                                      <Button className={cn(
                                        "w-full",
                                        "text-sm sm:text-base", // Responsive text
                                        "bg-gradient-to-r from-emerald-500 to-emerald-600",
                                        "hover:from-emerald-600 hover:to-emerald-700",
                                        "text-white",
                                        getTouchTargetSize('md')
                                      )}>
                                        Complete Verification
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <Card className={cn(
                    "border shadow-sm",
                    "bg-white dark:bg-gray-800",
                    "border-gray-200 dark:border-gray-700"
                  )}>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className={cn(
                        "font-bold flex items-center",
                        "text-lg sm:text-xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <ArrowTrendingUpIcon className={cn(
                          "mr-2 sm:mr-3",
                          "w-5 h-5 sm:w-6 sm:h-6",
                          "text-emerald-600 dark:text-emerald-400"
                        )} />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <PerformanceMetricCard
                          icon={CheckBadgeIcon}
                          value={`${professionalStats?.jobSuccessScore || 0}%`}
                          label="Success"
                          color="emerald"
                        />
                        <PerformanceMetricCard
                          icon={ClockIcon}
                          value={`${professionalStats?.onTimeDelivery || 0}%`}
                          label="On Time"
                          color="blue"
                        />
                        <PerformanceMetricCard
                          icon={ChatBubbleLeftRightIcon}
                          value={`${professionalStats?.responseRate || 0}%`}
                          label="Response"
                          color="purple"
                        />
                        <PerformanceMetricCard
                          icon={EyeIcon}
                          value={professionalStats?.profileViews || 0}
                          label="Views"
                          color="orange"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Quick Actions & Insights */}
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Quick Actions */}
                  <Card className={cn(
                    "border shadow-sm",
                    "bg-white dark:bg-gray-800",
                    "border-gray-200 dark:border-gray-700"
                  )}>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className={cn(
                        "font-bold flex items-center",
                        "text-lg sm:text-xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <RocketLaunchIcon className={cn(
                          "mr-2 sm:mr-3",
                          "w-5 h-5 sm:w-6 sm:h-6",
                          "text-emerald-600 dark:text-emerald-400"
                        )} />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                      <QuickActionButton
                        href="/tenders"
                        icon={BriefcaseIcon}
                        title="Find Projects"
                        description="Browse opportunities"
                        color="emerald"
                      />
                      <QuickActionButton
                        href="/dashboard/freelancer/profile"
                        icon={UserGroupIcon}
                        title="Update Profile"
                        description="Improve visibility"
                        color="blue"
                      />
                      <QuickActionButton
                        href="/dashboard/freelancer/portfolio"
                        icon={StarIcon}
                        title="Add Portfolio"
                        description="Showcase your work"
                        color="purple"
                      />
                      <QuickActionButton
                        href="/dashboard/freelancer/verification"
                        icon={ShieldCheckIcon}
                        title="Verification"
                        description="Increase trust score"
                        color="amber"
                        badge={verificationData?.verificationStatus === 'partial' ? 'In Progress' : undefined}
                      />
                    </CardContent>
                  </Card>

                  {/* Pro Tips */}
                  <ProTipsCard />
                </div>
              </div>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="mt-4 sm:mt-6">
              <PromoCodeDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FreelancerLayout>
  );
};

// Helper Components with improved color classes
const VerificationStatusItem = ({ label, verified, icon: Icon }: {
  label: string;
  verified: boolean | undefined;
  icon: React.ElementType;
}) => (
  <div className={cn(
    "p-2 sm:p-3 rounded-lg border",
    verified
      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
  )}>
    <div className="flex items-center gap-2 mb-1">
      <div className={cn(
        "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
        verified ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'
      )} />
      <span className={cn(
        "text-xs sm:text-sm font-medium",
        "text-gray-700 dark:text-gray-300"
      )}>{label}</span>
    </div>
    <p className={cn(
      "text-xs",
      verified ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
    )}>
      {verified ? '✅ Verified' : '⚠️ Pending'}
    </p>
  </div>
);

const PerformanceMetricCard = ({ icon: Icon, value, label, color }: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
}) => {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
  };

  const iconColors = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400'
  };

  return (
    <div className={cn(
      "text-center p-3 sm:p-4 rounded-xl border",
      colors[color]
    )}>
      <div className={cn(
        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2",
        `bg-${color}-100 dark:bg-${color}-900/30`
      )}>
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColors[color])} />
      </div>
      <div className={cn(
        "text-base sm:text-xl font-bold",
        iconColors[color]
      )}>
        {value}
      </div>
      <div className={cn(
        "text-xs sm:text-sm",
        "text-gray-600 dark:text-gray-400",
        "font-medium"
      )}>{label}</div>
    </div>
  );
};

const QuickActionButton = ({ href, icon: Icon, title, description, color, badge }: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
  badge?: string;
}) => {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-500',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-500',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-500'
  };

  const iconColors = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    amber: 'text-amber-600 dark:text-amber-400'
  };

  return (
    <Link href={href}>
      <button className={cn(
        "w-full flex items-center p-3 sm:p-4 rounded-xl border transition-all duration-200 group text-left",
        colors[color],
        "hover:shadow-md"
      )}>
        <div className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mr-2 sm:mr-3",
          `bg-${color}-100 dark:bg-${color}-900/30`
        )}>
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColors[color])} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold truncate",
              "text-sm sm:text-base", // Responsive text
              "text-gray-900 dark:text-white",
              "group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
            )}>
              {title}
            </span>
            {badge && (
              <Badge className={cn(
                "shrink-0",
                "text-xs",
                "bg-amber-100 dark:bg-amber-900/30",
                "text-amber-800 dark:text-amber-200",
                "border border-amber-300 dark:border-amber-700"
              )}>
                {badge}
              </Badge>
            )}
          </div>
          <div className={cn(
            "text-xs sm:text-sm truncate",
            "text-gray-600 dark:text-gray-400"
          )}>{description}</div>
        </div>
      </button>
    </Link>
  );
};

const ProTipsCard = () => (
  <Card className={cn(
    "border-0 overflow-hidden",
    "bg-gradient-to-br",
    "from-gray-800 to-gray-900",
    "dark:from-gray-900 dark:to-gray-950"
  )}>
    <CardHeader className="p-4 sm:p-6">
      <CardTitle className={cn(
        "font-bold flex items-center",
        "text-lg sm:text-xl", // Responsive text
        "text-white"
      )}>
        <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-amber-400" />
        Pro Tips
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      <ul className="space-y-2 sm:space-y-3">
        {[
          'Customize proposals for each project',
          'Respond to clients within 24 hours',
          'Complete verification for better opportunities',
          'Ask clients for reviews after completion'
        ].map((tip, index) => (
          <li key={index} className="flex items-start">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 mr-2 sm:mr-3 shrink-0" />
            <span className={cn(
              "text-xs sm:text-sm", // Responsive text
              "text-gray-200"
            )}>{tip}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-gray-700 dark:border-gray-800">
        <p className={cn(
          "text-xs",
          "text-gray-400"
        )}>
          Tips based on top-performing freelancers
        </p>
      </div>
    </CardContent>
  </Card>
);

export default FreelancerDashboard;