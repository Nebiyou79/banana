// components/proposals/shared/ProposalDetailView.tsx
// Shared owner detail view — used by both /company and /organization pages.
// Pages Router compatible.
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  useProposalDetail,
  useUpdateProposalStatus,
  useToggleShortlist,
} from '@/hooks/useProposal';

import { ProposalDetailPanel } from '@/components/proposals/owner/ProposalDetailPanel';
import { StatusUpdateModal } from '@/components/proposals/owner/StatusUpdateModal';
import { OwnerNotesPanel } from '@/components/proposals/owner/OwnerNotesPanel';
import { ProposalStatusBadge } from '@/components/proposals/shared/ProposalStatusBadge';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { ProposalStatus } from '@/services/proposalService';
import type { RolePrefix } from './TenderProposalsListView';

interface Props {
  proposalId: string;
  rolePrefix: RolePrefix;
}

// ─── Audit timeline ───────────────────────────────────────────────────────────
function AuditTimeline({ log }: { log: any[] }) {
  if (!log?.length) return null;
  return (
    <div className="space-y-3">
      {[...log].reverse().slice(0, 5).map((entry, i) => (
        <div key={i} className="flex gap-3">
          <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colorClasses.bg.goldenMustard}`} />
          <div>
            <p className={`text-xs font-semibold capitalize ${colorClasses.text.primary}`}>
              {String(entry.action ?? '').replace(/_/g, ' ')}
            </p>
            {entry.performedAt && (
              <p className={`text-xs ${colorClasses.text.muted}`}>
                {new Date(entry.performedAt).toLocaleString()}
              </p>
            )}
            {entry.note && (
              <p className={`mt-0.5 text-xs italic ${colorClasses.text.muted}`}>"{entry.note}"</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Action buttons per status ───────────────────────────────────────────────
interface ActionBtn {
  label: string;
  targetStatus: ProposalStatus;
  className: string;
}

const STATUS_ACTIONS: Partial<Record<ProposalStatus, ActionBtn[]>> = {
  submitted: [
    { label: 'Mark Under Review', targetStatus: 'under_review', className: `${colorClasses.bg.blue600} hover:opacity-90 text-white` },
    { label: 'Reject', targetStatus: 'rejected', className: `border ${colorClasses.border.red} ${colorClasses.text.red} hover:opacity-90` },
  ],
  under_review: [
    { label: 'Shortlist', targetStatus: 'shortlisted', className: `${colorClasses.bg.darkNavy} hover:opacity-90 text-white` },
    { label: 'Reject', targetStatus: 'rejected', className: `border ${colorClasses.border.red} ${colorClasses.text.red} hover:opacity-90` },
  ],
  shortlisted: [
    { label: 'Schedule Interview', targetStatus: 'interview_scheduled', className: 'bg-purple-600 hover:opacity-90 text-white' },
    { label: 'Accept & Award', targetStatus: 'awarded', className: `${colorClasses.bg.emerald600} hover:opacity-90 text-white` },
    { label: 'Reject', targetStatus: 'rejected', className: `border ${colorClasses.border.red} ${colorClasses.text.red} hover:opacity-90` },
  ],
  interview_scheduled: [
    { label: 'Accept & Award', targetStatus: 'awarded', className: `${colorClasses.bg.emerald600} hover:opacity-90 text-white` },
    { label: 'Reject', targetStatus: 'rejected', className: `border ${colorClasses.border.red} ${colorClasses.text.red} hover:opacity-90` },
  ],
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${colorClasses.bg.gray100} ${className}`} />;
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function ProposalDetailView({ proposalId, rolePrefix }: Props) {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data: proposal, isLoading } = useProposalDetail(proposalId);
  const updateStatusMutation = useUpdateProposalStatus();
  const toggleShortlistMutation = useToggleShortlist();
  const [modalStatus, setModalStatus] = useState<ProposalStatus | null>(null);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`min-h-screen ${colorClasses.bg.primary} px-4 py-8`}>
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="hidden space-y-4 lg:block">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${colorClasses.bg.primary}`}>
        <div className="text-center">
          <p className="mb-4 text-5xl">🔍</p>
          <p className={`text-lg font-semibold ${colorClasses.text.primary}`}>Proposal not found</p>
        </div>
      </div>
    );
  }

  // Safe extraction — tender may be a string ID or a populated object
  const tender = typeof proposal.tender === 'string' ? null : proposal.tender;
  const tenderId = tender?._id ?? (proposal.tender as unknown as string);

  const handleStatusAction = (targetStatus: ProposalStatus) => setModalStatus(targetStatus);

  const handleModalConfirm = (data: {
    status: ProposalStatus;
    ownerNotes?: string;
    interviewDate?: string;
  }) => {
    updateStatusMutation.mutate(
      { proposalId, data },
      { onSuccess: () => setModalStatus(null) }
    );
  };

  const handleSaveNotes = (notes: string, _rating: number | null) => {
    updateStatusMutation.mutate({
      proposalId,
      data: { status: proposal.status, ownerNotes: notes },
    });
  };

  const actions = STATUS_ACTIONS[proposal.status] ?? [];
  const freelancerName = (proposal.freelancer as any)?.name ?? 'Proposal';

  return (
    <div className={`min-h-screen ${colorClasses.bg.primary}`}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/${rolePrefix}/tenders`} className={`${colorClasses.text.muted} hover:underline underline-offset-2`}>
            Tenders
          </Link>
          <span className={colorClasses.text.muted}>/</span>
          {tenderId && (
            <>
              <Link
                href={`/${rolePrefix}/tenders/${tenderId}/proposals`}
                className={`max-w-[180px] truncate ${colorClasses.text.muted} hover:underline underline-offset-2`}
              >
                {tender?.title ?? 'Proposals'}
              </Link>
              <span className={colorClasses.text.muted}>/</span>
            </>
          )}
          <span className={`font-medium ${colorClasses.text.primary}`}>{freelancerName}</span>
        </nav>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">

          {/* LEFT */}
          <div className="min-w-0 space-y-8">
            <ProposalDetailPanel
              proposal={proposal}
              onStatusUpdate={handleStatusAction}
              onShortlist={() => toggleShortlistMutation.mutate(proposalId)}
              isUpdatingStatus={updateStatusMutation.isPending}
            />

            <OwnerNotesPanel
              proposalId={proposalId}
              initialNotes={proposal.ownerNotes}
              initialRating={proposal.ownerRating}
              onSave={handleSaveNotes}
              isSaving={updateStatusMutation.isPending}
            />
          </div>

          {/* RIGHT sidebar */}
          <aside className="space-y-4">

            {/* Status + actions */}
            <div className={`rounded-2xl border p-5 ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}>
              <p className={`mb-3 text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}>
                Current Status
              </p>
              <ProposalStatusBadge status={proposal.status} size="md" />

              {actions.length > 0 && (
                <div className="mt-4 space-y-2">
                  {actions.map(({ label, targetStatus, className }) => (
                    <button
                      key={targetStatus}
                      onClick={() => handleStatusAction(targetStatus)}
                      disabled={updateStatusMutation.isPending}
                      className={`flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${className}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audit history */}
            {(proposal.auditLog as any[])?.length > 0 && (
              <div className={`rounded-2xl border p-5 ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}>
                <p className={`mb-4 text-xs font-semibold uppercase tracking-wide ${colorClasses.text.muted}`}>
                  History
                </p>
                <AuditTimeline log={proposal.auditLog as any[]} />
              </div>
            )}

            {/* Back link */}
            {tenderId && (
              <Link
                href={`/${rolePrefix}/tenders/${tenderId}/proposals`}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${colorClasses.border.secondary} ${colorClasses.text.muted} hover:${colorClasses.text.primary}`}
              >
                ← All Proposals
              </Link>
            )}
          </aside>
        </div>
      </div>

      {/* Status modal */}
      {modalStatus && (
        <StatusUpdateModal
          isOpen={true}
          onClose={() => setModalStatus(null)}
          proposal={{ ...proposal, status: modalStatus }}
          onConfirm={handleModalConfirm}
          isLoading={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}