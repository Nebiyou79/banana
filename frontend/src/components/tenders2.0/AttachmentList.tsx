// components/tenders/detail/AttachmentList.tsx — FIXED
// FIX 3.3 / 4.2: Download buttons now use explicit colorClasses tokens — visible in both
//                light and dark mode. We inline the file list instead of delegating to
//                FileAttachmentsList (whose button styling was invisible in dark mode).
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import {
  FileStack, Upload, Loader2, File, Download, Trash2,
  FileText, FileImage, FileArchive, FileSpreadsheet,
  FileVideo, FileAudio, Calendar, ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { SectionCard } from '@/components/tenders/shared/SectionCard';
import { useUploadFreelanceAttachments } from '@/hooks/useFreelanceTender';
import {
  useUploadProfessionalAttachments,
  useDownloadProfessionalAttachment,
  useDeleteProfessionalAttachment,
} from '@/hooks/useProfessionalTender';
import { useToast } from '@/hooks/use-toast';
import type { FreelanceTender, ProfessionalTender } from '@/types/tender.types';
import { Button } from '@/components/ui/Button';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/Tooltip';

type AnyAttachment =
  | FreelanceTender['attachments'][number]
  | ProfessionalTender['attachments'][number];

interface AttachmentListSectionProps {
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  attachments: AnyAttachment[];
  isOwner?: boolean;
  tenderStatus?: string;
  onAttachmentDeleted?: (attachmentId: string) => void;
  onAttachmentUploaded?: () => void;
  className?: string;
}

// ─── File helpers ─────────────────────────────────────────────────────────────
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (/^(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(ext)) return <FileImage className="w-4 h-4 text-blue-500" />;
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (/^(doc|docx|txt|rtf|odt)$/.test(ext)) return <FileText className="w-4 h-4 text-blue-600" />;
  if (/^(xls|xlsx|csv|ods)$/.test(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
  if (/^(zip|rar|7z|tar|gz)$/.test(ext)) return <FileArchive className="w-4 h-4 text-amber-600" />;
  if (/^(mp4|mov|avi|wmv|flv|mkv)$/.test(ext)) return <FileVideo className="w-4 h-4 text-purple-600" />;
  if (/^(mp3|wav|ogg|flac|m4a)$/.test(ext)) return <FileAudio className="w-4 h-4 text-pink-600" />;
  return <File className="w-4 h-4 text-gray-400" />;
};

const docTypeLabel: Record<string, string> = {
  terms_of_reference:      'Terms of Reference',
  technical_specifications: 'Technical Specs',
  specifications:           'Specifications',
  statement_of_work:        'Statement of Work',
  drawings:                 'Drawings',
  bill_of_quantities:       'Bill of Quantities',
  compliance_template:      'Compliance Template',
  reference_designs:        'Reference Designs',
  nda:                      'NDA',
  sample_data:              'Sample Data',
  addendum:                 'Addendum',
  other:                    'Other',
};

// ─── Inline attachment list ───────────────────────────────────────────────────
const AttachmentItem: React.FC<{
  attachment: AnyAttachment;
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  isOwner: boolean;
  onDelete?: (id: string) => void;
}> = ({ attachment, tenderId, tenderType, isOwner, onDelete }) => {
  const a = attachment as any;
  const { mutate: downloadAttachment, isPending: downloading } = useDownloadProfessionalAttachment();
  const { mutate: deleteAttachment, isPending: deleting } = useDeleteProfessionalAttachment();
  const { toast } = useToast();

  const handleDownload = () => {
    if (tenderType === 'professional') {
      downloadAttachment(
        { tenderId, attachmentId: a._id, filename: a.originalName || a.fileName || 'document' },
        { onError: () => toast({ title: 'Download failed', variant: 'destructive' }) }
      );
    } else {
      // For freelance tenders, open the URL directly
      if (a.url || a.downloadUrl) {
        window.open(a.url ?? a.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleDelete = () => {
    if (!isOwner) return;
    deleteAttachment(
      { id: tenderId, attachmentId: a._id },
      {
        onSuccess: () => onDelete?.(a._id),
        onError: () => toast({ title: 'Delete failed', variant: 'destructive' }),
      }
    );
  };

  const typeLabel = docTypeLabel[a.documentType] ?? a.documentType ?? 'Document';
  const filename  = a.originalName ?? a.fileName ?? 'Document';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all group',
        colorClasses.bg.white,
        colorClasses.border.gray200,
        'hover:border-[#F1BB03]/40 hover:shadow-sm'
      )}
    >
      {/* File icon */}
      <div className={cn('p-2 rounded-lg shrink-0', colorClasses.bg.secondary)}>
        {getFileIcon(filename)}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold truncate', colorClasses.text.primary)} title={filename}>
          {filename}
        </p>
        <div className={cn('flex items-center gap-2 mt-0.5 text-xs', colorClasses.text.muted)}>
          {a.size && <span>{formatFileSize(a.size)}</span>}
          {a.size && typeLabel && <span>·</span>}
          {typeLabel && (
            <span className={cn(
              'inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold',
              colorClasses.bg.blueLight, colorClasses.text.blue600
            )}>
              {typeLabel}
            </span>
          )}
          {a.uploadedAt && (
            <>
              <span>·</span>
              <span>{formatDate(a.uploadedAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* FIX 3.3 / 4.2: Download button with explicit colors visible in both modes */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          title="Download"
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            'bg-[#0A2540] text-white hover:bg-[#0A2540]/90',
            'dark:bg-[#F1BB03] dark:text-[#0A2540] dark:hover:brightness-105',
            'disabled:opacity-50 min-h-[32px]'
          )}
        >
          {downloading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{downloading ? 'Downloading…' : 'Download'}</span>
        </button>

        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete attachment"
            className={cn(
              'p-1.5 rounded-lg transition-all min-h-[32px] min-w-[32px] flex items-center justify-center',
              'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20',
              'disabled:opacity-50'
            )}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Upload Zone ──────────────────────────────────────────────────────────────
const UploadZone: React.FC<{
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  onUploaded?: () => void;
}> = ({ tenderId, tenderType, onUploaded }) => {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const { mutate: uploadFreelance, isPending: uploadingFL } = useUploadFreelanceAttachments();
  const { mutate: uploadProfessional, isPending: uploadingPR } = useUploadProfessionalAttachments();
  const isUploading = tenderType === 'freelance' ? uploadingFL : uploadingPR;

  const addFiles = useCallback((newFiles: File[]) => setFiles(prev => [...prev, ...newFiles]), []);
  const removeFile = useCallback((idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx)), []);

  const handleUpload = useCallback(() => {
    if (!files.length) return;
    const upload = tenderType === 'freelance' ? uploadFreelance : uploadProfessional;
    (upload as any)(
      { id: tenderId, files },
      {
        onSuccess: () => {
          toast({ title: 'Upload successful', description: `${files.length} file(s) uploaded`, variant: 'success' });
          setFiles([]);
          onUploaded?.();
        },
        onError: () => toast({ title: 'Upload failed', description: 'Could not upload files', variant: 'destructive' }),
      }
    );
  }, [files, tenderId, tenderType, uploadFreelance, uploadProfessional, onUploaded, toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all cursor-pointer',
          dragging
            ? 'border-[#F1BB03] bg-[#FFFBEB] dark:bg-[#F1BB03]/5'
            : cn(colorClasses.border.gray300, colorClasses.bg.secondary),
        )}
      >
        <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={e => addFiles(Array.from(e.target.files ?? []))} />
        <Upload className={cn('w-7 h-7 mx-auto mb-2', colorClasses.text.muted)} />
        <p className={cn('text-sm font-semibold', colorClasses.text.primary)}>
          Drag & drop or <span className="text-[#F1BB03]">browse files</span>
        </p>
        <p className={cn('text-xs mt-1', colorClasses.text.muted)}>Max 50 MB per file</p>
      </div>

      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl border p-3', colorClasses.border.gray200, colorClasses.bg.white)}>
          <p className={cn('text-xs font-semibold mb-2', colorClasses.text.muted)}>
            {files.length} file{files.length !== 1 ? 's' : ''} staged
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {getFileIcon(file.name)}
                <span className={cn('flex-1 truncate min-w-0 text-xs', colorClasses.text.primary)}>{file.name}</span>
                <span className={cn('text-xs shrink-0', colorClasses.text.muted)}>{formatFileSize(file.size)}</span>
                <button type="button" onClick={() => removeFile(idx)}
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  aria-label="Remove file">×</button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleUpload} disabled={isUploading} size="sm"
              className="bg-[#F1BB03] hover:brightness-105 text-[#0A2540] font-semibold">
              {isUploading
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Uploading…</>
                : <>Upload {files.length} file{files.length !== 1 ? 's' : ''}</>}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Stats bar ────────────────────────────────────────────────────────────────
const AttachmentStats = ({ attachments }: { attachments: AnyAttachment[] }) => {
  const totalSize = attachments.reduce((acc, a) => acc + ((a as any).size || 0), 0);
  const sorted = [...attachments].sort((a, b) =>
    new Date((b as any).uploadedAt || 0).getTime() - new Date((a as any).uploadedAt || 0).getTime()
  );
  const lastUploaded = formatDate((sorted[0] as any)?.uploadedAt);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold', colorClasses.bg.blueLight, colorClasses.text.blue600)}>
              <FileStack className="w-3.5 h-3.5" />
              {attachments.length} file{attachments.length !== 1 ? 's' : ''}
            </div>
          </TooltipTrigger>
          <TooltipContent><p>Total files</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {totalSize > 0 && (
        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold', colorClasses.bg.secondary, colorClasses.text.secondary)}>
          {formatFileSize(totalSize)}
        </div>
      )}

      {lastUploaded && (
        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold', colorClasses.bg.amberLight, colorClasses.text.amber600)}>
          <Calendar className="w-3.5 h-3.5" />
          {lastUploaded}
        </div>
      )}
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const AttachmentListSection: React.FC<AttachmentListSectionProps> = ({
  tenderId,
  tenderType,
  attachments,
  isOwner = false,
  tenderStatus,
  onAttachmentDeleted,
  onAttachmentUploaded,
  className,
}) => {
  const canUpload = isOwner && (tenderType === 'freelance' || tenderStatus === 'draft');

  return (
    <div className={className}>
      <SectionCard
        icon={<FileStack className={cn('w-5 h-5', colorClasses.text.blue600)} />}
        title="Supporting Documents"
        description="Official tender documents and specifications"
      >
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className={cn('p-4 rounded-full', colorClasses.bg.secondary)}>
              <FileStack className={cn('w-10 h-10 opacity-40', colorClasses.text.muted)} />
            </div>
            <div>
              <p className={cn('font-semibold mb-1', colorClasses.text.primary)}>No documents attached</p>
              <p className={cn('text-sm max-w-xs mx-auto', colorClasses.text.muted)}>
                {isOwner ? 'Upload documents to share with applicants and bidders.' : 'No documents have been attached to this tender.'}
              </p>
            </div>
            {canUpload && (
              <div className="w-full max-w-md">
                <UploadZone tenderId={tenderId} tenderType={tenderType} onUploaded={onAttachmentUploaded} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AttachmentStats attachments={attachments} />

            {/* FIX 3.3 / 4.2: Inline list — download buttons use explicit dark/light safe colors */}
            <div className="space-y-2">
              {attachments.map((att, i) => (
                <AttachmentItem
                  key={(att as any)._id ?? i}
                  attachment={att}
                  tenderId={tenderId}
                  tenderType={tenderType}
                  isOwner={isOwner}
                  onDelete={onAttachmentDeleted}
                />
              ))}
            </div>

            {canUpload && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className={cn('text-xs font-semibold mb-3', colorClasses.text.muted)}>Add more files</p>
                <UploadZone tenderId={tenderId} tenderType={tenderType} onUploaded={onAttachmentUploaded} />
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
};