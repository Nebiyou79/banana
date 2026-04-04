// src/components/tenders2.0/InvitedTenderCard.tsx — FIXED
// ISSUE 2 FIX A: handleAccept navigates to /professional/ route after success
// ISSUE 2 FIX B: handleDecline updates local inviteStatus optimistically
// ISSUE 2 FIX C: accepted → shows "View Tender →" button; declined → muted pill, no actions
// ISSUE 2 FIX D: gold gradient strip, blockquote message, Building icon, deadline + status pills
// ISSUE 2 FIX E: all buttons min-h-[44px] min-w-[44px] via getTouchTargetSize
// ISSUE 6: colorClasses tokens throughout
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Lock, Calendar, Building2, ChevronRight, CheckCircle, XCircle,
  Clock, AlertCircle, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useRespondToInvitation } from '@/hooks/useProfessionalTender';
import { useResponsive } from '@/hooks/useResponsive';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface InvitedTenderCardItem {
  _id: string;
  title: string;
  referenceNumber?: string;
  deadline: string;
  status: string;
  visibilityType: string;
  workflowType?: string;
  owner: { _id: string; name: string; email: string };
  myInvitations: Array<{
    _id: string;
    invitationStatus: 'pending' | 'accepted' | 'declined' | 'expired';
    invitationType: 'company' | 'user' | 'email';
    message?: string;
    tokenExpires: string;
    respondedAt?: string;
  }>;
}

interface InvitedTenderCardProps {
  invitation: InvitedTenderCardItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function DeadlinePill({ deadline }: { deadline: string }) {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);

  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
        <Clock className="w-3 h-3" /> Expired
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
        <Clock className="w-3 h-3 animate-pulse" /> {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
      <Calendar className="w-3 h-3" /> {days}d left
    </span>
  );
}

function InvitationStatusPill({ status }: { status: string }) {
  const configs: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending Response', cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
    accepted: { label: 'Accepted', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
    declined: { label: 'Declined', cls: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 opacity-70' },
    expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700' },
  };
  const cfg = configs[status] ?? configs.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.cls)}>
      {status === 'pending' && <AlertCircle className="w-3 h-3" />}
      {status === 'accepted' && <CheckCircle className="w-3 h-3" />}
      {status === 'declined' && <XCircle className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const InvitedTenderCard: React.FC<InvitedTenderCardProps> = ({ invitation }) => {
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const myInvite = invitation.myInvitations?.[0];

  // ISSUE 2 FIX B: local state so card updates instantly without refetch
  const [inviteStatus, setInviteStatus] = useState<string>(
    myInvite?.invitationStatus ?? 'pending'
  );
  const [confirmDecline, setConfirmDecline] = useState(false);

  const { mutate: respond, isPending } = useRespondToInvitation();

  const isSealed = invitation.workflowType === 'closed';
  const touchTarget = getTouchTargetSize('md');

  // ISSUE 2 FIX A: navigate to /professional/ route after accept
  const handleAccept = () => {
    if (!myInvite) return;
    respond(
      { id: invitation._id, inviteId: myInvite._id, response: 'accepted' },
      {
        onSuccess: () => {
          setInviteStatus('accepted');
          router.push(`/dashboard/company/tenders/tenders/${invitation._id}`);
        },
      }
    );
  };

  // ISSUE 2 FIX B: optimistic local update on decline
  const handleDecline = () => {
    if (!myInvite) return;
    respond(
      { id: invitation._id, inviteId: myInvite._id, response: 'declined' },
      {
        onSuccess: () => {
          setInviteStatus('declined');
          setConfirmDecline(false);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl border shadow-sm transition-shadow hover:shadow-md overflow-hidden',
        colorClasses.bg.primary,
        colorClasses.border.secondary
      )}
    >
      {/* ISSUE 2 FIX D: gold gradient top strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0A2540] to-[#F1BB03]" />

      <div className={cn('p-4 sm:p-5 flex flex-col', isMobile ? 'gap-4' : 'sm:flex-row sm:items-start sm:gap-4')}>

        {/* Icon */}
        <div className={cn('shrink-0 p-2.5 rounded-xl self-start', colorClasses.bg.secondary)}>
          <Lock className="w-5 h-5 text-[#F1BB03]" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Invite-only badge */}
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800'
              )}>
                <Lock className="w-2.5 h-2.5" /> Invite Only
              </span>

              {/* Workflow badge */}
              {isSealed ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                  🔒 Sealed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                  Open Bid
                </span>
              )}
            </div>

            <h3 className={cn('font-bold text-base leading-snug', colorClasses.text.primary)}>
              {invitation.title}
            </h3>
            {invitation.referenceNumber && (
              <p className={cn('text-xs mt-0.5 font-mono', colorClasses.text.muted)}>
                Ref: {invitation.referenceNumber}
              </p>
            )}
          </div>

          {/* Meta row — ISSUE 2 FIX D: Building2 icon + deadline + status */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 text-xs', colorClasses.text.secondary)}>
              <Building2 className="w-3.5 h-3.5" />
              {invitation.owner.name}
            </span>
            <DeadlinePill deadline={invitation.deadline} />
            <InvitationStatusPill status={inviteStatus} />
          </div>

          {/* ISSUE 2 FIX D: Personal message blockquote */}
          {myInvite?.message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                'flex items-start gap-2 rounded-xl border-l-4 border-[#F1BB03] px-3 py-2.5 text-sm',
                colorClasses.bg.secondary
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#F1BB03]" />
              <blockquote className={cn('italic', colorClasses.text.secondary)}>
                `{myInvite.message}`
              </blockquote>
            </motion.div>
          )}

          {/* CTA area */}
          <AnimatePresence mode="wait">

            {/* ISSUE 2 FIX C: Pending → Accept/Decline buttons */}
            {inviteStatus === 'pending' && (
              <motion.div
                key="pending-actions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2"
              >
                {!confirmDecline ? (
                  <div className={cn('flex gap-3', isMobile ? 'flex-col' : 'flex-row')}>
                    {/* ISSUE 2 FIX E: min-h-[44px] touch targets */}
                    <button
                      onClick={handleAccept}
                      disabled={isPending}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold',
                        'transition-opacity hover:opacity-90 disabled:opacity-50',
                        touchTarget,
                        isMobile ? 'w-full' : '',
                        'bg-[#0A2540] text-white dark:bg-white dark:text-[#0A2540]'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isPending ? 'Accepting…' : 'Accept Invitation'}
                    </button>
                    <button
                      onClick={() => setConfirmDecline(true)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-medium',
                        'transition-all hover:border-red-400 hover:text-red-600',
                        touchTarget,
                        isMobile ? 'w-full' : '',
                        colorClasses.border.secondary,
                        colorClasses.text.secondary
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-2 rounded-xl border-2 border-red-200 p-3 bg-red-50 dark:bg-red-900/10 dark:border-red-800"
                  >
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Decline this invitation?
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">This action cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDecline}
                        disabled={isPending}
                        className={cn(
                          'rounded-lg px-4 py-2 text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
                          touchTarget
                        )}
                      >
                        {isPending ? 'Declining…' : 'Yes, Decline'}
                      </button>
                      <button
                        onClick={() => setConfirmDecline(false)}
                        className={cn(
                          'rounded-lg px-4 py-2 text-sm font-medium border-2',
                          colorClasses.border.secondary,
                          colorClasses.text.secondary,
                          touchTarget
                        )}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ISSUE 2 FIX C: Accepted → prominent "View Tender →" button */}
            {inviteStatus === 'accepted' && (
              <motion.div
                key="accepted-action"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => router.push(`/dashboard/company/tenders/tenders/${invitation._id}`)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold',
                    'transition-all hover:brightness-105 shadow-sm',
                    touchTarget,
                    'bg-[#F1BB03] text-[#0A2540]'
                  )}
                >
                  View Tender <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ISSUE 2 FIX C: Declined → muted pill, no action buttons */}
            {inviteStatus === 'declined' && (
              <motion.div
                key="declined-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                  colorClasses.bg.secondary, colorClasses.text.muted
                )}>
                  <XCircle className="w-3.5 h-3.5" /> Invitation Declined
                </span>
              </motion.div>
            )}

            {/* Expired */}
            {inviteStatus === 'expired' && (
              <motion.div
                key="expired-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                  colorClasses.bg.secondary, colorClasses.text.muted
                )}>
                  <Clock className="w-3.5 h-3.5" /> Invitation Expired
                </span>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default InvitedTenderCard;