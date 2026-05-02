// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step4_DatesDocuments.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Step 4 (post-refactor) — merges the old Step 5 (Dates) and Step 6 (Documents)
//  into a single step.
//
//  Order: Submission Deadline → Bid Opening → Clarification Deadline
//       → Pre-bid Meeting (toggle + sub-fields, ROOT level — P-14)
//       → Documents (file picker, files held in parent shell state)
// ─────────────────────────────────────────────────────────────────────────────

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

import { useThemeStore } from '../../../store/themeStore';
import {
  LabeledField,
  SectionHeader,
  TextField,
  ToggleField,
} from './FormFields';
import type { ProfessionalTenderFormValues } from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
//  STAGED FILE TYPE — re-exported for the form shell
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
  /** Hard cap on attachments. Backend allows 20. */
  maxFiles?: number;
  /** Per-file size cap (bytes). 25 MB by default. */
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
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

// ═════════════════════════════════════════════════════════════════════════════
//  DATE PICKER FIELD
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
  const isDark = useThemeStore((s) => s.theme.isDark);
  const [open, setOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const palette = isDark
    ? { bg: '#0F172A', border: '#334155', borderError: '#F87171', text: '#F1F5F9', placeholder: '#64748B' }
    : { bg: '#F8FAFC', border: '#E2E8F0', borderError: '#DC2626', text: '#0F172A', placeholder: '#94A3B8' };

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
      const final = mode === 'datetime' && tempDate
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
            backgroundColor: palette.bg,
            borderColor: error ? palette.borderError : palette.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Pick date${mode === 'datetime' ? ' and time' : ''}`}
      >
        <Calendar size={16} color={palette.placeholder} strokeWidth={2.2} />
        <Text
          style={{ flex: 1, color: display ? palette.text : palette.placeholder, fontSize: 14 }}
        >
          {display || placeholder || 'Select date…'}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={tempDate ?? new Date()}
          mode={Platform.OS === 'ios' ? (mode === 'datetime' ? 'datetime' : 'date') : pickerMode}
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
  const isDark = useThemeStore((s) => s.theme.isDark);
  const { control, formState: { errors } } = useFormContext<ProfessionalTenderFormValues>();
  const pbmEnabled = useWatch({ control, name: 'preBidMeeting.enabled' });
  const deadlineISO = useWatch({ control, name: 'deadline' });
  const deadlineDate = deadlineISO ? new Date(deadlineISO) : undefined;

  const palette = isDark
    ? {
        surface: '#0F172A',
        border:  '#334155',
        text:    '#F1F5F9',
        muted:   '#94A3B8',
        subtle:  '#64748B',
        primary: '#60A5FA',
        rowBg:   '#1E293B',
        danger:  '#F87171',
        warningBg: 'rgba(245,158,11,0.12)',
        warningBd: 'rgba(245,158,11,0.40)',
        warningFg: '#FCD34D',
      }
    : {
        surface: '#FFFFFF',
        border:  '#E2E8F0',
        text:    '#0F172A',
        muted:   '#64748B',
        subtle:  '#94A3B8',
        primary: '#2563EB',
        rowBg:   '#F8FAFC',
        danger:  '#DC2626',
        warningBg: '#FFFBEB',
        warningBd: '#FDE68A',
        warningFg: '#B45309',
      };

  // ─── File picker logic ───────────────────────────────────────────────────
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
          rejected.push(`${asset.name} (${formatBytes(asset.size)} exceeds ${formatBytes(maxFileSize)})`);
          continue;
        }
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

      if (accepted.length) onFilesChange([...files, ...accepted]);
      if (rejected.length) Alert.alert('Some files were skipped', rejected.join('\n'));
    } catch (err: any) {
      Alert.alert("Couldn't open file picker", err?.message ?? 'Unknown error');
    }
  }, [files, maxFiles, maxFileSize, onFilesChange]);

  const removeFileAt = (idx: number) => onFilesChange(files.filter((_, i) => i !== idx));

  // ═══════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      {/* ─── Dates ──────────────────────────────────────────────────────── */}
      <SectionHeader
        title="Key Dates"
        description="The deadline drives the entire tender lifecycle."
      />

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

      {/* ─── Pre-Bid Meeting (P-14: ROOT level) ─────────────────────────── */}
      <SectionHeader
        title="Pre-Bid Meeting"
        description="Optional kick-off meeting for prospective bidders."
      />

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
        <View style={styles.pbmGroup}>
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

          <View style={styles.pbmFootnote}>
            <Clock size={12} color={palette.muted} strokeWidth={2.4} />
            <Text style={[styles.pbmFootnoteText, { color: palette.muted }]}>
              Pre-bid meeting must be scheduled before the submission deadline.
            </Text>
          </View>
        </View>
      )}

      {/* ─── Documents ──────────────────────────────────────────────────── */}
      <SectionHeader
        title="Supporting Documents"
        description={`Attach up to ${maxFiles} files (${formatBytes(maxFileSize)} max each).`}
      />

      <Pressable
        onPress={pickFiles}
        disabled={remaining <= 0}
        style={({ pressed }: { pressed: boolean }) => [
          styles.dropZone,
          {
            backgroundColor: palette.surface,
            borderColor: pressed ? palette.primary : palette.border,
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
        <Text style={[styles.dropDesc, { color: palette.muted }]}>
          {remaining > 0
            ? `${remaining} more allowed · PDF, DOCX, XLSX, PNG, JPG, ZIP`
            : `Remove a file to add another`}
        </Text>
      </Pressable>

      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((f, idx) => (
            <View
              key={`${f.uri}-${idx}`}
              style={[styles.fileRow, { backgroundColor: palette.rowBg, borderColor: palette.border }]}
            >
              <View style={[styles.fileIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <FileText size={16} color={palette.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.fileText}>
                <Text style={[styles.fileName, { color: palette.text }]} numberOfLines={1}>
                  {f.name}
                </Text>
                <Text style={[styles.fileMeta, { color: palette.subtle }]} numberOfLines={1}>
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
                <Trash2 size={16} color={palette.danger} strokeWidth={2.2} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {files.length === 0 && (
        <View
          style={[
            styles.docHintBanner,
            { backgroundColor: palette.warningBg, borderColor: palette.warningBd },
          ]}
        >
          <AlertTriangle size={14} color={palette.warningFg} strokeWidth={2.4} />
          <Text style={[styles.docHintText, { color: palette.warningFg }]}>
            Documents are optional, but most procurement workflows expect a
            tender document, terms, and any specifications.
          </Text>
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { gap: 18 },

  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
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

  fileList: { gap: 8 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  fileIcon: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, borderWidth: 1,
  },
  fileText:  { flex: 1, gap: 2, minWidth: 0 },
  fileName:  { fontSize: 13, fontWeight: '600' },
  fileMeta:  { fontSize: 11 },
  fileAction:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  docHintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  docHintText: { flex: 1, fontSize: 12, lineHeight: 17 },
});

export default Step4_DatesDocuments;