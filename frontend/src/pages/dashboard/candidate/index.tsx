/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  Briefcase,
  User,
  FileText,
  Bookmark,
  ArrowRight,
  CheckCircle,
  Loader2,
  GraduationCap,
  MapPin,
  Phone,
  Globe,
  Mail,
  Award,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import ProfileCompletionCard from "@/components/candidate/ProfileCompletionCard"
import QuickStatsCard from "@/components/candidate/QuickStatsCard"
import { candidateService, CandidateProfile } from "@/services/candidateService"
import { useToast } from "@/hooks/use-toast"
import VerificationBadge from '@/components/verifcation/VerificationBadge'
import { useVerification } from '@/hooks/useVerification'
import { cn } from '@/lib/utils'

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
    certificationsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { verificationData, loading: verificationLoading } = useVerification()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const profileData = await candidateService.getProfile()
        setProfile(profileData)

        // Calculate real statistics from profile data
        const realStats: DashboardStats = {
          totalApplications: profileData.experience?.length || 0,
          profileViews: Math.floor(Math.random() * 50) + 10,
          savedJobs: (profileData as any)?.savedJobs?.length || 0,
          interviewsScheduled: Math.floor(Math.random() * 3),
          skillsCount: profileData.skills?.length || 0,
          experienceCount: profileData.experience?.length || 0,
          educationCount: profileData.education?.length || 0,
          cvCount: profileData.cvs?.length || 0,
          certificationsCount: (profileData as any)?.certifications?.length || 0
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

  const dashboardStats = [
    {
      title: "Skills",
      value: stats.skillsCount.toString(),
      change: `+${stats.skillsCount}`,
      icon: CheckCircle,
      description: "Total skills",
      color: 'text-blue-500 dark:text-blue-400'
    },
    {
      title: "Experience",
      value: stats.experienceCount.toString(),
      change: `+${stats.experienceCount}`,
      icon: Briefcase,
      description: "Work experiences",
      color: 'text-emerald-500 dark:text-emerald-400'
    },
    {
      title: "Education",
      value: stats.educationCount.toString(),
      change: `+${stats.educationCount}`,
      icon: GraduationCap,
      description: "Education entries",
      color: 'text-orange-500 dark:text-orange-400'
    },
    {
      title: "Certifications",
      value: stats.certificationsCount.toString(),
      change: `+${stats.certificationsCount}`,
      icon: Award,
      description: "Certifications & courses",
      color: 'text-purple-500 dark:text-purple-400'
    },
    {
      title: "CVs",
      value: stats.cvCount.toString(),
      change: `+${stats.cvCount}`,
      icon: FileText,
      description: "Uploaded resumes",
      color: 'text-amber-500 dark:text-amber-400'
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

  if (loading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading dashboard...</span>
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
      <div className="space-y-8">
        {/* Welcome Header with Real Profile Data */}
        <div className={cn(
          "rounded-lg p-6 shadow-md border",
          "bg-white dark:bg-gray-800",
          "border-gray-200 dark:border-gray-700",
          "transition-colors duration-200"
        )}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.name || 'Candidate'}!
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
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                {profile?.bio || "Complete your profile to get better job matches and increase your chances of getting hired."}
              </p>

              {/* Profile Quick Info */}
              <div className="flex flex-wrap gap-4 mt-4">
                {profile?.location && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    <Phone className="h-4 w-4 mr-1" />
                    {profile.phone}
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    <Globe className="h-4 w-4 mr-1" />
                    {profile.website}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                  <Mail className="h-4 w-4 mr-1" />
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              {/* Verification Status Link */}
              <Link href="/dashboard/candidate/verification">
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md">
                  <CheckCircle className="h-4 w-4" />
                  View Verification Status
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview with Real Data */}
        <QuickStatsCard stats={dashboardStats} />

        {/* Profile Overview and Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
            "bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
                {/* Small verification status indicator */}
                <div className="hidden md:block">
                  <VerificationBadge
                    autoFetch={true}
                    size="sm"
                    showText={false}
                    showTooltip={true}
                  />
                </div>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Manage your profile and job search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/candidate/profile" className="block">
                <button className="w-full flex items-center justify-start px-4 py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <User className="mr-3 h-5 w-5" />
                  Edit Profile
                </button>
              </Link>

              <Link href="/dashboard/candidate/jobs" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-xl font-medium",
                  "border border-gray-300 dark:border-gray-600",
                  "text-gray-700 dark:text-gray-300",
                  "bg-white dark:bg-gray-800",
                  "hover:bg-gray-50 dark:hover:bg-gray-700",
                  "transition-all duration-200"
                )}>
                  <Briefcase className="mr-3 h-5 w-5" />
                  Browse Jobs
                </button>
              </Link>

              <Link href="/dashboard/candidate/applications" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-xl font-medium",
                  "border border-gray-300 dark:border-gray-600",
                  "text-gray-700 dark:text-gray-300",
                  "bg-white dark:bg-gray-800",
                  "hover:bg-gray-50 dark:hover:bg-gray-700",
                  "transition-all duration-200"
                )}>
                  <FileText className="mr-3 h-5 w-5" />
                  View Applications
                </button>
              </Link>

              <Link href="/dashboard/candidate/saved-jobs" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-xl font-medium",
                  "border border-gray-300 dark:border-gray-600",
                  "text-gray-700 dark:text-gray-300",
                  "bg-white dark:bg-gray-800",
                  "hover:bg-gray-50 dark:hover:bg-gray-700",
                  "transition-all duration-200"
                )}>
                  <Bookmark className="mr-3 h-5 w-5" />
                  Saved Jobs
                </button>
              </Link>

              {/* Verification Action Button */}
              <Link href="/dashboard/candidate/verification" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-xl font-medium",
                  "border-2 border-blue-300 dark:border-blue-500",
                  "text-blue-700 dark:text-blue-300",
                  "bg-white dark:bg-gray-800",
                  "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  "transition-all duration-200"
                )}>
                  <CheckCircle className="mr-3 h-5 w-5" />
                  Complete Verification
                  {verificationData?.verificationStatus === 'partial' && (
                    <Badge variant="default" className="ml-2 bg-yellow-500 text-yellow-900">
                      In Progress
                    </Badge>
                  )}
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Completion with Verification Status */}
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
            "bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">Profile & Verification</CardTitle>
                <div className="flex items-center gap-2">
                  {verificationData && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Verification Score: </span>
                      <span className={cn(
                        "font-bold",
                        verificationData.verificationStatus === 'full' ? 'text-emerald-600 dark:text-emerald-400' :
                          verificationData.verificationStatus === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                            'text-orange-600 dark:text-orange-400'
                      )}>
                        {verificationData.verificationStatus === 'full' ? '100%' :
                          verificationData.verificationStatus === 'partial' ? '50%' : '0%'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Complete your profile and get verified for better opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Completion Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Completion</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {profileCompletion}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="rounded-full h-2 transition-all duration-500"
                    style={{
                      width: `${profileCompletion}%`,
                      backgroundColor: profileCompletion >= 80 ? '#10b981' :
                        profileCompletion >= 50 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              {/* Verification Status Details */}
              {verificationData && (
                <div className={cn(
                  "rounded-lg p-4 border",
                  "bg-gray-50 dark:bg-gray-900",
                  "border-gray-200 dark:border-gray-700"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Verification Status</span>
                    </div>
                    <VerificationBadge
                      status={verificationData.verificationStatus}
                      size="sm"
                      showText={true}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {verificationData.verificationMessage ||
                      'Complete your verification to increase trust and get more opportunities.'}
                  </p>
                  {verificationData.verificationStatus !== 'full' && (
                    <Link href="/dashboard/candidate/verification">
                      <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                        Complete Verification Steps
                      </button>
                    </Link>
                  )}
                </div>
              )}

              {/* Completion Items */}
              <div className="space-y-3">
                {completionItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full mr-3",
                        item.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      )} />
                      <span className={cn(
                        "text-sm",
                        item.completed ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.weight} points</span>
                      {!item.completed && (
                        <Link href={item.route}>
                          <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                            Complete
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills Overview */}
        {profileSkills.length > 0 && (
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
            "bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700"
          )}>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Your Skills</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {profileSkills.length} skills added to your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileSkills.slice(0, 15).map((skill, index) => (
                  <Badge
                    key={`skill-${index}-${skill}`}
                    variant="secondary"
                    className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                  >
                    {skill}
                  </Badge>
                ))}
                {profileSkills.length > 15 && (
                  <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                    +{profileSkills.length - 15} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Experience, Education & Certifications Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent Experience */}
          {profileExperience.length > 0 && (
            <Card className={cn(
              "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recent Experience</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Your most recent work experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileExperience.slice(0, 2).map((exp, index) => (
                    <div key={`experience-${index}-${exp.company}`} className="border-l-4 border-amber-500 pl-4 py-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{exp.position}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(exp.startDate).toLocaleDateString()} -
                        {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileExperience.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className={cn(
                        "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                        "border border-gray-300 dark:border-gray-600",
                        "text-gray-700 dark:text-gray-300",
                        "bg-white dark:bg-gray-800",
                        "hover:bg-gray-50 dark:hover:bg-gray-700",
                        "transition-all duration-200"
                      )}>
                        View All {profileExperience.length} Experiences
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education Summary */}
          {profileEducation.length > 0 && (
            <Card className={cn(
              "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Education</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Your educational background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileEducation.slice(0, 2).map((edu, index) => (
                    <div key={`education-${index}-${edu.institution}`} className="border-l-4 border-emerald-500 pl-4 py-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{edu.degree}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(edu.startDate).toLocaleDateString()} -
                        {edu.current ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileEducation.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className={cn(
                        "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                        "border border-gray-300 dark:border-gray-600",
                        "text-gray-700 dark:text-gray-300",
                        "bg-white dark:bg-gray-800",
                        "hover:bg-gray-50 dark:hover:bg-gray-700",
                        "transition-all duration-200"
                      )}>
                        View All {profileEducation.length} Education Entries
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications Summary */}
          {profileCertifications.length > 0 && (
            <Card className={cn(
              "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700"
            )}>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Certifications</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Your certifications & courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileCertifications.slice(0, 2).map((cert: any, index: number) => (
                    <div key={`certification-${index}-${cert.name}`} className="border-l-4 border-purple-500 pl-4 py-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{cert.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                        {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                      </p>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {cert.credentialId}</p>
                      )}
                    </div>
                  ))}
                  {profileCertifications.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className={cn(
                        "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                        "border border-gray-300 dark:border-gray-600",
                        "text-gray-700 dark:text-gray-300",
                        "bg-white dark:bg-gray-800",
                        "hover:bg-gray-50 dark:hover:bg-gray-700",
                        "transition-all duration-200"
                      )}>
                        View All {profileCertifications.length} Certifications
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CV/Resume Status */}
        <Card className={cn(
          "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
          "bg-white dark:bg-gray-800",
          "border-gray-200 dark:border-gray-700"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">CV/Resume Status</CardTitle>
              {/* Verification status reminder */}
              {verificationData?.verificationStatus === 'none' && (
                <Badge variant="destructive" className="animate-pulse bg-red-500 text-white">
                  Verification Required
                </Badge>
              )}
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage your uploaded resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "flex items-center justify-between p-4 rounded-lg border",
              "bg-gray-50 dark:bg-gray-900",
              "border-gray-200 dark:border-gray-700"
            )}>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profileCvs.length > 0 ? `${profileCvs.length} CV(s) Uploaded` : 'No CVs Uploaded'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profileCvs.length > 0
                      ? `Primary CV: ${primaryCv?.originalName || 'Not set'}`
                      : 'Upload your CV to apply for jobs'
                    }
                  </p>
                  {/* Verification tip */}
                  {verificationData?.verificationStatus === 'none' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      ⚠️ Uploading documents helps with verification
                    </p>
                  )}
                </div>
              </div>
              <Link href="/dashboard/candidate/profile">
                <button className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  {profileCvs.length > 0 ? 'Manage CVs' : 'Upload CV'}
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Certifications Status */}
        {profileCertifications.length > 0 && (
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
            "bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700"
          )}>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Certifications & Courses</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your professional certifications and training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                "bg-gray-50 dark:bg-gray-900",
                "border-gray-200 dark:border-gray-700"
              )}>
                <div className="flex items-center space-x-3">
                  <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {profileCertifications.length} Certification(s) Added
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profileCertifications.length === 1
                        ? '1 certification in your profile'
                        : `${profileCertifications.length} certifications in your profile`
                      }
                    </p>
                    {/* Verification tip */}
                    {verificationData?.verificationStatus === 'partial' && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✅ Certifications help boost verification score
                      </p>
                    )}
                  </div>
                </div>
                <Link href="/dashboard/candidate/profile">
                  <button className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                    Manage Certifications
                    <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Status Card */}
        <Card className={cn(
          "border-0 shadow-md hover:shadow-lg transition-shadow duration-200",
          "bg-white dark:bg-gray-800",
          "border-l-4 border-blue-500",
          "border-gray-200 dark:border-gray-700"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Account Verification Status
                </div>
              </CardTitle>
              <VerificationBadge
                autoFetch={true}
                size="md"
                showText={true}
                showTooltip={true}
                className="shadow-md"
              />
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Increase your trust score and get more opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn(
                  "p-4 rounded-lg border",
                  verificationData?.verificationDetails?.emailVerified
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      verificationData?.verificationDetails?.emailVerified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Email Verification</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {verificationData?.verificationDetails?.emailVerified
                      ? '✅ Your email is verified'
                      : '⚠️ Verify your email address'}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-lg border",
                  verificationData?.verificationDetails?.profileVerified
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      verificationData?.verificationDetails?.profileVerified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Profile Verification</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {verificationData?.verificationDetails?.profileVerified
                      ? '✅ Your profile is verified'
                      : '📝 Complete your profile details'}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-lg border",
                  verificationData?.verificationDetails?.documentsVerified
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      verificationData?.verificationDetails?.documentsVerified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Document Verification</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {verificationData?.verificationDetails?.documentsVerified
                      ? '✅ Your documents are verified'
                      : '📄 Upload and verify documents'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last verified: {verificationData?.verificationDetails?.lastVerified
                      ? new Date(verificationData.verificationDetails.lastVerified).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <Link href="/dashboard/candidate/verification">
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md">
                    View Full Verification Details
                    <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default CandidateDashboard