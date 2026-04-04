// pages/dashboard/freelancer/proposals/[id].tsx
// Freelancer's own proposal detail view.
// Shows all proposal fields, their status with a clean timeline, and
// authenticated attachment downloads.

import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft, Clock, FileText, Paperclip, CheckSquare,
  Link2, MessageSquare, ExternalLink, Calendar,
  Star, Award, AlertTriangle, Eye, TrendingUp, Zap,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProposalDetail } from '@/hooks/useProposal';
import { ProposalAttachmentList } from '@/components/proposals/shared/ProposalAttachmentList';

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  bg: string; text: string; border: string; label: string;
  icon: string; accentHex: string; dotColor: string;
  message?: string;
}> = {
  draft: {
    bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700', label: 'Draft',
    icon: '✏️', accentHex: '#9CA3AF', dotColor: 'bg-gray-400',
    message: 'This proposal is saved as a draft and has not been submitted yet.',
  },
  submitted: {
    bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-700', label: 'Submitted',
    icon: '📤', accentHex: '#3B82F6', dotColor: 'bg-blue-500',
    message: 'Your proposal has been submitted and is awaiting review by the client.',
  },
  under_review: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-700', label: 'Under Review',
    icon: '🔍', accentHex: '#6366F1', dotColor: 'bg-indigo-500',
    message: 'The client is actively reviewing your proposal. Good sign!',
  },
  shortlisted: {
    bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-700', label: 'Shortlisted',
    icon: '⭐', accentHex: '#F59E0B', dotColor: 'bg-amber-500',
    message: "You've been shortlisted! The client may reach out for an interview.",
  },
  interview_scheduled: {
    bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-700', label: 'Interview Scheduled',
    icon: '📅', accentHex: '#8B5CF6', dotColor: 'bg-purple-500',
    message: 'An interview has been scheduled. Check the details below.',
  },
  awarded: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700', label: 'Awarded 🏆',
    icon: '🏆', accentHex: '#10B981', dotColor: 'bg-emerald-500',
    message: "Congratulations! You've been awarded this project.",
  },
  rejected: {
    bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700', label: 'Not Selected',
    icon: '✕', accentHex: '#EF4444', dotColor: 'bg-red-500',
    message: "This proposal was not selected. Keep applying to other opportunities!",
  },
  withdrawn: {
    bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700', label: 'Withdrawn',
    icon: '↩', accentHex: '#9CA3AF', dotColor: 'bg-gray-400',
    message: 'You have withdrawn this proposal.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE STEPS
// ─────────────────────────────────────────────────────────────────────────────

const LIFECYCLE_STEPS = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'under_review', label: 'Under Review' },
  { status: 'shortlisted', label: 'Shortlisted' },
  { status: 'interview_scheduled', label: 'Interview' },
  { status: 'awarded', label: 'Awarded' },
];

const STEP_ORDER = ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'awarded'];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (['withdrawn', 'draft'].includes(currentStatus)) return null;

  const isRejected = currentStatus === 'rejected';
  const currentIdx = STEP_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0">
      {LIFECYCLE_STEPS.map((step, i) => {
        const isDone = currentIdx > i || currentStatus === step.status;
        const isCurrent = currentStatus === step.status;
        const isFuture = currentIdx < i && !isRejected;
        const isLast = i === LIFECYCLE_STEPS.length - 1;

        return (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                  isCurrent && !isRejected
                    ? 'border-[#F1BB03] bg-[#F1BB03] text-[#0A2540] scale-110 shadow-md'
                    : isDone && !isRejected
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : `${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.muted}`,
                ].join(' ')}
              >
                {isDone && !isRejected && !isCurrent ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] font-semibold text-center leading-tight max-w-[52px] ${isCurrent ? 'text-[#F1BB03]' : isDone && !isRejected ? colorClasses.text.emerald : colorClasses.text.muted}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-5 rounded transition-all`}
                style={{
                  background: isDone && !isRejected
                    ? '#10B981'
                    : 'var(--border-secondary, #E5E5E5)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

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

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border overflow-hidden ${colorClasses.bg.primary} ${colorClasses.border.secondary}`}>
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
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function FreelancerProposalDetailPage() {
  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const proposalId = (router.query.id ?? router.query.proposalId) as string | undefined;
  const { data: proposal, isLoading } = useProposalDetail(proposalId ?? '');

  const back = () => router.push('/dashboard/freelancer/proposals');

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout requiredRole="freelancer">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayout requiredRole="freelancer">
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

  const cfg = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG['submitted'];
  const tender = typeof proposal.tender === 'string' ? null : proposal.tender;
  const tenderTitle = tender?.title ?? 'Tender';
  const isAwarded = proposal.status === 'awarded';
  const isRejected = proposal.status === 'rejected';

  return (
    <DashboardLayout requiredRole="freelancer">
      <Head><title>{tenderTitle} — My Proposal | Banana</title></Head>

      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`}>

        {/* Breadcrumb */}
        <nav className={`flex flex-wrap items-center gap-1.5 text-sm mb-6 ${colorClasses.text.muted}`}>
          <Link href="/dashboard/freelancer/proposals" className="hover:underline underline-offset-2">
            My Proposals
          </Link>
          <span>/</span>
          <span className={`font-semibold max-w-[200px] truncate ${colorClasses.text.primary}`}>
            {tenderTitle}
          </span>
        </nav>

        {/* ── Hero Status Card ─────────────────────────────────────────── */}
        <div className={`rounded-2xl border overflow-hidden mb-6 ${colorClasses.bg.primary} ${colorClasses.border.secondary} shadow-sm`}>
          <div className="h-1.5 w-full" style={{ background: cfg.accentHex }} />

          {/* Awarded banner */}
          {isAwarded && (
            <div className="bg-emerald-500 px-5 py-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">CONGRATULATIONS — CONTRACT AWARDED!</span>
            </div>
          )}

          <div className="p-5 sm:p-6">
            {/* Tender title + bid */}
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start justify-between gap-4'} mb-5`}>
              <div className="flex-1 min-w-0">
                <h1 className={`text-xl font-bold ${colorClasses.text.primary} mb-1`}>{tenderTitle}</h1>
                {tender?.ownerEntityModel && (
                  <p className={`text-xs ${colorClasses.text.muted}`}>{tender.ownerEntityModel}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold text-[#F1BB03]">
                  {proposal.currency ?? 'ETB'} {proposal.proposedAmount?.toLocaleString()}
                </p>
                <p className={`text-xs ${colorClasses.text.muted}`}>
                  {proposal.bidType === 'hourly' ? 'hourly rate' : 'fixed price'}
                </p>
              </div>
            </div>

            {/* Meta row */}
            <div className={`flex flex-wrap gap-4 mb-5 text-xs ${colorClasses.text.muted}`}>
              {proposal.submittedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Submitted {formatDate(proposal.submittedAt)}
                </span>
              )}
              {proposal.deliveryTime && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {proposal.deliveryTime.value} {proposal.deliveryTime.unit} delivery
                </span>
              )}
              {proposal.availability && (
                <span className="flex items-center gap-1 capitalize">
                  <Zap className="w-3 h-3" />
                  {proposal.availability.replace('-', ' ')}
                </span>
              )}
              {proposal.viewCount ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Viewed {proposal.viewCount} time{proposal.viewCount !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            {/* Status timeline */}
            {!['draft', 'withdrawn', 'rejected'].includes(proposal.status) && (
              <div className="mb-5">
                <StatusTimeline currentStatus={proposal.status} />
              </div>
            )}

            {/* Current status pill + message */}
            <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
              <span className="text-xl">{cfg.icon}</span>
              <div>
                <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
                {cfg.message && (
                  <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{cfg.message}</p>
                )}
              </div>
            </div>

            {/* Interview info (if scheduled) */}
            {proposal.interviewDate && (
              <div className={`mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700`}>
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    Interview: {formatDateTime(proposal.interviewDate)}
                  </p>
                  {proposal.interviewNotes && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{proposal.interviewNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Client notes (if any) */}
            {proposal.ownerNotes && !isRejected && (
              <div className={`mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 ${colorClasses.bg.amberLight} border-amber-200 dark:border-amber-700`}>
                <MessageSquare className={`w-4 h-4 ${colorClasses.text.amber700} mt-0.5 shrink-0`} />
                <div>
                  <p className={`text-xs font-bold ${colorClasses.text.amber700} mb-0.5`}>Client Note</p>
                  <p className={`text-sm ${colorClasses.text.amber700}`}>{proposal.ownerNotes}</p>
                </div>
              </div>
            )}

            {/* Rejection feedback */}
            {isRejected && proposal.ownerNotes && (
              <div className="mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-0.5">Feedback</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{proposal.ownerNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="space-y-5">

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
            <SectionCard title={`Milestones (${proposal.milestones.length})`} icon={<CheckSquare className="w-4 h-4" />}>
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
                    </p>
                    <p className={`text-sm leading-relaxed ${colorClasses.text.secondary}`}>
                      {a.answer || <span className={colorClasses.text.muted}>No answer</span>}
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
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all group ${colorClasses.bg.surface} ${colorClasses.border.secondary} hover:border-[#F1BB03]/50`}>
                    <Link2 className={`w-4 h-4 shrink-0 ${colorClasses.text.muted}`} />
                    <span className={`flex-1 truncate ${colorClasses.text.secondary}`}>{link}</span>
                    <ExternalLink className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 ${colorClasses.text.muted}`} />
                  </a>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Attachments — authenticated download */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <SectionCard title={`Attachments (${proposal.attachments.length})`} icon={<Paperclip className="w-4 h-4" />}>
              <ProposalAttachmentList
                attachments={proposal.attachments}
                proposalId={proposal._id}
                canDelete={false}
              />
            </SectionCard>
          )}
        </div>

        {/* Back button */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={back}
            className={`flex items-center gap-2 text-sm font-medium ${colorClasses.text.muted} hover:${colorClasses.text.primary} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Proposals
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}