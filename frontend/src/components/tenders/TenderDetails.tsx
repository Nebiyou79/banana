/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/browser/BrowserTenderDetails.tsx
import React, { useState, useMemo, lazy, Suspense } from 'react';
import {
  FileText,
  Eye,
  Users,
  Calendar,
  DollarSign,
  Lock,
  Globe,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  Target,
  Building,
  Shield,
  Zap,
  Clock,
  Briefcase,
  Copy,
  ExternalLink,
  ChevronRight,
  Info,
  UserCheck,
  Banknote,
  CheckSquare,
  XSquare,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import {
  usePublicTender,
  useToggleSaveTender,
  useCPOUtils,
} from '@/hooks/useTenders';
import {
  isTenderActive,
  TENDER_STATUSES,
  ENGAGEMENT_TYPES,
  EXPERIENCE_LEVELS,
  PROJECT_TYPES,
  PROCUREMENT_METHODS,
  formatFileSize,
} from '@/services/tenderService';
import FileAttachmentsList from '@/components/tenders/TenderAttachmentList';
import { colorClasses } from '@/utils/color';
import { TabNavigation } from '@/components/tenders/shared/TabNavigation';
import { InfoItem } from '@/components/tenders/shared/InfoItem';
import { SectionCard } from '@/components/tenders/shared/SectionCard';

// ============ HELPER COMPONENTS ============

interface DeadlineCountdownProps {
  deadline: Date | string;
}

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ deadline }) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) {
    return (
      <Badge variant="destructive" className="gap-1 min-h-[32px]">
        <XCircle className="w-3 h-3" />
        Expired
      </Badge>
    );
  }

  if (diffDays === 0 && diffHours <= 24) {
    return (
      <Badge className={cn(
        colorClasses.bg.amber,
        colorClasses.text.white,
        "gap-1 animate-pulse min-h-[32px]"
      )}>
        <Clock className="w-3 h-3" />
        {diffHours} hour{diffHours !== 1 ? 's' : ''} left
      </Badge>
    );
  }

  if (diffDays <= 7) {
    return (
      <Badge className={cn(
        colorClasses.bg.amber,
        colorClasses.text.white,
        "gap-1 min-h-[32px]"
      )}>
        <Clock className="w-3 h-3" />
        {diffDays} day{diffDays !== 1 ? 's' : ''} left
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(
      colorClasses.border.gray100,
      colorClasses.text.muted,
      "gap-1 min-h-[32px]"
    )}>
      <Calendar className="w-3 h-3" />
      {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </Badge>
  );
};

interface EligibilityBadgeProps {
  eligible: boolean;
  reason?: string;
}

const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({ eligible, reason }) => {
  if (eligible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn(
              colorClasses.bg.emeraldLight,
              colorClasses.text.emerald,
              "gap-1 min-h-[32px]"
            )}>
              <CheckCircle className="w-3 h-3" />
              You can apply
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>You meet all eligibility requirements</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="gap-1 min-h-[32px]">
            <XCircle className="w-3 h-3" />
            Not eligible
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reason || "You don't meet the requirements to apply"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface LoadingStateProps {
  type?: 'full' | 'compact';
}

const LoadingState: React.FC<LoadingStateProps> = ({ type = 'full' }) => (
  <div className="space-y-4">
    {type === 'full' ? (
      <>
        <Skeleton className={cn("h-12 w-full", colorClasses.bg.secondary)} />
        <Skeleton className={cn("h-64 w-full", colorClasses.bg.secondary)} />
        <Skeleton className={cn("h-96 w-full", colorClasses.bg.secondary)} />
      </>
    ) : (
      <div className="space-y-3">
        <Skeleton className={cn("h-8 w-3/4", colorClasses.bg.secondary)} />
        <Skeleton className={cn("h-8 w-1/2", colorClasses.bg.secondary)} />
        <Skeleton className={cn("h-8 w-2/3", colorClasses.bg.secondary)} />
      </div>
    )}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onBack?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, onBack }) => {
  const { getTouchTargetSize } = useResponsive();

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span>{message}</span>
        <div className="flex gap-2">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className={getTouchTargetSize('md')}
            >
              Go Back
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className={getTouchTargetSize('md')}
          >
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// ============ MAIN COMPONENT ============

interface BrowserTenderDetailsProps {
  tenderId: string;
  userRole: 'company' | 'freelancer' | 'guest';
  tenderType?: 'freelance' | 'professional';
  onApply?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  className?: string;
}

export const BrowserTenderDetails: React.FC<BrowserTenderDetailsProps> = ({
  tenderId,
  userRole,
  onApply,
  onSave,
  onShare,
  className = ''
}) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks
  const {
    tender,
    canViewProposals,
    isLoading,
    error,
    refetch
  } = usePublicTender(tenderId);

  const { mutate: toggleSave } = useToggleSaveTender();
  const cpoUtils = useCPOUtils();

  // Derived state
  const isSaved = useMemo(() => {
    return tender?.metadata?.savedBy?.includes(user?._id || '') || false;
  }, [tender, user]);

  const isActive = useMemo(() => {
    return tender ? isTenderActive(tender) : false;
  }, [tender]);

  const canApply = useMemo(() => {
    if (!tender || !isActive) return false;
    if (!isAuthenticated) return false;

    if (tender.tenderCategory === 'freelance') {
      return userRole === 'freelancer';
    } else {
      return userRole === 'company';
    }
  }, [tender, userRole, isActive, isAuthenticated]);

  const cpoInfo = useMemo(() => {
    return tender ? cpoUtils.getCPOInfo(tender) : { required: false, description: '', hasDescription: false };
  }, [tender, cpoUtils]);

  const deadlineInfo = useMemo(() => {
    if (!tender) return null;

    const deadline = new Date(tender.deadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffMs <= 0) {
      return {
        text: 'Deadline passed',
        color: colorClasses.text.red,
        urgency: 'expired' as const,
        days: 0,
        hours: 0
      };
    }

    if (diffDays === 0 && diffHours <= 24) {
      return {
        text: `Ends in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`,
        color: colorClasses.text.amber,
        urgency: 'urgent' as const,
        days: 0,
        hours: diffHours
      };
    }

    if (diffDays <= 7) {
      return {
        text: `Ends in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        color: colorClasses.text.amber,
        urgency: 'soon' as const,
        days: diffDays,
        hours: diffHours
      };
    }

    return {
      text: `Ends ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      color: colorClasses.text.muted,
      urgency: 'normal' as const,
      days: diffDays,
      hours: diffHours
    };
  }, [tender]);

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
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle save toggle
  const handleToggleSave = () => {
    if (!tender) return;

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save tenders',
        variant: 'destructive',
      });
      return;
    }

    toggleSave(tender._id);
    onSave?.();
  };

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Tender link copied to clipboard',
      variant: 'success',
    });
    onShare?.();
  };

  // Handle apply
  const handleApply = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for this tender',
        variant: 'destructive',
      });
      return;
    }

    if (!canApply) {
      toast({
        title: 'Not Eligible',
        description: "You don't meet the requirements to apply for this tender",
        variant: 'destructive',
      });
      return;
    }

    onApply?.();
  };

  // Define tabs
  const tabs = useMemo(() => {
    if (!tender) return [];

    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: <Eye className="w-4 h-4" />,
        mobileIcon: <Eye className="w-5 h-5" />,
        content: (
          <OverviewTabContent
            tender={tender}
            deadlineInfo={deadlineInfo}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onReadMore={() => setActiveTab('details')}
          />
        )
      },
      {
        id: 'details',
        label: 'Details',
        icon: <FileText className="w-4 h-4" />,
        mobileIcon: <FileText className="w-5 h-5" />,
        content: (
          <DetailsTabContent
            tender={tender}
            cpoInfo={cpoInfo}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )
      },
      {
        id: 'attachments',
        label: 'Attachments',
        icon: <FolderOpen className="w-4 h-4" />,
        mobileIcon: <FolderOpen className="w-5 h-5" />,
        badge: tender.attachments?.length || 0,
        content: (
          <AttachmentsTabContent
            tenderId={tender._id}
            attachments={tender.attachments || []}
            breakpoint={breakpoint}
          />
        )
      },
      {
        id: 'proposals',
        label: 'Proposals',
        icon: <Users className="w-4 h-4" />,
        mobileIcon: <Users className="w-5 h-5" />,
        content: (
          <ProposalsTabContent
            tender={tender}
            canApply={canApply}
            isActive={isActive}
            onApply={handleApply}
          />
        )
      },
      {
        id: 'actions',
        label: 'Actions',
        icon: <Target className="w-4 h-4" />,
        mobileIcon: <Target className="w-5 h-5" />,
        content: (
          <ActionsTabContent
            tender={tender}
            userRole={userRole}
            isAuthenticated={isAuthenticated}
            isSaved={isSaved}
            canApply={canApply}
            isActive={isActive}
            cpoInfo={cpoInfo}
            onToggleSave={handleToggleSave}
            onCopyLink={handleCopyLink}
            onShare={onShare}
            onApply={handleApply}
          />
        )
      }
    ];
  }, [tender, deadlineInfo, cpoInfo, canApply, isActive, isAuthenticated, isSaved, userRole, breakpoint]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full max-w-6xl mx-auto p-4 md:p-6", className)}>
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error || !tender) {
    const errorMessage = error?.message || 'Failed to load tender';
    const is403 = errorMessage.includes('Access denied') || errorMessage.includes('403');
    const is404 = errorMessage.includes('404') || errorMessage.includes('not found');

    return (
      <div className={cn("w-full max-w-6xl mx-auto p-4 md:p-6", className)}>
        <ErrorState
          message={is403 ? 'You do not have permission to view this tender' :
            is404 ? 'Tender not found' : errorMessage}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full max-w-6xl mx-auto",
      colorClasses.bg.primary,
      "rounded-2xl border",
      colorClasses.border.gray100,
      "shadow-sm",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "px-4 md:px-6 py-3 md:py-4 border-b sticky top-0 z-10 backdrop-blur-sm",
        colorClasses.border.gray100,
        colorClasses.bg.primary,
        "bg-opacity-95"
      )}>
        <div className="flex flex-row justify-between items-start gap-2 min-w-0">
          {/* Title + badges — takes all remaining space */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className={cn(
              "text-sm md:text-xl font-bold leading-snug",
              "break-words hyphens-auto whitespace-normal",
              colorClasses.text.primary
            )}>
              {tender.title}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {/* Workflow Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-xs shrink-0",
                  tender.workflowType === 'open'
                    ? cn(colorClasses.border.emerald, colorClasses.text.emerald)
                    : cn(colorClasses.border.blue, colorClasses.text.blue),
                )}
              >
                {tender.workflowType === 'open' ? (
                  <>
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">Open Tender</span>
                    <span className="sm:hidden">Open</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">Sealed Bid</span>
                    <span className="sm:hidden">Sealed</span>
                  </>
                )}
              </Badge>

              {/* Tender Type Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-xs shrink-0",
                  tender.tenderCategory === 'freelance'
                    ? cn(colorClasses.border.purple, colorClasses.text.purple)
                    : cn(colorClasses.border.amber, colorClasses.text.amber),
                )}
              >
                {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
              </Badge>

              {/* Deadline Badge */}
              <DeadlineCountdown deadline={tender.deadline} />
            </div>
          </div>

          {/* Header Actions - Desktop only */}
          {breakpoint !== 'mobile' && (
            <div className="flex gap-2 shrink-0">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={handleToggleSave}
                  className={cn(
                    "gap-2",
                    isSaved && (colorClasses.bg.blueLight, colorClasses.text.blue),
                    getTouchTargetSize('md')
                  )}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Save
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className={cn("gap-2", getTouchTargetSize('md'))}
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          )}

          {/* Mobile action buttons - compact icon-only */}
          {breakpoint === 'mobile' && (
            <div className="flex gap-1 shrink-0 mt-0.5">
              {isAuthenticated && (
                <button
                  onClick={handleToggleSave}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "border transition-colors",
                    isSaved
                      ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30"
                      : cn(colorClasses.border.gray100, colorClasses.bg.secondary)
                  )}
                >
                  {isSaved
                    ? <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                    : <Bookmark className={cn("w-4 h-4", colorClasses.text.muted)} />
                  }
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors",
                  colorClasses.border.gray100, colorClasses.bg.secondary
                )}
              >
                <Share2 className={cn("w-4 h-4", colorClasses.text.muted)} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs with Context Provider */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <div className="px-4 md:px-6 pt-4">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab Content — extra bottom padding on mobile so FAB never covers content */}
        <div className={cn(
          "p-4 md:p-6",
          breakpoint === 'mobile' && canApply && isActive && "pb-36"
        )}>
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Mobile Apply CTA — sits just above the bottom nav bar */}
      {breakpoint === 'mobile' && canApply && isActive && (
        <div className={cn(
          "fixed bottom-16 left-0 right-0 z-40",
          "px-4 py-3",
          colorClasses.bg.primary,
          "border-t",
          colorClasses.border.gray100,
          "shadow-[0_-4px_16px_rgba(0,0,0,0.10)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]",
        )}>
          <Button
            onClick={handleApply}
            className={cn(
              "w-full h-12 gap-2 font-semibold text-base",
              "bg-gradient-to-r from-yellow-400 to-orange-500",
              "hover:from-yellow-500 hover:to-orange-600",
              "text-white shadow-lg rounded-xl"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            Apply for this Tender
          </Button>
        </div>
      )}
    </div>
  );
};

// ============ TAB CONTENT COMPONENTS ============

interface OverviewTabContentProps {
  tender: any;
  deadlineInfo: any;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: Date | string) => string;
  onReadMore: () => void;
}

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  tender,
  deadlineInfo,
  formatCurrency,
  formatDate,
  onReadMore
}) => {
  const { breakpoint, getTouchTargetSize } = useResponsive();

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Budget Card - Freelance */}
        {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.budget && (
          <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.emeraldLight)}>
                  <DollarSign className={cn("w-5 h-5", colorClasses.text.emerald)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xs sm:text-sm", colorClasses.text.muted)}>Budget Range</p>
                  <p className={cn("text-sm sm:text-base font-semibold truncate", colorClasses.text.primary)}>
                    {formatCurrency(tender.freelanceSpecific.budget.min, tender.freelanceSpecific.budget.currency)} -
                    {formatCurrency(tender.freelanceSpecific.budget.max, tender.freelanceSpecific.budget.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience Level Card - Freelance */}
        {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.experienceLevel && (
          <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.amberLight)}>
                  <Award className={cn("w-5 h-5", colorClasses.text.amber)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xs sm:text-sm", colorClasses.text.muted)}>Experience Level</p>
                  <p className={cn("text-sm sm:text-base font-semibold capitalize truncate", colorClasses.text.primary)}>
                    {EXPERIENCE_LEVELS.find(e => e.value === tender.freelanceSpecific?.experienceLevel)?.label ||
                      tender.freelanceSpecific.experienceLevel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Procurement Method Card - Professional */}
        {tender.tenderCategory === 'professional' && tender.professionalSpecific?.procurementMethod && (
          <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.indigoLight)}>
                  <Target className={cn("w-5 h-5", colorClasses.text.indigo)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xs sm:text-sm", colorClasses.text.muted)}>Procurement Method</p>
                  <p className={cn("text-sm sm:text-base font-semibold truncate", colorClasses.text.primary)}>
                    {PROCUREMENT_METHODS.find(p => p.value === tender.professionalSpecific?.procurementMethod)?.label ||
                      tender.professionalSpecific.procurementMethod}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications Card */}
        <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.blueLight)}>
                <Users className={cn("w-5 h-5", colorClasses.text.blue)} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-xs sm:text-sm", colorClasses.text.muted)}>Applications</p>
                <p className={cn("text-sm sm:text-base font-semibold", colorClasses.text.primary)}>
                  {tender.metadata?.totalApplications || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline Card */}
        <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                deadlineInfo?.urgency === 'urgent' ? colorClasses.bg.amberLight : colorClasses.bg.secondary
              )}>
                <Calendar className={cn("w-5 h-5", deadlineInfo?.color || colorClasses.text.muted)} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-xs sm:text-sm", colorClasses.text.muted)}>Deadline</p>
                <p className={cn("text-sm sm:text-base font-semibold truncate", deadlineInfo?.color || colorClasses.text.primary)}>
                  {deadlineInfo?.text || formatDate(tender.deadline)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Basic Information */}
      <SectionCard
        title="Basic Information"
        icon={<FileText className={cn("w-5 h-5", colorClasses.text.blue)} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem
            label="Tender ID"
            value={tender.tenderId || tender._id.substring(0, 12)}
          />
          <InfoItem
            label="Reference Number"
            value={tender.professionalSpecific?.referenceNumber || 'N/A'}
          />
          <InfoItem
            label="Category"
            value={tender.procurementCategory}
          />
          <InfoItem
            label="Created"
            value={formatDate(tender.createdAt)}
          />
          <InfoItem
            label="Published"
            value={tender.publishedAt ? formatDate(tender.publishedAt) : 'Not published'}
          />
          <InfoItem
            label="Status"
            value={TENDER_STATUSES.find(s => s.value === tender.status)?.label || tender.status}
            badge
          />
        </div>
      </SectionCard>

      {/* Description Preview */}
      <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className={cn("w-5 h-5", colorClasses.text.emerald)} />
              <h3 className={cn("font-semibold", colorClasses.text.primary)}>Project Description</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReadMore}
              className={cn("gap-1", getTouchTargetSize('md'))}
            >
              Read More
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <p className={cn("line-clamp-3", colorClasses.text.primary)}>
            {tender.description}
          </p>
        </CardContent>
      </Card>

      {/* Skills & Owner Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tender.skillsRequired && tender.skillsRequired.length > 0 && (
          <SectionCard
            title="Required Skills"
            icon={<Zap className={cn("w-5 h-5", colorClasses.text.amber)} />}
          >
            <div className="flex flex-wrap gap-2">
              {tender.skillsRequired.map((skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn(
                    "px-3 py-1.5 text-sm",
                    colorClasses.bg.secondary,
                    colorClasses.text.primary
                  )}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard
          title="Procuring Entity"
          icon={<Building className={cn("w-5 h-5", colorClasses.text.indigo)} />}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                colorClasses.bg.secondary
              )}>
                <Building className={cn("w-6 h-6", colorClasses.text.muted)} />
              </div>
              <div className="min-w-0">
                <h4 className={cn("font-semibold truncate", colorClasses.text.primary)}>
                  {tender.ownerEntity?.name}
                </h4>
                <p className={cn("text-sm truncate", colorClasses.text.muted)}>
                  {tender.professionalSpecific?.procuringEntity || tender.ownerEntity?.description}
                </p>
              </div>
            </div>
            {tender.ownerEntity?.verified && (
              <Badge variant="outline" className={cn(colorClasses.border.emerald, colorClasses.text.emerald)}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

interface DetailsTabContentProps {
  tender: any;
  cpoInfo: any;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: Date | string) => string;
}

const DetailsTabContent: React.FC<DetailsTabContentProps> = ({
  tender,
  cpoInfo,
  formatCurrency,
  formatDate
}) => {
  return (
    <div className="space-y-6">
      {/* Full Description */}
      <SectionCard
        title="Full Description & Objectives"
        icon={<FileText className={cn("w-5 h-5", colorClasses.text.blue)} />}
      >
        <div className="prose max-w-none">
          {tender.description.split('\n').map((paragraph: string, index: number) => (
            <p key={index} className={cn("mb-3 last:mb-0", colorClasses.text.primary)}>
              {paragraph}
            </p>
          ))}
        </div>

        {tender.tenderCategory === 'professional' && tender.professionalSpecific?.projectObjectives && (
          <div className="mt-6">
            <h4 className={cn("font-medium mb-3", colorClasses.text.primary)}>Project Objectives</h4>
            <div className={cn(
              "p-4 border rounded-lg",
              colorClasses.bg.secondary,
              colorClasses.border.gray100
            )}>
              <p className={colorClasses.text.primary}>{tender.professionalSpecific.projectObjectives}</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Technical Requirements */}
      <SectionCard
        title="Technical Requirements"
        icon={<Briefcase className={cn("w-5 h-5", colorClasses.text.purple)} />}
      >
        {tender.tenderCategory === 'freelance' && tender.freelanceSpecific && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem
                label="Engagement Type"
                value={ENGAGEMENT_TYPES.find(e => e.value === tender.freelanceSpecific?.engagementType)?.label ||
                  tender.freelanceSpecific.engagementType}
              />
              <InfoItem
                label="Project Type"
                value={PROJECT_TYPES.find(p => p.value === tender.freelanceSpecific?.projectType)?.label ||
                  tender.freelanceSpecific.projectType || 'N/A'}
              />
            </div>

            {tender.freelanceSpecific.estimatedDuration && (
              <InfoItem
                label="Estimated Duration"
                value={`${tender.freelanceSpecific.estimatedDuration.value} ${tender.freelanceSpecific.estimatedDuration.unit}`}
              />
            )}

            {tender.freelanceSpecific.weeklyHours && (
              <InfoItem
                label="Weekly Hours"
                value={`${tender.freelanceSpecific.weeklyHours} hours/week`}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="Portfolio Required"
                value={tender.freelanceSpecific.portfolioRequired ? 'Yes' : 'No'}
              />
              <InfoItem
                label="NDA Required"
                value={tender.freelanceSpecific.ndaRequired ? 'Yes' : 'No'}
              />
            </div>

            {tender.freelanceSpecific.screeningQuestions &&
              tender.freelanceSpecific.screeningQuestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className={cn("font-medium", colorClasses.text.primary)}>Screening Questions</h4>
                  <div className="space-y-2">
                    {tender.freelanceSpecific.screeningQuestions.map((q: any, idx: number) => (
                      <div key={idx} className={cn("p-3 border rounded-lg", colorClasses.bg.secondary)}>
                        <p className={cn("font-medium", colorClasses.text.primary)}>{q.question}</p>
                        {q.required && (
                          <Badge variant="destructive" className="mt-1 text-xs">Required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {tender.tenderCategory === 'professional' && tender.professionalSpecific && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem
                label="Procurement Method"
                value={PROCUREMENT_METHODS.find(p => p.value === tender.professionalSpecific?.procurementMethod)?.label ||
                  tender.professionalSpecific.procurementMethod || 'N/A'}
              />
              <InfoItem
                label="Funding Source"
                value={tender.professionalSpecific.fundingSource || 'N/A'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem
                label="Minimum Experience"
                value={`${tender.professionalSpecific.minimumExperience || 0} years`}
              />
              <InfoItem
                label="Legal Registration"
                value={tender.professionalSpecific.legalRegistrationRequired ? 'Required' : 'Not Required'}
              />
            </div>

            {tender.professionalSpecific.evaluationCriteria && (
              <div className="space-y-2">
                <h4 className={cn("font-medium", colorClasses.text.primary)}>Evaluation Criteria</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className={cn("text-sm", colorClasses.text.muted)}>Technical</span>
                    <span className={cn("font-medium", colorClasses.text.primary)}>
                      {tender.professionalSpecific.evaluationCriteria.technicalWeight}%
                    </span>
                  </div>
                  <Progress
                    value={tender.professionalSpecific.evaluationCriteria.technicalWeight}
                    className={cn("h-2", colorClasses.bg.secondary)}
                    indicatorStyle={{ backgroundColor: '#3B82F6' }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className={cn("text-sm", colorClasses.text.muted)}>Financial</span>
                    <span className={cn("font-medium", colorClasses.text.primary)}>
                      {tender.professionalSpecific.evaluationCriteria.financialWeight}%
                    </span>
                  </div>
                  <Progress
                    value={tender.professionalSpecific.evaluationCriteria.financialWeight}
                    className={cn("h-2", colorClasses.bg.secondary)}
                    indicatorStyle={{ backgroundColor: '#10B981' }}
                  />
                </div>
              </div>
            )}

            {tender.professionalSpecific.timeline && (
              <div className="space-y-3">
                <h4 className={cn("font-medium", colorClasses.text.primary)}>Project Timeline</h4>
                <div className={cn("p-4 border rounded-lg", colorClasses.bg.secondary)}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className={cn("text-sm", colorClasses.text.muted)}>Start Date</p>
                      <p className={cn("font-medium", colorClasses.text.primary)}>
                        {formatDate(tender.professionalSpecific.timeline.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-sm", colorClasses.text.muted)}>End Date</p>
                      <p className={cn("font-medium", colorClasses.text.primary)}>
                        {formatDate(tender.professionalSpecific.timeline.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-sm", colorClasses.text.muted)}>Duration</p>
                      <p className={cn("font-medium", colorClasses.text.primary)}>
                        {tender.professionalSpecific.timeline.duration.value} {tender.professionalSpecific.timeline.duration.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Compliance & Eligibility */}
      <SectionCard
        title="Compliance & Eligibility"
        icon={<Shield className={cn("w-5 h-5", colorClasses.text.amber)} />}
      >
        {tender.tenderCategory === 'professional' && tender.professionalSpecific && (
          <div className="space-y-6">
            {tender.professionalSpecific.requiredCertifications &&
              tender.professionalSpecific.requiredCertifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className={cn("font-medium", colorClasses.text.primary)}>Required Certifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tender.professionalSpecific.requiredCertifications.map((cert: any, idx: number) => (
                      <div key={idx} className={cn("p-3 border rounded-lg", colorClasses.bg.secondary)}>
                        <p className={cn("font-medium", colorClasses.text.primary)}>{cert.name}</p>
                        <p className={cn("text-sm", colorClasses.text.muted)}>Issuer: {cert.issuingAuthority}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {tender.professionalSpecific.financialCapacity && (
              <div className="space-y-3">
                <h4 className={cn("font-medium", colorClasses.text.primary)}>Financial Capacity</h4>
                <div className={cn("p-4 border rounded-lg", colorClasses.bg.secondary)}>
                  <p className={cn("text-lg font-semibold", colorClasses.text.primary)}>
                    {formatCurrency(
                      tender.professionalSpecific.financialCapacity.minAnnualTurnover,
                      tender.professionalSpecific.financialCapacity.currency
                    )}
                  </p>
                  <p className={cn("text-sm", colorClasses.text.muted)}>Minimum Annual Turnover</p>
                </div>
              </div>
            )}

            {tender.professionalSpecific.pastProjectReferences && (
              <div className="space-y-3">
                <h4 className={cn("font-medium", colorClasses.text.primary)}>Past Project References</h4>
                <div className={cn("p-4 border rounded-lg", colorClasses.bg.secondary)}>
                  <p className={cn("font-medium", colorClasses.text.primary)}>
                    Minimum {tender.professionalSpecific.pastProjectReferences.minCount} projects
                  </p>
                  <p className={cn("text-sm", colorClasses.text.muted)}>
                    {tender.professionalSpecific.pastProjectReferences.similarValueProjects
                      ? 'Similar value projects required'
                      : 'Similar value projects not required'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {cpoInfo.required && (
          <Alert className={cn("mt-4", colorClasses.bg.amberLight, colorClasses.border.amber)}>
            <Banknote className={cn("h-4 w-4", colorClasses.text.amber)} />
            <AlertTitle className={colorClasses.text.amber}>CPO Required</AlertTitle>
            <AlertDescription className={colorClasses.text.amber}>
              {cpoInfo.description || 'A Certified Payment Order (CPO) is required for this tender.'}
            </AlertDescription>
          </Alert>
        )}
      </SectionCard>

      {/* Additional Information */}
      <SectionCard
        title="Additional Information"
        icon={<Info className={cn("w-5 h-5", colorClasses.text.muted)} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InfoItem
            label="Max File Size"
            value={formatFileSize(tender.maxFileSize)}
          />
          <InfoItem
            label="Max File Count"
            value={tender.maxFileCount.toString()}
          />
          {tender.freelanceSpecific?.urgency && (
            <InfoItem
              label="Urgency"
              value={tender.freelanceSpecific.urgency === 'urgent' ? 'Urgent' : 'Normal'}
            />
          )}
          {tender.freelanceSpecific?.industry && (
            <InfoItem
              label="Industry"
              value={tender.freelanceSpecific.industry}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
};

interface AttachmentsTabContentProps {
  tenderId: string;
  attachments: any[];
  breakpoint: string;
}

const AttachmentsTabContent: React.FC<AttachmentsTabContentProps> = ({
  tenderId,
  attachments,
  breakpoint
}) => {
  const variant = breakpoint === 'mobile' ? 'mobile' : breakpoint === 'tablet' ? 'tablet' : 'desktop';

  return (
    <Card className={cn(
      "overflow-hidden",
      colorClasses.bg.primary,
      colorClasses.border.gray100,
      "rounded-xl shadow-sm"
    )}>
      <CardContent className="p-3 md:p-4 lg:p-6">
        <FileAttachmentsList
          tenderId={tenderId}
          attachments={attachments}
          isOwner={false}
          allowDownload={true}
          allowDelete={false}
          showPreview={true}
          variant={variant}
        />
      </CardContent>
    </Card>
  );
};

interface ProposalsTabContentProps {
  tender: any;
  canApply: boolean;
  isActive: boolean;
  onApply: () => void;
}

const ProposalsTabContent: React.FC<ProposalsTabContentProps> = ({
  tender,
  canApply,
  isActive,
  onApply
}) => {
  const { getTouchTargetSize } = useResponsive();
  const isSealed = tender.workflowType === 'closed' && !tender.revealedAt;
  const deadlinePassed = new Date(tender.deadline) < new Date();

  return (
    <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
      <CardContent className="p-4 md:p-6 space-y-6">
        {isSealed ? (
          <div className="space-y-6">
            <div className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg",
              colorClasses.bg.blueLight
            )}>
              <Lock className={cn("w-8 h-8 shrink-0", colorClasses.text.blue)} />
              <div>
                <h3 className={cn("font-semibold", colorClasses.text.blue)}>Sealed Bid Process</h3>
                <p className={cn("text-sm", colorClasses.text.blue)}>
                  This is a sealed bid tender. All proposals are encrypted and will remain sealed until the reveal date.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={cn("p-4 border rounded-lg", colorClasses.border.gray100)}>
                <p className={cn("text-sm", colorClasses.text.muted)}>Total Proposals</p>
                <p className={cn("text-2xl font-bold", colorClasses.text.primary)}>
                  {tender.metadata?.totalApplications || 0}
                </p>
              </div>
              <div className={cn("p-4 border rounded-lg", colorClasses.border.gray100)}>
                <p className={cn("text-sm", colorClasses.text.muted)}>Reveal Status</p>
                <p className={cn("text-lg font-semibold", colorClasses.text.amber)}>
                  {deadlinePassed ? 'Ready to reveal' : 'Sealed until deadline'}
                </p>
              </div>
            </div>

            <div className={cn("p-4 rounded-lg", colorClasses.bg.secondary)}>
              <h4 className={cn("font-medium mb-2", colorClasses.text.primary)}>How Sealed Bidding Works</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className={colorClasses.text.muted}>Proposals are encrypted upon submission</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className={colorClasses.text.muted}>No one can view contents until reveal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span className={colorClasses.text.muted}>Reveal happens automatically after deadline</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={colorClasses.text.muted}>
              {tender.workflowType === 'open'
                ? 'This is an open tender. Proposals are visible to the procuring entity upon submission.'
                : tender.revealedAt
                  ? 'Proposals have been revealed and are being evaluated.'
                  : 'Proposal submission status'}
            </p>

            <div className={cn("p-4 border rounded-lg", colorClasses.border.gray100)}>
              <p className={cn("text-sm", colorClasses.text.muted)}>Total Proposals Submitted</p>
              <p className={cn("text-3xl font-bold", colorClasses.text.primary)}>
                {tender.metadata?.totalApplications || 0}
              </p>
            </div>
          </div>
        )}

        {canApply && isActive && (
          <div className="pt-4">
            <Button
              onClick={onApply}
              className={cn(
                "w-full sm:w-auto",
                colorClasses.bg.blue,
                colorClasses.text.white,
                getTouchTargetSize('lg')
              )}
            >
              Apply for this Tender
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ActionsTabContentProps {
  tender: any;
  userRole: string;
  isAuthenticated: boolean;
  isSaved: boolean;
  canApply: boolean;
  isActive: boolean;
  cpoInfo: any;
  onToggleSave: () => void;
  onCopyLink: () => void;
  onShare?: () => void;
  onApply: () => void;
}

const ActionsTabContent: React.FC<ActionsTabContentProps> = ({
  tender,
  userRole,
  isAuthenticated,
  isSaved,
  canApply,
  isActive,
  cpoInfo,
  onToggleSave,
  onCopyLink,
  onShare,
  onApply
}) => {
  const { getTouchTargetSize } = useResponsive();

  return (
    <div className="space-y-6">
      {/* Eligibility Check */}
      <SectionCard
        title="Your Eligibility"
        icon={<UserCheck className={cn("w-5 h-5", colorClasses.text.blue)} />}
      >
        <div className="space-y-4">
          <EligibilityBadge
            eligible={canApply}
            reason={!isAuthenticated ? 'Please log in to check eligibility' :
              !isActive ? 'This tender is no longer accepting applications' :
                'You do not meet the role requirements for this tender'}
          />

          {isAuthenticated && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckSquare className={cn("w-4 h-4 shrink-0", colorClasses.text.emerald)} />
                <span className={cn("text-sm", colorClasses.text.primary)}>Account type: {userRole}</span>
              </div>

              <div className="flex items-center gap-2">
                {String(tender.tenderCategory) ===
                  (userRole === 'freelancer' ? 'freelance' :
                    userRole === 'company' ? 'professional' : '') ? (
                  <CheckSquare className={cn("w-4 h-4 shrink-0", colorClasses.text.emerald)} />
                ) : (
                  <XSquare className={cn("w-4 h-4 shrink-0", colorClasses.text.red)} />
                )}
                <span className={cn("text-sm", colorClasses.text.primary)}>
                  Tender type: {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isActive ? (
                  <CheckSquare className={cn("w-4 h-4 shrink-0", colorClasses.text.emerald)} />
                ) : (
                  <XSquare className={cn("w-4 h-4 shrink-0", colorClasses.text.red)} />
                )}
                <span className={cn("text-sm", colorClasses.text.primary)}>
                  Status: {isActive ? 'Accepting applications' : 'Not accepting applications'}
                </span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Requirements Checklist */}
      <SectionCard
        title="Application Requirements"
        icon={<CheckCircle className={cn("w-5 h-5", colorClasses.text.emerald)} />}
      >
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", colorClasses.text.emerald)} />
            <span className={cn("text-sm", colorClasses.text.primary)}>
              Complete your profile with all required information
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", colorClasses.text.emerald)} />
            <span className={cn("text-sm", colorClasses.text.primary)}>
              Prepare your proposal documents
            </span>
          </li>
          {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.portfolioRequired && (
            <li className="flex items-start gap-2">
              <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", colorClasses.text.emerald)} />
              <span className={cn("text-sm", colorClasses.text.primary)}>Portfolio required</span>
            </li>
          )}
          {tender.tenderCategory === 'freelance' && tender.freelanceSpecific?.ndaRequired && (
            <li className="flex items-start gap-2">
              <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", colorClasses.text.emerald)} />
              <span className={cn("text-sm", colorClasses.text.primary)}>NDA agreement required</span>
            </li>
          )}
          {tender.tenderCategory === 'professional' && tender.professionalSpecific?.legalRegistrationRequired && (
            <li className="flex items-start gap-2">
              <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", colorClasses.text.emerald)} />
              <span className={cn("text-sm", colorClasses.text.primary)}>Legal registration documents required</span>
            </li>
          )}
          {cpoInfo.required && (
            <li className="flex items-start gap-2">
              <CheckCircle className={cn("w-4 h-4 mt-0.5 shrink-0", colorClasses.text.emerald)} />
              <span className={cn("text-sm", colorClasses.text.primary)}>
                CPO (Certified Payment Order) required
              </span>
            </li>
          )}
        </ul>
      </SectionCard>

      {/* Action Buttons */}
      <Card className={cn(colorClasses.bg.primary, colorClasses.border.gray100)}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={onToggleSave}
                className={cn(
                  "gap-2 flex-1",
                  isSaved && (colorClasses.bg.blueLight, colorClasses.text.blue),
                  getTouchTargetSize('lg')
                )}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Save Tender
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onCopyLink}
              className={cn("gap-2 flex-1", getTouchTargetSize('lg'))}
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>

            {onShare && (
              <Button
                variant="outline"
                onClick={onShare}
                className={cn("gap-2 flex-1", getTouchTargetSize('lg'))}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
          </div>

          {canApply && isActive && (
            <Button
              onClick={onApply}
              className={cn(
                "w-full mt-4",
                colorClasses.bg.blue,
                colorClasses.text.white,
                getTouchTargetSize('lg')
              )}
              size="lg"
            >
              Apply for this Tender
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrowserTenderDetails;