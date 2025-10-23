// pages/dashboard/candidate/applications/index.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Calendar,
  Building2,
  MapPin,
  DollarSign,
  BarChart3,
  Bell,
  Search,
  User
} from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { applyBgColor, applyColor } from "@/utils/color"

const ApplicationsComingSoon: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: "Application Tracking",
      description: "Track all your job applications in one place with real-time status updates"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Monitor your application success rates and optimize your job search strategy"
    },
    {
      icon: Calendar,
      title: "Interview Scheduling",
      description: "Manage your interview calendar and get smart reminders"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get instant updates when employers view or respond to your applications"
    }
  ]

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="relative inline-flex">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 opacity-20 blur-sm"></div>
            <span className="relative inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <Clock className="h-4 w-4 mr-2" />
              Coming Soon
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={applyColor('darkNavy')}>
            Application Tracking
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We`re building a powerful dashboard to help you track, manage, and optimize your job applications.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Section */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl" style={applyColor('darkNavy')}>
              Application Dashboard Preview
            </CardTitle>
            <CardDescription>
              Here`s a glimpse of what we`re building for you
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mock Dashboard */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8">
              <div className="max-w-6xl mx-auto">
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Applied", value: "12", color: "blue" },
                    { label: "Interviews", value: "3", color: "teal" },
                    { label: "Offers", value: "1", color: "green" },
                    { label: "Response Rate", value: "25%", color: "gray" }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 text-center shadow-sm border">
                      <div className={`text-2xl font-bold mb-1 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'teal' ? 'text-teal-600' :
                        stat.color === 'green' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Applications List */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 p-6 border-b bg-gray-50 text-sm font-medium text-gray-600">
                    <div className="col-span-4">Position & Company</div>
                    <div className="col-span-2">Date Applied</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Salary</div>
                  </div>
                  
                  {/* Table Rows */}
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="grid grid-cols-12 gap-4 p-6 border-b hover:bg-gray-50 transition-colors">
                      <div className="col-span-4">
                        <div className="font-medium text-gray-900">Senior Frontend Developer</div>
                        <div className="text-sm text-gray-600">Tech Solutions Inc</div>
                      </div>
                      <div className="col-span-2 text-gray-600">Jan 15, 2024</div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Under Review
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-600">Addis Ababa</div>
                      <div className="col-span-2 text-gray-600">25,000 - 35,000 ETB</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Get Notified */}
          <Card className="border-0 shadow-lg overflow-hidden" style={applyBgColor('darkNavy')}>
            <CardContent className="p-8">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Get Notified First</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  We`ll send you an email as soon as the application tracking feature is ready for you to use.
                </p>
                <button 
                  className="w-full px-6 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Notify Me When Ready
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Continue Exploring */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={applyColor('darkNavy')}>Continue Your Journey</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  While we build this feature, continue exploring opportunities and improving your profile.
                </p>
                <div className="space-y-3">
                  <Link href="/dashboard/candidate/jobs">
                    <button className="w-full flex items-center justify-center px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg" style={applyBgColor('gold')}>
                      <Building2 className="mr-3 h-5 w-5" />
                      Browse Available Jobs
                    </button>
                  </Link>
                  
                  <Link href="/dashboard/candidate/profile">
                    <button className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                      <User className="mr-3 h-5 w-5" />
                      Optimize Your Profile
                    </button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Indicator */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4" style={applyColor('darkNavy')}>We`re Working On It</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 max-w-2xl mx-auto mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '65%' }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">
                Development in progress • Estimated completion: Q1 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ApplicationsComingSoon