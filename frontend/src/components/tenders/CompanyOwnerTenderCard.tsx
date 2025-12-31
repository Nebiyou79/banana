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
  canEditBasedOnWorkflow,
  getEditRestrictionReason,
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
  FileCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/social/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';

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
  
  // Check if tender can be edited (only draft or published open tenders)
  const canEdit = tender.status === 'draft' || 
    (tender.status === 'published' && tender.workflowType === 'open');
  
  const isActive = isTenderActive(tender);
  const progress = calculateProgress(tender);
  
  // Navigation paths
  const viewPath = `/dashboard/company/my-tenders/${tender._id}`;
  const editPath = `/dashboard/company/my-tenders/${tender._id}/edit`;

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
  const projectType = isFreelance ? tender.freelanceSpecific?.projectType : null;

  // Get status display
  const getStatusDisplay = (status: TenderStatus): { label: string; icon: JSX.Element; color: string } => {
    const statusConfig: Record<TenderStatus, { label: string; icon: JSX.Element; color: string }> = {
      draft: { label: 'Draft', icon: <FileText className="w-3 h-3" />, color: 'bg-gray-500' },
      published: { label: 'Active', icon: <Globe className="w-3 h-3" />, color: 'bg-green-500' },
      locked: { label: 'Locked', icon: <Lock className="w-3 h-3" />, color: 'bg-blue-500' },
      deadline_reached: { label: 'Deadline Reached', icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-500' },
      revealed: { label: 'Revealed', icon: <Eye className="w-3 h-3" />, color: 'bg-purple-500' },
      closed: { label: 'Closed', icon: <FileCheck className="w-3 h-3" />, color: 'bg-indigo-500' },
      cancelled: { label: 'Cancelled', icon: <AlertCircle className="w-3 h-3" />, color: 'bg-red-500' }
    };
    return statusConfig[status] || statusConfig.draft;
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

  // Get category color
  const getCategoryColor = (category: TenderCategoryType): string => {
    return category === 'freelance' 
      ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800/50'
      : 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800/50';
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

  const statusDisplay = getStatusDisplay(tender.status);
  const visibilityDisplay = getVisibilityDisplay(tender.visibility.visibilityType);

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      "bg-white dark:bg-gray-900",
      "border border-gray-200 dark:border-gray-800",
      "hover:border-blue-300 dark:hover:border-blue-700",
      className
    )}>
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${statusDisplay.color}`} />

      {/* Urgent badge for freelance tenders */}
      {isFreelance && tender.freelanceSpecific?.urgency === 'urgent' && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-md">
            <Zap className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Category and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "font-medium px-3 py-1 text-sm",
                  getCategoryColor(tender.tenderCategory)
                )}
              >
                {tender.tenderCategory === 'freelance' ? 'Freelance' : 'Professional'}
              </Badge>
              
              <Badge 
                variant="outline"
                className={cn(
                  "px-3 py-1 text-sm",
                  tender.workflowType === 'open' 
                    ? 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800'
                    : 'text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-800'
                )}
              >
                {tender.workflowType === 'open' ? 'Open Tender' : 'Sealed Bid'}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {tender.title}
          </h3>

          {/* Status and Visibility */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {statusDisplay.label}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {visibilityDisplay.icon}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {visibilityDisplay.label}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {tender.description.substring(0, 120)}...
        </p>

        {/* Progress Bar for active tenders */}
        {isActive && tender.status === 'published' && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{daysRemaining} days remaining</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Applications */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-lg">
                {totalApplications}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Applications
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-lg">
                {formatDeadline(tender.deadline)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Deadline
              </div>
            </div>
          </div>

          {/* Budget/Type */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              {isFreelance ? (
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-lg truncate">
                {isFreelance && budget ? (
                  `${formatCurrency(budget.min, budget.currency)} - ${formatCurrency(budget.max, budget.currency)}`
                ) : projectType ? (
                  projectType.charAt(0).toUpperCase() + projectType.slice(1).replace('_', ' ')
                ) : 'Professional'
                }
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isFreelance ? 'Budget' : 'Type'}
              </div>
            </div>
          </div>

          {/* Skills/Experience */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-lg">
                {tender.skillsRequired?.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {experienceLevel ? `${experienceLevel} level` : 'Skills'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex w-full justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Created {new Date(tender.createdAt).toLocaleDateString()}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="h-9 px-4 gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>

              {canEdit ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  className="h-9 px-4 gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-9 px-4 gap-2 opacity-50 cursor-not-allowed"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-sm max-w-xs">
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
    <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-300 dark:bg-gray-700" />
      
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="space-y-1 flex-1">
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex w-full justify-between">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-9 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};