// components/tenders2.0/ProfessionalTenderDetails.tsx — FULLY FIXED
// FIX 3.1: Overview "Procurement Info" shows procuringEntity string prominently
// FIX 3.2: Details tab description uses colorClasses.text.secondary (visible in dark mode)
// FIX 3.3: Attachment tab — uses new AttachmentListSection (fixed download buttons)
// FIX 3.4: Entity tab shows procuringEntity + contact info even when ownerEntity is minimal
// FIX 5.2: BidCard gets tenderId; totalBids falls back to bids array length
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, FileStack, Users, Building, Calendar,
  DollarSign, Globe, MapPin, AlertTriangle, Lock, CheckCircle, Info,
  Zap, Clock, ChevronRight, Star, BadgeCheck, Shield, Hash, Phone, Mail,
  ClipboardList, Target, Award, Scale,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useRouter } from 'next/navigation';
import {
  useProfessionalTender,
  useRespondToInvitation,
  useAddenda,
} from '@/hooks/useProfessionalTender';
import { useGetBids } from '@/hooks/useBid';
import { useResponsive } from '@/hooks/useResponsive';
import { SectionCard } from '@/components/tenders/shared/SectionCard';
import { InfoItem } from '@/components/tenders/shared/InfoItem';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { AttachmentListSection } from './AttachmentList';
import { AddendumList } from './AddendumForm';
import TenderOwnerAvatar from './TenderOwnerAvatar';
import TenderStatusBadge from './TenderStatusBadge';
import { companyService, type CompanyProfile } from '@/services/companyService';

interface ProfessionalTenderDetailsProps {
  tenderId: string;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
    if (v.min !== undefined && v.max !== undefined) return `${v.currency ? v.currency + ' ' : ''}${v.min}–${v.max}`;
    if (v.value !== undefined && v.unit !== undefined) return `${v.value} ${v.unit}`;
    if (v.label) return String(v.label);
    if (v.name) return String(v.name);
    return JSON.stringify(v);
  }
  return String(v);
};

// Guard against unpopulated ObjectId strings
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
  id: string; label: string; icon: React.ReactNode; mobileIcon: React.ReactNode; badge?: string;
}

// ─── Desktop tab bar ──────────────────────────────────────────────────────────
const DesktopTabBar: React.FC<{ tabs: TabDef[]; active: string; onChange: (id: string) => void }> = ({ tabs, active, onChange }) => (
  <div className={cn('flex overflow-x-auto border-b', colorClasses.bg.primary, colorClasses.border.secondary)}
    style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)}
        className={cn('flex items-center gap-1.5 shrink-0 px-3 sm:px-4 py-3 text-xs font-semibold',
          'border-b-2 whitespace-nowrap transition-all min-h-[44px]',
          active === tab.id
            ? 'border-[#F1BB03] text-[#0A2540] dark:text-[#F1BB03] bg-[#FFFBEB]/40 dark:bg-[#F1BB03]/5'
            : cn('border-transparent', colorClasses.text.muted))}>
        <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>
        <span>{tab.label}</span>
        {tab.badge && (
          <span className={cn('ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold inline-flex items-center justify-center',
            active === tab.id ? 'bg-[#F1BB03] text-[#0A2540]' : cn(colorClasses.bg.secondary, colorClasses.text.muted))}>
            {tab.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
const MobileBottomTabBar: React.FC<{ tabs: TabDef[]; active: string; onChange: (id: string) => void }> = ({ tabs, active, onChange }) => (
  <nav className={cn('fixed bottom-0 left-0 right-0 z-50 border-t', colorClasses.border.secondary,
    'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_-2px_16px_rgba(0,0,0,0.08)]')}
    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
    <div className="flex justify-around items-stretch h-16 px-1">
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} aria-label={tab.label} aria-current={isActive ? 'page' : undefined}
            className={cn('flex flex-col items-center justify-center flex-1 gap-0.5 px-1',
              'transition-all duration-150 rounded-xl mx-0.5 my-1.5 min-h-[44px] min-w-[44px]',
              isActive ? 'bg-[#FFFBEB] dark:bg-[#F1BB03]/10 text-[#F1BB03]' : cn(colorClasses.text.muted))}>
            <div className="relative">
              <span className={cn('block transition-transform duration-150', isActive ? 'scale-110' : 'scale-100')}>{tab.mobileIcon}</span>
              {tab.badge && (
                <span className={cn('absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5',
                  'flex items-center justify-center text-[8px] font-bold rounded-full',
                  isActive ? 'bg-[#F1BB03] text-[#0A2540]' : 'bg-gray-400 dark:bg-gray-600 text-white')}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={cn('text-[10px] font-semibold leading-none truncate max-w-[52px]', isActive ? 'text-[#F1BB03]' : colorClasses.text.muted)}>
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
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 60_000); return () => clearInterval(id); }, []);
  const d = new Date(deadline);
  const diff = d.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  const hours = Math.ceil(diff / 3_600_000);
  const expired = diff <= 0;
  const iconBg = expired ? 'bg-red-100 dark:bg-red-950/30' : days <= 7 ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-emerald-100 dark:bg-emerald-950/30';
  const iconCol = expired ? 'text-red-600 dark:text-red-400' : days <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  const badge = expired ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
    : days <= 1 ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse dark:bg-amber-950/30 dark:text-amber-300'
    : days <= 7 ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300';
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-3', colorClasses.bg.primary, colorClasses.border.secondary)}>
      <div className={cn('p-2 rounded-full shrink-0', iconBg)}><Calendar className={cn('w-4 h-4', iconCol)} /></div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] uppercase tracking-wide', colorClasses.text.muted)}>Submission Deadline</p>
        <p className={cn('text-sm font-semibold mt-0.5 truncate', colorClasses.text.primary)}>{expired ? 'Deadline passed' : formatDate(d)}</p>
      </div>
      <span className={cn('shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border', badge)}>
        {expired ? 'Expired' : days <= 1 ? `${hours}h left` : `${days}d left`}
      </span>
    </div>
  );
};

// ─── Milestone step ───────────────────────────────────────────────────────────
const MilestoneStep: React.FC<{ milestone: any; index: number; total: number }> = ({ milestone, index, total }) => (
  <div className="flex gap-3 pb-5 last:pb-0">
    <div className="flex flex-col items-center shrink-0">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#F1BB03] text-[#0A2540]">{index + 1}</div>
      {index < total - 1 && <div className={cn('mt-1 w-0.5 flex-1', colorClasses.bg.secondary)} />}
    </div>
    <div className="flex-1 min-w-0 pb-1">
      <p className={cn('font-semibold text-sm break-words', colorClasses.text.primary)}>{milestone.title || `Milestone ${index + 1}`}</p>
      {milestone.description && <p className={cn('text-xs mt-0.5 break-words', colorClasses.text.secondary)}>{milestone.description}</p>}
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {milestone.dueDate && <span className={cn('text-xs', colorClasses.text.muted)}>Due: {formatDate(milestone.dueDate)}</span>}
        {milestone.paymentPercentage !== undefined && (
          <div className="flex items-center gap-2 flex-1 min-w-[100px]">
            <Progress value={milestone.paymentPercentage} className="h-1.5 flex-1" />
            <span className={cn('text-xs font-semibold shrink-0', colorClasses.text.muted)}>{milestone.paymentPercentage}%</span>
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
export const ProfessionalTenderDetails: React.FC<ProfessionalTenderDetailsProps> = ({ tenderId, className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refCopied, setRefCopied] = useState(false);
  // FIX entity tab: fetch full company profile lazily when entity tab opens
  const [fullEntity, setFullEntity] = useState<CompanyProfile | null>(null);
  const [entityLoading, setEntityLoading] = useState(false);

  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const { data, isLoading, error, refetch } = useProfessionalTender(tenderId);
  const { mutate: respondToInvitation, isPending: responding } = useRespondToInvitation();
  const { data: addenda } = useAddenda(tenderId);
  const { data: bidsData, isLoading: bidsLoading } = useGetBids(tenderId, { enabled: activeTab === 'bids' });

  const tender = data as any;
  const myInvitation = (data as any)?.myInvitationStatus;

  const status       = tender?.status ?? 'published';
  const workflowType = tender?.workflowType ?? 'open';
  const isActive     = ['published', 'locked'].includes(status);
  const ps           = tender?.professionalSpecific;

  // Guard string ObjectId
  const ownerEntityRaw = tender?.ownerEntity;
  const ownerEntity    = typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null ? ownerEntityRaw : null;
  const owner          = tender?.owner;

  // FIX 3.1: procuringEntity is the declared string name; entityName is the ownerEntity.name
  const procuringEntityStr = ps?.procuringEntity ?? tender?.procurement?.procuringEntity ?? null;
  const entityName         = resolveEntityName(ownerEntityRaw, owner);
  // Display: prefer the declared procuringEntity string, fall back to ownerEntity name
  const displayEntityName  = procuringEntityStr || entityName;

  // FIX 5.2: totalBids — metadata may lag; fallback to bids array length
  const metaBids    = tender?.metadata?.totalBids ?? 0;
  const bidsArrLen  = Array.isArray(tender?.bids) ? tender.bids.length : 0;
  const totalBids   = metaBids > 0 ? metaBids : bidsArrLen;

  const deadline      = tender?.submissionDeadline ?? tender?.deadline;
  const addendumCount = addenda?.length ?? 0;

  // FIX entity tab: Contact person from procurement sub-doc
  const contactPerson = ps?.contactPerson ?? tender?.procurement?.contactPerson ?? null;

  // FIX entity tab: fetch full company/org profile lazily when entity tab is opened.
  // The controller only populates ownerEntity with name/logo/headline.
  // We call getPublicCompany to get phone, email, industry, description etc.
  useEffect(() => {
    if (activeTab !== 'entity') return;
    if (fullEntity || entityLoading) return;
    const entityId = ownerEntity?._id?.toString?.() ?? ownerEntityRaw?.toString?.();
    if (!entityId || typeof entityId !== 'string') return;
    setEntityLoading(true);
    companyService.getPublicCompany(entityId)
      .then(profile => {
        if (profile) setFullEntity(profile);
      })
      .catch(() => { /* silent — fall back to whatever ownerEntity has */ })
      .finally(() => setEntityLoading(false));
  }, [activeTab, ownerEntity, ownerEntityRaw, fullEntity, entityLoading]);

  const tabs: TabDef[] = [
    { id: 'overview',    label: 'Overview',    icon: <LayoutDashboard className="w-3.5 h-3.5" />, mobileIcon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'details',     label: 'Details',     icon: <FileText className="w-3.5 h-3.5" />,        mobileIcon: <FileText className="w-5 h-5" /> },
    { id: 'attachments', label: 'Files',       icon: <FileStack className="w-3.5 h-3.5" />,       mobileIcon: <FileStack className="w-5 h-5" />, badge: tender?.attachments?.length > 0 ? String(tender.attachments.length) : undefined },
    { id: 'bids',        label: 'Bids',        icon: <Users className="w-3.5 h-3.5" />,           mobileIcon: <Users className="w-5 h-5" />, badge: totalBids > 0 ? String(totalBids) : undefined },
    ...(addendumCount > 0 ? [{ id: 'addendum', label: 'Addenda', icon: <ClipboardList className="w-3.5 h-3.5" />, mobileIcon: <ClipboardList className="w-5 h-5" />, badge: String(addendumCount) }] : []),
    { id: 'actions',     label: 'Actions',     icon: <Zap className="w-3.5 h-3.5" />,             mobileIcon: <Zap className="w-5 h-5" /> },
    { id: 'entity',      label: 'Entity',      icon: <Building className="w-3.5 h-3.5" />,         mobileIcon: <Building className="w-5 h-5" /> },
  ];

  if (isLoading) return <LoadingSkeleton />;
  if (error || !tender) return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error loading tender</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        Could not load tender.
        <button onClick={() => refetch()} className="underline font-medium">Retry</button>
      </AlertDescription>
    </Alert>
  );

  const briefDesc = tender?.briefDescription
    ? tender.briefDescription
    : tender?.description
      ? (tender.description.startsWith('<') ? stripHtml(tender.description) : tender.description).slice(0, 300)
      : null;

  const contentPb = isMobile ? 'pb-[84px]' : 'pb-6';

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {!isMobile && (
        <div className={cn('sticky top-0 z-10 shadow-sm', colorClasses.bg.primary)}>
          <DesktopTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>
      )}

      <div className={cn('pt-4', contentPb)}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={fadeInUp} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.15 }}>

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h2 className={cn('text-lg font-bold leading-snug break-words flex-1', colorClasses.text.primary)}>{tender.title}</h2>
                    {addendumCount > 0 && (
                      <button onClick={() => setActiveTab('addendum')} className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 hover:brightness-95 transition-all">
                        📋 {addendumCount} Addend{addendumCount === 1 ? 'um' : 'a'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <TenderStatusBadge status={status as any} showDot />
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
                      workflowType === 'closed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800')}>
                      {workflowType === 'closed' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {workflowType === 'closed' ? 'Sealed Bid' : 'Open Tender'}
                    </span>
                    {(ps?.procurementMethod ?? tender?.procurement?.procurementMethod) && (
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border', colorClasses.bg.secondary, colorClasses.border.secondary, colorClasses.text.secondary)}>
                        {safeVal(ps?.procurementMethod ?? tender?.procurement?.procurementMethod).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {briefDesc && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-slate-500" />} title="About This Tender">
                    <p className={cn('text-sm leading-relaxed break-words', colorClasses.text.secondary)}>
                      {briefDesc}
                      {!tender?.briefDescription && tender?.description?.length > 300 && (
                        <button onClick={() => setActiveTab('details')} className="ml-1 text-xs text-[#F1BB03] font-semibold hover:underline">Read more →</button>
                      )}
                    </p>
                  </SectionCard>
                )}

                {deadline && <DeadlineDisplay deadline={deadline} />}

                {/* FIX 3.1: Procurement Info card now shows procuringEntity prominently */}
                <SectionCard icon={<FileText className="w-4 h-4 text-blue-500" />} title="Procurement Info">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Procuring Entity — declared string, most important field */}
                    {displayEntityName && (
                      <InfoItem label="Procuring Entity" value={displayEntityName} icon={<Building className="w-4 h-4 text-slate-500" />} />
                    )}
                    {(ps?.referenceNumber ?? tender?.referenceNumber) && (
                      <div>
                        <p className={cn('text-xs uppercase tracking-wide mb-1', colorClasses.text.muted)}>Reference No.</p>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm font-mono font-semibold', colorClasses.text.primary)}>
                            {ps?.referenceNumber ?? tender?.referenceNumber}
                          </span>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(ps?.referenceNumber ?? tender?.referenceNumber);
                              setRefCopied(true);
                              setTimeout(() => setRefCopied(false), 2000);
                            }}
                            className={cn('text-xs font-semibold shrink-0 transition-colors', refCopied ? 'text-emerald-500' : colorClasses.text.muted, 'hover:text-[#F1BB03]')}>
                            {refCopied ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                    {(ps?.procurementMethod ?? tender?.procurement?.procurementMethod) && (
                      <InfoItem label="Procurement Method" value={safeVal(ps?.procurementMethod ?? tender?.procurement?.procurementMethod).replace(/_/g, ' ')} icon={<FileText className="w-4 h-4 text-slate-500" />} badge />
                    )}
                    {(ps?.bidSecurityAmount ?? tender?.procurement?.bidSecurityAmount) && (
                      <InfoItem label="Bid Security"
                        value={`${ps?.bidSecurityCurrency ?? tender?.procurement?.bidSecurityCurrency ?? 'ETB'} ${Number(ps?.bidSecurityAmount ?? tender?.procurement?.bidSecurityAmount).toLocaleString()}`}
                        icon={<Shield className="w-4 h-4 text-slate-500" />} />
                    )}
                    {(ps?.bidValidityPeriod ?? tender?.procurement?.bidValidityPeriod) && (
                      <InfoItem label="Bid Validity" value={`${ps?.bidValidityPeriod ?? tender?.procurement?.bidValidityPeriod} days`} icon={<Clock className="w-4 h-4 text-slate-500" />} />
                    )}
                    {totalBids > 0 && <InfoItem label="Total Bids" value={String(totalBids)} icon={<Users className="w-4 h-4 text-indigo-500" />} />}
                    {(ps?.fundingSource ?? tender?.procurement?.fundingSource) && (
                      <InfoItem label="Funding Source" value={safeVal(ps?.fundingSource ?? tender?.procurement?.fundingSource)} icon={<Globe className="w-4 h-4 text-slate-500" />} />
                    )}
                  </div>
                </SectionCard>

                {isActive && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/dashboard/company/tenders/apply/${tenderId}`)}
                    className="w-full h-12 rounded-xl bg-[#F1BB03] text-[#0A2540] font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 min-h-[44px]">
                    <Zap className="w-4 h-4" /> Make a Bid
                  </motion.button>
                )}

                {(ownerEntity || owner || procuringEntityStr) && (
                  <div className={cn('flex items-center gap-3 p-3 rounded-xl border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                    <TenderOwnerAvatar ownerEntity={ownerEntity} owner={owner} tenderType="professional" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs uppercase tracking-wide', colorClasses.text.muted)}>Procuring Entity</p>
                      <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)}>{displayEntityName}</p>
                    </div>
                    <button onClick={() => setActiveTab('entity')} className="text-xs text-[#F1BB03] font-semibold shrink-0 hover:underline">View →</button>
                  </div>
                )}
              </div>
            )}

            {/* ── DETAILS ── */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {tender.description && (
                  <SectionCard icon={<FileText className="w-4 h-4 text-slate-500" />} title="Tender Description">
                    {/* FIX 3.2: colorClasses.text.secondary is visible in both light and dark mode */}
                    <div className="max-h-[500px] overflow-y-auto overflow-x-hidden pr-1">
                      {tender.description.startsWith('<') ? (
                        <div
                          className={cn(
                            'prose prose-sm dark:prose-invert max-w-none overflow-hidden [&_*]:max-w-full [&_pre]:overflow-x-auto',
                            // Force text colour in dark mode — prose-invert handles most tags but we add an explicit class
                            colorClasses.text.secondary
                          )}
                          dangerouslySetInnerHTML={{ __html: tender.description }}
                        />
                      ) : (
                        <p className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words', colorClasses.text.secondary)}>
                          {tender.description}
                        </p>
                      )}
                    </div>
                  </SectionCard>
                )}

                <SectionCard icon={<Target className="w-4 h-4 text-blue-500" />} title="Procurement Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayEntityName && <InfoItem label="Procuring Entity" value={displayEntityName} icon={<Building className="w-4 h-4" />} />}
                    {(tender.procurementCategory) && <InfoItem label="Category" value={safeVal(tender.procurementCategory)} icon={<Award className="w-4 h-4" />} badge />}
                    {tender.tenderType && <InfoItem label="Tender Type" value={safeVal(tender.tenderType)} icon={<FileText className="w-4 h-4" />} badge />}
                    {(ps?.procurementMethod ?? tender?.procurement?.procurementMethod) && (
                      <InfoItem label="Method" value={safeVal(ps?.procurementMethod ?? tender?.procurement?.procurementMethod).replace(/_/g, ' ')} icon={<FileText className="w-4 h-4" />} badge />
                    )}
                    <InfoItem label="Workflow" value={workflowType === 'closed' ? 'Sealed Bid' : 'Open Tender'} icon={<Lock className="w-4 h-4" />} badge />
                    {(ps?.referenceNumber ?? tender?.referenceNumber) && (
                      <InfoItem label="Reference No." value={safeVal(ps?.referenceNumber ?? tender?.referenceNumber)} icon={<Hash className="w-4 h-4" />} />
                    )}
                    {(tender?.visibilityType ?? tender?.visibility?.visibilityType) && (
                      <InfoItem label="Visibility" value={safeVal(tender.visibilityType ?? tender?.visibility?.visibilityType).replace(/_/g, ' ')} icon={<Globe className="w-4 h-4" />} badge />
                    )}
                    {(ps?.fundingSource ?? tender?.procurement?.fundingSource) && (
                      <InfoItem label="Funding Source" value={safeVal(ps?.fundingSource ?? tender?.procurement?.fundingSource)} icon={<Globe className="w-4 h-4" />} />
                    )}
                    {(ps?.bidSecurityAmount ?? tender?.procurement?.bidSecurityAmount) && (
                      <InfoItem label="Bid Security"
                        value={`${ps?.bidSecurityCurrency ?? tender?.procurement?.bidSecurityCurrency ?? 'ETB'} ${Number(ps?.bidSecurityAmount ?? tender?.procurement?.bidSecurityAmount).toLocaleString()}`}
                        icon={<Shield className="w-4 h-4" />} />
                    )}
                    {(ps?.bidValidityPeriod ?? tender?.procurement?.bidValidityPeriod) && (
                      <InfoItem label="Bid Validity" value={`${ps?.bidValidityPeriod ?? tender?.procurement?.bidValidityPeriod} days`} icon={<Clock className="w-4 h-4" />} />
                    )}
                  </div>
                </SectionCard>

                {/* Deliverables */}
                {(ps?.deliverables?.length > 0 || tender?.scope?.deliverables?.length > 0) && (
                  <SectionCard icon={<ChevronRight className="w-4 h-4" />} title="Scope & Deliverables">
                    <ul className="space-y-2">
                      {(ps?.deliverables ?? tender?.scope?.deliverables ?? []).map((d: any, i: number) => (
                        <li key={i} className={cn('flex items-start gap-2 text-sm break-words', colorClasses.text.secondary)}>
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{safeVal(d.title ?? d.description ?? d)}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

                {/* Milestones */}
                {(ps?.milestones?.length > 0 || tender?.scope?.milestones?.length > 0) && (
                  <SectionCard icon={<Calendar className="w-4 h-4 text-blue-500" />} title="Milestones">
                    {(ps?.milestones ?? tender?.scope?.milestones ?? []).map((m: any, i: number, arr: any[]) => (
                      <MilestoneStep key={i} milestone={m} index={i} total={arr.length} />
                    ))}
                  </SectionCard>
                )}

                {/* Eligibility */}
                {(tender?.eligibility || ps?.eligibility) && (
                  <SectionCard icon={<Star className="w-4 h-4 text-amber-500" />} title="Eligibility Requirements">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(tender?.eligibility?.minimumExperience ?? ps?.eligibility?.minimumExperience) != null && (
                        <InfoItem label="Min. Experience" value={`${tender?.eligibility?.minimumExperience ?? ps?.eligibility?.minimumExperience} years`} icon={<Clock className="w-4 h-4" />} />
                      )}
                      {(tender?.eligibility?.legalRegistrationRequired ?? ps?.eligibility?.legalRegistrationRequired) && (
                        <InfoItem label="Legal Registration" value="Required" icon={<Shield className="w-4 h-4" />} badge />
                      )}
                    </div>
                    {(tender?.eligibility?.requiredCertifications ?? ps?.eligibility?.requiredCertifications)?.length > 0 && (
                      <div className="mt-3">
                        <p className={cn('text-xs uppercase tracking-wide mb-2', colorClasses.text.muted)}>Required Certifications</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(tender?.eligibility?.requiredCertifications ?? ps?.eligibility?.requiredCertifications).map((c: string, i: number) => (
                            <span key={i} className={cn('px-2.5 py-1 rounded-full text-xs font-medium', colorClasses.bg.secondary, colorClasses.text.secondary)}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </SectionCard>
                )}

                {/* Evaluation */}
                {(tender?.evaluation || ps?.evaluation) && (
                  <SectionCard icon={<Scale className="w-4 h-4 text-purple-500" />} title="Evaluation Method">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(tender?.evaluation?.evaluationMethod ?? ps?.evaluation?.evaluationMethod) && (
                        <InfoItem label="Method" value={safeVal(tender?.evaluation?.evaluationMethod ?? ps?.evaluation?.evaluationMethod).replace(/_/g, ' ')} icon={<FileText className="w-4 h-4" />} badge />
                      )}
                      {(tender?.evaluation?.technicalWeight ?? ps?.evaluation?.technicalWeight) != null && (
                        <InfoItem label="Technical Weight" value={`${tender?.evaluation?.technicalWeight ?? ps?.evaluation?.technicalWeight}%`} icon={<Target className="w-4 h-4" />} />
                      )}
                      {(tender?.evaluation?.financialWeight ?? ps?.evaluation?.financialWeight) != null && (
                        <InfoItem label="Financial Weight" value={`${tender?.evaluation?.financialWeight ?? ps?.evaluation?.financialWeight}%`} icon={<DollarSign className="w-4 h-4" />} />
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* Pre-bid meeting */}
                {(tender?.preBidMeeting?.date || ps?.preBidMeeting?.date) && (
                  <SectionCard icon={<Calendar className="w-4 h-4 text-blue-500" />} title="Pre-Bid Meeting">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/50 p-3 space-y-1.5">
                      {(tender?.preBidMeeting?.mandatory ?? ps?.preBidMeeting?.mandatory) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">Mandatory</span>
                      )}
                      {(tender?.preBidMeeting?.date ?? ps?.preBidMeeting?.date) && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">📅 {formatDate(tender?.preBidMeeting?.date ?? ps?.preBidMeeting?.date)}</p>
                      )}
                      {(tender?.preBidMeeting?.location ?? ps?.preBidMeeting?.location) && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 break-words">📍 {tender?.preBidMeeting?.location ?? ps?.preBidMeeting?.location}</p>
                      )}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ── ATTACHMENTS — FIX 3.3 ── */}
            {activeTab === 'attachments' && (
              <AttachmentListSection tenderId={tenderId} tenderType="professional" attachments={tender.attachments ?? []} isOwner={false} tenderStatus={status} />
            )}

            {/* ── BIDS — inline renderer so bid.tender doesn't need to be populated ── */}
            {activeTab === 'bids' && (
              <div className="space-y-4">
                {!['revealed', 'closed'].includes(status) && workflowType === 'open' && (
                  <div className={cn('flex items-start gap-3 rounded-xl border p-3', colorClasses.bg.secondary, colorClasses.border.secondary)}>
                    <Info className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.muted)} />
                    <p className={cn('text-sm', colorClasses.text.secondary)}>Bid amounts are hidden until the procurement process is complete.</p>
                  </div>
                )}
                {workflowType === 'closed' && !bidsData?.isBidsRevealed && (
                  <div className={cn('flex items-start gap-3 rounded-xl border p-3', colorClasses.bg.blueLight, colorClasses.border.blue600)}>
                    <Lock className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.blue600)} />
                    <p className={cn('text-sm font-medium', colorClasses.text.blue600)}>
                      Bids are sealed until the deadline. Amounts will be revealed after the reveal date.
                    </p>
                  </div>
                )}
                {bidsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-28 w-full rounded-2xl" />
                  </div>
                ) : (bidsData?.bids && bidsData.bids.length > 0) ? (
                  <div className="space-y-3">
                    {bidsData.bids.map(bid => {
                      const b = bid as any;
                      const bidAmount = b.bidAmount != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: b.currency || 'ETB' }).format(b.bidAmount)
                        : null;
                      const bidderName = b.bidderCompany?.name ?? b.companyName ?? b.bidder?.name ?? b.bidder?.email ?? '—';
                      const isRevealed = bidsData.isBidsRevealed || ['revealed', 'closed'].includes(status);
                      const statusColors: Record<string, string> = {
                        submitted:           '#F59E0B',
                        under_review:        '#2563EB',
                        shortlisted:         '#2AA198',
                        interview_scheduled: '#8B5CF6',
                        awarded:             '#F1BB03',
                        rejected:            '#A0A0A0',
                        withdrawn:           '#A0A0A0',
                      };
                      const accentColor = statusColors[b.status] ?? '#A0A0A0';
                      const evalScore = b.evaluation?.combinedScore ?? b.evaluation?.technicalScore;

                      return (
                        <div key={b._id}
                          className={cn('rounded-2xl border overflow-hidden', colorClasses.bg.primary, colorClasses.border.secondary)}>
                          {/* Status accent strip */}
                          <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
                          <div className="p-4 space-y-3">
                            {/* Row 1: Bidder + status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className={cn('text-sm font-bold truncate', colorClasses.text.primary)}>{bidderName}</p>
                                {b.bidNumber && (
                                  <p className={cn('text-xs font-mono mt-0.5', colorClasses.text.muted)}>#{b.bidNumber}</p>
                                )}
                              </div>
                              <span className={cn('shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                                'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700')}>
                                {(b.status ?? '—').replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Row 2: Bid amount */}
                            {isRevealed && bidAmount ? (
                              <p className="text-2xl font-bold text-[#F1BB03] leading-none">{bidAmount}</p>
                            ) : (
                              <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold', colorClasses.bg.blueLight, colorClasses.text.blue600)}>
                                <Lock className="w-3 h-3" />
                                {workflowType === 'closed' ? 'Sealed until reveal' : 'Amount hidden'}
                              </div>
                            )}

                            {/* Row 3: Meta */}
                            <div className={cn('flex flex-wrap gap-x-3 gap-y-1 text-xs', colorClasses.text.muted)}>
                              {b.submittedAt && (
                                <span>Submitted: {formatDate(b.submittedAt)}</span>
                              )}
                              {b.sealed && workflowType === 'closed' && (
                                <span className={cn('inline-flex items-center gap-1 font-medium', colorClasses.text.blue600)}>
                                  <Lock className="w-3 h-3" /> Sealed
                                </span>
                              )}
                            </div>

                            {/* Row 4: Eval score if available */}
                            {evalScore != null && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F1BB03]/20 text-[#F1BB03]">
                                Score: {evalScore.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={cn('flex flex-col items-center gap-3 py-10 rounded-xl border', colorClasses.border.secondary, colorClasses.bg.secondary)}>
                    <Users className={cn('w-12 h-12 opacity-20', colorClasses.text.muted)} />
                    <p className={cn('font-semibold', colorClasses.text.primary)}>No bids yet</p>
                    <p className={cn('text-sm', colorClasses.text.muted)}>
                      {workflowType === 'closed' ? 'Bids will be revealed after the deadline.' : 'Be the first to submit a bid.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── ADDENDUM ── */}
            {activeTab === 'addendum' && (
              <div className="space-y-4">
                <div className={cn('flex items-center gap-3 p-4 rounded-xl border', colorClasses.bg.primary, colorClasses.border.secondary)}>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className={cn('font-bold', colorClasses.text.primary)}>{addendumCount} Addend{addendumCount === 1 ? 'um' : 'a'} Issued</p>
                    <p className={cn('text-xs', colorClasses.text.muted)}>Modifications to this tender notified to all registered bidders</p>
                  </div>
                </div>
                <AddendumList tenderId={tenderId} />
              </div>
            )}

            {/* ── ACTIONS ── */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                {myInvitation?.status === 'pending' && (
                  <SectionCard icon={<Star className="w-5 h-5 text-[#F1BB03]" />} title="You've Been Invited">
                    <p className={cn('text-sm mb-4', colorClasses.text.secondary)}>You have been invited to participate in this tender.</p>
                    <div className="flex gap-3 flex-wrap">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => respondToInvitation({ id: tenderId, inviteId: myInvitation._id, response: 'accepted' })}
                        disabled={responding}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors min-h-[44px]">
                        <CheckCircle className="w-4 h-4" /> Accept Invitation
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => respondToInvitation({ id: tenderId, inviteId: myInvitation._id, response: 'declined' })}
                        disabled={responding}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:text-red-400 disabled:opacity-60 transition-colors min-h-[44px]">
                        Decline
                      </motion.button>
                    </div>
                  </SectionCard>
                )}

                {isActive && (
                  <SectionCard icon={<Zap className="w-5 h-5 text-[#F1BB03]" />} title="Submit a Bid">
                    <p className={cn('text-sm mb-4', colorClasses.text.secondary)}>
                      {workflowType === 'closed' ? 'This is a sealed-bid tender. Your submission will be kept confidential until the reveal date.' : 'Submit your proposal to compete for this tender.'}
                    </p>
                    {deadline && <DeadlineDisplay deadline={deadline} />}
                    <div className="mt-4">
                      {workflowType === 'closed' && (
                        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                          <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Sealed Bid — your amount will be hidden until bids are revealed</p>
                        </div>
                      )}
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/dashboard/company/tenders/apply/${tenderId}`)}
                        className="w-full h-12 rounded-xl bg-[#F1BB03] text-[#0A2540] font-bold text-sm shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 min-h-[44px]">
                        <Zap className="w-4 h-4" /> Make a Bid
                      </motion.button>
                    </div>
                  </SectionCard>
                )}

                {!isActive && (
                  <div className={cn('flex items-start gap-3 rounded-xl border p-4', colorClasses.bg.secondary, colorClasses.border.secondary)}>
                    <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', colorClasses.text.muted)} />
                    <p className={cn('text-sm', colorClasses.text.secondary)}>This tender is no longer accepting bids.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ENTITY — fetches full company profile lazily ── */}
            {activeTab === 'entity' && (
              <div className="space-y-4">
                {/* Card 1: Declared Procuring Entity — always rendered */}
                <SectionCard icon={<Building className="w-5 h-5 text-slate-500" />} title="Procuring Entity">
                  {entityLoading ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Avatar + name row */}
                      <div className="flex items-start gap-3">
                        <TenderOwnerAvatar ownerEntity={ownerEntity} owner={owner} tenderType="professional" size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={cn('font-bold text-base break-words', colorClasses.text.primary)}>
                              {displayEntityName}
                            </h3>
                            {(fullEntity?.verified ?? ownerEntity?.verified) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 shrink-0">
                                <BadgeCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          {/* Headline / industry */}
                          {(fullEntity?.industry ?? ownerEntity?.industry ?? ownerEntity?.headline) && (
                            <p className={cn('text-sm mt-0.5', colorClasses.text.secondary)}>
                              {fullEntity?.industry ?? ownerEntity?.industry ?? ownerEntity?.headline}
                            </p>
                          )}
                          {/* Address / location */}
                          {(fullEntity?.address ?? ownerEntity?.location) && (
                            <p className={cn('text-xs mt-0.5 flex items-center gap-1', colorClasses.text.muted)}>
                              <MapPin className="w-3 h-3" />
                              {fullEntity?.address ?? ownerEntity?.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {(fullEntity?.description ?? ownerEntity?.description) && (
                        <p className={cn('text-sm leading-relaxed break-words', colorClasses.text.secondary)}>
                          {fullEntity?.description ?? ownerEntity?.description}
                        </p>
                      )}

                      {/* Detailed fields grid — merges fullEntity and ownerEntity */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(fullEntity?.phone ?? ownerEntity?.phone) && (
                          <InfoItem label="Phone" value={fullEntity?.phone ?? ownerEntity?.phone ?? '—'} icon={<Phone className="w-4 h-4" />} />
                        )}
                        {(fullEntity?.website ?? ownerEntity?.website) && (
                          <InfoItem label="Website" value={fullEntity?.website ?? ownerEntity?.website ?? '—'} icon={<Globe className="w-4 h-4" />} />
                        )}
                        {ownerEntity?.foundedYear && (
                          <InfoItem label="Founded" value={safeVal(ownerEntity.foundedYear)} icon={<Calendar className="w-4 h-4" />} />
                        )}
                        {ownerEntity?.employeeCount && (
                          <InfoItem label="Employees" value={safeVal(ownerEntity.employeeCount)} icon={<Users className="w-4 h-4" />} />
                        )}
                        {ownerEntity?.registrationNumber && (
                          <InfoItem label="Reg. No." value={safeVal(ownerEntity.registrationNumber)} icon={<Hash className="w-4 h-4" />} />
                        )}
                        {(fullEntity?.tin ?? ownerEntity?.tin) && (
                          <InfoItem label="TIN" value={fullEntity?.tin ?? ownerEntity?.tin ?? '—'} icon={<Hash className="w-4 h-4" />} />
                        )}
                      </div>

                      {/* When fullEntity fetch didn't return phone/email and no other source has them */}
                      {!fullEntity?.phone && !ownerEntity?.phone && !fullEntity?.website && !ownerEntity?.website && (
                        <div className={cn('flex items-center gap-2 text-xs rounded-xl border p-3', colorClasses.bg.secondary, colorClasses.border.secondary)}>
                          <Info className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
                          <p className={colorClasses.text.muted}>Contact details are not publicly available for this entity.</p>
                        </div>
                      )}

                      {/* Website button */}
                      {(fullEntity?.website ?? ownerEntity?.website) && (
                        <a href={fullEntity?.website ?? ownerEntity?.website} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800/50 dark:text-blue-400 dark:hover:bg-blue-950/20 transition-colors">
                          <Globe className="w-3.5 h-3.5" /> Visit Website
                        </a>
                      )}

                      {/* Specializations from ownerEntity */}
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
                    </div>
                  )}
                </SectionCard>

                {/* Card 2: Declared Procuring Entity name (string) if different from ownerEntity.name */}
                {procuringEntityStr && procuringEntityStr !== entityName && (
                  <SectionCard icon={<FileText className="w-5 h-5 text-slate-500" />} title="Declared Procuring Entity">
                    <div className={cn('flex items-center gap-3 p-3 rounded-xl', colorClasses.bg.secondary)}>
                      <Building className={cn('w-5 h-5 shrink-0', colorClasses.text.muted)} />
                      <p className={cn('font-semibold text-sm', colorClasses.text.primary)}>{procuringEntityStr}</p>
                    </div>
                    <p className={cn('text-xs mt-2', colorClasses.text.muted)}>
                      This is the name declared by the owner in the procurement sub-document.
                    </p>
                  </SectionCard>
                )}

                {/* Card 3: Contact Person */}
                <SectionCard icon={<Phone className="w-5 h-5 text-slate-500" />} title="Contact Person">
                  {contactPerson && (contactPerson.name || contactPerson.phone || contactPerson.email) ? (
                    <div className={cn('rounded-xl border p-4 space-y-3', colorClasses.bg.secondary, colorClasses.border.secondary)}>
                      {contactPerson.name && (
                        <p className={cn('font-semibold', colorClasses.text.primary)}>{contactPerson.name}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className={cn('flex items-center gap-2 text-sm', colorClasses.text.secondary)}>
                          <Phone className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
                          <span>{contactPerson.phone || '—'}</span>
                        </div>
                        <div className={cn('flex items-center gap-2 text-sm break-all', colorClasses.text.secondary)}>
                          <Mail className={cn('w-3.5 h-3.5 shrink-0', colorClasses.text.muted)} />
                          <span>{contactPerson.email || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={cn('flex items-center gap-2 rounded-xl border p-4', colorClasses.bg.secondary, colorClasses.border.secondary)}>
                      <Info className={cn('w-4 h-4 shrink-0', colorClasses.text.muted)} />
                      <p className={cn('text-sm', colorClasses.text.muted)}>No contact person listed for this tender.</p>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {isMobile && <MobileBottomTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />}
    </div>
  );
};