import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { GeneratedCV } from '../../services/cvGeneratorService';
import { getTemplateLabel } from '../../services/cvGeneratorService';

interface Props {
  cv: GeneratedCV;
  isDownloading?: boolean;
  isRegenerating?: boolean;
  onDownload: () => void;
  onRegenerate: () => void;
}

const fmtSize = (bytes?: number): string => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
};

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const GeneratedCVCard: React.FC<Props> = ({
  cv, isDownloading = false, isRegenerating = false, onDownload, onRegenerate,
}) => {
  const { colors: c, radius, spacing, type, shadows } = useTheme();

  const styles = useMemo(() => makeStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);

  const displayName = cv.originalName ?? cv.fileName;

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name="document-text" size={26} color={c.danger} />
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={1} style={[type.bodySm, { fontWeight: '700', color: c.text }]}>
          {displayName}
        </Text>
        <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>
          {getTemplateLabel(cv.templateId)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[type.caption, { color: c.textMuted }]}>{fmtDate(cv.generatedAt)}</Text>
          {cv.size ? (
            <Text style={[type.caption, { color: c.textMuted }]}>  ·  {fmtSize(cv.size)}</Text>
          ) : null}
          {cv.isPrimary && (
            <View style={[styles.primaryBadge, { backgroundColor: withAlpha(c.success, 0.15) }]}>
              <Text style={[type.caption, { fontSize: 9, fontWeight: '800', color: c.success }]}>
                PRIMARY
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onDownload}
          disabled={isDownloading}
          style={[styles.iconBtn, { backgroundColor: withAlpha(c.primary, 0.12) }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Download CV"
          accessibilityRole="button"
        >
          {isDownloading
            ? <ActivityIndicator size="small" color={c.primary} />
            : <Ionicons name="download-outline" size={18} color={c.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRegenerate}
          disabled={isRegenerating}
          style={[styles.iconBtn, { backgroundColor: withAlpha(c.textMuted, 0.10) }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Regenerate CV"
          accessibilityRole="button"
        >
          {isRegenerating
            ? <ActivityIndicator size="small" color={c.textMuted} />
            : <Ionicons name="refresh-outline" size={18} color={c.textMuted} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      marginHorizontal: spacing.lg,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      backgroundColor: c.bgCard,
      gap: spacing.sm,
      ...shadows.sm,
    },
    iconBox: {
      width: 46,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: withAlpha('#EF4444', 0.10),
      flexShrink: 0,
    },
    meta: { flex: 1, gap: 2 },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 2,
    },
    primaryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    actions: { gap: spacing.sm },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
    },
  });