/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job, Organization } from '@/services/jobService';
import { organizationService } from '@/services/organizationService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Briefcase, Users, TrendingUp, Plus, Target, MapPin, Calendar,
  ClipboardList, FileText, CheckCircle2, Clock, 
  Heart, Award, Shield, BarChart3, Filter, Download, RefreshCw, Mail,
  ShieldCheck, ChevronRight, UserCheck, FileCheck, Globe,
  HandHeart, Sparkles, Gift, Share2, Copy, MessageCircle,
  Send, X
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import { useVerification } from '@/hooks/useVerification';
import { cn } from '@/lib/utils';
import { colors, colorClasses } from '@/utils/color';
import { usePromoCode } from '@/hooks/usePromoCode';
import { motion, AnimatePresence } from 'framer-motion';
import { PromoCodeDashboard } from '@/components/layout/PromoCodeDashboard';

// ─── NEW: use the split tender hooks ─────────────────────────────────────────
import {
  useMyPostedFreelanceTenders,
} from '@/hooks/useFreelanceTender';
import {
  useMyPostedProfessionalTenders,
} from '@/hooks/useProfessionalTender';
import type {
  FreelanceTenderListItem,
  ProfessionalTenderListItem,
} from '@/types/tender.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralStats {
  code: string;
  usedCount: number;
  maxUses: number;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  rewardPoints: number;
  successRate: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function getTimeAgo(dateString: string | Date): string {
  const diffHours = Math.floor((Date.now() - new Date(dateString).getTime()) / 3_600_000);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
  return `${Math.floor(diffHours / 168)}w ago`;
}

function formatJobSalary(job: Job): string {
  if (!job.salary) {
    if (job.opportunityType === 'volunteer') return 'Volunteer';
    if (job.opportunityType === 'internship') return 'Stipend';
    return 'Negotiable';
  }
  const { min, max, currency = 'USD' } = job.salary;
  if (min && max) return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
  if (min) return `From ${formatCurrency(min, currency)}`;
  if (max) return `Up to ${formatCurrency(max, currency)}`;
  return 'Negotiable';
}

/** Budget from FreelanceTenderListItem */
function formatFreelanceBudget(t: FreelanceTenderListItem): string {
  const budget = (t as any).details?.budget ?? (t as any).budget;
  if (!budget) return 'Negotiable';
  const { min, max, currency = 'ETB' } = budget;
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min) return `${currency} ${min.toLocaleString()}+`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  return 'Negotiable';
}

/** Budget / financialCapacity from ProfessionalTenderListItem */
function formatProfBudget(t: ProfessionalTenderListItem): string {
  const min = (t as any).professionalSpecific?.financialCapacity?.minAnnualTurnover;
  if (min) return `Min $${(min / 1000).toFixed(0)}K turnover`;
  return 'Negotiable';
}

// ─── Badge configs ────────────────────────────────────────────────────────────

const JOB_STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  active: { label: 'Active', badge: 'bg-emerald-500 text-white border-transparent', icon: CheckCircle2 },
  draft: { label: 'Draft', badge: 'bg-amber-500  text-white border-transparent', icon: FileText },
  closed: { label: 'Closed', badge: 'bg-slate-500  text-white border-transparent', icon: Clock },
};

const JOB_TYPE_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  job: { label: 'Job', badge: 'bg-blue-500   text-white border-transparent', icon: Briefcase },
  volunteer: { label: 'Volunteer', badge: 'bg-teal-500   text-white border-transparent', icon: Heart },
  internship: { label: 'Internship', badge: 'bg-indigo-500 text-white border-transparent', icon: Award },
  training: { label: 'Training', badge: 'bg-purple-500 text-white border-transparent', icon: Target },
};

const TENDER_STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  draft: { label: 'Draft', badge: 'bg-amber-500  text-white border-transparent', icon: FileText },
  published: { label: 'Published', badge: 'bg-emerald-500 text-white border-transparent', icon: CheckCircle2 },
  locked: { label: 'Locked', badge: 'bg-blue-500   text-white border-transparent', icon: Shield },
  active: { label: 'Active', badge: 'bg-emerald-500 text-white border-transparent', icon: CheckCircle2 },
  deadline_reached: { label: 'Deadline', badge: 'bg-orange-500 text-white border-transparent', icon: Clock },
  revealed: { label: 'Revealed', badge: 'bg-purple-500 text-white border-transparent', icon: TrendingUp },
  closed: { label: 'Closed', badge: 'bg-indigo-500 text-white border-transparent', icon: Award },
};

function jobStatusCfg(s: string) { return JOB_STATUS_CONFIG[s] ?? JOB_STATUS_CONFIG.draft; }
function jobTypeCfg(t: string) { return JOB_TYPE_CONFIG[t] ?? JOB_TYPE_CONFIG.job; }
function tenderStatusCfg(s: string) { return TENDER_STATUS_CONFIG[s] ?? TENDER_STATUS_CONFIG.draft; }

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, colorHex, icon: Icon, onClick,
}: {
  label: string; value: string | number; sub?: string;
  colorHex: string; icon: any; onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      className={cn(
        'rounded-xl border p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all min-w-0',
        colorClasses.bg.primary, colorClasses.border.secondary,
        onClick && 'cursor-pointer'
      )}
      style={{ borderLeft: `4px solid ${colorHex}` }}
    >
      <div className="p-1.5 sm:p-2 rounded-lg shrink-0" style={{ backgroundColor: `${colorHex}18` }}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colorHex }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[10px] sm:text-xs font-medium truncate', colorClasses.text.muted)}>{label}</p>
        <p className={cn('text-lg sm:text-xl font-bold leading-tight truncate', colorClasses.text.primary)}>{value}</p>
        {sub && <p className={cn('text-[10px] sm:text-xs mt-0.5 truncate', colorClasses.text.muted)}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Recent Tender Row ────────────────────────────────────────────────────────

function FreelanceTenderRow({ t, href }: { t: FreelanceTenderListItem; href: string }) {
  const cfg = tenderStatusCfg(t.status);
  const StatusIcon = cfg.icon;
  return (
    <Link href={href} className="block">
      <div className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border transition-all',
        colorClasses.border.secondary, colorClasses.bg.primary,
        'hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/10'
      )}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/30">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary,
            'group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors')}>
            {t.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', cfg.badge)}>
              <StatusIcon className="w-2.5 h-2.5 mr-0.5 inline" />{cfg.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-500 text-white border-transparent">
              Freelance
            </Badge>
            {t.deadline && (
              <span className={cn('text-[10px] flex items-center', colorClasses.text.muted)}>
                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-[10px]', colorClasses.text.muted)}>{getTimeAgo((t as any).createdAt)}</p>
          <p className={cn('text-xs font-semibold mt-0.5', colorClasses.text.primary)}>{formatFreelanceBudget(t)}</p>
        </div>
      </div>
    </Link>
  );
}

function ProfTenderRow({ t, href }: { t: ProfessionalTenderListItem; href: string }) {
  const cfg = tenderStatusCfg(t.status);
  const StatusIcon = cfg.icon;
  const wf = (t as any).workflowType ?? 'open';
  return (
    <Link href={href} className="block">
      <div className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border transition-all',
        colorClasses.border.secondary, colorClasses.bg.primary,
        'hover:border-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-950/10'
      )}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-teal-100 dark:bg-teal-900/30">
          <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary,
            'group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors')}>
            {t.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', cfg.badge)}>
              <StatusIcon className="w-2.5 h-2.5 mr-0.5 inline" />{cfg.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-teal-500 text-white border-transparent">
              Professional
            </Badge>
            {wf === 'closed' && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-purple-500 text-white border-transparent">
                🔒 Sealed
              </Badge>
            )}
            {t.deadline && (
              <span className={cn('text-[10px] flex items-center', colorClasses.text.muted)}>
                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-[10px]', colorClasses.text.muted)}>{getTimeAgo((t as any).createdAt)}</p>
          <p className={cn('text-xs font-semibold mt-0.5', colorClasses.text.primary)}>{formatProfBudget(t)}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const OrganizationDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [shouldRedirectToProfile, setShouldRedirectToProfile] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const { verificationData, loading: verificationLoading } = useVerification();
  const { getStats, generateCode, copyToClipboard, loading: referralLoading } = usePromoCode();

  // ── Org profile ──────────────────────────────────────────────────────────────
  const { data: organization, isLoading: orgLoading, refetch: refetchOrg } = useQuery({
    queryKey: ['organizationProfile'],
    queryFn: async () => {
      try {
        return await organizationService.getMyOrganization();
      } catch (error: any) {
        if (error.message?.includes('Organization profile not found') ||
          error.response?.data?.message?.includes('Organization profile not found')) {
          setShouldRedirectToProfile(true);
          return null;
        }
        throw error;
      }
    },
    enabled: isAuthenticated && user?.role === 'organization',
    retry: false,
  });

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['organizationJobs'],
    queryFn: async () => {
      try { return await jobService.getOrganizationJobs(); }
      catch (error: any) {
        if (error.message?.includes('Organization profile not found')) {
          setShouldRedirectToProfile(true); return { data: [] };
        }
        throw error;
      }
    },
    enabled: isAuthenticated && user?.role === 'organization' && !shouldRedirectToProfile,
  });

  // ── NEW: Freelance tenders ───────────────────────────────────────────────────
  const {
    data: freeTendersData,
    isLoading: freeTendersLoading,
    refetch: refetchFreeTenders,
  } = useMyPostedFreelanceTenders(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'organization' && !shouldRedirectToProfile }
  );

  // ── NEW: Professional tenders ────────────────────────────────────────────────
  const {
    data: profTendersData,
    isLoading: profTendersLoading,
    refetch: refetchProfTenders,
  } = useMyPostedProfessionalTenders(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'organization' && !shouldRedirectToProfile }
  );

  const jobs: Job[] = jobsData?.data ?? [];
  const freeTenders: FreelanceTenderListItem[] = freeTendersData?.tenders ?? [];
  const profTenders: ProfessionalTenderListItem[] = profTendersData?.tenders ?? [];
  const allTenders = useMemo(() => [...freeTenders, ...profTenders], [freeTenders, profTenders]);

  // ── Redirect ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (shouldRedirectToProfile) {
      toast({ title: 'Profile Required', description: 'Please complete your organization profile.', variant: 'destructive' });
      router.push('/dashboard/organization/profile');
    }
  }, [shouldRedirectToProfile, router, toast]);

  useEffect(() => { if (organization) setOrganizationData(organization); }, [organization]);

  // ── Referral ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user?.role === 'organization' && !shouldRedirectToProfile) {
      loadReferralStats();
    }
  }, [isAuthenticated, user, shouldRedirectToProfile]);

  const loadReferralStats = async () => {
    try {
      const stats = await getStats(1);
      if (stats) setReferralStats({
        code: stats.referralCode.code,
        usedCount: stats.referralCode.usedCount,
        maxUses: stats.referralCode.maxUses,
        totalReferrals: stats.stats.totalReferrals,
        completedReferrals: stats.stats.completedReferrals,
        pendingReferrals: stats.stats.pendingReferrals,
        rewardPoints: stats.stats.rewardPoints,
        successRate: stats.stats.successRate,
      });
    } catch { /* ignore */ }
  };

  const handleGenerateReferralCode = async () => {
    setGeneratingCode(true);
    try {
      const data = await generateCode();
      if (data) { await loadReferralStats(); toast({ title: 'Referral code generated!' }); }
    } finally { setGeneratingCode(false); }
  };

  const handleCopy = async (text: string, field: string) => {
    if (await copyToClipboard(text)) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleRefreshAll = () => {
    refetchOrg(); refetchJobs(); refetchFreeTenders(); refetchProfTenders();
  };

  // ── Computed stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const draftJobs = jobs.filter(j => j.status === 'draft').length;
    const volunteerJobs = jobs.filter(j => j.opportunityType === 'volunteer').length;
    const internshipJobs = jobs.filter(j => j.opportunityType === 'internship').length;
    const totalJobApps = jobs.reduce((s, j) => s + (j.applicationCount || 0), 0);
    const totalJobViews = jobs.reduce((s, j) => s + (j.viewCount || 0), 0);

    const publishedFreeTenders = freeTenders.filter(t => t.status === 'published').length;
    const draftFreeTenders = freeTenders.filter(t => t.status === 'draft').length;
    const totalFreeApps = freeTenders.reduce((s, t) => s + ((t as any).applicationCount || 0), 0);
    const totalFreeViews = freeTenders.reduce((s, t) => s + ((t as any).metadata?.views || 0), 0);

    const publishedProfTenders = profTenders.filter(t => ['published', 'active', 'locked'].includes(t.status)).length;
    const draftProfTenders = profTenders.filter(t => t.status === 'draft').length;
    const totalProfBids = profTenders.reduce((s, t) => s + ((t as any).bidCount || 0), 0);
    const totalProfViews = profTenders.reduce((s, t) => s + ((t as any).metadata?.views || 0), 0);

    const totalTenders = freeTenders.length + profTenders.length;
    const publishedTenders = publishedFreeTenders + publishedProfTenders;
    const draftTenders = draftFreeTenders + draftProfTenders;
    const totalProposals = totalFreeApps + totalProfBids;
    const totalTenderViews = totalFreeViews + totalProfViews;

    const totalOpportunities = jobs.length + totalTenders;
    const totalEngagements = totalJobApps + totalProposals;

    const closedTenders = allTenders.filter(t => ['closed', 'revealed'].includes(t.status)).length;
    const completionRate = totalTenders > 0 ? (closedTenders / totalTenders) * 100 : 0;

    const impactScore = Math.min(100,
      totalEngagements * 0.4 +
      (totalJobViews + totalTenderViews) * 0.02 +
      completionRate * 0.4
    );

    return {
      totalJobs: jobs.length, activeJobs, draftJobs, volunteerJobs, internshipJobs,
      totalJobApps, totalJobViews,
      totalTenders, publishedTenders, draftTenders,
      freelanceTenders: freeTenders.length, professionalTenders: profTenders.length,
      totalProposals, totalTenderViews,
      totalOpportunities, totalEngagements, completionRate, impactScore,
    };
  }, [jobs, freeTenders, profTenders, allTenders]);

  // Recent items
  const recentJobs = jobs.slice(0, 3);
  const recentFreeTenders = freeTenders.slice(0, 2);
  const recentProfTenders = profTenders.slice(0, 2);
  const isLoading = orgLoading || jobsLoading || freeTendersLoading || profTendersLoading;

  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A2540]">
          <div className="text-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className={cn('text-sm', colorClasses.text.muted)}>Loading your dashboard…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (shouldRedirectToProfile) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A1628] transition-colors">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0A2540] border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">

              {/* Left: avatar + name */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 border-2 border-teal-200 dark:border-teal-800">
                  <AvatarImage src={organizationData?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold">
                    {organizationData?.name?.charAt(0) ?? 'O'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={cn('text-lg sm:text-xl lg:text-2xl font-bold truncate', colorClasses.text.darkNavy)}>
                      {organizationData?.name ?? 'Organization'} Dashboard
                    </h1>
                    {!verificationLoading && (
                      <VerificationBadge autoFetch size="sm" showText showTooltip />
                    )}
                  </div>
                  <p className={cn('text-xs sm:text-sm truncate', colorClasses.text.muted)}>
                    {organizationData?.mission ?? 'Manage your opportunities and create impact'}
                  </p>
                  {verificationData?.verificationStatus !== 'full' && (
                    <Link href="/dashboard/organization/verification" className="mt-0.5 inline-block">
                      <span className={cn('text-xs font-medium flex items-center gap-1', colorClasses.text.teal)}>
                        <ShieldCheck className="w-3 h-3" /> Complete Verification
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: actions — responsive grid on mobile, row on lg+ */}
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:shrink-0">
                {/* Primary create buttons */}
                <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-2">
                  <Link href="/dashboard/organization/jobs/create" className="w-full lg:w-auto">
                    <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap text-xs sm:text-sm">
                      <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                      <span className="sm:hidden">Opportunity</span>
                      <span className="hidden sm:inline">Create Opportunity</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/organization/my-tenders/create" className="w-full lg:w-auto">
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap text-xs sm:text-sm">
                      <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                      <span className="sm:hidden">Tender</span>
                      <span className="hidden sm:inline">Create Tender</span>
                    </Button>
                  </Link>
                </div>

                {/* Utility buttons row */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRefreshAll}
                    className="border-gray-300 dark:border-gray-600 shrink-0 text-xs sm:text-sm">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="ml-1 sm:ml-1.5">Refresh</span>
                  </Button>
                  {referralStats?.code ? (
                    <Button variant="outline" size="sm" onClick={() => setShowReferralModal(true)}
                      className="border-teal-300 dark:border-teal-700 flex-1 lg:flex-none text-xs sm:text-sm">
                      <Gift className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-teal-600 dark:text-teal-400" />
                      Refer
                      <Badge variant="secondary" className="ml-1 sm:ml-1.5 bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 text-[10px]">
                        {referralStats.usedCount}/{referralStats.maxUses}
                      </Badge>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleGenerateReferralCode}
                      disabled={generatingCode || referralLoading}
                      className="border-teal-300 dark:border-teal-700 flex-1 lg:flex-none text-xs sm:text-sm">
                      {generatingCode
                        ? <LoadingSpinner size="sm" className="mr-1 sm:mr-1.5" />
                        : <Gift className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-teal-600 dark:text-teal-400" />}
                      Referral
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-4 sm:space-y-5">

          {/* ── Top Stats Row ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard label="Impact Score" value={stats.impactScore.toFixed(0)} sub={`${stats.completionRate.toFixed(0)}% completion`} colorHex={colors.teal} icon={Sparkles} />
            <StatCard label="Opportunities" value={stats.totalOpportunities} sub={`${stats.activeJobs + stats.publishedTenders} active`} colorHex={colors.blue} icon={Target} />
            <StatCard label="Engagements" value={formatNumber(stats.totalEngagements)} sub={`${stats.totalJobApps} + ${stats.totalProposals}`} colorHex={colors.emerald} icon={Users} />
            <StatCard
              label="Verification"
              value={verificationData?.verificationStatus === 'full' ? 'Verified' : verificationData?.verificationStatus === 'partial' ? 'Partial' : 'Pending'}
              colorHex={verificationData?.verificationStatus === 'full' ? colors.green : verificationData?.verificationStatus === 'partial' ? colors.amber : colors.slate}
              icon={ShieldCheck}
            />
          </div>

          {/* ── Tender Quick Stats ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard label="Total Tenders" value={stats.totalTenders} sub="All time" colorHex={colors.indigo} icon={ClipboardList} />
            <StatCard label="Published" value={stats.publishedTenders} sub="Live now" colorHex={colors.emerald} icon={CheckCircle2} />
            <StatCard label="Freelance" value={stats.freelanceTenders} sub="Projects" colorHex={colors.blue} icon={Users} />
            <StatCard label="Professional" value={stats.professionalTenders} sub="Procurement" colorHex={colors.teal} icon={Briefcase} />
          </div>

          {/* ── Referral Banner ───────────────────────────────────────────────── */}
          {referralStats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className={cn(
                'rounded-xl border p-3 sm:p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4',
                colorClasses.bg.primary, colorClasses.border.secondary
              )}>
                {/* Code section */}
                <div className="flex items-center gap-3 sm:shrink-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 shrink-0">
                    <Gift className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-xs font-medium', colorClasses.text.muted)}>Referral Code</p>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-lg font-mono font-bold', colorClasses.text.teal)}>{referralStats.code}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(referralStats.code, 'banner')} className="p-1 h-7 w-7 shrink-0">
                        {copiedField === 'banner' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats — 2×2 on mobile, row on sm+ */}
                <div className="grid grid-cols-2 sm:flex sm:flex-1 sm:justify-around gap-3 sm:gap-0 text-center">
                  {[
                    { v: `${referralStats.usedCount}/${referralStats.maxUses}`, l: 'Used' },
                    { v: referralStats.totalReferrals, l: 'Referrals' },
                    { v: referralStats.completedReferrals, l: 'Completed' },
                    { v: referralStats.rewardPoints, l: 'Points' },
                  ].map(s => (
                    <div key={s.l} className="sm:px-2">
                      <p className={cn('text-sm font-bold', colorClasses.text.primary)}>{s.v}</p>
                      <p className={cn('text-[10px]', colorClasses.text.muted)}>{s.l}</p>
                    </div>
                  ))}
                </div>

                <Button size="sm" onClick={() => setShowReferralModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto shrink-0">
                  <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Main Tabs ────────────────────────────────────────────────────── */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-5">
            <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="flex w-max min-w-full bg-transparent p-0 h-auto gap-0 rounded-none">
                {[
                  { value: 'overview', label: 'Overview' },
                  { value: 'opportunities', label: `Jobs (${stats.totalJobs})` },
                  { value: 'tenders', label: `Tenders (${stats.totalTenders})` },
                  { value: 'referrals', label: 'Referrals' },
                  { value: 'impact', label: 'Impact' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap rounded-none border-b-2 border-transparent',
                      'text-gray-500 dark:text-gray-400',
                      'data-[state=active]:border-[#F1BB03] data-[state=active]:text-[#B45309] dark:data-[state=active]:text-[#F1BB03]',
                      'data-[state=active]:bg-[#F1BB03]/5',
                      'hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
                      'bg-transparent shrink-0'
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── Overview Tab ─────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

                {/* Recent Opportunities */}
                <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HandHeart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>
                          Recent Opportunities
                        </CardTitle>
                      </div>
                      <Link href="/dashboard/organization/jobs">
                        <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>
                          View All <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {recentJobs.length > 0 ? recentJobs.map((job: Job) => {
                      const sCfg = jobStatusCfg(job.status);
                      const tCfg = jobTypeCfg(job.opportunityType ?? 'job');
                      const SIcon = sCfg.icon;
                      return (
                        <Link key={job._id} href={`/dashboard/organization/jobs/${job._id}`} className="block">
                          <div className={cn(
                            'group flex items-start gap-3 p-3 rounded-lg border transition-all',
                            colorClasses.border.secondary, colorClasses.bg.primary,
                            'hover:border-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-950/10'
                          )}>
                            <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                              <tCfg.icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary,
                                'group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors')}>
                                {job.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', sCfg.badge)}>
                                  <SIcon className="w-2.5 h-2.5 mr-0.5 inline" />{sCfg.label}
                                </Badge>
                                <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', tCfg.badge)}>{tCfg.label}</Badge>
                                {job.location?.city && (
                                  <span className={cn('text-[10px] flex items-center', colorClasses.text.muted)}>
                                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                                    <span className="truncate max-w-[80px]">{job.location.city}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={cn('text-[10px]', colorClasses.text.muted)}>{getTimeAgo(job.createdAt)}</p>
                              <p className={cn('text-xs font-semibold mt-0.5', colorClasses.text.primary)}>{formatJobSalary(job)}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    }) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <HandHeart className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No opportunities yet</p>
                        <Link href="/dashboard/organization/jobs/create">
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="w-3 h-3 mr-1.5" /> Create Opportunity
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Tenders */}
                <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>
                          Recent Tenders
                        </CardTitle>
                      </div>
                      <Link href="/dashboard/organization/my-tenders">
                        <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>
                          View All <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {recentFreeTenders.length === 0 && recentProfTenders.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <ClipboardList className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No tenders yet</p>
                        <Link href="/dashboard/organization/my-tenders/create">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-3 h-3 mr-1.5" /> Create Tender
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        {recentFreeTenders.map(t => (
                          <FreelanceTenderRow
                            key={t._id}
                            t={t}
                            href={`/dashboard/organization/freelance-tenders/${t._id}`}
                          />
                        ))}
                        {recentProfTenders.map(t => (
                          <ProfTenderRow
                            key={t._id}
                            t={t}
                            href={`/dashboard/organization/tenders/${t._id}`}
                          />
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Impact Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 sm:gap-4">
                <StatCard label="Volunteer Positions" value={stats.volunteerJobs} colorHex={colors.teal} icon={Heart} />
                <StatCard label="Internships" value={stats.internshipJobs} colorHex={colors.indigo} icon={Award} />
                <StatCard label="Freelance Projects" value={stats.freelanceTenders} colorHex={colors.blue} icon={Users} />
                <Card className={cn('border-l-4 border border-gray-200 dark:border-gray-700', colorClasses.bg.primary)}>
                  <CardContent className="p-4 space-y-2">
                    <p className={cn('text-xs font-medium', colorClasses.text.muted)}>Verification Progress</p>
                    {[
                      { label: 'Profile', key: 'profileVerified', icon: UserCheck },
                      { label: 'Documents', key: 'documentsVerified', icon: FileCheck },
                      { label: 'Social', key: 'socialVerified', icon: Globe },
                    ].map(({ label, key, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className={cn('flex items-center gap-1', colorClasses.text.muted)}>
                          <Icon className="w-3 h-3" />{label}
                        </span>
                        <span className={cn('font-bold', (verificationData as any)?.verificationDetails?.[key] ? colorClasses.text.emerald : colorClasses.text.rose)}>
                          {(verificationData as any)?.verificationDetails?.[key] ? '✓' : '○'}
                        </span>
                      </div>
                    ))}
                    {verificationData?.verificationStatus !== 'full' && (
                      <Link href="/dashboard/organization/verification" className="block pt-1">
                        <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs h-7">
                          Complete Verification
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Opportunities Tab ─────────────────────────────────────────── */}
            <TabsContent value="opportunities" className="space-y-4">
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>
                      All Opportunities ({stats.totalJobs})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs border-gray-300 dark:border-gray-600">
                        <Filter className="w-3 h-3 mr-1.5" /><span className="hidden sm:inline">Filter</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs border-gray-300 dark:border-gray-600">
                        <Download className="w-3 h-3 mr-1.5" /><span className="hidden sm:inline">Export</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {jobs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={cn(colorClasses.bg.secondary)}>
                          <tr>
                            {['Opportunity', 'Type', 'Status', 'Apps', 'Views', 'Compensation'].map((h, i) => (
                              <th key={h} className={cn(
                                'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                                colorClasses.text.muted,
                                i > 0 && i < 3 && 'hidden sm:table-cell',
                                i >= 3 && i < 4 && 'hidden md:table-cell',
                                i >= 4 && i < 5 && 'hidden lg:table-cell',
                                i >= 5 && 'hidden xl:table-cell',
                              )}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-800', colorClasses.bg.primary)}>
                          {jobs.map((job: Job) => {
                            const tCfg = jobTypeCfg(job.opportunityType ?? 'job');
                            const sCfg = jobStatusCfg(job.status);
                            return (
                              <tr key={job._id} className="hover:bg-teal-50/40 dark:hover:bg-teal-950/10 transition-colors">
                                <td className="px-4 py-3">
                                  <Link href={`/dashboard/organization/jobs/${job._id}`}
                                    className={cn('text-sm font-medium block truncate max-w-[200px]', colorClasses.text.primary,
                                      'hover:text-teal-600 dark:hover:text-teal-400 transition-colors')}>
                                    {job.title}
                                  </Link>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <Badge variant="outline" className={cn('text-xs', tCfg.badge)}>{tCfg.label}</Badge>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <Badge variant="outline" className={cn('text-xs', sCfg.badge)}>{sCfg.label}</Badge>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <span className={cn('text-sm', colorClasses.text.muted)}>{job.applicationCount ?? 0}</span>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  <span className={cn('text-sm', colorClasses.text.muted)}>{job.viewCount ?? 0}</span>
                                </td>
                                <td className="px-4 py-3 hidden xl:table-cell">
                                  <span className={cn('text-sm font-medium', colorClasses.text.primary)}>{formatJobSalary(job)}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3 p-4">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <HandHeart className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className={cn('text-base font-semibold', colorClasses.text.primary)}>No opportunities yet</p>
                      <p className={cn('text-sm', colorClasses.text.muted)}>Create jobs, volunteer positions, or internships</p>
                      <Link href="/dashboard/organization/jobs/create">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                          <Plus className="w-4 h-4 mr-2" /> Create Opportunity
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tenders Tab ──────────────────────────────────────────────── */}
            <TabsContent value="tenders" className="space-y-4">
              {/* Freelance Tenders */}
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-blue-500" />
                      <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>
                        Freelance Tenders ({freeTenders.length})
                      </CardTitle>
                    </div>
                    <Link href="/dashboard/organization/my-tenders?tab=freelance">
                      <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>
                        Manage All <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {freeTenders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                        <thead className={colorClasses.bg.secondary}>
                          <tr>
                            {['Title', 'Status', 'Budget', 'Applications', 'Deadline'].map((h, i) => (
                              <th key={h} className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', colorClasses.text.muted,
                                i >= 2 && i < 3 && 'hidden md:table-cell',
                                i >= 3 && i < 4 && 'hidden lg:table-cell',
                                i >= 4 && 'hidden xl:table-cell',
                              )}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-800', colorClasses.bg.primary)}>
                          {freeTenders.map(t => {
                            const cfg = tenderStatusCfg(t.status);
                            return (
                              <tr key={t._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                                <td className="px-4 py-3">
                                  <Link href={`/dashboard/organization/freelance-tenders/${t._id}`}
                                    className={cn('text-sm font-medium block truncate max-w-[220px]', colorClasses.text.primary,
                                      'hover:text-blue-600 dark:hover:text-blue-400')}>
                                    {t.title}
                                  </Link>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className={cn('text-xs', cfg.badge)}>{cfg.label}</Badge>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <span className={cn('text-sm', colorClasses.text.primary)}>{formatFreelanceBudget(t)}</span>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  <span className={cn('text-sm', colorClasses.text.muted)}>{(t as any).applicationCount ?? 0}</span>
                                </td>
                                <td className="px-4 py-3 hidden xl:table-cell">
                                  <span className={cn('text-xs', colorClasses.text.muted)}>
                                    {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3 p-4">
                      <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No freelance tenders</p>
                      <Link href="/dashboard/organization/my-tenders/create">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="w-3 h-3 mr-1.5" /> Create Freelance Tender
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Tenders */}
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-teal-500" />
                      <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>
                        Professional Tenders ({profTenders.length})
                      </CardTitle>
                    </div>
                    <Link href="/dashboard/organization/my-tenders?tab=professional">
                      <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>
                        Manage All <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {profTenders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                        <thead className={colorClasses.bg.secondary}>
                          <tr>
                            {['Title', 'Status', 'Type', 'Bids', 'Deadline'].map((h, i) => (
                              <th key={h} className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', colorClasses.text.muted,
                                i >= 2 && i < 3 && 'hidden sm:table-cell',
                                i >= 3 && i < 4 && 'hidden lg:table-cell',
                                i >= 4 && 'hidden xl:table-cell',
                              )}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-800', colorClasses.bg.primary)}>
                          {profTenders.map(t => {
                            const cfg = tenderStatusCfg(t.status);
                            const wf = (t as any).workflowType ?? 'open';
                            return (
                              <tr key={t._id} className="hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="min-w-0">
                                    <Link href={`/dashboard/organization/tenders/${t._id}`}
                                      className={cn('text-sm font-medium block truncate max-w-[220px]', colorClasses.text.primary,
                                        'hover:text-teal-600 dark:hover:text-teal-400')}>
                                      {t.title}
                                    </Link>
                                    {(t as any).referenceNumber && (
                                      <span className={cn('text-[10px] font-mono', colorClasses.text.muted)}>
                                        {(t as any).referenceNumber}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className={cn('text-xs', cfg.badge)}>{cfg.label}</Badge>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <Badge variant="outline" className={cn('text-xs',
                                    wf === 'closed' ? 'bg-purple-500 text-white border-transparent' : 'bg-teal-500 text-white border-transparent')}>
                                    {wf === 'closed' ? '🔒 Sealed' : 'Open'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  <span className={cn('text-sm', colorClasses.text.muted)}>{(t as any).bidCount ?? 0}</span>
                                </td>
                                <td className="px-4 py-3 hidden xl:table-cell">
                                  <span className={cn('text-xs', colorClasses.text.muted)}>
                                    {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3 p-4">
                      <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No professional tenders</p>
                      <Link href="/dashboard/organization/my-tenders/create">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                          <Plus className="w-3 h-3 mr-1.5" /> Create Professional Tender
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Referrals Tab ─────────────────────────────────────────────── */}
            <TabsContent value="referrals" className="space-y-4">
              <div className={cn('rounded-xl border p-4 sm:p-6', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <PromoCodeDashboard />
              </div>
            </TabsContent>

            {/* ── Impact Tab ────────────────────────────────────────────────── */}
            <TabsContent value="impact" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Engagement Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    {[
                      { label: 'Job Applications', value: stats.totalJobApps, color: 'from-teal-500 to-teal-600', textColor: colorClasses.text.teal, pct: (stats.totalJobApps / Math.max(stats.totalEngagements, 1)) * 100 },
                      { label: 'Tender Proposals', value: stats.totalProposals, color: 'from-indigo-500 to-indigo-600', textColor: colorClasses.text.indigo, pct: (stats.totalProposals / Math.max(stats.totalEngagements, 1)) * 100 },
                      { label: 'Total Views', value: formatNumber(stats.totalJobViews + stats.totalTenderViews), color: 'from-green-500 to-green-600', textColor: colorClasses.text.emerald, pct: Math.min(100, (stats.totalJobViews + stats.totalTenderViews) / 100) },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className={cn('text-sm', colorClasses.text.muted)}>{m.label}</span>
                          <span className={cn('text-sm font-bold', m.textColor)}>{m.value}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={cn('h-full bg-gradient-to-r rounded-full transition-all', m.color)} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Verification Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    {[
                      { label: 'Verification Score', value: verificationData?.verificationStatus === 'full' ? '100%' : verificationData?.verificationStatus === 'partial' ? '50%' : '0%', bg: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20', icon: ShieldCheck, iconColor: 'text-teal-500' },
                      { label: 'Engagement Boost', value: verificationData?.verificationStatus === 'full' ? '3x' : verificationData?.verificationStatus === 'partial' ? '2x' : '1x', bg: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20', icon: TrendingUp, iconColor: 'text-indigo-500' },
                      { label: 'Trust Level', value: verificationData?.verificationStatus === 'full' ? 'High' : verificationData?.verificationStatus === 'partial' ? 'Medium' : 'Low', bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20', icon: Award, iconColor: 'text-green-500' },
                    ].map(m => (
                      <div key={m.label} className={cn('p-3 rounded-lg bg-gradient-to-r flex items-center justify-between', m.bg)}>
                        <div>
                          <p className="text-xl font-bold" style={{ color: 'inherit' }}>{m.value}</p>
                          <p className={cn('text-xs', colorClasses.text.muted)}>{m.label}</p>
                        </div>
                        <m.icon className={cn('w-6 h-6', m.iconColor)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { label: 'Messages', icon: Mail, color: 'teal', href: '#' },
                      { label: 'Export', icon: Download, color: 'indigo', href: '#' },
                      { label: 'Analytics', icon: BarChart3, color: 'purple', href: '#' },
                      { label: 'Verification', icon: ShieldCheck, color: 'teal', href: '/dashboard/organization/verification' },
                    ].map(a => (
                      <Link key={a.label} href={a.href}>
                        <Button variant="outline" className={cn(
                          'w-full h-auto py-4 flex flex-col items-center gap-2',
                          'border-gray-200 dark:border-gray-700',
                          `hover:border-${a.color}-400 hover:bg-${a.color}-50/30 dark:hover:bg-${a.color}-950/10`,
                          'transition-all'
                        )}>
                          <a.icon className={`w-5 h-5 text-${a.color}-600 dark:text-${a.color}-400`} />
                          <span className={cn('text-xs', colorClasses.text.muted)}>{a.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ── Bottom Impact Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 sm:gap-4">
            {[
              { value: stats.volunteerJobs + stats.internshipJobs, label: 'Impact Opportunities', sub: `${stats.volunteerJobs} volunteer + ${stats.internshipJobs} internship`, gradient: 'from-teal-500 to-teal-600', icon: Heart },
              { value: stats.publishedTenders, label: 'Active Tenders', sub: `${stats.freelanceTenders} freelance + ${stats.professionalTenders} professional`, gradient: 'from-indigo-500 to-indigo-600', icon: ClipboardList },
              { value: formatNumber(stats.totalEngagements), label: 'Total Impact', sub: `${stats.totalEngagements > 0 && stats.totalOpportunities > 0 ? ((stats.totalEngagements / stats.totalOpportunities) * 100).toFixed(1) : 0}% engagement rate`, gradient: 'from-green-500 to-green-600', icon: Users },
              { value: referralStats?.totalReferrals ?? 0, label: 'Referrals Made', sub: `${referralStats?.rewardPoints ?? 0} points earned`, gradient: 'from-purple-500 to-purple-600', icon: Gift, onClick: () => setShowReferralModal(true) },
            ].map(c => (
              <motion.div
                key={c.label}
                whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                onClick={c.onClick}
                className={cn('rounded-xl p-4 sm:p-5 text-white bg-gradient-to-br transition-all', c.gradient, c.onClick && 'cursor-pointer')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold">{c.value}</div>
                  <c.icon className="w-7 h-7 opacity-60" />
                </div>
                <p className="text-sm font-semibold opacity-95">{c.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Referral Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showReferralModal && referralStats && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setShowReferralModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 sm:p-6 shadow-2xl',
                colorClasses.bg.primary
              )}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle — mobile only */}
              <div className="flex justify-center mb-4 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              <div className="flex items-center justify-between mb-5">
                <h3 className={cn('text-lg font-bold', colorClasses.text.primary)}>Share Referral Code</h3>
                <button onClick={() => setShowReferralModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 -mr-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', colorClasses.text.muted)}>Your Code</label>
                  <div className="flex items-center gap-2">
                    <code className={cn('flex-1 px-4 py-3 rounded-xl font-mono text-xl font-bold', colorClasses.bg.secondary, colorClasses.text.primary)}>
                      {referralStats.code}
                    </code>
                    <Button variant="outline" onClick={() => handleCopy(referralStats.code, 'modal')} className="p-3 shrink-0 min-h-[44px]">
                      {copiedField === 'modal' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', colorClasses.text.muted)}>Share Link</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralStats.code}`}
                      className={cn('flex-1 px-3 py-2 rounded-xl text-xs min-w-0', colorClasses.bg.secondary, colorClasses.text.muted)} />
                    <Button variant="outline" onClick={() => handleCopy(`${window.location.origin}/register?ref=${referralStats.code}`, 'link')} className="p-2.5 shrink-0 min-h-[44px]">
                      {copiedField === 'link' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'WhatsApp', color: 'bg-green-600 hover:bg-green-700', icon: MessageCircle, url: `https://wa.me/?text=${encodeURIComponent(`Use referral code: ${referralStats.code}`)}` },
                    { label: 'Telegram', color: 'bg-blue-500 hover:bg-blue-600', icon: Send, url: `https://t.me/share/url?text=${encodeURIComponent(`Referral code: ${referralStats.code}`)}` },
                    { label: 'Email', color: 'bg-gray-600 hover:bg-gray-700', icon: Mail, url: `mailto:?subject=Join&body=${encodeURIComponent(`Code: ${referralStats.code}`)}` },
                  ].map(s => (
                    <button key={s.label}
                      onClick={() => window.open(s.url)}
                      className={cn('flex flex-col items-center gap-1.5 py-3 rounded-xl text-white min-h-[60px] transition-colors', s.color)}>
                      <s.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowReferralModal(false)}
                  className={cn('w-full py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                    colorClasses.bg.secondary, colorClasses.text.muted,
                    'hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default OrganizationDashboard;