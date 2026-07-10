// src/components/bids/BidComplianceChecklist.tsx
// Owner: verifiable checklist. Bidder: read-only submitted/missing status.
// 7 standard Ethiopian procurement compliance documents.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUpdateComplianceChecklist } from '../../hooks/useBid';
import { ComplianceItem, BidDocumentType } from '../../types/bid';

// ─── Standard docs (matching web BidComplianceChecklist.tsx) ────────────────

interface StandardDoc {
  type: BidDocumentType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const STANDARD_DOCS: StandardDoc[] = [
  { type: BidDocumentType.BusinessLicense, label: 'Business License', icon: 'business-outline' },
  { type: BidDocumentType.TinCertificate, label: 'TIN Certificate', icon: 'card-outline' },
  { type: BidDocumentType.VatCertificate, label: 'VAT Certificate', icon: 'document-text-outline' },
  { type: BidDocumentType.TaxClearance, label: 'Tax Clearance Certificate (TCC)', icon: 'checkmark-circle-outline' },
  { type: BidDocumentType.TradeRegistration, label: 'Trade Registration', icon: 'create-outline' },
  { type: BidDocumentType.Compliance, label: 'General Compliance Document', icon: 'shield-checkmark-outline' },
  { type: BidDocumentType.PerformanceBond, label: 'Performance Bond', icon: 'lock-closed-outline' },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  bid: any; // Bid type with complianceChecklist
  tenderId: string;
  isOwner: boolean;
  isEditable?: boolean;
}

export const BidComplianceChecklist: React.FC<Props> = ({
  bid,
  tenderId,
  isOwner,
  isEditable = false,
}) => {
  const { colors, spacing, radius } = useTheme();
  const { mutate: updateChecklist, isPending } = useUpdateComplianceChecklist();

  // Initialize from bid or defaults
  const [items, setItems] = useState<ComplianceItem[]>(() =>
    STANDARD_DOCS.map((doc) => {
      const saved = bid.complianceChecklist?.find((c: ComplianceItem) => c.documentType === doc.type);
      return (
        saved ?? {
          documentType: doc.type,
          submitted: false,
          verifiedByOwner: false,
          notes: '',
        }
      );
    })
  );

  const [isDirty, setIsDirty] = useState(false);
  const canEdit = isOwner && isEditable;

  const submittedCount = items.filter((i) => i.submitted).length;
  const verifiedCount = items.filter((i) => i.verifiedByOwner).length;
  const totalCount = items.length;

  // ── Toggle submitted (owner only) ─────────────────────────────────────────
  const toggleSubmitted = useCallback((index: number) => {
    if (!canEdit) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, submitted: !item.submitted } : item
      )
    );
    setIsDirty(true);
  }, [canEdit]);

  // ── Toggle verified (owner only) ─────────────────────────────────────────
  const toggleVerified = useCallback((index: number) => {
    if (!canEdit) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, verifiedByOwner: !item.verifiedByOwner } : item
      )
    );
    setIsDirty(true);
  }, [canEdit]);

  // ── Update note ──────────────────────────────────────────────────────────
  const updateNote = useCallback((index: number, notes: string) => {
    if (!canEdit) return;
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, notes } : item))
    );
    setIsDirty(true);
  }, [canEdit]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    updateChecklist(
      { tenderId, bidId: bid._id, complianceItems: items },
      {
        onSuccess: () => setIsDirty(false),
        onError: () => Alert.alert('Error', 'Failed to save compliance checklist'),
      }
    );
  }, [tenderId, bid._id, items, updateChecklist]);

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>✅ Compliance Checklist</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {submittedCount}/{totalCount} submitted
            {isOwner && ` · ${verifiedCount} verified`}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Overall status */}
          <View
            style={[
              styles.overallBadge,
              {
                backgroundColor:
                  submittedCount === totalCount ? colors.successBg : colors.warningBg,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: submittedCount === totalCount ? colors.success : colors.warning,
              }}
            >
              {submittedCount === totalCount ? '✓ Complete' : `${totalCount - submittedCount} pending`}
            </Text>
          </View>
          {canEdit && isDirty && (
            <Pressable
              onPress={handleSave}
              disabled={isPending}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.7 : 1 },
              ]}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={[styles.saveText, { color: colors.textInverse }]}>Save</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      <View style={styles.body}>
        {items.map((item, index) => {
          const doc = STANDARD_DOCS.find((d) => d.type === item.documentType);
          const label = doc?.label ?? item.documentType.replace(/_/g, ' ');
          const icon = doc?.icon ?? 'document-outline';

          return (
            <View
              key={item.documentType}
              style={[styles.itemRow, { borderBottomColor: colors.border }]}
            >
              {/* Status icon */}
              {canEdit ? (
                <Pressable
                  onPress={() => toggleSubmitted(index)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: item.submitted ? colors.success : colors.border,
                      backgroundColor: item.submitted ? colors.success : colors.inputBg,
                    },
                  ]}
                >
                  {item.submitted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </Pressable>
              ) : (
                <Ionicons
                  name={item.submitted ? 'checkmark-circle' : (icon as any)}
                  size={20}
                  color={item.submitted ? colors.success : colors.textDisabled}
                />
              )}

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text
                  style={[
                    styles.itemLabel,
                    { color: item.submitted ? colors.text : colors.textMuted },
                  ]}
                >
                  {label}
                </Text>

                {item.verifiedByOwner && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.successBg }]}>
                    <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                    <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                  </View>
                )}

                {!item.submitted && (
                  <Text style={[styles.notSubmitted, { color: colors.textDisabled }]}>
                    Not submitted
                  </Text>
                )}

                {/* Notes */}
                {canEdit ? (
                  <TextInput
                    value={item.notes ?? ''}
                    onChangeText={(text) => updateNote(index, text)}
                    placeholder="Add notes…"
                    placeholderTextColor={colors.inputPlaceholder}
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                      },
                    ]}
                  />
                ) : item.notes ? (
                  <Text style={[styles.notesText, { color: colors.textMuted }]}>{item.notes}</Text>
                ) : null}
              </View>

              {/* Verify button (owner only) */}
              {canEdit && item.submitted && (
                <Pressable
                  onPress={() => toggleVerified(index)}
                  style={[
                    styles.verifyBtn,
                    {
                      backgroundColor: item.verifiedByOwner ? colors.successBg : colors.surface,
                      borderColor: item.verifiedByOwner ? colors.success : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: item.verifiedByOwner ? colors.success : colors.textMuted,
                    }}
                  >
                    {item.verifiedByOwner ? '✓ Verified' : 'Verify'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notSubmitted: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    marginTop: 4,
  },
  notesText: {
    fontSize: 11,
    marginTop: 2,
  },
  verifyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
    flexShrink: 0,
  },
});

export default BidComplianceChecklist;