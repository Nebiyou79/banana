// src/components/tender/freelance/FreelanceTenderApplicationsTable.tsx
'use client';
import { useState } from 'react';
import TenderStatusBadge from './TenderStatusBadge';
import TenderOwnerAvatar from './TenderOwnerAvatar';
import {
  useFreelanceTenderApplications,
  useUpdateApplicationStatus,
} from '@/hooks/useFreelanceTender';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import type { FreelanceTenderApplication } from '@/types/tender.types';

interface FreelanceTenderApplicationsTableProps {
  tenderId: string;
  tenderTitle: string;
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'rejected', label: 'Rejected' },
];

const BULK_ACTIONS = [
  { value: 'under_review', label: 'Move to Under Review' },
  { value: 'shortlisted', label: 'Shortlist Selected' },
  { value: 'rejected', label: 'Reject Selected' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

// ─── Review slide-over ────────────────────────────────────────────────────────
function ReviewPanel({
  application,
  tenderId,
  numberOfPositions,
  onClose,
}: {
  application: FreelanceTenderApplication;
  tenderId: string;
  numberOfPositions?: number;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<string>((application as any).status ?? 'pending');
  const [notes, setNotes] = useState<string>((application as any).reviewNotes ?? '');
  const [showAwardDialog, setShowAwardDialog] = useState(false);

  const { mutate: updateStatus, isPending } = useUpdateApplicationStatus();

  const applicant = (application as any).applicant;
  const coverLetter = (application as any).coverLetter ?? '';
  const portfolioLinks: string[] = (application as any).portfolioLinks ?? [];
  const screeningAnswers: { question: string; answer: string }[] =
    (application as any).screeningAnswers ?? [];
  const cv = (application as any).cv;

  const handleSave = () => {
    if (status === 'awarded' && numberOfPositions === 1) {
      setShowAwardDialog(true);
      return;
    }
    commitSave();
  };

  const commitSave = () => {
    updateStatus(
      { tenderId, applicationId: (application as any)._id, status, notes },
      { onSuccess: onClose }
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-[480px]
          flex flex-col shadow-2xl
          ${colorClasses.bg.primary}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${colorClasses.border.primary}`}>
          <h3 className={`text-base font-semibold ${colorClasses.text.primary}`}>Application Review</h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Applicant */}
          <div className="flex items-center gap-3">
            <TenderOwnerAvatar
              owner={{ name: applicant?.name ?? 'Applicant', avatar: applicant?.avatar, _id: applicant?._id }}
              size="md"
              showName
            />
            {(application as any).proposedRate != null && (
              <div className="ml-auto text-right">
                <p className={`text-xs ${colorClasses.text.secondary}`}>Proposed</p>
                <p className={`text-sm font-bold ${colorClasses.text.primary}`}>
                  {formatCurrency((application as any).proposedRate, (application as any).proposedRateCurrency ?? 'ETB')}
                </p>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorClasses.text.secondary}`}>Cover Letter</p>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${colorClasses.text.primary}`}>{coverLetter}</p>
          </div>

          {/* Portfolio Links */}
          {portfolioLinks.length > 0 && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorClasses.text.secondary}`}>Portfolio</p>
              <ul className="space-y-1">
                {portfolioLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm underline ${colorClasses.text.blue} hover:opacity-80`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Screening Q&A */}
          {screeningAnswers.length > 0 && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${colorClasses.text.secondary}`}>Screening Answers</p>
              <div className="space-y-4">
                {screeningAnswers.map((qa, i) => (
                  <div key={i}>
                    <p className={`text-xs font-medium mb-1 ${colorClasses.text.primary}`}>
                      Q{i + 1}: {qa.question}
                    </p>
                    <p className={`text-sm ${colorClasses.text.secondary} pl-3 border-l-2 border-[#F1BB03]`}>
                      {qa.answer || <em>No answer provided</em>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CV */}
          {cv && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorClasses.text.secondary}`}>CV / Resume</p>
              <a
                href={cv.secure_url ?? cv}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium
                  ${colorClasses.border.primary} ${colorClasses.text.primary}
                  hover:${colorClasses.bg.secondary} transition-colors
                `}
              >
                <span>📄</span>
                View / Download CV
              </a>
            </div>
          )}

          {/* Status */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${colorClasses.text.secondary}`}>
              Update Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`
                w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition
                focus:ring-2 focus:ring-[#F1BB03] focus:border-[#F1BB03]
                ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}
              `}
            >
              <option value="pending">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="awarded">Awarded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${colorClasses.text.secondary}`}>
              Private Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`
                w-full rounded-xl border px-4 py-2.5 text-sm outline-none resize-none transition
                focus:ring-2 focus:ring-[#F1BB03] focus:border-[#F1BB03]
                ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}
              `}
              placeholder="Internal notes visible only to you..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`shrink-0 px-6 py-4 border-t ${colorClasses.border.primary} flex gap-3 justify-end`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${colorClasses.border.primary} ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              ${colorClasses.bg.darkNavy} hover:opacity-90 disabled:opacity-50
            `}
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : 'Save Status'}
          </button>
        </div>
      </aside>

      {/* Award confirmation dialog */}
      {showAwardDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 shadow-xl border ${colorClasses.bg.primary} ${colorClasses.border.primary}`}>
            <h4 className={`text-base font-semibold mb-2 ${colorClasses.text.primary}`}>Award this applicant?</h4>
            <p className={`text-sm ${colorClasses.text.secondary}`}>
              Since this tender has 1 position, awarding this applicant will automatically reject all other applications.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => { setShowAwardDialog(false); commitSave(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Confirm Award
              </button>
              <button
                type="button"
                onClick={() => setShowAwardDialog(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${colorClasses.border.primary} ${colorClasses.text.secondary}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────
export default function FreelanceTenderApplicationsTable({
  tenderId,
  tenderTitle,
}: FreelanceTenderApplicationsTableProps) {
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [reviewingApp, setReviewingApp] = useState<FreelanceTenderApplication | null>(null);

  const { data, isLoading, isError } = useFreelanceTenderApplications(
    tenderId,
    { status: activeTab || undefined, page, limit: 20 }
  );

  const { mutate: updateStatus } = useUpdateApplicationStatus();

  const applications: FreelanceTenderApplication[] = data?.applications ?? [];
  const pagination = data?.pagination;
  const totalCount = data?.summary?.total ?? pagination?.total ?? applications.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a: any) => a._id)));
    }
  };

  const applyBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) return;
    selectedIds.forEach((appId) => {
      updateStatus({ tenderId, applicationId: appId, status: bulkAction });
    });
    setSelectedIds(new Set());
    setBulkAction('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${colorClasses.text.primary}`}>{tenderTitle}</h2>
          <p className={`text-sm ${colorClasses.text.secondary}`}>
            {totalCount} application{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className={`text-xs ${colorClasses.text.secondary}`}>{selectedIds.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className={`
                rounded-xl border px-3 py-2 text-sm outline-none
                ${colorClasses.bg.primary} ${colorClasses.border.primary} ${colorClasses.text.primary}
              `}
            >
              <option value="">Bulk action…</option>
              {BULK_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulkAction}
              disabled={!bulkAction}
              className={`
                px-4 py-2 rounded-xl text-sm font-semibold text-white
                ${colorClasses.bg.darkNavy} hover:opacity-90 disabled:opacity-40
              `}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* ── Status tabs ── */}
      <div className={`flex gap-1 overflow-x-auto pb-1 border-b ${colorClasses.border.primary}`}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => { setActiveTab(tab.value); setPage(1); setSelectedIds(new Set()); }}
            className={`
              shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${activeTab === tab.value
                ? `border-b-2 border-[#F1BB03] ${colorClasses.text.primary}`
                : `${colorClasses.text.secondary} hover:${colorClasses.text.primary}`}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-16 rounded-xl animate-pulse ${colorClasses.bg.secondary}`} />
          ))}
        </div>
      ) : isError ? (
        <p className={`text-sm ${colorClasses.text.red}`}>Failed to load applications.</p>
      ) : applications.length === 0 ? (
        <div className={`py-16 text-center ${colorClasses.text.secondary} text-sm`}>
          No applications {activeTab ? `with status "${activeTab}"` : ''} yet.
        </div>
      ) : isMobile ? (
        /* ── Mobile card list ── */
        <div className="space-y-3">
          {applications.map((app: any) => (
            <div
              key={app._id}
              className={`rounded-2xl border p-4 ${colorClasses.bg.primary} ${colorClasses.border.primary}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(app._id)}
                  onChange={() => toggleSelect(app._id)}
                  className="rounded accent-[#F1BB03]"
                />
                <TenderOwnerAvatar
                  owner={{ name: app.applicant?.name ?? 'Applicant', avatar: app.applicant?.avatar, _id: app.applicant?._id }}
                  size="sm"
                  showName
                />
                <div className="ml-auto">
                  <TenderStatusBadge status={app.status} size="sm" />
                </div>
              </div>
              <div className={`flex items-center justify-between text-xs ${colorClasses.text.secondary}`}>
                <span>{app.proposedRate != null ? formatCurrency(app.proposedRate, app.proposedRateCurrency ?? 'ETB') : '—'}</span>
                <span>{app.submittedAt ? formatDate(app.submittedAt) : '—'}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setReviewingApp(app)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white ${colorClasses.bg.darkNavy} hover:opacity-90`}
                >
                  Review
                </button>
                {app.cv && (
                  <a
                    href={app.cv.secure_url ?? app.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-xl text-xs font-medium border ${colorClasses.border.primary} ${colorClasses.text.primary}`}
                  >
                    CV
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Desktop table ── */
        <div className={`rounded-2xl border overflow-hidden ${colorClasses.border.primary}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${colorClasses.border.primary} ${colorClasses.bg.secondary}`}>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === applications.length && applications.length > 0}
                    onChange={toggleAll}
                    className="rounded accent-[#F1BB03]"
                  />
                </th>
                {['Applicant', 'Proposed Rate', 'Timeline', 'Applied', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${colorClasses.text.secondary}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${colorClasses.border.primary}`}>
              {applications.map((app: any) => (
                <tr
                  key={app._id}
                  className={`hover:${colorClasses.bg.secondary} transition-colors`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app._id)}
                      onChange={() => toggleSelect(app._id)}
                      className="rounded accent-[#F1BB03]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <TenderOwnerAvatar
                      owner={{ name: app.applicant?.name ?? 'Applicant', avatar: app.applicant?.avatar, _id: app.applicant?._id }}
                      size="sm"
                      showName
                    />
                  </td>
                  <td className={`px-4 py-3 font-medium ${colorClasses.text.primary}`}>
                    {app.proposedRate != null
                      ? formatCurrency(app.proposedRate, app.proposedRateCurrency ?? 'ETB')
                      : <span className={colorClasses.text.secondary}>—</span>}
                  </td>
                  <td className={`px-4 py-3 ${colorClasses.text.secondary}`}>
                    {app.estimatedTimeline
                      ? `${app.estimatedTimeline.duration} ${app.estimatedTimeline.unit}`
                      : '—'}
                  </td>
                  <td className={`px-4 py-3 ${colorClasses.text.secondary}`}>
                    {app.submittedAt ? formatDate(app.submittedAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <TenderStatusBadge status={app.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewingApp(app)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold text-white
                          ${colorClasses.bg.darkNavy} hover:opacity-90 transition-opacity
                        `}
                      >
                        Review
                      </button>
                      {app.cv && (
                        <a
                          href={app.cv.secure_url ?? app.cv}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${colorClasses.border.primary} ${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`}
                        >
                          CV
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-xs ${colorClasses.text.secondary}`}>
            Page {page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={`px-4 py-2 rounded-xl text-sm border ${colorClasses.border.primary} ${colorClasses.text.secondary} disabled:opacity-40`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`px-4 py-2 rounded-xl text-sm border ${colorClasses.border.primary} ${colorClasses.text.secondary} disabled:opacity-40`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Review panel ── */}
      {reviewingApp && (
        <ReviewPanel
          application={reviewingApp}
          tenderId={tenderId}
          numberOfPositions={(reviewingApp as any).numberOfPositions ?? 1}
          onClose={() => setReviewingApp(null)}
        />
      )}
    </div>
  );
}