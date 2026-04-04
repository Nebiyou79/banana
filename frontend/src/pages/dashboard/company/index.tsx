/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { companyService } from '@/services/companyService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Briefcase, Users, TrendingUp, Plus, Target, MapPin, 
  ClipboardList, FileText, CheckCircle2, Clock, 
  Heart, Award, Shield, Filter, Download, RefreshCw,
  ShieldCheck, ChevronRight,
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
import { motion } from 'framer-motion';

// ─── NEW: use the split tender hooks ─────────────────────────────────────────
import { useMyPostedFreelanceTenders } from '@/hooks/useFreelanceTender';
import { useMyPostedProfessionalTenders } from '@/hooks/useProfessionalTender';
import type { FreelanceTenderListItem, ProfessionalTenderListItem } from '@/types/tender.types';
import { PromoCodeDashboard } from '@/components/layout/PromoCodeDashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function formatCurrency(a: number, c = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(a); }
  catch { return `${a.toLocaleString()} ${c}`; }
}
function getTimeAgo(d: string | Date) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  if (h < 168) return `${Math.floor(h / 24)}d ago`;
  return `${Math.floor(h / 168)}w ago`;
}
function formatJobSalary(job: Job) {
  if (!job.salary) return 'Negotiable';
  const { min, max, currency = 'USD' } = job.salary;
  if (min && max) return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
  if (min) return `From ${formatCurrency(min, currency)}`;
  if (max) return `Up to ${formatCurrency(max, currency)}`;
  return 'Negotiable';
}
function formatFreelanceBudget(t: FreelanceTenderListItem) {
  const b = (t as any).details?.budget ?? (t as any).budget;
  if (!b) return 'Negotiable';
  const { min, max, currency = 'ETB' } = b;
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min) return `${currency} ${min.toLocaleString()}+`;
  return 'Negotiable';
}
function formatProfBudget(t: ProfessionalTenderListItem) {
  const min = (t as any).professionalSpecific?.financialCapacity?.minAnnualTurnover;
  return min ? `Min $${(min / 1000).toFixed(0)}K` : 'Negotiable';
}

// ─── Badge configs ────────────────────────────────────────────────────────────

const JOB_STATUS: Record<string, { label: string; badge: string; icon: any }> = {
  active: { label: 'Active', badge: 'bg-emerald-500 text-white border-transparent', icon: CheckCircle2 },
  draft: { label: 'Draft', badge: 'bg-amber-500  text-white border-transparent', icon: FileText },
  closed: { label: 'Closed', badge: 'bg-slate-500  text-white border-transparent', icon: Clock },
};
const JOB_TYPE: Record<string, { label: string; badge: string; icon: any }> = {
  job: { label: 'Job', badge: 'bg-blue-500   text-white border-transparent', icon: Briefcase },
  volunteer: { label: 'Volunteer', badge: 'bg-teal-500   text-white border-transparent', icon: Heart },
  internship: { label: 'Internship', badge: 'bg-indigo-500 text-white border-transparent', icon: Award },
};
const TENDER_STATUS: Record<string, { label: string; badge: string; icon: any }> = {
  draft: { label: 'Draft', badge: 'bg-amber-500  text-white border-transparent', icon: FileText },
  published: { label: 'Published', badge: 'bg-emerald-500 text-white border-transparent', icon: CheckCircle2 },
  locked: { label: 'Locked', badge: 'bg-blue-500   text-white border-transparent', icon: Shield },
  active: { label: 'Active', badge: 'bg-emerald-500 text-white border-transparent', icon: CheckCircle2 },
  closed: { label: 'Closed', badge: 'bg-indigo-500 text-white border-transparent', icon: Award },
  revealed: { label: 'Revealed', badge: 'bg-purple-500 text-white border-transparent', icon: TrendingUp },
};

const jsCfg = (s: string) => JOB_STATUS[s] ?? JOB_STATUS.draft;
const jtCfg = (t: string) => JOB_TYPE[t] ?? JOB_TYPE.job;
const tsCfg = (s: string) => TENDER_STATUS[s] ?? TENDER_STATUS.draft;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, colorHex, icon: Icon, onClick }: {
  label: string; value: string | number; sub?: string;
  colorHex: string; icon: any; onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      className={cn('rounded-xl border p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all min-w-0', colorClasses.bg.primary, colorClasses.border.secondary, onClick && 'cursor-pointer')}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompanyDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [companyData, setCompanyData] = useState<any>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const { verificationData, loading: verificationLoading } = useVerification();

  // ── Company profile ──────────────────────────────────────────────────────────
  const { data: company, isLoading: companyLoading, refetch: refetchCompany } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      try { return await companyService.getMyCompany(); }
      catch (err: any) {
        if (err.message?.includes('Company profile not found') ||
          err.response?.data?.message?.includes('not found')) {
          setShouldRedirect(true); return null;
        }
        throw err;
      }
    },
    enabled: isAuthenticated && user?.role === 'company',
    retry: false,
  });

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: async () => {
      try { return await jobService.getCompanyJobs(); }
      catch (err: any) {
        if (err.message?.includes('not found')) { setShouldRedirect(true); return { data: [] }; }
        throw err;
      }
    },
    enabled: isAuthenticated && user?.role === 'company' && !shouldRedirect,
  });

  // ── NEW: Freelance tenders ───────────────────────────────────────────────────
  const { data: freeTendersData, isLoading: freeTendersLoading, refetch: refetchFreeTenders } = useMyPostedFreelanceTenders(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'company' && !shouldRedirect }
  );

  // ── NEW: Professional tenders ────────────────────────────────────────────────
  const { data: profTendersData, isLoading: profTendersLoading, refetch: refetchProfTenders } = useMyPostedProfessionalTenders(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'company' && !shouldRedirect }
  );

  useEffect(() => {
    if (shouldRedirect) {
      toast({ title: 'Profile Required', description: 'Please complete your company profile.', variant: 'destructive' });
      router.push('/dashboard/company/profile');
    }
  }, [shouldRedirect, router, toast]);

  useEffect(() => { if (company) setCompanyData(company); }, [company]);

  const jobs: Job[] = jobsData?.data ?? [];
  const freeTenders: FreelanceTenderListItem[] = freeTendersData?.tenders ?? [];
  const profTenders: ProfessionalTenderListItem[] = profTendersData?.tenders ?? [];

  const handleRefreshAll = () => { refetchCompany(); refetchJobs(); refetchFreeTenders(); refetchProfTenders(); };

  // ── Computed stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalJobApps = jobs.reduce((s, j) => s + (j.applicationCount || 0), 0);
    const totalJobViews = jobs.reduce((s, j) => s + (j.viewCount || 0), 0);

    const publishedFree = freeTenders.filter(t => t.status === 'published').length;
    const draftFree = freeTenders.filter(t => t.status === 'draft').length;
    const totalFreeApps = freeTenders.reduce((s, t) => s + ((t as any).applicationCount || 0), 0);

    const publishedProf = profTenders.filter(t => ['published', 'active', 'locked'].includes(t.status)).length;
    const draftProf = profTenders.filter(t => t.status === 'draft').length;
    const totalProfBids = profTenders.reduce((s, t) => s + ((t as any).bidCount || 0), 0);

    const totalTenders = freeTenders.length + profTenders.length;
    const publishedTenders = publishedFree + publishedProf;
    const totalProposals = totalFreeApps + totalProfBids;
    const totalTenderViews = freeTenders.reduce((s, t) => s + ((t as any).metadata?.views || 0), 0)
      + profTenders.reduce((s, t) => s + ((t as any).metadata?.views || 0), 0);

    const totalEngagements = totalJobApps + totalProposals;
    const completionRate = totalTenders > 0
      ? ([...freeTenders, ...profTenders].filter(t => ['closed', 'revealed'].includes(t.status)).length / totalTenders) * 100
      : 0;

    return {
      totalJobs: jobs.length, activeJobs, totalJobApps, totalJobViews,
      totalTenders, publishedTenders, draftTenders: draftFree + draftProf,
      freelanceTenders: freeTenders.length, professionalTenders: profTenders.length,
      totalProposals, totalTenderViews,
      totalOpportunities: jobs.length + totalTenders,
      totalEngagements, completionRate,
      impactScore: Math.min(100, totalEngagements * 0.4 + (totalJobViews + totalTenderViews) * 0.02 + completionRate * 0.4),
    };
  }, [jobs, freeTenders, profTenders]);

  const recentJobs = jobs.slice(0, 3);
  const recentFreeTenders = freeTenders.slice(0, 2);
  const recentProfTenders = profTenders.slice(0, 2);
  const isLoading = companyLoading || jobsLoading || freeTendersLoading || profTendersLoading;

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3"><LoadingSpinner size="lg" />
            <p className={cn('text-sm', colorClasses.text.muted)}>Loading your dashboard…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (shouldRedirect) {
    return <DashboardLayout requiredRole="company"><div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A1628] transition-colors">

        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0A2540] border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarImage src={companyData?.logo?.secure_url ?? companyData?.logo?.url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                    {companyData?.name?.charAt(0) ?? 'C'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={cn('text-lg sm:text-xl lg:text-2xl font-bold truncate', colorClasses.text.darkNavy)}>
                      {companyData?.name ?? 'Company'} Dashboard
                    </h1>
                    {!verificationLoading && <VerificationBadge autoFetch size="sm" showText showTooltip />}
                  </div>
                  <p className={cn('text-xs sm:text-sm truncate', colorClasses.text.muted)}>
                    {companyData?.tagline ?? companyData?.description ?? 'Manage your hiring and projects'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:shrink-0">
                {/* Primary action buttons — 2-col grid on mobile, row on lg+ */}
                <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-2">
                  <Link href="/dashboard/company/jobs/create" className="w-full lg:w-auto">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm whitespace-nowrap">
                      <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                      <span className="sm:hidden">Job</span>
                      <span className="hidden sm:inline">Create Job</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/company/tenders/my-tenders/create" className="w-full lg:w-auto">
                    <Button size="sm" className="w-full text-xs sm:text-sm whitespace-nowrap" style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}>
                      <Plus className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                      <span className="sm:hidden">Tender</span>
                      <span className="hidden sm:inline">Create Tender</span>
                    </Button>
                  </Link>
                </div>
                {/* Utility refresh */}
                <Button variant="outline" size="sm" onClick={handleRefreshAll} className="border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                  <RefreshCw className="w-3.5 h-3.5 mr-1 sm:mr-1.5" /> Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main ─────────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-4 sm:space-y-5">

          {/* Top stats — 2 cols on mobile, 4 on lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <StatCard label="Total Opportunities" value={stats.totalOpportunities} sub={`${stats.activeJobs + stats.publishedTenders} active`} colorHex={colors.blue} icon={Target} />
            <StatCard label="Total Engagements" value={formatNumber(stats.totalEngagements)} sub={`${stats.totalJobApps} apps + ${stats.totalProposals} bids`} colorHex={colors.emerald} icon={Users} />
            <StatCard label="Total Tenders" value={stats.totalTenders} sub={`${stats.publishedTenders} published`} colorHex={colors.indigo} icon={ClipboardList} />
            <StatCard
              label="Verification"
              value={verificationData?.verificationStatus === 'full' ? 'Verified' : verificationData?.verificationStatus === 'partial' ? 'Partial' : 'Pending'}
              colorHex={verificationData?.verificationStatus === 'full' ? colors.green : verificationData?.verificationStatus === 'partial' ? colors.amber : colors.slate}
              icon={ShieldCheck}
            />
          </div>

          {/* Tender breakdown — 2 cols on mobile, 4 on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard label="Freelance Tenders" value={stats.freelanceTenders} sub="Projects" colorHex={colors.blue} icon={Users} />
            <StatCard label="Professional Tenders" value={stats.professionalTenders} sub="Procurement" colorHex={colors.teal} icon={Briefcase} />
            <StatCard label="Published" value={stats.publishedTenders} sub="Live now" colorHex={colors.emerald} icon={CheckCircle2} />
            <StatCard label="Draft" value={stats.draftTenders} sub="Unpublished" colorHex={colors.amber} icon={FileText} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-5">
            <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="flex w-max min-w-full bg-transparent p-0 h-auto gap-0 rounded-none">
                {[
                  { value: 'overview', label: 'Overview' },
                  { value: 'jobs', label: `Jobs (${stats.totalJobs})` },
                  { value: 'tenders', label: `Tenders (${stats.totalTenders})` },
                  { value: 'referrals', label: 'Referrals' },
                  { value: 'impact', label: 'Impact' },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className={cn(
                    'px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap rounded-none border-b-2 border-transparent',
                    'text-gray-500 dark:text-gray-400 bg-transparent shrink-0',
                    'data-[state=active]:border-[#F1BB03] data-[state=active]:text-[#B45309] dark:data-[state=active]:text-[#F1BB03]',
                    'data-[state=active]:bg-[#F1BB03]/5',
                    'hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
                  )}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* Recent Jobs */}
                <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <CardHeader className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Recent Jobs</CardTitle>
                      </div>
                      <Link href="/dashboard/company/jobs">
                        <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>
                          View All <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {recentJobs.length > 0 ? recentJobs.map(job => {
                      const sCfg = jsCfg(job.status);
                      const tCfg = jtCfg(job.jobType ?? 'job');
                      const SIcon = sCfg.icon;
                      return (
                        <Link key={job._id} href={`/dashboard/company/jobs/${job._id}`} className="block">
                          <div className={cn('group flex items-start gap-3 p-3 rounded-lg border transition-all',
                            colorClasses.border.secondary, colorClasses.bg.primary,
                            'hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/10')}>
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                              <tCfg.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors', colorClasses.text.primary)}>
                                {job.title}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', sCfg.badge)}>
                                  <SIcon className="w-2.5 h-2.5 mr-0.5 inline" />{sCfg.label}
                                </Badge>
                                <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', tCfg.badge)}>{tCfg.label}</Badge>
                                {job.location?.city && (
                                  <span className={cn('text-[10px] flex items-center', colorClasses.text.muted)}>
                                    <MapPin className="w-2.5 h-2.5 mr-0.5" />{job.location.city}
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
                          <Briefcase className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No jobs posted yet</p>
                        <Link href="/dashboard/company/jobs/create">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-3 h-3 mr-1.5" /> Create Job
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
                        <ClipboardList className="w-4 h-4" style={{ color: colors.goldenMustard }} />
                        <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Recent Tenders</CardTitle>
                      </div>
                      <Link href="/dashboard/company/tenders/my-tenders">
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
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No tenders posted yet</p>
                        <Link href="/dashboard/company/tenders/my-tenders/create">
                          <Button size="sm" style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}>
                            <Plus className="w-3 h-3 mr-1.5" /> Create Tender
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        {recentFreeTenders.map(t => {
                          const cfg = tsCfg(t.status);
                          const SIcon = cfg.icon;
                          return (
                            <Link key={t._id} href={`/dashboard/company/freelance-tenders/${t._id}`} className="block">
                              <div className={cn('group flex items-start gap-3 p-3 rounded-lg border transition-all',
                                colorClasses.border.secondary, colorClasses.bg.primary,
                                'hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/10')}>
                                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-sm font-semibold truncate group-hover:text-blue-600 transition-colors', colorClasses.text.primary)}>{t.title}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', cfg.badge)}>
                                      <SIcon className="w-2.5 h-2.5 mr-0.5 inline" />{cfg.label}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-500 text-white border-transparent">Freelance</Badge>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={cn('text-[10px]', colorClasses.text.muted)}>{getTimeAgo((t as any).createdAt)}</p>
                                  <p className={cn('text-xs font-semibold mt-0.5', colorClasses.text.primary)}>{formatFreelanceBudget(t)}</p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        {recentProfTenders.map(t => {
                          const cfg = tsCfg(t.status);
                          const SIcon = cfg.icon;
                          const wf = (t as any).workflowType ?? 'open';
                          return (
                            <Link key={t._id} href={`/dashboard/company/tenders/tenders/${t._id}`} className="block">
                              <div className={cn('group flex items-start gap-3 p-3 rounded-lg border transition-all',
                                colorClasses.border.secondary, colorClasses.bg.primary,
                                'hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/10')}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${colors.goldenMustard}18` }}>
                                  <Briefcase className="w-4 h-4" style={{ color: colors.goldenMustard }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-sm font-semibold truncate group-hover:text-amber-600 transition-colors', colorClasses.text.primary)}>{t.title}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    <Badge variant="outline" className={cn('text-[10px] py-0 px-1.5', cfg.badge)}>
                                      <SIcon className="w-2.5 h-2.5 mr-0.5 inline" />{cfg.label}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-teal-500 text-white border-transparent">Professional</Badge>
                                    {wf === 'closed' && <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-purple-500 text-white border-transparent">🔒</Badge>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={cn('text-[10px]', colorClasses.text.muted)}>{getTimeAgo((t as any).createdAt)}</p>
                                  <p className={cn('text-xs font-semibold mt-0.5', colorClasses.text.primary)}>{formatProfBudget(t)}</p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Jobs tab */}
            <TabsContent value="jobs" className="space-y-4">
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>All Jobs ({stats.totalJobs})</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs border-gray-300 dark:border-gray-600"><Filter className="w-3 h-3 mr-1" /><span className="hidden sm:inline">Filter</span></Button>
                      <Button variant="outline" size="sm" className="text-xs border-gray-300 dark:border-gray-600"><Download className="w-3 h-3 mr-1" /><span className="hidden sm:inline">Export</span></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {jobs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                        <thead className={colorClasses.bg.secondary}>
                          <tr>
                            {['Title', 'Type', 'Status', 'Apps', 'Views', 'Salary'].map((h, i) => (
                              <th key={h} className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider', colorClasses.text.muted,
                                i === 1 && 'hidden sm:table-cell',
                                i === 3 && 'hidden md:table-cell',
                                i === 4 && 'hidden lg:table-cell',
                                i === 5 && 'hidden xl:table-cell',
                              )}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-800', colorClasses.bg.primary)}>
                          {jobs.map(job => {
                            const tCfg = jtCfg(job.jobType ?? 'job');
                            const sCfg = jsCfg(job.status);
                            return (
                              <tr key={job._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                                <td className="px-4 py-3">
                                  <Link href={`/dashboard/company/jobs/${job._id}`}
                                    className={cn('text-sm font-medium block truncate max-w-[200px]', colorClasses.text.primary,
                                      'hover:text-blue-600 dark:hover:text-blue-400 transition-colors')}>{job.title}</Link>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <Badge variant="outline" className={cn('text-xs', tCfg.badge)}>{tCfg.label}</Badge>
                                </td>
                                <td className="px-4 py-3">
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
                    <div className="text-center py-12 p-4 space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Briefcase className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className={cn('text-base font-semibold', colorClasses.text.primary)}>No jobs yet</p>
                      <Link href="/dashboard/company/jobs/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" />Create Job</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tenders tab */}
            <TabsContent value="tenders" className="space-y-4">
              {/* Freelance */}
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-blue-500" />
                      <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Freelance Tenders ({freeTenders.length})</CardTitle>
                    </div>
                    <Link href="/dashboard/company/tenders/my-tenders?tab=freelance">
                      <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>Manage <ChevronRight className="w-3 h-3 ml-1" /></Button>
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
                                i >= 4 && 'hidden xl:table-cell')}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-800', colorClasses.bg.primary)}>
                          {freeTenders.map(t => {
                            const cfg = tsCfg(t.status);
                            return (
                              <tr key={t._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                                <td className="px-4 py-3">
                                  <Link href={`/dashboard/company/freelance-tenders/${t._id}`}
                                    className={cn('text-sm font-medium block truncate max-w-[220px]', colorClasses.text.primary, 'hover:text-blue-600 dark:hover:text-blue-400')}>{t.title}</Link>
                                </td>
                                <td className="px-4 py-3"><Badge variant="outline" className={cn('text-xs', cfg.badge)}>{cfg.label}</Badge></td>
                                <td className="px-4 py-3 hidden md:table-cell"><span className={cn('text-sm', colorClasses.text.primary)}>{formatFreelanceBudget(t)}</span></td>
                                <td className="px-4 py-3 hidden lg:table-cell"><span className={cn('text-sm', colorClasses.text.muted)}>{(t as any).applicationCount ?? 0}</span></td>
                                <td className="px-4 py-3 hidden xl:table-cell"><span className={cn('text-xs', colorClasses.text.muted)}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 p-4">
                      <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No freelance tenders</p>
                      <Link href="/dashboard/company/tenders/my-tenders/create"><Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-3 h-3 mr-1.5" />Create</Button></Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional */}
              <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: colors.goldenMustard }} />
                      <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Professional Tenders ({profTenders.length})</CardTitle>
                    </div>
                    <Link href="/dashboard/company/tenders/my-tenders?tab=professional">
                      <Button variant="ghost" size="sm" className={cn('text-xs h-7', colorClasses.text.muted)}>Manage <ChevronRight className="w-3 h-3 ml-1" /></Button>
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
                                i >= 4 && 'hidden xl:table-cell')}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-800', colorClasses.bg.primary)}>
                          {profTenders.map(t => {
                            const cfg = tsCfg(t.status);
                            const wf = (t as any).workflowType ?? 'open';
                            return (
                              <tr key={t._id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors">
                                <td className="px-4 py-3">
                                  <div>
                                    <Link href={`/dashboard/company/tenders/tenders/${t._id}`}
                                      className={cn('text-sm font-medium block truncate max-w-[220px]', colorClasses.text.primary, 'hover:text-amber-600 dark:hover:text-amber-400')}>{t.title}</Link>
                                    {(t as any).referenceNumber && (
                                      <span className={cn('text-[10px] font-mono', colorClasses.text.muted)}>{(t as any).referenceNumber}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3"><Badge variant="outline" className={cn('text-xs', cfg.badge)}>{cfg.label}</Badge></td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <Badge variant="outline" className={cn('text-xs', wf === 'closed' ? 'bg-purple-500 text-white border-transparent' : 'bg-teal-500 text-white border-transparent')}>
                                    {wf === 'closed' ? '🔒 Sealed' : 'Open'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell"><span className={cn('text-sm', colorClasses.text.muted)}>{(t as any).bidCount ?? 0}</span></td>
                                <td className="px-4 py-3 hidden xl:table-cell"><span className={cn('text-xs', colorClasses.text.muted)}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 p-4">
                      <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>No professional tenders</p>
                      <Link href="/dashboard/company/tenders/my-tenders/create">
                        <Button size="sm" style={{ backgroundColor: colors.goldenMustard, color: colors.darkNavy }}>
                          <Plus className="w-3 h-3 mr-1.5" />Create
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referrals tab — full PromoCodeDashboard */}
            <TabsContent value="referrals" className="space-y-4">
              <div className={cn('rounded-xl border p-4 sm:p-6', colorClasses.bg.primary, colorClasses.border.secondary)}>
                <PromoCodeDashboard />
              </div>
            </TabsContent>

            {/* Impact tab */}
            <TabsContent value="impact" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className={cn('border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className={cn('text-sm font-semibold', colorClasses.text.primary)}>Engagement Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    {[
                      { label: 'Job Applications', v: stats.totalJobApps, color: 'from-blue-500 to-blue-600', pct: (stats.totalJobApps / Math.max(stats.totalEngagements, 1)) * 100 },
                      { label: 'Tender Proposals', v: stats.totalProposals, color: 'from-amber-500 to-amber-600', pct: (stats.totalProposals / Math.max(stats.totalEngagements, 1)) * 100 },
                      { label: 'Completion Rate', v: `${stats.completionRate.toFixed(1)}%`, color: 'from-emerald-500 to-emerald-600', pct: stats.completionRate },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between mb-1.5 text-sm">
                          <span className={colorClasses.text.muted}>{m.label}</span>
                          <span className="font-bold" style={{ color: colors.blue }}>{m.v}</span>
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
                      { label: 'Verification', value: verificationData?.verificationStatus === 'full' ? '100%' : verificationData?.verificationStatus === 'partial' ? '50%' : '0%', bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', icon: ShieldCheck, color: 'text-blue-500' },
                      { label: 'Engagement Boost', value: verificationData?.verificationStatus === 'full' ? '3x' : verificationData?.verificationStatus === 'partial' ? '2x' : '1x', bg: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20', icon: TrendingUp, color: 'text-indigo-500' },
                      { label: 'Trust Level', value: verificationData?.verificationStatus === 'full' ? 'High' : verificationData?.verificationStatus === 'partial' ? 'Medium' : 'Low', bg: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20', icon: Award, color: 'text-emerald-500' },
                    ].map(m => (
                      <div key={m.label} className={cn('p-3 rounded-lg bg-gradient-to-r flex items-center justify-between', m.bg)}>
                        <div>
                          <p className={cn('text-xl font-bold', colorClasses.text.primary)}>{m.value}</p>
                          <p className={cn('text-xs', colorClasses.text.muted)}>{m.label}</p>
                        </div>
                        <m.icon className={cn('w-6 h-6', m.color)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Bottom summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { value: stats.activeJobs, label: 'Active Jobs', sub: `${stats.totalJobs} total`, gradient: 'from-blue-500 to-blue-600', icon: Briefcase },
              { value: stats.publishedTenders, label: 'Published Tenders', sub: `${stats.freelanceTenders}F + ${stats.professionalTenders}P`, gradient: 'from-amber-500 to-amber-600', icon: ClipboardList },
              { value: formatNumber(stats.totalEngagements), label: 'Total Engagements', sub: `${stats.completionRate.toFixed(0)}% completion`, gradient: 'from-emerald-500 to-emerald-600', icon: Users },
              { value: stats.totalTenders, label: 'All Tenders', sub: `${stats.draftTenders} drafts`, gradient: 'from-indigo-500 to-indigo-600', icon: FileText },
            ].map(c => (
              <motion.div key={c.label} whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                className={cn('rounded-xl p-4 sm:p-5 text-white bg-gradient-to-br transition-all', c.gradient)}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="text-xl sm:text-2xl font-bold">{c.value}</div>
                  <c.icon className="w-6 h-6 sm:w-7 sm:h-7 opacity-60" />
                </div>
                <p className="text-xs sm:text-sm font-semibold opacity-95">{c.label}</p>
                <p className="text-[10px] sm:text-xs opacity-70 mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}