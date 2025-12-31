/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { CandidateApplicationDetails } from '@/components/applications/CandidateApplicationDetails';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  ArrowLeft, 
  Building,
  Award,
  Clock,
  TrendingUp,
  Shield,
  HelpCircle,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Users,
  Briefcase,
  Zap,
  Target
} from 'lucide-react';
import { applicationService } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CandidateApplicationDetailPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    successRate: '0%',
    underReview: 0,
    shortlisted: 0
  });

  useEffect(() => {
    if (id) {
      loadApplicationDetails();
      loadApplicationStats();
    }
  }, [id]);

  const loadApplicationDetails = async () => {
    try {
      setIsLoading(true);
      await applicationService.getApplicationDetails(id as string);
    } catch (error: any) {
      console.error('Failed to load application:', error);
      toast({
        title: 'Error',
        description: 'Failed to load application details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplicationStats = async () => {
    try {
      const response = await applicationService.getApplicationStatistics();
      if (response.data?.statistics) {
        const statsData = response.data.statistics;
        setStats({
          totalApplications: statsData.totalApplications || 0,
          successRate: statsData.successRate || '0%',
          underReview: statsData.underReview || 0,
          shortlisted: statsData.shortlisted || 0
        });
      }
    } catch (error) {
      console.error('Failed to load application stats:', error);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/candidate/applications');
  };

  const handleViewJob = () => {
    if (id) {
      router.push(`/jobs/${id}`);
    }
  };

  const handleContactSupport = () => {
    router.push('/help/application-support');
  };

  if (!id || isLoading) {
    return (
      <DashboardLayout>
        <Head>
          <title>Loading Application | JobStack</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 mb-8">
              <Skeleton className="h-12 w-40 rounded-2xl" />
              <Skeleton className="h-12 w-56 rounded-2xl" />
            </div>
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Application Details | JobStack</title>
        <meta name="description" content="View detailed information about your job application" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb and Actions */}
          <div className="mb-8">
            <nav className="flex items-center gap-3 text-base text-slate-600 mb-6">
              <button 
                onClick={handleBack}
                className="flex items-center gap-3 hover:text-slate-800 transition-all duration-300 group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Applications
              </button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-semibold">Application Details</span>
            </nav>
          </div>

          {/* Main Content - Full Width */}
          <div className="space-y-8">
            <CandidateApplicationDetails 
              applicationId={id as string}
              onBack={handleBack}
            />
          </div>

          {/* Helpful Sections Grid */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-amber-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-white/80 shadow-lg transition-all duration-300 hover:scale-105 py-3"
                  onClick={handleViewJob}
                >
                  <ExternalLink className="h-5 w-5 mr-3" />
                  View Job Posting
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white bg-white/80 shadow-lg transition-all duration-300 hover:scale-105 py-3"
                  onClick={() => router.push('/dashboard/candidate/profile')}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  Update Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white bg-white/80 shadow-lg transition-all duration-300 hover:scale-105 py-3"
                  onClick={() => router.push('/jobs')}
                >
                  <Building className="h-5 w-5 mr-3" />
                  Browse More Jobs
                </Button>
              </CardContent>
            </Card>

            {/* Application Timeline Tips */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                <CardTitle className="text-slate-800 text-xl flex items-center gap-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                  Hiring Process Timeline
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  What to expect in the hiring process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100/50 p-2 rounded-full mt-1 flex-shrink-0 backdrop-blur-sm border border-blue-200/30">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-base">Application Review</p>
                    <p className="text-slate-600 text-sm">Typically takes 1-2 weeks for initial screening</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100/50 p-2 rounded-full mt-1 flex-shrink-0 backdrop-blur-sm border border-purple-200/30">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-base">Interview Stage</p>
                    <p className="text-slate-600 text-sm">Phone screening, technical interviews, and final rounds</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100/50 p-2 rounded-full mt-1 flex-shrink-0 backdrop-blur-sm border border-amber-200/30">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-base">Final Decision</p>
                    <p className="text-slate-600 text-sm">Offer letter or constructive feedback provided</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Statistics */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                  Your Application Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex justify-between items-center p-4 bg-blue-500/5 rounded-2xl backdrop-blur-sm border border-blue-200/30">
                  <span className="text-base text-slate-800 font-semibold">Total Applications</span>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/30 backdrop-blur-sm px-4 py-2">{stats.totalApplications}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-emerald-500/5 rounded-2xl backdrop-blur-sm border border-emerald-200/30">
                  <span className="text-base text-slate-800 font-semibold">Under Review</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/30 backdrop-blur-sm px-4 py-2">{stats.underReview}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-500/5 rounded-2xl backdrop-blur-sm border border-amber-200/30">
                  <span className="text-base text-slate-800 font-semibold">Success Rate</span>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-200/30 backdrop-blur-sm px-4 py-2">{stats.successRate}</Badge>
                </div>
                <div className="pt-4 border-t border-slate-200/30">
                  <Button
                    variant="ghost"
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-300 py-3"
                    onClick={() => router.push('/dashboard/candidate/analytics')}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105 lg:col-span-2 xl:col-span-1">
              <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-rose-600" />
                  Need Help?
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  Our support team is here to help
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-4 p-4 bg-rose-500/5 rounded-2xl backdrop-blur-sm border border-rose-200/30">
                  <Mail className="h-5 w-5 text-rose-600" />
                  <span className="text-base text-slate-800 font-medium">support@jobstack.com</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-rose-500/5 rounded-2xl backdrop-blur-sm border border-rose-200/30">
                  <Phone className="h-5 w-5 text-rose-600" />
                  <span className="text-base text-slate-800 font-medium">+1 (555) 123-4567</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2 border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white bg-white/80 shadow-lg transition-all duration-300 hover:scale-105 py-3"
                  onClick={handleContactSupport}
                >
                  <HelpCircle className="h-5 w-5 mr-3" />
                  Get Support
                </Button>
              </CardContent>
            </Card>

            {/* Application Tips */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105 lg:col-span-2">
              <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Target className="h-6 w-6 text-blue-600" />
                  Application Success Tips
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  Best practices to improve your chances
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-200/30 backdrop-blur-sm">
                    <FileText className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-800 text-base">Customize Applications</p>
                      <p className="text-slate-600 text-sm">Tailor each application to match specific job requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-200/30 backdrop-blur-sm">
                    <Users className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-800 text-base">Follow Up</p>
                      <p className="text-slate-600 text-sm">Wait 1-2 weeks before professional follow-up</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-200/30 backdrop-blur-sm">
                    <Briefcase className="h-5 w-5 text-emerald-600 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-800 text-base">Track Progress</p>
                      <p className="text-slate-600 text-sm">Monitor statuses and prepare for next steps</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-200/30 backdrop-blur-sm">
                    <Clock className="h-5 w-5 text-amber-600 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-800 text-base">Be Patient</p>
                      <p className="text-slate-600 text-sm">Hiring processes typically take 2-4 weeks</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA Section */}
          <Card className="mt-12 backdrop-blur-xl bg-gradient-to-r from-slate-800 to-blue-900 border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-6">
                    Ready for your next opportunity?
                  </h3>
                  <p className="text-blue-100 text-xl leading-relaxed">
                    Continue your job search and discover more positions that match your skills.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Button 
                    onClick={() => router.push('/jobs')}
                    className="bg-white text-slate-800 hover:bg-gray-100 shadow-2xl px-10 py-4 text-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <Building className="h-6 w-6 mr-3" />
                    Browse Jobs
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard/candidate/profile')}
                    className="border-white text-white hover:bg-white hover:text-slate-800 px-10 py-4 text-xl font-semibold transition-all duration-300 hover:scale-105"
                  >
                    <Award className="h-6 w-6 mr-3" />
                    Update Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateApplicationDetailPage;