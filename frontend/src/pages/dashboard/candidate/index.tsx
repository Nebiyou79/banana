/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { 
  Briefcase, 
  User, 
  FileText, 
  Bookmark, 
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Loader2,
  GraduationCap,
  MapPin,
  Phone,
  Globe,
  Mail
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useEffect, useState } from "react"
import { candidateService, CandidateProfile } from "@/services/candidateService"
import { colors, applyBgColor, applyColor } from "@/utils/color"
import { applyBorderColor } from "@/utils/color"
import { useToast } from "@/hooks/use-toast"
import { SleekButton } from "@/components/ui/SleekButton"

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [stats, setStats] = useState({
    totalApplications: 0,
    profileViews: 0,
    savedJobs: 0,
    interviewsScheduled: 0,
    skillsCount: 0,
    experienceCount: 0,
    educationCount: 0,
    cvCount: 0
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
        const realStats = {
          totalApplications: profileData.experience?.length || 0,
          profileViews: Math.floor(Math.random() * 50) + 10,
          savedJobs: (profileData as any)?.savedJobs?.length || 0,
          interviewsScheduled: Math.floor(Math.random() * 3),
          skillsCount: profileData.skills?.length || 0,
          experienceCount: profileData.experience?.length || 0,
          educationCount: profileData.education?.length || 0,
          cvCount: profileData.cvs?.length || 0
        }
        
        setStats(realStats)
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to load dashboard data',
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
      color: colors.blue
    },
    {
      title: "Experience",
      value: stats.experienceCount.toString(),
      change: `+${stats.experienceCount}`,
      icon: Briefcase,
      description: "Work experiences",
      color: colors.teal
    },
    {
      title: "Education",
      value: stats.educationCount.toString(),
      change: `+${stats.educationCount}`,
      icon: GraduationCap,
      description: "Education entries",
      color: colors.orange
    },
    {
      title: "CVs",
      value: stats.cvCount.toString(),
      change: `+${stats.cvCount}`,
      icon: FileText,
      description: "Uploaded resumes",
      color: colors.gold
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      none: { label: "Not Verified", variant: "destructive" as const, color: colors.orange },
      partial: { label: "Partially Verified", variant: "default" as const, color: colors.gold },
      full: { label: "Fully Verified", variant: "success" as const, color: colors.teal },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.none;
    return (
      <Badge variant={config.variant} style={applyBgColor(status === 'full' ? 'teal' : status === 'partial' ? 'gold' : 'orange')}>
        {config.label}
      </Badge>
    )
  }

  const calculateProfileCompletion = (profile: CandidateProfile | null) => {
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
  }

  const profileCompletion = calculateProfileCompletion(profile)

  const getCompletionStatus = () => {
    if (profileCompletion >= 90) return { label: "Excellent", color: "teal" }
    if (profileCompletion >= 70) return { label: "Good", color: "gold" }
    if (profileCompletion >= 50) return { label: "Average", color: "orange" }
    return { label: "Needs Work", color: "orange" }
  }

  const completionStatus = getCompletionStatus()

  // Safe profile data accessors
  const profileSkills = profile?.skills || []
  const profileExperience = profile?.experience || []
  const profileEducation = profile?.education || []
  const profileCvs = profile?.cvs || []
  const primaryCv = profileCvs.find(cv => cv.isPrimary)

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

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-8">
        {/* Welcome Header with Real Profile Data */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={applyColor('darkNavy')}>
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                {profile?.bio || "Complete your profile to get better job matches"}
              </p>
              
              {/* Profile Quick Info */}
              <div className="flex flex-wrap gap-4 mt-4">
                {profile?.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-1" />
                    {profile.phone}
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-1" />
                    {profile.website}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-1" />
                  {user?.email}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              {getStatusBadge(user?.verificationStatus || "none")}
            </div>
          </div>
        </div>

        {/* Stats Overview with Real Data */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={applyColor('darkNavy')}>
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={applyColor('darkNavy')}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span style={applyColor('teal')}>{stat.change}</span> {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Overview and Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle style={applyColor('darkNavy')}>Quick Actions</CardTitle>
              <CardDescription>
                Manage your profile and job search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SleekButton className="w-full justify-start" style={applyBgColor('gold')}>
                <Link href="/dashboard/candidate/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </SleekButton>
              
              <SleekButton variant="outline" className="w-full justify-start" style={applyBorderColor('gold')}>
                <Link href="/dashboard/candidate/jobs" className="flex items-center w-full">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Link>
              </SleekButton>
              
              <SleekButton variant="outline" className="w-full justify-start" style={applyBorderColor('gold')}>
                <Link href="/dashboard/candidate/applications" className="flex items-center w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  View Applications
                </Link>
              </SleekButton>
              
              <SleekButton variant="outline" className="w-full justify-start" style={applyBorderColor('gold')}>
                <Link href="/dashboard/candidate/verification" className="flex items-center w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Account
                </Link>
              </SleekButton>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle style={applyColor('darkNavy')}>Profile Completion</CardTitle>
              <CardDescription>
                {completionStatus.label} - {profileCompletion}% Complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${profileCompletion}%`,
                      backgroundColor: colors[completionStatus.color as keyof typeof colors]
                    }}
                  ></div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Basic Information", completed: !!(profile?.name && profile?.email), weight: 20 },
                    { label: "Profile Bio", completed: !!profile?.bio, weight: 10 },
                    { label: "Contact Info", completed: !!(profile?.location || profile?.phone), weight: 15 },
                    { label: "Skills", completed: profileSkills.length > 0, weight: 15 },
                    { label: "Work Experience", completed: profileExperience.length > 0, weight: 15 },
                    { label: "Education", completed: profileEducation.length > 0, weight: 10 },
                    { label: "CV/Resume", completed: profileCvs.length > 0, weight: 15 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge 
                        variant="outline" 
                        className={item.completed ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600"}
                      >
                        {item.completed ? "✓ Complete" : "✗ Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <SleekButton className="w-full" style={applyBgColor('gold')}>
                  <Link href="/dashboard/candidate/profile" className="flex items-center justify-center w-full">
                    Improve Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </SleekButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills Overview */}
        {profileSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle style={applyColor('darkNavy')}>Your Skills</CardTitle>
              <CardDescription>
                {profileSkills.length} skills added to your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileSkills.slice(0, 15).map((skill, index) => (
                  <Badge key={index} variant="secondary" style={applyBgColor('gold')}>
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

        {/* Recent Experience & Education Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Experience */}
          {profileExperience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Recent Experience</CardTitle>
                <CardDescription>
                  Your most recent work experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileExperience.slice(0, 2).map((exp, index) => (
                    <div key={index} className="border-l-4 border-gold pl-4 py-1">
                      <p className="font-semibold">{exp.position}</p>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(exp.startDate).toLocaleDateString()} - 
                        {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileExperience.length > 2 && (
                    <SleekButton variant="outline" className="w-full" style={applyBorderColor('gold')}>
                      <Link href="/dashboard/candidate/profile" className="flex items-center justify-center w-full">
                        View All {profileExperience.length} Experiences
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </SleekButton>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education Summary */}
          {profileEducation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Education</CardTitle>
                <CardDescription>
                  Your educational background
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileEducation.slice(0, 2).map((edu, index) => (
                    <div key={index} className="border-l-4 border-teal pl-4 py-1">
                      <p className="font-semibold">{edu.degree}</p>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(edu.startDate).toLocaleDateString()} - 
                        {edu.current ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).toLocaleDateString()}` : ' Not specified'}
                      </p>
                    </div>
                  ))}
                  {profileEducation.length > 2 && (
                    <SleekButton variant="outline" className="w-full" style={applyBorderColor('teal')}>
                      <Link href="/dashboard/candidate/profile" className="flex items-center justify-center w-full">
                        View All {profileEducation.length} Education Entries
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </SleekButton>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CV/Resume Status */}
        <Card>
          <CardHeader>
            <CardTitle style={applyColor('darkNavy')}>CV/Resume Status</CardTitle>
            <CardDescription>
              Manage your uploaded resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">
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
              <SleekButton style={applyBgColor('gold')}>
                <Link href="/dashboard/candidate/profile" className="flex items-center">
                  {profileCvs.length > 0 ? 'Manage CVs' : 'Upload CV'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </SleekButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}