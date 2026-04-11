/**
 * src/components/cv/GeneratedCVCard.tsx
 * Row card for a previously generated CV — shows metadata + action buttons.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeneratedCV, getTemplateLabel } from '../../services/cvGeneratorService';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  cv: GeneratedCV;
  isDownloading?: boolean;
  isRegenerating?: boolean;
  onDownload: () => void;
  onRegenerate: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtSize = (bytes?: number): string => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
};

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });

// ─── Component ────────────────────────────────────────────────────────────────

export const GeneratedCVCard: React.FC<Props> = ({
  cv,
  isDownloading = false,
  isRegenerating = false,
  onDownload,
  onRegenerate,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, shadows } = theme;

  const displayName = cv.originalName ?? cv.fileName;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius:    borderRadius.lg,
          borderColor:     colors.border,
          ...shadows.sm,
        },
      ]}
    >
      {/* PDF Icon */}
      <View
        style={[
          styles.iconBox,
          { backgroundColor: '#FEE2E2', borderRadius: borderRadius.md },
        ]}
      >
        <Ionicons name="document-text" size={26} color="#DC2626" />
      </View>

      {/* Metadata */}
      <View style={styles.meta}>
        <Text
          numberOfLines={1}
          style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}
        >
          {displayName}
        </Text>

        <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 1 }}>
          {getTemplateLabel(cv.templateId)}
        </Text>

        <View style={styles.metaRow}>
          <Text style={{ fontSize: typography.xs, color: colors.textMuted }}>
            {fmtDate(cv.generatedAt)}
          </Text>
          {cv.size ? (
            <Text style={{ fontSize: typography.xs, color: colors.textMuted }}>
              {'  ·  '}{fmtSize(cv.size)}
            </Text>
          ) : null}
          {cv.isPrimary && (
            <View
              style={[
                styles.primaryBadge,
                { backgroundColor: colors.successLight, borderRadius: 4 },
              ]}
            >
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.success }}>
                PRIMARY
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Download / Share */}
        <TouchableOpacity
          onPress={onDownload}
          disabled={isDownloading}
          style={[
            styles.iconBtn,
            { backgroundColor: colors.primaryLight, borderRadius: borderRadius.md },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Regenerate */}
        <TouchableOpacity
          onPress={onRegenerate}
          disabled={isRegenerating}
          style={[
            styles.iconBtn,
            { backgroundColor: colors.borderLight, borderRadius: borderRadius.md },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isRegenerating ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        12,
    marginHorizontal: 16,
    marginVertical:   6,
    borderWidth:    1,
    gap:            10,
  },
  iconBox: {
    width:          46,
    height:         54,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  meta: {
    flex: 1,
    gap:  2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           4,
    marginTop:     2,
  },
  primaryBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  actions: {
    gap: 8,
  },
  iconBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
});