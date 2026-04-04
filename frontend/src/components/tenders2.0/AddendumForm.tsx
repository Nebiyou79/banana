// src/components/tenders2.0/AddendumForm.tsx — ENHANCED
// Added fields: changeType, affectedSections, urgencyLevel,
//               clarificationDeadline, noticeToBidders
// Document type selector per file
// Professional clean design — no "half-half" layout issues
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Calendar, Upload, X, AlertCircle, Loader2, Plus, Download,
  AlertTriangle, ClipboardList, Clock, Info,
} from 'lucide-react';
import { useIssueAddendum, useAddenda, useDownloadProfessionalAttachment } from '@/hooks/useProfessionalTender';
import { colorClasses } from '@/utils/color';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ChangeType =
  | 'scope_change'
  | 'deadline_extension'
  | 'document_correction'
  | 'clarification'
  | 'technical_update'
  | 'financial_update'
  | 'eligibility_update'
  | 'meeting_update'
  | 'cancellation_notice'
  | 'other';

type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical';

interface StagedFile {
  file: File;
  documentType: string;
}

interface AddendumFormFields {
  title:                  string;
  description:            string;
  changeType:             ChangeType;
  affectedSections:       string;
  urgencyLevel:           UrgencyLevel;
  newDeadline?:           string;
  clarificationDeadline?: string;
  noticeToBidders?:       string;
}

interface AddendumFormProps {
  tenderId:        string;
  currentDeadline: string;
  onSuccess?:      () => void;
  showCancel?:     boolean;
  onCancel?:       () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CHANGE_TYPES: { value: ChangeType; label: string; description: string }[] = [
  { value: 'scope_change',        label: 'Scope Change',           description: 'Modification to project scope or deliverables' },
  { value: 'deadline_extension',  label: 'Deadline Extension',     description: 'Extension of submission or other deadlines' },
  { value: 'document_correction', label: 'Document Correction',   description: 'Fix errors or update tender documents' },
  { value: 'clarification',       label: 'Clarification',          description: 'Response to bidder queries or clarifications' },
  { value: 'technical_update',    label: 'Technical Update',       description: 'Changes to technical specifications or requirements' },
  { value: 'financial_update',    label: 'Financial Update',       description: 'Changes to budget, bid security, or payment terms' },
  { value: 'eligibility_update',  label: 'Eligibility Update',     description: 'Changes to qualification or eligibility criteria' },
  { value: 'meeting_update',      label: 'Meeting Update',         description: 'Changes to pre-bid meeting or bid opening schedule' },
  { value: 'cancellation_notice', label: 'Cancellation Notice',    description: 'Notice of tender cancellation or suspension' },
  { value: 'other',               label: 'Other',                  description: 'Other type of addendum' },
];

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; cls: string; dot: string }> = {
  low:      { label: 'Low',      cls: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300',          dot: 'bg-gray-400' },
  normal:   { label: 'Normal',   cls: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',          dot: 'bg-blue-500' },
  high:     { label: 'High',     cls: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',     dot: 'bg-amber-500' },
  critical: { label: 'Critical', cls: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:text-red-300',              dot: 'bg-red-500 animate-pulse' },
};

const ADDENDUM_DOC_TYPES = [
  { value: 'addendum',              label: 'Addendum Document' },
  { value: 'technical_specifications', label: 'Technical Specifications' },
  { value: 'bill_of_quantities',    label: 'Bill of Quantities' },
  { value: 'drawings',              label: 'Drawings / Designs' },
  { value: 'terms_of_reference',    label: 'Terms of Reference' },
  { value: 'clarification',         label: 'Q&A / Clarification' },
  { value: 'other',                 label: 'Other' },
];

// ─────────────────────────────────────────────────────────────────────────────
// AddendumForm
// ─────────────────────────────────────────────────────────────────────────────
export const AddendumForm: React.FC<AddendumFormProps> = ({
  tenderId,
  currentDeadline,
  onSuccess,
  showCancel = true,
}) => {
  const router = useRouter();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const {
    register, control, handleSubmit, watch,
    formState: { errors },
    reset,
  } = useForm<AddendumFormFields>({
    defaultValues: {
      changeType:   'clarification',
      urgencyLevel: 'normal',
    },
  });

  const { mutate: issueAddendum, isPending } = useIssueAddendum();

  const watchedChangeType   = watch('changeType');
  const watchedUrgencyLevel = watch('urgencyLevel') as UrgencyLevel;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).slice(0, 5 - stagedFiles.length);
    setStagedFiles(prev => [
      ...prev,
      ...dropped.map(f => ({ file: f, documentType: 'addendum' })),
    ].slice(0, 5));
  }, [stagedFiles.length]);

  const addFiles = (newFiles: File[]) => {
    setStagedFiles(prev =>
      [...prev, ...newFiles.map(f => ({ file: f, documentType: 'addendum' }))].slice(0, 5)
    );
  };

  const removeFile = (index: number) => setStagedFiles(prev => prev.filter((_, i) => i !== index));
  const updateFileType = (index: number, docType: string) =>
    setStagedFiles(prev => prev.map((f, i) => i === index ? { ...f, documentType: docType } : f));

  const onSubmit = (data: AddendumFormFields) => {
    const payload: any = {
      title:       data.title,
      description: data.description,
      changeType:  data.changeType,
      urgencyLevel:data.urgencyLevel,
    };
    if (data.affectedSections)       payload.affectedSections       = data.affectedSections;
    if (data.noticeToBidders)        payload.noticeToBidders        = data.noticeToBidders;
    if (data.newDeadline)            payload.newDeadline            = data.newDeadline;
    if (data.clarificationDeadline)  payload.clarificationDeadline  = data.clarificationDeadline;

    issueAddendum(
      {
        id:    tenderId,
        data:  payload,
        files: stagedFiles.length ? stagedFiles.map(sf => sf.file) : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setStagedFiles([]);
          if (onSuccess) onSuccess();
          else router.back();
        },
      }
    );
  };

  const minDeadline = new Date(currentDeadline).toISOString().slice(0, 16);

  const inputCls = cn(
    'w-full rounded-xl border-2 px-3.5 py-2.5 text-sm outline-none transition-all',
    'focus:ring-2 focus:ring-[#F1BB03]/50 focus:border-[#F1BB03]',
    colorClasses.border.gray300,
    colorClasses.bg.white,
    colorClasses.text.primary
  );
  const labelCls = cn('block text-sm font-semibold mb-1.5', colorClasses.text.primary);
  const errorCls = cn('text-xs mt-1 flex items-center gap-1', colorClasses.text.error);

  const urgencyCfg = URGENCY_CONFIG[watchedUrgencyLevel] ?? URGENCY_CONFIG.normal;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Notification banner */}
      <div className={cn('flex items-start gap-2.5 rounded-xl border px-4 py-3', colorClasses.bg.amberLight, colorClasses.border.amber)}>
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className={cn('text-xs font-medium', colorClasses.text.amber700)}>
          Issuing an addendum will notify all registered bidders by email. This action is irreversible.
        </p>
      </div>

      {/* ── Section 1: Core Fields ── */}
      <div className={cn('rounded-2xl border p-5 space-y-5', colorClasses.bg.white, colorClasses.border.gray200)}>
        <p className={cn('text-xs font-bold uppercase tracking-widest', colorClasses.text.muted)}>Addendum Details</p>

        {/* Title */}
        <div>
          <label className={labelCls}>Title <span className="text-red-500">*</span></label>
          <input {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Min 5 characters' } })}
            placeholder="e.g., Extension of Submission Deadline — Round 2"
            className={cn(inputCls, errors.title && 'border-red-400')} />
          {errors.title && <p className={errorCls}><AlertCircle className="w-3 h-3" />{errors.title.message}</p>}
        </div>

        {/* Type of Change */}
        <div>
          <label className={labelCls}>Type of Change <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHANGE_TYPES.map(ct => (
              <label key={ct.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                  watchedChangeType === ct.value
                    ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#F1BB03]/5'
                    : cn('hover:border-[#F1BB03]/40', colorClasses.border.gray200, colorClasses.bg.secondary)
                )}>
                <input type="radio" value={ct.value} {...register('changeType')} className="sr-only" />
                <span className={cn('w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all',
                  watchedChangeType === ct.value ? 'border-[#F1BB03] bg-[#F1BB03]' : colorClasses.border.gray300)}>
                  {watchedChangeType === ct.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold', colorClasses.text.primary)}>{ct.label}</p>
                  <p className={cn('text-[10px] mt-0.5', colorClasses.text.muted)}>{ct.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className={labelCls}>Urgency Level</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map(level => {
              const cfg = URGENCY_CONFIG[level];
              const isSelected = watchedUrgencyLevel === level;
              return (
                <label key={level} className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-2 cursor-pointer text-xs font-semibold transition-all',
                  isSelected ? cn(cfg.cls, 'border-[#F1BB03]') : cn(colorClasses.bg.secondary, colorClasses.border.gray200, colorClasses.text.muted)
                )}>
                  <input type="radio" value={level} {...register('urgencyLevel')} className="sr-only" />
                  <span className={cn('w-2 h-2 rounded-full shrink-0', isSelected ? cfg.dot : 'bg-gray-300')} />
                  {cfg.label}
                </label>
              );
            })}
          </div>
          {watchedUrgencyLevel === 'critical' && (
            <p className={cn('text-xs mt-2 flex items-center gap-1.5 font-medium', colorClasses.text.error)}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical urgency will send an immediate alert to all bidders.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description <span className="text-red-500">*</span></label>
          <textarea {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Min 20 characters' } })}
            rows={5}
            placeholder="Provide a clear and complete description of all changes made by this addendum. Reference specific clauses, sections, or pages where applicable…"
            className={cn(inputCls, 'resize-none', errors.description && 'border-red-400')} />
          {errors.description && <p className={errorCls}><AlertCircle className="w-3 h-3" />{errors.description.message}</p>}
        </div>
      </div>

      {/* ── Section 2: Impact ── */}
      <div className={cn('rounded-2xl border p-5 space-y-5', colorClasses.bg.white, colorClasses.border.gray200)}>
        <p className={cn('text-xs font-bold uppercase tracking-widest', colorClasses.text.muted)}>Scope of Impact</p>

        {/* Affected Sections */}
        <div>
          <label className={labelCls}>Affected Sections</label>
          <input {...register('affectedSections')}
            placeholder="e.g., Section 3.2 — Technical Requirements, Annex B, Page 12"
            className={inputCls} />
          <p className={cn('text-[11px] mt-1', colorClasses.text.muted)}>List the specific sections, pages, or clauses this addendum modifies.</p>
        </div>

        {/* Notice to Bidders */}
        <div>
          <label className={labelCls}>Special Notice to Bidders</label>
          <textarea {...register('noticeToBidders')}
            rows={3}
            placeholder="Any specific instructions bidders should follow in response to this addendum…"
            className={cn(inputCls, 'resize-none')} />
        </div>
      </div>

      {/* ── Section 3: Deadlines ── */}
      <div className={cn('rounded-2xl border p-5 space-y-5', colorClasses.bg.white, colorClasses.border.gray200)}>
        <p className={cn('text-xs font-bold uppercase tracking-widest', colorClasses.text.muted)}>Deadline Changes (Optional)</p>

        <div className={cn('grid gap-5', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          {/* New Submission Deadline */}
          <div>
            <label className={labelCls}>
              New Submission Deadline
              <span className={cn('ml-2 text-xs font-normal', colorClasses.text.muted)}>(optional)</span>
            </label>
            <div className="relative">
              <Calendar className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none', colorClasses.text.muted)} />
              <input type="datetime-local" min={minDeadline}
                {...register('newDeadline', {
                  validate: v => !v || new Date(v) > new Date(currentDeadline) || 'Must be after current deadline',
                })}
                className={cn(inputCls, 'pl-10')} />
            </div>
            <p className={cn('text-[11px] mt-1', colorClasses.text.muted)}>
              Current: {formatDate(currentDeadline)}
            </p>
            {errors.newDeadline && <p className={errorCls}><AlertCircle className="w-3 h-3" />{errors.newDeadline.message}</p>}
          </div>

          {/* Clarification Deadline */}
          <div>
            <label className={labelCls}>
              Clarification Deadline
              <span className={cn('ml-2 text-xs font-normal', colorClasses.text.muted)}>(optional)</span>
            </label>
            <div className="relative">
              <Clock className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none', colorClasses.text.muted)} />
              <input type="datetime-local"
                {...register('clarificationDeadline')}
                className={cn(inputCls, 'pl-10')} />
            </div>
            <p className={cn('text-[11px] mt-1', colorClasses.text.muted)}>Last date for bidder questions about this addendum.</p>
          </div>
        </div>
      </div>

      {/* ── Section 4: Documents ── */}
      <div className={cn('rounded-2xl border p-5 space-y-4', colorClasses.bg.white, colorClasses.border.gray200)}>
        <div className="flex items-center justify-between">
          <p className={cn('text-xs font-bold uppercase tracking-widest', colorClasses.text.muted)}>Supporting Documents</p>
          <span className={cn('text-xs', colorClasses.text.muted)}>{stagedFiles.length}/5</span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'relative rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all cursor-pointer',
            dragging
              ? 'border-[#F1BB03] bg-amber-50 dark:bg-[#F1BB03]/5'
              : cn(colorClasses.border.gray300, colorClasses.bg.secondary)
          )}
        >
          <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={e => addFiles(Array.from(e.target.files || []).slice(0, 5 - stagedFiles.length))} />
          <Upload className={cn('mx-auto w-7 h-7 mb-2', colorClasses.text.muted)} />
          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>
            Drop files here or <span className="text-[#F1BB03] font-semibold">browse</span>
          </p>
          <p className={cn('text-xs mt-1', colorClasses.text.muted)}>Up to 5 files · PDF, Word, Excel, images</p>
        </div>

        {/* Staged files with type selector */}
        <AnimatePresence>
          {stagedFiles.length > 0 && (
            <motion.ul initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {stagedFiles.map((sf, i) => (
                <li key={i} className={cn('flex items-center gap-3 p-3 rounded-xl border', colorClasses.bg.secondary, colorClasses.border.gray200)}>
                  <FileText className={cn('w-4 h-4 shrink-0', colorClasses.text.muted)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-medium truncate', colorClasses.text.primary)}>{sf.file.name}</p>
                    <p className={cn('text-[10px]', colorClasses.text.muted)}>{formatFileSize(sf.file.size)}</p>
                  </div>
                  {/* Document type selector */}
                  <select
                    value={sf.documentType}
                    onChange={e => updateFileType(i, e.target.value)}
                    className={cn('text-xs rounded-lg border px-2 py-1 shrink-0 w-40 outline-none',
                      colorClasses.bg.white, colorClasses.border.gray200, colorClasses.text.primary,
                      'focus:ring-2 focus:ring-[#F1BB03]/40 focus:border-[#F1BB03]')}>
                    {ADDENDUM_DOC_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeFile(i)}
                    className={cn('shrink-0 p-1.5 rounded-lg transition-colors', colorClasses.text.error, 'hover:bg-red-50 dark:hover:bg-red-950/20')}
                    aria-label="Remove file">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* ── Submit / Cancel ── */}
      <div className={cn('flex gap-3 pt-2', isMobile ? 'flex-col' : 'justify-end')}>
        {showCancel && (
          <button type="button" onClick={() => router.back()}
            className={cn('rounded-xl border-2 px-6 py-3 text-sm font-semibold transition-all hover:opacity-70 min-h-[48px]',
              isMobile ? 'w-full order-2' : '',
              colorClasses.border.gray300, colorClasses.text.primary)}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={isPending}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold',
            'transition-all hover:brightness-105 disabled:opacity-50 min-h-[48px]',
            isMobile ? 'w-full order-1' : '',
            urgencyCfg.label === 'Critical'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-[#0A2540] text-white shadow-lg shadow-[#0A2540]/20 dark:bg-[#F1BB03] dark:text-[#0A2540]'
          )}>
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing…</>
            : <><Plus className="w-4 h-4" /> Issue Addendum</>}
        </button>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AddendumList
// ─────────────────────────────────────────────────────────────────────────────
const CHANGE_TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  scope_change:        { label: 'Scope Change',        cls: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300' },
  deadline_extension:  { label: 'Deadline Extension',  cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300' },
  document_correction: { label: 'Doc Correction',     cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300' },
  clarification:       { label: 'Clarification',       cls: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300' },
  technical_update:    { label: 'Technical Update',    cls: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300' },
  financial_update:    { label: 'Financial Update',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' },
  eligibility_update:  { label: 'Eligibility Update',  cls: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300' },
  meeting_update:      { label: 'Meeting Update',      cls: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300' },
  cancellation_notice: { label: 'Cancellation',        cls: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300' },
  other:               { label: 'Other',               cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300' },
};

interface AddendumListProps {
  tenderId: string;
  limit?: number;
  onViewAll?: () => void;
}

export const AddendumList: React.FC<AddendumListProps> = ({ tenderId, limit, onViewAll }) => {
  const { data: addenda, isLoading } = useAddenda(tenderId);
  const { mutate: downloadAttachment, isPending: isDownloading } = useDownloadProfessionalAttachment();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className={cn('h-6 w-6 animate-spin rounded-full border-2 border-t-transparent', colorClasses.border.goldenMustard)} />
      </div>
    );
  }

  const sorted = [...(addenda ?? [])].sort((a, b) => {
    const dA = (a as any).createdAt ?? (a as any).issuedAt ?? '';
    const dB = (b as any).createdAt ?? (b as any).issuedAt ?? '';
    return new Date(dB).getTime() - new Date(dA).getTime();
  });

  const displayed = limit ? sorted.slice(0, limit) : sorted;

  if (!sorted.length) {
    return (
      <div className={cn('flex flex-col items-center gap-2 rounded-xl border-2 border-dashed py-12 text-center', colorClasses.border.gray300)}>
        <ClipboardList className={cn('w-10 h-10 opacity-30', colorClasses.text.muted)} />
        <p className={cn('font-semibold', colorClasses.text.primary)}>No addenda issued yet</p>
        <p className={cn('text-sm', colorClasses.text.muted)}>Amendments to this tender will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <ol className="relative space-y-0">
        {displayed.map((addendum, index) => {
          const ts   = (addendum as any).createdAt ?? (addendum as any).issuedAt;
          const docs: any[] = (addendum as any).documents ?? (addendum as any).attachments ?? [];
          const isPast = ts && new Date(ts) <= new Date();
          const typeBadge = CHANGE_TYPE_BADGES[(addendum as any).changeType] ?? CHANGE_TYPE_BADGES.other;
          const urgencyLevel: UrgencyLevel = (addendum as any).urgencyLevel ?? 'normal';
          const urgencyCfg = URGENCY_CONFIG[urgencyLevel] ?? URGENCY_CONFIG.normal;

          return (
            <motion.li key={addendum._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 pb-8 last:pb-0">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={cn('z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  colorClasses.bg.goldenMustard, colorClasses.text.darkNavy)}>
                  {sorted.length - index}
                </div>
                {index < displayed.length - 1 && (
                  <div className={cn('mt-1 w-0.5 flex-1', isPast ? colorClasses.bg.goldenMustard : colorClasses.bg.gray300)}
                    style={{ minHeight: 40 }} />
                )}
              </div>

              {/* Card */}
              <div className={cn('flex-1 rounded-2xl border p-5 shadow-sm', colorClasses.bg.white, colorClasses.border.gray200)}>
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <p className={cn('font-bold text-sm break-words', colorClasses.text.primary)}>{addendum.title}</p>
                    {/* Change type badge */}
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0', typeBadge.cls)}>
                      {typeBadge.label}
                    </span>
                    {/* Urgency badge (skip 'normal') */}
                    {urgencyLevel !== 'normal' && (
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0', urgencyCfg.cls)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', urgencyCfg.dot)} />
                        {urgencyCfg.label}
                      </span>
                    )}
                  </div>
                  {ts && (
                    <time className={cn('text-xs shrink-0', colorClasses.text.muted)}>{formatDate(ts)}</time>
                  )}
                </div>

                {/* Description */}
                <p className={cn('text-sm leading-relaxed', colorClasses.text.secondary)}>{addendum.description}</p>

                {/* Affected sections */}
                {(addendum as any).affectedSections && (
                  <div className={cn('mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2', colorClasses.bg.secondary, colorClasses.text.muted)}>
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span><strong>Affected:</strong> {(addendum as any).affectedSections}</span>
                  </div>
                )}

                {/* Notice to bidders */}
                {(addendum as any).noticeToBidders && (
                  <div className="mt-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span><strong>Notice:</strong> {(addendum as any).noticeToBidders}</span>
                  </div>
                )}

                {/* Deadline changes */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {addendum.newDeadline && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
                      🗓 New deadline: {formatDate(addendum.newDeadline)}
                    </div>
                  )}
                  {(addendum as any).clarificationDeadline && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                      ❓ Clarifications by: {formatDate((addendum as any).clarificationDeadline)}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {docs.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className={cn('text-xs font-semibold uppercase tracking-wide', colorClasses.text.muted)}>Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {docs.map((doc: any) => (
                        <button key={doc._id || doc.fileName} type="button"
                          onClick={() => downloadAttachment({
                            tenderId,
                            attachmentId: doc._id,
                            filename: doc.originalName || doc.fileName || 'document',
                          })}
                          disabled={isDownloading}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
                            'bg-[#0A2540] text-white dark:bg-[#F1BB03] dark:text-[#0A2540]',
                            'hover:opacity-90 disabled:opacity-50 transition-opacity'
                          )}>
                          <Download className="w-3 h-3" />
                          {doc.originalName || doc.filename || 'Document'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      {limit && sorted.length > limit && onViewAll && (
        <div className="mt-4 text-center">
          <button onClick={onViewAll}
            className={cn('text-sm font-semibold', colorClasses.text.goldenMustard, 'hover:underline')}>
            View all {sorted.length} addenda →
          </button>
        </div>
      )}
    </div>
  );
};

export default AddendumForm;