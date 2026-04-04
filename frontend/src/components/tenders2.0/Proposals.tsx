// components/tenders/detail/ProposalsSection.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  Star,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { SectionCard } from '@/components/tenders/shared/SectionCard';
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
import type { FreelanceTenderApplication, ProfessionalTenderBid } from '@/types/tender.types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProposalsSectionProps {
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  workflowType: 'open' | 'closed';
  tenderStatus: string;
  deadline: string | Date;
  isOwner: boolean;
  applications?: FreelanceTenderApplication[];
  totalApplications?: number;
  bids?: ProfessionalTenderBid[];
  totalBids?: number;
  sealedBids?: number;
  onRevealBids?: () => void;
  isRevealing?: boolean;
  myApplicationId?: string;
  className?: string;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const computeCountdown = (deadline: string | Date): CountdownState => {
  const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const pad = (n: number) => String(n).padStart(2, '0');

const statusChipClass = (status: string) => {
  switch (status) {
    case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'under_review': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'shortlisted': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'awarded': return 'bg-[#F1BB03]/20 text-amber-800 border-[#F1BB03]/50';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const formatDate = (d?: string | Date) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── CountdownBox ─────────────────────────────────────────────────────────────
const CountdownBox: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const [flip, setFlip] = useState(false);
  const [prev, setPrev] = useState(value);

  useEffect(() => {
    if (value !== prev) {
      setFlip(true);
      setTimeout(() => setFlip(false), 300);
      setPrev(value);
    }
  }, [value, prev]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center relative overflow-hidden',
          'bg-[#0A2540] border border-[#F1BB03]/30',
          flip ? 'animate-flip-once' : ''
        )}
        style={{ perspective: '500px' }}
      >
        <span className="text-3xl sm:text-4xl font-bold text-[#F1BB03] tabular-nums">{pad(value)}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
};

// ─── Application Card (Freelance) ─────────────────────────────────────────────
const ApplicationCard: React.FC<{
  application: FreelanceTenderApplication;
  isOwner: boolean;
  isMyApplication?: boolean;
  onUpdateStatus?: (id: string, status: string) => void;
}> = ({ application, isOwner, isMyApplication, onUpdateStatus }) => {
  const app = application as any;
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(241,187,3,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        colorClasses.bg.white,
        colorClasses.border.gray200,
        isMyApplication ? 'border-[#F1BB03]/60 bg-[#FFFBEB]/50' : ''
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
            'bg-[#F1BB03]/20 text-[#0A2540]')}>
            {(app.applicant?.name || app.freelancerName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('font-semibold text-sm', colorClasses.text.primary)}>
                {app.applicant?.name || app.freelancerName || 'Applicant'}
              </p>
              {isMyApplication && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F1BB03]/20 text-amber-800 border border-[#F1BB03]/40">
                  <Star className="w-3 h-3" /> Your Application
                </span>
              )}
            </div>
            {app.proposedRate && (
              <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>
                Rate: <strong className={colorClasses.text.primary}>{app.currency || '$'}{app.proposedRate}</strong>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusChipClass(app.status))}>
            {app.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {app.coverLetter && (
        <p className={cn('mt-3 text-sm leading-relaxed line-clamp-3', colorClasses.text.secondary)}>
          {app.coverLetter}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={cn('text-xs', colorClasses.text.muted)}>{formatDate(app.createdAt || app.submittedAt)}</span>
        {isOwner && app.status === 'submitted' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus?.(app._id, 'accepted')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              <CheckCircle className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={() => onUpdateStatus?.(app._id, 'rejected')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              <XCircle className="w-3 h-3" /> Decline
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Bid Card (Professional) ─────────────────────────────────────────────────
const BidCard: React.FC<{
  bid: ProfessionalTenderBid;
  isOwner: boolean;
  showAmount: boolean;
  isMyBid?: boolean;
}> = ({ bid, isOwner, showAmount, isMyBid }) => {
  const b = bid as any;
  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(241,187,3,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        colorClasses.bg.white,
        colorClasses.border.gray200,
        isMyBid ? 'border-[#F1BB03]/60 bg-[#FFFBEB]/50' : ''
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn('font-semibold text-sm', colorClasses.text.primary)}>
              {b.bidderCompany?.name || b.companyName || 'Company'}
            </p>
            {isMyBid && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F1BB03]/20 text-amber-800 border border-[#F1BB03]/40">
                <Star className="w-3 h-3" /> Your Bid
              </span>
            )}
          </div>
          {showAmount && b.bidAmount && (
            <p className={cn('text-lg font-bold mt-1', colorClasses.text.primary)}>
              {b.currency || 'USD'} {Number(b.bidAmount).toLocaleString()}
            </p>
          )}
          {!showAmount && !isMyBid && (
            <p className={cn('text-sm mt-1 italic', colorClasses.text.muted)}>Bid amount hidden</p>
          )}
        </div>
        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0', statusChipClass(b.status))}>
          {b.status?.replace(/_/g, ' ')}
        </span>
      </div>
      {b.technicalProposal && (
        <p className={cn('mt-3 text-sm leading-relaxed line-clamp-3', colorClasses.text.secondary)}>{b.technicalProposal}</p>
      )}
      <p className={cn('mt-2 text-xs', colorClasses.text.muted)}>{formatDate(b.submittedAt || b.createdAt)}</p>
    </motion.div>
  );
};

// ─── Main ProposalsSection ────────────────────────────────────────────────────
export const ProposalsSection: React.FC<ProposalsSectionProps> = ({
  tenderId,
  tenderType,
  workflowType,
  tenderStatus,
  deadline,
  isOwner,
  applications = [],
  totalApplications = 0,
  bids = [],
  totalBids = 0,
  sealedBids = 0,
  onRevealBids,
  isRevealing = false,
  myApplicationId,
  className,
}) => {
  const [countdown, setCountdown] = useState<CountdownState>(computeCountdown(deadline));
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);

  // Live countdown
  useEffect(() => {
    if (!['published', 'locked'].includes(tenderStatus) || workflowType !== 'closed') return;
    const interval = setInterval(() => setCountdown(computeCountdown(deadline)), 1000);
    return () => clearInterval(interval);
  }, [deadline, tenderStatus, workflowType]);

  const handleRevealConfirmed = useCallback(() => {
    setShowRevealConfirm(false);
    onRevealBids?.();
  }, [onRevealBids]);

  const totalCount = tenderType === 'freelance' ? totalApplications : totalBids;
  const sectionTitle = tenderType === 'freelance' ? 'Proposals' : 'Bids';

  // ── MODE A: Sealed bid countdown ──────────────────────────────────────────
  if (workflowType === 'closed' && ['published', 'locked'].includes(tenderStatus)) {
    return (
      <SectionCard
        icon={<Lock className="w-5 h-5 text-blue-500" />}
        title={`${sectionTitle} — Sealed`}
        description="Bids are sealed until the deadline is reached"
        className={className}
      >
        <div className="space-y-6">
          {/* Countdown */}
          <div className="relative">
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl ring-2 ring-[#F1BB03] pointer-events-none"
            />
            <div className="bg-[#0A2540] rounded-2xl p-6 sm:p-8">
              <p className="text-center text-xs uppercase tracking-widest text-gray-400 mb-6">
                Time until deadline
              </p>
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                <CountdownBox value={countdown.days} label="Days" />
                <span className="text-3xl font-bold text-[#F1BB03] mb-5">:</span>
                <CountdownBox value={countdown.hours} label="Hours" />
                <span className="text-3xl font-bold text-[#F1BB03] mb-5">:</span>
                <CountdownBox value={countdown.minutes} label="Mins" />
                <span className="text-3xl font-bold text-[#F1BB03] mb-5">:</span>
                <CountdownBox value={countdown.seconds} label="Secs" />
              </div>
            </div>
          </div>

          {/* Sealed info */}
          <div className={cn('flex items-start gap-3 rounded-lg border p-4', colorClasses.bg.blueLight, colorClasses.border.blue600)}>
            <Lock className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.blue600)} />
            <div>
              <p className={cn('font-semibold text-sm', colorClasses.text.blue600)}>Bids are sealed until deadline</p>
              <p className={cn('text-xs mt-0.5', colorClasses.text.blue600)}>All submissions are encrypted and will only be revealed after the deadline.</p>
            </div>
          </div>

          {/* Count badge */}
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold', colorClasses.bg.secondary, colorClasses.text.primary)}>
              <Users className="w-4 h-4" />
              {sealedBids || totalCount} sealed bid{(sealedBids || totalCount) !== 1 ? 's' : ''} received
            </span>
          </div>
        </div>
      </SectionCard>
    );
  }

  // ── MODE B: Deadline reached, awaiting reveal ─────────────────────────────
  if (workflowType === 'closed' && tenderStatus === 'deadline_reached') {
    return (
      <SectionCard
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        title={`${sectionTitle} — Ready to Reveal`}
        className={className}
      >
        <div className="space-y-5">
          <div className={cn('flex items-start gap-3 rounded-lg border p-4', colorClasses.bg.amberLight, colorClasses.border.amber)}>
            <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.amber700)} />
            <p className={cn('text-sm font-medium', colorClasses.text.amber700)}>
              Deadline reached — bids are ready to be revealed.
            </p>
          </div>

          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold', colorClasses.bg.secondary, colorClasses.text.primary)}>
            <Users className="w-4 h-4" />
            {totalCount} sealed bid{totalCount !== 1 ? 's' : ''} received
          </div>

          {isOwner ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRevealConfirm(true)}
                disabled={isRevealing}
                className="w-full h-14 px-8 bg-[#F1BB03] text-[#0A2540] font-bold rounded-xl shadow-lg shadow-[#F1BB03]/30 hover:shadow-[#F1BB03]/50 hover:brightness-105 transition-all disabled:opacity-60 flex items-center justify-center gap-3 text-base"
              >
                {isRevealing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Revealing…</>
                ) : (
                  <><Unlock className="w-5 h-5" /> Reveal All Bids</>
                )}
              </motion.button>

              <AlertDialog open={showRevealConfirm} onOpenChange={setShowRevealConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reveal all bids?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will make all {totalCount} submitted bids visible. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevealConfirmed} className="bg-[#F1BB03] text-[#0A2540] hover:brightness-105">
                      Reveal Bids
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className={cn('flex items-start gap-3 rounded-lg border p-4', colorClasses.bg.secondary, colorClasses.border.gray200)}>
              <Info className={cn('w-5 h-5 mt-0.5', colorClasses.text.muted)} />
              <p className={cn('text-sm', colorClasses.text.secondary)}>
                The procuring entity will reveal bids shortly. Check back soon.
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    );
  }

  // ── MODE D: Draft ─────────────────────────────────────────────────────────
  if (tenderStatus === 'draft') {
    return (
      <SectionCard
        icon={<Info className="w-5 h-5 text-blue-400" />}
        title={sectionTitle}
        className={className}
      >
        <div className={cn('flex items-start gap-3 rounded-lg border p-4', colorClasses.bg.blueLight, colorClasses.border.blue600)}>
          <Info className={cn('w-5 h-5 mt-0.5', colorClasses.text.blue600)} />
          <p className={cn('text-sm', colorClasses.text.blue600)}>
            This tender is still in draft and not accepting proposals.
          </p>
        </div>
      </SectionCard>
    );
  }

  // ── MODE C: Open bidding / revealed / closed ───────────────────────────────
  const showBidAmounts = isOwner || ['revealed', 'closed'].includes(tenderStatus);

  return (
    <SectionCard
      icon={<Users className="w-5 h-5 text-purple-500" />}
      title={sectionTitle}
      description={`${totalCount} ${sectionTitle.toLowerCase()} received`}
      className={className}
    >
      <AnimatePresence mode="wait">
        {tenderType === 'freelance' ? (
          <motion.div
            key="freelance-proposals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {applications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Users className={cn('w-12 h-12 opacity-20', colorClasses.text.muted)} />
                <p className={cn('font-semibold', colorClasses.text.primary)}>No proposals yet</p>
                <p className={cn('text-sm', colorClasses.text.muted)}>Be the first to apply for this tender.</p>
              </div>
            ) : (
              applications.map((app) => (
                <ApplicationCard
                  key={(app as any)._id}
                  application={app}
                  isOwner={isOwner}
                  isMyApplication={(app as any)._id === myApplicationId}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="professional-bids"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {bids.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Users className={cn('w-12 h-12 opacity-20', colorClasses.text.muted)} />
                <p className={cn('font-semibold', colorClasses.text.primary)}>No bids yet</p>
                <p className={cn('text-sm', colorClasses.text.muted)}>
                  {workflowType === 'closed' ? 'Bids will be revealed after the deadline.' : 'Submit your bid to participate.'}
                </p>
              </div>
            ) : (
              bids.map((bid) => (
                <BidCard
                  key={(bid as any)._id}
                  bid={bid}
                  isOwner={isOwner}
                  showAmount={showBidAmounts}
                  isMyBid={false}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
  );
};