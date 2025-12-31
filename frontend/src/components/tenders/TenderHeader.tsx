// components/tender/TenderHeader.tsx
import React from 'react';
import { 
  Bookmark, 
  Share2, 
  ExternalLink,
  BadgeCheck,
  Shield,
  Lock,
  Globe,
  Building,
  Calendar,
  Copy,
  FileText,
  Users,
  Award,
  MapPin,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Tender, 
  TenderStatus, 
  WorkflowType, 
  VisibilityType,
  getEditRestrictionReason,
  formatDeadline,
  getOwnerNavigationPath
} from '@/services/tenderService';
import { useToggleSaveTender, useTenderUtils } from '@/hooks/useTenders';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TenderHeaderProps {
  tender: Tender;
  userRole: 'freelancer' | 'company' | 'owner' | 'guest';
  userId?: string;
  onShare?: () => void;
  onEdit?: () => void;
  className?: string;
  condensed?: boolean;
  showFullDetails?: boolean;
}

export const TenderHeader: React.FC<TenderHeaderProps> = ({
  tender,
  userRole,
  userId,
  onShare,
  onEdit,
  className = '',
  condensed = false,
  showFullDetails = true
}) => {
  const { toast } = useToast();
  const { mutate: toggleSave } = useToggleSaveTender();
  const utils = useTenderUtils();
  
  const isOwner = userRole === 'owner';
  const canEdit = isOwner && utils.canEditTender(tender, userId || '');
  const editRestrictionReason = getEditRestrictionReason(tender);
  const isActive = utils.isTenderActive(tender);
  
  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      
      toast({
        title: 'Link copied',
        description: 'Tender link copied to clipboard',
        variant: 'success'
      });
      
      onShare?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };

  const handleSaveToggle = () => {
    toggleSave(tender._id);
  };

  const handleCopyReference = async () => {
    if (tender.professionalSpecific?.referenceNumber) {
      await navigator.clipboard.writeText(tender.professionalSpecific.referenceNumber);
      toast({
        title: 'Copied',
        description: 'Reference number copied to clipboard',
        variant: 'success'
      });
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWorkflowBadge = () => {
    const isClosed = tender.workflowType === 'closed';
    return {
      icon: isClosed ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />,
      label: isClosed ? 'Sealed Bid' : 'Open Tender',
      color: isClosed 
        ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50' 
        : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50'
    };
  };

  const getVisibilityBadge = () => {
    switch (tender.visibility.visibilityType) {
      case 'public':
        return { icon: <Globe className="w-3.5 h-3.5" />, label: 'Public' };
      case 'invite_only':
        return { icon: <Shield className="w-3.5 h-3.5" />, label: 'Invite Only' };
      case 'companies_only':
        return { icon: <Building className="w-3.5 h-3.5" />, label: 'Companies Only' };
      case 'freelancers_only':
        return { icon: <BadgeCheck className="w-3.5 h-3.5" />, label: 'Freelancers Only' };
      default:
        return { icon: <Globe className="w-3.5 h-3.5" />, label: 'Public' };
    }
  };

  const getStatusBadge = (status: TenderStatus) => {
    const statusMap: Record<TenderStatus, { label: string; icon: string; color: string }> = {
      draft: { 
        label: 'Draft', 
        icon: '📝', 
        color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700' 
      },
      published: { 
        label: 'Published', 
        icon: '📢', 
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' 
      },
      locked: { 
        label: 'Locked', 
        icon: '🔒', 
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' 
      },
      deadline_reached: { 
        label: 'Deadline Reached', 
        icon: '⏰', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' 
      },
      revealed: { 
        label: 'Revealed', 
        icon: '🔓', 
        color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700' 
      },
      closed: { 
        label: 'Closed', 
        icon: '🏁', 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700' 
      },
      cancelled: { 
        label: 'Cancelled', 
        icon: '❌', 
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' 
      }
    };
    return statusMap[status];
  };

  const deadlineFormatted = formatDeadline(tender.deadline);
  const workflowBadge = getWorkflowBadge();
  const visibilityBadge = getVisibilityBadge();
  const statusBadge = getStatusBadge(tender.status);
  const isSaved = tender.metadata.savedBy?.includes(userId || '');

  // Get owner navigation path
  const ownerPath = getOwnerNavigationPath(
    tender,
    tender.ownerRole === 'company' 
      ? 'dashboard/company/my-tenders' 
      : 'dashboard/organization/tenders'
  );

  if (condensed) {
    return (
      <div className={cn(
        "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
        "border-b border-slate-200 dark:border-slate-800",
        "px-4 py-3",
        className
      )}>
        <div className="flex items-center justify-between">
          {/* Left: Title & Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "px-2 py-1 text-xs font-medium border",
                tender.tenderCategory === 'professional'
                  ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50"
              )}>
                {tender.tenderCategory === 'professional' ? 'Professional' : 'Freelance'}
              </Badge>
              <Badge variant="outline" className={cn("px-2 py-1 text-xs border", workflowBadge.color)}>
                {workflowBadge.icon}
                <span className="ml-1">{workflowBadge.label}</span>
              </Badge>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-[300px]">
              {tender.title}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveToggle}
              className="h-8 w-8 p-0"
              title={isSaved ? 'Remove from saved' : 'Save tender'}
            >
              <Bookmark className={cn(
                "w-4 h-4",
                isSaved && "fill-yellow-400 text-yellow-400"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0"
              title="Share tender"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            {isOwner && canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 px-3"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
      "border-b border-slate-200 dark:border-slate-800",
      "py-4 md:py-6",
      "relative overflow-hidden",
      className
    )}>
      {/* Background pattern - subtle */}
      <div className="absolute inset-0 opacity-5 bg-grid-slate-200 dark:bg-grid-slate-800" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Top Row: Status & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Badge */}
            <Badge className={cn(
              "px-3 py-1.5 border font-medium",
              tender.tenderCategory === 'professional'
                ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
            )}>
              <span className="flex items-center gap-1.5">
                {tender.tenderCategory === 'professional' ? (
                  <Building className="w-4 h-4" />
                ) : (
                  <Award className="w-4 h-4" />
                )}
                {tender.tenderCategory === 'professional' ? 'Professional Tender' : 'Freelance Project'}
              </span>
            </Badge>
            
            {/* Workflow Badge */}
            <Badge variant="outline" className={cn("px-3 py-1.5 border font-medium", workflowBadge.color)}>
              <span className="flex items-center gap-1.5">
                {workflowBadge.icon}
                {workflowBadge.label}
              </span>
            </Badge>
            
            {/* Status Badge */}
            <Badge className={cn("px-3 py-1.5 border font-medium", statusBadge.color)}>
              <span className="flex items-center gap-1.5">
                {statusBadge.icon}
                {statusBadge.label}
              </span>
            </Badge>

            {/* Visibility Badge (if not public) */}
            {tender.visibility.visibilityType !== 'public' && (
              <Badge variant="outline" className="px-3 py-1.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                <span className="flex items-center gap-1.5">
                  {visibilityBadge.icon}
                  {visibilityBadge.label}
                </span>
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToggle}
              className={cn(
                "h-9 px-3 border-slate-300 dark:border-slate-700",
                isSaved && "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
              )}
              title={isSaved ? 'Remove from saved' : 'Save tender'}
            >
              <Bookmark className={cn(
                "w-4 h-4 mr-2",
                isSaved && "fill-yellow-400"
              )} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </Button>
            
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 px-3 border-slate-300 dark:border-slate-700"
              title="Share tender"
            >
              <Share2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            
            {/* Edit Button (Owner only) */}
            {isOwner && (
              <Button
                variant={canEdit ? "default" : "outline"}
                size="sm"
                onClick={onEdit}
                disabled={!canEdit}
                title={editRestrictionReason || "Edit tender"}
                className="h-9 px-4"
              >
                Edit
              </Button>
            )}
            
            {/* Owner Website Link */}
            {tender.ownerEntity?.website && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(tender.ownerEntity!.website, '_blank')}
                className="h-9 px-3"
                title="Visit company website"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {tender.title}
            </h1>
            
            {/* Reference Number (Professional only) */}
            {tender.tenderCategory === 'professional' && tender.professionalSpecific?.referenceNumber && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                <FileText className="w-4 h-4" />
                <span className="font-mono">Ref: {tender.professionalSpecific.referenceNumber}</span>
                <button
                  onClick={handleCopyReference}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  title="Copy reference number"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {showFullDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Deadline */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Deadline</p>
                  <p className="font-medium text-slate-900 dark:text-white">{deadlineFormatted}</p>
                </div>
              </div>
              
              {/* Owner */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Owner</p>
                  <Link 
                    href={ownerPath}
                    className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {tender.ownerEntity.name}
                    {tender.ownerEntity.verified && (
                      <BadgeCheck className="w-4 h-4 inline ml-1 text-emerald-500" />
                    )}
                  </Link>
                </div>
              </div>
              
              {/* Proposals */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Proposals</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {tender.metadata.visibleApplications || 0} of {tender.metadata.totalApplications || 0} visible
                  </p>
                </div>
              </div>
              
              {/* Views */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Views</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {tender.metadata.views || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isActive ? "bg-green-500" : "bg-red-500"
              )} />
              <span className={cn(
                "text-sm font-medium",
                isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {isActive ? 'Active • Accepting proposals' : 'Inactive • Not accepting proposals'}
              </span>
            </div>
            
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Published: {formatDate(tender.publishedAt || tender.createdAt)}
              {tender.metadata.isUpdated && ' • Updated'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};