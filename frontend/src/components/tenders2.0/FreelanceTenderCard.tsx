/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders2.0/FreelanceTenderCard.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BadgeCheck, Bookmark, Pencil, Trash2, Send,
    Users, Clock, DollarSign, Zap, Tag,
} from 'lucide-react';
import TenderStatusBadge from './TenderStatusBadge';
import TenderDeadlineDisplay from './shared/TenderDeadlineDisplay';
import { useToggleSaveFreelanceTender } from '@/hooks/useFreelanceTender';
import type { FreelanceTenderListItem } from '@/types/tender.types';
import { colorClasses, colors } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface FreelanceTenderCardProps {
    tender: FreelanceTenderListItem;
    viewerRole: 'freelancer' | 'company' | 'organization' | 'admin';
    viewerId?: string;
    onView: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onPublish?: (id: string) => void;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function getInitialsColor(name: string): string {
    const first = (name || '').toUpperCase().charAt(0);
    if (first >= 'A' && first <= 'F') return colors.blue600;
    if (first >= 'G' && first <= 'L') return colors.emerald600;
    if (first >= 'M' && first <= 'R') return colors.purple700;
    return colors.amber700;
}

function TenderOwnerAvatar({ ownerEntity, owner, size = 'md' }: {
    ownerEntity?: any; owner?: any; size?: 'sm' | 'md' | 'lg';
}) {
    const [imgError, setImgError] = useState(false);
    const avatarUrl = ownerEntity?.logo?.secure_url ?? ownerEntity?.logo?.url ?? owner?.avatar ?? null;
    const name = ownerEntity?.name || owner?.name || 'U';
    const initials = name.charAt(0).toUpperCase();
    const isVerified = ownerEntity?.verified;
    const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };

    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
                <div className={cn('rounded-full overflow-hidden flex items-center justify-center font-bold text-white', sizeClasses[size])}>
                    {avatarUrl && !imgError ? (
                        <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" onError={() => setImgError(true)} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-full" style={{ backgroundColor: getInitialsColor(name) }}>
                            {initials}
                        </div>
                    )}
                </div>
                {isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full p-0.5">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className={cn('text-xs font-semibold truncate', colorClasses.text.primary)}>{name}</p>
                {owner?.headline && (
                    <p className={cn('text-[10px] truncate', colorClasses.text.muted)}>{owner.headline}</p>
                )}
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEngagement(v?: string) {
    return v === 'fixed_price' ? 'Fixed Price' : v === 'hourly' ? 'Hourly' : (v ?? '');
}
function fmtBudget(budget?: { min?: number; max?: number; currency?: string }): string | null {
    if (!budget) return null;
    const { min, max, currency = 'ETB' } = budget;
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min != null) return `${currency} ${min.toLocaleString()}+`;
    return `Up to ${currency} ${max!.toLocaleString()}`;
}
function fmtProjectType(v?: string) {
    const map: Record<string, string> = { one_time: 'One-time', ongoing: 'Ongoing', complex: 'Complex' };
    return v ? (map[v] ?? v) : '';
}

// ─── Save Button ──────────────────────────────────────────────────────────────
function SaveButton({ tender }: { tender: FreelanceTenderListItem }) {
    const { mutate: toggleSave, isPending } = useToggleSaveFreelanceTender();
    const isSaved = (tender as any).isSaved ?? false;
    return (
        <button type="button" disabled={isPending}
            onClick={(e) => { e.stopPropagation(); toggleSave(tender._id); }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
            className="p-1.5 rounded-full transition-all disabled:opacity-50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <Bookmark className={cn('w-5 h-5 transition-colors', isSaved ? 'fill-[#F1BB03] text-[#F1BB03]' : colorClasses.text.secondary)} />
        </button>
    );
}

// ─── Owner Action Toolbar ─────────────────────────────────────────────────────
function OwnerActions({ tender, onView, onEdit, onDelete, onPublish, breakpoint }: {
    tender: FreelanceTenderListItem;
    onView: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onPublish?: (id: string) => void;
    breakpoint: string;
}) {
    const [confirmDel, setConfirmDel] = useState(false);
    const isDraft = tender.status === 'draft';
    const isMobile = breakpoint === 'mobile';

    return (
        <div className={cn('mt-4 pt-4 border-t space-y-2', colorClasses.border.secondary)}>
            {/* Row 1 — Details + Edit */}
            <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'flex-row')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onView(tender._id); }}
                    className="flex-1 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: colors.emerald600 }}>
                    View Details
                </button>
                {onEdit && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(tender._id); }}
                        className="flex-1 h-9 px-4 rounded-lg text-sm font-semibold border-2 transition-colors flex items-center justify-center gap-1.5"
                        style={{ borderColor: colors.emerald600, color: colors.emerald600, backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${colors.emerald600}15`)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </button>
                )}
            </div>

            {/* Row 2 — Publish + Delete (draft only) */}
            {(isDraft) && (
                <div className="flex gap-2 items-center">
                    {isDraft && onPublish && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onPublish(tender._id); }}
                            className="flex-1 h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors">
                            <Send className="h-3 w-3" />
                            Publish Now
                        </button>
                    )}
                    {onDelete && !confirmDel && (
                        <button type="button" title="Delete tender"
                            onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }}
                            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {confirmDel && (
                        <div className="flex-1 flex items-center gap-2 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-1.5">
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">Delete?</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete?.(tender._id); }}
                                className="text-xs font-bold text-red-600 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 hover:bg-red-200">
                                Yes
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDel(false); }}
                                className={cn('text-xs font-medium px-2 py-0.5 rounded', colorClasses.text.muted, colorClasses.bg.secondary)}>
                                No
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function FreelanceTenderCard({
    tender, viewerRole, viewerId, onView, onEdit, onDelete, onPublish,
}: FreelanceTenderCardProps) {
    const { breakpoint } = useResponsive();
    const isOwner = (tender.owner as any)?._id === viewerId || tender.owner === viewerId;
    const isSaved = (tender as any).isSaved ?? false;
    const isDraft = tender.status === 'draft';

    const skills: string[] = (tender as any).skillsRequired ?? [];
    const visibleSkills = skills.slice(0, 3);
    const extraSkills = skills.length - 3;
    const applicationCount = (tender as any).applicationCount as number | undefined;
    const budget = (tender as any).details?.budget ?? (tender as any).budget;
    const engagementType = (tender as any).details?.engagementType;
    const projectType = (tender as any).details?.projectType;
    const urgency = (tender as any).details?.urgency;
    const preview = (tender as any).briefDescription || tender.description;

    return (
        <motion.div
            onClick={() => onView(tender._id)}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className={cn(
                'flex flex-col group rounded-2xl border-l-4 cursor-pointer relative overflow-hidden',
                // ── FREELANCE theme: emerald left border ──
                isDraft
                    ? 'border-l-emerald-300 dark:border-l-emerald-700'
                    : 'border-l-emerald-500 dark:border-l-emerald-400',
                isSaved
                    ? 'border-2 border-[#F1BB03] bg-amber-50/60 dark:bg-amber-950/10 hover:border-[#D97706]'
                    : isDraft
                        ? `border border-dashed border-emerald-300 dark:border-emerald-700 ${colorClasses.bg.primary} hover:shadow-md`
                        : `border ${colorClasses.border.primary} ${colorClasses.bg.primary} hover:shadow-md`,
                'p-5 transition-all duration-200'
            )}
            suppressHydrationWarning
        >
            {/* Emerald gradient wash */}
            <div className="absolute top-0 left-0 right-0 h-20 rounded-t-2xl bg-gradient-to-r from-emerald-50/70 to-transparent dark:from-emerald-950/20 pointer-events-none" />

            {/* FREELANCE type chip — top right */}
            <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 tracking-wide uppercase">
                    <Zap className="h-2.5 w-2.5" />
                    Freelance
                </span>
            </div>

            <div className="relative z-10 flex flex-col flex-1">
                {/* Top: avatar + save (push right to avoid chip overlap) */}
                <div className="flex items-start gap-2 pr-20">
                    <TenderOwnerAvatar ownerEntity={(tender as any).ownerEntity} owner={tender.owner as any} size="md" />
                    <div className="ml-auto shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {isSaved && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1BB03]/20 text-[#B45309] dark:text-[#F1BB03]">
                                Saved ✓
                            </span>
                        )}
                        {!isOwner && <SaveButton tender={tender} />}
                    </div>
                </div>

                {/* Title */}
                <h3 className={cn(
                    'text-base font-semibold mt-3 line-clamp-2 transition-colors',
                    'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
                    colorClasses.text.primary
                )}>
                    {tender.title}
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <TenderStatusBadge status={tender.status as any} showDot />
                    {engagementType && (
                        <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            engagementType === 'hourly'
                                ? `${colorClasses.bg.emeraldLight} ${colorClasses.text.emerald}`
                                : `${colorClasses.bg.indigoLight} ${colorClasses.text.indigo}`
                        )}>
                            <Clock className="h-3 w-3" />
                            {fmtEngagement(engagementType)}
                        </span>
                    )}
                    {projectType && (
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colorClasses.bg.secondary, colorClasses.text.secondary)}>
                            {fmtProjectType(projectType)}
                        </span>
                    )}
                    {urgency === 'urgent' && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                            ⚡ Urgent
                        </span>
                    )}
                    {(tender as any).procurementCategory && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            <Tag className="h-3 w-3" />
                            {(tender as any).procurementCategory}
                        </span>
                    )}
                </div>

                {/* Description */}
                {preview && (
                    <p className={cn('text-sm mt-2.5 line-clamp-2', colorClasses.text.secondary)}>
                        {preview.replace(/<[^>]+>/g, '')}
                    </p>
                )}

                {/* Skills chips */}
                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {visibleSkills.map((skill) => (
                            <span key={skill} className={cn(colorClasses.bg.indigoLight, colorClasses.text.indigo, 'rounded-full px-2 py-0.5 text-xs font-medium')}>
                                {skill}
                            </span>
                        ))}
                        {extraSkills > 0 && (
                            <span className={cn(colorClasses.bg.secondary, colorClasses.text.secondary, 'rounded-full px-2 py-0.5 text-xs font-medium')}>
                                +{extraSkills} more
                            </span>
                        )}
                    </div>
                )}

                {/* Metrics bar */}
                <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t', colorClasses.border.secondary)}>
                    {fmtBudget(budget) && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <DollarSign className="h-3.5 w-3.5" />
                            {fmtBudget(budget)}
                        </div>
                    )}
                    {tender.deadline && <TenderDeadlineDisplay deadline={tender.deadline} showCountdown />}
                    {isOwner && applicationCount != null && (
                        <div className={cn('flex items-center gap-1 text-xs ml-auto', colorClasses.text.secondary)}>
                            <Users className="h-3.5 w-3.5" />
                            <span className="font-semibold">{applicationCount}</span>
                            <span>{applicationCount === 1 ? 'applicant' : 'applicants'}</span>
                        </div>
                    )}
                </div>

                {/* Owner actions */}
                {isOwner && (
                    <OwnerActions
                        tender={tender} onView={onView} onEdit={onEdit}
                        onDelete={onDelete} onPublish={onPublish} breakpoint={breakpoint}
                    />
                )}
            </div>
        </motion.div>
    );
}