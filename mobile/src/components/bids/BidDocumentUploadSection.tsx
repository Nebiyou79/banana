// src/components/bids/BidDocumentUploadSection.tsx
// Per-type document picker slots.
// Required types displayed first with red asterisk.
// Each slot: label, pick button, filename+size after pick, remove, upload indicator.
// Uses expo-document-picker.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BidDocumentType } from '../../types/bid';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface DocSlot {
  documentType: BidDocumentType;
  label: string;
  required?: boolean;
  description?: string;
}

export interface FileEntry {
  documentType: BidDocumentType;
  file: {
    uri: string;
    name: string;
    type: string;
  };
  pickedFile: PickedFile;
}

// ── Slot config — required types first ───────────────────────────────────────

export const DEFAULT_SLOTS: DocSlot[] = [
  // Required
  { documentType: BidDocumentType.BusinessLicense,    label: 'Business License',          required: true, description: 'Valid business registration certificate' },
  // Optional but common
  { documentType: BidDocumentType.TechnicalProposal,  label: 'Technical Proposal Doc',    description: 'PDF of your technical proposal' },
  { documentType: BidDocumentType.FinancialProposal,  label: 'Financial Proposal Doc',    description: 'Excel or PDF with pricing details' },
  { documentType: BidDocumentType.FinancialBreakdown, label: 'Financial Breakdown Sheet', description: 'Detailed BOQ or price schedule' },
  { documentType: BidDocumentType.TinCertificate,     label: 'TIN Certificate',           description: 'Tax Identification Number cert' },
  { documentType: BidDocumentType.VatCertificate,     label: 'VAT Certificate',           description: 'VAT registration certificate' },
  { documentType: BidDocumentType.TaxClearance,       label: 'Tax Clearance',             description: 'Tax compliance clearance document' },
  { documentType: BidDocumentType.TradeRegistration,  label: 'Trade Registration',        description: 'Commerce or trade registration' },
  { documentType: BidDocumentType.CompanyProfile,     label: 'Company Profile',           description: 'Company capabilities document' },
  { documentType: BidDocumentType.CpoDocument,        label: 'CPO / Bid Security',        description: 'Bid security bond or CPO document' },
  { documentType: BidDocumentType.PerformanceBond,    label: 'Performance Bond',          description: 'Performance guarantee document' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Single slot component ─────────────────────────────────────────────────────

interface SlotProps {
  slot: DocSlot;
  entry?: FileEntry;
  onPick: (entry: FileEntry) => void;
  onRemove: (type: BidDocumentType) => void;
  palette: ReturnType<typeof buildPalette>;
}

const DocSlotRow: React.FC<SlotProps> = ({ slot, entry, onPick, onRemove, palette }) => {
  const [picking, setPicking] = useState(false);
  const hasPicked = !!entry;

  const handlePick = useCallback(async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      onPick({
        documentType: slot.documentType,
        pickedFile: {
          uri:      asset.uri,
          name:     asset.name,
          size:     asset.size ?? 0,
          mimeType: asset.mimeType ?? 'application/octet-stream',
        },
        file: {
          uri:  asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
        },
      });
    } catch {
      Alert.alert('Error', 'Could not open the document picker.');
    } finally {
      setPicking(false);
    }
  }, [slot.documentType, onPick]);

  return (
    <View style={[slotStyles.root, { borderColor: hasPicked ? palette.successBorder : palette.border }]}>
      {/* Left accent */}
      <View
        style={[
          slotStyles.leftBar,
          { backgroundColor: hasPicked ? palette.successAccent : (slot.required ? palette.required : palette.border) },
        ]}
      />

      <View style={slotStyles.content}>
        {/* Label row */}
        <View style={slotStyles.labelRow}>
          <Text style={[slotStyles.label, { color: palette.text }]}>
            {slot.label}
            {slot.required && <Text style={{ color: palette.required }}> *</Text>}
          </Text>
          {hasPicked && (
            <View style={[slotStyles.donePill, { backgroundColor: palette.successBg }]}>
              <Ionicons name="checkmark-circle" size={12} color={palette.successAccent} />
              <Text style={[slotStyles.doneText, { color: palette.successAccent }]}>Added</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {!!slot.description && (
          <Text style={[slotStyles.description, { color: palette.muted }]}>{slot.description}</Text>
        )}

        {/* Picked file preview */}
        {hasPicked && entry ? (
          <View style={[slotStyles.filePreview, { backgroundColor: palette.fileBg, borderColor: palette.border }]}>
            <Ionicons name="document-attach-outline" size={16} color={palette.successAccent} />
            <View style={slotStyles.fileInfo}>
              <Text style={[slotStyles.fileName, { color: palette.text }]} numberOfLines={1}>
                {entry.pickedFile.name}
              </Text>
              <Text style={[slotStyles.fileSize, { color: palette.muted }]}>
                {formatBytes(entry.pickedFile.size)}
              </Text>
            </View>
            <Pressable
              onPress={() => onRemove(slot.documentType)}
              style={[slotStyles.removeBtn, { backgroundColor: palette.removeBg }]}
              accessibilityLabel={`Remove ${slot.label}`}
            >
              <Ionicons name="close" size={14} color={palette.required} />
            </Pressable>
          </View>
        ) : (
          /* Pick button */
          <Pressable
            onPress={handlePick}
            disabled={picking}
            style={({ pressed }) => [
              slotStyles.pickBtn,
              { backgroundColor: palette.pickBtnBg, borderColor: palette.pickBtnBorder, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Pick file for ${slot.label}`}
          >
            {picking ? (
              <ActivityIndicator size="small" color={palette.muted} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={14} color={palette.pickBtnText} />
                <Text style={[slotStyles.pickBtnText, { color: palette.pickBtnText }]}>
                  Choose File
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ── Palette ───────────────────────────────────────────────────────────────────

function buildPalette(isDark: boolean) {
  return {
    card:          isDark ? '#1E293B' : '#FFFFFF',
    headerBg:      isDark ? '#1A2540' : '#F1F5F9',
    border:        isDark ? '#334155' : '#E2E8F0',
    text:          isDark ? '#F1F5F9' : '#0F172A',
    muted:         isDark ? '#94A3B8' : '#64748B',
    required:      '#EF4444',
    accent:        '#0A2540',
    pickBtnBg:     isDark ? '#0F172A' : '#F1F5F9',
    pickBtnBorder: isDark ? '#475569' : '#CBD5E1',
    pickBtnText:   isDark ? '#94A3B8' : '#475569',
    fileBg:        isDark ? '#0F172A' : '#F8FAFC',
    removeBg:      isDark ? '#450A0A' : '#FEE2E2',
    successBg:     isDark ? '#064E3B' : '#D1FAE5',
    successAccent: '#10B981',
    successBorder: isDark ? '#065F46' : '#A7F3D0',
  };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  slots?: DocSlot[];
  entries: FileEntry[];
  onAdd: (entry: FileEntry) => void;
  onRemove: (type: BidDocumentType) => void;
  errors?: Partial<Record<BidDocumentType, string>>;
}

export const BidDocumentUploadSection: React.FC<Props> = ({
  slots = DEFAULT_SLOTS,
  entries,
  onAdd,
  onRemove,
  errors,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = buildPalette(isDark);

  const getEntry = (type: BidDocumentType) => entries.find((e) => e.documentType === type);

  // Sort: required first, then optional
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });

  const uploadedCount = entries.length;
  const requiredCount = slots.filter((s) => s.required).length;
  const requiredFilled = slots.filter((s) => s.required && getEntry(s.documentType)).length;

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {/* Section header */}
      <View style={[styles.header, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
        <Ionicons name="attach-outline" size={16} color={palette.accent} />
        <Text style={[styles.title, { color: palette.text }]}>Documents</Text>
        <View style={styles.countRow}>
          {requiredCount > 0 && (
            <View style={[
              styles.badge,
              { backgroundColor: requiredFilled >= requiredCount ? '#D1FAE5' : '#FEE2E2' },
            ]}>
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: requiredFilled >= requiredCount ? '#065F46' : '#991B1B',
              }}>
                {requiredFilled}/{requiredCount} required
              </Text>
            </View>
          )}
          {uploadedCount > 0 && (
            <View style={[styles.badge, { backgroundColor: palette.headerBg }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: palette.muted }}>
                {uploadedCount} file{uploadedCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Slots */}
      <View style={styles.body}>
        {sortedSlots.map((slot) => (
          <View key={slot.documentType}>
            <DocSlotRow
              slot={slot}
              entry={getEntry(slot.documentType)}
              onPick={onAdd}
              onRemove={onRemove}
              palette={palette}
            />
            {!!errors?.[slot.documentType] && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={12} color={palette.required} />
                <Text style={[styles.errorText, { color: palette.required }]}>
                  {errors[slot.documentType]}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  countRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    marginTop: 3,
  },
  errorText: { fontSize: 11 },
});

const slotStyles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  doneText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 9,
    padding: 9,
  },
  fileInfo: { flex: 1, gap: 1 },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 10,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    alignSelf: 'flex-start',
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BidDocumentUploadSection;
