// src/components/proposals/shared/ProposalAttachmentList.tsx
// FIX: Download button now routes through the authenticated API endpoint
// instead of using att.downloadUrl directly (which causes 401 "No token provided").
// The backend route GET /api/v1/proposals/:proposalId/attachments/:attachmentId/download
// requires a Bearer token. We call proposalService.getDownloadUrl() client-side
// and open via a hidden anchor with the token injected, OR use the api instance
// to stream the blob.

import React, { useState } from 'react';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Download, Trash2, FileText, ImageIcon, Archive, File, Loader2 } from 'lucide-react';
import type { ProposalAttachment } from '@/services/proposalService';
import api from '@/lib/axios';

interface Props {
  attachments: ProposalAttachment[];
  proposalId: string;          // ← REQUIRED for authenticated download
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getExt(att: ProposalAttachment): string {
  const name = att.originalName ?? att.fileName;
  return name.split('.').pop()?.toLowerCase() ?? 'file';
}

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ExtGroup = 'pdf' | 'doc' | 'image' | 'archive' | 'other';

function getGroup(ext: string): ExtGroup {
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'xlsx', 'csv'].includes(ext)) return 'doc';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'archive';
  return 'other';
}

const GROUP_STYLE: Record<ExtGroup, { bg: string; text: string; icon: React.ReactNode }> = {
  pdf: { bg: colorClasses.bg.redLight, text: colorClasses.text.red, icon: <FileText className="w-3.5 h-3.5" /> },
  doc: { bg: colorClasses.bg.blueLight, text: colorClasses.text.blue600, icon: <FileText className="w-3.5 h-3.5" /> },
  image: { bg: colorClasses.bg.purpleLight, text: colorClasses.text.purple, icon: <ImageIcon className="w-3.5 h-3.5" /> },
  archive: { bg: colorClasses.bg.grayLight, text: colorClasses.text.muted, icon: <Archive className="w-3.5 h-3.5" /> },
  other: { bg: colorClasses.bg.secondary, text: colorClasses.text.muted, icon: <File className="w-3.5 h-3.5" /> },
};

// ─── Authenticated download ──────────────────────────────────────────────────
// The backend route requires Authorization: Bearer <token>.
// We use the axios api instance (which has the interceptor) to fetch as a blob
// then trigger a browser download.

async function downloadAttachmentAuth(
  proposalId: string,
  attachmentId: string,
  filename: string,
): Promise<void> {
  const response = await api.get(
    `/proposals/${proposalId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' },
  );

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] ?? 'application/octet-stream',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProposalAttachmentList({ attachments, proposalId, canDelete = false, onDelete }: Props) {
  const { isTouch, getTouchTargetSize } = useResponsive();
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  if (!attachments?.length) return null;

  const handleDownload = async (att: ProposalAttachment) => {
    if (downloading[att._id]) return;
    setDownloading((prev) => ({ ...prev, [att._id]: true }));
    try {
      await downloadAttachmentAuth(proposalId, att._id, att.originalName ?? att.fileName);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading((prev) => ({ ...prev, [att._id]: false }));
    }
  };

  return (
    <ul className="space-y-2">
      {attachments.map((att) => {
        const ext = getExt(att);
        const group = getGroup(ext);
        const style = GROUP_STYLE[group];
        const displayName = att.originalName ?? att.fileName;
        const isDownloading = downloading[att._id];

        return (
          <li
            key={att._id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${colorClasses.bg.primary} ${colorClasses.border.secondary} hover:border-[#F1BB03]/50`}
          >
            {/* Extension badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ${style.bg} ${style.text}`}>
              {style.icon}
              {ext}
            </span>

            {/* Filename + size */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${colorClasses.text.primary}`}>
                {displayName}
              </p>
              {att.size !== undefined && (
                <p className={`text-xs ${colorClasses.text.muted}`}>
                  {att.attachmentType} · {formatBytes(att.size)}
                </p>
              )}
            </div>

            {/* Authenticated download button */}
            <button
              type="button"
              onClick={() => handleDownload(att)}
              disabled={isDownloading}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${getTouchTargetSize('sm')} ${colorClasses.text.muted} hover:text-[#F1BB03] hover:${colorClasses.bg.secondary} disabled:opacity-50`}
              aria-label={`Download ${displayName}`}
            >
              {isDownloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
            </button>

            {/* Delete */}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(att._id)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${getTouchTargetSize('sm')} ${colorClasses.text.muted} hover:${colorClasses.text.error}`}
                aria-label={`Delete ${displayName}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default ProposalAttachmentList;