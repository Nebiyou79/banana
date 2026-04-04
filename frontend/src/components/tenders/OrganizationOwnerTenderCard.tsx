/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/organization/OrganizationOwnerTenderCard.tsx
import React, { JSX } from 'react';
import {
  Tender,
  TenderStatus,
  WorkflowType,
  TenderCategoryType,
  VisibilityType,
  formatDeadline,
  isTenderActive,
  calculateProgress
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
  Shield,
  Award,
  FileCheck,
  DollarSign,
  Target,
  BarChart3,
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

interface OrganizationOwnerTenderCardProps {
  tender: Tender;
  showActions?: boolean;
  className?: string;
}

export const OrganizationOwnerTenderCard: React.FC<OrganizationOwnerTenderCardProps> = ({
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
  const viewPath = `/dashboard/organization/tenders/${tender._id}`;
  const editPath = `/dashboard/organization/tenders/${tender._id}/edit`;

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

  // Professional-specific details
  const isProfessional = tender.tenderCategory === 'professional';
  const professionalDetails = tender.professionalSpecific;
  const isCPORequired = isProfessional && professionalDetails?.cpoRequired === true;
  const procurementMethod = professionalDetails?.procurementMethod;
  const referenceNumber = professionalDetails?.referenceNumber;
  const evaluationMethod = professionalDetails?.evaluationMethod;
  const minimumExperience = professionalDetails?.minimumExperience;

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
  const getStatusBadgeClasses = (status: TenderStatus): { bg: string; text: string } => {
    const statusClasses: Record<TenderStatus, { bg: string; text: string }> = {
      draft: { bg: colorClasses.bg.secondary, text: colorClasses.text.secondary },
      published: { bg: colorClasses.bg.emeraldLight, text: colorClasses.text.emerald },
      locked: { bg: colorClasses.bg.blueLight, text: colorClasses.text.blue },
      deadline_reached: { bg: colorClasses.bg.amberLight, text: colorClasses.text.amber },
      revealed: { bg: colorClasses.bg.purpleLight, text: colorClasses.text.purple },
      closed: { bg: colorClasses.bg.indigoLight, text: colorClasses.text.indigo },
      cancelled: { bg: colorClasses.bg.redLight, text: colorClasses.text.red }
    };
    return statusClasses[status] || statusClasses.draft;
  };

  // Get category badge classes
  const getCategoryBadgeClasses = (category: TenderCategoryType): { bg: string; text: string } => {
    return category === 'freelance'
      ? { bg: colorClasses.bg.emeraldLight, text: colorClasses.text.emerald }
      : { bg: colorClasses.bg.blueLight, text: colorClasses.text.blue };
  };

  // Get workflow badge classes
  const getWorkflowBadgeClasses = (workflow: WorkflowType): { bg: string; text: string } => {
    return workflow === 'open'
      ? { bg: colorClasses.bg.blueLight, text: colorClasses.text.blue }
      : { bg: colorClasses.bg.purpleLight, text: colorClasses.text.purple };
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

  // Get procurement method display
  const getProcurementMethodDisplay = (method?: string): string => {
    if (!method) return 'N/A';
    const methodMap: Record<string, string> = {
      'open_tender': 'Open',
      'restricted': 'Restricted',
      'direct': 'Direct',
      'framework': 'Framework'
    };
    return methodMap[method] || method;
  };

  // Get evaluation method display
  const getEvaluationMethodDisplay = (method?: string): string => {
    if (!method) return 'N/A';
    const methodMap: Record<string, string> = {
      'technical_only': 'Technical',
      'financial_only': 'Financial',
      'combined': 'Combined'
    };
    return methodMap[method] || method;
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
  const statusClasses = getStatusBadgeClasses(tender.status);
  const visibilityDisplay = getVisibilityDisplay(tender.visibility.visibilityType);
  const categoryClasses = getCategoryBadgeClasses(tender.tenderCategory);
  const workflowClasses = getWorkflowBadgeClasses(tender.workflowType);

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

      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="space-y-2">
          {/* Category, Status, and Reference */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "px-2 py-0.5 text-xs font-medium",
                categoryClasses.bg,
                categoryClasses.text
              )}
            >
              {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "px-2 py-0.5 text-xs",
                workflowClasses.bg,
                workflowClasses.text
              )}
            >
              {tender.workflowType === 'open' ? 'Open' : 'Sealed'}
            </Badge>

            {referenceNumber && (
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-xs",
                  colorClasses.bg.blueLight,
                  colorClasses.text.blue
                )}
              >
                Ref: {referenceNumber}
              </Badge>
            )}

            {isCPORequired && (
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-xs",
                  colorClasses.bg.redLight,
                  colorClasses.text.red
                )}
              >
                <Shield className="w-2.5 h-2.5 mr-1" />
                CPO
              </Badge>
            )}
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
              className={cn("px-2 py-0.5 text-xs", statusClasses.bg, statusClasses.text)}
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

          {/* Procurement Method */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            colorClasses.bg.secondary
          )}>
            <div className={cn("p-1.5 rounded-lg", colorClasses.bg.emeraldLight)}>
              {isProfessional ? (
                <Award className={cn("w-3.5 h-3.5", colorClasses.text.emerald)} />
              ) : (
                <DollarSign className={cn("w-3.5 h-3.5", colorClasses.text.emerald)} />
              )}
            </div>
            <div>
              <div className={cn("font-semibold text-sm truncate max-w-[80px]", colorClasses.text.primary)}>
                {isProfessional ? getProcurementMethodDisplay(procurementMethod) : 'Freelance'}
              </div>
              <div className={cn("text-xs", colorClasses.text.muted)}>
                {isProfessional ? 'Method' : 'Type'}
              </div>
            </div>
          </div>

          {/* Evaluation */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg",
            colorClasses.bg.secondary
          )}>
            <div className={cn("p-1.5 rounded-lg", colorClasses.bg.purpleLight)}>
              {isProfessional ? (
                <BarChart3 className={cn("w-3.5 h-3.5", colorClasses.text.purple)} />
              ) : (
                <Tag className={cn("w-3.5 h-3.5", colorClasses.text.purple)} />
              )}
            </div>
            <div>
              <div className={cn("font-semibold text-sm", colorClasses.text.primary)}>
                {isProfessional
                  ? getEvaluationMethodDisplay(evaluationMethod)
                  : `${tender.skillsRequired?.length || 0}`
                }
              </div>
              <div className={cn("text-xs", colorClasses.text.muted)}>
                {isProfessional ? 'Eval' : 'Skills'}
              </div>
            </div>
          </div>
        </div>

        {/* Professional-specific details */}
        {isProfessional && (minimumExperience || isCPORequired) && (
          <div className={cn("mt-2 pt-2 border-t", colorClasses.border.gray100, "space-y-1")}>
            {minimumExperience && (
              <div className="flex items-center gap-1.5 text-xs">
                <Target className={cn("w-3 h-3", colorClasses.text.muted)} />
                <span className={colorClasses.text.secondary}>
                  Min Exp: {minimumExperience} years
                </span>
              </div>
            )}
          </div>
        )}
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
export const OrganizationOwnerTenderCardSkeleton: React.FC = () => {
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