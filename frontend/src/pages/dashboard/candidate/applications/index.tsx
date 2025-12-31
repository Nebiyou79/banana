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
  Zap
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { applicationService } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

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

  // const getStatusColor = (status: string) => {
  //   const statusColors: Record<string, string> = {
  //     'applied': 'bg-blue-500/10 text-blue-600 border-blue-200/30',
  //     'under-review': 'bg-amber-500/10 text-amber-600 border-amber-200/30',
  //     'shortlisted': 'bg-emerald-500/10 text-emerald-600 border-emerald-200/30',
  //     'interview-scheduled': 'bg-purple-500/10 text-purple-600 border-purple-200/30',
  //     'offer-made': 'bg-amber-500/10 text-amber-600 border-amber-200/30',
  //     'rejected': 'bg-rose-500/10 text-rose-600 border-rose-200/30',
  //     'offer-accepted': 'bg-teal-500/10 text-teal-600 border-teal-200/30'
  //   };
  //   return statusColors[status] || 'bg-slate-500/10 text-slate-600 border-slate-200/30';
  // };

  return (
    <>
      <DashboardLayout>
        <Head>
          <title>My Applications | JobStack</title>
          <meta name="description" content="View and manage your job applications" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
                    My Applications
                  </h1>
                  <p className="text-slate-600 text-xl leading-relaxed">
                    Track and manage all your job applications in one place
                  </p>
                </div>
                <Button 
                  onClick={handleBrowseJobs}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-3 text-lg font-semibold"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Browse Jobs
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Total Applications</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-200/30 backdrop-blur-sm">
                      <FileText className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Under Review</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.underReview}</p>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-200/30 backdrop-blur-sm">
                      <Users className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Shortlisted</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.shortlisted}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-200/30 backdrop-blur-sm">
                      <TrendingUp className="h-7 w-7 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Interviews</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.interviewScheduled}</p>
                    </div>
                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-200/30 backdrop-blur-sm">
                      <Calendar className="h-7 w-7 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Success Rate</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.successRate}</p>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-200/30 backdrop-blur-sm">
                      <Star className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Application Status Overview */}
            <Card className="mb-8 backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                <CardTitle className="text-2xl font-bold text-slate-800">Application Status Overview</CardTitle>
                <CardDescription className="text-slate-600 text-lg">
                  Summary of your application progress across different stages
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                  {[
                    { status: 'Applied', count: stats.total, color: 'bg-blue-500/10 text-blue-600 border-blue-200/30' },
                    { status: 'Under Review', count: stats.underReview, color: 'bg-amber-500/10 text-amber-600 border-amber-200/30' },
                    { status: 'Shortlisted', count: stats.shortlisted, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/30' },
                    { status: 'Interview', count: stats.interviewScheduled, color: 'bg-purple-500/10 text-purple-600 border-purple-200/30' },
                    { status: 'Not Selected', count: stats.rejected, color: 'bg-rose-500/10 text-rose-600 border-rose-200/30' },
                    { status: 'Withdrawn', count: 0, color: 'bg-slate-500/10 text-slate-600 border-slate-200/30' }
                  ].map((item, index) => (
                    <div key={index} className="text-center group transition-all duration-300 hover:scale-110">
                      <Badge className={`mb-4 ${item.color} backdrop-blur-sm font-semibold px-5 py-3 shadow-lg rounded-2xl group-hover:shadow-xl transition-all`}>
                        {item.status}
                      </Badge>
                      <p className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card className="mb-8 backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        placeholder="Search by job title, company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 py-3 text-lg rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 py-3 text-lg rounded-2xl">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl rounded-2xl">
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

                  {/* Sort */}
                  <div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 py-3 text-lg rounded-2xl">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl rounded-2xl">
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="recently-updated">Recently Updated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            <div className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
              <ApplicationList 
                viewType="candidate"
                onApplicationUpdate={handleApplicationUpdate}
              />
            </div>

            {/* Empty State Guidance */}
            {stats.total === 0 && !isLoading && (
              <Card className="mt-8 backdrop-blur-xl bg-gradient-to-br from-white/80 to-teal-50/30 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100/50 to-teal-100/50 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-blue-200/30">
                    <AlertCircle className="h-12 w-12 text-blue-500/80" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-6">No Applications Yet</h3>
                  <p className="text-slate-600 mb-8 max-w-2xl mx-auto text-xl leading-relaxed">
                    You haven`t submitted any job applications yet. Start your job search and apply to positions that match your skills and interests.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Button 
                      onClick={handleBrowseJobs}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl px-10 py-4 text-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Browse Available Jobs
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/candidate/profile')}
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-10 py-4 text-xl transition-all duration-300 hover:scale-105"
                    >
                      <Briefcase className="h-6 w-6 mr-3" />
                      Update Your Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Section */}
            {stats.total > 0 && (
              <Card className="mt-8 backdrop-blur-xl bg-gradient-to-br from-white/80 to-amber-50/30 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                  <CardTitle className="text-slate-800 flex items-center gap-4 text-2xl font-bold">
                    <Zap className="h-7 w-7 text-amber-600" />
                    Application Success Tips
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-xl">
                    Best practices to improve your application success rate
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="flex items-start gap-6 p-6 bg-white/50 rounded-2xl border border-slate-200/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-200/30 backdrop-blur-sm">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg mb-3">Customize Your Applications</p>
                        <p className="text-slate-600 leading-relaxed">Tailor each application to match the specific job requirements and company culture.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6 p-6 bg-white/50 rounded-2xl border border-slate-200/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-200/30 backdrop-blur-sm">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg mb-3">Follow Up Strategically</p>
                        <p className="text-slate-600 leading-relaxed">Wait 1-2 weeks before following up and always be professional in your communications.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6 p-6 bg-white/50 rounded-2xl border border-slate-200/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-200/30 backdrop-blur-sm">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg mb-3">Track Your Progress</p>
                        <p className="text-slate-600 leading-relaxed">Monitor application statuses and prepare systematically for each next step.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default CandidateApplicationsPage;