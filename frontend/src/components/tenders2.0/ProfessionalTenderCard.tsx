/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders2.0/ProfessionalTenderCard.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BadgeCheck, Bookmark, Pencil, Trash2, Building2,
    BarChart2, FileText, FilePlus,
} from 'lucide-react';
import TenderStatusBadge from './TenderStatusBadge';
import TenderDeadlineDisplay from './shared/TenderDeadlineDisplay';
import TenderCategoryBadge from './shared/TenderCategoryBadge';
import {
    useToggleSaveProfessionalTender,
    useDownloadProfessionalAttachment,
} from '@/hooks/useProfessionalTender';
import type { ProfessionalTenderListItem } from '@/types/tender.types';
import { colorClasses, colors } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ProfessionalTenderCardProps {
    tender: ProfessionalTenderListItem;
    viewerRole: 'company' | 'organization' | 'admin';
    viewerId?: string;
    onView: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onAddendum?: (id: string) => void;
    myInvitationStatus?: 'pending' | 'accepted' | 'declined';
    onAcceptInvitation?: () => void;
    onDeclineInvitation?: () => void;
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
                {(ownerEntity?.headline || owner?.headline) && (
                    <p className={cn('text-[10px] truncate', colorClasses.text.muted)}>
                        {ownerEntity?.headline || owner?.headline}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Workflow Badge ───────────────────────────────────────────────────────────
function WorkflowBadge({ workflowType }: { workflowType: string }) {
    if (workflowType === 'closed') {
        return (
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', colorClasses.text.purple, colorClasses.bg.purpleLight)}>
                🔒 Sealed
            </span>
        );
    }
    return (
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', colorClasses.text.blue, colorClasses.bg.blueLight)}>
            Open Bid
        </span>
    );
}

// ─── Visibility Badge ─────────────────────────────────────────────────────────
function VisibilityBadge({ visibilityType }: { visibilityType?: string }) {
    if (visibilityType === 'invite_only') {
        return (
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', colorClasses.text.teal, colorClasses.bg.tealLight)}>
                Invite Only
            </span>
        );
    }
    return null;
}

// ─── Save Button ──────────────────────────────────────────────────────────────
function SaveButton({ tender }: { tender: ProfessionalTenderListItem }) {
    const { mutate: toggleSave, isPending } = useToggleSaveProfessionalTender();
    const isSaved = (tender as any).isSaved ?? false;
    return (
        <button type="button" disabled={isPending}
            onClick={(e) => { e.stopPropagation(); toggleSave(tender._id); }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
            className="p-2 rounded-full transition-all duration-150 disabled:opacity-40 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <Bookmark className={cn('w-5 h-5 transition-colors', isSaved ? 'fill-[#F1BB03] text-[#F1BB03]' : colorClasses.text.secondary)} />
        </button>
    );
}

// ─── Owner Action Toolbar ─────────────────────────────────────────────────────
function OwnerActions({ tender, onView, onEdit, onDelete, onAddendum, breakpoint }: {
    tender: ProfessionalTenderListItem;
    onView: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onAddendum?: (id: string) => void;
    breakpoint: string;
}) {
    const [confirmDel, setConfirmDel] = useState(false);
    const isDraft = tender.status === 'draft';
    const isPublished = tender.status === 'published' || tender.status === 'locked';
    const isMobile = breakpoint === 'mobile';

    return (
        <div className={cn('mt-4 pt-4 border-t space-y-2', colorClasses.border.secondary)}>
            {/* Row 1 — Details + Edit (draft) / Manage (published) */}
            <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'flex-row')}>
                {/* Details — navy solid (professional brand) */}
                <button type="button" onClick={(e) => { e.stopPropagation(); onView(tender._id); }}
                    className="flex-1 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: colors.darkNavy }}>
                    View Details
                </button>

                {/* Edit — blue outline, draft only */}
                {isDraft && onEdit && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(tender._id); }}
                        className="flex-1 h-9 px-4 rounded-lg text-sm font-semibold border-2 transition-colors flex items-center justify-center gap-1.5"
                        style={{ borderColor: colors.blue600, color: colors.blue600, backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${colors.blue600}12`)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Draft
                    </button>
                )}

                {/* Addendum — published only */}
                {isPublished && onAddendum && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onAddendum(tender._id); }}
                        className="flex-1 h-9 px-4 rounded-lg text-sm font-semibold border-2 transition-colors flex items-center justify-center gap-1.5"
                        style={{ borderColor: colors.amber600, color: colors.amber600, backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${colors.amber600}12`)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <FilePlus className="h-3.5 w-3.5" />
                        Addendum
                    </button>
                )}
            </div>

            {/* Row 2 — Published: Manage link | Draft: Delete */}
            <div className="flex items-center gap-2">
                {isPublished && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onView(tender._id); }}
                        className={cn('text-xs font-medium', colorClasses.text.blue, 'hover:underline')}>
                        Manage bids →
                    </button>
                )}

                {isDraft && onDelete && !confirmDel && (
                    <button type="button" title="Delete tender"
                        onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }}
                        className="ml-auto h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}

                {confirmDel && (
                    <div className="flex-1 flex items-center gap-2 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-1.5 ml-auto">
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
        </div>
    );
}

// ─── Attachment row ───────────────────────────────────────────────────────────
function AttachmentRow({ tenderId, attachment }: {
    tenderId: string;
    attachment: { _id: string; originalName: string; size?: number; documentType?: string };
}) {
    const { mutate: download, isPending } = useDownloadProfessionalAttachment();
    return (
        <div className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg', colorClasses.bg.secondary)}>
            <FileText className={cn('w-4 h-4 shrink-0', colorClasses.text.muted)} />
            <span className={cn('flex-1 text-xs truncate', colorClasses.text.primary)}>{attachment.originalName}</span>
            <button type="button" disabled={isPending}
                onClick={(e) => { e.stopPropagation(); download({ tenderId, attachmentId: attachment._id, filename: attachment.originalName }); }}
                className={cn('shrink-0 text-xs font-semibold px-2 py-0.5 rounded transition-all', colorClasses.text.goldenMustard, 'hover:underline disabled:opacity-40')}>
                {isPending ? '…' : 'Download'}
            </button>
        </div>
    );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function ProfessionalTenderCard({
    tender, viewerRole, viewerId, onView, onEdit, onDelete, onAddendum,
    myInvitationStatus, onAcceptInvitation, onDeclineInvitation,
}: ProfessionalTenderCardProps) {
    const { breakpoint, getTouchTargetSize } = useResponsive();
    const isOwner = (tender.owner as any)?._id === viewerId || tender.owner === viewerId;
    const workflowType = (tender as any).workflowType ?? 'open';
    const visibilityType = (tender as any).visibilityType ?? 'public';
    const tenderType = (tender as any).tenderType ?? '';
    const isSealed = workflowType === 'closed' && !['revealed', 'closed'].includes(tender.status);
    const isDraft = tender.status === 'draft';
    const isSaved = (tender as any).isSaved ?? false;

    const bidCount = (tender as any).bidCount as number | undefined;
    const cpoCount = (tender as any).cpoCount as number | undefined;
    const cpoRequired = (tender as any).cpoRequired as boolean | undefined;
    const briefDescription = (tender as any).briefDescription as string | undefined;
    const attachments = (tender as any).attachments as any[] | undefined;
    const referenceNumber = (tender as any).referenceNumber as string | undefined;
    const procuringEntity = (tender as any).procurement?.procuringEntity as string | undefined;
    const procurementMethod = (tender as any).professionalSpecific?.procurementMethod as string | undefined;

    return (
        <motion.article
            onClick={() => onView(tender._id)}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className={cn(
                'flex flex-col rounded-2xl border-l-4 cursor-pointer relative overflow-hidden',
                // ── PROFESSIONAL theme: navy/blue left border ──
                isDraft
                    ? 'border-l-blue-300 dark:border-l-blue-700'
                    : 'border-l-blue-600 dark:border-l-blue-400',
                isSaved
                    ? 'border-2 border-[#F1BB03] bg-amber-50/60 dark:bg-amber-950/10 hover:border-[#D97706]'
                    : isDraft
                        ? `border border-dashed border-blue-300 dark:border-blue-700 ${colorClasses.bg.primary} hover:shadow-md`
                        : `border ${colorClasses.border.primary} ${colorClasses.bg.primary} hover:shadow-md`,
                'p-5 transition-all duration-200'
            )}
            suppressHydrationWarning
        >
            {/* Blue gradient wash */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-950/20 pointer-events-none" />

            {/* PROFESSIONAL type chip — top right */}
            <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 tracking-wide uppercase">
                    <Building2 className="h-2.5 w-2.5" />
                    Professional
                </span>
            </div>

            {/* Sealed ribbon — top right corner overlay */}
            {isSealed && (
                <div className="absolute top-0 right-0 mt-7 z-10">
                    <span className="inline-flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                        🔒 Sealed
                    </span>
                </div>
            )}

            <div className="relative z-10 flex flex-col flex-1">
                {/* Top: avatar + save */}
                <div className="flex items-start gap-2 pr-24">
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

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    <TenderStatusBadge status={tender.status as any} showDot />
                    <WorkflowBadge workflowType={workflowType} />
                    <VisibilityBadge visibilityType={visibilityType} />
                    {(tender as any).procurementCategory && (
                        <TenderCategoryBadge category={(tender as any).procurementCategory} />
                    )}
                    {tenderType && (
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize', colorClasses.text.secondary, colorClasses.bg.secondary)}>
                            {tenderType}
                        </span>
                    )}
                    {cpoRequired && (
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', colorClasses.text.amber, colorClasses.bg.amberLight)}>
                            CPO Required
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className={cn(
                    'text-base font-semibold mt-3 line-clamp-2 leading-snug transition-colors',
                    'group-hover:text-blue-700 dark:group-hover:text-blue-400',
                    colorClasses.text.primary
                )}>
                    {tender.title}
                </h3>

                {/* Reference number */}
                {referenceNumber && (
                    <p className={cn('text-xs mt-1 font-mono', colorClasses.text.muted)}>
                        Ref: {referenceNumber}
                    </p>
                )}

                {/* Procuring entity */}
                {procuringEntity && (
                    <p className={cn('text-xs mt-1 flex items-center gap-1', colorClasses.text.muted)}>
                        <Building2 className="h-3 w-3 shrink-0" />
                        {procuringEntity}
                    </p>
                )}

                {/* Description */}
                {briefDescription ? (
                    <p className={cn('text-sm mt-2 line-clamp-2', colorClasses.text.secondary)}>{briefDescription}</p>
                ) : tender.description ? (
                    <p className={cn('text-sm mt-2 line-clamp-2', colorClasses.text.secondary)}>{tender.description}</p>
                ) : null}

                {/* Metrics bar */}
                <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t', colorClasses.border.secondary)}>
                    {/* Bid count */}
                    {bidCount != null && (
                        <div className={cn('flex items-center gap-1 text-xs', colorClasses.text.secondary)}>
                            <BarChart2 className="h-3.5 w-3.5" />
                            <span className="font-semibold">{bidCount}</span>
                            <span>{bidCount === 1 ? 'bid' : 'bids'}</span>
                            {isOwner && cpoCount != null && (
                                <span className={cn('ml-1', colorClasses.text.muted)}>· {cpoCount} CPO</span>
                            )}
                        </div>
                    )}
                    {tender.deadline && <TenderDeadlineDisplay deadline={tender.deadline} showCountdown />}
                </div>

                {/* Attachments (owner or non-sealed) */}
                {attachments && attachments.length > 0 && (isOwner || !isSealed) && (
                    <div className={cn('mt-4 pt-3 border-t space-y-1.5', colorClasses.border.secondary)} onClick={(e) => e.stopPropagation()}>
                        <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', colorClasses.text.muted)}>Documents</p>
                        {attachments.slice(0, 3).map((att: any) => (
                            <AttachmentRow key={att._id} tenderId={tender._id} attachment={att} />
                        ))}
                        {attachments.length > 3 && (
                            <p className={cn('text-xs', colorClasses.text.muted)}>+{attachments.length - 3} more</p>
                        )}
                    </div>
                )}

                {/* Owner actions */}
                {isOwner && (
                    <OwnerActions
                        tender={tender} onView={onView} onEdit={onEdit}
                        onDelete={onDelete} onAddendum={onAddendum} breakpoint={breakpoint}
                    />
                )}

                {/* Invitation actions */}
                {myInvitationStatus && (
                    <div className={cn('mt-4 pt-4 border-t', colorClasses.border.primary)} onClick={(e) => e.stopPropagation()}>
                        {myInvitationStatus === 'pending' && (
                            <div className="flex gap-2">
                                <button type="button" onClick={onAcceptInvitation}
                                    className={cn('flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors', getTouchTargetSize('md'))}>
                                    Accept Invitation
                                </button>
                                <button type="button" onClick={onDeclineInvitation}
                                    className={cn('flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors', getTouchTargetSize('md'))}>
                                    Decline
                                </button>
                            </div>
                        )}
                        {myInvitationStatus === 'accepted' && (
                            <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', colorClasses.text.emerald)}>
                                ✓ Invitation Accepted
                            </span>
                        )}
                        {myInvitationStatus === 'declined' && (
                            <span className={cn('inline-flex items-center text-xs font-semibold', colorClasses.text.secondary)}>
                                Invitation Declined
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.article>
    );
}