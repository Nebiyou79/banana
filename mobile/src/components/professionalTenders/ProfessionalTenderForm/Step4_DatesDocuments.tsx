// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step4_DatesDocuments.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FULLY REFACTORED: Premium Mint-themed with useTheme(), PremiumCard wrappers,
//  themed DatePickerField, consistent file styling.

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Trash2,
  Upload,
} from 'lucide-react-native';

import { useTheme } from '../../../hooks/useTheme';
import {
  LabeledField,
  PremiumCard,
  SectionHeader,
  TextField,
  ToggleField,
} from './FormFields';
import type { ProfessionalTenderFormValues } from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
//  STAGED FILE TYPE
// ═════════════════════════════════════════════════════════════════════════════

export interface StagedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface Step4_DatesDocumentsProps {
  files: StagedFile[];
  onFilesChange: (files: StagedFile[]) => void;
  maxFiles?: number;
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

const formatLocal = (iso?: string, mode: 'date' | 'datetime' = 'datetime'): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  if (mode === 'date') {
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ═════════════════════════════════════════════════════════════════════════════
//  DATE PICKER FIELD — themed
// ═════════════════════════════════════════════════════════════════════════════

interface DatePickerFieldProps {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  mode?: 'date' | 'datetime';
  minimumDate?: Date;
  error?: boolean;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  placeholder,
  mode = 'datetime',
  minimumDate,
  error,
}) => {
  const { colors, spacing, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const display = formatLocal(value, mode);

  const openPicker = () => {
    setPickerMode('date');
    setTempDate(value ? new Date(value) : new Date());
    setOpen(true);
  };

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (!selected) return;
      if (mode === 'datetime' && pickerMode === 'date') {
        setTempDate(selected);
        setPickerMode('time');
        setOpen(true);
        return;
      }
      const final =
        mode === 'datetime' && tempDate
          ? new Date(
              tempDate.getFullYear(),
              tempDate.getMonth(),
              tempDate.getDate(),
              selected.getHours(),
              selected.getMinutes(),
            )
          : selected;
      onChange(final.toISOString());
      return;
    }
    if (selected) {
      setTempDate(selected);
      onChange(selected.toISOString());
    }
  };

  return (
    <View>
      <Pressable
        onPress={openPicker}
        style={[
          styles.dateField,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.danger : colors.inputBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Pick date${mode === 'datetime' ? ' and time' : ''}`}
      >
        <Calendar size={16} color={colors.inputPlaceholder} strokeWidth={2.2} />
        <Text
          style={{
            flex: 1,
            color: display ? colors.text : colors.inputPlaceholder,
            fontSize: 14,
          }}
        >
          {display || placeholder || 'Select date…'}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={tempDate ?? new Date()}
          mode={
            Platform.OS === 'ios'
              ? mode === 'datetime'
                ? 'datetime'
                : 'date'
              : pickerMode
          }
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STEP COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Step4_DatesDocuments: React.FC<Step4_DatesDocumentsProps> = ({
  files,
  onFilesChange,
  maxFiles = 20,
  maxFileSize = 25 * 1024 * 1024,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { control, formState: { errors } } =
    useFormContext<ProfessionalTenderFormValues>();
  const pbmEnabled = useWatch({ control, name: 'preBidMeeting.enabled' });
  const deadlineISO = useWatch({ control, name: 'deadline' });
  const deadlineDate = deadlineISO ? new Date(deadlineISO) : undefined;

  const remaining = maxFiles - files.length;

  const pickFiles = useCallback(async () => {
    if (files.length >= maxFiles) {
      Alert.alert('Limit reached', `You can attach up to ${maxFiles} files.`);
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
      const remainingNow = maxFiles - files.length;

      for (const asset of result.assets.slice(0, remainingNow)) {
        if (asset.size !== undefined && asset.size > maxFileSize) {
          rejected.push(
            `${asset.name} (${formatBytes(asset.size)} exceeds ${formatBytes(maxFileSize)})`,
          );
          continue;
        }
        if (
          files.some((f) => f.uri === asset.uri) ||
          accepted.some((f) => f.uri === asset.uri)
        ) {
          continue;
        }
        accepted.push({
          uri: asset.uri,
          name: asset.name,
          type: inferMimeType(asset),
          size: asset.size,
        });
      }

      if (accepted.length) onFilesChange([...files, ...accepted]);
      if (rejected.length)
        Alert.alert('Some files were skipped', rejected.join('\n'));
    } catch (err: any) {
      Alert.alert("Couldn't open file picker", err?.message ?? 'Unknown error');
    }
  }, [files, maxFiles, maxFileSize, onFilesChange]);

  const removeFileAt = (idx: number) =>
    onFilesChange(files.filter((_, i) => i !== idx));

  return (
    <View style={[styles.root, { gap: spacing.lg }]}>
      
      {/* ─── Key Dates ───────────────────────────────────────────────── */}
      <SectionHeader
        title="Key Dates"
        description="The deadline drives the entire tender lifecycle."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <LabeledField
              label="Submission Deadline"
              required
              error={errors.deadline?.message}
              helper="Bidders must submit before this moment."
            >
              <DatePickerField
                value={field.value}
                onChange={field.onChange}
                placeholder="Select submission deadline"
                mode="datetime"
                minimumDate={new Date()}
                error={!!errors.deadline}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="bidOpeningDate"
          render={({ field }) => (
            <LabeledField
              label="Bid Opening Date"
              error={errors.bidOpeningDate?.message}
              helper="When bids are publicly opened (open workflow). Defaults to deadline."
            >
              <DatePickerField
                value={field.value}
                onChange={field.onChange}
                placeholder="Defaults to deadline"
                mode="datetime"
                minimumDate={deadlineDate}
                error={!!errors.bidOpeningDate}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="clarificationDeadline"
          render={({ field }) => (
            <LabeledField
              label="Clarification Deadline"
              error={errors.clarificationDeadline?.message}
              helper="Last date for bidders to submit questions."
            >
              <DatePickerField
                value={field.value}
                onChange={field.onChange}
                placeholder="Optional"
                mode="datetime"
                error={!!errors.clarificationDeadline}
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── Pre-Bid Meeting ──────────────────────────────────────────── */}
      <SectionHeader
        title="Pre-Bid Meeting"
        description="Optional kick-off meeting for prospective bidders."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="preBidMeeting.enabled"
          render={({ field }) => (
            <ToggleField
              value={!!field.value}
              onChange={field.onChange}
              label="Hold a pre-bid meeting"
              description="Toggle on to add date, location, and online link."
            />
          )}
        />

        {pbmEnabled && (
          <View style={[styles.pbmGroup, { marginTop: spacing.lg }]}>
            <Controller
              control={control}
              name="preBidMeeting.date"
              render={({ field }) => (
                <LabeledField
                  label="Meeting Date & Time"
                  error={errors.preBidMeeting?.date?.message}
                >
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select meeting date"
                    mode="datetime"
                    minimumDate={new Date()}
                    error={!!errors.preBidMeeting?.date}
                  />
                </LabeledField>
              )}
            />

            <Controller
              control={control}
              name="preBidMeeting.location"
              render={({ field }) => (
                <LabeledField
                  label="Location"
                  error={errors.preBidMeeting?.location?.message}
                  helper="Physical address, conference room, or 'Virtual'."
                >
                  <TextField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="e.g., Banana HQ, Boardroom 3"
                  />
                </LabeledField>
              )}
            />

            <Controller
              control={control}
              name="preBidMeeting.onlineLink"
              render={({ field }) => (
                <LabeledField
                  label="Online Link"
                  error={errors.preBidMeeting?.onlineLink?.message}
                  helper="Optional — Zoom / Meet / Teams link."
                >
                  <TextField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="https://…"
                    keyboardType="url"
                    autoCapitalize="none"
                    error={!!errors.preBidMeeting?.onlineLink}
                  />
                </LabeledField>
              )}
            />

            <Controller
              control={control}
              name="preBidMeeting.mandatory"
              render={({ field }) => (
                <ToggleField
                  value={!!field.value}
                  onChange={field.onChange}
                  label="Attendance Mandatory"
                  description="Bidders who skip a mandatory meeting may be disqualified."
                />
              )}
            />

            {/* Footnote */}
            <View style={styles.pbmFootnote}>
              <Clock size={12} color={colors.textMuted} strokeWidth={2.4} />
              <Text style={[styles.pbmFootnoteText, { color: colors.textMuted }]}>
                Pre-bid meeting must be scheduled before the submission deadline.
              </Text>
            </View>
          </View>
        )}
      </PremiumCard>

      {/* ─── Supporting Documents ─────────────────────────────────────── */}
      <SectionHeader
        title="Supporting Documents"
        description={`Attach up to ${maxFiles} files (${formatBytes(maxFileSize)} max each).`}
      />

      <PremiumCard>
        {/* Drop Zone */}
        <Pressable
          onPress={pickFiles}
          disabled={remaining <= 0}
          style={({ pressed }) => [
            styles.dropZone,
            {
              backgroundColor: colors.surface,
              borderColor: pressed ? colors.primary : colors.inputBorder,
              borderRadius: radius.lg,
              paddingVertical: spacing.xl,
              paddingHorizontal: spacing.lg,
              opacity: remaining <= 0 ? 0.5 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Choose files to upload"
        >
          <Upload size={22} color={colors.primary} strokeWidth={2.2} />
          <Text style={[styles.dropTitle, { color: colors.text }]}>
            {remaining > 0 ? 'Tap to add documents' : 'Limit reached'}
          </Text>
          <Text style={[styles.dropDesc, { color: colors.textMuted }]}>
            {remaining > 0
              ? `${remaining} more allowed · PDF, DOCX, XLSX, PNG, JPG, ZIP`
              : 'Remove a file to add another'}
          </Text>
        </Pressable>

        {/* File List */}
        {files.length > 0 && (
          <View style={[styles.fileList, { marginTop: spacing.md }]}>
            {files.map((f, idx) => (
              <View
                key={`${f.uri}-${idx}`}
                style={[
                  styles.fileRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.fileIcon,
                    {
                      backgroundColor: `${colors.primary}12`,
                      borderColor: `${colors.primary}25`,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <FileText size={16} color={colors.primary} strokeWidth={2.2} />
                </View>
                <View style={styles.fileText}>
                  <Text
                    style={[styles.fileName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {f.name}
                  </Text>
                  <Text
                    style={[styles.fileMeta, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {f.type} · {formatBytes(f.size)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFileAt(idx)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${f.name}`}
                  style={styles.fileAction}
                >
                  <Trash2 size={16} color={colors.danger} strokeWidth={2.2} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Empty State Warning */}
        {files.length === 0 && (
          <View
            style={[
              styles.docHintBanner,
              {
                backgroundColor: `${colors.warning}12`,
                borderColor: `${colors.warning}30`,
                borderRadius: radius.md,
                padding: spacing.md,
                marginTop: spacing.md,
              },
            ]}
          >
            <AlertTriangle size={14} color={colors.warning} strokeWidth={2.4} />
            <Text style={[styles.docHintText, { color: colors.textSecondary }]}>
              Documents are optional, but most procurement workflows expect a
              tender document, terms, and any specifications.
            </Text>
          </View>
        )}
      </PremiumCard>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {},

  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    minHeight: 44,
  },

  pbmGroup: { gap: 14 },
  pbmFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pbmFootnoteText: { fontSize: 11, fontStyle: 'italic' },

  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 6,
  },
  dropTitle: { fontSize: 14, fontWeight: '700' },
  dropDesc: { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  fileList: { gap: 8 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  fileIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fileText: { flex: 1, gap: 2, minWidth: 0 },
  fileName: { fontSize: 13, fontWeight: '600' },
  fileMeta: { fontSize: 11 },
  fileAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  docHintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
  },
  docHintText: { flex: 1, fontSize: 12, lineHeight: 17 },
});

export default Step4_DatesDocuments;