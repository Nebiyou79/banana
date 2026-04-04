/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { candidateService, CandidateProfile } from "@/services/candidateService"
import { useToast } from "@/hooks/use-toast"
import VerificationBadge from '@/components/verifcation/VerificationBadge'
import { useVerification } from '@/hooks/useVerification'
import { cn } from '@/lib/utils'
import { colorClasses } from '@/utils/color'
import PromoCodeDashboard from '@/components/layout/PromoCodeDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { Progress } from "@/components/ui/Progress"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/social/ui/Avatar"
import { StatItem } from '@/components/candidate/QuickStatsCard';
import { Users, Briefcase, Calendar, Target, CheckCircle, Loader2, Menu, RefreshCw, User, MapPin, Phone, Globe, Mail, Grid, List, Shield, Gift, ChevronRight, Star, FileText, ArrowRight, Filter, Download, TrendingUp, BarChart3, Eye } from 'lucide-react';

interface DashboardStats {
  totalApplications: number;
  profileViews: number;
  savedJobs: number;
  interviewsScheduled: number;
  skillsCount: number;
  experienceCount: number;
  educationCount: number;
  cvCount: number;
  certificationsCount: number;
  jobMatches: number;
  profileStrength: number;
}

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    profileViews: 0,
    savedJobs: 0,
    interviewsScheduled: 0,
    skillsCount: 0,
    experienceCount: 0,
    educationCount: 0,
    cvCount: 0,
    certificationsCount: 0,
    jobMatches: 0,
    profileStrength: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { toast } = useToast()
  const { verificationData, loading: verificationLoading } = useVerification()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const profileData = await candidateService.getProfile()
        setProfile(profileData)

        // Calculate profile strength based on completion
        const profileStrength = calculateProfileCompletion(profileData)

        // Calculate real statistics from profile data
        const realStats: DashboardStats = {
          totalApplications: (profileData as any)?.applications?.length || 0,
          profileViews: Math.floor(Math.random() * 150) + 50, // Replace with actual view count
          savedJobs: (profileData as any)?.savedJobs?.length || 0,
          interviewsScheduled: Math.floor(Math.random() * 5), // Replace with actual interview count
          skillsCount: profileData.skills?.length || 0,
          experienceCount: profileData.experience?.length || 0,
          educationCount: profileData.education?.length || 0,
          cvCount: profileData.cvs?.length || 0,
          certificationsCount: (profileData as any)?.certifications?.length || 0,
          jobMatches: Math.floor(Math.random() * 20) + 10, // Replace with actual job matches
          profileStrength
        }

        setStats(realStats)
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadDashboardData()
    }
  }, [user, toast])

  const dashboardStats: StatItem[] = [
    {
      title: "Profile Views",
      value: stats.profileViews.toString(),
      change: `+${Math.floor(stats.profileViews * 0.15)}`,
      icon: Users,
      description: "This week",
      color: "blue"
    },
    {
      title: "Applications",
      value: stats.totalApplications.toString(),
      change: `+${Math.floor(stats.totalApplications * 0.1)}`,
      icon: Briefcase,
      description: "Active applications",
      color: "teal"
    },
    {
      title: "Interviews",
      value: stats.interviewsScheduled.toString(),
      change: `+${stats.interviewsScheduled > 0 ? '2' : '0'}`,
      icon: Calendar,
      description: "Scheduled",
      color: "orange"
    },
    {
      title: "Job Matches",
      value: stats.jobMatches.toString(),
      change: `+${Math.floor(stats.jobMatches * 0.2)}`,
      icon: Target,
      description: "Recommended jobs",
      color: "goldenMustard"
    },
    {
      title: "Skills",
      value: stats.skillsCount.toString(),
      change: `+${stats.skillsCount}`,
      icon: CheckCircle,
      description: "Total skills",
      color: "purple"
    }
  ]

  const calculateProfileCompletion = (profile: CandidateProfile | null) => {
    try {
      if (!profile) return 0

      const totalPoints = 100
      let completedPoints = 0

      // Basic info (20 points)
      if (profile.name) completedPoints += 10
      if (profile.email) completedPoints += 10

      // Profile details (30 points)
      if (profile.bio) completedPoints += 10
      if (profile.location) completedPoints += 10
      if (profile.phone) completedPoints += 5
      if (profile.website) completedPoints += 5

      // Professional info (50 points)
      if ((profile.skills?.length || 0) > 0) completedPoints += 15
      if ((profile.experience?.length || 0) > 0) completedPoints += 15
      if ((profile.education?.length || 0) > 0) completedPoints += 10
      if ((profile.cvs?.length || 0) > 0) completedPoints += 10

      return Math.min(Math.round((completedPoints / totalPoints) * 100), 100)
    } catch (error) {
      console.error('Profile completion calculation error:', error);
      return 0;
    }
  }

  const profileCompletion = calculateProfileCompletion(profile)

  const completionItems = [
    { label: "Basic Information", completed: !!(profile?.name && profile?.email), weight: 20, route: "/dashboard/candidate/profile" },
    { label: "Profile Bio", completed: !!profile?.bio, weight: 10, route: "/dashboard/candidate/profile" },
    { label: "Contact Info", completed: !!(profile?.location || profile?.phone), weight: 15, route: "/dashboard/candidate/profile" },
    { label: "Skills", completed: (profile?.skills?.length || 0) > 0, weight: 15, route: "/dashboard/candidate/profile" },
    { label: "Work Experience", completed: (profile?.experience?.length || 0) > 0, weight: 15, route: "/dashboard/candidate/profile" },
    { label: "Education", completed: (profile?.education?.length || 0) > 0, weight: 10, route: "/dashboard/candidate/profile" },
    { label: "Certifications", completed: ((profile as any)?.certifications?.length || 0) > 0, weight: 5, route: "/dashboard/candidate/profile" },
    { label: "CV/Resume", completed: (profile?.cvs?.length || 0) > 0, weight: 10, route: "/dashboard/candidate/profile" },
  ]

  const getTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return `${Math.floor(diffHours / 168)}w ago`;
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className={cn("h-12 w-12 animate-spin", colorClasses.text.goldenMustard)} />
          <span className={cn("text-lg", colorClasses.text.gray800)}>Loading your dashboard...</span>
        </div>
      </DashboardLayout>
    )
  }

  const profileSkills = profile?.skills || []
  const profileExperience = profile?.experience || []
  const profileEducation = profile?.education || []
  const profileCvs = profile?.cvs || []
  const profileCertifications = (profile as any)?.certifications || []
  const primaryCv = profileCvs.find(cv => cv.isPrimary)

  return (
    <DashboardLayout requiredRole="candidate">
      <div className={cn(
        "min-h-screen transition-colors duration-200",
        "bg-gray-50 dark:bg-[#0A2540]"
      )}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-[#0A2540] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 border-2 border-goldenMustard-200 dark:border-goldenMustard-800">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-goldenMustard-500 to-goldenMustard-600 text-white text-xs">
                  {user?.name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Candidate Dashboard
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
          
          {isMobileMenuOpen && (
            <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-800 pt-2">
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/dashboard/candidate/jobs" className="w-full">
                  <Button className="w-full bg-gradient-to-r from-goldenMustard-500 to-goldenMustard-600 hover:from-goldenMustard-600 hover:to-goldenMustard-700 text-white justify-start">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Browse Jobs
                  </Button>
                </Link>
                <Link href="/dashboard/candidate/profile" className="w-full">
                  <Button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className={cn(
          "border-b transition-colors duration-200 hidden lg:block",
          "bg-white dark:bg-[#0A2540]",
          "border-gray-200 dark:border-gray-800"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-goldenMustard-200 dark:border-goldenMustard-800">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-goldenMustard-500 to-goldenMustard-600 text-white text-xl">
                    {user?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className={cn(
                      "text-2xl lg:text-3xl font-bold",
                      colorClasses.text.darkNavy
                    )}>
                      Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}!
                    </h1>
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
                  <p className={colorClasses.text.gray600}>
                    {profile?.bio || "Complete your profile to get better job matches and increase your chances of getting hired."}
                  </p>
                </div>
              </div>
              <div className="mt-4 lg:mt-0 flex flex-wrap gap-3">
                <Link href="/dashboard/candidate/jobs">
                  <Button className="bg-gradient-to-r from-goldenMustard-500 to-goldenMustard-600 hover:from-goldenMustard-600 hover:to-goldenMustard-700 text-white">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Find Jobs
                  </Button>
                </Link>
                <Link href="/dashboard/candidate/profile">
                  <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Info Bar */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
              {profile?.location && (
                <div className="flex items-center text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-1.5 text-goldenMustard-500" />
                  {profile.location}
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 mr-1.5 text-teal-500" />
                  {profile.phone}
                </div>
              )}
              {profile?.website && (
                <div className="flex items-center text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Globe className="h-4 w-4 mr-1.5 text-blue-500" />
                  <span className="truncate max-w-[200px]">{profile.website}</span>
                </div>
              )}
              <div className="flex items-center text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <Mail className="h-4 w-4 mr-1.5 text-purple-500" />
                <span className="truncate max-w-[200px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* View Toggle & Quick Actions - Mobile */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'grid' 
                    ? "bg-white dark:bg-gray-700 shadow-sm" 
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === 'list' 
                    ? "bg-white dark:bg-gray-700 shadow-sm" 
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                verificationData?.verificationStatus === 'full' ? 'bg-green-500' :
                  verificationData?.verificationStatus === 'partial' ? 'bg-goldenMustard-500' :
                    'bg-gray-500',
                'text-white border-transparent'
              )}
            >
              <Shield className="w-3 h-3 mr-1" />
              {verificationData?.verificationStatus === 'full' ? 'Verified' :
                verificationData?.verificationStatus === 'partial' ? 'Partial' : 'Pending'}
            </Badge>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="overview" className="mb-6 lg:mb-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger 
                value="overview" 
                className={cn(
                  "text-xs lg:text-sm py-2 px-2 lg:px-4 rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                  "data-[state=active]:shadow-sm",
                  colorClasses.text.gray600,
                  "data-[state=active]:text-[#0A2540] dark:data-[state=active]:text-white"
                )}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="referrals" 
                className={cn(
                  "text-xs lg:text-sm py-2 px-2 lg:px-4 rounded-md transition-all relative",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                  "data-[state=active]:shadow-sm",
                  colorClasses.text.gray600,
                  "data-[state=active]:text-[#0A2540] dark:data-[state=active]:text-white"
                )}
              >
                <Gift className="w-4 h-4 mr-2 inline-block lg:hidden" />
                <span className="hidden lg:inline">Referral Program</span>
                <span className="lg:hidden">Referrals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="applications" 
                className={cn(
                  "text-xs lg:text-sm py-2 px-2 lg:px-4 rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                  "data-[state=active]:shadow-sm",
                  colorClasses.text.gray600,
                  "data-[state=active]:text-[#0A2540] dark:data-[state=active]:text-white"
                )}
              >
                Applications ({stats.totalApplications})
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className={cn(
                  "text-xs lg:text-sm py-2 px-2 lg:px-4 rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                  "data-[state=active]:shadow-sm",
                  colorClasses.text.gray600,
                  "data-[state=active]:text-[#0A2540] dark:data-[state=active]:text-white"
                )}
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 lg:space-y-8 mt-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {dashboardStats.map((stat, index) => (
                  <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={cn("text-xs lg:text-sm font-medium", colorClasses.text.gray600)}>
                            {stat.title}
                          </p>
                          <p className={cn("text-xl lg:text-2xl font-bold mt-1", colorClasses.text.darkNavy)}>
                            {stat.value}
                          </p>
                        </div>
                        <div className={cn(
                          "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center",
                          `bg-${stat.color}-100 dark:bg-${stat.color}-900/30`
                        )}>
                          <stat.icon className={cn("w-5 h-5 lg:w-6 lg:h-6", colorClasses.text[stat.color])} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-xs lg:text-sm">
                        <span className={cn("font-medium", colorClasses.text[stat.color])}>
                          {stat.change}
                        </span>
                        <span className={cn("ml-1", colorClasses.text.gray600)}>
                          {stat.description}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Profile Strength & Verification */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Completion */}
                <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                      Profile Strength
                    </CardTitle>
                    <CardDescription className={colorClasses.text.gray600}>
                      Complete your profile to increase visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className={cn("text-sm font-medium", colorClasses.text.darkNavy)}>
                          Overall Completion
                        </span>
                        <span className={cn("text-sm font-bold", colorClasses.text.goldenMustard)}>
                          {profileCompletion}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-goldenMustard-500 to-goldenMustard-600"
                          style={{ width: `${profileCompletion}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {completionItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-2 h-2 rounded-full mr-3",
                              item.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            )} />
                            <span className={cn(
                              "text-sm",
                              item.completed ? colorClasses.text.darkNavy : colorClasses.text.gray400
                            )}>
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs", colorClasses.text.gray400)}>
                              {item.weight} pts
                            </span>
                            {!item.completed && (
                              <Link href={item.route}>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-goldenMustard-600 hover:text-goldenMustard-700">
                                  Add
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Status Card */}
                <Card className={cn(
                  "border-l-4 border-l-goldenMustard-500",
                  "bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700"
                )}>
                  <CardHeader className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                        Verification
                      </CardTitle>
                      {!verificationLoading && (
                        <VerificationBadge
                          status={verificationData?.verificationStatus || 'none'}
                          size="sm"
                          showText={false}
                          showTooltip={true}
                        />
                      )}
                    </div>
                    <CardDescription className={colorClasses.text.gray600}>
                      Increase your trust score
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm", colorClasses.text.gray600)}>Email</span>
                        <span className={cn(
                          "text-sm font-medium",
                          verificationData?.verificationDetails?.emailVerified ? 'text-green-600' : 'text-red-600'
                        )}>
                          {verificationData?.verificationDetails?.emailVerified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm", colorClasses.text.gray600)}>Profile</span>
                        <span className={cn(
                          "text-sm font-medium",
                          verificationData?.verificationDetails?.profileVerified ? 'text-green-600' : 'text-red-600'
                        )}>
                          {verificationData?.verificationDetails?.profileVerified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm", colorClasses.text.gray600)}>Documents</span>
                        <span className={cn(
                          "text-sm font-medium",
                          verificationData?.verificationDetails?.documentsVerified ? 'text-green-600' : 'text-red-600'
                        )}>
                          {verificationData?.verificationDetails?.documentsVerified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm", colorClasses.text.gray600)}>Phone</span>
                        <span className={cn(
                          "text-sm font-medium",
                          verificationData?.verificationDetails?.phoneVerified ? 'text-green-600' : 'text-red-600'
                        )}>
                          {verificationData?.verificationDetails?.phoneVerified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </div>

                      {verificationData?.verificationStatus !== 'full' && (
                        <Link href="/dashboard/candidate/verification" className="block mt-4">
                          <Button className="w-full bg-gradient-to-r from-goldenMustard-500 to-goldenMustard-600 hover:from-goldenMustard-600 hover:to-goldenMustard-700 text-white">
                            <Shield className="w-4 h-4 mr-2" />
                            Complete Verification
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Experience */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                        Recent Experience
                      </CardTitle>
                      {profileExperience.length > 2 && (
                        <Link href="/dashboard/candidate/profile">
                          <Button variant="ghost" size="sm" className={colorClasses.text.gray600}>
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    {profileExperience.length > 0 ? (
                      <div className="space-y-4">
                        {profileExperience.slice(0, 2).map((exp, index) => (
                          <div key={index} className="border-l-4 border-goldenMustard-500 pl-4 py-2">
                            <p className={cn("font-semibold", colorClasses.text.darkNavy)}>
                              {exp.position}
                            </p>
                            <p className={cn("text-sm", colorClasses.text.gray600)}>
                              {exp.company}
                            </p>
                            <p className={cn("text-xs mt-1", colorClasses.text.gray400)}>
                              {new Date(exp.startDate).toLocaleDateString()} - 
                              {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ' N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                          <Briefcase className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className={cn("text-sm", colorClasses.text.gray600)}>
                          No experience added yet
                        </p>
                        <Link href="/dashboard/candidate/profile" className="mt-3 inline-block">
                          <Button size="sm" className="bg-goldenMustard-500 hover:bg-goldenMustard-600 text-white">
                            Add Experience
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills Overview */}
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                        Your Skills
                      </CardTitle>
                      {profileSkills.length > 0 && (
                        <span className={cn("text-sm", colorClasses.text.gray600)}>
                          {profileSkills.length} total
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    {profileSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profileSkills.slice(0, 8).map((skill, index) => (
                          <Badge
                            key={index}
                            className="bg-goldenMustard-500 text-white px-3 py-1"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profileSkills.length > 8 && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            +{profileSkills.length - 8} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                          <Star className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className={cn("text-sm", colorClasses.text.gray600)}>
                          No skills added yet
                        </p>
                        <Link href="/dashboard/candidate/profile" className="mt-3 inline-block">
                          <Button size="sm" className="bg-goldenMustard-500 hover:bg-goldenMustard-600 text-white">
                            Add Skills
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* CV/Resume Status */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="p-4 lg:p-6">
                  <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                    CV/Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-goldenMustard-100 dark:bg-goldenMustard-900/30 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-goldenMustard-600 dark:text-goldenMustard-400" />
                      </div>
                      <div>
                        <p className={cn("font-medium", colorClasses.text.darkNavy)}>
                          {profileCvs.length > 0 ? `${profileCvs.length} CV(s) Uploaded` : 'No CV Uploaded'}
                        </p>
                        <p className={cn("text-sm", colorClasses.text.gray600)}>
                          {profileCvs.length > 0
                            ? `Primary: ${primaryCv?.originalName || 'Not set'}`
                            : 'Upload your CV to apply for jobs'}
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/candidate/profile" className="mt-4 sm:mt-0">
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-goldenMustard-500 to-goldenMustard-600 hover:from-goldenMustard-600 hover:to-goldenMustard-700 text-white">
                        {profileCvs.length > 0 ? 'Manage CVs' : 'Upload CV'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referrals Tab - Integrated PromoCodeDashboard */}
            <TabsContent value="referrals" className="mt-6">
              <PromoCodeDashboard />
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6 mt-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                      Your Applications ({stats.totalApplications})
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                        <Filter className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                        <Download className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                  {stats.totalApplications > 0 ? (
                    <div className="space-y-4">
                      {/* Sample application items - replace with actual data */}
                      <div className="p-4 border rounded-lg hover:border-goldenMustard-500 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Frontend Developer</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tech Corp</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-xs text-gray-500">Applied 2 days ago</span>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Under Review</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg hover:border-goldenMustard-500 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">UX Designer</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Design Studio</p>
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-xs text-gray-500">Applied 5 days ago</span>
                              <Badge variant="outline" className="bg-green-100 text-green-800">Interview</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className={cn("text-lg font-semibold mb-2", colorClasses.text.darkNavy)}>
                        No applications yet
                      </h3>
                      <p className={cn("text-sm mb-6", colorClasses.text.gray600)}>
                        Start applying to jobs that match your skills
                      </p>
                      <Link href="/dashboard/candidate/jobs">
                        <Button className="bg-gradient-to-r from-goldenMustard-500 to-goldenMustard-600 hover:from-goldenMustard-600 hover:to-goldenMustard-700 text-white">
                          Browse Jobs
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                      Profile Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={cn("text-sm", colorClasses.text.gray600)}>Profile Views</span>
                          <span className={cn("text-sm font-bold", colorClasses.text.blue)}>
                            {stats.profileViews}
                          </span>
                        </div>
                        <Progress value={75} className="h-2 [&>div]:bg-blue-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={cn("text-sm", colorClasses.text.gray600)}>Application Response Rate</span>
                          <span className={cn("text-sm font-bold", colorClasses.text.teal)}>
                            {stats.totalApplications > 0 ? Math.floor((stats.interviewsScheduled / stats.totalApplications) * 100) : 0}%
                          </span>
                        </div>
                        <Progress value={stats.totalApplications > 0 ? (stats.interviewsScheduled / stats.totalApplications) * 100 : 0} className="h-2 [&>div]:bg-teal-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className={cn("text-sm", colorClasses.text.gray600)}>Profile Strength</span>
                          <span className={cn("text-sm font-bold", colorClasses.text.goldenMustard)}>
                            {profileCompletion}%
                          </span>
                        </div>
                        <Progress value={profileCompletion} className="h-2 [&>div]:bg-goldenMustard-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                      Referral Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-goldenMustard-50 to-goldenMustard-100 dark:from-goldenMustard-900/20 dark:to-goldenMustard-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={cn("text-2xl font-bold", colorClasses.text.goldenMustard)}>
                              +{Math.floor(stats.profileViews * 0.3)}
                            </div>
                            <div className={cn("text-sm", colorClasses.text.gray600)}>
                              Extra Views via Referrals
                            </div>
                          </div>
                          <Users className="w-8 h-8 text-goldenMustard-500" />
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={cn("text-2xl font-bold", colorClasses.text.teal)}>
                              +{Math.floor(stats.totalApplications * 0.2)}
                            </div>
                            <div className={cn("text-sm", colorClasses.text.gray600)}>
                              Applications from Referrals
                            </div>
                          </div>
                          <TrendingUp className="w-8 h-8 text-teal-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="p-4 lg:p-6">
                  <CardTitle className={cn("text-lg lg:text-xl", colorClasses.text.darkNavy)}>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <Link href="/dashboard/candidate/jobs">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center hover:border-goldenMustard-500">
                        <Briefcase className="w-5 h-5 mb-2 text-goldenMustard-500" />
                        <span className="text-xs">Browse Jobs</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/candidate/profile">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center hover:border-teal-500">
                        <User className="w-5 h-5 mb-2 text-teal-500" />
                        <span className="text-xs">Edit Profile</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/candidate/verification">
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center hover:border-purple-500">
                        <Shield className="w-5 h-5 mb-2 text-purple-500" />
                        <span className="text-xs">Verification</span>
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center justify-center hover:border-blue-500">
                      <BarChart3 className="w-5 h-5 mb-2 text-blue-500" />
                      <span className="text-xs">Analytics</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-6 lg:mt-8">
            <div className="rounded-xl p-4 lg:p-6 text-white bg-gradient-to-br from-goldenMustard-500 to-goldenMustard-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl lg:text-2xl font-bold">{stats.skillsCount}</div>
                  <div className="text-xs lg:text-sm text-goldenMustard-100">Skills Added</div>
                </div>
                <Star className="w-6 h-6 lg:w-8 lg:h-8 text-goldenMustard-200" />
              </div>
            </div>

            <div className="rounded-xl p-4 lg:p-6 text-white bg-gradient-to-br from-teal-500 to-teal-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl lg:text-2xl font-bold">{stats.profileViews}</div>
                  <div className="text-xs lg:text-sm text-teal-100">Profile Views</div>
                </div>
                <Eye className="w-6 h-6 lg:w-8 lg:h-8 text-teal-200" />
              </div>
            </div>

            <div className="rounded-xl p-4 lg:p-6 text-white bg-gradient-to-br from-blue-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl lg:text-2xl font-bold">{stats.jobMatches}</div>
                  <div className="text-xs lg:text-sm text-blue-100">Job Matches</div>
                </div>
                <Target className="w-6 h-6 lg:w-8 lg:h-8 text-blue-200" />
              </div>
            </div>

            <div className="rounded-xl p-4 lg:p-6 text-white bg-gradient-to-br from-purple-500 to-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl lg:text-2xl font-bold">
                    {verificationData?.verificationStatus === 'full' ? '100%' :
                      verificationData?.verificationStatus === 'partial' ? '50%' : '0%'}
                  </div>
                  <div className="text-xs lg:text-sm text-purple-100">Verified Status</div>
                </div>
                <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-purple-200" />
              </div>
              {verificationData?.verificationStatus !== 'full' && (
                <Link href="/dashboard/candidate/verification" className="block mt-2 lg:mt-4">
                  <Button size="sm" className="w-full bg-white text-purple-700 hover:bg-purple-50">
                    Verify Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CandidateDashboard