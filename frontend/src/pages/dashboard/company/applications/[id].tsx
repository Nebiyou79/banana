// pages/dashboard/company/applications/[id].tsx - PREMIUM VERSION
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '@/services/applicationService';
import { CompanyApplicationDetails } from '@/components/applications/CompanyApplicationDetails';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  ArrowLeft, 
  FileText, 
  RefreshCw, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Building,
  Download,
  Crown,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

const CompanyApplicationDetailPage: React.FC = () => {
  const router = useRouter();
  const { id: applicationId } = router.query;

  const { 
    data: applicationData, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!applicationId) throw new Error('Application ID is required');
      const response = await applicationService.getApplicationDetails(applicationId as string);
      return response.data.application;
    },
    enabled: !!applicationId,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const handleBack = () => {
    router.push('/dashboard/company/applications');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleStatusUpdate = (updatedApplication: any) => {
    refetch();
  };

  // Premium Glass Card Component
  const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children, 
    className = '' 
  }) => (
    <div 
      className={`rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-2xl shadow-black/5 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
      }}
    >
      {children}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header Skeleton */}
            <GlassCard className="p-8">
              <div className="flex items-center gap-6">
                <Skeleton className="h-12 w-32 rounded-xl" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64 rounded-lg" />
                  <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
            </GlassCard>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <GlassCard className="p-8">
                <Skeleton className="h-64 rounded-xl" />
              </GlassCard>
              <GlassCard className="p-8">
                <Skeleton className="h-48 rounded-xl" />
              </GlassCard>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !applicationData) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <GlassCard className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-rose-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                Application Not Found
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mb-2 max-w-md">
                {error instanceof Error 
                  ? error.message 
                  : 'The application you\'re looking for doesn\'t exist or you don\'t have permission to view it.'
                }
              </CardDescription>
              <p className="text-gray-500 text-sm mb-8">
                Please check the application ID and try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
                <Button 
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 hover:from-amber-500 hover:to-yellow-500"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Premium Header */}
          <GlassCard className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 shadow-lg">
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          Candidate Review
                        </h1>
                        <p className="text-gray-600 text-lg mt-1">
                          Premium application management
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`
                          px-4 py-2 font-semibold border-0 backdrop-blur-sm
                          ${applicationData.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' :
                            applicationData.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' :
                            applicationData.status === 'interview-scheduled' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' :
                            applicationData.status === 'under-review' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                            'bg-blue-500/20 text-blue-300 border-blue-400/30'
                          }
                        `}
                      >
                        {applicationService.getStatusLabel(applicationData.status)}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
                      >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {/* Application metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
                    <div className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-full border border-white/40">
                      <Calendar className="h-4 w-4" />
                      <span>Applied {new Date(applicationData.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-full border border-white/40">
                      <Building className="h-4 w-4" />
                      <span>
                        {applicationData.job.jobType === 'organization' 
                          ? applicationData.job.organization?.name 
                          : applicationData.job.company?.name
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-full border border-white/40">
                      <FileText className="h-4 w-4" />
                      <span>ID: {applicationData._id.slice(-8)}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1.5 rounded-full text-amber-900">
                      <Sparkles className="h-4 w-4" />
                      <span>Premium View</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Application Details Component */}
          <CompanyApplicationDetails
            applicationId={applicationId as string}
            viewType="company"
            onBack={handleBack}
            onStatusUpdate={handleStatusUpdate}
          />

          {/* Premium Footer */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600">
                <p>Premium candidate management experience • Glass UI Design</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/company/jobs/${applicationData.job._id}/applications`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/50 transition-colors"
                >
                  <Building className="h-4 w-4" />
                  View Job Applications
                </Link>
                <Button
                  variant="outline"
                  className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyApplicationDetailPage;