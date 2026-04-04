/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders2.0/TenderHeader.tsx — FIXED
// FIX 2a: "Procuring Entity" stat shows procurement.procuringEntity (the declared string),
//         NOT ownerEntity.name (the owning company). These are different fields.
//         The owner entity name goes in a separate "Posted by" display if needed.
// FIX 2b: totalBids reads bids.length as fallback when metadata.totalBids is 0/missing
// FIX 2c: resolveEntityName guards against string ObjectId (not-populated ownerEntity)
import React, { useState } from 'react';
import {
  Bookmark, Share2, BadgeCheck, Shield, Lock, Globe, Building,
  Building2, Calendar, Copy, FileText, Users, Award, Eye,
  ChevronDown, ChevronUp, Edit, Trash2, Send, Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { colorClasses } from '@/utils/color';
import { useToggleSaveFreelanceTender } from '@/hooks/useFreelanceTender';
import { useToggleSaveProfessionalTender } from '@/hooks/useProfessionalTender';
import { useResponsive } from '@/hooks/useResponsive';
import type { FreelanceTender, ProfessionalTender } from '@/types/tender.types';

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeInUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

// ─── Status configs ───────────────────────────────────────────────────────────
const statusGradient: Record<string, { label: string; cls: string }> = {
  draft:            { label: 'Draft',            cls: 'bg-white/15 text-white border-white/25' },
  published:        { label: 'Published',        cls: 'bg-emerald-400/25 text-emerald-100 border-emerald-300/30' },
  locked:           { label: 'Locked',           cls: 'bg-blue-400/25 text-blue-100 border-blue-300/30' },
  deadline_reached: { label: 'Deadline Reached', cls: 'bg-amber-400/25 text-amber-100 border-amber-300/30' },
  revealed:         { label: 'Revealed',         cls: 'bg-purple-400/25 text-purple-100 border-purple-300/30' },
  closed:           { label: 'Closed',           cls: 'bg-white/10 text-white/70 border-white/15' },
  cancelled:        { label: 'Cancelled',        cls: 'bg-red-500/30 text-red-100 border-red-400/30' },
};

const statusCondensed: Record<string, { label: string; cls: string }> = {
  draft:            { label: 'Draft',            cls: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700' },
  published:        { label: 'Published',        cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50' },
  locked:           { label: 'Locked',           cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50' },
  deadline_reached: { label: 'Deadline Reached', cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50' },
  revealed:         { label: 'Revealed',         cls: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50' },
  closed:           { label: 'Closed',           cls: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50' },
  cancelled:        { label: 'Cancelled',        cls: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50' },
};

// ─── Themes ───────────────────────────────────────────────────────────────────
const themes = {
  owner:      { grad: 'from-[#0A2540] via-[#0d2d4a] to-[#091929]', orb1: 'bg-[#F1BB03]/12', orb2: 'bg-[#F1BB03]/7',  accent: 'border-b-2 border-[#F1BB03]' },
  company:    { grad: 'from-blue-700 via-blue-600 to-indigo-700',   orb1: 'bg-blue-300/15',  orb2: 'bg-indigo-200/10', accent: 'border-b-2 border-blue-500' },
  freelancer: { grad: 'from-emerald-600 via-teal-600 to-cyan-700',  orb1: 'bg-teal-300/15',  orb2: 'bg-cyan-200/10',   accent: 'border-b-2 border-emerald-500' },
  guest:      { grad: 'from-slate-600 via-slate-500 to-slate-700',  orb1: 'bg-slate-300/15', orb2: 'bg-slate-200/10',  accent: 'border-b-2 border-slate-400' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface TenderDetailHeaderProps {
  tender: FreelanceTender | ProfessionalTender;
  tenderType: 'freelance' | 'professional';
  viewerRole: 'owner' | 'freelancer' | 'company' | 'guest';
  viewerId?: string;
  headerTheme?: 'owner' | 'freelancer' | 'company' | 'guest';
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  condensed?: boolean;
  className?: string;
}

const fmtDate = (d?: Date | string) => {
  if (!d) return 'Not specified';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// FIX 2c: Guard against unpopulated ObjectId strings
function resolveEntityName(ownerEntityRaw: any, owner: any): string {
  const entity = typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null ? ownerEntityRaw : null;
  return (
    entity?.name ??
    owner?.name ??
    ([owner?.firstName, owner?.lastName].filter(Boolean).join(' ') || 'Unknown Entity')
  );
}

function resolveEntityLogo(ownerEntityRaw: any, owner: any): string | null {
  const entity = typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null ? ownerEntityRaw : null;
  return (
    entity?.logo?.secure_url ??
    entity?.profileImage?.secure_url ??
    entity?.profileImage ??
    owner?.avatar ??
    null
  );
}

// ─── Entity Avatar ────────────────────────────────────────────────────────────
const EntityAvatar: React.FC<{
  logo: string | null; name: string; verified?: boolean; size?: 'sm' | 'md'; white?: boolean;
}> = ({ logo, name, verified, size = 'md', white }) => {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div className="relative shrink-0">
      {logo ? (
        <img src={logo} alt={name} className={cn(dim, 'rounded-full object-cover border', white ? 'border-white/30' : colorClasses.border.secondary)} />
      ) : (
        <div className={cn(dim, 'rounded-full flex items-center justify-center', white ? 'bg-white/15' : colorClasses.bg.secondary)}>
          <Building2 className={cn('w-4 h-4', white ? 'text-white/70' : colorClasses.text.muted)} />
        </div>
      )}
      {verified && <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-emerald-400 drop-shadow-sm" />}
    </div>
  );
};

// ─── Deadline pill ────────────────────────────────────────────────────────────
const DeadlinePill: React.FC<{ deadline: Date | string; white?: boolean }> = ({ deadline, white }) => {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  const hours = Math.ceil(diff / 3_600_000);
  if (diff <= 0) return <span className={cn('text-sm font-semibold', white ? 'text-red-300' : 'text-red-600')}>Expired</span>;
  if (days <= 1) return <span className={cn('text-sm font-semibold animate-pulse', white ? 'text-amber-300' : colorClasses.text.amber700)}>{hours}h left</span>;
  if (days <= 7) return <span className={cn('text-sm font-semibold', white ? 'text-amber-200' : colorClasses.text.amber700)}>{days}d left</span>;
  return <span className={cn('text-sm font-medium', white ? 'text-white/90' : colorClasses.text.primary)}>{fmtDate(deadline)}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TenderDetailHeader: React.FC<TenderDetailHeaderProps> = ({
  tender, tenderType, viewerRole, viewerId, headerTheme,
  onEdit, onDelete, onPublish, onShare, condensed = false, className,
}) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getTouchTargetSize, isTouch } = useResponsive();

  const { mutate: saveFL, isPending: savingFL } = useToggleSaveFreelanceTender();
  const { mutate: savePR, isPending: savingPR } = useToggleSaveProfessionalTender();
  const isSaving = tenderType === 'freelance' ? savingFL : savingPR;

  const isOwner = viewerRole === 'owner';
  const isPro   = tenderType === 'professional';
  const prof    = tender as ProfessionalTender;
  const status  = (tender as any).status ?? 'draft';
  const isActive = ['published', 'locked'].includes(status);
  const isDraft  = status === 'draft';
  const isPublished = status === 'published';
  const workflowType   = isPro ? (prof.workflowType ?? 'open') : 'open';
  const visibilityType = (tender as any).visibility?.visibilityType ?? 'public';
  const refNum = isPro ? (prof as any).professionalSpecific?.referenceNumber ?? (prof as any).referenceNumber : undefined;

  const ownerEntityRaw = (tender as any).ownerEntity;
  const ownerRaw       = (tender as any).owner;
  const ownerName      = resolveEntityName(ownerEntityRaw, ownerRaw);
  const ownerLogo      = resolveEntityLogo(ownerEntityRaw, ownerRaw);
  const ownerVerified  = (typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null) ? (ownerEntityRaw?.verified ?? false) : false;
  const ownerWebsite   = (typeof ownerEntityRaw === 'object' && ownerEntityRaw !== null) ? ownerEntityRaw?.website : undefined;

  // FIX 2a: For professional tenders the "Procuring Entity" stat shows the declared
  // procurement.procuringEntity string (e.g. "Ministry of Health"), NOT the ownerEntity name.
  // The ownerEntity name is the company/org that posted the tender (e.g. "Base44").
  const procuringEntityLabel = isPro
    ? ((prof as any).procurement?.procuringEntity ?? ownerName)
    : ownerName;

  // FIX 2b: totalBids falls back to bids.length when metadata.totalBids is absent/zero
  const metadataBids = isPro ? ((prof as any).metadata?.totalBids ?? 0) : ((tender as any).metadata?.totalApplications ?? 0);
  const bidsArrayLen  = Array.isArray((tender as any).bids) ? (tender as any).bids.length : 0;
  const totalBids     = metadataBids > 0 ? metadataBids : bidsArrayLen;

  const views   = (tender as any).metadata?.views ?? 0;
  const deadline = (tender as any).deadline ?? (tender as any).submissionDeadline;

  const isSaved = (() => {
    if (!viewerId) return false;
    const s = (tender as any).metadata?.savedBy;
    return Array.isArray(s) ? s.includes(viewerId) : false;
  })();

  const themeKey = (headerTheme ?? viewerRole) as keyof typeof themes;
  const theme = themes[themeKey] ?? themes.company;
  const sGrad = statusGradient[status] ?? statusGradient.draft;
  const sCond = statusCondensed[status] ?? statusCondensed.draft;
  const touchTarget = isTouch ? getTouchTargetSize('md') : '';

  const handleSave = () => {
    if (tenderType === 'freelance') saveFL(tender._id);
    else savePR(tender._id);
    toast({ title: isSaved ? 'Removed from saved' : 'Saved!', variant: 'success' });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied', variant: 'success' });
      onShare?.();
    } catch {
      toast({ title: 'Could not copy link', variant: 'destructive' });
    }
  };

  const handleCopyRef = async () => {
    if (!refNum) return;
    await navigator.clipboard.writeText(refNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!', variant: 'success' });
  };

  // ── CONDENSED (sticky bar) ────────────────────────────────────────────────
  if (condensed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'sticky top-0 z-30 bg-white/92 dark:bg-slate-900/92 backdrop-blur-md',
          'border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm',
          theme.accent, className,
        )}
      >
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0',
                isPro ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300')}>
                {isPro ? <Building className="w-2.5 h-2.5" /> : <Award className="w-2.5 h-2.5" />}
                {isPro ? 'Professional' : 'Freelance'}
              </span>
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0', sCond.cls)}>
                {sCond.label}
              </span>
            </div>
            <p className={cn('text-sm font-bold leading-tight truncate', colorClasses.text.primary)}>{tender.title}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handleSave} className={cn('p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center', colorClasses.bg.secondary)} aria-label={isSaved ? 'Unsave' : 'Save'}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className={cn('w-4 h-4', isSaved ? 'fill-[#F1BB03] text-[#F1BB03]' : colorClasses.text.muted)} />}
            </button>
            <button onClick={handleShare} className={cn('p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center', colorClasses.bg.secondary)} aria-label="Share">
              <Share2 className={cn('w-4 h-4', colorClasses.text.muted)} />
            </button>
            {isOwner && onEdit && (
              <button onClick={onEdit} className={cn('hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', colorClasses.bg.secondary, colorClasses.text.primary)}>
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── FULL HEADER ───────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('relative overflow-hidden bg-gradient-to-br', theme.grad, 'border-b border-white/10', className)}
    >
      <div className={cn('absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-60', theme.orb1)} />
      <div className={cn('absolute -bottom-8 -left-8 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-40', theme.orb2)} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4 sm:space-y-5">

          {/* Badge row */}
          <motion.div variants={fadeInUp} className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 bg-white/15 border-white/25 text-white">
              {isPro ? <Building className="w-3 h-3" /> : <Award className="w-3 h-3" />}
              {isPro ? 'Professional' : 'Freelance'}
            </span>
            {isPro && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 bg-white/15 border-white/25 text-white">
                {workflowType === 'closed' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {workflowType === 'closed' ? 'Sealed Bid' : 'Open Tender'}
              </span>
            )}
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0', sGrad.cls)}>
              {sGrad.label}
            </span>
            {visibilityType !== 'public' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 bg-white/10 text-white/80 border-white/20">
                <Shield className="w-3 h-3" />
                {visibilityType === 'invite_only' ? 'Invite Only' : visibilityType}
              </span>
            )}
          </motion.div>

          {/* Title */}
          <motion.div variants={fadeInUp} className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug text-white break-words">{tender.title}</h1>
            {isPro && refNum && (
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="w-3.5 h-3.5 shrink-0 text-white/55" />
                <span className="font-mono text-sm text-white/75">Ref: {refNum}</span>
                <button onClick={handleCopyRef} className="p-1 rounded text-white/55 hover:text-[#F1BB03] transition-colors">
                  {copied ? <span className="text-xs text-emerald-300 font-medium">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={fadeInUp} className="flex items-center flex-wrap gap-2">
            <button onClick={handleSave}
              className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all bg-white/15 border-white/25 text-white hover:bg-white/25 min-h-[44px]', touchTarget)}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className={cn('w-4 h-4', isSaved ? 'fill-[#F1BB03] text-[#F1BB03]' : 'text-white')} />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleShare}
              className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all bg-white/15 border-white/25 text-white hover:bg-white/25 min-h-[44px]', touchTarget)}>
              <Share2 className="w-4 h-4" /> Share
            </button>
            {isOwner && onEdit && (
              <button onClick={isPro && isPublished ? undefined : onEdit} disabled={isPro && isPublished}
                title={isPro && isPublished ? 'Use Addendum to modify a published tender' : 'Edit'}
                className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px]', touchTarget,
                  isPro && isPublished ? 'bg-white/8 text-white/35 border border-white/10 cursor-not-allowed' : 'bg-white/15 border border-white/25 text-white hover:bg-white/25')}>
                <Edit className="w-4 h-4" /> Edit
              </button>
            )}
            {isOwner && isDraft && onDelete && (
              <button onClick={onDelete}
                className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all bg-red-500/20 text-red-200 border-red-400/30 hover:bg-red-500/30 min-h-[44px]', touchTarget)}>
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            {isOwner && isDraft && onPublish && (
              <button onClick={onPublish}
                className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all bg-[#F1BB03] text-[#0A2540] hover:brightness-105 min-h-[44px]', touchTarget)}>
                <Send className="w-4 h-4" /> Publish
              </button>
            )}
            {ownerWebsite && (
              <a href={ownerWebsite} target="_blank" rel="noopener noreferrer"
                className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all bg-white/15 border-white/25 text-white hover:bg-white/25 min-h-[44px]', touchTarget)}>
                <Globe className="w-4 h-4" /><span className="hidden sm:inline">Website</span>
              </a>
            )}
          </motion.div>

          {/* Quick stats */}
          <motion.div variants={fadeInUp}>
            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  icon: <Calendar className="w-4 h-4 text-white/70" />,
                  label: 'Deadline',
                  value: deadline ? <DeadlinePill deadline={deadline} white /> : <span className="text-white/60 text-sm">—</span>,
                },
                {
                  icon: <Building2 className="w-4 h-4 text-white/70" />,
                  // FIX 2a: Show procuringEntity for professional, ownerName for freelance
                  label: isPro ? 'Procuring Entity' : 'Owner',
                  value: (
                    <div className="flex items-center gap-2 min-w-0">
                      <EntityAvatar logo={ownerLogo} name={procuringEntityLabel} verified={ownerVerified} size="sm" white />
                      <span className="text-sm font-medium text-white/90 truncate">{procuringEntityLabel}</span>
                    </div>
                  ),
                },
                {
                  icon: <Users className="w-4 h-4 text-white/70" />,
                  label: isPro ? 'Bids' : 'Applications',
                  // FIX 2b: Use bids array length as fallback
                  value: <span className="text-sm font-medium text-white/90">{totalBids}</span>,
                },
                {
                  icon: <Eye className="w-4 h-4 text-white/70" />,
                  label: 'Views',
                  value: <span className="text-sm font-medium text-white/90">{views}</span>,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 bg-white/8 hover:bg-white/12 rounded-xl border border-white/12 transition-colors">
                  <div className="p-1.5 rounded-lg bg-white/10 shrink-0">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/55 uppercase tracking-wide">{item.label}</p>
                    <div>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile collapsible quick details */}
            <div className="sm:hidden">
              <button onClick={() => setShowDetails(p => !p)}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/15 text-white/80 text-sm font-medium min-h-[44px]">
                <span>Quick Details</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {showDetails && (
                  <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }} className="overflow-hidden space-y-2">
                    {deadline && (
                      <div className="flex items-center justify-between p-3 bg-white/8 rounded-xl border border-white/12">
                        <span className="text-sm text-white/75 flex items-center gap-2"><Calendar className="w-4 h-4" /> Deadline</span>
                        <DeadlinePill deadline={deadline} white />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-white/8 rounded-xl border border-white/12">
                      <span className="text-sm text-white/75 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> {isPro ? 'Procuring Entity' : 'Owner'}
                      </span>
                      <div className="flex items-center gap-2 max-w-[160px]">
                        <EntityAvatar logo={ownerLogo} name={procuringEntityLabel} verified={ownerVerified} size="sm" white />
                        <span className="text-sm font-medium text-white/90 truncate">{procuringEntityLabel}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-3 bg-white/8 rounded-xl border border-white/12">
                        <span className="text-xs text-white/60 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {isPro ? 'Bids' : 'Apps'}</span>
                        <span className="text-sm font-semibold text-white/90">{totalBids}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/8 rounded-xl border border-white/12">
                        <span className="text-xs text-white/60 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Views</span>
                        <span className="text-sm font-semibold text-white/90">{views}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Status footer */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between pt-3 border-t border-white/12 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
                className={cn('w-1.5 h-1.5 rounded-full shrink-0', isActive ? 'bg-emerald-400' : 'bg-red-400')} />
              <span className={cn('text-xs sm:text-sm font-medium', isActive ? 'text-emerald-300' : 'text-red-300')}>
                {isActive ? 'Active · Accepting proposals' : 'Inactive · Not accepting proposals'}
              </span>
            </div>
            <span className="text-xs text-white/50">{fmtDate((tender as any).publishedAt ?? (tender as any).createdAt)}</span>
          </motion.div>

        </motion.div>
      </div>
    </motion.div>
  );
};