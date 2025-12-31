// pages/dashboard/candidate/proposals/index.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import {
  FileText,
  Clock,
  Building2,
  Bell,
  Search,
  User,
  Send,
  TrendingUp,
  Eye,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { applyBgColor, applyColor } from "@/utils/color"

const ProposalsComingSoon: React.FC = () => {
  const features = [
    {
      icon: Send,
      title: "Proposal Management",
      description: "Create, send, and track proposals for projects and freelance opportunities"
    },
    {
      icon: TrendingUp,
      title: "Success Analytics",
      description: "Track your proposal acceptance rates and optimize your approach"
    },
    {
      icon: MessageSquare,
      title: "Client Communication",
      description: "Integrated messaging system for seamless client interactions"
    },
    {
      icon: Eye,
      title: "Proposal Views",
      description: "Get notified when clients view your proposals and show interest"
    }
  ]

  return (
    <DashboardLayout requiredRole="freelancer">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="relative inline-flex">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 blur-sm"></div>
            <span className="relative inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
              <Clock className="h-4 w-4 mr-2" />
              Coming Soon
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={applyColor('darkNavy')}>
            Proposal Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We`re building a comprehensive system to help you create, send, and track project proposals effectively.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
              Proposals Dashboard Preview
            </CardTitle>
            <CardDescription>
              Here`s a glimpse of the powerful proposal management system we`re building
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mock Dashboard */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8">
              <div className="max-w-6xl mx-auto">
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Sent", value: "24", color: "purple" },
                    { label: "Viewed", value: "18", color: "blue" },
                    { label: "Accepted", value: "6", color: "green" },
                    { label: "Success Rate", value: "25%", color: "pink" }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 text-center shadow-sm border">
                      <div className={`text-2xl font-bold mb-1 ${stat.color === 'purple' ? 'text-purple-600' :
                        stat.color === 'blue' ? 'text-blue-600' :
                          stat.color === 'green' ? 'text-green-600' : 'text-pink-600'
                        }`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Proposals List */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 p-6 border-b bg-gray-50 text-sm font-medium text-gray-600">
                    <div className="col-span-4">Project & Client</div>
                    <div className="col-span-2">Sent Date</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Budget</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  {/* Table Rows */}
                  {[
                    { project: "E-commerce Website", client: "Retail Solutions", date: "Jan 18, 2024", status: "Viewed", budget: "45,000 ETB", color: "blue" },
                    { project: "Mobile App Development", client: "Tech Startup", date: "Jan 15, 2024", status: "Under Review", budget: "65,000 ETB", color: "purple" },
                    { project: "UI/UX Design", client: "Design Studio", date: "Jan 12, 2024", status: "Accepted", budget: "35,000 ETB", color: "green" }
                  ].map((proposal, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-6 border-b hover:bg-gray-50 transition-colors">
                      <div className="col-span-4">
                        <div className="font-medium text-gray-900">{proposal.project}</div>
                        <div className="text-sm text-gray-600">{proposal.client}</div>
                      </div>
                      <div className="col-span-2 text-gray-600">{proposal.date}</div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${proposal.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          proposal.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                          <Eye className="h-3 w-3 mr-1" />
                          {proposal.status}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-600">{proposal.budget}</div>
                      <div className="col-span-2">
                        <button className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" style={applyColor('darkNavy')}>
              Professional Proposal Templates
            </CardTitle>
            <CardDescription>
              Choose from pre-designed templates to create compelling proposals quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Standard Project", color: "from-blue-500 to-blue-600" },
                { name: "Freelance Contract", color: "from-purple-500 to-purple-600" },
                { name: "Hourly Rate", color: "from-green-500 to-green-600" }
              ].map((template, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center hover:border-purple-300 transition-colors">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">Professional template for {template.name.toLowerCase()} proposals</p>
                  <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Get Notified */}
          <Card className="border-0 shadow-lg overflow-hidden" style={applyBgColor('darkNavy')}>
            <CardContent className="p-8">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Be the First to Know</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Get notified when our proposal management system launches and start winning more projects.
                </p>
                <button
                  className="w-full px-6 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h3 className="text-2xl font-bold mb-4" style={applyColor('darkNavy')}>Prepare for Success</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Build your profile and portfolio now to be ready when proposals launch.
                </p>
                <div className="space-y-3">
                  <Link href="/dashboard/candidate/jobs">
                    <button className="w-full flex items-center justify-center px-6 py-3 text-white rounded-xl font-semibold transition-all hover:shadow-lg" style={applyBgColor('gold')}>
                      <Building2 className="mr-3 h-5 w-5" />
                      Find Project Opportunities
                    </button>
                  </Link>

                  <Link href="/dashboard/candidate/profile">
                    <button className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                      <User className="mr-3 h-5 w-5" />
                      Enhance Your Profile
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
              <h3 className="text-xl font-semibold mb-4" style={applyColor('darkNavy')}>Development Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 max-w-2xl mx-auto mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '45%' }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">
                Development in progress • Estimated completion: Q2 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ProposalsComingSoon