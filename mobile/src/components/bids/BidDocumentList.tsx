// src/components/bids/BidDocumentList.tsx
//
// CRITICAL LOCK RULE:
//   isOwner=true AND isBidsRevealed=false
//   → financial_proposal + financial_breakdown → LOCKED STATE (lock icon, no download)
//   isOwner=false (bidder) → always see all own documents regardless of reveal
//
// Groups: Technical | Financial | Compliance | Security | Company | Other
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useDownloadBidDocument } from '../../hooks/useBid';
import { BidDocument, BidDocumentType } from '../../types/bid';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Financial types that are locked for owners before reveal. */
const FINANCIAL_TYPES: Set<BidDocumentType> = new Set([
  BidDocumentType.FinancialProposal,
  BidDocumentType.FinancialBreakdown,
]);

interface GroupConfig {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  types: BidDocumentType[];
}

const GROUPS: GroupConfig[] = [
  {
    key: 'technical',
    label: 'Technical',
    icon: 'document-text-outline',
    types: [BidDocumentType.TechnicalProposal],
  },
  {
    key: 'financial',
    label: 'Financial',
    icon: 'cash-outline',
    types: [BidDocumentType.FinancialProposal, BidDocumentType.FinancialBreakdown],
  },
  {
    key: 'compliance',
    label: 'Compliance',
    icon: 'shield-checkmark-outline',
    types: [
      BidDocumentType.BusinessLicense,
      BidDocumentType.TinCertificate,
      BidDocumentType.VatCertificate,
      BidDocumentType.TaxClearance,
      BidDocumentType.TradeRegistration,
      BidDocumentType.Compliance,
    ],
  },
  {
    key: 'security',
    label: 'Bid Security',
    icon: 'lock-closed-outline',
    types: [BidDocumentType.CpoDocument, BidDocumentType.PerformanceBond],
  },
  {
    key: 'company',
    label: 'Company',
    icon: 'business-outline',
    types: [BidDocumentType.CompanyProfile, BidDocumentType.OpeningPage],
  },
  {
    key: 'other',
    label: 'Other',
    icon: 'attach-outline',
    types: [BidDocumentType.Other],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docTypeLabel(type: BidDocumentType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function isFinancialType(type: BidDocumentType): boolean {
  return FINANCIAL_TYPES.has(type);
}

// ═══════════════════════════════════════════════════════════════════════════
// DOC ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface DocRowProps {
  doc: BidDocument;
  isLocked: boolean;
  tenderId: string;
  bidId: string;
  palette: ReturnType<typeof buildPalette>;
}

const DocRow: React.FC<DocRowProps> = ({ doc, isLocked, tenderId, bidId, palette }) => {
  const { mutate: download, isPending: downloading } = useDownloadBidDocument();

  const handleDownload = useCallback(async () => {
    download(
      { tenderId, bidId, docId: doc._id },
      {
        onSuccess: async (blob: Blob) => {
          try {
            // Convert Blob → base64 for expo-file-system
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64 = (reader.result as string).split(',')[1];
              const ext = doc.mimeType?.split('/')[1] ?? 'pdf';
              const fileUri = `${FileSystem.cacheDirectory}${doc.originalName ?? `document.${ext}`}`;
              await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: doc.mimeType ?? 'application/octet-stream',
                  dialogTitle: doc.originalName,
                });
              } else {
                Alert.alert('Saved', `File saved to ${fileUri}`);
              }
            };
            reader.readAsDataURL(blob);
          } catch {
            Alert.alert('Error', 'Could not save the file.');
          }
        },
      },
    );
  }, [doc, tenderId, bidId, download]);

  return (
    <View style={[docStyles.row, { borderBottomColor: palette.border }]}>
      {/* File-type icon */}
      <View style={[docStyles.iconWrap, { backgroundColor: isLocked ? palette.lockedBg : palette.iconBg }]}>
        <Ionicons
          name={isLocked ? 'lock-closed' : 'document-outline'}
          size={18}
          color={isLocked ? '#92400E' : palette.iconColor}
        />
      </View>

      {/* Info */}
      <View style={docStyles.info}>
        <Text
          style={[docStyles.name, { color: isLocked ? palette.muted : palette.text }]}
          numberOfLines={1}
        >
          {isLocked ? 'Available after bid reveal' : doc.originalName}
        </Text>
        <Text style={[docStyles.meta, { color: palette.muted }]}>
          {isLocked
            ? docTypeLabel(doc.documentType)
            : `${formatBytes(doc.size)} · ${docTypeLabel(doc.documentType)}`}
        </Text>
      </View>

      {/* Download button OR lock pill */}
      {isLocked ? (
        <View style={[docStyles.lockPill, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Ionicons name="lock-closed" size={10} color="#92400E" />
          <Text style={docStyles.lockPillText}>Locked</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleDownload}
          disabled={downloading}
          accessibilityRole="button"
          accessibilityLabel={`Download ${doc.originalName}`}
          style={({ pressed }) => [
            docStyles.downloadBtn,
            { backgroundColor: palette.downloadBg, opacity: pressed || downloading ? 0.6 : 1 },
          ]}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={palette.downloadIcon} />
          ) : (
            <Ionicons name="download-outline" size={16} color={palette.downloadIcon} />
          )}
        </Pressable>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE BUILDER
// ═══════════════════════════════════════════════════════════════════════════

function buildPalette(isDark: boolean) {
  return {
    card:         isDark ? '#1E293B' : '#FFFFFF',
    headerBg:     isDark ? '#1A2540' : '#F1F5F9',
    border:       isDark ? '#334155' : '#E2E8F0',
    text:         isDark ? '#F1F5F9' : '#0F172A',
    muted:        isDark ? '#94A3B8' : '#64748B',
    iconBg:       isDark ? '#0F172A' : '#EFF6FF',
    iconColor:    isDark ? '#60A5FA' : '#2563EB',
    lockedBg:     '#FEF3C7',
    downloadBg:   isDark ? '#334155' : '#F1F5F9',
    downloadIcon: isDark ? '#94A3B8' : '#475569',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  documents: BidDocument[];
  isBidsRevealed: boolean;
  isOwner: boolean;
  tenderId: string;
  bidId: string;
}

export const BidDocumentList: React.FC<Props> = ({
  documents,
  isBidsRevealed,
  isOwner,
  tenderId,
  bidId,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = buildPalette(isDark);

  // Build grouped sections — only include groups that have docs
  const grouped = GROUPS.map((group) => ({
    ...group,
    docs: documents.filter((d) => group.types.includes(d.documentType)),
  })).filter((g) => g.docs.length > 0);

  // Docs with unknown types → put in "Other"
  const knownTypes = new Set(GROUPS.flatMap((g) => g.types));
  const unknownDocs = documents.filter((d) => !knownTypes.has(d.documentType));

  if (documents.length === 0) {
    return (
      <View style={[styles.emptyCard, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <Ionicons name="attach-outline" size={28} color={palette.muted} />
        <Text style={[styles.emptyText, { color: palette.muted }]}>No documents attached</Text>
      </View>
    );
  }

  const renderGroup = (groupKey: string, label: string, icon: keyof typeof Ionicons.glyphMap, docs: BidDocument[]) => (
    <View key={groupKey} style={[styles.group, { borderColor: palette.border, backgroundColor: palette.card }]}>
      {/* Group header */}
      <View style={[styles.groupHeader, { borderBottomColor: palette.border, backgroundColor: palette.headerBg }]}>
        <Ionicons name={icon} size={14} color={palette.muted} />
        <Text style={[styles.groupTitle, { color: palette.text }]}>{label}</Text>
        <View style={[styles.countPill, { backgroundColor: palette.downloadBg }]}>
          <Text style={[styles.countText, { color: palette.muted }]}>{docs.length}</Text>
        </View>
      </View>

      {/* Rows */}
      {docs.map((doc) => {
        // CRITICAL LOCK RULE:
        // Owner sees financial docs locked until bids are revealed.
        // Bidder always sees all their own documents.
        const locked = isOwner && !isBidsRevealed && isFinancialType(doc.documentType);

        return (
          <DocRow
            key={doc._id}
            doc={doc}
            isLocked={locked}
            tenderId={tenderId}
            bidId={bidId}
            palette={palette}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.root}>
      {grouped.map((g) => renderGroup(g.key, g.label, g.icon, g.docs))}

      {/* Unknown types → tack onto Other */}
      {unknownDocs.length > 0 &&
        renderGroup('unknown', 'Other', 'attach-outline', unknownDocs)}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { gap: 12 },

  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  groupTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },

  emptyCard: {
    alignItems: 'center',
    gap: 8,
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13 },
});

const docStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  meta: {
    fontSize: 11,
    lineHeight: 14,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  lockPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default BidDocumentList;
