// components/tender/TenderHeader.tsx
import React, { useState, useEffect } from 'react';
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
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/use-toast';
import {
  Tender,
  TenderStatus,
  getEditRestrictionReason,
  formatDeadline,
  getOwnerNavigationPath
} from '@/services/tenderService';
import { useToggleSaveTender, useTenderUtils } from '@/hooks/useTenders';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 }
};

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
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isOwner = userRole === 'owner';
  const canEdit = isOwner && utils.canEditTender(tender, userId || '');
  const editRestrictionReason = getEditRestrictionReason(tender);
  const isActive = utils.isTenderActive(tender);
  const isSaved = tender.metadata.savedBy?.includes(userId || '');

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
    toast({
      title: isSaved ? 'Removed from saved' : 'Saved to bookmarks',
      description: isSaved ? 'Tender removed from your saved list' : 'Tender added to your saved list',
      variant: 'success'
    });
  };

  const handleCopyReference = async () => {
    if (tender.professionalSpecific?.referenceNumber) {
      await navigator.clipboard.writeText(tender.professionalSpecific.referenceNumber);
      setIsCopied(true);
      toast({
        title: 'Copied',
        description: 'Reference number copied to clipboard',
        variant: 'success'
      });
      setTimeout(() => setIsCopied(false), 2000);
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
        ? 'bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50 backdrop-blur-xs'
        : 'bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50 backdrop-blur-xs'
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
        color: 'bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 backdrop-blur-xs'
      },
      published: {
        label: 'Published',
        icon: '📢',
        color: 'bg-green-100/80 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50 backdrop-blur-xs'
      },
      locked: {
        label: 'Locked',
        icon: '🔒',
        color: 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50 backdrop-blur-xs'
      },
      deadline_reached: {
        label: 'Deadline Reached',
        icon: '⏰',
        color: 'bg-yellow-100/80 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800/50 backdrop-blur-xs'
      },
      revealed: {
        label: 'Revealed',
        icon: '🔓',
        color: 'bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50 backdrop-blur-xs'
      },
      closed: {
        label: 'Closed',
        icon: '🏁',
        color: 'bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/50 backdrop-blur-xs'
      },
      cancelled: {
        label: 'Cancelled',
        icon: '❌',
        color: 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50 backdrop-blur-xs'
      }
    };
    return statusMap[status];
  };

  const deadlineFormatted = formatDeadline(tender.deadline);
  const workflowBadge = getWorkflowBadge();
  const visibilityBadge = getVisibilityBadge();
  const statusBadge = getStatusBadge(tender.status);

  // Get owner navigation path
  const ownerPath = getOwnerNavigationPath(
    tender,
    tender.ownerRole === 'company'
      ? 'dashboard/company/tenders/my-tenders'
      : 'dashboard/organization/tenders'
  );

  // Mobile details toggle
  const toggleMobileDetails = () => {
    setShowMobileDetails(!showMobileDetails);
  };

  if (condensed) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className={cn(
          "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md",
          "border-b border-slate-200/50 dark:border-slate-800/50",
          "px-4 py-2.5 sticky top-0 z-30",
          "shadow-xs",
          className
        )}
      >
        {/* Two-row layout on mobile, single row on desktop */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          {/* Left: Badges + Title stacked on mobile, inline on sm+ */}
          <motion.div variants={staggerContainer} className="flex-1 min-w-0 overflow-hidden">
            {/* Badges row */}
            <div className="flex items-center gap-1.5 mb-1">
              <motion.div variants={scaleIn} className="shrink-0">
                <Badge className={cn(
                  "px-2 py-0.5 text-xs font-medium border backdrop-blur-xs whitespace-nowrap",
                  tender.tenderCategory === 'professional'
                    ? "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50"
                    : "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50"
                )}>
                  {tender.tenderCategory === 'professional' ? 'Professional' : 'Freelance'}
                </Badge>
              </motion.div>
              <motion.div variants={scaleIn} className="shrink-0">
                <Badge variant="outline" className={cn("px-2 py-0.5 text-xs border backdrop-blur-xs whitespace-nowrap", workflowBadge.color)}>
                  <span className="flex items-center gap-1">
                    {workflowBadge.icon}
                    <span className="hidden xs:inline sm:inline">{workflowBadge.label}</span>
                  </span>
                </Badge>
              </motion.div>
            </div>
            {/* Title — wraps naturally, never truncates */}
            <motion.h1
              variants={fadeInUp}
              className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white leading-snug break-words hyphens-auto"
            >
              {tender.title}
            </motion.h1>
          </motion.div>

          {/* Right: Action icons — always shrink-0 so they never wrap */}
          <motion.div variants={staggerContainer} className="flex items-center gap-1 shrink-0 mt-0.5">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveToggle}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={isSaved ? 'Remove from saved' : 'Save tender'}
              >
                <Bookmark className={cn(
                  "w-4 h-4 transition-all duration-300",
                  isSaved && "fill-yellow-400 text-yellow-400"
                )} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Share tender"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </motion.div>
            {isOwner && canEdit && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 hidden sm:flex"
                >
                  Edit
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className={cn(
        "bg-gradient-to-br from-white/90 via-white/50 to-slate-50/50",
        "dark:from-slate-900/90 dark:via-slate-900/50 dark:to-slate-800/50",
        "backdrop-blur-md",
        "border-b border-slate-200/50 dark:border-slate-800/50",
        "py-4 md:py-6",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Animated background pattern */}
      <motion.div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
        animate={{
          backgroundPosition: ['0px 0px', '32px 32px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent dark:from-slate-900/50 dark:via-transparent dark:to-transparent" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Top Row: Status & Actions */}
        <motion.div 
          variants={staggerContainer}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-4"
        >
          {/* Status Badges - Scrollable on mobile */}
          <motion.div variants={staggerContainer} className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-hide flex-shrink min-w-0">
            <motion.div variants={scaleIn} className="shrink-0">
              <Badge className={cn(
                "px-2.5 py-1.5 border font-medium whitespace-nowrap backdrop-blur-xs",
                tender.tenderCategory === 'professional'
                  ? "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50"
                  : "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50"
              )}>
                <span className="flex items-center gap-1.5">
                  {tender.tenderCategory === 'professional' ? (
                    <Building className="w-3.5 h-3.5" />
                  ) : (
                    <Award className="w-3.5 h-3.5" />
                  )}
                  {tender.tenderCategory === 'professional' ? 'Professional' : 'Freelance'}
                </span>
              </Badge>
            </motion.div>

            <motion.div variants={scaleIn} className="shrink-0">
              <Badge variant="outline" className={cn("px-2.5 py-1.5 border font-medium whitespace-nowrap backdrop-blur-xs", workflowBadge.color)}>
                <span className="flex items-center gap-1.5">
                  {workflowBadge.icon}
                  {workflowBadge.label}
                </span>
              </Badge>
            </motion.div>

            <motion.div variants={scaleIn} className="shrink-0">
              <Badge className={cn("px-2.5 py-1.5 border font-medium whitespace-nowrap backdrop-blur-xs", statusBadge.color)}>
                <span className="flex items-center gap-1.5">
                  <span>{statusBadge.icon}</span>
                  {statusBadge.label}
                </span>
              </Badge>
            </motion.div>

            {tender.visibility.visibilityType !== 'public' && (
              <motion.div variants={scaleIn} className="shrink-0">
                <Badge variant="outline" className="px-2.5 py-1.5 border-slate-300/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/50 whitespace-nowrap backdrop-blur-xs">
                  <span className="flex items-center gap-1.5">
                    {visibilityBadge.icon}
                    {visibilityBadge.label}
                  </span>
                </Badge>
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={staggerContainer} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToggle}
                className={cn(
                  "h-8 sm:h-9 px-2 sm:px-3 border-slate-300/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-xs",
                  isSaved && "bg-yellow-50/80 border-yellow-200/50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:text-yellow-300"
                )}
                title={isSaved ? 'Remove from saved' : 'Save tender'}
              >
                <Bookmark className={cn(
                  "w-3.5 h-3.5 sm:mr-1.5 transition-all duration-300",
                  isSaved && "fill-yellow-400"
                )} />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-8 sm:h-9 px-2 sm:px-3 border-slate-300/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-xs"
                title="Share tender"
              >
                <Share2 className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </motion.div>

            {isOwner && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={canEdit ? "default" : "outline"}
                  size="sm"
                  onClick={onEdit}
                  disabled={!canEdit}
                  title={editRestrictionReason || "Edit tender"}
                  className="h-8 sm:h-9 px-3 sm:px-4 backdrop-blur-xs"
                >
                  Edit
                </Button>
              </motion.div>
            )}

            {tender.ownerEntity?.website && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(tender.ownerEntity!.website, '_blank')}
                  className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Visit company website"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={staggerContainer} className="space-y-3">
          {/* Title and Reference */}
          <motion.div variants={fadeInUp}>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1.5 leading-tight break-words hyphens-auto">
              {tender.title}
            </h1>

            {tender.tenderCategory === 'professional' && tender.professionalSpecific?.referenceNumber && (
              <motion.div 
                variants={scaleIn}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs sm:text-sm"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-mono">Ref: {tender.professionalSpecific.referenceNumber}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyReference}
                  className={cn(
                    "text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-all duration-300",
                    isCopied && "text-green-600 dark:text-green-400"
                  )}
                  title="Copy reference number"
                >
                  <Copy className={cn(
                    "w-3 h-3 transition-all duration-300",
                    isCopied && "rotate-12"
                  )} />
                  {isCopied && <span className="text-xs">Copied!</span>}
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Quick Stats - Desktop Grid / Mobile Collapsible */}
          {showFullDetails && (
            <>
              {/* Desktop View */}
              <motion.div 
                variants={staggerContainer}
                className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {[
                  {
                    icon: <Calendar className="w-5 h-5" />,
                    color: 'blue',
                    label: 'Deadline',
                    value: deadlineFormatted
                  },
                  {
                    icon: <Building className="w-5 h-5" />,
                    color: 'emerald',
                    label: 'Owner',
                    value: (
                      <Link
                        href={ownerPath}
                        className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {tender.ownerEntity.name}
                        {tender.ownerEntity.verified && (
                          <BadgeCheck className="w-4 h-4 inline ml-1 text-emerald-500" />
                        )}
                      </Link>
                    )
                  },
                  {
                    icon: <Users className="w-5 h-5" />,
                    color: 'purple',
                    label: 'Proposals',
                    value: `${tender.metadata.visibleApplications || 0} of ${tender.metadata.totalApplications || 0} visible`
                  },
                  {
                    icon: <Eye className="w-5 h-5" />,
                    color: 'amber',
                    label: 'Views',
                    value: tender.metadata.views || 0
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300/50 dark:hover:border-slate-600/50 transition-all duration-300"
                  >
                    <div className={cn(
                      "p-2 rounded-md transition-all duration-300",
                      `bg-${item.color}-100/80 dark:bg-${item.color}-900/30`,
                      `group-hover:bg-${item.color}-200/80 dark:group-hover:bg-${item.color}-800/40`
                    )}>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Mobile View - Collapsible */}
              <div className="md:hidden">
                <motion.button
                  onClick={toggleMobileDetails}
                  className="w-full flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Quick Details
                  </span>
                  {showMobileDetails ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </motion.button>

                <motion.div
                  initial={false}
                  animate={showMobileDetails ? "open" : "closed"}
                  variants={{
                    open: { opacity: 1, height: "auto", marginTop: 8 },
                    closed: { opacity: 0, height: 0, marginTop: 0 }
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    {/* Deadline */}
                    <motion.div 
                      variants={scaleIn}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">Deadline</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{deadlineFormatted}</span>
                    </motion.div>

                    {/* Owner */}
                    <motion.div 
                      variants={scaleIn}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">Owner</span>
                      </div>
                      <Link
                        href={ownerPath}
                        className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        {tender.ownerEntity.name}
                        {tender.ownerEntity.verified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </Link>
                    </motion.div>

                    {/* Proposals & Views combined for mobile */}
                    <motion.div 
                      variants={scaleIn}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-300">Props</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {tender.metadata.visibleApplications || 0}/{tender.metadata.totalApplications || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-300">Views</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {tender.metadata.views || 0}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Status Indicator */}
          <motion.div 
            variants={fadeInUp}
            className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50"
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={cn(
                  "w-2 h-2 rounded-full",
                  isActive ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className={cn(
                "text-xs sm:text-sm font-medium",
                isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {isActive ? 'Active • Accepting proposals' : 'Inactive • Not accepting proposals'}
              </span>
            </motion.div>

            <motion.div 
              className="text-xs sm:text-sm text-slate-500 dark:text-slate-400"
              whileHover={{ scale: 1.02 }}
            >
              Published: {formatDate(tender.publishedAt || tender.createdAt)}
              {tender.metadata.isUpdated && ' • Updated'}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};