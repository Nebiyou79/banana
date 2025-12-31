/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/[id]/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenderHeader } from '@/components/tenders/TenderHeader';
import { TenderDetails } from '@/components/tenders/TenderDetails';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Shield,
  Calendar,
  FileCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useTender, useCPOUtils, useToggleSaveTender } from '@/hooks/useTenders';
import { useAuth } from '@/contexts/AuthContext';
import { Tender, canViewProposals, formatDeadline, isTenderActive } from '@/services/tenderService';
import { format } from 'date-fns';

export default function CompanyTenderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const { tender, isLoading, error } = useTender(id as string);
  const { isCPORequired, getCPOInfo } = useCPOUtils();
  const { mutate: toggleSave } = useToggleSaveTender();
  
  const [isEligible, setIsEligible] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [cpoInfo, setCpoInfo] = useState<{
    required: boolean;
    description: string;
    hasDescription: boolean;
  } | null>(null);

  useEffect(() => {
    if (tender && user) {
      // Check eligibility
      const { visibility } = tender;
      let eligible = false;

      if (visibility.visibilityType === 'public' || visibility.visibilityType === 'companies_only') {
        eligible = true;
      } else if (visibility.visibilityType === 'invite_only') {
        const isInvited = visibility.invitedEmails?.some((invite: any) => 
          invite.email === user.email && invite.status === 'accepted'
        ) || visibility.allowedCompanies?.includes(user.company || '');
        eligible = isInvited || false;
      }

      setIsEligible(eligible);

      // Check if already applied
      const userApplied = tender.proposals?.some((p: any) => p.applicant === user.id);
      setHasApplied(userApplied);

      // Get CPO info
      if (tender.tenderCategory === 'professional') {
        const info = getCPOInfo(tender);
        setCpoInfo(info);
      }
    }
  }, [tender, user, getCPOInfo]);

  const handleBack = () => {
    router.push('/dashboard/company/tenders');
  };

  const handleApply = () => {
    router.push(`/dashboard/company/tenders/${id}/apply`);
  };

  const handleViewProposals = () => {
    router.push(`/dashboard/company/tenders/${id}/proposals`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleEdit = () => {
    router.push(`/dashboard/company/my-tenders/${id}/edit`);
  };

  const handleSaveToggle = () => {
    if (tender) {
      toggleSave(tender._id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tender) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="p-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Tender Not Found
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error?.message || 'The tender you\'re looking for doesn\'t exist or you don\'t have access.'}
              </p>
              <Button 
                onClick={handleBack}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tenders
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = tender.owner._id === user?.id;
  const canViewAllProposals = canViewProposals(tender);
  const isActive = isTenderActive(tender);
  const deadlinePassed = new Date(tender.deadline) < new Date();
  const daysRemaining = Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const renderAccessAlert = () => {
    if (isOwner) {
      return (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 mb-6">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">Owner View</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            You created this tender. Switch to owner dashboard to manage it.
          </AlertDescription>
        </Alert>
      );
    }

    if (!isEligible) {
      if (tender.visibility.visibilityType === 'invite_only') {
        return (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 mb-6">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">Invitation Required</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              This tender is invite-only. You need an invitation from the owner to submit a proposal.
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 mb-6">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">Not Eligible</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            Your company is not eligible to bid on this tender.
          </AlertDescription>
        </Alert>
      );
    }

    if (!isActive) {
      return (
        <Alert className="bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 mb-6">
          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <AlertTitle className="text-slate-800 dark:text-slate-300">Tender Closed</AlertTitle>
          <AlertDescription className="text-slate-700 dark:text-slate-400">
            The deadline for this tender has passed. No new applications are being accepted.
          </AlertDescription>
        </Alert>
      );
    }

    if (hasApplied) {
      return (
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 mb-6">
          <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-300">Application Submitted</AlertTitle>
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            You have already submitted a proposal for this tender.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <DashboardLayout requiredRole="company">
      <Head>
        <title>{tender.title} | Company Dashboard</title>
        <meta name="description" content={tender.description.substring(0, 160)} />
      </Head>
      
      <div className="space-y-6">
        {/* Back Navigation */}
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          className="gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenders
        </Button>

        {/* Tender Header */}
        <TenderHeader
          tender={tender}
          userRole={isOwner ? "owner" : "company"}
          onShare={handleShare}
          onEdit={handleEdit}
          className="rounded-xl"
        />

        {/* Access Alerts */}
        {renderAccessAlert()}

        {/* Tender Details Component - Full Width */}
        <TenderDetails
          tender={tender}
          userRole={isOwner ? "owner" : "company"}
          userId={user?.id}
          onApply={handleApply}
          onEdit={handleEdit}
          onShare={handleShare}
          onViewProposals={handleViewProposals}
        />

        {/* Quick Action Cards at Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          {/* Eligibility Status */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Eligibility Status</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Visibility</span>
                    <Badge variant="outline">
                      {tender.visibility.visibilityType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Your Status</span>
                    <Badge variant={isEligible ? "success" : "destructive"}>
                      {isEligible ? 'Eligible' : 'Not Eligible'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Application Status</span>
                    <Badge variant={hasApplied ? "success" : "secondary"}>
                      {hasApplied ? 'Applied' : 'Not Applied'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Deadline */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Timeline</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Deadline</span>
                    <span className="font-medium">{format(new Date(tender.deadline), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                    <Badge variant={isActive ? "success" : "destructive"}>
                      {isActive ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Days Remaining</span>
                    <span className="font-medium">{daysRemaining > 0 ? daysRemaining : 0}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDeadline(tender.deadline)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
                <div className="space-y-3">
                  {isActive && !hasApplied && isEligible && (
                    <Button 
                      onClick={handleApply} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleSaveToggle}
                    className="w-full border-slate-300 dark:border-slate-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {tender.metadata?.savedBy?.includes(user?.id || '') ? 'Saved' : 'Save Tender'}
                  </Button>
                  
                  {tender.ownerEntity.website && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(tender.ownerEntity.website, '_blank')}
                      className="w-full border-slate-300 dark:border-slate-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}