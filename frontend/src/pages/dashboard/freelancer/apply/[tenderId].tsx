/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/apply/[tenderId].tsx
// Next.js Pages Router — no 'use client', no useParams.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { NextPage } from 'next';
import { useQuery } from '@tanstack/react-query';

import api from '@/lib/axios';

import { useMyProposalForTender, useWithdrawProposal } from '@/hooks/useProposal';
import { ProposalForm } from '@/components/proposals/ProposalForm';
import { DraftBanner } from '@/components/proposals/DraftBanner';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';

import type { ProposalFreelancerProfile } from '@/services/proposalService';

// ─── Types ─────────────────────────────────────────────────────────────────
interface TenderOwnerEntity {
  _id: string;
  name: string;
  logo?: string;
}

interface TenderDetail {
  _id: string;
  title: string;
  description?: string;
  status: string;
  deadline: string;
  skillsRequired?: string[];
  owner: string | { _id: string };
  ownerEntity?: string | TenderOwnerEntity;
  ownerEntityModel?: 'Company' | 'Organization';
  ownerRole?: 'company' | 'organization';
  details?: {
    budget?: { min: number; max: number; currency: string };
    engagementType?: string;
    screeningQuestions?: Array<{ question: string; required: boolean }>;
  };
  briefDescription?: string;
  procurementCategory?: string;
  maxApplications?: number;
  publishedAt?: string;
  isDeleted?: boolean;
}

interface ProfileData {
  user: { _id: string; name: string; email: string; avatar?: string; role: string };
  freelancerProfile: ProposalFreelancerProfile;
}

// ─── Inline hooks ─────────────────────────────────────────────────────────
function useTenderById(tenderId: string | undefined) {
  return useQuery<TenderDetail>({
    queryKey: ['freelance-tender', tenderId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: TenderDetail }>(
        `/freelance-tenders/${tenderId}`
      );
      return res.data.data;
    },
    enabled: !!tenderId,
    staleTime: 60_000,
  });
}

function useMyFreelancerProfile() {
  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ['freelancer', 'my-profile'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ProfileData }>(
        '/freelancer/profile'
      );
      return res.data.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    freelancerProfile: data?.freelancerProfile ?? null,
    user: data?.user ?? null,
    isLoading,
  };
}

// ─── UI helpers ────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl ${colorClasses.bg.gray100} ${className}`} />
  );
}

function TenderClosedState({ title }: { title?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-5xl">🔒</span>
      <h2 className={`text-xl font-bold ${colorClasses.text.primary}`}>
        {title ? `"${title}"` : 'This tender'} is no longer accepting proposals
      </h2>
      <p className={`max-w-md text-sm ${colorClasses.text.muted}`}>
        The deadline has passed or the tender has been closed.
      </p>
      <Link
        href="/freelancer/tenders"
        className={`mt-2 rounded-xl px-6 py-3 text-sm font-semibold text-white ${colorClasses.bg.goldenMustard} hover:opacity-90 transition-opacity`}
      >
        Browse Open Tenders
      </Link>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-5xl">🔍</span>
      <h2 className={`text-xl font-bold ${colorClasses.text.primary}`}>Tender not found</h2>
      <Link
        href="/freelancer/tenders"
        className={`text-sm font-medium ${colorClasses.text.goldenMustard} underline-offset-2 hover:underline`}
      >
        Back to tenders
      </Link>
    </div>
  );
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  const label =
    days <= 0 ? 'Expired' :
      days === 1 ? '1 day left' :
        days <= 7 ? `${days} days left` :
          new Date(deadline).toLocaleDateString('en-ET', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${days <= 3
        ? `${colorClasses.bg.redLight} ${colorClasses.text.red}`
        : `${colorClasses.bg.amberLight} ${colorClasses.text.amber}`
      }`}>
      🕐 {label}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
const ApplyPage: NextPage = () => {
  const router = useRouter();
  const tenderId = router.query.tenderId as string | undefined;
  useResponsive();

  const { data: tender, isLoading: tenderLoading } = useTenderById(tenderId);
  const { data: draftData, isLoading: draftLoading } = useMyProposalForTender(tenderId ?? '');
  const { freelancerProfile, isLoading: profileLoading } = useMyFreelancerProfile();
  const withdrawMutation = useWithdrawProposal();

  const [discarding, setDiscarding] = useState(false);
  const [useDraft, setUseDraft] = useState(true);

  // Redirect if a final (non-draft) submission already exists
  useEffect(() => {
    if (draftData && !draftData.isDraft) {
      router.replace(`/dashboard/freelancer/proposals/${draftData._id}`);
    }
  }, [draftData, router]);

  const isLoading = !router.isReady || tenderLoading || draftLoading || profileLoading;

  // Loading skeleton
  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className={`min-h-screen ${colorClasses.bg.primary} px-4 py-8`}>
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  if (!tender) {
    return (
      <FreelancerLayout>
        <NotFoundState />
      </FreelancerLayout>
    );
  }

  const isExpired = tender.deadline && new Date(tender.deadline) <= new Date();
  const isClosed = tender.status !== 'published';

  if (isExpired || isClosed) {
    return (
      <FreelancerLayout>
        <TenderClosedState title={tender.title} />
      </FreelancerLayout>
    );
  }

  const existingDraft = useDraft && draftData?.isDraft ? draftData : null;

  const ownerEntity: TenderOwnerEntity | null =
    tender.ownerEntity && typeof tender.ownerEntity === 'object'
      ? tender.ownerEntity
      : null;
  const ownerName = ownerEntity?.name ?? '';
  const ownerLogo = ownerEntity?.logo ?? null;

  const handleSuccess = (proposalId: string) => {
    router.push(`/dashboard/freelancer/proposals/${proposalId}`);
  };

  const handleDiscard = async () => {
    if (!existingDraft) return;
    setDiscarding(true);
    try {
      await withdrawMutation.mutateAsync(existingDraft._id);
      setUseDraft(false);
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <FreelancerLayout>
      <div className={`min-h-screen ${colorClasses.bg.primary}`}>
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <Link
              href="/freelancer/tenders"
              className={`${colorClasses.text.muted} hover:underline underline-offset-2`}
            >
              Tenders
            </Link>
            <span className={colorClasses.text.muted}>/</span>
            <Link
              href={`/freelancer/tenders/${tenderId}`}
              className={`max-w-[140px] sm:max-w-[220px] truncate ${colorClasses.text.muted} hover:underline underline-offset-2`}
            >
              {tender.title}
            </Link>
            <span className={colorClasses.text.muted}>/</span>
            <span className={`font-medium ${colorClasses.text.primary}`}>Apply</span>
          </nav>

          {/* Tender header card */}
          <div className={`mb-5 rounded-2xl border p-4 shadow-sm ${colorClasses.border.secondary} ${colorClasses.bg.primary}`}>
            <div className="flex items-start gap-3">
              {/* Logo */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${colorClasses.border.secondary} ${colorClasses.bg.gray100}`}>
                {ownerLogo
                  ? <img src={ownerLogo} alt={ownerName} className="h-full w-full object-cover" />
                  : <span className="text-xl">🏢</span>
                }
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h1 className={`text-sm sm:text-base font-bold leading-tight break-words ${colorClasses.text.primary}`}>
                  {tender.title}
                </h1>
                {ownerName && (
                  <p className={`mt-0.5 text-xs ${colorClasses.text.muted}`}>{ownerName}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {tender.deadline && <DeadlineBadge deadline={tender.deadline} />}
                  {tender.details?.budget && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses.bg.indigoLight} ${colorClasses.text.indigo}`}>
                      {tender.details.budget.min != null ? tender.details.budget.min.toLocaleString() : '—'}{'–'}{tender.details.budget.max != null ? tender.details.budget.max.toLocaleString() : '—'}{' '}{tender.details.budget.currency ?? ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Draft banner */}
          {existingDraft && (
            <div className="mb-5">
              <DraftBanner
                draft={existingDraft}
                onContinue={() => setUseDraft(true)}
                onDiscard={handleDiscard}
                isDiscarding={discarding}
              />
            </div>
          )}

          {/* ProposalForm */}
          <ProposalForm
            tender={tender as any}
            freelancerProfile={freelancerProfile}
            initialDraft={existingDraft}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default ApplyPage;