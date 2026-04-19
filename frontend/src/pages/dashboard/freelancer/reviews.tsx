/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/reviews.tsx
//
// Route: /dashboard/freelancer/reviews
// Add to FreelancerLayout sidebar nav alongside Profile, Portfolio, etc.
//
// Data flow:
//   1. freelancerService.getProfile()  → gets the logged-in freelancer's
//      profile including their freelancerProfile._id (marketplace profile id)
//   2. useFreelancerReviews(profileId, page) → paginated reviews via
//      GET /api/v1/freelancers/:id/reviews
//   3. useFreelancerProfile(profileId)  → aggregate ratings/summary
//
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import {
  StarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolid,
  TrophyIcon as TrophySolid,
  SparklesIcon as SparklesSolid,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { freelancerService } from '@/services/freelancerService';
import {
  useFreelancerReviews,
  useFreelancerProfile,
} from '@/hooks/useFreelancerMarketplace';
import type { FreelancerReview, RatingBreakdown } from '@/services/freelancerMarketplaceService';

// ─── Small helpers ────────────────────────────────────────────────────────────

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', year: 'numeric', day: 'numeric',
    });
  } catch {
    return '';
  }
};

// ─── Stars component ──────────────────────────────────────────────────────────

const Stars: React.FC<{ value: number; size?: 'xs' | 'sm' | 'md' }> = ({ value, size = 'md' }) => {
  const cls = { xs: 'w-3 h-3', sm: 'w-3.5 h-3.5', md: 'w-4 h-4' }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n;
        const half = !filled && value >= n - 0.5;
        return (
          <span key={n} className="relative inline-block">
            <StarIcon className={cn(cls, 'text-gray-200 dark:text-gray-700')} />
            {(filled || half) && (
              <span className={cn('absolute inset-0 overflow-hidden', half ? 'w-1/2' : 'w-full')}>
                <StarSolid className={cn(cls, 'text-amber-400')} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

// ─── Horizontal bar (breakdown) ───────────────────────────────────────────────

const BreakdownBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-3 py-0.5">
    <span className={cn('text-xs capitalize shrink-0 w-28', colorClasses.text.muted)}>{label}</span>
    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, (value / 5) * 100))}%` }}
      />
    </div>
    <div className="flex items-center gap-1 w-14 shrink-0 justify-end">
      <StarSolid className="w-3 h-3 text-amber-400 shrink-0" />
      <span className={cn('text-xs font-semibold', colorClasses.text.primary)}>
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  </div>
);

// ─── Distribution bar (5★ 4★ …) ──────────────────────────────────────────────

const DistBar: React.FC<{ star: number; count: number; total: number }> = ({ star, count, total }) => {
  const width = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 group">
      <span className={cn('text-xs font-medium shrink-0 w-3 text-right', colorClasses.text.muted)}>
        {star}
      </span>
      <StarSolid className="w-3 h-3 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-amber-400 transition-all duration-700 group-hover:bg-amber-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={cn('text-xs shrink-0 w-4 text-right', colorClasses.text.muted)}>{count}</span>
    </div>
  );
};

// ─── Achievement badge ────────────────────────────────────────────────────────

interface AchievementDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  earned: boolean;
  color: string;
  bg: string;
  border: string;
}

const AchievementBadge: React.FC<{ a: AchievementDef }> = ({ a }) => (
  <div
    title={a.earned ? `Earned: ${a.label}` : `Not yet earned`}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold',
      'transition-all duration-200 cursor-default select-none',
      a.earned
        ? cn(a.bg, a.border, a.color, 'shadow-sm')
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 opacity-50 grayscale',
    )}
  >
    {a.icon}
    {a.label}
  </div>
);

// ─── Review card ──────────────────────────────────────────────────────────────

const ReviewCard: React.FC<{ review: FreelancerReview; idx: number }> = ({ review, idx }) => {
  const [imgErr, setImgErr] = useState(false);
  const co = (review.companyId ?? { name: 'Anonymous' }) as any;
  const hasSubRatings =
    review.subRatings && Object.values(review.subRatings).some((v) => (v as number) > 0);

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        colorClasses.bg.primary,
        colorClasses.border.gray100,
      )}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0',
          colorClasses.bg.secondary,
        )}>
          {co.logo && !imgErr ? (
            <img
              src={co.logo}
              alt={co.name}
              className="w-full h-full object-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <span className={cn('text-sm font-bold', colorClasses.text.amber)}>
              {co.name?.charAt(0)?.toUpperCase() ?? 'C'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{co.name}</p>
              <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>{fmt(review.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Stars value={review.rating} size="sm" />
              <span className={cn('text-sm font-bold', colorClasses.text.primary)}>
                {review.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <blockquote className={cn('mt-3 text-sm leading-relaxed italic', colorClasses.text.secondary)}>
          &ldquo;{review.comment}&rdquo;
        </blockquote>
      )}

      {/* Sub-ratings */}
      {hasSubRatings && (
        <div className={cn(
          'mt-4 pt-4 border-t grid grid-cols-2 gap-x-6 gap-y-2',
          colorClasses.border.gray100,
        )}>
          {Object.entries(review.subRatings!).map(([k, v]) =>
            v != null && (v as number) > 0 ? (
              <div key={k} className="flex items-center gap-2">
                <span className={cn('text-[10px] capitalize w-24 shrink-0', colorClasses.text.muted)}>{k}</span>
                <div className="flex gap-px shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        n <= (v as number)
                          ? 'bg-amber-400'
                          : 'bg-gray-200 dark:bg-gray-700',
                      )}
                    />
                  ))}
                </div>
                <span className={cn('text-[10px] font-semibold', colorClasses.text.primary)}>
                  {(v as number).toFixed(1)}
                </span>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

// ─── Review skeleton ──────────────────────────────────────────────────────────

const ReviewSkeleton: React.FC = () => (
  <div className={cn(
    'rounded-2xl border p-5 animate-pulse',
    colorClasses.bg.primary,
    colorClasses.border.gray100,
  )}>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-36 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex gap-0.5 shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className={cn(
    'flex flex-col items-center justify-center py-20 rounded-2xl border',
    colorClasses.bg.primary,
    colorClasses.border.gray100,
  )}>
    <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-5">
      <StarIcon className="w-10 h-10 text-amber-400" />
    </div>
    <h3 className={cn('text-lg font-bold mb-2', colorClasses.text.primary)}>No reviews yet</h3>
    <p className={cn('text-sm text-center max-w-xs leading-relaxed mb-6', colorClasses.text.muted)}>
      Complete projects and deliver outstanding work to start earning reviews from companies.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-sm px-4">
      {[
        { icon: '🎯', text: 'Deliver on time' },
        { icon: '💬', text: 'Communicate clearly' },
        { icon: '⭐', text: 'Exceed expectations' },
      ].map((tip) => (
        <div
          key={tip.text}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs',
            colorClasses.bg.secondary,
            colorClasses.text.secondary,
          )}
        >
          <span>{tip.icon}</span>
          {tip.text}
        </div>
      ))}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const FreelancerMyReviewsPage: React.FC = () => {
  const [freelancerProfileId, setFreelancerProfileId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Step 1: Get the logged-in freelancer's marketplace profile _id
  // (same pattern as profile.tsx uses freelancerService.getProfile())
  useEffect(() => {
    freelancerService
      .getProfile()
      .then((data: any) => {
        // The API returns freelancerProfile._id as the marketplace profile id
        const id = data?.freelancerProfile?._id ?? data?._id ?? null;
        setFreelancerProfileId(id);
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, []);

  // Step 2: Fetch aggregate ratings from marketplace profile
  const { data: marketProfile } = useFreelancerProfile(freelancerProfileId);

  // Step 3: Fetch paginated reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isError,
  } = useFreelancerReviews(freelancerProfileId, page);

  const isInitialLoad = profileLoading;
  const summary = reviewsData?.summary ?? marketProfile?.ratings;
  const reviews: FreelancerReview[] = reviewsData?.reviews ?? [];
  const pagination = reviewsData?.pagination;
  const avg = (summary as any)?.average ?? 0;
  const total = (summary as any)?.count ?? 0;
  const breakdown = (marketProfile?.ratings as any)?.breakdown as RatingBreakdown | undefined;

  // Build per-star count from loaded reviews (used for distribution bars)
  const starCounts = reviews.reduce<Record<number, number>>((acc, r) => {
    const s = Math.round(r.rating ?? 0);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  // Achievements
  const achievements: AchievementDef[] = [
    {
      id: 'top_rated',
      label: 'Top Rated',
      icon: <TrophySolid className="w-3.5 h-3.5" />,
      earned: avg >= 4.8 && total >= 3,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      id: 'rising_talent',
      label: 'Rising Talent',
      icon: <ArrowTrendingUpIcon className="w-3.5 h-3.5" />,
      earned: avg >= 4.5 && total >= 5,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'communicator',
      label: 'Communicator',
      icon: <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />,
      earned: ((breakdown as any)?.communication ?? 0) >= 4.7,
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      id: 'on_time',
      label: 'On-Time Pro',
      icon: <ClockIcon className="w-3.5 h-3.5" />,
      earned: ((breakdown as any)?.deadlines ?? 0) >= 4.7,
      color: 'text-violet-700 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-800',
    },
    {
      id: 'verified',
      label: '10+ Reviews',
      icon: <CheckBadgeIcon className="w-3.5 h-3.5" />,
      earned: total >= 10,
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
    },
    {
      id: 'quality',
      label: 'Quality Master',
      icon: <SparklesSolid className="w-3.5 h-3.5" />,
      earned: ((breakdown as any)?.quality ?? 0) >= 4.9,
      color: 'text-fuchsia-700 dark:text-fuchsia-400',
      bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
      border: 'border-fuchsia-200 dark:border-fuchsia-800',
    },
  ];

  const earnedCount = achievements.filter((a) => a.earned).length;

  // ── Initial load skeleton ────────────────────────────────────────────────────

  if (isInitialLoad) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      </FreelancerLayout>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <FreelancerLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

        {/* ── Page header ── */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 dark:from-amber-700 dark:via-amber-600 dark:to-yellow-600">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StarSolid className="w-4 h-4 text-white/70" />
                  <span className="text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-wider">
                    Your Reputation
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Reviews</h1>
                <p className="text-sm text-white/70 mt-1">
                  Track how companies rate your work and grow your reputation
                </p>
              </div>

              {/* Live score pill */}
              {total > 0 && (
                <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl self-start sm:self-auto shadow-inner">
                  <div className="text-center">
                    <p className="text-4xl font-black text-white leading-none">
                      {avg.toFixed(1)}
                    </p>
                    <Stars value={avg} size="sm" />
                    <p className="text-xs text-white/70 mt-1">avg score</p>
                  </div>
                  <div className="w-px h-12 bg-white/30" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-white leading-none">{total}</p>
                    <p className="text-xs text-white/70 mt-1">
                      review{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {earnedCount > 0 && (
                    <>
                      <div className="w-px h-12 bg-white/30" />
                      <div className="text-center">
                        <p className="text-3xl font-black text-white leading-none">
                          {earnedCount}
                        </p>
                        <p className="text-xs text-white/70 mt-1">badges</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ═══ Left sidebar ═══ */}
            <div className="space-y-5">

              {/* Overall score card */}
              <div className={cn(
                'rounded-2xl border p-6 shadow-sm',
                colorClasses.bg.primary,
                colorClasses.border.gray100,
              )}>
                <div className="flex items-center gap-2 mb-5">
                  <StarSolid className="w-4 h-4 text-amber-400" />
                  <h2 className={cn('text-sm font-bold', colorClasses.text.primary)}>Overall Rating</h2>
                </div>

                {/* Big score */}
                <div className="flex items-end gap-4 mb-5">
                  <span className={cn('text-6xl font-black leading-none', colorClasses.text.primary)}>
                    {avg > 0 ? avg.toFixed(1) : '—'}
                  </span>
                  <div className="pb-1.5 space-y-1.5">
                    <Stars value={avg} />
                    <p className={cn('text-xs', colorClasses.text.muted)}>
                      Based on {total} review{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <DistBar
                      key={star}
                      star={star}
                      count={starCounts[star] ?? 0}
                      total={total}
                    />
                  ))}
                </div>
              </div>

              {/* Detailed breakdown card */}
              {breakdown && total > 0 && (
                <div className={cn(
                  'rounded-2xl border p-6 shadow-sm',
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                )}>
                  <div className="flex items-center gap-2 mb-5">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                    <h2 className={cn('text-sm font-bold', colorClasses.text.primary)}>Detailed Breakdown</h2>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(breakdown).map(([key, val]) =>
                      (val as number) > 0 ? (
                        <BreakdownBar key={key} label={key} value={val as number} />
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Achievements card */}
              <div className={cn(
                'rounded-2xl border p-6 shadow-sm',
                colorClasses.bg.primary,
                colorClasses.border.gray100,
              )}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <TrophySolid className="w-4 h-4 text-amber-400" />
                    <h2 className={cn('text-sm font-bold', colorClasses.text.primary)}>Achievements</h2>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                    {earnedCount} / {achievements.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {achievements.map((a) => (
                    <AchievementBadge key={a.id} a={a} />
                  ))}
                </div>

                {earnedCount === 0 && (
                  <p className={cn('text-xs mt-4 leading-relaxed', colorClasses.text.muted)}>
                    Earn reviews and keep your ratings high to unlock achievements and improve your
                    ranking in the marketplace.
                  </p>
                )}
              </div>

              {/* Tips — only shown when reviews are low */}
              {total < 5 && (
                <div className="rounded-2xl border p-5 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/40">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      How to earn great reviews
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      { icon: '⚡', tip: 'Respond to messages within 24 hours' },
                      { icon: '📅', tip: 'Deliver before the deadline' },
                      { icon: '💡', tip: 'Ask for feedback after each project' },
                      { icon: '✨', tip: 'Go one step beyond what was asked' },
                    ].map(({ icon, tip }) => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <span className="mt-0.5 shrink-0">{icon}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ═══ Reviews list ═══ */}
            <div className="lg:col-span-2 space-y-4">

              {/* Section header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={cn('text-base font-bold', colorClasses.text.primary)}>All Reviews</h2>
                  {total > 0 && (
                    <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>
                      {reviews.length > 0
                        ? `Showing ${((page - 1) * 10) + 1}–${Math.min(page * 10, total)} of ${total}`
                        : `${total} total`}
                    </p>
                  )}
                </div>
                {reviewsLoading && (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Error */}
              {isError && (
                <div className={cn(
                  'rounded-2xl border p-8 text-center',
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                )}>
                  <p className={cn('text-sm', colorClasses.text.muted)}>
                    Failed to load reviews. Please refresh the page.
                  </p>
                </div>
              )}

              {/* Loading skeletons */}
              {reviewsLoading && !isError && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)}
                </div>
              )}

              {/* Empty state */}
              {!reviewsLoading && !isError && reviews.length === 0 && <EmptyState />}

              {/* Review list */}
              {!isError && !reviewsLoading && reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.map((review, i) => (
                    <ReviewCard key={review._id} review={review} idx={i} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border',
                      'transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
                      colorClasses.bg.primary,
                      colorClasses.border.gray100,
                      colorClasses.text.secondary,
                      'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400',
                    )}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page number pills */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, pagination.totalPages - 4));
                      const pn = start + i;
                      if (pn > pagination.totalPages) return null;
                      return (
                        <button
                          key={pn}
                          onClick={() => setPage(pn)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-xs font-bold border transition-all duration-150',
                            pn === page
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : cn(
                                  colorClasses.bg.primary,
                                  colorClasses.border.gray100,
                                  colorClasses.text.muted,
                                  'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400',
                                ),
                          )}
                        >
                          {pn}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border',
                      'transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
                      colorClasses.bg.primary,
                      colorClasses.border.gray100,
                      colorClasses.text.secondary,
                      'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400',
                    )}
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerMyReviewsPage;