/* eslint-disable @typescript-eslint/no-explicit-any */
// components/tenders2.0/shared/TenderAttachmentList.tsx
import React from 'react';
import {
  FileText, Download, Trash2, Loader2,
  FileImage, FileArchive, FileSpreadsheet,
  FileVideo, FileAudio, File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorClasses } from '@/utils/color';
import { useDownloadFreelanceAttachment } from '@/hooks/useFreelanceTender';
import { useDownloadProfessionalAttachment } from '@/hooks/useProfessionalTender';
import type { TenderAttachment } from '@/types/tender.types';
import { motion } from 'framer-motion';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Button } from '@/components/social/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FileAttachmentsListProps {
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  attachments: TenderAttachment[];
  isOwner?: boolean;
  allowDownload?: boolean;
  allowDelete?: boolean;
  onDelete?: (attachmentId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatFileSize = (bytes: number) => {
  if (!bytes) return '';
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
  if (/^(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(ext))
    return <FileImage className="w-5 h-5 text-blue-500 shrink-0" />;
  if (ext === 'pdf')
    return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  if (/^(doc|docx|txt|rtf|odt)$/.test(ext))
    return <FileText className="w-5 h-5 text-blue-600 shrink-0" />;
  if (/^(xls|xlsx|csv|ods)$/.test(ext))
    return <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />;
  if (/^(zip|rar|7z|tar|gz)$/.test(ext))
    return <FileArchive className="w-5 h-5 text-amber-600 shrink-0" />;
  if (/^(mp4|mov|avi|wmv|flv|mkv)$/.test(ext))
    return <FileVideo className="w-5 h-5 text-purple-600 shrink-0" />;
  if (/^(mp3|wav|ogg|flac|m4a)$/.test(ext))
    return <FileAudio className="w-5 h-5 text-pink-600 shrink-0" />;
  return <File className="w-5 h-5 text-gray-400 shrink-0" />;
};

const extBadge = (filename: string) => {
  const ext = filename.split('.').pop()?.toUpperCase() ?? '';
  return ext ? (
    <span className={cn(
      'hidden sm:inline-flex shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
      colorClasses.bg.secondary, colorClasses.text.muted,
    )}>
      {ext}
    </span>
  ) : null;
};

// ─── Download button — isolated so each row has its own isPending ─────────────
interface DownloadButtonProps {
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  attachment: TenderAttachment;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ tenderId, tenderType, attachment }) => {
  // Both hooks called unconditionally (Rules of Hooks) — only one is invoked.
  const { mutate: downloadFreelance, isPending: pendingFL } = useDownloadFreelanceAttachment();
  const { mutate: downloadProfessional, isPending: pendingPR } = useDownloadProfessionalAttachment();
  const isPending = tenderType === 'freelance' ? pendingFL : pendingPR;

  const handleDownload = () => {
    if (tenderType === 'freelance') {
      downloadFreelance({ tenderId, attachmentId: attachment._id });
    } else {
      downloadProfessional({
        tenderId,
        attachmentId: attachment._id,
        filename: attachment.originalName ?? attachment.fileName,
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDownload}
            disabled={isPending}
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Download</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Single attachment row ────────────────────────────────────────────────────
const AttachmentRow = ({
  attachment, tenderId, tenderType, allowDownload, allowDelete, onDelete,
}: {
  attachment: TenderAttachment;
  tenderId: string;
  tenderType: 'freelance' | 'professional';
  allowDownload: boolean;
  allowDelete: boolean;
  onDelete?: (id: string) => void;
}) => {
  const filename = attachment.originalName ?? attachment.fileName ?? 'Untitled';
  const uploadedAt = (attachment as any).uploadedAt || (attachment as any).createdAt;
  const size = (attachment as any).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 sm:p-3.5 transition-all',
        colorClasses.bg.white,
        colorClasses.border.gray200,
        'hover:border-[#F1BB03]/50 hover:shadow-sm',
      )}
    >
      {/* icon */}
      {getFileIcon(filename)}

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn('text-sm font-medium truncate max-w-[180px] sm:max-w-full', colorClasses.text.primary)}
            title={filename}
          >
            {filename}
          </p>
          {extBadge(filename)}
        </div>
        <p className={cn('text-xs mt-0.5', colorClasses.text.muted)}>
          {size ? <span>{formatFileSize(size)}{uploadedAt ? ' · ' : ''}</span> : null}
          {uploadedAt ? <span>{formatDate(uploadedAt)}</span> : null}
        </p>
      </div>

      {/* actions — always visible on mobile, hover on sm+ */}
      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity">
        {allowDownload && (
          <DownloadButton tenderId={tenderId} tenderType={tenderType} attachment={attachment} />
        )}
        {allowDelete && onDelete && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onDelete(attachment._id)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Delete</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const FileAttachmentsList: React.FC<FileAttachmentsListProps> = ({
  tenderId, tenderType, attachments, allowDownload = true, allowDelete = false, onDelete,
}) => {
  if (!attachments.length) return null;
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <AttachmentRow
          key={attachment._id}
          attachment={attachment}
          tenderId={tenderId}
          tenderType={tenderType}
          allowDownload={allowDownload}
          allowDelete={allowDelete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default FileAttachmentsList;