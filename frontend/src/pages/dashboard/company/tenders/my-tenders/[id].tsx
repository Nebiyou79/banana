/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// app/dashboard/company/tenders/my-tenders/[id]/page.tsx

import React, { useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useFreelanceTender } from '@/hooks/useFreelanceTender';
import { useProfessionalTender } from '@/hooks/useProfessionalTender';
import { TenderDetailHeader } from '@/components/tenders2.0/TenderHeader';
import { OwnerTenderDetails } from '@/components/tenders2.0/OwnerTenderDetails';
import TenderDashboardLayout from '@/components/tenders2.0/layout/TenderDashboardLayout';

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
        onClick={() => router.push('/dashboard/company/tenders/my-tenders')}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0A2540] text-white hover:opacity-90 transition-opacity"
      >
        Back to My Tenders
      </button>
    </div>
  );
}

function OwnerTenderDetailInner({ id, tenderType }: { id: string; tenderType: 'freelance' | 'professional' }) {
  const router = useRouter();

  const { data: flTender, isLoading: flLoading } = useFreelanceTender(id, { enabled: tenderType === 'freelance' });
  const { data: prTender, isLoading: prLoading } = useProfessionalTender(id, { enabled: tenderType === 'professional' });

  const isLoading = tenderType === 'freelance' ? flLoading : prLoading;
  const tender = tenderType === 'freelance' ? (flTender as any) : (prTender as any);

  const editPath = `/dashboard/company/tenders/my-tenders/${id}/edit`;
  const listPath = '/dashboard/company/tenders/my-tenders';

  if (isLoading) return <PageSkeleton />;
  if (!tender) return <NotFound message="This tender doesn't exist or you don't have access." />;

  return (
    <>
      {/* Condensed sticky header */}
      <TenderDetailHeader
        tender={tender}
        tenderType={tenderType}
        viewerRole="owner"
        condensed
        onEdit={() => router.push(editPath)}
        onDelete={() => router.push(listPath)}
      />
      {/* Full hero */}
      <TenderDetailHeader
        tender={tender}
        tenderType={tenderType}
        viewerRole="owner"
        condensed={false}
        onEdit={() => router.push(editPath)}
        onDelete={() => router.push(listPath)}
      />
      {/* Content */}
      <div className={cn('max-w-screen-lg mx-auto w-full', colorClasses.bg.primary)}>
        <div className="px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
          <OwnerTenderDetails
            tenderId={id}
            tenderType={tenderType}
            onEdit={() => router.push(editPath)}
            onDelete={() => router.push(listPath)}
          />
        </div>
      </div>
    </>
  );
}

export default function OwnerTenderDetailPage() {
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

  if (!id) return <TenderDashboardLayout><NotFound message="Invalid tender ID." /></TenderDashboardLayout>;
  if (detecting) return <TenderDashboardLayout><PageSkeleton /></TenderDashboardLayout>;
  if (!resolvedType) return <TenderDashboardLayout><NotFound message="This tender doesn't exist or you don't have access." /></TenderDashboardLayout>;

  return (
    <TenderDashboardLayout>
      <OwnerTenderDetailInner id={id} tenderType={resolvedType} />
    </TenderDashboardLayout>
  );
}