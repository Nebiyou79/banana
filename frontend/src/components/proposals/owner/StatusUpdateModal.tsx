// components/proposals/owner/StatusUpdateModal.tsx
'use client';
import React, { useEffect, useState } from 'react';
import type { Proposal, ProposalStatus } from '@/services/proposalService';

interface ConfirmData {
  status: ProposalStatus;
  ownerNotes?: string;
  interviewDate?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  onConfirm: (data: ConfirmData) => void;
  isLoading?: boolean;
}

const STATUS_META: Record<
  ProposalStatus,
  { label: string; color: string; btnColor: string; warning?: string }
> = {
  draft:               { label: 'Draft',             color: 'text-slate-600', btnColor: 'bg-slate-600 hover:bg-slate-700' },
  submitted:           { label: 'Submitted',         color: 'text-blue-600',  btnColor: 'bg-blue-600 hover:bg-blue-700' },
  under_review:        { label: 'Under Review',      color: 'text-amber-600', btnColor: 'bg-amber-600 hover:bg-amber-700' },
  shortlisted:         { label: 'Shortlisted',       color: 'text-indigo-600', btnColor: 'bg-indigo-600 hover:bg-indigo-700' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'text-purple-600', btnColor: 'bg-purple-600 hover:bg-purple-700' },
  awarded:             { label: 'Awarded',           color: 'text-emerald-600', btnColor: 'bg-emerald-600 hover:bg-emerald-700', warning: 'This will notify the freelancer they have been awarded the project.' },
  rejected:            { label: 'Rejected',          color: 'text-red-600',  btnColor: 'bg-red-600 hover:bg-red-700', warning: 'This will notify the freelancer that their proposal was not selected.' },
  withdrawn:           { label: 'Withdrawn',         color: 'text-slate-400', btnColor: 'bg-slate-400' },
};

export function StatusUpdateModal({ isOpen, onClose, proposal, onConfirm, isLoading }: Props) {
  const [targetStatus, setTargetStatus] = useState<ProposalStatus | null>(null);
  const [ownerNotes, setOwnerNotes]     = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  // Derive likely target status from current
  useEffect(() => {
    const map: Partial<Record<ProposalStatus, ProposalStatus>> = {
      submitted:           'under_review',
      under_review:        'shortlisted',
      shortlisted:         'interview_scheduled',
      interview_scheduled: 'awarded',
    };
    setTargetStatus(map[proposal.status] ?? null);
    setOwnerNotes('');
    setInterviewDate('');
  }, [proposal.status, isOpen]);

  if (!isOpen || !targetStatus) return null;

  const meta = STATUS_META[targetStatus];

  const handleConfirm = () => {
    onConfirm({
      status: targetStatus,
      ownerNotes: ownerNotes.trim() || undefined,
      interviewDate: interviewDate || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Move to</p>
            <p className={`text-base font-bold ${meta.color}`}>{meta.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Warning for destructive/final actions */}
          {meta.warning && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ⚠ {meta.warning}
            </div>
          )}

          {/* Interview date — only for interview_scheduled */}
          {targetStatus === 'interview_scheduled' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Interview Date & Time
              </label>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>
          )}

          {/* Owner notes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Notes
              {(targetStatus === 'rejected' || targetStatus === 'awarded') ? (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  (optional — shared with freelancer if provided)
                </span>
              ) : (
                <span className="ml-2 text-xs font-normal text-slate-400">(private, optional)</span>
              )}
            </label>
            <textarea
              rows={4}
              value={ownerNotes}
              onChange={(e) => setOwnerNotes(e.target.value)}
              maxLength={1000}
              placeholder={
                targetStatus === 'rejected'
                  ? 'Optional feedback for the freelancer…'
                  : 'Internal notes about this decision…'
              }
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 placeholder:text-slate-400"
            />
            <p className="mt-1 text-right text-xs tabular-nums text-slate-400">
              {ownerNotes.length} / 1000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60 ${meta.btnColor}`}
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating…
              </>
            ) : (
              `Confirm: ${meta.label}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
