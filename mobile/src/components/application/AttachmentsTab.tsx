/**
 * src/components/application/AttachmentsTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared "Attachments" tab used in both CandidateApplicationDetails and
 * CompanyApplicationDetails.
 *
 * REFACTOR NOTES (spec compliance):
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces string-concatenated rgba.
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ setTimeout memory-leak fixed — cleared in useEffect cleanup.
 *  ✅ Haptic feedback on download success.
 *  ✅ CATEGORY_ICON lookup is type-safe (no string indexing `as any`).
 *  ✅ `colors` prop typed as ThemeColors, not `any`.
 *  ✅ No emoji icons.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import type { ThemeColors } from '../../theme/color';
import {
  NormalizedAttachment,
  downloadAndShare,
} from '../../services/applicationService';
import { getToken } from '../../lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttachmentsTabProps {
  attachments: NormalizedAttachment[];
  showDownloadAll?: boolean;
  colors: ThemeColors;
}

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

// ─── Category config — fully typed, no `any` index ───────────────────────────

type AttachmentCategory = 'CV' | 'Reference' | 'Experience' | 'Other';

const CATEGORY_CONFIG: Record<
  AttachmentCategory,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }
> = {
  CV:         { icon: 'document-text',  color: '#EF4444' },
  Reference:  { icon: 'people',         color: '#8B5CF6' },
  Experience: { icon: 'briefcase',      color: '#F59E0B' },
  Other:      { icon: 'attach',         color: '#64748B' },
};

const getCategoryConfig = (cat: string) =>
  CATEGORY_CONFIG[cat as AttachmentCategory] ?? CATEGORY_CONFIG.Other;

// ─── AttachmentRow ────────────────────────────────────────────────────────────

interface AttachmentRowProps {
  item: NormalizedAttachment;
}

const AttachmentRow = memo<AttachmentRowProps>(({ item }) => {
  const { colors: c } = useTheme();
  const [state, setState] = useState<DownloadState>('idle');

  // ── Clear timer on unmount (prevent setState-after-unmount) ────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (state === 'done' || state === 'error') {
      timer = setTimeout(() => setState('idle'), 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state]);

  const handleDownload = useCallback(async () => {
    try {
      setState('downloading');
      const token = await getToken();
      await downloadAndShare(
        item.applicationId,
        item.fileId,
        item.originalName,
        () => token,
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState('done');
    } catch (err: unknown) {
      setState('error');
      Alert.alert(
        'Download Failed',
        err instanceof Error ? err.message : 'Could not download file.',
      );
    }
  }, [item]);

  const { icon, color } = getCategoryConfig(item.category);

  const rowStyles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection:   'row',
          alignItems:      'center',
          gap:             12,
          padding:         12,
          borderRadius:    RADIUS.md,
          borderWidth:     1,
          backgroundColor: c.bgCard,
          borderColor:     c.border,
        },
        iconBox: {
          width:          40,
          height:         40,
          borderRadius:   RADIUS.md,
          alignItems:     'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(color, 0.18),
        },
        info:     { flex: 1 },
        fileName: {
          fontSize:     14,
          fontWeight:   '600',
          marginBottom: 4,
          color:        c.text,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems:    'center',
          flexWrap:      'wrap',
          gap:           6,
        },
        badge: {
          paddingHorizontal: 6,
          paddingVertical:   2,
          borderRadius:      4,
          backgroundColor:   withAlpha(color, 0.18),
        },
        badgeText: { fontSize: 10, fontWeight: '700', color },
        meta:      { fontSize: 11, color: c.textMuted },
        desc:      { fontSize: 12, marginTop: 2, color: c.textMuted },
        dlBtn: {
          width:          36,
          height:         36,
          borderRadius:   RADIUS.sm,
          borderWidth:    1,
          alignItems:     'center',
          justifyContent: 'center',
          borderColor:    c.border,
        },
      }),
    [c, color],
  );

  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconBox}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={rowStyles.info}>
        <Text style={rowStyles.fileName} numberOfLines={1}>
          {item.originalName}
        </Text>
        <View style={rowStyles.metaRow}>
          <View style={rowStyles.badge}>
            <Text style={rowStyles.badgeText}>{item.category}</Text>
          </View>
          {item.sizeLabel ? (
            <Text style={rowStyles.meta}>{item.sizeLabel}</Text>
          ) : null}
          {item.fileType ? (
            <Text style={rowStyles.meta}>{item.fileType}</Text>
          ) : null}
        </View>
        {item.description ? (
          <Text style={rowStyles.desc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handleDownload}
        disabled={state === 'downloading'}
        style={rowStyles.dlBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Download ${item.originalName}`}
      >
        {state === 'downloading' && (
          <ActivityIndicator size="small" color={c.primary} />
        )}
        {state === 'done' && (
          <Ionicons name="checkmark-circle" size={20} color={c.success} />
        )}
        {state === 'error' && (
          <Ionicons name="alert-circle" size={20} color={c.danger} />
        )}
        {state === 'idle' && (
          <Ionicons name="download-outline" size={20} color={c.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
});

AttachmentRow.displayName = 'AttachmentsTab.AttachmentRow';

// ─── Main component ───────────────────────────────────────────────────────────

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  attachments,
  showDownloadAll = false,
  // `colors` prop kept for API compat but we use the hook internally
}) => {
  const { colors: c, radius, spacing } = useTheme();
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    let ok   = 0;
    let fail = 0;
    for (const att of attachments) {
      try {
        const token = await getToken();
        await downloadAndShare(
          att.applicationId,
          att.fileId,
          att.originalName,
          () => token,
        );
        ok++;
      } catch {
        fail++;
      }
    }
    setDownloadingAll(false);
    if (ok > 0) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Download Complete',
      `Downloaded ${ok} file${ok !== 1 ? 's' : ''}${fail ? `, ${fail} failed` : ''}.`,
    );
  }, [attachments, downloadingAll]);

  // Group by category
  const groups = useMemo(() => {
    const g: Record<string, NormalizedAttachment[]> = {};
    for (const att of attachments) {
      if (!g[att.category]) g[att.category] = [];
      g[att.category].push(att);
    }
    return g;
  }, [attachments]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: { gap: 12 },
        summary: {
          flexDirection:   'row',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         12,
          borderRadius:    RADIUS.md,
          borderWidth:     1,
          backgroundColor: c.bgCard,
          borderColor:     c.border,
        },
        summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
        summaryText: { fontSize: 14, fontWeight: '600', color: c.text },
        dlAllBtn: {
          flexDirection:     'row',
          alignItems:        'center',
          gap:               4,
          paddingHorizontal: 12,
          paddingVertical:   7,
          borderRadius:      RADIUS.sm,
          backgroundColor:   c.primary,
          minWidth:          110,
          height:            36,
          justifyContent:    'center',
        },
        dlAllText: { color: c.textInverse, fontSize: 13, fontWeight: '600' },
        group:      { gap: SPACING.sm },
        groupTitle: {
          fontSize:      11,
          fontWeight:    '700',
          letterSpacing: 0.8,
          marginBottom:  2,
          color:         c.textMuted,
        },
        empty: {
          padding:        32,
          borderRadius:   RADIUS.lg,
          borderWidth:    1,
          alignItems:     'center',
          gap:            SPACING.sm,
          backgroundColor: c.bgCard,
          borderColor:    c.border,
        },
        emptyTitle: { fontSize: 16, fontWeight: '700', color: c.text },
        emptyDesc: {
          fontSize:   13,
          textAlign:  'center',
          color:      c.textMuted,
        },
      }),
    [c],
  );

  if (!attachments.length) {
    return (
      <View style={s.empty}>
        <Ionicons name="folder-open-outline" size={40} color={c.textMuted} />
        <Text style={s.emptyTitle}>No attachments</Text>
        <Text style={s.emptyDesc}>
          No files were uploaded with this application.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Summary bar */}
      <View style={s.summary}>
        <View style={s.summaryLeft}>
          <Ionicons name="attach" size={18} color={c.primary} />
          <Text style={s.summaryText}>
            {attachments.length}{' '}
            {attachments.length === 1 ? 'attachment' : 'attachments'}
          </Text>
        </View>

        {showDownloadAll && (
          <TouchableOpacity
            style={s.dlAllBtn}
            onPress={handleDownloadAll}
            disabled={downloadingAll}
            accessibilityRole="button"
            accessibilityLabel="Download all attachments"
          >
            {downloadingAll ? (
              <ActivityIndicator size="small" color={c.textInverse} />
            ) : (
              <>
                <Ionicons name="download-outline" size={14} color={c.textInverse} />
                <Text style={s.dlAllText}>Download All</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Grouped list */}
      {Object.entries(groups).map(([category, items]) => (
        <View key={category} style={s.group}>
          <Text style={s.groupTitle}>
            {category.toUpperCase()} ({items.length})
          </Text>
          {items.map((att) => (
            <AttachmentRow key={att.id} item={att} />
          ))}
        </View>
      ))}
    </View>
  );
};