// components/proposals/freelancer/AttachmentUploader.tsx
// ─── Sections fixed ─────────────────────────────────────────────────────────
// B:  All hardcoded slate/indigo → colorClasses
// E-4: Lucide Upload icon instead of emoji, file type badge grid,
//      disabled overlay when proposalId is null,
//      upload progress indicator (animated bar removed — realistic pulse)
// F:  No "any", cn() throughout
'use client';
import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Image, Archive, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { ProposalAttachmentList } from './shared/ProposalAttachmentList';
import type { ProposalAttachment } from '@/services/proposalService';

interface Props {
  proposalId?: string;
  attachments: ProposalAttachment[];
  onUpload: (files: File[]) => void;
  onDelete?: (id: string) => void;
  isUploading?: boolean;
  maxFiles?: number;
  allowedTypes?: string[];
}

const DEFAULT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png', 'image/jpeg',
  'application/zip', 'application/x-zip-compressed',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

// E-4: allowed file type reference badges
const FILE_TYPE_BADGES: { ext: string; label: string; bg: string; text: string; icon: React.ReactNode }[] = [
  { ext: 'PDF', label: 'PDF', bg: colorClasses.bg.redLight, text: colorClasses.text.red, icon: <FileText className="w-3 h-3" /> },
  { ext: 'DOC', label: 'DOC', bg: colorClasses.bg.blueLight, text: colorClasses.text.blue, icon: <FileText className="w-3 h-3" /> },
  { ext: 'IMG', label: 'IMG', bg: colorClasses.bg.purpleLight, text: colorClasses.text.purple, icon: <Image className="w-3 h-3" /> },
  { ext: 'ZIP', label: 'ZIP', bg: colorClasses.bg.grayLight, text: colorClasses.text.muted, icon: <Archive className="w-3 h-3" /> },
];

export function AttachmentUploader({
  proposalId,
  attachments,
  onUpload,
  onDelete,
  isUploading,
  maxFiles = 10,
  allowedTypes = DEFAULT_TYPES,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = maxFiles - attachments.length;
  const isDisabled = !proposalId;

  const validate = (files: FileList | null): File[] => {
    if (!files) return [];
    const errs: string[] = [];
    const valid: File[] = [];

    Array.from(files).forEach((f) => {
      if (!allowedTypes.includes(f.type)) {
        errs.push(`${f.name}: unsupported file type`);
      } else if (f.size > MAX_SIZE_BYTES) {
        errs.push(`${f.name}: exceeds 10 MB limit`);
      } else if (valid.length < remaining) {
        valid.push(f);
      } else {
        errs.push(`${f.name}: attachment limit (${maxFiles}) reached`);
      }
    });

    setErrors(errs);
    return valid;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (isDisabled) return;
    const valid = validate(files);
    if (valid.length > 0) onUpload(valid);
  }, [isDisabled, remaining, allowedTypes, onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="space-y-4">
      {/* E-4: disabled overlay when no proposalId */}
      <div className={cn('relative', isDisabled && 'pointer-events-none')}>
        {isDisabled && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 dark:bg-[#0A2540]/80 backdrop-blur-sm">
            <File className={cn('w-8 h-8 mb-2', colorClasses.text.muted)} />
            <p className={cn('text-sm font-medium text-center px-4', colorClasses.text.muted)}>
              Complete the form to unlock attachments
            </p>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !isDisabled && inputRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all',
            dragOver
              ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#F1BB03]/10'
              : cn(colorClasses.border.gray200, colorClasses.bg.secondary, 'hover:border-[#F1BB03]/50'),
            isDisabled && 'opacity-50',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* E-4: lucide Upload icon */}
          <div className={cn(
            'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
            colorClasses.bg.secondary,
          )}>
            <Upload className={cn('w-5 h-5', colorClasses.text.muted)} />
          </div>

          <p className={cn('text-sm font-medium', colorClasses.text.primary)}>
            Drop files here or{' '}
            <span className="text-[#F1BB03] font-semibold">browse</span>
          </p>
          <p className={cn('mt-1 text-xs', colorClasses.text.muted)}>
            PDF, DOC, DOCX, PNG, JPG, ZIP · Max 10 MB per file
          </p>
          <p className={cn('mt-1 text-xs font-medium', colorClasses.text.secondary)}>
            {attachments.length} of {maxFiles} files used
          </p>

          {/* E-4: file type badge row */}
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            {FILE_TYPE_BADGES.map(({ ext, label, bg, text, icon }) => (
              <span
                key={ext}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold',
                  bg, text,
                )}
              >
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Upload progress (animated pulse while uploading) */}
      {isUploading && (
        <div className={cn('rounded-xl border px-4 py-3', colorClasses.bg.secondary, colorClasses.border.gray200)}>
          <div className={cn('flex items-center justify-between text-sm mb-1.5', colorClasses.text.secondary)}>
            <span>Uploading…</span>
          </div>
          <div className={cn('h-1.5 w-full overflow-hidden rounded-full', colorClasses.bg.gray200)}>
            <div
              className="h-full rounded-full bg-[#F1BB03] animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <ul className={cn('rounded-xl border px-4 py-3 space-y-1', colorClasses.bg.redLight, colorClasses.border.red)}>
          {errors.map((e, i) => (
            <li key={i} className={cn('text-xs flex items-center gap-1.5', colorClasses.text.red)}>
              <AlertCircle className="w-3 h-3 shrink-0" /> {e}
            </li>
          ))}
        </ul>
      )}

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <ProposalAttachmentList
          attachments={attachments}
          canDelete={!!onDelete}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}