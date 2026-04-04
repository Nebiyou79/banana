// pages/dashboard/company/freelancer/[id].tsx
'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FreelancerHeader  from '@/components/freelancer-marketplace/FreelancerHeader';
import FreelancerDetails from '@/components/freelancer-marketplace/FreelancerDetails';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import {
  useFreelancerProfile,
  useToggleShortlist,
} from '@/hooks/useFreelancerMarketplace';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {/* Header skeleton */}
    <div className={cn('rounded-2xl overflow-hidden border', colorClasses.border.gray100)}>
      <div className="h-24 bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 space-y-3">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 -mt-10 border-4 border-white dark:border-gray-900" />
          <div className="space-y-2 pb-1 flex-1">
            <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-72 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>

    {/* Details skeleton */}
    <div className={cn('rounded-2xl border', colorClasses.border.gray100)}>
      <div className={cn('flex border-b', colorClasses.border.gray100)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 h-11 px-4 py-3">
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-200 dark:bg-gray-700" style={{ width: `${70 + i * 7}%` }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Error state ──────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ message: string; onRetry: () => void; onBack: () => void }> = ({
  message,
  onRetry,
  onBack,
}) => (
  <div className={cn('flex flex-col items-center gap-4 py-20 rounded-2xl', colorClasses.bg.secondary)}>
    <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
      <AlertCircle className="w-6 h-6 text-red-500" />
    </div>
    <div className="text-center">
      <p className={cn('text-sm font-medium', colorClasses.text.primary)}>{message}</p>
      <p className={cn('text-xs mt-1', colorClasses.text.muted)}>The freelancer may not exist or their profile is private.</p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-colors',
          colorClasses.bg.primary,
          colorClasses.border.gray100,
          colorClasses.text.secondary
        )}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Marketplace
      </button>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FreelancerDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const { data: profile, isLoading, isError, refetch } = useFreelancerProfile(id);
  const toggleSave = useToggleShortlist();
  // React Query v5: mutations expose isPending instead of isLoading
  const isSaving = toggleSave.isPending;

  const handleBack = () => router.push('/dashboard/company/freelancer');

  const handleToggleSave = () => {
    if (!profile) return;
    toggleSave.mutate(profile._id);
  };

  return (
    <DashboardLayout requiredRole="company">
      <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">

        {/* ── Back button ── */}
        <button
          onClick={handleBack}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium transition-colors',
            colorClasses.text.muted,
            'hover:text-amber-600 dark:hover:text-amber-400'
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </button>

        {/* ── Loading ── */}
        {isLoading && <ProfileSkeleton />}

        {/* ── Error ── */}
        {isError && !isLoading && (
          <ErrorState
            message="Failed to load freelancer profile"
            onRetry={() => refetch()}
            onBack={handleBack}
          />
        )}

        {/* ── Profile ── */}
        {!isLoading && !isError && profile && (
          <div className="space-y-4">
            {/* Header */}
            <FreelancerHeader
              profile={profile}
              isSaving={isSaving}
              onToggleSave={handleToggleSave}
            />

            {/* Tabs: Overview | Portfolio | Services | Reviews */}
            <FreelancerDetails profile={profile} />
          </div>
        )}

        {/* ── No data (edge case: loaded but empty) ── */}
        {!isLoading && !isError && !profile && (
          <ErrorState
            message="Freelancer not found"
            onRetry={() => refetch()}
            onBack={handleBack}
          />
        )}
      </div>
    </DashboardLayout>
  );
}