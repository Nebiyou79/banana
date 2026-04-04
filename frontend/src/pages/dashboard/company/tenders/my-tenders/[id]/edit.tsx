/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// pages/dashboard/company/tenders/my-tenders/[id]/edit.tsx
// ─── Page 1.4 — Company: My Tenders Edit ─────────────────────────────────────
// Edit an existing tender. Freelance tenders always editable.
// Professional tenders: only if status === 'draft'. If not draft → read-only banner + addendum CTA.
// Type detected via ?type= query param with parallel-fetch fallback.

import React, { useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { colorClasses } from '@/utils/color';

// ── Freelance hooks
import {
  useFreelanceTenderEditData,
} from '@/hooks/useFreelanceTender';

// ── Professional hooks
import {
  useProfessionalTenderEditData,
} from '@/hooks/useProfessionalTender';

// ── Form components
import FreelanceTenderForm from '@/components/tenders2.0/FreelanceTenderForm';
import ProfessionalTenderForm from '@/components/tenders2.0/ProfessionalTenderForm';
import TenderStatusBadge from '@/components/tenders2.0/TenderStatusBadge';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 text-sm font-medium mb-6
        transition-colors ${colorClasses.text.muted} hover:${colorClasses.text.primary}
      `}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Tender
    </button>
  );
}

// Full-page skeleton
function PageSkeleton() {
  return (
    <div className={`min-h-screen ${colorClasses.bg.surface}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className={`h-4 w-28 rounded mb-8 ${colorClasses.bg.gray200}`} />
        <div className={`h-8 w-48 rounded mb-4 ${colorClasses.bg.gray200}`} />
        <div className={`h-4 w-72 rounded mb-8 ${colorClasses.bg.gray200}`} />
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-40 rounded-2xl mb-5 ${colorClasses.bg.gray200}`} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Non-editable Professional Tender Banner
// (shown when professional tender status !== 'draft')
// ─────────────────────────────────────────────
interface NonEditableBannerProps {
  tenderId: string;
  status: string;
  title: string;
}

function NonEditableBanner({ tenderId, status, title }: NonEditableBannerProps) {
  const router = useRouter();

  const goToDetail = useCallback(
    () => router.push(`/dashboard/company/tenders/my-tenders/${tenderId}?type=professional`),
    [router, tenderId]
  );

  const goToAddendum = useCallback(
    () => router.push(`/dashboard/company/tenders/my-tenders/${tenderId}?type=professional&openAddendum=true`),
    [router, tenderId]
  );

  return (
    <div className={`min-h-screen ${colorClasses.bg.surface}`}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={goToDetail} />

        {/* Status header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className={`text-2xl font-bold truncate ${colorClasses.text.primary}`}>
            {title}
          </h1>
          <TenderStatusBadge status={status as any} size="md" showDot />
        </div>

        {/* Main banner card */}
        <div className={`
          rounded-2xl border-2 p-8 sm:p-10
          ${colorClasses.bg.primary}
          border-[#F59E0B] dark:border-[#D97706]
        `}>
          {/* Icon */}
          <div className={`
            mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl
            ${colorClasses.bg.amberLight}
          `}>
            <svg
              className={`w-8 h-8 ${colorClasses.text.amber}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className={`text-center text-xl font-bold mb-3 ${colorClasses.text.primary}`}>
            This tender cannot be edited directly
          </h2>

          {/* Body */}
          <p className={`text-center text-sm leading-relaxed mb-2 ${colorClasses.text.secondary}`}>
            This tender has been published and is now live for bidders. Direct editing is disabled to
            protect the integrity of the bidding process.
          </p>
          <p className={`text-center text-sm leading-relaxed mb-8 ${colorClasses.text.secondary}`}>
            To make changes, use the{' '}
            <strong className={colorClasses.text.primary}>Addendum system</strong>. Addenda are official
            notices that update tender requirements and automatically notify all registered bidders.
          </p>

          {/* Info grid */}
          <div className={`
            grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border p-5 mb-8
            ${colorClasses.bg.surface} ${colorClasses.border.secondary}
          `}>
            {[
              { icon: '📢', label: 'Notifies bidders', desc: 'All registered bidders are notified automatically' },
              { icon: '📋', label: 'Official record', desc: 'Addenda form part of the tender`s official record' },
              { icon: '📅', label: 'Extend deadlines', desc: 'Optionally extend the submission deadline' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className={`text-sm font-semibold mb-1 ${colorClasses.text.primary}`}>{item.label}</p>
                <p className={`text-xs leading-relaxed ${colorClasses.text.muted}`}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={goToAddendum}
              className={`
                inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-bold
                transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-md hover:shadow-lg
                ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Issue Addendum
            </button>
            <button
              onClick={goToDetail}
              className={`
                inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold
                transition-all hover:opacity-80
                ${colorClasses.border.primary} ${colorClasses.text.primary}
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tender
            </button>
          </div>
        </div>

        {/* Tip note */}
        <p className={`text-center text-xs mt-6 ${colorClasses.text.muted}`}>
          If you need to make major structural changes, consider closing this tender and creating a new one.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Freelance Edit Page
// ─────────────────────────────────────────────
function FreelanceEditPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: editData, isLoading } = useFreelanceTenderEditData(id);

  const goToDetail = useCallback(
    () => router.push(`/dashboard/company/tenders/my-tenders/${id}?type=freelance`),
    [router, id]
  );

  if (isLoading) return <PageSkeleton />;
  if (!editData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colorClasses.bg.surface}`}>
        <p className={colorClasses.text.muted}>Tender not found.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colorClasses.bg.surface}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={goToDetail} />

        {/* Page header */}
        <div className="mb-6">
          {/* Status badge — read only, shows context */}
          <div className="flex items-center gap-3 mb-1">
            <span className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
              ${colorClasses.bg.indigoLight} ${colorClasses.text.indigo}
            `}>
              🧑‍💻 Freelance Tender
            </span>
            <TenderStatusBadge status={(editData as any).status ?? 'draft'} size="sm" showDot />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-2 ${colorClasses.text.primary}`}>
            Edit Tender
          </h1>
          <p className={`text-sm mt-1 ${colorClasses.text.muted}`}>
            Freelance tenders can be edited at any time regardless of status.
          </p>
        </div>

        {/* Edit note */}
        <div className={`
          flex items-start gap-3 rounded-xl border p-4 mb-6
          ${colorClasses.bg.blueLight} border-[#4DA6FF]/30
        `}>
          <svg className={`w-4 h-4 mt-0.5 shrink-0 ${colorClasses.text.blue600}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={`text-sm ${colorClasses.text.blue600} dark:${colorClasses.text.blue}`}>
            Changes are saved immediately. If the tender is published, applicants will see updated information on their next page load.
          </p>
        </div>

        {/* The form — tenderId passed → edit mode, fetches own editData internally */}
        <FreelanceTenderForm
          tenderId={id}
          onSuccess={(_id: string) => goToDetail()}
          onCancel={goToDetail}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Professional Edit Page (with draft guard)
// ─────────────────────────────────────────────
function ProfessionalEditPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: editData, isLoading } = useProfessionalTenderEditData(id);

  const goToDetail = useCallback(
    () => router.push(`/dashboard/company/tenders/my-tenders/${id}?type=professional`),
    [router, id]
  );

  if (isLoading) return <PageSkeleton />;
  if (!editData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colorClasses.bg.surface}`}>
        <p className={colorClasses.text.muted}>Tender not found.</p>
      </div>
    );
  }

  const status = (editData as any).status ?? 'draft';
  const isDraft = status === 'draft';

  // ── DRAFT GUARD: non-draft professional tenders → read-only banner ──
  if (!isDraft) {
    return (
      <NonEditableBanner
        tenderId={id}
        status={status}
        title={editData.title ?? 'Untitled Tender'}
      />
    );
  }

  // ── Draft: render form ──
  return (
    <div className={`min-h-screen ${colorClasses.bg.surface}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onClick={goToDetail} />

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
              ${colorClasses.bg.blueLight} ${colorClasses.text.blue600}
            `}>
              🏢 Professional Tender
            </span>
            <TenderStatusBadge status={status as any} size="sm" showDot />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-2 ${colorClasses.text.primary}`}>
            Edit Tender
          </h1>
          <p className={`text-sm mt-1 ${colorClasses.text.muted}`}>
            Draft tenders can be fully edited. Once published, use Addenda for changes.
          </p>
        </div>

        {/* Draft note */}
        <div className={`
          flex items-start gap-3 rounded-xl border p-4 mb-6
          ${colorClasses.bg.amberLight} border-[#F59E0B]/40
        `}>
          <svg className={`w-4 h-4 mt-0.5 shrink-0 ${colorClasses.text.amber}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className={`text-sm ${colorClasses.text.amber700}`}>
            This tender is in <strong>Draft</strong> status. It will not be visible to bidders until you publish it.
          </p>
        </div>

        {/* The form — tenderId passed → edit mode with pre-fill */}
        <ProfessionalTenderForm
          tenderId={id}
          onSuccess={(_id: string) => goToDetail()}
          onCancel={goToDetail}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Root Page — type detection
// ─────────────────────────────────────────────
export default function EditTenderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id as string;
  const typeParam = searchParams?.get('type') as 'freelance' | 'professional' | null;

  // Parallel fetch for type detection fallback
  const { data: freelanceData, isLoading: isFreelanceLoading } = useFreelanceTenderEditData(
    id,
    { enabled: !!id && (!typeParam || typeParam === 'freelance') }
  );
  const { data: professionalData, isLoading: isProfessionalLoading } = useProfessionalTenderEditData(
    id,
    { enabled: !!id && (!typeParam || typeParam === 'professional') }
  );

  if (!id) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colorClasses.bg.surface}`}>
        <p className={colorClasses.text.muted}>Invalid tender ID.</p>
      </div>
    );
  }

  // Determine type
  const resolvedType: 'freelance' | 'professional' | null = (() => {
    if (typeParam === 'freelance') return 'freelance';
    if (typeParam === 'professional') return 'professional';
    if (freelanceData) return 'freelance';
    if (professionalData) return 'professional';
    return null;
  })();

  // Loading state during parallel fetch
  const isDetecting =
    (!typeParam && isFreelanceLoading) ||
    (!typeParam && isProfessionalLoading);

  if (isDetecting && !resolvedType) {
    return (
      <TenderDashboardLayout>
        <PageSkeleton />
      </TenderDashboardLayout>
    );
  }

  if (resolvedType === 'freelance') {
    return (
      <TenderDashboardLayout>
        <FreelanceEditPage id={id} />
      </TenderDashboardLayout>
    );
  }

  if (resolvedType === 'professional') {
    return (
      <TenderDashboardLayout>
        <ProfessionalEditPage id={id} />
      </TenderDashboardLayout>
    );
  }

  // Not found
  return (
    <TenderDashboardLayout>
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${colorClasses.bg.surface}`}>
        <div className="text-4xl">🔍</div>
        <p className={`text-lg font-semibold ${colorClasses.text.primary}`}>Tender not found</p>
        <p className={`text-sm ${colorClasses.text.muted}`}>
          The tender you`re trying to edit doesn`t exist or you don`t have access.
        </p>
        <button
          onClick={() => router.push('/dashboard/company/tenders/my-tenders')}
          className={`
          mt-2 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold
          transition-opacity hover:opacity-80
          ${colorClasses.border.primary} ${colorClasses.text.primary}
        `}
        >
          Back to My Tenders
        </button>
      </div>
    </TenderDashboardLayout>
  );
}