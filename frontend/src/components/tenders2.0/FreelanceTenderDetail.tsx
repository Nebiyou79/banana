// components/tenders2.0/FreelanceTenderDetail.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, FileText, FileStack, Users,
  Zap, Building, DollarSign, Clock, Briefcase, Calendar,
  Globe, MapPin, AlertTriangle, CheckCircle, Star, Tag,
  Layers, HelpCircle, Award, Target, BadgeCheck, ExternalLink, Users2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useFreelanceTender } from '@/hooks/useFreelanceTender';
import { useResponsive } from '@/hooks/useResponsive';
import { SectionCard } from '@/components/tenders/shared/SectionCard';
import { InfoItem } from '@/components/tenders/shared/InfoItem';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { AttachmentListSection } from './AttachmentList';
import { ProposalsSection } from './Proposals';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import TenderStatusBadge from './TenderStatusBadge';
import TenderOwnerAvatar from './TenderOwnerAvatar';

// ─── Props ─────────────────────────────────────────────────────────────────
interface FreelancerTenderDetailsProps {
  tenderId: string;
  className?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (d?: string | Date) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const stripHtml = (h: string) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const safeVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v || '—';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.map(safeVal).join(', ') || '—';
  if (typeof v === 'object') {
    if (v.currency !== undefined || v.percentage !== undefined || v.required !== undefined) {
      const parts: string[] = [];
      if (v.currency) parts.push(String(v.currency));
      if (v.percentage !== undefined) parts.push(`${v.percentage}%`);
      if (v.required !== undefined) parts.push(v.required ? 'Required' : 'Optional');
      return parts.join(' ') || JSON.stringify(v);
    }
    if (v.min !== undefined && v.max !== undefined)
      return `${v.currency ? v.currency + ' ' : ''}${v.min}–${v.max}`;
    if (v.value !== undefined && v.unit !== undefined) return `${v.value} ${v.unit}`;
    if (v.label) return String(v.label);
    if (v.name) return String(v.name);
    return JSON.stringify(v);
  }
  return String(v);
};

const statusChip = (s: string) => {
  const m: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700 border-blue-200',
    under_review: 'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  return m[s] ?? 'bg-gray-100 text-gray-600 border-gray-200';
};

// ─── Tab definitions ───────────────────────────────────────────────────────
interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  mobileIcon: React.ReactNode;
  badge?: string;
}

// ─── Desktop Tab Bar (horizontal scrolling tabs) ──────────────────────────
const DesktopTabBar: React.FC<{
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div
    className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex items-center gap-1.5 shrink-0 px-3 py-3 text-xs font-semibold',
          'border-b-2 whitespace-nowrap transition-all min-h-[44px]',
          active === tab.id
            ? 'border-[#F1BB03] text-[#0A2540] dark:text-[#F1BB03] bg-[#FFFBEB]/40 dark:bg-[#F1BB03]/5'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        )}
      >
        <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>
        <span>{tab.label}</span>
        {tab.badge && (
          <span className={cn(
            'ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold inline-flex items-center justify-center',
            active === tab.id ? 'bg-[#F1BB03] text-[#0A2540]' : 'bg-gray-200 dark:bg-gray-700 text-gray-600',
          )}>
            {tab.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── Mobile Bottom Tab Bar (fixed bottom nav with icons) ─────────────────
const MobileBottomTabBar: React.FC<{
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <nav
    className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'border-t border-gray-200 dark:border-gray-700',
      'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
      'shadow-[0_-2px_16px_rgba(0,0,0,0.08)]',
    )}
    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
  >
    <div className="flex justify-around items-stretch h-16 px-1">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 gap-0.5 px-1',
              'transition-all duration-150 rounded-xl mx-0.5 my-1.5',
              'min-h-[44px] min-w-[44px]',
              isActive
                ? 'bg-[#FFFBEB] dark:bg-[#F1BB03]/10 text-[#F1BB03]'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon with badge dot */}
            <div className="relative">
              <span className={cn(
                'block transition-transform duration-150',
                isActive ? 'scale-110' : 'scale-100',
              )}>
                {tab.mobileIcon}
              </span>
              {tab.badge && (
                <span className={cn(
                  'absolute -top-1 -right-1.5',
                  'min-w-[14px] h-[14px] px-0.5',
                  'flex items-center justify-center',
                  'text-[8px] font-bold rounded-full',
                  isActive
                    ? 'bg-[#F1BB03] text-[#0A2540]'
                    : 'bg-gray-400 dark:bg-gray-600 text-white',
                )}>
                  {tab.badge}
                </span>
              )}
            </div>
            {/* Label */}
            <span className={cn(
              'text-[10px] font-semibold leading-none transition-colors duration-150 truncate max-w-[56px]',
              isActive ? 'text-[#F1BB03]' : 'text-gray-400 dark:text-gray-500',
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

// ─── Deadline display ──────────────────────────────────────────────────────
const DeadlineDisplay: React.FC<{ deadline: string | Date }> = ({ deadline }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const d = new Date(deadline);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  const hours = Math.ceil(diff / 3_600_000);
  const expired = diff <= 0;
  const urgent = !expired && days <= 7;
  const iconBg = expired ? 'bg-red-100' : urgent ? 'bg-amber-100' : 'bg-emerald-100';
  const iconCol = expired ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-emerald-600';
  const badge = expired
    ? 'bg-red-100 text-red-700 border-red-200'
    : days <= 1 ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
      : days <= 7 ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-3', colorClasses.bg.white, colorClasses.border.gray200)}>
      <div className={cn('p-2 rounded-full shrink-0', iconBg)}>
        <Calendar className={cn('w-4 h-4', iconCol)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] uppercase tracking-wide', colorClasses.text.muted)}>Deadline</p>
        <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>
          {expired ? 'Deadline passed' : formatDate(d)}
        </p>
      </div>
      <span className={cn('shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border', badge)}>
        {expired ? 'Expired' : days <= 1 ? `${hours}h left` : `${days}d left`}
      </span>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3 p-1">
    <Skeleton className="h-10 w-full rounded-xl" />
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-60 w-full rounded-xl" />
  </div>
);

const fadeInUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };

// ─── Main Component ────────────────────────────────────────────────────────
export const FreelancerTenderDetails: React.FC<FreelancerTenderDetailsProps> = ({
  tenderId, className,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data: tender, isLoading, error, refetch } = useFreelanceTender(tenderId);
  const t = tender as any;
  const myApp = t?.myApplication;
  const status = t?.status ?? 'published';
  const deadlinePassed = t?.deadline ? new Date(t.deadline) < new Date() : false;
  const hasApplied = !!myApp;
  const ownerEntity = t?.ownerEntity;
  const owner = t?.owner;
  const budget = t?.budget;

  const tabs: TabDef[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      mobileIcon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'details',
      label: 'Details',
      icon: <FileText className="w-3.5 h-3.5" />,
      mobileIcon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'attachments',
      label: 'Files',
      icon: <FileStack className="w-3.5 h-3.5" />,
      mobileIcon: <FileStack className="w-5 h-5" />,
      badge: t?.attachments?.length > 0 ? String(t.attachments.length) : undefined,
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: <Users className="w-3.5 h-3.5" />,
      mobileIcon: <Users className="w-5 h-5" />,
      badge: hasApplied ? '✓' : undefined,
    },
    {
      id: 'apply',
      label: 'Apply',
      icon: <Zap className="w-3.5 h-3.5" />,
      mobileIcon: <Zap className="w-5 h-5" />,
    },
    {
      id: 'company',
      label: 'Company',
      icon: <Building className="w-3.5 h-3.5" />,
      mobileIcon: <Building className="w-5 h-5" />,
    },
  ];

  if (isLoading) return <LoadingSkeleton />;
  if (error || !t) return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        Could not load tender.
        <button onClick={() => refetch()} className="underline font-medium">Retry</button>
      </AlertDescription>
    </Alert>
  );

  const briefDesc = t?.briefDescription
    ? t.briefDescription
    : t?.description
      ? (t.description.startsWith('<') ? stripHtml(t.description) : t.description).slice(0, 300)
      : null;

  // Bottom padding when mobile bottom nav is visible
  const contentPb = isMobile ? 'pb-[84px]' : 'pb-28';

  return (
    <div className={cn('w-full overflow-hidden', className)}>

      {/* ── Tab bar: desktop only (mobile uses bottom nav below) ── */}
      {!isMobile && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
          <DesktopTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
      )}

      {/* ── Tab content ── */}
      <div className={cn('pt-3', contentPb)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >

            {/* ─────────── OVERVIEW ─────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <h2 className={cn('text-base font-bold leading-snug break-words', colorClasses.text.primary)}>
                  {t.title}
                </h2>

                <div className="flex flex-wrap gap-1.5">
                  <TenderStatusBadge status={status} showDot />
                  {t?.engagementType && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                      {t.engagementType === 'fixed_price' ? <Briefcase className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {t.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly'}
                    </span>
                  )}
                  {t?.procurementCategory && (
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.secondary)}>
                      <Tag className="w-2.5 h-2.5" /> {safeVal(t.procurementCategory)}
                    </span>
                  )}
                  {t?.urgency && t.urgency !== 'normal' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                      <AlertTriangle className="w-2.5 h-2.5" /> {safeVal(t.urgency)}
                    </span>
                  )}
                  {t?.experienceLevel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                      <Star className="w-2.5 h-2.5" /> {safeVal(t.experienceLevel)}
                    </span>
                  )}
                </div>

                {briefDesc && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-slate-500" />} title="About">
                    <p className={cn('text-sm leading-relaxed break-words', colorClasses.text.secondary)}>
                      {briefDesc}
                      {!t?.briefDescription && t?.description?.length > 300 && (
                        <button
                          onClick={() => setActiveTab('details')}
                          className="ml-1 text-xs text-[#F1BB03] font-semibold hover:underline"
                        >
                          Read more →
                        </button>
                      )}
                    </p>
                  </SectionCard>
                )}

                {t?.deadline && <DeadlineDisplay deadline={t.deadline} />}

                <div className="grid grid-cols-1 gap-2">
                  <SectionCard icon={<DollarSign className="w-4 h-4 text-emerald-500" />} title="Budget">
                    <p className={cn('text-base font-bold', colorClasses.text.primary)}>
                      {budget?.min > 0 || budget?.max > 0
                        ? `${budget.currency || 'ETB'} ${Number(budget.min).toLocaleString()} – ${Number(budget.max).toLocaleString()}`
                        : 'Negotiable'}
                    </p>
                    {t?.engagementType && (
                      <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>
                        {t.engagementType === 'fixed_price' ? 'Fixed price project' : 'Per hour'}
                      </p>
                    )}
                  </SectionCard>

                  <div className="grid grid-cols-2 gap-2">
                    {t?.engagementType && (
                      <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Type</p>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>
                          {t.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly'}
                        </p>
                      </div>
                    )}
                    {t?.experienceLevel && (
                      <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Level</p>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{safeVal(t.experienceLevel)}</p>
                      </div>
                    )}
                    {t?.locationType && (
                      <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Location</p>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{safeVal(t.locationType)}</p>
                      </div>
                    )}
                    {t?.estimatedTimeline && (
                      <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Timeline</p>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{safeVal(t.estimatedTimeline)}</p>
                      </div>
                    )}
                    {(t?.positions || t?.positionsAvailable) && (
                      <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Positions</p>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{safeVal(t.positions ?? t.positionsAvailable)}</p>
                      </div>
                    )}
                    {t?.metadata?.totalApplications !== undefined && (
                      <div className={cn('p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Applied</p>
                        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{safeVal(t.metadata.totalApplications)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {t?.requiredSkills?.length > 0 && (
                  <SectionCard icon={<Award className="w-4 h-4 text-[#F1BB03]" />} title="Required Skills">
                    <div className="flex flex-wrap gap-1.5">
                      {t.requiredSkills.slice(0, 8).map((s: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1BB03]/15 text-[#0A2540] dark:text-[#F1BB03] border border-[#F1BB03]/30">
                          {safeVal(s)}
                        </span>
                      ))}
                      {t.requiredSkills.length > 8 && (
                        <span className={cn('px-2 py-0.5 rounded-full text-xs', colorClasses.bg.secondary, colorClasses.text.muted)}>
                          +{t.requiredSkills.length - 8}
                        </span>
                      )}
                    </div>
                  </SectionCard>
                )}

                {!hasApplied && !deadlinePassed && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push(`/dashboard/freelancer/apply/${tenderId}`)}
                    className="w-full h-12 rounded-xl bg-[#F1BB03] text-[#0A2540] font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Apply Now
                  </motion.button>
                )}

                {(ownerEntity || owner) && (
                  <div className={cn('flex items-center gap-3 p-3 rounded-xl border', colorClasses.bg.white, colorClasses.border.gray200)}>
                    <TenderOwnerAvatar ownerEntity={ownerEntity} owner={owner} tenderType="freelance" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-[10px] uppercase tracking-wide', colorClasses.text.muted)}>Posted by</p>
                      <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>
                        {ownerEntity?.name ?? owner?.name ?? 'Unknown'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('company')}
                      className="text-xs text-[#F1BB03] font-semibold shrink-0"
                    >
                      View →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─────────── DETAILS ─────────── */}
            {activeTab === 'details' && (
              <div className="space-y-3">
                {t?.description && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-slate-500" />} title="Project Description">
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                      {t.description.startsWith('<')
                        ? <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden [&_*]:max-w-full [&_pre]:overflow-x-auto" dangerouslySetInnerHTML={{ __html: t.description }} />
                        : <p className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words', colorClasses.text.secondary)}>{t.description}</p>}
                    </div>
                  </SectionCard>
                )}

                {(t?.engagementType || t?.projectType || t?.experienceLevel || t?.urgency || t?.estimatedTimeline || t?.locationType || t?.language || t?.positions || t?.positionsAvailable || t?.maxApplications) && (
                  <SectionCard icon={<Target className="w-4 h-4 text-blue-500" />} title="Project Scope">
                    <div className="grid grid-cols-1 gap-2.5">
                      {t?.engagementType && <InfoItem label="Engagement" value={t.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly'} icon={<Briefcase className="w-4 h-4" />} badge />}
                      {t?.projectType && <InfoItem label="Project Type" value={safeVal(t.projectType)} icon={<Layers className="w-4 h-4" />} badge />}
                      {t?.experienceLevel && <InfoItem label="Experience" value={safeVal(t.experienceLevel)} icon={<Star className="w-4 h-4" />} badge />}
                      {t?.urgency && <InfoItem label="Urgency" value={safeVal(t.urgency)} icon={<Zap className="w-4 h-4" />} badge />}
                      {t?.estimatedTimeline && <InfoItem label="Est. Timeline" value={safeVal(t.estimatedTimeline)} icon={<Clock className="w-4 h-4" />} />}
                      {t?.locationType && <InfoItem label="Location Type" value={safeVal(t.locationType)} icon={<MapPin className="w-4 h-4" />} badge />}
                      {t?.language && <InfoItem label="Language" value={safeVal(t.language)} icon={<Globe className="w-4 h-4" />} badge />}
                      {(t?.positions || t?.positionsAvailable) && <InfoItem label="Positions" value={safeVal(t.positions ?? t.positionsAvailable)} icon={<Users className="w-4 h-4" />} />}
                      {t?.maxApplications && <InfoItem label="Max Applications" value={safeVal(t.maxApplications)} icon={<Users2 className="w-4 h-4" />} />}
                    </div>
                  </SectionCard>
                )}

                {budget && (
                  <SectionCard icon={<DollarSign className="w-4 h-4 text-emerald-500" />} title="Budget & Payment">
                    {budget.min > 0 || budget.max > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-4 py-2 flex-wrap">
                          <div className="text-center">
                            <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Min</p>
                            <p className={cn('text-xl font-bold', colorClasses.text.primary)}>
                              {budget.currency || 'ETB'} {Number(budget.min).toLocaleString()}
                            </p>
                          </div>
                          <span className={cn('text-lg font-light', colorClasses.text.muted)}>—</span>
                          <div className="text-center">
                            <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>Max</p>
                            <p className={cn('text-xl font-bold', colorClasses.text.primary)}>
                              {budget.currency || 'ETB'} {Number(budget.max).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {t?.engagementType && (
                          <p className={cn('text-center text-xs', colorClasses.text.muted)}>
                            {t.engagementType === 'fixed_price' ? 'Fixed Price Project' : 'Per Hour'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className={cn('text-center py-3 font-semibold', colorClasses.text.muted)}>Negotiable</p>
                    )}
                  </SectionCard>
                )}

                {((t?.requiredSkills?.length > 0) || t?.requiresNDA || t?.requiresPortfolio) && (
                  <SectionCard icon={<Award className="w-4 h-4 text-[#F1BB03]" />} title="Skills & Requirements">
                    {t?.requiredSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {t.requiredSkills.map((s: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1BB03]/15 text-[#0A2540] dark:text-[#F1BB03] border border-[#F1BB03]/30">
                            {safeVal(s)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {t?.requiresNDA && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">🔏 NDA Required</span>}
                      {t?.requiresPortfolio && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">🖼 Portfolio Required</span>}
                    </div>
                  </SectionCard>
                )}

                {t?.screeningQuestions?.length > 0 && (
                  <SectionCard icon={<HelpCircle className="w-4 h-4 text-amber-500" />} title={`Screening Questions (${t.screeningQuestions.length})`}>
                    <ol className="space-y-2">
                      {t.screeningQuestions.map((q: any, i: number) => (
                        <li key={i} className={cn('rounded-lg p-3 flex items-start gap-3', colorClasses.bg.secondary)}>
                          <span className="font-bold text-sm text-[#F1BB03] shrink-0">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm break-words', colorClasses.text.primary)}>
                              {typeof q === 'string' ? q : safeVal(q?.question ?? q)}
                            </p>
                            {q?.required && (
                              <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">Required</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </SectionCard>
                )}

                {(t?.estimatedTimeline || t?.deadline || t?.createdAt) && (
                  <SectionCard icon={<Calendar className="w-4 h-4 text-blue-500" />} title="Timeline">
                    <div className="grid grid-cols-1 gap-2.5">
                      {t?.estimatedTimeline && <InfoItem label="Est. Duration" value={safeVal(t.estimatedTimeline)} icon={<Clock className="w-4 h-4" />} />}
                      {t?.deadline && <InfoItem label="Deadline" value={formatDate(t.deadline)} icon={<Calendar className="w-4 h-4" />} />}
                      {t?.createdAt && <InfoItem label="Posted" value={formatDate(t.createdAt)} icon={<Calendar className="w-4 h-4" />} />}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ─────────── ATTACHMENTS ─────────── */}
            {activeTab === 'attachments' && (
              <AttachmentListSection
                tenderId={tenderId}
                tenderType="freelance"
                attachments={t?.attachments ?? []}
                isOwner={false}
              />
            )}

            {/* ─────────── PROPOSALS ─────────── */}
            {activeTab === 'proposals' && (
              <div className="space-y-3">
                {hasApplied && myApp && (
                  <div className="rounded-xl border-2 border-[#F1BB03]/50 bg-[#FFFBEB]/60 dark:bg-[#F1BB03]/5 p-4">
                    <div className="flex items-start gap-3">
                      <Star className="w-4 h-4 text-[#F1BB03] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-sm text-[#0A2540] dark:text-[#F1BB03]">Your Application</p>
                          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border', statusChip(myApp.status))}>
                            {myApp.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {myApp.proposedRate && (
                          <p className={cn('text-xs', colorClasses.text.muted)}>
                            Rate: <strong className={colorClasses.text.primary}>${safeVal(myApp.proposedRate)}</strong>
                          </p>
                        )}
                        {myApp.coverLetter && (
                          <p className={cn('text-sm mt-1 line-clamp-2 break-words', colorClasses.text.secondary)}>
                            {myApp.coverLetter}
                          </p>
                        )}
                        <p className={cn('text-xs mt-1', colorClasses.text.muted)}>
                          Submitted: {formatDate(myApp.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <ProposalsSection
                  tenderId={tenderId}
                  tenderType="freelance"
                  workflowType="open"
                  tenderStatus={status}
                  deadline={t?.deadline ?? new Date()}
                  isOwner={false}
                  applications={t?.applications ?? []}
                  totalApplications={t?.metadata?.totalApplications ?? 0}
                  myApplicationId={myApp?._id}
                />
              </div>
            )}

            {/* ─────────── APPLY ─────────── */}
            {activeTab === 'apply' && (
              <div className="space-y-4">
                {deadlinePassed ? (
                  <div className={cn('flex items-start gap-3 rounded-xl border p-4', colorClasses.bg.amberLight, colorClasses.border.amber)}>
                    <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.amber700)} />
                    <p className={cn('text-sm font-medium', colorClasses.text.amber700)}>
                      The deadline has passed. Applications are no longer accepted.
                    </p>
                  </div>
                ) : hasApplied ? (
                  <SectionCard icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} title="Your Application">
                    <div className="space-y-3">
                      <div className={cn('flex items-center justify-between p-3 rounded-lg', colorClasses.bg.secondary)}>
                        <span className={cn('text-sm', colorClasses.text.muted)}>Status</span>
                        <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border', statusChip(myApp.status))}>
                          {myApp.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {myApp.proposedRate && (
                        <div className={cn('flex items-center justify-between p-3 rounded-lg', colorClasses.bg.secondary)}>
                          <span className={cn('text-sm', colorClasses.text.muted)}>Rate</span>
                          <span className={cn('text-sm font-semibold', colorClasses.text.primary)}>${safeVal(myApp.proposedRate)}</span>
                        </div>
                      )}
                      <div className={cn('flex items-center justify-between p-3 rounded-lg', colorClasses.bg.secondary)}>
                        <span className={cn('text-sm', colorClasses.text.muted)}>Submitted</span>
                        <span className={cn('text-sm', colorClasses.text.primary)}>{formatDate(myApp.createdAt)}</span>
                      </div>
                      {myApp.status === 'submitted' && (
                        <button
                          onClick={() => setShowWithdraw(true)}
                          className="w-full py-2.5 rounded-lg border text-sm font-medium text-red-600 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Withdraw Application
                        </button>
                      )}
                    </div>
                  </SectionCard>
                ) : (
                  <SectionCard icon={<Zap className="w-5 h-5 text-[#F1BB03]" />} title="Apply for this Tender">
                    <div className="space-y-4">
                      {budget && (budget.min > 0 || budget.max > 0) && (
                        <div className={cn('rounded-lg p-3', colorClasses.bg.secondary)}>
                          <p className={cn('text-xs uppercase tracking-wide mb-1', colorClasses.text.muted)}>Budget Range</p>
                          <p className={cn('text-sm font-bold', colorClasses.text.primary)}>
                            {budget.currency || 'ETB'} {Number(budget.min).toLocaleString()} – {Number(budget.max).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {t?.deadline && <DeadlineDisplay deadline={t.deadline} />}

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push(`/dashboard/freelancer/apply/${tenderId}`)}
                        className="w-full h-13 rounded-xl bg-[#F1BB03] text-[#0A2540] font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 py-3.5"
                      >
                        <Zap className="w-4 h-4" />
                        Apply Now
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                      </motion.button>

                      <p className={cn('text-center text-xs', colorClasses.text.muted)}>
                        You'll be taken to the full application form
                      </p>
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ─────────── COMPANY ─────────── */}
            {activeTab === 'company' && (
              <div className="space-y-3">
                <SectionCard icon={<Building className="w-5 h-5 text-slate-500" />} title="Posted By">
                  {ownerEntity || owner ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <TenderOwnerAvatar ownerEntity={ownerEntity} owner={owner} tenderType="freelance" size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={cn('font-bold text-base break-words', colorClasses.text.primary)}>
                              {ownerEntity?.name ?? owner?.name ?? 'Unknown'}
                            </h3>
                            {ownerEntity?.verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                <BadgeCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          {ownerEntity?.industry && <p className={cn('text-sm mt-0.5', colorClasses.text.secondary)}>{ownerEntity.industry}</p>}
                          {ownerEntity?.location && (
                            <p className={cn('text-xs mt-0.5 flex items-center gap-1', colorClasses.text.muted)}>
                              <MapPin className="w-3 h-3" /> {ownerEntity.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {ownerEntity?.description && (
                        <p className={cn('text-sm leading-relaxed break-words', colorClasses.text.secondary)}>
                          {ownerEntity.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        {ownerEntity?.foundedYear && <InfoItem label="Founded" value={safeVal(ownerEntity.foundedYear)} icon={<Calendar className="w-4 h-4" />} />}
                        {ownerEntity?.employeeCount && <InfoItem label="Employees" value={safeVal(ownerEntity.employeeCount)} icon={<Users className="w-4 h-4" />} />}
                        {ownerEntity?.country && <InfoItem label="Country" value={safeVal(ownerEntity.country)} icon={<Globe className="w-4 h-4" />} />}
                        {ownerEntity?.email && <InfoItem label="Email" value={safeVal(ownerEntity.email)} icon={<Globe className="w-4 h-4" />} />}
                      </div>

                      {ownerEntity?.specializations?.length > 0 && (
                        <div>
                          <p className={cn('text-xs uppercase tracking-wide mb-2', colorClasses.text.muted)}>Specializations</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ownerEntity.specializations.map((s: any, i: number) => (
                              <span key={i} className={cn('px-2.5 py-1 rounded-full text-xs font-medium', colorClasses.bg.secondary, colorClasses.text.secondary)}>
                                {safeVal(s)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {ownerEntity?.website && (
                        <a
                          href={ownerEntity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" /> Visit Website
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className={cn('text-sm italic', colorClasses.text.muted)}>Owner information unavailable.</p>
                  )}
                </SectionCard>

                {ownerEntity?.tendersPosted !== undefined && (
                  <SectionCard icon={<FileText className="w-5 h-5 text-slate-500" />} title="Activity">
                    <div className="text-center py-2">
                      <p className={cn('text-2xl font-bold', colorClasses.text.primary)}>{safeVal(ownerEntity.tendersPosted)}</p>
                      <p className={cn('text-xs mt-1', colorClasses.text.muted)}>Tenders Posted</p>
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <MobileBottomTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      )}

      {/* Withdraw dialog */}
      <AlertDialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw your application?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your application from consideration. You can re-apply if the tender is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Application</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setShowWithdraw(false)}
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};