/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// pages/dashboard/freelancer/tenders/saved.tsx
// ─── Page 3.3 — Freelancer Browse Freelance: Saved Tenders ───────────────────
// Dedicated saved freelance tenders page.
// Optimistic unsave fully handled by useToggleSaveFreelanceTender hook.

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colorClasses } from '@/utils/color';

import {
  useSavedFreelanceTenders,
} from '@/hooks/useFreelanceTender';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';

import FreelanceTenderCard from '@/components/tenders2.0/FreelanceTenderCard';

// ─────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────
function TenderCardSkeleton() {
  return (
    <div className={`rounded-2xl border p-5 animate-pulse ${colorClasses.bg.primary} ${colorClasses.border.secondary}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-full ${colorClasses.bg.gray200}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded w-28 ${colorClasses.bg.gray200}`} />
          <div className={`h-2.5 rounded w-20 ${colorClasses.bg.gray200}`} />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className={`h-5 w-16 rounded-full ${colorClasses.bg.gray200}`} />
        <div className={`h-5 w-20 rounded-full ${colorClasses.bg.gray200}`} />
      </div>
      <div className={`h-4 rounded w-3/4 mb-2 ${colorClasses.bg.gray200}`} />
      <div className={`h-3 rounded w-full mb-1.5 ${colorClasses.bg.gray200}`} />
      <div className={`h-3 rounded w-5/6 mb-5 ${colorClasses.bg.gray200}`} />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[40, 56, 48].map((w) => (
          <div key={w} className={`h-5 rounded-full ${colorClasses.bg.gray200}`} style={{ width: w }} />
        ))}
      </div>
      <div className={`h-px w-full mb-3 ${colorClasses.bg.gray200}`} />
      <div className="flex justify-between">
        <div className={`h-3 rounded w-20 ${colorClasses.bg.gray200}`} />
        <div className={`h-3 rounded w-16 ${colorClasses.bg.gray200}`} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
function TenderEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className={`
      flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
      py-20 px-6 text-center ${colorClasses.border.muted}
    `}>
      <div className={`
        mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl
        ${colorClasses.bg.surface}
      `}>
        🔖
      </div>
      <p className={`text-lg font-bold mb-2 ${colorClasses.text.primary}`}>
        No saved tenders
      </p>
      <p className={`text-sm mb-7 max-w-xs leading-relaxed ${colorClasses.text.muted}`}>
        Save freelance tenders you want to apply to later. They`ll appear here.
      </p>
      <button
        onClick={onBrowse}
        className={`
          inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold
          transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-md hover:shadow-lg
          ${colorClasses.bg.darkNavy} ${colorClasses.text.inverse}
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        Browse Tenders
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function FreelancerSavedTendersPage() {
  return (
    <FreelancerLayout>
      <FreelancerSavedTendersContent />
    </FreelancerLayout>
  );
}

function FreelancerSavedTendersContent() {
  const router = useRouter();

  // FIX 4 — pagination state
  const [page, setPage] = useState(1);
  const [allTenders, setAllTenders] = useState<any[]>([]);

  // Optimistic update + rollback handled entirely by the hook —
  // do NOT add extra cache manipulation here per spec.
  const { data, isLoading, isError } = useSavedFreelanceTenders({ page, limit: 12 });

  // BUG 1 — defensive access for both possible hook return shapes
  const rawData = data as any;
  const tenders: any[] = rawData?.tenders ?? rawData?.data?.tenders ?? [];
  const total: number = rawData?.pagination?.total ?? rawData?.data?.pagination?.total ?? tenders.length;

  // FIX 4 — accumulate pages; reset on page 1 (filter change / first load)
  useEffect(() => {
    if (page === 1) {
      setAllTenders(tenders);
    } else {
      setAllTenders((prev) => [...prev, ...tenders]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const hasMore = allTenders.length < total && !isLoading;

  return (
    <div className={`min-h-screen ${colorClasses.bg.surface}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard/freelancer/tenders')}
            className={`inline-flex items-center gap-2 text-sm font-medium mb-5 transition-colors ${colorClasses.text.muted} hover:${colorClasses.text.primary}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse Tenders
          </button>

          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${colorClasses.bg.surface}`}>
              🔖
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${colorClasses.text.primary}`}>
                Saved Tenders
              </h1>
              {!isLoading && total > 0 && (
                <p className={`text-sm mt-0.5 ${colorClasses.text.muted}`}>
                  {total} tender{total !== 1 ? 's' : ''} saved
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading && page === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <TenderCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className={`
            flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
            py-16 px-6 text-center ${colorClasses.border.muted}
          `}>
            <div className="text-4xl mb-4">⚠️</div>
            <p className={`text-base font-semibold mb-1.5 ${colorClasses.text.primary}`}>
              Failed to load saved tenders
            </p>
            <p className={`text-sm mb-5 ${colorClasses.text.muted}`}>Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold hover:opacity-80 ${colorClasses.border.primary} ${colorClasses.text.primary}`}
            >
              Refresh
            </button>
          </div>
        ) : allTenders.length === 0 ? (
          <TenderEmptyState
            onBrowse={() => router.push('/dashboard/freelancer/tenders')}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {allTenders.map((tender: any) => (
                <FreelanceTenderCard
                  key={tender._id}
                  tender={tender}
                  viewerRole="freelancer"
                  viewerId={undefined} // saved page: viewer is never the owner
                  onView={(id: string) => router.push(`/dashboard/freelancer/tenders/${id}`)}
                  // The card's internal save toggle calls useToggleSaveFreelanceTender
                  // which handles optimistic removal + rollback via the hook.
                />
              ))}
            </div>

            {/* FIX 4 — Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className={`
                    inline-flex items-center gap-2 rounded-xl border px-6 py-3
                    text-sm font-semibold hover:opacity-80 transition-opacity
                    ${colorClasses.border.primary} ${colorClasses.text.primary}
                  `}
                >
                  Load More
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Loading indicator for subsequent pages */}
            {isLoading && page > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TenderCardSkeleton key={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}