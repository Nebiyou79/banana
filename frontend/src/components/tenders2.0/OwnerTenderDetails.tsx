// components/tenders2.0/OwnerTenderDetails.tsx — FIXED
// FIX 6: Bids tab for professional tenders renders BidCard (from useBid) with all required props
// FIX 6: Proposals tab for freelance tenders renders ProposalsSection
// FIX 7: Entity name resolved with same guard as TenderHeader (string-ID safe)
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, FileText, Users, Users2, Settings, Calendar, Eye,
  Bookmark, BarChart3, Send, Trash2, Edit, Plus, AlertTriangle, Loader2,
  ChevronRight, Lock, FileStack, Zap, CheckCircle, Clock, Globe,
  DollarSign, Star, Award, Target, Shield, Hash, Phone, Mail,
  Building, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import {
  useFreelanceTender, useDeleteFreelanceTender, usePublishFreelanceTender,
} from '@/hooks/useFreelanceTender';
import {
  useProfessionalTender, useRevealBids, useDeleteProfessionalTender,
  usePublishProfessionalTender, useAddenda,
} from '@/hooks/useProfessionalTender';
import { useGetBids } from '@/hooks/useBid';
import { useResponsive } from '@/hooks/useResponsive';
import { SectionCard } from '@/components/tenders/shared/SectionCard';
import { InfoItem } from '@/components/tenders/shared/InfoItem';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { AttachmentListSection } from './AttachmentList';
import { ProposalsSection } from './Proposals';
import { AddendumList } from './AddendumForm';
import InviteCompaniesModal from '@/components/tenders2.0/InviteCompaniesModal';
import BidCard from '@/components/bids/BidCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/social/ui/Alert-Dialog';
import TenderStatusBadge from './TenderStatusBadge';

// ─── Props ────────────────────────────────────────────────────────────────────
interface OwnerTenderDetailsProps {
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  /** 'company' or 'organization' — determines the addendum page URL */
  ownerRole?: 'company' | 'organization';
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
      const p: string[] = [];
      if (v.currency) p.push(String(v.currency));
      if (v.percentage !== undefined) p.push(`${v.percentage}%`);
      if (v.required !== undefined) p.push(v.required ? 'Required' : 'Optional');
      return p.join(' ') || JSON.stringify(v);
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

// FIX 7: Same guard as TenderHeader — handles string ObjectId
function resolveEntityName(ownerEntityRaw: any, owner: any): string {
  const entity = typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null ? ownerEntityRaw : null;
  return (
    entity?.name ??
    owner?.name ??
    ([owner?.firstName, owner?.lastName].filter(Boolean).join(' ') || 'Unknown Entity')
  );
}

// ─── Tab definition ───────────────────────────────────────────────────────────
interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  mobileIcon: React.ReactNode;
  badge?: string;
}

// ─── Desktop tab bar ──────────────────────────────────────────────────────────
const DesktopTabBar: React.FC<{ tabs: TabDef[]; active: string; onChange: (id: string) => void }> = ({
  tabs, active, onChange,
}) => (
  <div
    className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex items-center gap-1.5 shrink-0 px-3 sm:px-4 py-3 text-xs font-semibold',
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
            active === tab.id ? 'bg-[#F1BB03] text-[#0A2540]' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
          )}>
            {tab.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
const MobileBottomTabBar: React.FC<{ tabs: TabDef[]; active: string; onChange: (id: string) => void }> = ({
  tabs, active, onChange,
}) => (
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
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center flex-1 gap-0.5 px-1',
              'transition-all duration-150 rounded-xl mx-0.5 my-1.5',
              'min-h-[44px] min-w-[44px]',
              isActive
                ? 'bg-[#FFFBEB] dark:bg-[#F1BB03]/10 text-[#F1BB03]'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
          >
            <div className="relative">
              <span className={cn('block transition-transform duration-150', isActive ? 'scale-110' : 'scale-100')}>
                {tab.mobileIcon}
              </span>
              {tab.badge && (
                <span className={cn(
                  'absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5',
                  'flex items-center justify-center text-[8px] font-bold rounded-full',
                  isActive ? 'bg-[#F1BB03] text-[#0A2540]' : 'bg-gray-400 dark:bg-gray-600 text-white',
                )}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={cn(
              'text-[10px] font-semibold leading-none transition-colors duration-150 truncate max-w-[52px]',
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

// ─── Deadline display ─────────────────────────────────────────────────────────
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
  const iconBg = expired ? 'bg-red-100 dark:bg-red-950/30' : urgent ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-emerald-100 dark:bg-emerald-950/30';
  const iconCol = expired ? 'text-red-600 dark:text-red-400' : urgent ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  const badge = expired
    ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
    : days <= 1 ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse dark:bg-amber-950/30 dark:text-amber-300'
      : days <= 7 ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300';
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-3', colorClasses.bg.white, colorClasses.border.gray200)}>
      <div className={cn('p-2 rounded-full shrink-0', iconBg)}>
        <Calendar className={cn('w-4 h-4', iconCol)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] uppercase tracking-wide', colorClasses.text.muted)}>Submission Deadline</p>
        <p className={cn('text-sm font-semibold mt-0.5 truncate', colorClasses.text.primary)}>
          {expired ? 'Deadline passed' : formatDate(d)}
        </p>
      </div>
      <span className={cn('shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border', badge)}>
        {expired ? 'Expired' : days <= 1 ? `${hours}h left` : `${days}d left`}
      </span>
    </div>
  );
};

// ─── Status timeline ──────────────────────────────────────────────────────────
const STATUS_STEPS = ['draft', 'published', 'locked', 'deadline_reached', 'revealed', 'closed'];
const StatusTimeline: React.FC<{ currentStatus: string; workflowType: string }> = ({ currentStatus, workflowType }) => {
  const steps = workflowType === 'closed' ? STATUS_STEPS : STATUS_STEPS.filter((s) => s !== 'revealed');
  const ci = steps.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-0 flex-wrap gap-y-4">
      {steps.map((step, i) => {
        const past = i < ci; const curr = i === ci;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0',
                curr ? 'bg-[#F1BB03] text-[#0A2540] ring-4 ring-[#F1BB03]/30' : '',
                past ? 'bg-[#0A2540] dark:bg-white text-white dark:text-[#0A2540]' : '',
                !curr && !past ? cn(colorClasses.bg.secondary, colorClasses.text.muted) : '',
              )}>
                {past ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-[8px] uppercase tracking-wide text-center max-w-[44px]',
                curr ? 'text-[#F1BB03] font-semibold' : colorClasses.text.muted,
              )}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 flex-1 min-w-[8px] mb-5', past ? 'bg-[#0A2540] dark:bg-white' : colorClasses.bg.gray300)} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; colorClass?: string }> = ({
  icon, label, value, sub, colorClass,
}) => (
  <div className={cn('rounded-xl border p-3 transition-all', colorClasses.bg.white, colorClasses.border.gray200)}>
    <div className={cn('inline-flex p-1.5 rounded-lg mb-2', colorClass ?? colorClasses.bg.secondary)}>
      {icon}
    </div>
    <p className={cn('text-[10px] uppercase tracking-wide mb-0.5', colorClasses.text.muted)}>{label}</p>
    <p className={cn('text-xl font-bold', colorClasses.text.primary)}>{value}</p>
    {sub && <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>{sub}</p>}
  </div>
);

// ─── Milestone ────────────────────────────────────────────────────────────────
const MilestoneStep: React.FC<{ milestone: any; index: number; total: number }> = ({ milestone, index, total }) => (
  <div className="flex gap-3 pb-5 last:pb-0">
    <div className="flex flex-col items-center shrink-0">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#F1BB03] text-[#0A2540]">
        {index + 1}
      </div>
      {index < total - 1 && <div className={cn('mt-1 w-0.5 flex-1', colorClasses.bg.gray300)} />}
    </div>
    <div className="flex-1 min-w-0 pb-1">
      <p className={cn('font-semibold text-sm break-words', colorClasses.text.primary)}>
        {milestone.title || `Milestone ${index + 1}`}
      </p>
      {milestone.description && (
        <p className={cn('text-xs mt-0.5 break-words', colorClasses.text.secondary)}>{milestone.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {milestone.dueDate && (
          <span className={cn('text-xs', colorClasses.text.muted)}>Due: {formatDate(milestone.dueDate)}</span>
        )}
        {milestone.paymentPercentage !== undefined && (
          <div className="flex items-center gap-2 flex-1 min-w-[100px]">
            <Progress value={milestone.paymentPercentage} className="h-1.5 flex-1" />
            <span className={cn('text-xs font-semibold shrink-0', colorClasses.text.muted)}>
              {milestone.paymentPercentage}%
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-4 p-1">
    <Skeleton className="h-10 w-full rounded-xl" />
    <Skeleton className="h-44 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

const fadeInUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

// ─── Main component ───────────────────────────────────────────────────────────
export const OwnerTenderDetails: React.FC<OwnerTenderDetailsProps> = ({
  tenderId, tenderType, ownerRole = 'company', onEdit, onDelete, className,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { data: flData, isLoading: flLoading, error: flError, refetch: flRefetch } =
    useFreelanceTender(tenderType === 'freelance' ? tenderId : '', { enabled: tenderType === 'freelance' });
  const { data: prData, isLoading: prLoading, error: prError, refetch: prRefetch } =
    useProfessionalTender(tenderType === 'professional' ? tenderId : '', { enabled: tenderType === 'professional' });
  const { data: addenda } = useAddenda(tenderType === 'professional' ? tenderId : '');

  // FIX 6: Fetch bids live for the bids tab (professional only)
  const { data: bidsData, isLoading: bidsLoading } = useGetBids(tenderId, {
    enabled: tenderType === 'professional' && activeTab === 'bids',
  });

  const { mutate: deleteFreelance, isPending: deletingFL } = useDeleteFreelanceTender();
  const { mutate: deleteProfessional, isPending: deletingPR } = useDeleteProfessionalTender();
  const { mutate: publishFreelance, isPending: publishingFL } = usePublishFreelanceTender();
  const { mutate: publishProfessional, isPending: publishingPR } = usePublishProfessionalTender();
  const { mutate: revealBids, isPending: revealingBids } = useRevealBids();

  const rawTender = tenderType === 'freelance' ? (flData as any) : (prData as any);
  const isLoading = tenderType === 'freelance' ? flLoading : prLoading;
  const error = tenderType === 'freelance' ? flError : prError;
  const refetch = tenderType === 'freelance' ? flRefetch : prRefetch;
  const t = (rawTender?.data || rawTender) as any;

  const deadlineInfo = useMemo(() => {
    const raw = t?.deadline || t?.submissionDeadline;
    if (!raw) return { days: 0, urgency: 'normal' };
    const diff = new Date(raw).getTime() - Date.now();
    const days = Math.ceil(diff / 86_400_000);
    if (diff <= 0) return { days: 0, urgency: 'expired' };
    if (days <= 1) return { days, urgency: 'urgent' };
    if (days <= 7) return { days, urgency: 'soon' };
    return { days, urgency: 'normal' };
  }, [t]);

  const status = t?.status ?? 'draft';
  const isDraft = status === 'draft';
  const workflowType = tenderType === 'professional' ? (t?.workflowType ?? 'open') : 'open';
  // FIX 4.1: metadata.totalBids can lag — fall back to actual bids/applications array length
  const totalBids = tenderType === 'professional'
    ? (t?.metadata?.totalBids > 0 ? t.metadata.totalBids : (Array.isArray(t?.bids) ? t.bids.length : 0))
    : (t?.metadata?.totalApplications > 0 ? t.metadata.totalApplications : (Array.isArray(t?.applications) ? t.applications.length : 0));
  const ps = t?.professionalSpecific;

  // FIX 7: Guard against string ObjectId for ownerEntity
  const ownerEntityRaw = t?.ownerEntity;
  const ownerEntity = typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null ? ownerEntityRaw : null;
  const owner = t?.owner;
  const entityName = resolveEntityName(ownerEntityRaw, owner);

  const budget = t?.budget;
  const addendumCount = addenda?.length ?? 0;

  // Invitations
  const isInviteOnly = tenderType === 'professional' && (
    t?.visibilityType === 'invite_only' ||
    t?.visibility?.visibilityType === 'invite_only'
  );
  const invitations: any[] = t?.invitations ?? [];

  // ── Addendum page URL ───────────────────────────────────────────────────────
  const addendumPageUrl = ownerRole === 'organization'
    ? `/dashboard/organization/tenders/tenders/${tenderId}/addendum`
    : `/dashboard/company/tenders/my-tenders/${tenderId}/addendum`;

  const handleDelete = () => {
    if (tenderType === 'freelance') deleteFreelance(tenderId, { onSuccess: () => onDelete?.() });
    else deleteProfessional(tenderId, { onSuccess: () => onDelete?.() });
  };
  const handlePublish = () => {
    if (tenderType === 'freelance') publishFreelance(tenderId);
    else publishProfessional(tenderId);
  };

  // ── Tab list ──────────────────────────────────────────────────────────────
  const tabs: TabDef[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" />, mobileIcon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'details', label: 'Details', icon: <FileText className="w-3.5 h-3.5" />, mobileIcon: <FileText className="w-5 h-5" /> },
    { id: 'attachments', label: 'Files', badge: t?.attachments?.length > 0 ? String(t.attachments.length) : undefined, icon: <FileStack className="w-3.5 h-3.5" />, mobileIcon: <FileStack className="w-5 h-5" /> },
    { id: 'bids', label: tenderType === 'professional' ? 'Bids' : 'Proposals', badge: totalBids > 0 ? String(totalBids) : undefined, icon: <Users className="w-3.5 h-3.5" />, mobileIcon: <Users className="w-5 h-5" /> },
    ...(isInviteOnly ? [{
      id: 'invitations', label: 'Invites',
      badge: invitations.length > 0 ? String(invitations.length) : undefined,
      icon: <Users2 className="w-3.5 h-3.5" />,
      mobileIcon: <Users2 className="w-5 h-5" />,
    }] : []),
    ...(tenderType === 'professional' && addendumCount > 0 ? [{
      id: 'addendum',
      label: 'Addenda',
      badge: String(addendumCount),
      icon: <ClipboardList className="w-3.5 h-3.5" />,
      mobileIcon: <ClipboardList className="w-5 h-5" />,
    }] : []),
    { id: 'actions', label: 'Actions', icon: <Settings className="w-3.5 h-3.5" />, mobileIcon: <Settings className="w-5 h-5" /> },
  ];

  if (isLoading) return <LoadingSkeleton />;
  if (error || !t) return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading tender</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        Could not load tender.
        <button onClick={() => refetch()} className="underline font-medium">Retry</button>
      </AlertDescription>
    </Alert>
  );

  const deadline = t?.deadline || t?.submissionDeadline;
  const briefDesc = t?.briefDescription
    ? t.briefDescription
    : t?.description
      ? (t.description.startsWith('<') ? stripHtml(t.description) : t.description).slice(0, 300)
      : null;

  const contentPb = isMobile ? 'pb-[84px]' : 'pb-6';

  // FIX 6: isBidsRevealed for BidCard
  const isBidsRevealed = bidsData?.isBidsRevealed ?? ['revealed', 'closed'].includes(status);

  return (
    <div className={cn('w-full overflow-hidden', className)}>

      {/* Desktop tab bar */}
      {!isMobile && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
          <DesktopTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
      )}

      {/* Content */}
      <div className={cn('pt-4', contentPb)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >

            {/* ────────── OVERVIEW ────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard icon={<Users className="w-4 h-4 text-blue-500" />} label={tenderType === 'professional' ? 'Bids' : 'Applications'} value={totalBids} colorClass="bg-blue-100 dark:bg-blue-950/30" />
                  <StatCard icon={<Eye className="w-4 h-4 text-amber-500" />} label="Views" value={t?.metadata?.views ?? 0} colorClass="bg-amber-100 dark:bg-amber-950/30" />
                  <StatCard icon={<Calendar className="w-4 h-4 text-slate-500" />} label="Days Left" value={deadlineInfo.urgency === 'expired' ? 'Exp.' : deadlineInfo.days} sub={deadlineInfo.urgency === 'urgent' ? 'Urgent!' : ''} />
                  <StatCard icon={<Bookmark className="w-4 h-4 text-emerald-500" />} label="Saved" value={t?.metadata?.savedBy?.length ?? 0} colorClass="bg-emerald-100 dark:bg-emerald-950/30" />
                </div>

                {/* Title + status badges */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h2 className={cn('text-lg font-bold leading-snug break-words flex-1', colorClasses.text.primary)}>
                      {t.title}
                    </h2>
                    {addendumCount > 0 && (
                      <button
                        onClick={() => setActiveTab('addendum')}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 hover:brightness-95 transition-all"
                      >
                        📋 {addendumCount} Addend{addendumCount === 1 ? 'um' : 'a'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <TenderStatusBadge status={status as any} showDot />
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
                      tenderType === 'professional'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
                    )}>
                      {tenderType === 'professional' ? <Building className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                      {tenderType === 'professional' ? 'Professional' : 'Freelance'}
                    </span>
                    {tenderType === 'professional' && workflowType === 'closed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                        <Lock className="w-3 h-3" /> Sealed Bid
                      </span>
                    )}
                  </div>
                </div>

                {briefDesc && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-slate-500" />} title="About This Tender">
                    <p className={cn('text-sm leading-relaxed break-words', colorClasses.text.secondary)}>
                      {briefDesc}
                      {!t?.briefDescription && t?.description?.length > 300 && (
                        <button onClick={() => setActiveTab('details')} className="ml-1 text-xs text-[#F1BB03] font-semibold hover:underline">Read more →</button>
                      )}
                    </p>
                  </SectionCard>
                )}

                {deadline && <DeadlineDisplay deadline={deadline} />}

                {/* Quick procurement info */}
                {tenderType === 'professional' && ps && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-blue-500" />} title="Procurement Info">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ps.referenceNumber && <InfoItem label="Reference No." value={safeVal(ps.referenceNumber)} icon={<Hash className="w-4 h-4" />} />}
                      {ps.procurementMethod && <InfoItem label="Method" value={safeVal(ps.procurementMethod)} icon={<FileText className="w-4 h-4" />} badge />}
                      {ps.bidSecurityAmount && <InfoItem label="Bid Security" value={`${ps.bidSecurityCurrency || 'ETB'} ${Number(ps.bidSecurityAmount).toLocaleString()}`} icon={<Shield className="w-4 h-4" />} />}
                      {ps.bidValidityPeriod && <InfoItem label="Bid Validity" value={`${ps.bidValidityPeriod} days`} icon={<Clock className="w-4 h-4" />} />}
                    </div>
                  </SectionCard>
                )}

                {/* FIX 7: entity row with safe name */}
                {(ownerEntity || owner) && (
                  <div className={cn('flex items-center gap-3 p-3 rounded-xl border', colorClasses.bg.white, colorClasses.border.gray200)}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold bg-[#0A2540]/10 dark:bg-white/10 text-[#0A2540] dark:text-white">
                      {entityName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs uppercase tracking-wide', colorClasses.text.muted)}>
                        {tenderType === 'professional' ? 'Procuring Entity' : 'Posted By'}
                      </p>
                      <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{entityName}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ────────── DETAILS ────────── */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {t?.description && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-slate-500" />} title="Full Description">
                    <div className="max-h-[500px] overflow-y-auto overflow-x-hidden pr-1">
                      {t.description.startsWith('<')
                        ? <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden [&_*]:max-w-full" dangerouslySetInnerHTML={{ __html: t.description }} />
                        : <p className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words', colorClasses.text.secondary)}>{t.description}</p>}
                    </div>
                  </SectionCard>
                )}

                {tenderType === 'professional' && (
                  <>
                    {/* All procurement fields */}
                    <SectionCard icon={<Target className="w-4 h-4 text-blue-500" />} title="Procurement Details">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {t.procurementCategory && <InfoItem label="Category" value={safeVal(t.procurementCategory)} icon={<Award className="w-4 h-4" />} badge />}
                        {t.tenderType && <InfoItem label="Tender Type" value={safeVal(t.tenderType)} icon={<FileText className="w-4 h-4" />} badge />}
                        {ps?.procurementMethod && <InfoItem label="Method" value={safeVal(ps.procurementMethod)} icon={<FileText className="w-4 h-4" />} badge />}
                        <InfoItem label="Workflow" value={workflowType === 'closed' ? 'Sealed Bid' : 'Open Tender'} icon={<Lock className="w-4 h-4" />} badge />
                        {ps?.referenceNumber && <InfoItem label="Reference No." value={safeVal(ps.referenceNumber)} icon={<Hash className="w-4 h-4" />} />}
                        {ps?.fundingSource && <InfoItem label="Funding Source" value={safeVal(ps.fundingSource)} icon={<Globe className="w-4 h-4" />} />}
                        {(t?.visibilityType || t?.visibility?.visibilityType) && <InfoItem label="Visibility" value={safeVal(t.visibilityType ?? t.visibility?.visibilityType).replace(/_/g, ' ')} icon={<Globe className="w-4 h-4" />} badge />}
                        {ps?.bidSecurityAmount && <InfoItem label="Bid Security" value={`${ps.bidSecurityCurrency || 'ETB'} ${Number(ps.bidSecurityAmount).toLocaleString()}`} icon={<Shield className="w-4 h-4" />} />}
                        {ps?.bidValidityPeriod && <InfoItem label="Bid Validity" value={`${ps.bidValidityPeriod} days`} icon={<Clock className="w-4 h-4" />} />}
                      </div>
                    </SectionCard>

                    {ps?.contactPerson && (
                      <SectionCard icon={<Mail className="w-4 h-4 text-blue-500" />} title="Contact Person">
                        <div className={cn('rounded-lg border p-3 space-y-1.5', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                          {ps.contactPerson.name && <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>{ps.contactPerson.name}</p>}
                          {ps.contactPerson.email && (
                            <div className="flex items-center gap-2">
                              <Mail className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
                              <p className={cn('text-sm break-all', colorClasses.text.secondary)}>{ps.contactPerson.email}</p>
                            </div>
                          )}
                          {ps.contactPerson.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
                              <p className={cn('text-sm', colorClasses.text.secondary)}>{ps.contactPerson.phone}</p>
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    )}

                    {ps?.deliverables?.length > 0 && (
                      <SectionCard icon={<ChevronRight className="w-4 h-4" />} title="Scope & Deliverables">
                        <ul className="space-y-2">
                          {ps.deliverables.map((d: any, i: number) => (
                            <li key={i} className={cn('flex items-start gap-2 text-sm break-words', colorClasses.text.secondary)}>
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{safeVal(d.title ?? d.description ?? d)}</span>
                            </li>
                          ))}
                        </ul>
                      </SectionCard>
                    )}
                    {ps?.milestones?.length > 0 && (
                      <SectionCard icon={<Calendar className="w-4 h-4 text-blue-500" />} title="Milestones">
                        {ps.milestones.map((m: any, i: number) => (
                          <MilestoneStep key={i} milestone={m} index={i} total={ps.milestones.length} />
                        ))}
                      </SectionCard>
                    )}

                    {/* Eligibility */}
                    {(ps?.eligibility || t?.eligibility) && (
                      <SectionCard icon={<Star className="w-4 h-4 text-amber-500" />} title="Eligibility">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(ps?.eligibility?.minimumExperience ?? t?.eligibility?.minimumExperience) != null &&
                            <InfoItem label="Min. Experience" value={`${ps?.eligibility?.minimumExperience ?? t?.eligibility?.minimumExperience} years`} icon={<Clock className="w-4 h-4" />} />}
                          {(ps?.eligibility?.legalRegistrationRequired ?? t?.eligibility?.legalRegistrationRequired) &&
                            <InfoItem label="Legal Registration" value="Required" icon={<Shield className="w-4 h-4" />} badge />}
                        </div>
                      </SectionCard>
                    )}

                    {/* Evaluation */}
                    {(ps?.evaluation || t?.evaluation) && (
                      <SectionCard icon={<BarChart3 className="w-4 h-4 text-purple-500" />} title="Evaluation">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(ps?.evaluation?.evaluationMethod ?? t?.evaluation?.evaluationMethod) &&
                            <InfoItem label="Method" value={safeVal(ps?.evaluation?.evaluationMethod ?? t?.evaluation?.evaluationMethod).replace(/_/g, ' ')} icon={<FileText className="w-4 h-4" />} badge />}
                          {(ps?.evaluation?.technicalWeight ?? t?.evaluation?.technicalWeight) != null &&
                            <InfoItem label="Technical Weight" value={`${ps?.evaluation?.technicalWeight ?? t?.evaluation?.technicalWeight}%`} icon={<Target className="w-4 h-4" />} />}
                          {(ps?.evaluation?.financialWeight ?? t?.evaluation?.financialWeight) != null &&
                            <InfoItem label="Financial Weight" value={`${ps?.evaluation?.financialWeight ?? t?.evaluation?.financialWeight}%`} icon={<DollarSign className="w-4 h-4" />} />}
                        </div>
                      </SectionCard>
                    )}
                  </>
                )}

                {tenderType === 'freelance' && t?.requiredSkills?.length > 0 && (
                  <SectionCard icon={<Award className="w-4 h-4 text-[#F1BB03]" />} title="Required Skills">
                    <div className="flex flex-wrap gap-1.5">
                      {t.requiredSkills.map((s: any, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1BB03]/15 text-[#0A2540] dark:text-[#F1BB03] border border-[#F1BB03]/30">
                          {safeVal(s)}
                        </span>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ────────── ATTACHMENTS ────────── */}
            {activeTab === 'attachments' && (
              <AttachmentListSection
                tenderId={tenderId}
                tenderType={tenderType}
                attachments={t?.attachments ?? []}
                isOwner
                tenderStatus={status}
              />
            )}

            {/* ────────── BIDS / PROPOSALS ────────── */}
            {activeTab === 'bids' && (
              <>
                {/* FIX 6: Professional tenders → live BidCard list from useGetBids */}
                {tenderType === 'professional' ? (
                  <div className="space-y-4">
                    {/* Sealed status info */}
                    {workflowType === 'closed' && ['published', 'locked'].includes(status) && (
                      <div className={cn('flex items-start gap-3 rounded-xl border p-3', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                        <Lock className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.muted)} />
                        <div>
                          <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>Bids are sealed</p>
                          <p className={cn('text-xs mt-0.5', colorClasses.text.secondary)}>All submissions are hidden until bids are revealed after the deadline.</p>
                        </div>
                        <span className={cn('ml-auto shrink-0 text-sm font-bold', colorClasses.text.primary)}>
                          {totalBids} received
                        </span>
                      </div>
                    )}

                    {/* Reveal action when deadline reached */}
                    {status === 'deadline_reached' && workflowType === 'closed' && (
                      <div className={cn('flex items-center justify-between gap-4 p-4 rounded-xl border', 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50')}>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Deadline reached</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{totalBids} sealed bid(s) ready to reveal.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => revealBids(tenderId)}
                          disabled={revealingBids}
                          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#F1BB03] text-[#0A2540] hover:brightness-105 disabled:opacity-60 transition-all min-h-[44px] shadow-sm"
                        >
                          {revealingBids ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          Reveal Bids
                        </button>
                      </div>
                    )}

                    {bidsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                      </div>
                    ) : (bidsData?.bids && bidsData.bids.length > 0) ? (
                      <div className="space-y-3">
                        {bidsData.bids.map((bid) => (
                          // FIX 6: tenderId + viewerRole="owner" + isBidsRevealed
                          <BidCard
                            key={bid._id}
                            bid={bid}
                            tenderId={tenderId}
                            tenderWorkflowType={workflowType as 'open' | 'closed'}
                            isBidsRevealed={isBidsRevealed}
                            deadline={deadline}
                            viewerRole="owner"
                            onClick={() => router.push(`/dashboard/${ownerRole}/tenders/bids/${bid._id}`)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={cn('flex flex-col items-center gap-3 py-10 rounded-xl border', colorClasses.border.gray200, colorClasses.bg.secondary)}>
                        <Users className={cn('w-12 h-12 opacity-20', colorClasses.text.muted)} />
                        <p className={cn('font-semibold', colorClasses.text.primary)}>No bids yet</p>
                        <p className={cn('text-sm', colorClasses.text.muted)}>
                          {workflowType === 'closed' ? 'Bids are sealed until revealed.' : 'Waiting for bidders to submit.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* FIX 6: Freelance tenders → ProposalsSection (unchanged) */
                  <ProposalsSection
                    tenderId={tenderId}
                    tenderType={tenderType}
                    workflowType={workflowType as 'open' | 'closed'}
                    tenderStatus={status}
                    deadline={deadline ?? new Date()}
                    isOwner
                    applications={t?.applications ?? []}
                    totalApplications={totalBids}
                    bids={[]}
                    totalBids={0}
                    sealedBids={0}
                    onRevealBids={() => revealBids(tenderId)}
                    isRevealing={revealingBids}
                  />
                )}
              </>
            )}

            {/* ────────── INVITATIONS ────────── */}
            {activeTab === 'invitations' && isInviteOnly && (
              <div className="space-y-4">
                <SectionCard icon={<Users2 className="w-5 h-5 text-[#F1BB03]" />} title="Company Invitations" description="Companies invited to submit bids">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'accepted', 'declined', 'expired'] as const).map((s) => {
                        const count = invitations.filter((inv) => inv.invitationStatus === s).length;
                        const cfg = {
                          pending:  { bg: 'bg-amber-50 dark:bg-amber-950/20',  text: 'text-amber-700 dark:text-amber-300',   label: 'Pending' },
                          accepted: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'Accepted' },
                          declined: { bg: 'bg-red-50 dark:bg-red-950/20',      text: 'text-red-700 dark:text-red-300',       label: 'Declined' },
                          expired:  { bg: colorClasses.bg.secondary,           text: colorClasses.text.muted,                label: 'Expired' },
                        }[s];
                        return (
                          <div key={s} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', cfg.bg)}>
                            <span className={cn('text-lg font-bold', cfg.text)}>{count}</span>
                            <span className={cn('text-xs font-medium', cfg.text)}>{cfg.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {['draft', 'published', 'locked'].includes(status) && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:brightness-105 shadow-sm transition-all min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" /> Invite More Companies
                      </button>
                    )}
                  </div>
                </SectionCard>

                {invitations.length > 0 ? (
                  <div className={cn('rounded-xl border overflow-hidden', colorClasses.border.gray200)}>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {invitations.map((inv: any) => {
                        const scfg = ({
                          pending:  { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300',   label: 'Pending' },
                          accepted: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Accepted' },
                          declined: { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-600 dark:text-red-300',       label: 'Declined' },
                          expired:  { bg: colorClasses.bg.secondary,              text: colorClasses.text.muted,                label: 'Expired' },
                        } as Record<string, any>)[inv.invitationStatus as string]
                          ?? { bg: colorClasses.bg.secondary, text: colorClasses.text.muted, label: safeVal(inv.invitationStatus) };

                        const name = inv.invitedCompany?.name ?? inv.invitedUser?.name ?? inv.email ?? 'Unknown';
                        const initials = name === 'Unknown' ? '?' : name.charAt(0).toUpperCase();

                        return (
                          <li key={inv._id ?? inv.email} className={cn('flex items-center gap-3 px-4 py-3', colorClasses.bg.white)}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold bg-[#0A2540]/10 dark:bg-white/10 text-[#0A2540] dark:text-white">
                              {inv.invitationType === 'email' ? <Mail className="w-4 h-4" /> : initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{name}</p>
                              <p className={cn('text-xs', colorClasses.text.muted)}>
                                {inv.invitationType === 'company' ? 'Company' : inv.invitationType === 'email' ? 'Email invite' : 'User'}
                                {inv.invitedAt ? ` · Invited ${formatDate(inv.invitedAt)}` : ''}
                                {inv.respondedAt ? ` · Responded ${formatDate(inv.respondedAt)}` : ''}
                              </p>
                            </div>
                            <span className={cn('shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', scfg.bg, scfg.text)}>
                              {scfg.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className={cn('flex flex-col items-center gap-3 py-10 rounded-xl border', colorClasses.border.gray200, colorClasses.bg.secondary)}>
                    <Users2 className={cn('w-8 h-8 opacity-30', colorClasses.text.muted)} />
                    <p className={cn('text-sm font-medium', colorClasses.text.muted)}>No companies invited yet</p>
                    {['draft', 'published', 'locked'].includes(status) && (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:brightness-105"
                      >
                        <Plus className="w-4 h-4" /> Invite Companies
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ────────── ADDENDUM TAB ────────── */}
            {activeTab === 'addendum' && tenderType === 'professional' && (
              <div className="space-y-4">
                <div className={cn('flex items-center justify-between gap-4 p-4 rounded-xl border', colorClasses.bg.white, colorClasses.border.gray200)}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <ClipboardList className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className={cn('font-bold', colorClasses.text.primary)}>
                        {addendumCount} Addend{addendumCount === 1 ? 'um' : 'a'} Issued
                      </p>
                      <p className={cn('text-xs', colorClasses.text.muted)}>Manage amendments to this tender</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(addendumPageUrl)}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:brightness-105 transition-all shadow-sm min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" /> Issue Addendum
                  </button>
                </div>

                <AddendumList tenderId={tenderId} />
              </div>
            )}

            {/* ────────── ACTIONS ────────── */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <SectionCard icon={<ChevronRight className="w-5 h-5" />} title="Status Timeline">
                  <StatusTimeline currentStatus={status} workflowType={workflowType} />
                </SectionCard>

                <SectionCard icon={<Settings className="w-5 h-5" />} title="Tender Actions">
                  <div className="flex flex-wrap gap-3">
                    {isDraft && (
                      <>
                        {onEdit && (
                          <button onClick={onEdit}
                            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px]', colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.primary, 'hover:shadow-sm')}>
                            <Edit className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button onClick={handlePublish} disabled={publishingFL || publishingPR}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:brightness-105 disabled:opacity-60 transition-all min-h-[44px]">
                          {(publishingFL || publishingPR) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Publish
                        </button>
                      </>
                    )}
                    {!isDraft && tenderType === 'professional' && (
                      <>
                        <button
                          onClick={() => router.push(addendumPageUrl)}
                          className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-h-[44px] hover:border-[#F1BB03] hover:bg-amber-50', colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.primary)}
                        >
                          <ClipboardList className="w-4 h-4 text-amber-500" /> Issue Addendum
                        </button>
                        {status === 'deadline_reached' && workflowType === 'closed' && (
                          <button onClick={() => revealBids(tenderId)} disabled={revealingBids}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F1BB03] text-[#0A2540] hover:brightness-105 disabled:opacity-60 transition-all min-h-[44px]">
                            {revealingBids ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Reveal Bids
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </SectionCard>

                {isDraft && (
                  <div className="rounded-xl border-2 border-red-200 dark:border-red-800 p-4 bg-red-50/50 dark:bg-red-950/10">
                    <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Danger Zone
                    </h3>
                    <p className="text-sm text-red-500 dark:text-red-400 mb-4">Deleting a tender is permanent and cannot be undone.</p>
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors min-h-[44px]">
                      <Trash2 className="w-4 h-4" /> Delete Tender
                    </button>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && <MobileBottomTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />}

      {/* Delete dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tender?</AlertDialogTitle>
            <AlertDialogDescription>This is permanent. All data will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deletingFL || deletingPR} className="bg-red-600 hover:bg-red-700 text-white">
              {(deletingFL || deletingPR) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite modal */}
      {isInviteOnly && (
        <InviteCompaniesModal
          tenderId={tenderId}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          alreadyInvitedIds={invitations
            .filter((inv: any) => inv.invitedCompany)
            .map((inv: any) => inv.invitedCompany?._id?.toString() ?? inv.invitedCompany?.toString())}
        />
      )}
    </div>
  );
};