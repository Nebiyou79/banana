/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle,
  Plus,
  Users,
  Briefcase,
  Star,
  Zap,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { applicationService } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { colors, colorClasses } from '@/utils/color';

const CandidateApplicationsPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    rejected: 0,
    successRate: '0%'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTips, setExpandedTips] = useState(false);

  useEffect(() => {
    loadApplicationStats();
  }, []);

  const loadApplicationStats = async () => {
    try {
      setIsLoading(true);
      const response = await applicationService.getApplicationStatistics();
      if (response.data?.statistics) {
        const statsData = response.data.statistics;
        setStats({
          total: statsData.totalApplications || 0,
          underReview: statsData.underReview || 0,
          shortlisted: statsData.shortlisted || 0,
          interviewScheduled: statsData.interviewScheduled || 0,
          rejected: statsData.rejected || 0,
          successRate: statsData.successRate || '0%'
        });
      }
    } catch (error: any) {
      console.error('Failed to load application statistics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load application statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseJobs = () => {
    router.push('/jobs');
  };

  const handleApplicationUpdate = (application: any) => {
    loadApplicationStats();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'applied': 'bg-blue-100 text-blue-700 border-blue-200',
      'under-review': 'bg-amber-100 text-amber-700 border-amber-200',
      'shortlisted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'interview-scheduled': 'bg-purple-100 text-purple-700 border-purple-200',
      'offer-made': 'bg-amber-100 text-amber-700 border-amber-200',
      'rejected': 'bg-rose-100 text-rose-700 border-rose-200',
      'offer-accepted': 'bg-teal-100 text-teal-700 border-teal-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <>
      <DashboardLayout>
        <Head>
          <title>My Applications | JobStack</title>
          <meta name="description" content="View and manage your job applications" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>

        <div className="min-h-screen bg-white">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Applications</h1>
                <p className="text-xs text-gray-500">Track all your job applications</p>
              </div>
              <Button
                onClick={handleBrowseJobs}
                className={`${colorClasses.bg.darkNavy} hover:opacity-90 text-white px-3 py-2 text-sm`}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span className="hidden xs:inline">Browse Jobs</span>
              </Button>
            </div>
          </div>

          <div className="p-4">
            {/* Statistics Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Reviewing</p>
                      <p className="text-xl font-bold text-gray-900">{stats.underReview}</p>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-lg">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Shortlisted</p>
                      <p className="text-xl font-bold text-gray-900">{stats.shortlisted}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Success Rate</p>
                      <p className="text-xl font-bold text-gray-900">{stats.successRate}</p>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-lg">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview - Mobile */}
            <Card className="mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
              <CardHeader className="pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">Status Overview</CardTitle>
                    <CardDescription className="text-xs text-gray-500">Your application progress</CardDescription>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {stats.total} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                    <span className="text-xs font-medium text-blue-700">Applied</span>
                    <span className="text-sm font-bold text-blue-900">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg">
                    <span className="text-xs font-medium text-amber-700">Reviewing</span>
                    <span className="text-sm font-bold text-amber-900">{stats.underReview}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700">Shortlisted</span>
                    <span className="text-sm font-bold text-emerald-900">{stats.shortlisted}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-lg">
                    <span className="text-xs font-medium text-rose-700">Not Selected</span>
                    <span className="text-sm font-bold text-rose-900">{stats.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm py-2.5 rounded-lg border-gray-300"
                />
              </div>
            </div>

            {/* Filter Toggle Button - Mobile Only */}
            <div className="mb-4 lg:hidden">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full justify-between border-gray-300 text-gray-700 py-2.5"
              >
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters & Sort
                </div>
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Filters - Collapsible on Mobile */}
            {(showFilters || window.innerWidth >= 1024) && (
              <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="border-gray-300 text-sm py-2.5">
                        <SelectValue placeholder="All applications" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-sm">All Applications</SelectItem>
                        <SelectItem value="under-review" className="text-sm">Under Review</SelectItem>
                        <SelectItem value="shortlisted" className="text-sm">Shortlisted</SelectItem>
                        <SelectItem value="interview-scheduled" className="text-sm">Interview Scheduled</SelectItem>
                        <SelectItem value="offer-made" className="text-sm">Offer Made</SelectItem>
                        <SelectItem value="rejected" className="text-sm">Not Selected</SelectItem>
                        <SelectItem value="withdrawn" className="text-sm">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Sort by</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-gray-300 text-sm py-2.5">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="newest" className="text-sm">Newest First</SelectItem>
                        <SelectItem value="oldest" className="text-sm">Oldest First</SelectItem>
                        <SelectItem value="recently-updated" className="text-sm">Recently Updated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Applications List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
              <ApplicationList
                viewType="candidate"
                onApplicationUpdate={handleApplicationUpdate}
              />
            </div>

            {/* Empty State - Mobile Optimized */}
            {stats.total === 0 && !isLoading && (
              <Card className="mb-6 bg-gradient-to-br from-white to-blue-50 border border-gray-200 shadow-sm rounded-xl">
                <CardContent className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Start your job search and apply to positions that match your skills and interests.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleBrowseJobs}
                      className={`w-full ${colorClasses.bg.darkNavy} hover:opacity-90 text-white py-3`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Available Jobs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/candidate/profile')}
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Tips - Mobile Optimized */}
            {stats.total > 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
                <button
                  onClick={() => setExpandedTips(!expandedTips)}
                  className="w-full px-4 py-3.5 flex items-center justify-between bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-amber-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">Success Tips</p>
                      <p className="text-xs text-gray-500">Improve your application success rate</p>
                    </div>
                  </div>
                  {expandedTips ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                {expandedTips && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm mb-1">Customize Applications</p>
                          <p className="text-xs text-gray-600">Tailor each application to match job requirements.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm mb-1">Follow Up Strategically</p>
                          <p className="text-xs text-gray-600">Wait 1-2 weeks before following up professionally.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-emerald-50 rounded-lg flex-shrink-0">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm mb-1">Track Your Progress</p>
                          <p className="text-xs text-gray-600">Monitor statuses and prepare for each next step.</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => window.open('/resources/application-tips', '_blank')}
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm py-2"
                      >
                        View more tips
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Mobile Action Bar */}
          {stats.total > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-600">{stats.total} applications</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className={`font-medium ${stats.successRate !== '0%' ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {stats.successRate} success rate
                  </span>
                </div>
                <Button
                  onClick={handleBrowseJobs}
                  className={`${colorClasses.bg.darkNavy} hover:opacity-90 text-white px-3 py-2 text-sm`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Desktop View (hidden on mobile) */}
          <div className="hidden lg:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Original desktop content remains here */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      My Applications
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Track and manage all your job applications in one place
                    </p>
                  </div>
                  <Button
                    onClick={handleBrowseJobs}
                    className={`${colorClasses.bg.darkNavy} hover:opacity-90 text-white px-8 py-3 text-base font-semibold`}
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Browse Jobs
                  </Button>
                </div>
              </div>

              {/* Desktop Statistics Cards */}
              <div className="grid grid-cols-5 gap-6 mb-8">
                <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Total Applications</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Under Review</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.underReview}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <Users className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Shortlisted</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.shortlisted}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Interviews</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.interviewScheduled}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.successRate}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <Star className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Application Status Overview */}
              <Card className="mb-8 bg-white border border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-6 border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-800">Application Status Overview</CardTitle>
                  <CardDescription className="text-gray-600">
                    Summary of your application progress across different stages
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-7 gap-4">
                    {[
                      { status: 'Applied', count: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { status: 'Reviewing', count: stats.underReview, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                      { status: 'Shortlisted', count: stats.shortlisted, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { status: 'Interview', count: stats.interviewScheduled, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      { status: 'Not Selected', count: stats.rejected, color: 'bg-rose-50 text-rose-700 border-rose-200' },
                      { status: 'Withdrawn', count: 0, color: 'bg-gray-50 text-gray-700 border-gray-200' }
                    ].map((item, index) => (
                      <div key={index} className="text-center">
                        <Badge className={`mb-3 ${item.color} font-medium px-3 py-1.5 rounded-lg`}>
                          {item.status}
                        </Badge>
                        <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Quick Filters */}
              <Card className="mb-8 bg-white border border-gray-200 shadow-lg rounded-xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          placeholder="Search by job title, company..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 py-2.5 rounded-lg border-gray-300"
                        />
                      </div>
                    </div>
                    <div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="border-gray-300 py-2.5">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="all">All Applications</SelectItem>
                          <SelectItem value="under-review">Under Review</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="interview-scheduled">Interview Scheduled</SelectItem>
                          <SelectItem value="offer-made">Offer Made</SelectItem>
                          <SelectItem value="rejected">Not Selected</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="border-gray-300 py-2.5">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="recently-updated">Recently Updated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Applications List */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden mb-8">
                <ApplicationList
                  viewType="candidate"
                  onApplicationUpdate={handleApplicationUpdate}
                />
              </div>

              {/* Desktop Tips Section */}
              {stats.total > 0 && (
                <Card className="bg-white border border-gray-200 shadow-lg rounded-xl">
                  <CardHeader className="pb-6 border-b border-gray-200">
                    <CardTitle className="text-gray-800 flex items-center gap-3 text-xl font-bold">
                      <Zap className="h-6 w-6 text-amber-600" />
                      Application Success Tips
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Best practices to improve your application success rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="p-2.5 bg-blue-50 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 mb-2">Customize Your Applications</p>
                          <p className="text-gray-600 text-sm">Tailor each application to match the specific job requirements.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="p-2.5 bg-purple-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 mb-2">Follow Up Strategically</p>
                          <p className="text-gray-600 text-sm">Wait 1-2 weeks before following up professionally.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="p-2.5 bg-emerald-50 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 mb-2">Track Your Progress</p>
                          <p className="text-gray-600 text-sm">Monitor application statuses and prepare systematically.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default CandidateApplicationsPage;