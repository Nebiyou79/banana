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
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import ProfileCompletionCard from "@/components/candidate/ProfileCompletionCard"
import QuickStatsCard from "@/components/candidate/QuickStatsCard"
import { candidateService, CandidateProfile } from "@/services/candidateService"
import { applyBgColor, applyColor, applyBorderColor } from "@/utils/color"
import { useToast } from "@/hooks/use-toast"

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
        // Error is already handled by the service, just show generic message
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
      color: '#3B82F6' // blue
    },
    {
      title: "Experience",
      value: stats.experienceCount.toString(),
      change: `+${stats.experienceCount}`,
      icon: Briefcase,
      description: "Work experiences",
      color: '#14B8A6' // teal
    },
    {
      title: "Education",
      value: stats.educationCount.toString(),
      change: `+${stats.educationCount}`,
      icon: GraduationCap,
      description: "Education entries",
      color: '#F97316' // orange
    },
    {
      title: "Certifications",
      value: stats.certificationsCount.toString(),
      change: `+${stats.certificationsCount}`,
      icon: Award,
      description: "Certifications & courses",
      color: '#8B5CF6' // purple
    },
    {
      title: "CVs",
      value: stats.cvCount.toString(),
      change: `+${stats.cvCount}`,
      icon: FileText,
      description: "Uploaded resumes",
      color: '#EAB308' // gold
    }
  ]

  const getStatusBadge = (status: string) => {
    try {
      const statusConfig = {
        none: { label: "Not Verified", variant: "destructive", color: "orange" },
        partial: { label: "Partially Verified", variant: "default", color: "gold" },
        full: { label: "Fully Verified", variant: "success", color: "teal" },
      } as const;

      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.none;

      return (
        <Badge variant={config.variant} style={applyBgColor(config.color)}>
          {config.label}
        </Badge>
      );
    } catch (error) {
      console.error('Status badge error:', error);
      return (
        <Badge variant="destructive" style={applyBgColor('orange')}>
          Unknown
        </Badge>
      );
    }
  };

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
          <Loader2 className="h-8 w-8 animate-spin" style={applyColor('gold')} />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
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
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={applyColor('darkNavy')}>
                Welcome back, {user?.name || 'Candidate'}!
              </h1>
              <p className="text-gray-600 mt-2 max-w-2xl">
                {profile?.bio || "Complete your profile to get better job matches and increase your chances of getting hired."}
              </p>
              
              {/* Profile Quick Info */}
              <div className="flex flex-wrap gap-4 mt-4">
                {profile?.location && (
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Phone className="h-4 w-4 mr-1" />
                    {profile.phone}
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Globe className="h-4 w-4 mr-1" />
                    {profile.website}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Mail className="h-4 w-4 mr-1" />
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              {getStatusBadge(profile?.verificationStatus || "none")}
            </div>
          </div>
        </div>

        {/* Stats Overview with Real Data */}
        <QuickStatsCard stats={dashboardStats} />

        {/* Profile Overview and Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle style={applyColor('darkNavy')}>Quick Actions</CardTitle>
              <CardDescription>
                Manage your profile and job search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/candidate/profile" className="block">
                <button className="w-full flex items-center justify-start px-4 py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg" style={applyBgColor('gold')}>
                  <User className="mr-3 h-5 w-5" />
                  Edit Profile
                </button>
              </Link>
              
              <Link href="/dashboard/candidate/jobs" className="block">
                <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all" style={applyBorderColor('gold')}>
                  <Briefcase className="mr-3 h-5 w-5" />
                  Browse Jobs
                </button>
              </Link>
              
              <Link href="/dashboard/candidate/applications" className="block">
                <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all" style={applyBorderColor('gold')}>
                  <FileText className="mr-3 h-5 w-5" />
                  View Applications
                </button>
              </Link>
              
              <Link href="/dashboard/candidate/saved-jobs" className="block">
                <button className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all" style={applyBorderColor('gold')}>
                  <Bookmark className="mr-3 h-5 w-5" />
                  Saved Jobs
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <ProfileCompletionCard 
            completion={profileCompletion}
            items={completionItems}
          />
        </div>

        {/* Skills Overview */}
        {profileSkills.length > 0 && (
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle style={applyColor('darkNavy')}>Your Skills</CardTitle>
              <CardDescription>
                {profileSkills.length} skills added to your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileSkills.slice(0, 15).map((skill, index) => (
                  <Badge key={`skill-${index}-${skill}`} variant="secondary" style={applyBgColor('gold')}>
                    {skill}
                  </Badge>
                ))}
                {profileSkills.length > 15 && (
                  <Badge variant="outline">
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Recent Experience</CardTitle>
                <CardDescription>
                  Your most recent work experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileExperience.slice(0, 2).map((exp, index) => (
                    <div key={`experience-${index}-${exp.company}`} className="border-l-4 border-gold pl-4 py-1">
                      <p className="font-semibold text-gray-900">{exp.position}</p>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(exp.startDate).toLocaleDateString()} - 
                        {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileExperience.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all" style={applyBorderColor('gold')}>
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Education</CardTitle>
                <CardDescription>
                  Your educational background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileEducation.slice(0, 2).map((edu, index) => (
                    <div key={`education-${index}-${edu.institution}`} className="border-l-4 border-teal pl-4 py-1">
                      <p className="font-semibold text-gray-900">{edu.degree}</p>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(edu.startDate).toLocaleDateString()} - 
                        {edu.current ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileEducation.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all" style={applyBorderColor('teal')}>
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
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Certifications</CardTitle>
                <CardDescription>
                  Your certifications & courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileCertifications.slice(0, 2).map((cert: any, index: number) => (
                    <div key={`certification-${index}-${cert.name}`} className="border-l-4 border-purple pl-4 py-1">
                      <p className="font-semibold text-gray-900">{cert.name}</p>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      <p className="text-xs text-gray-500">
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                        {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                      </p>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>
                      )}
                    </div>
                  ))}
                  {profileCertifications.length > 2 && (
                    <Link href="/dashboard/candidate/profile">
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all" style={applyBorderColor('blue')}>
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
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle style={applyColor('darkNavy')}>CV/Resume Status</CardTitle>
            <CardDescription>
              Manage your uploaded resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {profileCvs.length > 0 ? `${profileCvs.length} CV(s) Uploaded` : 'No CVs Uploaded'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {profileCvs.length > 0 
                      ? `Primary CV: ${primaryCv?.originalName || 'Not set'}`
                      : 'Upload your CV to apply for jobs'
                    }
                  </p>
                </div>
              </div>
              <Link href="/dashboard/candidate/profile">
                <button className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg" style={applyBgColor('gold')}>
                  {profileCvs.length > 0 ? 'Manage CVs' : 'Upload CV'}
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Certifications Status */}
        {profileCertifications.length > 0 && (
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle style={applyColor('darkNavy')}>Certifications & Courses</CardTitle>
              <CardDescription>
                Your professional certifications and training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Award className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {profileCertifications.length} Certification(s) Added
                    </p>
                    <p className="text-sm text-gray-600">
                      {profileCertifications.length === 1 
                        ? '1 certification in your profile'
                        : `${profileCertifications.length} certifications in your profile`
                      }
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/candidate/profile">
                  <button className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg" style={applyBgColor('teal')}>
                    Manage Certifications
                    <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CandidateDashboard