import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CV } from '../../services/applicationService';

interface Props {
  cvs: CV[];
  selectedCvId: string | null;
  onSelect: (cvId: string) => void;
  isLoading?: boolean;
  colors: any;
  typography: any;
}

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const CvSelector: React.FC<Props> = ({
  cvs,
  selectedCvId,
  onSelect,
  isLoading,
  colors,
  typography,
}) => {
  if (isLoading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.textMuted, fontSize: typography.sm, marginTop: 8 }}>
          Loading your CVs…
        </Text>
      </View>
    );
  }

  if (!cvs.length) {
    return (
      <View style={[s.emptyWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
        <Text style={[s.emptyTitle, { color: colors.text, fontSize: typography.base }]}>
          No CVs found
        </Text>
        <Text style={[s.emptyHint, { color: colors.textMuted, fontSize: typography.sm }]}>
          Upload a CV or generate one from your profile to apply.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.list}>
      {cvs.map((cv) => {
        const isSelected = cv._id === selectedCvId;
        const fileName = cv.fileName ?? cv.originalName ?? 'CV';
        const size = cv.fileSize ?? cv.size;

        return (
          <TouchableOpacity
            key={cv._id}
            style={[
              s.row,
              {
                backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(cv._id)}
            activeOpacity={0.75}
          >
            {/* PDF icon */}
            <View style={[s.iconWrap, { backgroundColor: '#EF4444' + '18' }]}>
              <Ionicons name="document-text" size={20} color="#EF4444" />
            </View>

            {/* Meta */}
            <View style={s.meta}>
              <Text style={[s.fileName, { color: colors.text, fontSize: typography.sm }]} numberOfLines={1}>
                {fileName}
              </Text>
              <View style={s.tags}>
                {cv.isPrimary && (
                  <View style={[s.chip, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }}>
                      Primary
                    </Text>
                  </View>
                )}
                {cv.isGenerated && (
                  <View style={[s.chip, { backgroundColor: '#14B8A6' + '18' }]}>
                    <Text style={{ color: '#14B8A6', fontSize: typography.xs, fontWeight: '600' }}>
                      Generated
                    </Text>
                  </View>
                )}
                <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
                  {fmt(cv.uploadedAt)}{size ? ` · ${formatSize(size)}` : ''}
                </Text>
              </View>
            </View>

            {/* Radio */}
            <View
              style={[
                s.radio,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  loadingWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
  },
  emptyTitle: { fontWeight: '700', marginTop: 4 },
  emptyHint:  { textAlign: 'center', maxWidth: 240 },
  list:       { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 2,
    padding: 12,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  meta:     { flex: 1 },
  fileName: { fontWeight: '600', marginBottom: 4 },
  tags:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip:     { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
