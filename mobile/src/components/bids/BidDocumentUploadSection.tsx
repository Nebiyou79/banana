// src/components/bids/BidDocumentUploadSection.tsx
// UPDATED: FileUploadRow pattern from web - image preview, KB/MB size formatting,
// required document badge, remove button, file type icons
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidDocumentType } from '../../types/bid';

// ─── Types ──────────────────────────────────────────────────────────────────

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
  accept?: string[];
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

// ─── Icon & color mapping per document type ──────────────────────────────────

const DOC_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  business_license: { icon: 'business-outline', color: '#3B82F6', bg: '#EFF6FF' },
  technical_proposal: { icon: 'document-text-outline', color: '#0EA5E9', bg: '#F0F9FF' },
  financial_proposal: { icon: 'cash-outline', color: '#F59E0B', bg: '#FFFBEB' },
  financial_breakdown: { icon: 'calculator-outline', color: '#F97316', bg: '#FFF7ED' },
  tin_certificate: { icon: 'card-outline', color: '#8B5CF6', bg: '#F5F3FF' },
  vat_certificate: { icon: 'receipt-outline', color: '#14B8A6', bg: '#F0FDFA' },
  tax_clearance: { icon: 'checkmark-circle-outline', color: '#10B981', bg: '#ECFDF5' },
  trade_registration: { icon: 'create-outline', color: '#F59E0B', bg: '#FFFBEB' },
  company_profile: { icon: 'briefcase-outline', color: '#6366F1', bg: '#EEF2FF' },
  cpo_document: { icon: 'shield-checkmark-outline', color: '#EF4444', bg: '#FEF2F2' },
  performance_bond: { icon: 'lock-closed-outline', color: '#78716C', bg: '#FAFAF9' },
  compliance: { icon: 'shield-checkmark-outline', color: '#10B981', bg: '#ECFDF5' },
  opening_page: { icon: 'document-outline', color: '#6B7280', bg: '#F9FAFB' },
  other: { icon: 'attach-outline', color: '#6B7280', bg: '#F9FAFB' },
};

// ─── Default slots ───────────────────────────────────────────────────────────

export const DEFAULT_SLOTS: DocSlot[] = [
  { documentType: BidDocumentType.BusinessLicense, label: 'Business License', required: true, description: 'Valid business registration certificate' },
  { documentType: BidDocumentType.TechnicalProposal, label: 'Technical Proposal Doc', description: 'PDF of your technical proposal' },
  { documentType: BidDocumentType.FinancialProposal, label: 'Financial Proposal Doc', description: 'Pricing details document' },
  { documentType: BidDocumentType.FinancialBreakdown, label: 'Financial Breakdown Sheet', description: 'Detailed BOQ or price schedule' },
  { documentType: BidDocumentType.TinCertificate, label: 'TIN Certificate', description: 'Tax Identification Number certificate' },
  { documentType: BidDocumentType.VatCertificate, label: 'VAT Certificate', description: 'VAT registration certificate' },
  { documentType: BidDocumentType.TaxClearance, label: 'Tax Clearance', description: 'Tax compliance clearance' },
  { documentType: BidDocumentType.TradeRegistration, label: 'Trade Registration', description: 'Commerce or trade registration' },
  { documentType: BidDocumentType.CompanyProfile, label: 'Company Profile', description: 'Company capabilities document' },
  { documentType: BidDocumentType.CpoDocument, label: 'CPO / Bid Security', description: 'Bid security bond document' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// ─── Single slot component (FileUploadRow pattern) ──────────────────────────

interface SlotProps {
  slot: DocSlot;
  entry?: FileEntry;
  onPick: (entry: FileEntry) => void;
  onRemove: (type: BidDocumentType) => void;
  colors: any;
}

const DocSlotRow: React.FC<SlotProps> = ({ slot, entry, onPick, onRemove, colors }) => {
  const [picking, setPicking] = useState(false);
  const hasPicked = !!entry;
  const config = DOC_CONFIG[slot.documentType] ?? DOC_CONFIG.other;
  const fileExt = entry ? getFileExt(entry.pickedFile.name) : '';
  const isImage = entry ? isImageFile(entry.pickedFile.mimeType) : false;

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
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? 0,
          mimeType: asset.mimeType ?? 'application/octet-stream',
        },
        file: {
          uri: asset.uri,
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
    <View
      style={[
        rowStyles.container,
        {
          borderColor: hasPicked ? colors.success : colors.border,
          backgroundColor: hasPicked ? colors.successBg + '20' : colors.inputBg,
        },
      ]}
    >
      {/* Icon + Info */}
      <View style={rowStyles.iconWrap}>
        {isImage && entry ? (
          <Image
            source={{ uri: entry.pickedFile.uri }}
            style={rowStyles.preview}
            resizeMode="cover"
          />
        ) : (
          <View style={[rowStyles.iconBox, { backgroundColor: config.bg }]}>
            {hasPicked ? (
              <Text style={[rowStyles.fileExt, { color: config.color }]}>{fileExt.slice(0, 4)}</Text>
            ) : (
              <Ionicons name={config.icon} size={20} color={config.color} />
            )}
          </View>
        )}

        <View style={rowStyles.info}>
          <View style={rowStyles.labelRow}>
            <Text style={[rowStyles.label, { color: colors.text }]}>
              {slot.label}
            </Text>
            {slot.required && (
              <View style={[rowStyles.requiredBadge, { backgroundColor: colors.dangerBg }]}>
                <Text style={[rowStyles.requiredText, { color: colors.danger }]}>Required</Text>
              </View>
            )}
            {!slot.required && (
              <View style={[rowStyles.optionalBadge, { backgroundColor: colors.surface }]}>
                <Text style={[rowStyles.optionalText, { color: colors.textMuted }]}>Optional</Text>
              </View>
            )}
          </View>

          {slot.description && !hasPicked && (
            <Text style={[rowStyles.description, { color: colors.textMuted }]} numberOfLines={2}>
              {slot.description}
            </Text>
          )}

          {hasPicked && entry && (
            <View style={rowStyles.fileInfo}>
              <Ionicons name="document-attach-outline" size={14} color={colors.success} />
              <Text style={[rowStyles.fileName, { color: colors.text }]} numberOfLines={1}>
                {entry.pickedFile.name}
              </Text>
              <Text style={[rowStyles.fileSize, { color: colors.textMuted }]}>
                {formatBytes(entry.pickedFile.size)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action button */}
      <View style={rowStyles.action}>
        {hasPicked ? (
          <Pressable
            onPress={() => onRemove(slot.documentType)}
            style={[rowStyles.removeBtn, { backgroundColor: colors.dangerBg }]}
            accessibilityLabel={`Remove ${slot.label}`}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handlePick}
            disabled={picking}
            style={({ pressed }) => [
              rowStyles.pickBtn,
              {
                borderColor: colors.primary,
                opacity: pressed || picking ? 0.7 : 1,
              },
            ]}
            accessibilityLabel={`Upload ${slot.label}`}
          >
            {picking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
                <Text style={[rowStyles.pickText, { color: colors.primary }]}>Choose File</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const { colors, spacing } = useTheme();

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
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Section header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="attach-outline" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Documents</Text>
        <View style={styles.badgesRow}>
          {requiredCount > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    requiredFilled >= requiredCount ? colors.successBg : colors.warningBg,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: requiredFilled >= requiredCount ? colors.success : colors.warning,
                }}
              >
                {requiredFilled}/{requiredCount} required
              </Text>
            </View>
          )}
          {uploadedCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                {uploadedCount} file{uploadedCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Slots */}
      <ScrollView nestedScrollEnabled style={{ maxHeight: 500 }}>
        <View style={styles.body}>
          {sortedSlots.map((slot) => (
            <View key={slot.documentType}>
              <DocSlotRow
                slot={slot}
                entry={getEntry(slot.documentType)}
                onPick={onAdd}
                onRemove={onRemove}
                colors={colors}
              />
              {!!errors?.[slot.documentType] && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={12} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors[slot.documentType]}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  body: {
    padding: 10,
    gap: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    marginTop: 2,
  },
  errorText: { fontSize: 11 },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  iconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  preview: {
    width: 42,
    height: 42,
    borderRadius: 10,
    flexShrink: 0,
  },
  fileExt: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  info: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  requiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  optionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  fileSize: {
    fontSize: 10,
    flexShrink: 0,
  },
  action: {
    flexShrink: 0,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 36,
  },
  pickText: {
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BidDocumentUploadSection;