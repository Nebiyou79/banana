/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// app/dashboard/organization/tenders/[id]/page.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { motion, AnimatePresence } from 'framer-motion';
import { useFreelanceTender } from '@/hooks/useFreelanceTender';
import { useProfessionalTender, useCPOSubmissions, useVerifyCPO } from '@/hooks/useProfessionalTender';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenderDetailHeader } from '@/components/tenders2.0/TenderHeader';
import { OwnerTenderDetails } from '@/components/tenders2.0/OwnerTenderDetails';
import { AddendumForm } from '@/components/tenders2.0/AddendumForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

const ROUTE_BASE = '/dashboard/organization/tenders';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 sm:p-6 max-w-screen-lg mx-auto">
      <div className={cn('h-6 w-40 rounded-lg', colorClasses.bg.gray200)} />
      <div className={cn('h-44 rounded-2xl', colorClasses.bg.gray200)} />
      <div className={cn('h-11 w-full rounded-xl', colorClasses.bg.gray200)} />
      <div className={cn('h-80 rounded-2xl', colorClasses.bg.gray200)} />
    </div>
  );
}

// ─── Not found ────────────────────────────────────────────────────────────────
function NotFound({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', colorClasses.bg.secondary)}>
        <svg className={cn('w-7 h-7 opacity-40', colorClasses.text.muted)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className={cn('text-base font-semibold mb-1', colorClasses.text.primary)}>Tender not found</p>
      <p className={cn('text-sm mb-5 max-w-xs', colorClasses.text.muted)}>{message}</p>
      <button
        onClick={() => router.push(ROUTE_BASE)}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0A2540] text-white hover:opacity-90 transition-opacity"
      >
        Back to Tenders
      </button>
    </div>
  );
}

// ─── Org badge ────────────────────────────────────────────────────────────────
function OrgBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800/50">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      Organization
    </span>
  );
}

// ─── CPO Submissions Panel ────────────────────────────────────────────────────
function CPOSubmissionsPanel({ tenderId }: { tenderId: string }) {
  const { data: submissions, isLoading } = useCPOSubmissions(tenderId);
  const { mutate: verifyCPO, isPending } = useVerifyCPO();
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const statusBadge = (s: string) => ({
    pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
    rejected: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
  } as Record<string, string>)[s] ?? 'bg-gray-100 text-gray-600 border border-gray-200';

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border p-5 animate-pulse', colorClasses.bg.primary, colorClasses.border.secondary)}>
        <div className={cn('h-5 w-40 rounded mb-3', colorClasses.bg.gray200)} />
        <div className={cn('h-16 rounded-xl', colorClasses.bg.gray200)} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border overflow-hidden shadow-sm', colorClasses.bg.primary, colorClasses.border.secondary)}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-3 px-4 sm:px-6 py-4 border-b', colorClasses.border.secondary, colorClasses.bg.secondary)}>
        <div className="p-2 rounded-lg shrink-0 bg-teal-50 dark:bg-teal-950/30">
          <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-sm sm:text-base', colorClasses.text.primary)}>CPO Submissions</h3>
          <p className={cn('text-xs mt-0.5 hidden sm:block', colorClasses.text.muted)}>Review certificates from bidding companies</p>
        </div>
        {(submissions?.length ?? 0) > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shrink-0 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
            {submissions?.length}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {!submissions?.length ? (
          <div className={cn('rounded-xl border-2 border-dashed py-10 text-center', colorClasses.border.gray300)}>
            <svg className={cn('w-8 h-8 mx-auto mb-2 opacity-25', colorClasses.text.muted)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={cn('text-sm font-medium', colorClasses.text.muted)}>No CPO submissions yet</p>
            <p className={cn('text-xs mt-1', colorClasses.text.muted)}>Companies that submit CPOs will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(submissions as any[]).map((cpo: any) => (
              <motion.div
                key={cpo._id}
                layout
                className={cn('rounded-xl border p-4 transition-all', colorClasses.bg.white ?? colorClasses.bg.secondary, colorClasses.border.gray200)}
              >
                <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>
                        {cpo.company?.name ?? cpo.companyName ?? 'Unknown Company'}
                      </span>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', statusBadge(cpo.status))}>
                        {cpo.status}
                      </span>
                    </div>
                    {cpo.documentUrl && (
                      <a href={cpo.documentUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        View Document →
                      </a>
                    )}
                    <p className={cn('text-xs', colorClasses.text.muted)}>
                      Submitted: {fmtDate(cpo.submittedAt ?? cpo.createdAt)}
                    </p>
                  </div>

                  {cpo.status === 'pending' && (
                    <button
                      onClick={() => { setReviewId(cpo._id); setReviewNotes(''); }}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:brightness-95 dark:bg-teal-950/30 dark:text-teal-300 min-h-[36px] transition-all"
                    >
                      Review
                    </button>
                  )}
                </div>

                {/* Inline review panel */}
                <AnimatePresence>
                  {reviewId === cpo._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn('rounded-xl border p-3 space-y-3', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-xs font-semibold uppercase tracking-wide', colorClasses.text.muted)}>Review Notes</p>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Optional notes for the company..."
                          rows={3}
                          className={cn(
                            'w-full rounded-lg border text-sm p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors',
                            colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary,
                          )}
                        />
                        <div className="flex gap-2 flex-wrap">
                          <button
                            disabled={isPending}
                            onClick={() => verifyCPO(
                              { id: tenderId, cpoId: cpo._id, status: 'verified', notes: reviewNotes },
                              { onSuccess: () => { setReviewId(null); setReviewNotes(''); } }
                            )}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors min-h-[36px]"
                          >
                            {isPending ? 'Saving…' : '✓ Verify'}
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => verifyCPO(
                              { id: tenderId, cpoId: cpo._id, status: 'rejected', notes: reviewNotes },
                              { onSuccess: () => { setReviewId(null); setReviewNotes(''); } }
                            )}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors min-h-[36px]"
                          >
                            {isPending ? 'Saving…' : '✕ Reject'}
                          </button>
                          <button
                            onClick={() => { setReviewId(null); setReviewNotes(''); }}
                            className={cn('flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px]', colorClasses.bg.secondary, colorClasses.text.muted)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────
function OrgTenderDetailInner({ id, tenderType }: { id: string; tenderType: 'freelance' | 'professional' }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: flTender, isLoading: flLoading } = useFreelanceTender(id, { enabled: tenderType === 'freelance' });
  const { data: prTender, isLoading: prLoading } = useProfessionalTender(id, { enabled: tenderType === 'professional' });

  const isLoading = tenderType === 'freelance' ? flLoading : prLoading;
  const tender = tenderType === 'freelance' ? (flTender as any) : (prTender as any);

  const [showAddendum, setShowAddendum] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const openAddendum = searchParams?.get('openAddendum') === 'true';

  useEffect(() => {
    if (openAddendum && !autoOpened && tender) {
      setShowAddendum(true);
      setAutoOpened(true);
    }
  }, [openAddendum, autoOpened, tender]);

  const editPath = `${ROUTE_BASE}/${id}/edit?type=${tenderType}`;
  const status = tender?.status ?? '';
  const showCPOPanel = tenderType === 'professional' && ['published', 'locked', 'deadline_reached', 'revealed', 'closed'].includes(status);
  const currentDeadline = tender?.deadline ?? tender?.submissionDeadline ?? new Date().toISOString();

  if (isLoading) return <PageSkeleton />;
  if (!tender) return <NotFound message="This tender doesn't exist or you don't have access." />;

  return (
    <>
      {/* Teal org identity strip */}
      <div className="h-1 w-full bg-teal-500" />

      {/* Condensed sticky header */}
      <TenderDetailHeader
        tender={tender}
        tenderType={tenderType}
        viewerRole="owner"
        condensed
        onEdit={() => router.push(editPath)}
        onDelete={() => router.push(ROUTE_BASE)}
      />

      {/* Full hero */}
      <TenderDetailHeader
        tender={tender}
        tenderType={tenderType}
        viewerRole="owner"
        condensed={false}
        onEdit={() => router.push(editPath)}
        onDelete={() => router.push(ROUTE_BASE)}
      />

      {/* Content */}
      <div className={cn('max-w-screen-lg mx-auto w-full', colorClasses.bg.primary)}>
        <div className="px-3 sm:px-5 lg:px-6">
          {/* Org badge row */}
          <div className="pt-4 pb-2 flex items-center justify-end">
            <OrgBadge />
          </div>

          {/* Main tabs */}
          <div className="pb-4">
            <OwnerTenderDetails
              tenderId={id}
              tenderType={tenderType}
              onEdit={() => router.push(editPath)}
              onDelete={() => router.push(ROUTE_BASE)}
            />
          </div>

          {/* CPO panel — org-only, below tabs */}
          {showCPOPanel && (
            <div className="pb-24">
              <CPOSubmissionsPanel tenderId={id} />
            </div>
          )}
          {!showCPOPanel && <div className="pb-24" />}
        </div>
      </div>

      {/* Addendum dialog */}
      <Dialog open={showAddendum} onOpenChange={setShowAddendum}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle>Issue Addendum</DialogTitle></DialogHeader>
          <AddendumForm
            tenderId={id}
            currentDeadline={currentDeadline}
            onSuccess={() => setShowAddendum(false)}
            onCancel={() => setShowAddendum(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function OrganizationTenderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const typeParam = searchParams?.get('type') as 'freelance' | 'professional' | null;

  const { data: flTender, isLoading: flLoading } = useFreelanceTender(id, {
    enabled: !!id && (!typeParam || typeParam === 'freelance'),
    retry: false,
  });
  const { data: prTender, isLoading: prLoading } = useProfessionalTender(id, {
    enabled: !!id && (!typeParam || typeParam === 'professional'),
    retry: false,
  });

  const resolvedType = useMemo<'freelance' | 'professional' | null>(() => {
    if (typeParam === 'freelance') return 'freelance';
    if (typeParam === 'professional') return 'professional';
    if (flTender) return 'freelance';
    if (prTender) return 'professional';
    return null;
  }, [typeParam, flTender, prTender]);

  const detecting = !resolvedType && (flLoading || prLoading);

  if (!id) return <DashboardLayout requiredRole="organization"><NotFound message="Invalid tender ID." /></DashboardLayout>;
  if (detecting) return <DashboardLayout requiredRole="organization"><PageSkeleton /></DashboardLayout>;
  if (!resolvedType) return <DashboardLayout requiredRole="organization"><NotFound message="This tender doesn't exist or you don't have access." /></DashboardLayout>;

  return (
    <DashboardLayout requiredRole="organization">
      <OrgTenderDetailInner id={id} tenderType={resolvedType} />
    </DashboardLayout>
  );
}