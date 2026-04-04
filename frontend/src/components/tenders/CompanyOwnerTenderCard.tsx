/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/company/CompanyOwnerTenderCard.tsx
import React, { JSX } from 'react';
import {
  Tender,
  TenderStatus,
  WorkflowType,
  TenderCategoryType,
  VisibilityType,
  formatDeadline,
  isTenderActive,
  calculateProgress,
} from '@/services/tenderService';
import {
  Eye,
  Edit2,
  Users,
  Clock,
  Lock,
  Globe,
  AlertCircle,
  FileText,
  Building2,
  CheckCircle,
  DollarSign,
  Zap,
  FileCheck,
  Calendar,
  Briefcase,
  Tag
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

interface CompanyOwnerTenderCardProps {
  tender: Tender;
  showActions?: boolean;
  className?: string;
}

export const CompanyOwnerTenderCard: React.FC<CompanyOwnerTenderCardProps> = ({
  tender,
  showActions = true,
  className
}) => {
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  // Check if tender can be edited (only draft or published open tenders)
  const canEdit = tender.status === 'draft' ||
    (tender.status === 'published' && tender.workflowType === 'open');

  const isActive = isTenderActive(tender);
  const progress = calculateProgress(tender);

  // Navigation paths
  const viewPath = `/dashboard/company/tenders/my-tenders/${tender._id}`;
  const editPath = `/dashboard/company/tenders/my-tenders/${tender._id}/edit`;

  const handleViewDetails = () => {
    router.push(viewPath);
  };

  const handleEdit = () => {
    if (canEdit) {
      router.push(editPath);
    }
  };

  // Calculate application stats
  const totalApplications = tender.metadata?.totalApplications || 0;
  const daysRemaining = tender.metadata?.daysRemaining || 0;

  // Get tender-specific details
  const isFreelance = tender.tenderCategory === 'freelance';
  const budget = isFreelance ? tender.freelanceSpecific?.budget : null;
  const experienceLevel = isFreelance ? tender.freelanceSpecific?.experienceLevel : null;

  // Get status display
  const getStatusDisplay = (status: TenderStatus): { label: string; icon: JSX.Element; color: string } => {
    const statusConfig: Record<TenderStatus, { label: string; icon: JSX.Element; color: string }> = {
      draft: {
        label: 'Draft',
        icon: <FileText className="w-3 h-3" />,
        color: '#6B7280'
      },
      published: {
        label: 'Active',
        icon: <Globe className="w-3 h-3" />,
        color: '#10B981'
      },
      locked: {
        label: 'Locked',
        icon: <Lock className="w-3 h-3" />,
        color: '#3B82F6'
      },
      deadline_reached: {
        label: 'Deadline Reached',
        icon: <Clock className="w-3 h-3" />,
        color: '#F59E0B'
      },
      revealed: {
        label: 'Revealed',
        icon: <Eye className="w-3 h-3" />,
        color: '#8B5CF6'
      },
      closed: {
        label: 'Closed',
        icon: <FileCheck className="w-3 h-3" />,
        color: '#6366F1'
      },
      cancelled: {
        label: 'Cancelled',
        icon: <AlertCircle className="w-3 h-3" />,
        color: '#EF4444'
      }
    };
    return statusConfig[status] || statusConfig.draft;
  };

  // Get status badge classes
  const getStatusBadgeClasses = (status: TenderStatus): string => {
    const statusClasses: Record<TenderStatus, string> = {
      draft: cn(colorClasses.bg.secondary, colorClasses.text.secondary),
      published: cn(colorClasses.bg.emeraldLight, colorClasses.text.emerald),
      locked: cn(colorClasses.bg.blueLight, colorClasses.text.blue),
      deadline_reached: cn(colorClasses.bg.amberLight, colorClasses.text.amber),
      revealed: cn(colorClasses.bg.purpleLight, colorClasses.text.purple),
      closed: cn(colorClasses.bg.indigoLight, colorClasses.text.indigo),
      cancelled: cn(colorClasses.bg.redLight, colorClasses.text.red)
    };
    return statusClasses[status] || statusClasses.draft;
  };

  // Get visibility display
  const getVisibilityDisplay = (visibilityType: VisibilityType): { label: string; icon: JSX.Element } => {
    const visibilityConfig: Record<VisibilityType, { label: string; icon: JSX.Element }> = {
      'freelancers_only': { label: 'Freelancers Only', icon: <Users className="w-3 h-3" /> },
      'public': { label: 'Public', icon: <Globe className="w-3 h-3" /> },
      'companies_only': { label: 'Companies Only', icon: <Building2 className="w-3 h-3" /> },
      'invite_only': { label: 'Invite Only', icon: <Lock className="w-3 h-3" /> }
    };
    return visibilityConfig[visibilityType] || visibilityConfig.public;
  };

  // Get category badge classes
  const getCategoryBadgeClasses = (category: TenderCategoryType): string => {
    return category === 'freelance'
      ? cn(colorClasses.bg.emeraldLight, colorClasses.text.emerald)
      : cn(colorClasses.bg.blueLight, colorClasses.text.blue);
  };

  // Get workflow badge classes
  const getWorkflowBadgeClasses = (workflow: WorkflowType): string => {
    return workflow === 'open'
      ? cn(colorClasses.bg.blueLight, colorClasses.text.blue)
      : cn(colorClasses.bg.purpleLight, colorClasses.text.purple);
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format deadline for display
  const formatDeadlineDisplay = (deadline: Date): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statusDisplay = getStatusDisplay(tender.status);
  const visibilityDisplay = getVisibilityDisplay(tender.visibility.visibilityType);

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-md",
      colorClasses.bg.primary,
      colorClasses.border.gray100,
      className
    )}>
      {/* Status indicator bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: statusDisplay.color }}
      />

      {/* Urgent badge for freelance tenders */}
      {isFreelance && tender.freelanceSpecific?.urgency === 'urgent' && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className={cn(
            "border-0 shadow-sm",
            colorClasses.bg.red,
            colorClasses.text.white
          )}>
            <Zap className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        </div>
      )}

      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="space-y-2">
          {/* Category and Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "px-2 py-0.5 text-xs font-medium",
                getCategoryBadgeClasses(tender.tenderCategory)
              )}
            >
              {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "px-2 py-0.5 text-xs",
                getWorkflowBadgeClasses(tender.workflowType)
              )}
            >
              {tender.workflowType === 'open' ? 'Open' : 'Sealed'}
            </Badge>
          </div>

          {/* Title */}
          <h3 className={cn(
            "text-base sm:text-lg font-semibold leading-tight line-clamp-2",
            colorClasses.text.primary
          )}>
            {tender.title}
          </h3>

          {/* Status and Visibility */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("px-2 py-0.5 text-xs", getStatusBadgeClasses(tender.status))}
            >
              <div className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusDisplay.color }}
                />
                <span>{statusDisplay.label}</span>
              </div>
            </Badge>

            <div className="flex items-center gap-1">
              <span className={colorClasses.text.muted}>{visibilityDisplay.icon}</span>
              <span className={cn("text-xs", colorClasses.text.muted)}>
                {visibilityDisplay.label}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-1">
        {/* Description */}
        <p className={cn("text-xs sm:text-sm mb-3 line-clamp-2", colorClasses.text.secondary)}>
          {tender.description.substring(0, 100)}...
        </p>

        {/* Progress Bar for active tenders */}
        {isActive && tender.status === 'published' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className={colorClasses.text.muted}>Progress</span>
              <span className={colorClasses.text.muted}>{daysRemaining} days</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Applications */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            colorClasses.bg.secondary
          )}>
            <div className={cn("p-1.5 rounded-lg", colorClasses.bg.blueLight)}>
              <Users className={cn("w-3.5 h-3.5", colorClasses.text.blue)} />
            </div>
            <div>
              <div className={cn("font-semibold text-sm", colorClasses.text.primary)}>
                {totalApplications}
              </div>
              <div className={cn("text-xs", colorClasses.text.muted)}>
                Apps
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            colorClasses.bg.secondary
          )}>
            <div className={cn("p-1.5 rounded-lg", colorClasses.bg.amberLight)}>
              <Calendar className={cn("w-3.5 h-3.5", colorClasses.text.amber)} />
            </div>
            <div>
              <div className={cn("font-semibold text-sm", colorClasses.text.primary)}>
                {formatDeadlineDisplay(tender.deadline)}
              </div>
              <div className={cn("text-xs", colorClasses.text.muted)}>
                Deadline
              </div>
            </div>
          </div>

          {/* Budget/Type */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            colorClasses.bg.secondary
          )}>
            <div className={cn("p-1.5 rounded-lg", colorClasses.bg.emeraldLight)}>
              {isFreelance ? (
                <DollarSign className={cn("w-3.5 h-3.5", colorClasses.text.emerald)} />
              ) : (
                <Briefcase className={cn("w-3.5 h-3.5", colorClasses.text.emerald)} />
              )}
            </div>
            <div>
              <div className={cn("font-semibold text-sm truncate max-w-[80px]", colorClasses.text.primary)}>
                {isFreelance && budget ? (
                  `${budget.currency} ${(budget.min / 1000).toFixed(0)}k`
                ) : (
                  'Professional'
                )}
              </div>
              <div className={cn("text-xs", colorClasses.text.muted)}>
                {isFreelance ? 'Budget' : 'Type'}
              </div>
            </div>
          </div>

          {/* Skills/Experience */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            colorClasses.bg.secondary
          )}>
            <div className={cn("p-1.5 rounded-lg", colorClasses.bg.purpleLight)}>
              <Tag className={cn("w-3.5 h-3.5", colorClasses.text.purple)} />
            </div>
            <div>
              <div className={cn("font-semibold text-sm", colorClasses.text.primary)}>
                {tender.skillsRequired?.length || 0}
              </div>
              <div className={cn("text-xs", colorClasses.text.muted)}>
                {experienceLevel ? 'Level' : 'Skills'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className={cn("p-3 sm:p-4 pt-2 border-t", colorClasses.border.gray100)}>
          <div className="flex w-full justify-between items-center gap-2">
            <div className={cn("text-xs", colorClasses.text.muted)}>
              {new Date(tender.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>

            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className={cn(
                  "h-8 px-3 text-xs gap-1.5",
                  colorClasses.border.gray100,
                  getTouchTargetSize('sm')
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </Button>

              {canEdit ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  className={cn(
                    "h-8 px-3 text-xs gap-1.5",
                    colorClasses.bg.blue,
                    colorClasses.text.white,
                    'hover:opacity-90',
                    getTouchTargetSize('sm')
                  )}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 px-3 text-xs gap-1.5 opacity-50 cursor-not-allowed"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className={cn("text-xs", colorClasses.text.primary)}>
                        {tender.workflowType === 'closed' && tender.status === 'published'
                          ? 'Sealed bid tenders cannot be edited after publishing'
                          : tender.status !== 'draft'
                            ? 'Only draft tenders can be edited'
                            : 'Cannot edit this tender'
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// Loading skeleton component
export const CompanyOwnerTenderCardSkeleton: React.FC = () => {
  return (
    <Card className={cn(
      "overflow-hidden border animate-pulse",
      colorClasses.bg.primary,
      colorClasses.border.gray100
    )}>
      <div className={cn("absolute top-0 left-0 w-1 h-full", colorClasses.bg.gray200)} />

      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <div className={cn("h-5 w-16 rounded-full", colorClasses.bg.gray200)} />
            <div className={cn("h-5 w-12 rounded-full", colorClasses.bg.gray200)} />
          </div>
          <div className={cn("h-5 w-3/4 rounded", colorClasses.bg.gray200)} />
          <div className={cn("h-4 w-1/2 rounded", colorClasses.bg.gray200)} />
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-1">
        <div className="space-y-2 mb-3">
          <div className={cn("h-3 w-full rounded", colorClasses.bg.gray200)} />
          <div className={cn("h-3 w-5/6 rounded", colorClasses.bg.gray200)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2">
              <div className={cn("w-6 h-6 rounded-lg", colorClasses.bg.gray200)} />
              <div className="space-y-1 flex-1">
                <div className={cn("h-4 w-12 rounded", colorClasses.bg.gray200)} />
                <div className={cn("h-3 w-8 rounded", colorClasses.bg.gray200)} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className={cn("p-3 sm:p-4 pt-2 border-t", colorClasses.border.gray100)}>
        <div className="flex w-full justify-between">
          <div className={cn("h-3 w-16 rounded", colorClasses.bg.gray200)} />
          <div className="flex gap-1.5">
            <div className={cn("h-8 w-14 rounded", colorClasses.bg.gray200)} />
            <div className={cn("h-8 w-14 rounded", colorClasses.bg.gray200)} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};