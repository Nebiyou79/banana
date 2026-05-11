// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/TenderAttachmentList.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Tender attachment list with download support.
//
//  Mode:
//    'owner'   — shows Upload More button + remove icon per row
//    'browser' — read+download only
//
//  Download is delegated to the parent via onDownload(attachment) — the
//  caller decides whether to use a Linking.openURL, expo-file-system, or
//  trigger a server-signed URL flow.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import { SectionCard } from './_shared';
import type { TenderAttachment } from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface TenderAttachmentListProps {
  attachments: TenderAttachment[];
  mode: 'owner' | 'browser';
  /** Called when user taps download. Caller wires platform-specific behavior. */
  onDownload?: (attachment: TenderAttachment) => void;
  /** Owner-only: open file picker to upload more attachments. */
  onUploadMore?: () => void;
  /** Owner-only: remove an attachment by id. */
  onRemove?: (attachment: TenderAttachment) => void;
  /** Disable interaction while a network call is in flight. */
  busy?: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const formatBytes = (n?: number): string => {
  if (n === undefined || n === null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const iconForMime = (mime?: string, name?: string): string => {
  const ext = (name?.split('.').pop() ?? '').toLowerCase();
  const m = (mime ?? '').toLowerCase();
  if (m.includes('pdf') || ext === 'pdf') return 'document-text-outline';
  if (m.includes('word') || ['doc', 'docx'].includes(ext)) return 'reader-outline';
  if (m.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'grid-outline';
  if (m.startsWith('image') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image-outline';
  if (m.includes('zip') || ext === 'zip' || ext === 'rar') return 'archive-outline';
  return 'document-attach-outline';
};

const DOC_TYPE_LABELS: Record<string, string> = {
  rfp:            'RFP',
  rfq:            'RFQ',
  specifications: 'Specs',
  drawings:       'Drawings',
  terms:          'Terms',
  addendum:       'Addendum',
  other:          'File',
};

// ═════════════════════════════════════════════════════════════════════════════
//  ROW
// ═════════════════════════════════════════════════════════════════════════════

const AttachmentRow: React.FC<{
  attachment: TenderAttachment;
  mode: 'owner' | 'browser';
  busy?: boolean;
  onDownload?: () => void;
  onRemove?: () => void;
}> = ({ attachment, mode, busy, onDownload, onRemove }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#0F172A', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', subtle: '#64748B', primary: '#60A5FA', danger: '#F87171', tagBg: '#1E3A5F', tagFg: '#93C5FD' }
    : { bg: '#F8FAFC', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8', primary: '#2563EB', danger: '#DC2626', tagBg: '#DBEAFE', tagFg: '#1D4ED8' };

  const fileName = attachment.originalName || attachment.filename;
  const iconName = iconForMime(attachment.mimeType, fileName);

  return (
    <View style={[styles.row, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.tagBg }]}>
        <Ionicons name={iconName as any} size={18} color={palette.tagFg} />
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.fileName, { color: palette.text }]} numberOfLines={1}>
          {fileName}
        </Text>
        <View style={styles.metaRow}>
          {!!attachment.documentType && (
            <View style={[styles.docTypeTag, { backgroundColor: palette.tagBg }]}>
              <Text style={[styles.docTypeTagText, { color: palette.tagFg }]}>
                {DOC_TYPE_LABELS[attachment.documentType] ?? attachment.documentType}
              </Text>
            </View>
          )}
          <Text style={[styles.metaText, { color: palette.subtle }]} numberOfLines={1}>
            {[
              formatBytes(attachment.size),
              attachment.uploadedAt
                ? `· ${new Date(attachment.uploadedAt).toLocaleDateString()}`
                : null,
            ].filter(Boolean).join(' ')}
          </Text>
        </View>
      </View>

      <View style={styles.actionsCol}>
        <Pressable
          onPress={onDownload}
          disabled={busy || !onDownload}
          hitSlop={6}
          style={({ pressed }: { pressed: boolean }) => [
            styles.actionBtn,
            { opacity: busy || !onDownload ? 0.4 : pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Download ${fileName}`}
        >
          <Ionicons name="download-outline" size={20} color={palette.primary} />
        </Pressable>
        {mode === 'owner' && onRemove && (
          <Pressable
            onPress={onRemove}
            disabled={busy}
            hitSlop={6}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionBtn,
              { opacity: busy ? 0.4 : pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${fileName}`}
          >
            <Ionicons name="trash-outline" size={18} color={palette.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const TenderAttachmentList: React.FC<TenderAttachmentListProps> = ({
  attachments,
  mode,
  onDownload,
  onUploadMore,
  onRemove,
  busy,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { muted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', emptyBg: '#1E293B', emptyBorder: '#334155' }
    : { muted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', emptyBg: '#FFFFFF', emptyBorder: '#E2E8F0' };

  const isEmpty = attachments.length === 0;

  return (
    <SectionCard
      icon="folder-open-outline"
      title={`Attachments (${attachments.length})`}
    >
      {isEmpty ? (
        <View
          style={[
            styles.empty,
            { borderColor: palette.emptyBorder, backgroundColor: palette.emptyBg },
          ]}
        >
          <Ionicons name="folder-outline" size={28} color={palette.muted} />
          <Text style={[styles.emptyText, { color: palette.muted }]}>
            No documents attached
          </Text>
          {mode === 'browser' && (
            <Text style={[styles.emptyHint, { color: palette.muted }]}>
              The owner hasn't uploaded supporting documents yet.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {attachments.map((a) => (
            <AttachmentRow
              key={a._id}
              attachment={a}
              mode={mode}
              busy={busy}
              onDownload={onDownload ? () => onDownload(a) : undefined}
              onRemove={onRemove ? () => onRemove(a) : undefined}
            />
          ))}
        </View>
      )}

      {/* Owner: upload more button */}
      {mode === 'owner' && onUploadMore && (
        <Pressable
          onPress={onUploadMore}
          disabled={busy}
          style={({ pressed }: { pressed: boolean }) => [
            styles.uploadBtn,
            {
              borderColor: palette.primary,
              opacity: busy ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Upload more documents"
        >
          <Ionicons name="cloud-upload-outline" size={16} color={palette.primary} />
          <Text style={[styles.uploadBtnText, { color: palette.primary }]}>
            Upload more documents
          </Text>
        </Pressable>
      )}
    </SectionCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  list: { gap: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 38, height: 38,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 4, minWidth: 0 },
  fileName: { fontSize: 13, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  docTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docTypeTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  metaText: { fontSize: 11 },

  actionsCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontWeight: '600' },
  emptyHint: { fontSize: 11, textAlign: 'center', maxWidth: 240, lineHeight: 15 },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 10,
    minHeight: 44,
  },
  uploadBtnText: { fontSize: 13, fontWeight: '700' },
});

export default TenderAttachmentList;