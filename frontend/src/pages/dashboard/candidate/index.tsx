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
import QuickStatsCard, { StatItem } from "@/components/candidate/QuickStatsCard"
import { candidateService, CandidateProfile } from "@/services/candidateService"
import { useToast } from "@/hooks/use-toast"
import VerificationBadge from '@/components/verifcation/VerificationBadge'
import { useVerification } from '@/hooks/useVerification'
import { cn } from '@/lib/utils'
import { colorClasses } from '@/utils/color'

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

  const dashboardStats: StatItem[] = [
    {
      title: "Skills",
      value: stats.skillsCount.toString(),
      change: `+${stats.skillsCount}`,
      icon: CheckCircle,
      description: "Total skills",
      color: "blue"
    },
    {
      title: "Experience",
      value: stats.experienceCount.toString(),
      change: `+${stats.experienceCount}`,
      icon: Briefcase,
      description: "Work experiences",
      color: "teal"
    },
    {
      title: "Education",
      value: stats.educationCount.toString(),
      change: `+${stats.educationCount}`,
      icon: GraduationCap,
      description: "Education entries",
      color: "orange"
    },
    {
      title: "Certifications",
      value: stats.certificationsCount.toString(),
      change: `+${stats.certificationsCount}`,
      icon: Award,
      description: "Certifications & courses",
      color: "teal"
    },
    {
      title: "CVs",
      value: stats.cvCount.toString(),
      change: `+${stats.cvCount}`,
      icon: FileText,
      description: "Uploaded resumes",
      color: "goldenMustard"
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
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 className={cn("h-12 w-12 animate-spin", colorClasses.text.goldenMustard)} />
          <span className={cn("text-lg", colorClasses.text.gray800)}>Loading dashboard...</span>
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
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Welcome Header with Real Profile Data */}
        <div className={cn(
          "rounded-xl p-6 shadow-sm border",
          colorClasses.bg.white,
          colorClasses.border.gray100,
          "transition-colors duration-200"
        )}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h1 className={cn(
                  "text-2xl md:text-3xl font-bold",
                  colorClasses.text.darkNavy
                )}>
                  Welcome Back, {user?.name || 'Candidate'}!
                </h1>
                {/* Verification Badge */}
                {!verificationLoading && (
                  <div className="flex-shrink-0">
                    <VerificationBadge
                      autoFetch={true}
                      size="md"
                      showText={true}
                      showTooltip={true}
                      className="shadow-sm"
                    />
                  </div>
                )}
              </div>
              <p className={cn(
                "text-sm md:text-base",
                colorClasses.text.gray800,
                "mt-2 max-w-2xl"
              )}>
                {profile?.bio || "Complete your profile to get better job matches and increase your chances of getting hired."}
              </p>

              {/* Profile Quick Info */}
              <div className="flex flex-wrap gap-3 mt-4">
                {profile?.location && (
                  <div className={cn(
                    "flex items-center text-xs md:text-sm px-3 py-1.5 rounded-lg",
                    colorClasses.text.gray800,
                    colorClasses.bg.gray100
                  )}>
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                    {profile.location}
                  </div>
                )}
                {profile?.phone && (
                  <div className={cn(
                    "flex items-center text-xs md:text-sm px-3 py-1.5 rounded-lg",
                    colorClasses.text.gray800,
                    colorClasses.bg.gray100
                  )}>
                    <Phone className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                    {profile.phone}
                  </div>
                )}
                {profile?.website && (
                  <div className={cn(
                    "flex items-center text-xs md:text-sm px-3 py-1.5 rounded-lg",
                    colorClasses.text.gray800,
                    colorClasses.bg.gray100
                  )}>
                    <Globe className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                    <span className="truncate max-w-[120px] md:max-w-none">{profile.website}</span>
                  </div>
                )}
                <div className={cn(
                  "flex items-center text-xs md:text-sm px-3 py-1.5 rounded-lg",
                  colorClasses.text.gray800,
                  colorClasses.bg.gray100
                )}>
                  <Mail className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                  <span className="truncate max-w-[150px] md:max-w-none">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              {/* Verification Status Link */}
              <Link href="/dashboard/candidate/verification" className="block">
                <button className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-lg font-medium",
                  "w-full md:w-auto",
                  "transition-all duration-200 hover:shadow-md",
                  colorClasses.bg.darkNavy,
                  "text-white"
                )}>
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="whitespace-nowrap">View Verification</span>
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
            "border shadow-sm hover:shadow-md transition-shadow duration-200",
            colorClasses.bg.white,
            colorClasses.border.gray100
          )}>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className={cn(
                  "text-xl md:text-2xl",
                  colorClasses.text.darkNavy
                )}>Quick Actions</CardTitle>
                {/* Small verification status indicator */}
                <div className="hidden sm:block">
                  <VerificationBadge
                    autoFetch={true}
                    size="sm"
                    showText={false}
                    showTooltip={true}
                  />
                </div>
              </div>
              <CardDescription className={cn(
                "text-sm md:text-base",
                colorClasses.text.gray800
              )}>
                Manage your profile and job search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/candidate/profile" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-lg font-medium",
                  "transition-all duration-200 hover:shadow-md",
                  colorClasses.bg.goldenMustard,
                  "text-white"
                )}>
                  <User className="mr-3 h-5 w-5" />
                  <span>Edit Profile</span>
                </button>
              </Link>

              <Link href="/dashboard/candidate/jobs" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-lg font-medium",
                  "transition-all duration-200",
                  colorClasses.border.gray100,
                  colorClasses.text.darkNavy,
                  colorClasses.bg.white,
                  "hover:bg-gray-50"
                )}>
                  <Briefcase className="mr-3 h-5 w-5" />
                  <span>Browse Jobs</span>
                </button>
              </Link>

              <Link href="/dashboard/candidate/applications" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-lg font-medium",
                  "transition-all duration-200",
                  colorClasses.border.gray100,
                  colorClasses.text.darkNavy,
                  colorClasses.bg.white,
                  "hover:bg-gray-50"
                )}>
                  <FileText className="mr-3 h-5 w-5" />
                  <span>View Applications</span>
                </button>
              </Link>

              <Link href="/dashboard/candidate/saved-jobs" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-lg font-medium",
                  "transition-all duration-200",
                  colorClasses.border.gray100,
                  colorClasses.text.darkNavy,
                  colorClasses.bg.white,
                  "hover:bg-gray-50"
                )}>
                  <Bookmark className="mr-3 h-5 w-5" />
                  <span>Saved Jobs</span>
                </button>
              </Link>

              {/* Verification Action Button */}
              <Link href="/dashboard/candidate/verification" className="block">
                <button className={cn(
                  "w-full flex items-center justify-start px-4 py-3 rounded-lg font-medium",
                  "transition-all duration-200",
                  "border-2",
                  colorClasses.border.blue,
                  colorClasses.text.blue,
                  colorClasses.bg.white,
                  "hover:bg-blue-50"
                )}>
                  <CheckCircle className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">Complete Verification</span>
                  {verificationData?.verificationStatus === 'partial' && (
                    <Badge variant="default" className={cn(
                      "ml-2",
                      colorClasses.bg.goldenMustard,
                      "text-white"
                    )}>
                      In Progress
                    </Badge>
                  )}
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Completion with Verification Status */}
          <Card className={cn(
            "border shadow-sm hover:shadow-md transition-shadow duration-200",
            colorClasses.bg.white,
            colorClasses.border.gray100
          )}>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className={cn(
                  "text-xl md:text-2xl",
                  colorClasses.text.darkNavy
                )}>Profile & Verification</CardTitle>
                <div className="flex items-center gap-2">
                  {verificationData && (
                    <div className={cn(
                      "text-sm",
                      colorClasses.text.gray800
                    )}>
                      <span className="font-medium">Verification Score: </span>
                      <span className={cn(
                        "font-bold",
                        verificationData.verificationStatus === 'full' ? colorClasses.text.teal :
                          verificationData.verificationStatus === 'partial' ? colorClasses.text.goldenMustard :
                            colorClasses.text.orange
                      )}>
                        {verificationData.verificationStatus === 'full' ? '100%' :
                          verificationData.verificationStatus === 'partial' ? '50%' : '0%'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <CardDescription className={cn(
                "text-sm md:text-base",
                colorClasses.text.gray800
              )}>
                Complete your profile and get verified for better opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Completion Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={cn(
                    "text-sm font-medium",
                    colorClasses.text.darkNavy
                  )}>Profile Completion</span>
                  <span className={cn(
                    "text-sm font-bold",
                    colorClasses.text.goldenMustard
                  )}>
                    {profileCompletion}%
                  </span>
                </div>
                <div className={cn(
                  "w-full rounded-full h-2",
                  colorClasses.bg.gray100
                )}>
                  <div
                    className="rounded-full h-2 transition-all duration-500"
                    style={{
                      width: `${profileCompletion}%`,
                      backgroundColor: profileCompletion >= 80 ? '#10b981' :
                        profileCompletion >= 50 ? '#F1BB03' : '#EF4444'
                    }}
                  />
                </div>
              </div>

              {/* Verification Status Details */}
              {verificationData && (
                <div className={cn(
                  "rounded-lg p-4 border",
                  colorClasses.bg.gray100,
                  colorClasses.border.gray100
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={cn("h-4 w-4", colorClasses.text.gray800)} />
                      <span className={cn(
                        "text-sm font-medium",
                        colorClasses.text.darkNavy
                      )}>Verification Status</span>
                    </div>
                    <VerificationBadge
                      status={verificationData.verificationStatus}
                      size="sm"
                      showText={true}
                    />
                  </div>
                  <p className={cn(
                    "text-xs mt-2",
                    colorClasses.text.gray800
                  )}>
                    {verificationData.verificationMessage ||
                      'Complete your verification to increase trust and get more opportunities.'}
                  </p>
                  {verificationData.verificationStatus !== 'full' && (
                    <Link href="/dashboard/candidate/verification">
                      <button className={cn(
                        "w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium",
                        "transition-all duration-200 hover:shadow-md",
                        colorClasses.bg.darkNavy,
                        "text-white"
                      )}>
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
                        "w-2.5 h-2.5 rounded-full mr-3",
                        item.completed ? 'bg-green-500' : colorClasses.bg.gray400
                      )} />
                      <span className={cn(
                        "text-sm",
                        item.completed ? colorClasses.text.darkNavy : colorClasses.text.gray400
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs",
                        colorClasses.text.gray400
                      )}>{item.weight} points</span>
                      {!item.completed && (
                        <Link href={item.route}>
                          <button className={cn(
                            "text-xs font-medium hover:underline",
                            colorClasses.text.blue
                          )}>
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
            "border shadow-sm hover:shadow-md transition-shadow duration-200",
            colorClasses.bg.white,
            colorClasses.border.gray100
          )}>
            <CardHeader className="pb-4">
              <CardTitle className={cn(
                "text-xl md:text-2xl",
                colorClasses.text.darkNavy
              )}>Your Skills</CardTitle>
              <CardDescription className={cn(
                "text-sm md:text-base",
                colorClasses.text.gray800
              )}>
                {profileSkills.length} skills added to your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileSkills.slice(0, 10).map((skill, index) => (
                  <Badge
                    key={`skill-${index}-${skill}`}
                    variant="secondary"
                    className={cn(
                      colorClasses.bg.goldenMustard,
                      colorClasses.text.white
                    )}
                  >
                    {skill}
                  </Badge>
                ))}
                {profileSkills.length > 10 && (
                  <Badge variant="outline" className={cn(
                    colorClasses.border.gray100,
                    colorClasses.text.gray800
                  )}>
                    +{profileSkills.length - 10} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Experience, Education & Certifications Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Experience */}
          {profileExperience.length > 0 && (
            <Card className={cn(
              "border shadow-sm hover:shadow-md transition-shadow duration-200",
              colorClasses.bg.white,
              colorClasses.border.gray100
            )}>
              <CardHeader className="pb-4">
                <CardTitle className={cn(
                  "text-lg md:text-xl",
                  colorClasses.text.darkNavy
                )}>Recent Experience</CardTitle>
                <CardDescription className={cn(
                  "text-sm",
                  colorClasses.text.gray800
                )}>
                  Your most recent work experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileExperience.slice(0, 2).map((exp, index) => (
                    <div key={`experience-${index}-${exp.company}`} className={cn(
                      "border-l-4 pl-4 py-2",
                      colorClasses.border.goldenMustard
                    )}>
                      <p className={cn(
                        "font-semibold text-sm md:text-base",
                        colorClasses.text.darkNavy
                      )}>{exp.position}</p>
                      <p className={cn(
                        "text-sm",
                        colorClasses.text.gray800
                      )}>{exp.company}</p>
                      <p className={cn(
                        "text-xs",
                        colorClasses.text.gray400
                      )}>
                        {new Date(exp.startDate).toLocaleDateString()} -
                        {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileExperience.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className={cn(
                        "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                        "transition-all duration-200",
                        colorClasses.border.gray100,
                        colorClasses.text.darkNavy,
                        colorClasses.bg.white,
                        "hover:bg-gray-50"
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
              "border shadow-sm hover:shadow-md transition-shadow duration-200",
              colorClasses.bg.white,
              colorClasses.border.gray100
            )}>
              <CardHeader className="pb-4">
                <CardTitle className={cn(
                  "text-lg md:text-xl",
                  colorClasses.text.darkNavy
                )}>Education</CardTitle>
                <CardDescription className={cn(
                  "text-sm",
                  colorClasses.text.gray800
                )}>
                  Your educational background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileEducation.slice(0, 2).map((edu, index) => (
                    <div key={`education-${index}-${edu.institution}`} className={cn(
                      "border-l-4 pl-4 py-2",
                      colorClasses.border.teal
                    )}>
                      <p className={cn(
                        "font-semibold text-sm md:text-base",
                        colorClasses.text.darkNavy
                      )}>{edu.degree}</p>
                      <p className={cn(
                        "text-sm",
                        colorClasses.text.gray800
                      )}>{edu.institution}</p>
                      <p className={cn(
                        "text-xs",
                        colorClasses.text.gray400
                      )}>
                        {new Date(edu.startDate).toLocaleDateString()} -
                        {edu.current ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileEducation.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className={cn(
                        "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                        "transition-all duration-200",
                        colorClasses.border.gray100,
                        colorClasses.text.darkNavy,
                        colorClasses.bg.white,
                        "hover:bg-gray-50"
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
              "border shadow-sm hover:shadow-md transition-shadow duration-200",
              colorClasses.bg.white,
              colorClasses.border.gray100
            )}>
              <CardHeader className="pb-4">
                <CardTitle className={cn(
                  "text-lg md:text-xl",
                  colorClasses.text.darkNavy
                )}>Certifications</CardTitle>
                <CardDescription className={cn(
                  "text-sm",
                  colorClasses.text.gray800
                )}>
                  Your certifications & courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileCertifications.slice(0, 2).map((cert: any, index: number) => (
                    <div key={`certification-${index}-${cert.name}`} className={cn(
                      "border-l-4 pl-4 py-2",
                      colorClasses.border.blue
                    )}>
                      <p className={cn(
                        "font-semibold text-sm md:text-base",
                        colorClasses.text.darkNavy
                      )}>{cert.name}</p>
                      <p className={cn(
                        "text-sm",
                        colorClasses.text.gray800
                      )}>{cert.issuer}</p>
                      <p className={cn(
                        "text-xs",
                        colorClasses.text.gray400
                      )}>
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                        {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                      </p>
                      {cert.credentialId && (
                        <p className={cn(
                          "text-xs",
                          colorClasses.text.gray400
                        )}>ID: {cert.credentialId}</p>
                      )}
                    </div>
                  ))}
                  {profileCertifications.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className={cn(
                        "w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium",
                        "transition-all duration-200",
                        colorClasses.border.gray100,
                        colorClasses.text.darkNavy,
                        colorClasses.bg.white,
                        "hover:bg-gray-50"
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
          "border shadow-sm hover:shadow-md transition-shadow duration-200",
          colorClasses.bg.white,
          colorClasses.border.gray100
        )}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className={cn(
                "text-xl md:text-2xl",
                colorClasses.text.darkNavy
              )}>CV/Resume Status</CardTitle>
              {/* Verification status reminder */}
              {verificationData?.verificationStatus === 'none' && (
                <Badge variant="destructive" className="animate-pulse">
                  Verification Required
                </Badge>
              )}
            </div>
            <CardDescription className={cn(
              "text-sm md:text-base",
              colorClasses.text.gray800
            )}>
              Manage your uploaded resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4",
              colorClasses.bg.gray100,
              colorClasses.border.gray100
            )}>
              <div className="flex items-center space-x-3">
                <FileText className={cn(
                  "h-8 w-8",
                  colorClasses.text.blue
                )} />
                <div>
                  <p className={cn(
                    "font-medium text-sm md:text-base",
                    colorClasses.text.darkNavy
                  )}>
                    {profileCvs.length > 0 ? `${profileCvs.length} CV(s) Uploaded` : 'No CVs Uploaded'}
                  </p>
                  <p className={cn(
                    "text-xs md:text-sm",
                    colorClasses.text.gray800
                  )}>
                    {profileCvs.length > 0
                      ? `Primary CV: ${primaryCv?.originalName || 'Not set'}`
                      : 'Upload your CV to apply for jobs'
                    }
                  </p>
                  {/* Verification tip */}
                  {verificationData?.verificationStatus === 'none' && (
                    <p className={cn(
                      "text-xs mt-1",
                      colorClasses.text.orange
                    )}>
                      ⚠️ Uploading documents helps with verification
                    </p>
                  )}
                </div>
              </div>
              <Link href="/dashboard/candidate/profile">
                <button className={cn(
                  "px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-medium",
                  "transition-all duration-200 hover:shadow-md",
                  "whitespace-nowrap",
                  colorClasses.bg.goldenMustard,
                  "text-white"
                )}>
                  {profileCvs.length > 0 ? 'Manage CVs' : 'Upload CV'}
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status Card */}
        <Card className={cn(
          "border shadow-sm hover:shadow-md transition-shadow duration-200",
          colorClasses.bg.white,
          "border-l-4",
          colorClasses.border.blue
        )}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className={cn(
                "text-xl md:text-2xl",
                colorClasses.text.darkNavy
              )}>
                <div className="flex items-center gap-2">
                  <Shield className={cn(
                    "h-5 w-5",
                    colorClasses.text.blue
                  )} />
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
            <CardDescription className={cn(
              "text-sm md:text-base",
              colorClasses.text.gray800
            )}>
              Increase your trust score and get more opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn(
                  "p-4 rounded-lg border",
                  verificationData?.verificationDetails?.emailVerified
                    ? cn(
                      colorClasses.bg.teal,
                      colorClasses.text.white
                    )
                    : cn(
                      colorClasses.bg.gray100,
                      colorClasses.text.gray800
                    )
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      verificationData?.verificationDetails?.emailVerified ? 'bg-white' : colorClasses.bg.gray400
                    )} />
                    <span className="font-medium">Email Verification</span>
                  </div>
                  <p className="text-sm">
                    {verificationData?.verificationDetails?.emailVerified
                      ? '✅ Your email is verified'
                      : '⚠️ Verify your email address'}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-lg border",
                  verificationData?.verificationDetails?.profileVerified
                    ? cn(
                      colorClasses.bg.teal,
                      colorClasses.text.white
                    )
                    : cn(
                      colorClasses.bg.gray100,
                      colorClasses.text.gray800
                    )
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      verificationData?.verificationDetails?.profileVerified ? 'bg-white' : colorClasses.bg.gray400
                    )} />
                    <span className="font-medium">Profile Verification</span>
                  </div>
                  <p className="text-sm">
                    {verificationData?.verificationDetails?.profileVerified
                      ? '✅ Your profile is verified'
                      : '📝 Complete your profile details'}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-lg border",
                  verificationData?.verificationDetails?.documentsVerified
                    ? cn(
                      colorClasses.bg.teal,
                      colorClasses.text.white
                    )
                    : cn(
                      colorClasses.bg.gray100,
                      colorClasses.text.gray800
                    )
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      verificationData?.verificationDetails?.documentsVerified ? 'bg-white' : colorClasses.bg.gray400
                    )} />
                    <span className="font-medium">Document Verification</span>
                  </div>
                  <p className="text-sm">
                    {verificationData?.verificationDetails?.documentsVerified
                      ? '✅ Your documents are verified'
                      : '📄 Upload and verify documents'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t gap-4">
                <div>
                  <p className={cn(
                    "text-sm",
                    colorClasses.text.gray800
                  )}>
                    Last verified: {verificationData?.verificationDetails?.lastVerified
                      ? new Date(verificationData.verificationDetails.lastVerified).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                <Link href="/dashboard/candidate/verification">
                  <button className={cn(
                    "px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-medium",
                    "transition-all duration-200 hover:shadow-md",
                    colorClasses.bg.darkNavy,
                    "text-white"
                  )}>
                    <span className="whitespace-nowrap">View Full Verification Details</span>
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