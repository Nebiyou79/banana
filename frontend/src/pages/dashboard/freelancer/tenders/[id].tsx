/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/tenders/[id].tsx  (Pages Router)
// ─── Page: Freelancer — Browse Freelance Tender Detail ───────────────────────

import React from 'react';
import { useRouter } from 'next/router';     // ← Pages Router, NOT next/navigation
import type { NextPage } from 'next';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useFreelanceTender } from '@/hooks/useFreelanceTender';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { TenderDetailHeader } from '@/components/tenders2.0/TenderHeader';
import { FreelancerTenderDetails } from '@/components/tenders2.0/FreelanceTenderDetail';

// ─── Skeleton ────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className={cn('h-44 rounded-2xl', colorClasses.bg.gray200)} />
      <div className={cn('h-10 w-full rounded-xl', colorClasses.bg.gray200)} />
      <div className={cn('h-80 rounded-2xl', colorClasses.bg.gray200)} />
    </div>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────
function NotFound({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', colorClasses.bg.secondary)}>
        <svg
          className={cn('w-7 h-7 opacity-40', colorClasses.text.muted)}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className={cn('text-base font-semibold mb-1', colorClasses.text.primary)}>
        Tender not found
      </p>
      <p className={cn('text-sm mb-5 max-w-xs', colorClasses.text.muted)}>{message}</p>
      <button
        onClick={() => router.push('/dashboard/freelancer/tenders')}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0A2540] text-white hover:opacity-90 transition-opacity"
      >
        Browse Tenders
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const FreelancerTenderDetailPage: NextPage = () => {
  const router = useRouter();
  // In Pages Router, dynamic param is router.query.id (not useParams)
  const id = router.query.id as string | undefined;

  const { data: tender, isLoading, error } = useFreelanceTender(id ?? '', {
    enabled: !!id && router.isReady,
  });
  const t = tender as any;

  // Wait until router is hydrated
  if (!router.isReady || !id) {
    return (
      <FreelancerLayout>
        <PageSkeleton />
      </FreelancerLayout>
    );
  }

  if (isLoading) {
    return (
      <FreelancerLayout>
        <PageSkeleton />
      </FreelancerLayout>
    );
  }

  if (error || !t) {
    return (
      <FreelancerLayout>
        <NotFound message="This tender doesn't exist or you don't have access." />
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      {/* Condensed sticky bar — full viewport width */}
      <TenderDetailHeader
        tender={t}
        tenderType="freelance"
        viewerRole="freelancer"
        condensed
      />

      {/* Full hero — full viewport width */}
      <TenderDetailHeader
        tender={t}
        tenderType="freelance"
        viewerRole="freelancer"
        condensed={false}
      />

      {/* Tab content — constrained + padded */}
      <div className={cn('w-full max-w-screen-lg mx-auto', colorClasses.bg.primary)}>
        <div className="px-3 sm:px-5 lg:px-6">
          <FreelancerTenderDetails tenderId={id} />
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerTenderDetailPage;