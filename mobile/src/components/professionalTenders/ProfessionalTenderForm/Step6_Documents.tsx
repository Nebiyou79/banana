// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step6_Documents.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Step 6: Documents.
//
//  Files live OUTSIDE react-hook-form (RHF doesn't serialize File / DocumentAsset
//  objects well). Parent shell holds the staged files in useState and passes
//  them in via props. This step component is purely presentational + picker.
//
//  Why this design: The service layer's buildProfessionalTenderFormData()
//  takes `files` as a separate argument from the form values. Keeping the
//  same separation in the form mirrors that contract.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  AlertTriangle,
  FileText,
  Trash2,
  Upload,
} from 'lucide-react-native';

import { useThemeStore } from '../../../store/themeStore';
import { SectionHeader } from './FormFields';

// ═════════════════════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Shape of a staged file. Matches what the service layer expects when
 * passed through buildProfessionalTenderFormData(data, files).
 *
 *   { uri, name, type } — standard React Native FormData file shape
 */
export interface StagedFile {
  uri: string;
  name: string;
  type: string;       // mime type — required for FormData on RN
  size?: number;
}

export interface Step6_DocumentsProps {
  files: StagedFile[];
  onChange: (files: StagedFile[]) => void;
  /** Hard cap on attachments. Backend allows 20. */
  max?: number;
  /** Per-file size cap (in bytes). 25 MB by default. */
  maxFileSize?: number;
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

const inferMimeType = (asset: DocumentPicker.DocumentPickerAsset): string => {
  if (asset.mimeType) return asset.mimeType;
  const ext = asset.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':  return 'application/pdf';
    case 'doc':  return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':  return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'png':  return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'zip':  return 'application/zip';
    default:     return 'application/octet-stream';
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Step6_Documents: React.FC<Step6_DocumentsProps> = ({
  files,
  onChange,
  max = 20,
  maxFileSize = 25 * 1024 * 1024,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? {
        surface:    '#0F172A',
        border:     '#334155',
        borderHot:  '#60A5FA',
        text:       '#F1F5F9',
        textMute:   '#94A3B8',
        textSubtle: '#64748B',
        primary:    '#60A5FA',
        primaryFg:  '#0F172A',
        rowBg:      '#1E293B',
        danger:     '#F87171',
        warningBg:  'rgba(245,158,11,0.12)',
        warningBd:  'rgba(245,158,11,0.40)',
        warningFg:  '#FCD34D',
      }
    : {
        surface:    '#FFFFFF',
        border:     '#E2E8F0',
        borderHot:  '#3B82F6',
        text:       '#0F172A',
        textMute:   '#475569',
        textSubtle: '#94A3B8',
        primary:    '#2563EB',
        primaryFg:  '#FFFFFF',
        rowBg:      '#F8FAFC',
        danger:     '#DC2626',
        warningBg:  '#FFFBEB',
        warningBd:  '#FDE68A',
        warningFg:  '#B45309',
      };

  const remaining = max - files.length;

  const pick = useCallback(async () => {
    if (files.length >= max) {
      Alert.alert('Limit reached', `You can attach up to ${max} files.`);
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const accepted: StagedFile[] = [];
      const rejected: string[] = [];
      const remainingNow = max - files.length;

      for (const asset of result.assets.slice(0, remainingNow)) {
        if (asset.size !== undefined && asset.size > maxFileSize) {
          rejected.push(`${asset.name} (${formatBytes(asset.size)} exceeds ${formatBytes(maxFileSize)})`);
          continue;
        }
        // Skip exact duplicates (same URI)
        if (files.some((f) => f.uri === asset.uri) ||
            accepted.some((f) => f.uri === asset.uri)) {
          continue;
        }
        accepted.push({
          uri: asset.uri,
          name: asset.name,
          type: inferMimeType(asset),
          size: asset.size,
        });
      }

      if (accepted.length) onChange([...files, ...accepted]);
      if (rejected.length) {
        Alert.alert('Some files were skipped', rejected.join('\n'));
      }
    } catch (err: any) {
      Alert.alert('Couldn\'t open file picker', err?.message ?? 'Unknown error');
    }
  }, [files, max, maxFileSize, onChange]);

  const removeAt = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <View style={styles.root}>
      <SectionHeader
        title="Supporting Documents"
        description={`Upload up to ${max} files (${formatBytes(maxFileSize)} max each).`}
      />

      {/* Drop zone (Pressable) */}
      <Pressable
        onPress={pick}
        disabled={remaining <= 0}
        style={({ pressed }: { pressed: boolean }) => [
          styles.dropZone,
          {
            backgroundColor: palette.surface,
            borderColor: pressed ? palette.borderHot : palette.border,
            opacity: remaining <= 0 ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Choose files to upload"
      >
        <Upload size={22} color={palette.primary} strokeWidth={2.2} />
        <Text style={[styles.dropTitle, { color: palette.text }]}>
          {remaining > 0 ? 'Tap to add documents' : 'Limit reached'}
        </Text>
        <Text style={[styles.dropDesc, { color: palette.textMute }]}>
          {remaining > 0
            ? `${remaining} more allowed · PDF, DOCX, XLSX, PNG, JPG, ZIP`
            : `Remove a file to add another`}
        </Text>
      </Pressable>

      {/* File list */}
      {files.length > 0 && (
        <View style={styles.list}>
          {files.map((f, idx) => (
            <View
              key={`${f.uri}-${idx}`}
              style={[styles.row, { backgroundColor: palette.rowBg, borderColor: palette.border }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <FileText size={16} color={palette.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowName, { color: palette.text }]} numberOfLines={1}>
                  {f.name}
                </Text>
                <Text style={[styles.rowMeta, { color: palette.textSubtle }]} numberOfLines={1}>
                  {f.type} · {formatBytes(f.size)}
                </Text>
              </View>
              <Pressable
                onPress={() => removeAt(idx)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${f.name}`}
                style={styles.rowAction}
              >
                <Trash2 size={16} color={palette.danger} strokeWidth={2.2} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Empty state hint */}
      {files.length === 0 && (
        <View
          style={[
            styles.hintBanner,
            { backgroundColor: palette.warningBg, borderColor: palette.warningBd },
          ]}
        >
          <AlertTriangle size={14} color={palette.warningFg} strokeWidth={2.4} />
          <Text style={[styles.hintText, { color: palette.warningFg }]}>
            Documents are optional, but most procurement workflows expect a tender
            document, terms, and any specifications.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 14 },
  dropZone: {
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 6,
  },
  dropTitle: { fontSize: 14, fontWeight: '700' },
  dropDesc:  { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, borderWidth: 1,
  },
  rowText: { flex: 1, gap: 2, minWidth: 0 },
  rowName: { fontSize: 13, fontWeight: '600' },
  rowMeta: { fontSize: 11 },
  rowAction: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },

  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  hintText: { flex: 1, fontSize: 12, lineHeight: 17 },
});

export default Step6_Documents;
