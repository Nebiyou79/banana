/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard/organization/tenders/[id]/index.tsx
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenderDetails } from '@/components/tenders/TenderDetails';
import { TenderHeader } from '@/components/tenders/TenderHeader';
import { 
  useOwnerTender,
  useDeleteTender, 
  usePublishTender, 
  useRevealProposals,
  useTenderStats,
  useInviteUsersToTender
} from '@/hooks/useTenders';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/social/ui/Button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  Copy,
  Download,
  Edit2,
  Eye,
  FileText,
  Globe,
  Lock,
  MoreVertical,
  RefreshCw,
  Share2,
  Trash2,
  Users,
  Shield,
  FileCheck,
  HardDrive,
  FileIcon,
  Building2,
  Unlock,
  Settings,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getEditRestrictionReason,
  formatDeadline,
  getStatusColor,
  TENDER_STATUSES,
  WORKFLOW_TYPES,
  VISIBILITY_TYPES,
  formatFileSize
} from '@/services/tenderService';

const TenderDetailsPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  
  // Use the owner-specific hook
  const { 
    tender, 
    canViewProposals, 
    isOwner, 
    canEdit: canEditFromHook,
    isLoading, 
    error, 
    refetch 
  } = useOwnerTender(id as string);
  
  const { data: statsData } = useTenderStats(id as string);
  const { mutate: deleteTender, isPending: isDeleting } = useDeleteTender();
  const { mutate: publishTender, isPending: isPublishing } = usePublishTender();
  const { mutate: revealProposals, isPending: isRevealing } = useRevealProposals();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Set active tab from URL if present
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query.tab]);

  // Check for 403 errors and show appropriate message
  useEffect(() => {
    if (error && (error as any)?.response?.status === 403) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this tender.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Check if user can edit
  const canEdit = canEditFromHook || false;
  const editRestrictionReason = tender ? getEditRestrictionReason(tender) : null;
  const isActive = tender ? 
    (tender.status === 'published' || tender.status === 'locked') && 
    new Date(tender.deadline) > new Date()
    : false;

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle actions
  const handleEdit = () => {
    if (canEdit) {
      router.push(`/dashboard/organization/tenders/${id}/edit`);
    } else if (editRestrictionReason) {
      toast({
        title: 'Cannot Edit',
        description: editRestrictionReason,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    deleteTender(id as string, {
      onSuccess: () => {
        router.push('/dashboard/organization/tenders');
        toast({
          title: 'Tender Deleted',
          description: 'The tender has been successfully deleted.',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Delete Failed',
          description: error?.response?.data?.message || 'Failed to delete tender',
          variant: 'destructive',
        });
      }
    });
  };

  const handlePublish = () => {
    publishTender(id as string, {
      onSuccess: () => {
        toast({
          title: 'Tender Published',
          description: 'Your tender is now live and visible to eligible users.',
          variant: 'success',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Publish Failed',
          description: error?.response?.data?.message || 'Failed to publish tender',
          variant: 'destructive',
        });
      }
    });
  };

  const handleRevealProposals = () => {
    revealProposals(id as string, {
      onSuccess: () => {
        toast({
          title: 'Proposals Revealed',
          description: 'All sealed proposals are now visible.',
          variant: 'success',
        });
        refetch();
      },
      onError: (error: any) => {
        toast({
          title: 'Reveal Failed',
          description: error?.response?.data?.message || 'Failed to reveal proposals',
          variant: 'destructive',
        });
      }
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/tender/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Tender link copied to clipboard',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = () => {
    toast({
      title: 'Coming Soon',
      description: 'Duplicate feature will be available soon.',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Export Started',
      description: 'Your tender data is being exported.',
    });
  };

  const handleCopyReference = async () => {
    if (tender?.professionalSpecific?.referenceNumber) {
      await navigator.clipboard.writeText(tender.professionalSpecific.referenceNumber);
      toast({
        title: 'Copied',
        description: 'Reference number copied to clipboard',
        variant: 'success',
      });
    }
  };

  const handleCopyTenderId = async () => {
    if (tender?._id) {
      await navigator.clipboard.writeText(tender._id);
      toast({
        title: 'Copied',
        description: 'Tender ID copied to clipboard',
        variant: 'success',
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab: value },
    }, undefined, { shallow: true });
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="space-y-6">
              {/* Breadcrumb Skeleton */}
              <Skeleton className="h-4 w-48" />
              
              {/* Header Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              
              {/* Tabs Skeleton */}
              <div className="flex space-x-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              
              {/* Content Skeleton */}
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show 403 error page
  if (error && (error as any)?.response?.status === 403) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <Card className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-center p-12">
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30">
                  <Lock className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Access Denied
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You don`t have permission to view this tender. This might be because:
                  </p>
                  <ul className="text-left text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                      The tender belongs to another organization
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                      The tender has been deleted or archived
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                      You need specific permissions to view this tender
                    </li>
                  </ul>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push('/dashboard/organization/tenders')}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Organization Tenders
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Tender not found (but no error)
  if (!tender && !error) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <Card className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-center p-12">
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Tender Not Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    The tender you`re looking for doesn`t exist or has been deleted.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/organization/tenders')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Organization Tenders
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If we get here but no tender, show error
  if (!tender) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <Card className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-center p-12">
              <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Error Loading Tender
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {error?.message || 'An unknown error occurred while loading the tender.'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push('/dashboard/organization/tenders')}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Organization Tenders
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = statsData?.stats;
  const statusConfig = TENDER_STATUSES.find(s => s.value === tender.status);
  const workflowConfig = WORKFLOW_TYPES.find(w => w.value === tender.workflowType);
  const visibilityConfig = VISIBILITY_TYPES.find(v => v.value === tender.visibility.visibilityType);
  const isFreelance = tender.tenderCategory === 'freelance';
  const canRevealProposals = tender.workflowType === 'closed' && 
    tender.status === 'deadline_reached' && 
    !tender.revealedAt;

  // Get user ID from tender owner
  const userId = tender.owner?._id;

  return (
    <>
      <Head>
        <title>{tender.title} | Organization Tenders</title>
        <meta name="description" content={tender.description.substring(0, 160)} />
      </Head>

      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-white dark:bg-gray-950">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Breadcrumb */}
              <div className="mb-6">
                <button
                  onClick={() => router.push('/dashboard/organization/tenders')}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Organization Tenders
                </button>
              </div>

              {/* Tender Header Component */}
              <TenderHeader
                tender={tender}
                userRole="owner"
                userId={userId}
                onShare={handleShare}
                onEdit={handleEdit}
                className="mb-6"
                showFullDetails={true}
              />

              <Separator className="my-6" />
              
              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-transparent p-0 gap-0 border-b border-gray-200 dark:border-gray-800 w-full rounded-none">
                  <TabsTrigger 
                    value="overview" 
                    className={cn(
                      "rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500",
                      "px-4 py-3 font-medium data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500",
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="proposals" 
                    className={cn(
                      "rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500",
                      "px-4 py-3 font-medium data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500",
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Proposals
                    {tender.metadata.totalApplications > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 min-w-5 p-0 text-xs">
                        {tender.metadata.totalApplications}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className={cn(
                      "rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500",
                      "px-4 py-3 font-medium data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500",
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents" 
                    className={cn(
                      "rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500",
                      "px-4 py-3 font-medium data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500",
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                    {tender.attachments.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 min-w-5 p-0 text-xs">
                        {tender.attachments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className={cn(
                      "rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-500",
                      "px-4 py-3 font-medium data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500",
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Overview Tab */}
              <TabsContent value="overview" className="m-0 space-y-6">
                {tender && (
                  <TenderDetails
                    tender={tender}
                    userRole="owner"
                    userId={userId}
                    onEdit={handleEdit}
                    onShare={handleShare}
                    onViewProposals={() => handleTabChange('proposals')}
                  />
                )}
              </TabsContent>

              {/* Proposals Tab */}
              <TabsContent value="proposals" className="m-0">
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    {tender.workflowType === 'closed' && !canViewProposals ? (
                      <div className="text-center py-12">
                        <div className="inline-flex flex-col items-center max-w-md mx-auto">
                          <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                            <Lock className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                          </div>
                          
                          <h3 className="text-2xl font-bold mb-3">Proposals Are Sealed</h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-8">
                            This is a sealed bid tender. All proposals are encrypted and securely stored.
                            No one can view proposal contents until the official reveal time after the deadline.
                          </p>
                          
                          {/* Countdown Timer */}
                          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-6">
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                              {new Date(tender.deadline) < new Date() 
                                ? 'Proposals will be revealed shortly'
                                : 'Proposals will be revealed after deadline'
                              }
                            </div>
                            
                            <div className="flex items-center justify-center gap-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                  {Math.max(0, Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Days</div>
                              </div>
                            </div>
                            
                            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                              {new Date(tender.deadline) < new Date() 
                                ? 'Evaluation in progress'
                                : `Until ${new Date(tender.deadline).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}`
                              }
                            </div>
                          </div>
                          
                          {/* Reveal Button for Owner */}
                          {canRevealProposals && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  <h4 className="font-medium text-blue-700 dark:text-blue-300">Security & Trust Guarantee</h4>
                                </div>
                                <p className="text-sm text-blue-600 dark:text-blue-400 text-left">
                                  All proposals are encrypted with military-grade encryption and can now be revealed.
                                </p>
                              </div>
                              <Button
                                onClick={() => setShowRevealDialog(true)}
                                size="lg"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Unlock className="w-4 h-4 mr-2" />
                                Reveal All Proposals
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : tender.metadata.totalApplications === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex flex-col items-center max-w-md mx-auto">
                          <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                            <Users className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">No Proposals Yet</h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {isActive 
                              ? 'No proposals have been submitted yet. Check back closer to the deadline.'
                              : 'This tender is no longer accepting proposals.'
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              Submitted Proposals ({tender.metadata.totalApplications})
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tender.workflowType === 'closed' ? 'All proposals have been revealed' : 'Open tender - proposals visible'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              Export All
                            </Button>
                            {tender.workflowType === 'open' && isActive && (
                              <Button size="sm" className="gap-2">
                                <Users className="w-4 h-4" />
                                View Analytics
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Proposal Stats */}
                        {stats?.proposalStats && (
                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {Object.entries(stats.proposalStats).map(([key, value]) => {
                                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                  const colorMap: Record<string, string> = {
                                    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                                    under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                                    shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                                    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                                    sealed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
                                    revealed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  };
                                  
                                  return (
                                    <div key={key} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                      <div className={`text-xl font-bold mb-1 ${colorMap[key] || ''}`}>
                                        {value}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {label}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Proposals Management Interface */}
                        <Card className="border-dashed">
                          <CardContent className="p-8 text-center">
                            <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              Proposals Management Interface
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                              View, evaluate, and manage all submitted proposals in one place. Filter by status, score, or date.
                            </p>
                            <div className="flex gap-3 justify-center">
                              <Button variant="outline" disabled>
                                View All Proposals
                              </Button>
                              <Button variant="outline" disabled>
                                Advanced Filters
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="m-0">
                {stats ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.views}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Total Applications</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalApplications}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Visible Proposals</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.visibleApplications}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                              <FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Days Remaining</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.daysRemaining}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Additional Stats */}
                    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Detailed Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {stats.savedCount || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Saved</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {stats.updateCount || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Updates</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {stats.invitationStats?.totalInvited || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Invited</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {stats.invitationStats?.accepted || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Accepted</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {stats.invitationStats?.pending || 0}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {((stats.totalApplications / Math.max(stats.views, 1)) * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Conversion</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <CardContent className="p-12 text-center">
                      <div className="inline-flex flex-col items-center">
                        <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Analytics Loading
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Loading tender analytics data...
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="m-0">
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Tender Attachments ({tender.attachments.length})
                    </CardTitle>
                    <CardDescription>
                      Supporting files, specifications, and reference documents visible to applicants.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tender.attachments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex flex-col items-center">
                          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            No Attachments
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            No files have been attached to this tender yet.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tender.attachments.map((attachment: any) => (
                          <div
                            key={attachment._id}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-lg",
                              "bg-gray-50 dark:bg-gray-800/50",
                              "border border-gray-200 dark:border-gray-700",
                              "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-medium text-gray-900 dark:text-white truncate">
                                  {attachment.originalName}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {attachment.documentType || 'Document'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(attachment.fileSize)}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {attachment.fileType}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.open(`/api/v1/tender/${tender._id}/attachments/${attachment._id}/download`, '_blank');
                                }}
                                className="h-8 px-3 gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  window.open(`/api/v1/tender/${tender._id}/attachments/${attachment._id}/preview`, '_blank');
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="m-0">
                <div className="space-y-6">
                  {/* Danger Zone */}
                  <Card className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Irreversible actions that permanently affect this tender.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="flex-1">
                          <h4 className="font-medium text-red-700 dark:text-red-300 mb-1">
                            Delete Tender
                          </h4>
                          <p className="text-sm text-red-600/80 dark:text-red-400/80">
                            Once deleted, this tender cannot be recovered. All proposals and data will be permanently removed.
                            Applicants will be notified about the cancellation.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isDeleting}
                          className="gap-2 whitespace-nowrap"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting ? 'Deleting...' : 'Delete Tender'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Tender Information */}
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Tender Information
                      </CardTitle>
                      <CardDescription>
                        Technical details and metadata about this tender.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tender ID</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono truncate">
                                {tender._id}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyTenderId}
                                className="h-9 w-9 p-0 flex-shrink-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created Date</p>
                            <p className="font-medium">
                              {formatDate(tender.createdAt)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Published Date</p>
                            <p className="font-medium">
                              {tender.publishedAt ? formatDate(tender.publishedAt) : 'Not published'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                            <p className="font-medium">
                              {tender.metadata?.lastUpdatedAt
                                ? formatDate(tender.metadata.lastUpdatedAt)
                                : 'Never updated'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Update Count</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{tender.metadata?.updateCount || 0}</Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {tender.metadata?.isUpdated ? '(Updated)' : ''}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Visibility</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {tender.visibility.visibilityType.replace('_', ' ')}
                              </Badge>
                              {tender.visibility.visibilityType === 'invite_only' && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({tender.invitations?.length || 0} invited)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* File Upload Settings */}
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5" />
                        File Upload Settings
                      </CardTitle>
                      <CardDescription>
                        Configure file upload limits for this tender.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <HardDrive className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Max File Size</span>
                          </div>
                          <p className="font-medium">{formatFileSize(tender.maxFileSize)}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <FileIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Max File Count</span>
                          </div>
                          <p className="font-medium">{tender.maxFileCount} files</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 dark:text-red-400">
                Delete Tender
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete `{tender.title}`? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-red-700 dark:text-red-300">Warning</p>
                    <ul className="text-sm text-red-600/80 dark:text-red-400/80 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        All proposals and associated data will be permanently removed
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        All applicants will be notified about the tender cancellation
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        The tender will be removed from public view immediately
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        This action will be recorded in the audit trail
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? 'Deleting...' : 'Delete Tender'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reveal Proposals Dialog */}
        <AlertDialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-purple-600 dark:text-purple-400">
                Reveal Sealed Proposals
              </AlertDialogTitle>
              <AlertDialogDescription>
                Reveal all sealed proposals for `{tender.title}`. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-purple-700 dark:text-purple-300">
                      Sealed Bid Security Protocol
                    </p>
                    <ul className="text-sm text-purple-600/80 dark:text-purple-400/80 space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        All proposals are currently encrypted with military-grade AES-256 encryption
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        Revealing will decrypt all proposals simultaneously
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        No one has seen the proposals before this moment
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        The reveal process ensures complete fairness and transparency
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRevealing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevealProposals}
                disabled={isRevealing}
                className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-600"
              >
                {isRevealing ? 'Revealing...' : 'Reveal All Proposals'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Share Dialog */}
        <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Share Tender</AlertDialogTitle>
              <AlertDialogDescription>
                Share this tender with others via link or invitation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Public Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/tender/${tender._id}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium mb-2 block">Invite Specific Users</label>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tender.visibility.visibilityType === 'invite_only' 
                      ? 'Send invitations to specific users or companies.'
                      : 'Upgrade to invite-only visibility to send specific invitations.'
                    }
                  </p>
                  {tender.visibility.visibilityType === 'invite_only' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter email addresses (comma separated)"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm"
                      />
                      <Button size="sm" disabled>
                        Invite
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTabChange('settings')}
                      className="w-full"
                    >
                      Change Visibility Settings
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </>
  );
};

export default TenderDetailsPage;