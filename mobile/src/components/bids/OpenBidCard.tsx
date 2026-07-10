// src/components/bids/OpenBidCard.tsx
// Card for open tenders - shows bidder company (owner view) or tender info (bidder view)
// FIXED: Uses shared downloadAndShareBlob utility
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useDownloadBidDocument } from '../../hooks/useBid';
import { downloadAndShareBlob } from '../../utils/fileDownload';
import { Bid, BidCompany, BidUser } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';

// ── Types ──────────────────────────────────────────────────────────────────

interface OpenBidCardProps {
  bid: Bid;
  tenderId: string;
  isBidsRevealed: boolean;
  viewerRole: 'bidder' | 'owner';
  onClick?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  } catch {
    return iso;
  }
}

function resolveBidderName(bid: Bid): string {
  if (bid.coverSheet?.companyName?.trim()) return bid.coverSheet.companyName.trim();
  if (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany) {
    const name = (bid.bidderCompany as BidCompany).name?.trim();
    if (name) return name;
  }
  if (bid.bidder && typeof bid.bidder === 'object' && 'firstName' in bid.bidder) {
    const u = bid.bidder as BidUser;
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    if (name) return name;
  }
  return 'Bidder';
}

const STATUS_ACCENT: Record<string, string> = {
  submitted: '#F59E0B',
  under_review: '#3B82F6',
  shortlisted: '#14B8A6',
  interview_scheduled: '#A855F7',
  awarded: '#F1BB03',
  rejected: '#9CA3AF',
  withdrawn: '#9CA3AF',
};

// ── Component ───────────────────────────────────────────────────────────────

export const OpenBidCard: React.FC<OpenBidCardProps> = ({
  bid,
  tenderId,
  viewerRole,
  onClick,
}) => {
  const { colors, radius, spacing } = useTheme();
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  const amount = formatCurrency(bid.bidAmount, bid.currency);
  const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;
  const complianceItems = bid.complianceChecklist ?? [];
  const allCompliant = complianceItems.length > 0 && complianceItems.every((c) => c.submitted);

  const quoteDoc = bid.documents?.find((d) => d.documentType === 'opening_page');
  const tenderObj = typeof bid.tender === 'object' && '_id' in bid.tender ? bid.tender : null;
  const tenderTitle = (tenderObj as any)?.title ?? null;
  const tenderRef = (tenderObj as any)?.referenceNumber ?? null;
  const bidderName = resolveBidderName(bid);
  const bidderInitial = bidderName.charAt(0).toUpperCase();
  const accentStrip = STATUS_ACCENT[bid.status] ?? '#9CA3AF';

  // FIXED: Uses shared downloadAndShareBlob utility
  const handleDownload = useCallback(async () => {
    if (!quoteDoc || !tenderId) return;
    downloadDoc(
      { tenderId, bidId: bid._id, docId: quoteDoc._id },
      {
        onSuccess: async (blob: Blob) => {
          await downloadAndShareBlob(
            blob,
            quoteDoc.originalName ?? 'document',
            quoteDoc.mimeType ?? 'application/octet-stream'
          );
        },
      }
    );
  }, [quoteDoc, tenderId, bid._id, downloadDoc]);

  return (
    <Pressable
      onPress={onClick}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.xl,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Accent strip */}
      <View style={[styles.strip, { backgroundColor: accentStrip }]} />

      <View style={[styles.body, { gap: spacing.sm }]}>
        {/* Row 1: Header */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            {viewerRole === 'bidder' ? (
              <>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {tenderTitle ?? 'Tender'}
                </Text>
                {tenderRef && (
                  <Text style={[styles.refNum, { color: colors.textMuted }]}>
                    Ref: {tenderRef}
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.bidderRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {bidderInitial}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bidderName, { color: colors.text }]} numberOfLines={1}>
                    {bidderName}
                  </Text>
                  {bid.bidNumber && (
                    <Text style={[styles.bidNum, { color: colors.textMuted }]}>
                      #{bid.bidNumber}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
          <BidStatusBadge status={bid.status} size="sm" />
        </View>

        {/* Row 2: Amount */}
        <Text style={[styles.amount, { color: colors.primary }]}>
          {amount}
        </Text>

        {/* Row 3: Meta */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatDate(bid.submittedAt || bid.createdAt)}
          </Text>
          <View style={[styles.openBadge, { backgroundColor: colors.successBg }]}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.success }}>
              OPEN
            </Text>
          </View>
        </View>

        {/* Row 4: Owner chips */}
        {viewerRole === 'owner' && (
          <View style={styles.chipsRow}>
            {evalScore != null && (
              <View style={[styles.chip, { backgroundColor: colors.primaryBg }]}>
                <Text style={[styles.chipText, { color: colors.primary }]}>
                  Score: {evalScore.toFixed(1)}
                </Text>
              </View>
            )}
            {complianceItems.length > 0 && (
              <View style={[styles.chip, { backgroundColor: allCompliant ? colors.successBg : colors.warningBg }]}>
                <Text style={[styles.chipText, { color: allCompliant ? colors.success : colors.warning }]}>
                  {allCompliant ? '✓ Compliant' : '⚠ Pending'}
                </Text>
              </View>
            )}
            {bid.cpo && (
              <View style={[styles.chip, { backgroundColor: colors.infoBg }]}>
                <Text style={[styles.chipText, { color: colors.info }]}>🏦 CPO</Text>
              </View>
            )}
          </View>
        )}

        {/* Row 5: Quote document */}
        {quoteDoc ? (
          <Pressable
            onPress={handleDownload}
            disabled={downloading || !tenderId}
            style={({ pressed }) => [
              styles.downloadBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed || downloading ? 0.7 : 1,
              },
            ]}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            )}
            <Text style={[styles.downloadText, { color: colors.text }]} numberOfLines={1}>
              {downloading ? 'Downloading…' : quoteDoc.originalName ?? 'Download RFQ'}
            </Text>
            <Ionicons name="download-outline" size={13} color={colors.primary} />
          </Pressable>
        ) : null}

        {/* Row 6: View Details */}
        {onClick && (
          <View style={styles.viewRow}>
            <View style={[styles.viewPill, { backgroundColor: colors.primary }]}>
              <Text style={[styles.viewPillText, { color: colors.textInverse }]}>
                View Details
              </Text>
              <Ionicons name="arrow-forward" size={12} color={colors.textInverse} />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  strip: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: 13,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  refNum: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginTop: 2,
  },
  bidderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bidderName: {
    fontSize: 13,
    fontWeight: '700',
  },
  bidNum: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  openBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  downloadText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  viewPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OpenBidCard;