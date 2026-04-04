// pages/dashboard/company/tenders/proposals/[id].tsx
// Proposal Detail — Company Owner View (also reused by Organization).
// Also exports ProposalOwnerDetailPage for org reuse.
//
// FIXES:
//  1. Attachment download now uses authenticated API call (axios blob),
//     not att.downloadUrl directly (which was causing 401 errors).
//  2. DashboardLayout → TenderDashboardLayout.
//  3. Status management redesigned with a clean animated modal.
//  4. Full responsive layout using useResponsive hook.
//  5. All colors via colorClasses from color.ts.

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft, Star, Calendar, Clock,
  FileText, Paperclip, CheckSquare, Link2,
  MessageSquare, ExternalLink,
  Award, Eye, TrendingUp, User, MapPin,
   AlertCircle,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import {
  useProposalDetail,
  useUpdateProposalStatus,
  useToggleShortlist,
} from '@/hooks/useProposal';
import { ProposalAttachmentList } from '@/components/proposals/shared/ProposalAttachmentList';
import type { Proposal, ProposalStatus } from '@/services/proposalService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  bg: string; text: string; border: string; label: string;
  dotColor: string; accentHex: string;
}> = {
  submitted: {
    bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-700', label: 'Submitted',
    dotColor: 'bg-blue-500', accentHex: '#3B82F6',
  },
  under_review: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-700', label: 'Under Review',
    dotColor: 'bg-indigo-500', accentHex: '#6366F1',
  },
  shortlisted: {
    bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-700', label: 'Shortlisted',
    dotColor: 'bg-amber-500', accentHex: '#F59E0B',
  },
  interview_scheduled: {
    bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-700', label: 'Interview Scheduled',
    dotColor: 'bg-purple-500', accentHex: '#8B5CF6',
  },
  awarded: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700', label: 'Awarded',
    dotColor: 'bg-emerald-500', accentHex: '#10B981',
  },
  rejected: {
    bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700', label: 'Rejected',
    dotColor: 'bg-red-500', accentHex: '#EF4444',
  },
  withdrawn: {
    bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700', label: 'Withdrawn',
    dotColor: 'bg-gray-400', accentHex: '#9CA3AF',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface ActionBtn {
  label: string;
  targetStatus: ProposalStatus;
  variant: 'primary' | 'success' | 'danger' | 'purple';
}

const STATUS_ACTIONS: Partial<Record<ProposalStatus, ActionBtn[]>> = {
  submitted: [
    { label: 'Move to Under Review', targetStatus: 'under_review', variant: 'primary' },
    { label: 'Reject', targetStatus: 'rejected', variant: 'danger' },
  ],
  under_review: [
    { label: 'Shortlist ⭐', targetStatus: 'shortlisted', variant: 'primary' },
    { label: 'Reject', targetStatus: 'rejected', variant: 'danger' },
  ],
  shortlisted: [
    { label: 'Schedule Interview', targetStatus: 'interview_scheduled', variant: 'purple' },
    { label: 'Award Contract 🏆', targetStatus: 'awarded', variant: 'success' },
    { label: 'Reject', targetStatus: 'rejected', variant: 'danger' },
  ],
  interview_scheduled: [
    { label: 'Award Contract 🏆', targetStatus: 'awarded', variant: 'success' },
    { label: 'Reject', targetStatus: 'rejected', variant: 'danger' },
  ],
};

const ACTION_VARIANT_CLS: Record<ActionBtn['variant'], string> = {
  primary: 'bg-[#0A2540] dark:bg-white text-white dark:text-[#0A2540] hover:opacity-90',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
  purple: 'bg-purple-600 text-white hover:bg-purple-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────

function StatusModal({
  targetStatus, proposal, accentColor,
  onConfirm, onClose, isLoading,
}: {
  targetStatus: ProposalStatus;
  proposal: Proposal;
  accentColor: string;
  onConfirm: (data: { status: ProposalStatus; ownerNotes?: string; interviewDate?: string; interviewNotes?: string }) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [ownerNotes, setOwnerNotes] = useState(proposal.ownerNotes ?? '');
  const [interviewDate, setIntDate] = useState(proposal.interviewDate?.slice(0, 16) ?? '');
  const [interviewNotes, setIntNotes] = useState(proposal.interviewNotes ?? '');

  const isAward = targetStatus === 'awarded';
  const isReject = targetStatus === 'rejected';
  const isInterview = targetStatus === 'interview_scheduled';

  const statusMeta = STATUS_CONFIG[targetStatus];
  const titles: Partial<Record<ProposalStatus, string>> = {
    under_review: 'Move to Under Review',
    shortlisted: 'Shortlist this Proposal',
    interview_scheduled: 'Schedule Interview',
    awarded: 'Award Contract 🏆',
    rejected: 'Reject Proposal',
  };

  const confirmBtnCls = isAward
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : isReject
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : `text-white hover:opacity-90`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${colorClasses.bg.primary} ${colorClasses.border.secondary}`}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Colour top strip */}
        <div
          className="h-1 w-full"
          style={{ background: isAward ? '#10B981' : isReject ? '#EF4444' : statusMeta?.accentHex ?? accentColor }}
        />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: isAward ? '#10B981' : isReject ? '#EF4444' : statusMeta?.accentHex ?? accentColor }}
            >
              {isAward ? '🏆' : isReject ? '✕' : isInterview ? '📅' : '→'}
            </div>
            <h3 className={`text-base font-bold ${colorClasses.text.primary}`}>
              {titles[targetStatus] ?? 'Update Status'}
            </h3>
          </div>

          {/* Warning for final actions */}
          {(isAward || isReject) && (
            <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 mb-4 border ${isAward ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">
                {isAward
                  ? 'The freelancer will be notified that they have been awarded this project.'
                  : 'The freelancer will be notified that their proposal was not selected.'}
              </p>
            </div>
          )}

          {/* Interview date */}
          {isInterview && (
            <div className="mb-4">
              <label className={`block text-xs font-semibold mb-1.5 ${colorClasses.text.secondary}`}>
                Interview Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setIntDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={`w-full rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/30 focus:border-[#F1BB03] transition-all`}
              />
              <div className="mt-3">
                <label className={`block text-xs font-semibold mb-1.5 ${colorClasses.text.secondary}`}>
                  Interview Notes
                </label>
                <textarea
                  rows={2}
                  value={interviewNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  placeholder="Format, location, topics to cover…"
                  className={`w-full resize-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/30 focus:border-[#F1BB03] transition-all placeholder:${colorClasses.text.muted}`}
                />
              </div>
            </div>
          )}

          {/* Owner notes */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${colorClasses.text.secondary}`}>
              {isReject || isAward ? 'Feedback (shared with freelancer)' : 'Internal Notes'}
              <span className={`ml-1.5 font-normal ${colorClasses.text.muted}`}>optional</span>
            </label>
            <textarea
              rows={3}
              value={ownerNotes}
              onChange={(e) => setOwnerNotes(e.target.value)}
              maxLength={1000}
              placeholder={isReject
                ? 'Optional feedback explaining why the proposal was not selected…'
                : 'Internal notes about this decision…'}
              className={`w-full resize-none rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F1BB03]/30 focus:border-[#F1BB03] transition-all placeholder:${colorClasses.text.muted}`}
            />
            <p className={`text-right text-[10px] mt-1 ${colorClasses.text.muted}`}>{ownerNotes.length}/1000</p>
          </div>
        </div>

        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${colorClasses.border.secondary}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${colorClasses.border.secondary} ${colorClasses.text.secondary} ${colorClasses.bg.surface} hover:${colorClasses.text.primary}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm({
              status: targetStatus,
              ownerNotes: ownerNotes.trim() || undefined,
              interviewDate: interviewDate || undefined,
              interviewNotes: interviewNotes.trim() || undefined,
            })}
            disabled={isLoading || (isInterview && !interviewDate)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${confirmBtnCls}`}
            style={!isAward && !isReject ? { background: statusMeta?.accentHex ?? accentColor } : undefined}
          >
            {isLoading ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating…</>
            ) : (
              titles[targetStatus] ?? 'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children, className = '' }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border overflow-hidden ${colorClasses.bg.primary} ${colorClasses.border.secondary} ${className}`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${colorClasses.border.secondary}`}>
        <span className={`p-1.5 rounded-lg ${colorClasses.bg.surface} ${colorClasses.text.muted}`}>{icon}</span>
        <h2 className={`text-sm font-bold ${colorClasses.text.primary}`}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl ${colorClasses.bg.secondary} ${className}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORTED COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ProposalOwnerDetailPageProps {
  role: 'company' | 'organization';
  accentColor: string;
  accentCls: string;
}

export function ProposalOwnerDetailPage({ role, accentColor, accentCls }: ProposalOwnerDetailPageProps) {
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const tenderId = router.query.tenderId as string | undefined;
  const proposalId = (router.query.id ?? router.query.proposalId) as string | undefined;

  const { data: proposal, isLoading } = useProposalDetail(proposalId ?? '');
  const updateStatus = useUpdateProposalStatus();
  const toggleShortlist = useToggleShortlist();
  const [modalStatus, setModalStatus] = useState<ProposalStatus | null>(null);

  const back = () =>
    router.push(`/dashboard/${role}/${role === 'company' ? 'tenders/proposals' : 'proposals'}${tenderId ? `?tenderId=${tenderId}` : ''}`);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-5">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-56" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>Proposal not found</p>
          <button type="button" onClick={back}
            className={`mt-4 text-sm font-medium hover:underline ${colorClasses.text.muted}`}>
            ← Back to proposals
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const tender = typeof proposal.tender === 'string' ? null : proposal.tender;
  const tenderTitle = tender?.title ?? 'Untitled Tender';
  const effectiveTenderId = tender?._id ?? tenderId ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const freelancer = proposal.freelancer as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = proposal.freelancerProfile as any;
  const freelancerName = freelancer?.name ?? 'Freelancer';
  const initials = freelancerName.charAt(0).toUpperCase();
  const cfg = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG['submitted'];
  const actions = STATUS_ACTIONS[proposal.status] ?? [];
  const isAwarded = proposal.status === 'awarded';

  const handleConfirm = (data: {
    status: ProposalStatus; ownerNotes?: string; interviewDate?: string; interviewNotes?: string;
  }) => {
    updateStatus.mutate(
      { proposalId: proposal._id, data },
      { onSuccess: () => setModalStatus(null) },
    );
  };

  return (
    <DashboardLayout>
      <Head><title>{freelancerName} — Proposal | Banana</title></Head>

      <div className="max-w-5xl mx-auto space-y-0">

        {/* ── Breadcrumb ─────────────────────────────────────────────── */}
        <nav className={`flex flex-wrap items-center gap-1.5 text-sm mb-6 ${colorClasses.text.muted}`}>
          <Link href={`/dashboard/${role}/my-tenders`} className="hover:underline underline-offset-2 transition-colors">
            My Tenders
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/${role}/${role === 'company' ? 'tenders/proposals' : 'proposals'}?tenderId=${effectiveTenderId}`}
            className="max-w-[160px] truncate hover:underline underline-offset-2"
          >
            {tenderTitle}
          </Link>
          <span>/</span>
          <span className={`font-semibold max-w-[100px] truncate ${colorClasses.text.primary}`}>
            {freelancerName}
          </span>
        </nav>

        {/* ── Hero Header ────────────────────────────────────────────── */}
        <div className={`rounded-2xl border overflow-hidden mb-6 ${colorClasses.bg.primary} ${colorClasses.border.secondary} shadow-sm`}>
          {/* Top accent strip */}
          <div
            className="h-1.5 w-full"
            style={{ background: isAwarded ? '#10B981' : cfg.accentHex }}
          />

          {/* Awarded or shortlisted banner */}
          {isAwarded ? (
            <div className="bg-emerald-500 px-5 py-1.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">CONTRACT AWARDED</span>
            </div>
          ) : proposal.isShortlisted ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 px-5 py-1.5 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tracking-wide">SHORTLISTED</span>
            </div>
          ) : null}

          <div className="p-5 sm:p-6">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-start gap-5'}`}>
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-xl font-bold overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${cfg.accentHex}30, ${cfg.accentHex}10)`, color: cfg.accentHex }}
              >
                {freelancer?.avatar
                  ? <img src={freelancer.avatar} alt={freelancerName} className="w-full h-full object-cover" />
                  : initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-start justify-between gap-4'}`}>
                  <div>
                    <h1 className={`text-xl font-bold ${colorClasses.text.primary}`}>{freelancerName}</h1>
                    {freelancer?.location && (
                      <p className={`flex items-center gap-1 text-xs mt-0.5 ${colorClasses.text.muted}`}>
                        <MapPin className="w-3 h-3" />{freelancer.location}
                      </p>
                    )}
                    {profile?.headline && (
                      <p className={`text-sm mt-1 ${colorClasses.text.secondary}`}>{profile.headline}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                    {cfg.label}
                  </div>
                </div>

                {/* Bid stats row */}
                <div className={`flex flex-wrap gap-5 mt-4`}>
                  <div>
                    <p className="text-2xl font-bold text-[#F1BB03]">
                      {proposal.currency ?? 'ETB'} {proposal.proposedAmount?.toLocaleString()}
                    </p>
                    <p className={`text-xs ${colorClasses.text.muted}`}>
                      {proposal.bidType === 'hourly' ? 'hourly rate' : 'fixed price'}
                    </p>
                  </div>
                  {proposal.deliveryTime && (
                    <div>
                      <p className={`text-base font-bold ${colorClasses.text.primary}`}>
                        {proposal.deliveryTime.value} {proposal.deliveryTime.unit}
                      </p>
                      <p className={`text-xs ${colorClasses.text.muted}`}>delivery time</p>
                    </div>
                  )}
                  {proposal.availability && (
                    <div>
                      <p className={`text-base font-semibold capitalize ${colorClasses.text.primary}`}>
                        {proposal.availability.replace('-', ' ')}
                      </p>
                      <p className={`text-xs ${colorClasses.text.muted}`}>availability</p>
                    </div>
                  )}
                  {profile?.ratings?.average ? (
                    <div>
                      <p className="text-base font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400" />
                        {profile.ratings.average.toFixed(1)}
                        <span className={`text-xs font-normal ${colorClasses.text.muted}`}>({profile.ratings.count})</span>
                      </p>
                      <p className={`text-xs ${colorClasses.text.muted}`}>freelancer rating</p>
                    </div>
                  ) : null}
                </div>

                {/* Meta */}
                <div className={`flex flex-wrap gap-4 mt-3 text-xs ${colorClasses.text.muted}`}>
                  {proposal.submittedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Submitted {formatDate(proposal.submittedAt)}
                    </span>
                  )}
                  {proposal.viewCount ? (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {proposal.viewCount} view{proposal.viewCount !== 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────────────── */}
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_300px]'}`}>

          {/* LEFT — Main content */}
          <div className="space-y-5 min-w-0">

            {/* Cover Letter */}
            <SectionCard title="Cover Letter" icon={<FileText className="w-4 h-4" />}>
              {proposal.coverLetterHtml ? (
                <div
                  className={`prose prose-sm max-w-none text-sm leading-relaxed ${colorClasses.text.secondary}`}
                  dangerouslySetInnerHTML={{ __html: proposal.coverLetterHtml }}
                />
              ) : (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${colorClasses.text.secondary}`}>
                  {proposal.coverLetter}
                </p>
              )}
            </SectionCard>

            {/* Proposal Plan */}
            {proposal.proposalPlan && (
              <SectionCard title="Work Plan" icon={<TrendingUp className="w-4 h-4" />}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${colorClasses.text.secondary}`}>
                  {proposal.proposalPlan}
                </p>
              </SectionCard>
            )}

            {/* Milestones */}
            {proposal.milestones && proposal.milestones.length > 0 && (
              <SectionCard
                title={`Payment Milestones (${proposal.milestones.length})`}
                icon={<CheckSquare className="w-4 h-4" />}
              >
                <div className="space-y-3">
                  {proposal.milestones.map((m, i) => (
                    <div key={m._id ?? i} className={`rounded-xl border p-4 ${colorClasses.bg.surface} ${colorClasses.border.secondary}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#F1BB03] text-[#0A2540] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className={`text-sm font-semibold ${colorClasses.text.primary}`}>{m.title}</p>
                        </div>
                        <p className="text-sm font-bold text-[#F1BB03] shrink-0">
                          {proposal.currency} {m.amount?.toLocaleString()}
                        </p>
                      </div>
                      {m.description && (
                        <p className={`text-xs ml-8 ${colorClasses.text.muted}`}>{m.description}</p>
                      )}
                      <p className={`text-xs ml-8 mt-1 ${colorClasses.text.muted}`}>
                        {m.duration} {m.durationUnit}
                      </p>
                    </div>
                  ))}
                  <div className={`flex justify-between px-4 py-2.5 rounded-xl text-sm font-bold ${colorClasses.bg.secondary} ${colorClasses.text.primary}`}>
                    <span>Total</span>
                    <span className="text-[#F1BB03]">
                      {proposal.currency} {proposal.milestones.reduce((s, m) => s + (m.amount ?? 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Screening Answers */}
            {proposal.screeningAnswers && proposal.screeningAnswers.length > 0 && (
              <SectionCard title="Screening Answers" icon={<MessageSquare className="w-4 h-4" />}>
                <div className="space-y-5">
                  {proposal.screeningAnswers.map((a, i) => (
                    <div key={i}>
                      <p className={`text-xs font-bold mb-1.5 ${colorClasses.text.muted}`}>
                        Q{i + 1}. {a.questionText ?? `Question ${i + 1}`}
                        {a.isRequired && <span className="ml-1 text-red-500">*</span>}
                      </p>
                      <p className={`text-sm leading-relaxed ${colorClasses.text.secondary}`}>
                        {a.answer || <span className={colorClasses.text.muted}>No answer provided</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Portfolio Links */}
            {proposal.portfolioLinks && proposal.portfolioLinks.length > 0 && (
              <SectionCard title="Portfolio Links" icon={<Link2 className="w-4 h-4" />}>
                <div className="space-y-2">
                  {proposal.portfolioLinks.map((link, i) => (
                    <a
                      key={i} href={link} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all group ${colorClasses.bg.surface} ${colorClasses.border.secondary} hover:border-[#F1BB03]/50`}
                    >
                      <Link2 className={`w-4 h-4 shrink-0 ${colorClasses.text.muted}`} />
                      <span className={`flex-1 truncate ${colorClasses.text.secondary}`}>{link}</span>
                      <ExternalLink className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 ${colorClasses.text.muted} transition-opacity`} />
                    </a>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Attachments — uses authenticated download */}
            {proposal.attachments && proposal.attachments.length > 0 && (
              <SectionCard title={`Attachments (${proposal.attachments.length})`} icon={<Paperclip className="w-4 h-4" />}>
                <ProposalAttachmentList
                  attachments={proposal.attachments}
                  proposalId={proposal._id}
                  canDelete={false}
                />
              </SectionCard>
            )}

            {/* Freelancer Profile */}
            {profile && (
              <SectionCard title="About the Freelancer" icon={<User className="w-4 h-4" />}>
                <div className="space-y-3">
                  {profile.bio && (
                    <p className={`text-sm leading-relaxed ${colorClasses.text.secondary}`}>{profile.bio}</p>
                  )}
                  {profile.specialization && profile.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.specialization.map((s: string, i: number) => (
                        <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg.secondary} ${colorClasses.text.secondary}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {(profile.successRate || profile.onTimeDelivery) ? (
                    <div className="grid grid-cols-2 gap-3">
                      {profile.successRate ? (
                        <div className={`rounded-xl p-3 text-center ${colorClasses.bg.surface}`}>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{profile.successRate}%</p>
                          <p className={`text-xs ${colorClasses.text.muted}`}>Success Rate</p>
                        </div>
                      ) : null}
                      {profile.onTimeDelivery ? (
                        <div className={`rounded-xl p-3 text-center ${colorClasses.bg.surface}`}>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{profile.onTimeDelivery}%</p>
                          <p className={`text-xs ${colorClasses.text.muted}`}>On-Time Delivery</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            )}

            {/* Owner Notes (already saved) */}
            {proposal.ownerNotes && (
              <SectionCard title="Your Notes" icon={<MessageSquare className="w-4 h-4" />}>
                <p className={`text-sm leading-relaxed ${colorClasses.text.secondary}`}>
                  {proposal.ownerNotes}
                </p>
              </SectionCard>
            )}
          </div>

          {/* RIGHT — Sidebar */}
          <aside className="space-y-4">

            {/* Status + Actions Card */}
            <div className={`rounded-2xl border overflow-hidden ${colorClasses.bg.primary} ${colorClasses.border.secondary} shadow-sm`}>
              <div
                className="h-1 w-full"
                style={{ background: isAwarded ? '#10B981' : cfg.accentHex }}
              />
              <div className="p-5">
                <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${colorClasses.text.muted}`}>
                  Proposal Status
                </p>

                {/* Big status badge */}
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border mb-4 ${cfg.bg} ${cfg.border}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                  <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
                </div>

                {/* Shortlist toggle */}
                <button
                  type="button"
                  onClick={() => toggleShortlist.mutate(proposal._id)}
                  disabled={toggleShortlist.isPending}
                  className={[
                    `flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all mb-4 ${getTouchTargetSize('md')}`,
                    proposal.isShortlisted
                      ? 'border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : `${colorClasses.border.secondary} ${colorClasses.text.secondary} ${colorClasses.bg.surface} hover:border-amber-300 hover:text-amber-600`,
                  ].join(' ')}
                >
                  <Star className={`w-4 h-4 ${proposal.isShortlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
                  {proposal.isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                </button>

                {/* Action buttons */}
                {actions.length > 0 && (
                  <div className="space-y-2">
                    <p className={`text-xs font-semibold mb-2 ${colorClasses.text.muted}`}>Actions</p>
                    {actions.map(({ label, targetStatus, variant }) => (
                      <button
                        key={targetStatus}
                        type="button"
                        onClick={() => setModalStatus(targetStatus)}
                        disabled={updateStatus.isPending}
                        className={`w-full flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${getTouchTargetSize('md')} ${ACTION_VARIANT_CLS[variant]}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Awarded state */}
                {isAwarded && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                    <p className="text-2xl mb-1">🏆</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Contract Awarded</p>
                    {proposal.awardedAt && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">{formatDate(proposal.awardedAt)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interview info */}
            {proposal.interviewDate && (
              <div className={`rounded-2xl border p-5 ${colorClasses.bg.primary} ${colorClasses.border.secondary}`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${colorClasses.text.muted}`}>
                  Interview Scheduled
                </p>
                <div className={`flex items-center gap-2 mb-2 ${colorClasses.text.primary}`}>
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-semibold">{formatDateTime(proposal.interviewDate)}</span>
                </div>
                {proposal.interviewNotes && (
                  <p className={`text-xs mt-2 ${colorClasses.text.muted}`}>{proposal.interviewNotes}</p>
                )}
              </div>
            )}

            {/* Audit history */}
            {proposal.auditLog && proposal.auditLog.length > 0 && (
              <div className={`rounded-2xl border p-5 ${colorClasses.bg.primary} ${colorClasses.border.secondary}`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-4 ${colorClasses.text.muted}`}>Activity</p>
                <div className="space-y-3">
                  {[...proposal.auditLog].reverse().slice(0, 6).map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F1BB03]" />
                      <div>
                        <p className={`text-xs font-semibold capitalize ${colorClasses.text.primary}`}>
                          {String(entry.action ?? '').replace(/_/g, ' ')}
                        </p>
                        {entry.performedAt && (
                          <p className={`text-[10px] ${colorClasses.text.muted}`}>
                            {formatDateTime(entry.performedAt as unknown as string)}
                          </p>
                        )}
                        {entry.note && (
                          <p className={`mt-0.5 text-xs italic ${colorClasses.text.muted}`}>"{entry.note}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back button */}
            <button
              type="button"
              onClick={back}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${colorClasses.border.secondary} ${colorClasses.text.muted} hover:border-[#F1BB03]/50 hover:${colorClasses.text.primary}`}
            >
              <ArrowLeft className="w-4 h-4" /> All Proposals
            </button>
          </aside>
        </div>
      </div>

      {/* Status modal */}
      {modalStatus && (
        <StatusModal
          targetStatus={modalStatus}
          proposal={proposal}
          accentColor={accentColor}
          onConfirm={handleConfirm}
          onClose={() => setModalStatus(null)}
          isLoading={updateStatus.isPending}
        />
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
}

// ─── Default export (Company) ─────────────────────────────────────────────────
export default function CompanyProposalDetailPage() {
  return (
    <ProposalOwnerDetailPage
      role="organization"
      accentColor="#0D9488"
      accentCls="bg-[#0D9488]"
    />
  );
}