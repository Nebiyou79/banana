import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { 
  Briefcase, 
  User, 
  FileText, 
  Bookmark, 
  ArrowRight,
  TrendingUp,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import Button from "@/components/forms/Button"
import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function CandidateDashboard() {
  const { user } = useAuth()

  const stats = [
    {
      title: "Applications",
      value: "12",
      change: "+2",
      icon: Briefcase,
      description: "This month"
    },
    {
      title: "Profile Views",
      value: "156",
      change: "+12",
      icon: User,
      description: "This week"
    },
    {
      title: "Saved Jobs",
      value: "8",
      change: "+3",
      icon: Bookmark,
      description: "Total saved"
    },
    {
      title: "Interviews",
      value: "3",
      change: "+1",
      icon: CheckCircle,
      description: "Upcoming"
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      none: { label: "Not Verified", variant: "destructive" as const },
      partial: { label: "Partially Verified", variant: "default" as const },
      full: { label: "Fully Verified", variant: "success" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.none;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-8">
        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>
              Complete your verification to access all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Account Verification</p>
                  <p className="text-sm text-gray-600">
                    {user?.verificationStatus === "full" 
                      ? "Your account is fully verified" 
                      : "Complete verification process"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(user?.verificationStatus || "none")}
                <Button variant="outline">
                  <Link href="/dashboard/candidate/verification">
                    Verify Account
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your job search quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start">
                <Link href="/dashboard/candidate/jobs">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Link href="/dashboard/candidate/profile">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Link href="/dashboard/candidate/applications">
                  <FileText className="mr-2 h-4 w-4" />
                  View Applications
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>
                Complete your profile to get better job matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Basic Information</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Complete
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Skills & Experience</span>
                  <Badge variant="outline">Incomplete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Education</span>
                  <Badge variant="outline">Incomplete</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CV/Resume</span>
                  <Badge variant="outline">Missing</Badge>
                </div>
                
                <Button className="w-full">
                  <Link href="/dashboard/candidate/profile">
                    Complete Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent job search activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Applied to Frontend Developer</p>
                    <p className="text-sm text-gray-600">TechCorp Inc. • 2 hours ago</p>
                  </div>
                </div>
                <Badge variant="outline">Applied</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Profile viewed by recruiter</p>
                    <p className="text-sm text-gray-600">DesignStudio • 5 hours ago</p>
                  </div>
                </div>
                <Badge variant="outline">Viewed</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded">
                    <Bookmark className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Saved UX Designer position</p>
                    <p className="text-sm text-gray-600">Creative Labs • 1 day ago</p>
                  </div>
                </div>
                <Badge variant="outline">Saved</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}