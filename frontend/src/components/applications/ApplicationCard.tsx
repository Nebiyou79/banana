/* eslint-disable @typescript-eslint/no-explicit-any */
// ApplicationCard.tsx — Clean, compact SaaS card UI
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Application, applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Calendar, Building, Download, Eye, FileText,
  Clock, User, ExternalLink, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApplicationCardProps {
  application: Application;
  viewType?: 'candidate' | 'company' | 'organization';
  onStatusUpdate?: (updatedApplication: Application) => void;
  onWithdraw?: (applicationId: string) => void;
  onSelect?: (application: Application) => void;
  enableOptimisticUpdates?: boolean;
  enableHapticFeedback?: boolean;
  className?: string;
  isSelected?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Haptic feedback hook (logic unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const useHapticFeedback = (enabled: boolean = false) => {
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enabled || typeof window === 'undefined') return;
      if (window.navigator?.vibrate) {
        const durations = { light: 10, medium: 20, heavy: 30 };
        window.navigator.vibrate(durations[type]);
      }
    },
    [enabled],
  );
  return { triggerHaptic };
};

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'applied':             { bg: colorClasses.bg.blueLight,    text: colorClasses.text.blue,    dot: 'bg-blue-400'    },
  'under-review':        { bg: colorClasses.bg.amberLight,   text: colorClasses.text.amber,   dot: 'bg-amber-400'   },
  'shortlisted':         { bg: colorClasses.bg.greenLight,   text: colorClasses.text.green,   dot: 'bg-green-400'   },
  'interview-scheduled': { bg: colorClasses.bg.purpleLight,  text: colorClasses.text.purple,  dot: 'bg-purple-400'  },
  'interviewed':         { bg: colorClasses.bg.indigoLight,  text: colorClasses.text.indigo,  dot: 'bg-indigo-400'  },
  'offer-pending':       { bg: colorClasses.bg.orangeLight,  text: colorClasses.text.orange,  dot: 'bg-orange-400'  },
  'offer-made':          { bg: colorClasses.bg.tealLight,    text: colorClasses.text.teal,    dot: 'bg-teal-400'    },
  'offer-accepted':      { bg: colorClasses.bg.emeraldLight, text: colorClasses.text.emerald, dot: 'bg-emerald-400' },
  'rejected':            { bg: colorClasses.bg.redLight,     text: colorClasses.text.red,     dot: 'bg-red-400'     },
  'on-hold':             { bg: colorClasses.bg.gray100,      text: colorClasses.text.slate,   dot: 'bg-slate-400'   },
  'withdrawn':           { bg: colorClasses.bg.gray100,      text: colorClasses.text.muted,   dot: 'bg-gray-400'    },
};

const StatusBadge: React.FC<{ status: string; label: string }> = ({ status, label }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['withdrawn'];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        s.bg,
        s.text,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cover letter preview — 3-line clamp with expand toggle
// ─────────────────────────────────────────────────────────────────────────────

const CoverLetterPreview: React.FC<{ content: string }> = ({ content }) => {
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (ref.current) {
      setHasOverflow(ref.current.scrollHeight > ref.current.clientHeight + 2);
    }
  }, [content]);

  return (
    <div className="space-y-1.5">
      <p
        ref={ref}
        className={cn(
          'text-xs leading-relaxed',
          colorClasses.text.secondary,
          !expanded && 'line-clamp-3',
        )}
      >
        {content}
      </p>
      {(hasOverflow || expanded) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={cn(
            'flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70',
            colorClasses.text.blue,
          )}
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" />Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" />Read more</>
          )}
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Document summary — compact count pills
// ─────────────────────────────────────────────────────────────────────────────

const DocSummary: React.FC<{ cvCount: number; refCount: number; expCount: number }> = ({
  cvCount,
  refCount,
  expCount,
}) => {
  const items = [
    { count: cvCount,  label: 'CV',  color: colorClasses.text.blue    },
    { count: refCount, label: 'Ref', color: colorClasses.text.purple  },
    { count: expCount, label: 'Exp', color: colorClasses.text.emerald },
  ].filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {items.map(({ count, label, color }) => (
        <span key={label} className={cn('flex items-center gap-1 text-xs', colorClasses.text.secondary)}>
          <FileText className={cn('h-3.5 w-3.5 shrink-0', color)} />
          {count}&nbsp;{label}{count > 1 ? 's' : ''}
        </span>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  viewType = 'candidate',
  onStatusUpdate,
  onWithdraw,
  onSelect,
  enableOptimisticUpdates = true,
  enableHapticFeedback = false,
  className = '',
  isSelected = false,
}) => {
  const [isUpdating, setIsUpdating]           = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const { toast }                             = useToast();
  const { getTouchTargetSize }                = useResponsive();
  const { triggerHaptic }                     = useHapticFeedback(enableHapticFeedback);

  const currentStatus      = optimisticStatus ?? application.status;
  const currentStatusLabel = optimisticStatus
    ? applicationService.getStatusLabel(optimisticStatus)
    : applicationService.getStatusLabel(application.status);

  const daysSinceApplied = Math.floor(
    (Date.now() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  // Computed before any conditional returns so they are always available
  const cvCount  = application.selectedCVs?.length ?? 0;
  const refCount = (application as any).references?.filter((r: any) => r.providedAsDocument).length ?? 0;
  const expCount = (application as any).workExperience?.filter((e: any) => e.providedAsDocument).length ?? 0;

  const getOwnerInfo = () => {
    if (application.job.jobType === 'organization' && application.job.organization)
      return { name: application.job.organization.name, verified: application.job.organization.verified };
    if (application.job.jobType === 'company' && application.job.company)
      return { name: application.job.company.name, verified: application.job.company.verified };
    return { name: 'Unknown', verified: false };
  };
  const ownerInfo = getOwnerInfo();

  // ── Handlers (logic unchanged) ───────────────────────────────────────────

  const handleViewCV = async (cv: any) => {
    try {
      triggerHaptic('light');
      setIsUpdating(true);
      const plain = applicationService.convertMongooseDocToPlainObject(cv);
      await applicationService.viewFile(plain, 'cv');
    } catch (error: any) {
      triggerHaptic('heavy');
      toast({ title: 'View Failed', description: error.message || 'Failed to view CV', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadCV = async (cv: any) => {
    try {
      triggerHaptic('light');
      setIsUpdating(true);
      const plain = applicationService.convertMongooseDocToPlainObject(cv);
      await applicationService.downloadFile(plain, 'cv');
      toast({ title: 'Download Started', description: 'CV download has been initiated' });
    } catch (error: any) {
      triggerHaptic('heavy');
      toast({ title: 'Download Failed', description: error.message || 'Failed to download CV', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    try {
      triggerHaptic('medium');
      if (enableOptimisticUpdates) setOptimisticStatus('withdrawn');
      await applicationService.withdrawApplication(application._id);
      onWithdraw(application._id);
      toast({ title: 'Application Withdrawn', description: 'Your application has been successfully withdrawn' });
      triggerHaptic('medium');
    } catch (error: any) {
      if (enableOptimisticUpdates) setOptimisticStatus(null);
      triggerHaptic('heavy');
      toast({ title: 'Withdrawal Failed', description: error.message || 'Failed to withdraw application', variant: 'destructive' });
    }
  };

  const handleSelect = () => {
    triggerHaptic('light');
    if (onSelect) {
      onSelect(application);
    } else {
      const base =
        viewType === 'candidate'
          ? '/dashboard/candidate/applications'
          : '/dashboard/company/applications';
      window.location.href = `${base}/${application._id}`;
    }
  };

  // ── Loading skeleton (non-optimistic updates) ─────────────────────────────

  if (isUpdating && !enableOptimisticUpdates) {
    return (
      <Card
        className={cn(
          'w-full border rounded-xl overflow-hidden',
          colorClasses.border.primary,
          colorClasses.bg.primary,
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        whileHover={{ y: -2, transition: { duration: 0.12 } }}
        className="w-full h-full"
      >
        <Card
          onClick={handleSelect}
          className={cn(
            'w-full cursor-pointer relative overflow-hidden rounded-xl transition-all duration-200',
            'border shadow-sm hover:shadow-md',
            colorClasses.border.primary,
            colorClasses.bg.primary,
            isSelected && `ring-2 ${colorClasses.ring.blue} ring-offset-2`,
            isUpdating && 'opacity-60 pointer-events-none',
            className,
          )}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <CardHeader className={cn('px-4 pt-4 pb-3 border-b', colorClasses.border.secondary)}>
            <div className="flex items-start justify-between gap-3">

              {/* Title + company */}
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'text-sm font-semibold leading-snug truncate mb-1',
                    colorClasses.text.primary,
                  )}
                >
                  {application.job.title}
                </h3>

                <div className="flex items-center gap-1.5">
                  <Building className={cn('h-3 w-3 shrink-0', colorClasses.text.muted)} />
                  <span className={cn('text-xs truncate', colorClasses.text.secondary)}>
                    {ownerInfo.name}
                  </span>
                  {ownerInfo.verified && (
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0',
                        colorClasses.bg.emeraldLight,
                        colorClasses.text.emerald,
                      )}
                    >
                      ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="shrink-0 pt-0.5">
                <StatusBadge status={currentStatus} label={currentStatusLabel} />
              </div>
            </div>
          </CardHeader>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <CardContent className="px-4 py-3 space-y-3">

            {/* Candidate info — company / org view only */}
            {viewType !== 'candidate' && application.candidate && (
              <div
                className={cn(
                  'flex items-center gap-2 text-xs overflow-hidden',
                  colorClasses.text.secondary,
                )}
              >
                <User className={cn('h-3.5 w-3.5 shrink-0', colorClasses.text.muted)} />
                <span className="font-medium shrink-0">{application.candidate.name}</span>
                <span className={cn('shrink-0', colorClasses.text.muted)}>·</span>
                <span className="truncate">{application.candidate.email}</span>
              </div>
            )}

            {/* Applied / updated dates */}
            <div
              className={cn(
                'flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs',
                colorClasses.text.muted,
              )}
            >
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Applied {daysSinceApplied === 0 ? 'today' : `${daysSinceApplied}d ago`}
              </span>
              {application.updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  Updated{' '}
                  {new Date(application.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            {/* Cover letter preview */}
            {application.coverLetter && (
              <CoverLetterPreview content={application.coverLetter} />
            )}

            {/* Document summary */}
            <DocSummary cvCount={cvCount} refCount={refCount} expCount={expCount} />

          </CardContent>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <CardFooter
            className={cn(
              'px-4 py-3 border-t flex items-center justify-between gap-2',
              colorClasses.border.secondary,
              colorClasses.bg.secondary,
            )}
          >
            {/* CV quick actions (first CV only) */}
            {cvCount > 0 ? (
              <div className="flex items-center gap-1 shrink-0">
                {(() => {
                  const cv    = application.selectedCVs[0];
                  const plain = applicationService.convertMongooseDocToPlainObject(cv);
                  const btnCls = cn(
                    'flex items-center justify-center h-8 w-8 rounded-lg border transition-colors',
                    colorClasses.border.primary,
                    colorClasses.text.secondary,
                    `hover:${colorClasses.bg.primary}`,
                  );
                  return (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewCV(plain); }}
                            className={btnCls}
                            aria-label="View CV"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">View CV</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadCV(plain); }}
                            className={btnCls}
                            aria-label="Download CV"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Download CV</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* Spacer keeps right-side buttons pinned right */
              <div />
            )}

            {/* Right-side: Withdraw + View */}
            <div className="flex items-center gap-2">
              {viewType === 'candidate' && applicationService.canWithdraw(currentStatus) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleWithdraw(); }}
                  disabled={isUpdating}
                  className={cn(
                    'h-8 px-3 text-xs rounded-lg border transition-all',
                    colorClasses.border.primary,
                    colorClasses.text.secondary,
                  )}
                >
                  {isUpdating ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Withdraw'}
                </Button>
              )}

              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleSelect(); }}
                disabled={isUpdating}
                className={cn(
                  'h-8 px-3 text-xs rounded-lg flex items-center gap-1.5 transition-all',
                  colorClasses.bg.blue,
                  'text-white hover:opacity-90',
                )}
              >
                <ExternalLink className="h-3 w-3" />
                View
              </Button>
            </div>
          </CardFooter>

          {/* Optimistic-update loading overlay */}
          {isUpdating && enableOptimisticUpdates && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 dark:bg-black/30 backdrop-blur-[2px]">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          )}
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default ApplicationCard;