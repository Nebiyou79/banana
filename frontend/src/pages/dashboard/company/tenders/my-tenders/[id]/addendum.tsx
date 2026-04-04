/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/company/tenders/my-tenders/[id]/addendum/page.tsx — FIXED
// FIX 5: Clean, professional layout — no "half-half" split issues.
//        Mobile: stacked (history → form). Desktop: balanced 55/45 two-column.
//        Uses TenderDashboardLayout consistently.
'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { useProfessionalTender, useAddenda } from '@/hooks/useProfessionalTender';
import { AddendumForm, AddendumList } from '@/components/tenders2.0/AddendumForm';
import { Skeleton } from '@/components/ui/Skeleton';
import TenderStatusBadge from '@/components/tenders2.0/TenderStatusBadge';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';

// ─────────────────────────────────────────────────────────────────────────────
// Shared content — reused by org page via import
// ─────────────────────────────────────────────────────────────────────────────
export function AddendumPageContent({
  tenderId,
  basePath,
}: {
  tenderId: string;
  basePath: string;
}) {
  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data: tender, isLoading } = useProfessionalTender(tenderId);
  const { data: addenda }           = useAddenda(tenderId);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-6 px-4 sm:px-0 py-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="grid md:grid-cols-[55%_45%] gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!tender) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className={cn('p-4 rounded-2xl mb-4', colorClasses.bg.secondary)}>
          <FileText className={cn('w-10 h-10 opacity-40', colorClasses.text.muted)} />
        </div>
        <p className={cn('font-bold text-lg mb-1', colorClasses.text.primary)}>Tender not found</p>
        <p className={cn('text-sm mb-6', colorClasses.text.muted)}>This tender does not exist or you don`t have access.</p>
        <button
          onClick={() => router.back()}
          className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:opacity-80', colorClasses.border.goldenMustard, colorClasses.text.goldenMustard)}
        >
          ← Go back
        </button>
      </div>
    );
  }

  const currentDeadline = (tender as any).deadline ?? new Date(Date.now() + 7 * 86_400_000).toISOString();
  const ps = (tender as any).professionalSpecific;
  const referenceNumber = ps?.referenceNumber ?? (tender as any).referenceNumber;
  const addendumCount = addenda?.length ?? 0;

  return (
    <div className="w-full min-h-screen">

      {/* ── Sticky page header ── */}
      <div className={cn('sticky top-0 z-20 border-b shadow-sm', colorClasses.bg.white, colorClasses.border.gray200)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={() => router.push(`${basePath}/${tenderId}`)}
              aria-label="Back to tender"
              className={cn(
                'p-2 rounded-xl border transition-all hover:opacity-70 shrink-0',
                colorClasses.bg.secondary,
                colorClasses.border.gray200,
                colorClasses.text.primary
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Title + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={cn('font-bold text-sm sm:text-base truncate', colorClasses.text.primary)}>
                  {tender.title}
                </h1>
                <TenderStatusBadge status={(tender as any).status} />
              </div>
              {referenceNumber && (
                <p className={cn('text-xs font-mono mt-0.5', colorClasses.text.muted)}>
                  Ref: {referenceNumber}
                </p>
              )}
            </div>

            {/* Addendum count */}
            <div className={cn('shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold',
              addendumCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-300'
                : cn(colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.muted))}>
              <ClipboardList className="w-3.5 h-3.5" />
              {addendumCount} Addend{addendumCount === 1 ? 'um' : 'a'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Section label */}
        <div className="mb-6">
          <h2 className={cn('text-xl font-bold', colorClasses.text.primary)}>Addendum Management</h2>
          <p className={cn('text-sm mt-1', colorClasses.text.muted)}>
            Issue amendments to this tender. All registered bidders will be notified.
          </p>
        </div>

        {/* Mobile: stacked */}
        {isMobile ? (
          <div className="space-y-8">
            {/* Form first on mobile — action is primary */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F1BB03] text-[#0A2540] text-xs font-bold shrink-0">1</span>
                <h3 className={cn('font-bold text-base', colorClasses.text.primary)}>Issue New Addendum</h3>
              </div>
              <AddendumForm
                tenderId={tenderId}
                currentDeadline={currentDeadline}
                onSuccess={() => router.push(`${basePath}/${tenderId}`)}
                showCancel
              />
            </section>

            {/* History */}
            {addendumCount > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">{addendumCount}</span>
                  <h3 className={cn('font-bold text-base', colorClasses.text.primary)}>Addendum History</h3>
                </div>
                <AddendumList tenderId={tenderId} />
              </section>
            )}
          </div>
        ) : (
          /* Desktop: two-column */
          <div className="grid md:grid-cols-[55%_45%] gap-8 items-start">

            {/* Left — History */}
            <motion.section initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
              <div className="flex items-center gap-2 mb-5">
                {addendumCount > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{addendumCount}</span>
                )}
                <h3 className={cn('font-bold text-base', colorClasses.text.primary)}>Addendum History</h3>
              </div>
              <AddendumList tenderId={tenderId} />
            </motion.section>

            {/* Right — Form (sticky) */}
            <motion.section initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
              className="sticky top-[73px]">
              <div className="flex items-center gap-2 mb-5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F1BB03] text-[#0A2540] text-xs font-bold shrink-0">+</span>
                <h3 className={cn('font-bold text-base', colorClasses.text.primary)}>Issue New Addendum</h3>
              </div>
              <AddendumForm
                tenderId={tenderId}
                currentDeadline={currentDeadline}
                onSuccess={() => router.push(`${basePath}/${tenderId}`)}
                showCancel={false}
              />
            </motion.section>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Company page (default export)
// ─────────────────────────────────────────────────────────────────────────────
export default function CompanyAddendumPage() {
  const params   = useParams();
  const tenderId = params?.id as string;

  return (
    <TenderDashboardLayout>
      <AddendumPageContent
        tenderId={tenderId}
        basePath="/dashboard/company/tenders/my-tenders"
      />
    </TenderDashboardLayout>
  );
}