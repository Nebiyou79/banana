/**
 * src/components/application/AttachmentsTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared "Attachments" tab used in both CandidateApplicationDetails and
 * CompanyApplicationDetails. Shows all files with download via the NEW
 * expo-file-system API (File/Directory) + expo-sharing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { NormalizedAttachment, downloadAndShare } from '../../services/applicationService';
import { useAuthStore } from '../../store/authStore';
import { getToken } from '../../lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentsTabProps {
  attachments: NormalizedAttachment[];
  /** Optional: show a "Download All" button */
  showDownloadAll?: boolean;
  colors: any; // theme.colors
}

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

const CATEGORY_ICON: Record<string, string> = {
  CV:         'document-text',
  Reference:  'people',
  Experience: 'briefcase',
  Other:      'attach',
};

const CATEGORY_COLOR: Record<string, string> = {
  CV:         '#EF4444',
  Reference:  '#8B5CF6',
  Experience: '#F59E0B',
  Other:      '#64748B',
};

// ─── Single attachment row ────────────────────────────────────────────────────

interface AttachmentRowProps {
  item: NormalizedAttachment;
  colors: any;
}

const AttachmentRow: React.FC<AttachmentRowProps> = ({ item, colors: c }) => {
  const [state, setState] = useState<DownloadState>('idle');

  const handleDownload = useCallback(async () => {
    try {
      setState('downloading');
      const token = await getToken();
      await downloadAndShare(item.applicationId, item.fileId, item.originalName, () => token);
      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err: any) {
      setState('error');
      Alert.alert('Download Failed', err?.message ?? 'Could not download file.');
      setTimeout(() => setState('idle'), 3000);
    }
  }, [item]);

  const catColor  = CATEGORY_COLOR[item.category] ?? '#64748B';
  const catIcon   = CATEGORY_ICON[item.category]  ?? 'attach';
  const isLoading = state === 'downloading';

  return (
    <View style={[s.row, { backgroundColor: c.surface, borderColor: c.border }]}>
      {/* File icon */}
      <View style={[s.iconBox, { backgroundColor: `${catColor}18` }]}>
        <Ionicons name={catIcon as any} size={22} color={catColor} />
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={[s.fileName, { color: c.text }]} numberOfLines={1}>
          {item.originalName}
        </Text>
        <View style={s.metaRow}>
          <View style={[s.badge, { backgroundColor: `${catColor}18` }]}>
            <Text style={[s.badgeText, { color: catColor }]}>{item.category}</Text>
          </View>
          {item.sizeLabel ? (
            <Text style={[s.meta, { color: c.textMuted }]}>{item.sizeLabel}</Text>
          ) : null}
          {item.fileType ? (
            <Text style={[s.meta, { color: c.textMuted }]}>{item.fileType}</Text>
          ) : null}
        </View>
        {item.description ? (
          <Text style={[s.desc, { color: c.textMuted }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Download button */}
      <TouchableOpacity
        onPress={handleDownload}
        disabled={isLoading}
        style={[s.dlBtn, { borderColor: c.border }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : state === 'done' ? (
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        ) : state === 'error' ? (
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
        ) : (
          <Ionicons name="download-outline" size={20} color={c.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  attachments,
  showDownloadAll = false,
  colors: c,
}) => {
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    let ok = 0;
    let fail = 0;
    for (const att of attachments) {
      try {
        const token = await getToken();
        await downloadAndShare(att.applicationId, att.fileId, att.originalName, () => token);
        ok++;
      } catch {
        fail++;
      }
    }
    setDownloadingAll(false);
    Alert.alert(
      'Download Complete',
      `Downloaded ${ok} file(s)${fail ? `, ${fail} failed` : ''}.`
    );
  }, [attachments, downloadingAll]);

  if (!attachments.length) {
    return (
      <View style={[s.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="folder-open-outline" size={40} color={c.textMuted} />
        <Text style={[s.emptyTitle, { color: c.text }]}>No attachments</Text>
        <Text style={[s.emptyDesc, { color: c.textMuted }]}>
          No files were uploaded with this application.
        </Text>
      </View>
    );
  }

  // Group by category
  const groups: Record<string, NormalizedAttachment[]> = {};
  for (const att of attachments) {
    if (!groups[att.category]) groups[att.category] = [];
    groups[att.category].push(att);
  }

  return (
    <View style={s.container}>
      {/* Summary bar */}
      <View style={[s.summary, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={s.summaryLeft}>
          <Ionicons name="attach" size={18} color={c.primary} />
          <Text style={[s.summaryText, { color: c.text }]}>
            {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {showDownloadAll && (
          <TouchableOpacity
            style={[s.dlAllBtn, { backgroundColor: c.primary }]}
            onPress={handleDownloadAll}
            disabled={downloadingAll}
          >
            {downloadingAll ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={14} color="#fff" />
                <Text style={s.dlAllText}>Download All</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Grouped list */}
      {Object.entries(groups).map(([category, items]) => (
        <View key={category} style={s.group}>
          <Text style={[s.groupTitle, { color: c.textMuted }]}>
            {category.toUpperCase()} ({items.length})
          </Text>
          {items.map((att) => (
            <AttachmentRow key={att.id} item={att} colors={c} />
          ))}
        </View>
      ))}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:    { gap: 12 },
  summary:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  summaryLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText:  { fontSize: 14, fontWeight: '600' },
  dlAllBtn:     {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  dlAllText:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  group:        { gap: 8 },
  groupTitle:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  row:          {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  iconBox:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info:         { flex: 1 },
  fileName:     { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  badge:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText:    { fontSize: 10, fontWeight: '700' },
  meta:         { fontSize: 11 },
  desc:         { fontSize: 12, marginTop: 2 },
  dlBtn:        { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        {
    padding: 32, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  emptyTitle:   { fontSize: 16, fontWeight: '700' },
  emptyDesc:    { fontSize: 13, textAlign: 'center' },
});
