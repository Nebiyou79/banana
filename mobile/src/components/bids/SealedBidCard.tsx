// src/components/bids/SealedBidCard.tsx
// Dual-state card: SEALED (countdown, amount hidden) vs REVEALED (amount visible)
// FIXED: Uses shared downloadAndShareBlob utility
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from 'react';
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

interface SealedBidCardProps {
  bid: Bid;
  tenderId: string;
  isBidsRevealed: boolean;
  deadline: string;
  viewerRole: 'bidder' | 'owner';
  onClick?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
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

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: false,
  };
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

// ── Component ───────────────────────────────────────────────────────────────

export const SealedBidCard: React.FC<SealedBidCardProps> = ({
  bid,
  tenderId,
  isBidsRevealed,
  deadline,
  viewerRole,
  onClick,
}) => {
  const { colors, radius, spacing } = useTheme();
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(deadline));

  useEffect(() => {
    if (isBidsRevealed) return;
    const t = setInterval(() => setTimeLeft(calcTimeLeft(deadline)), 1000);
    return () => clearInterval(t);
  }, [deadline, isBidsRevealed]);

  const quoteDoc = bid.documents?.find((d) => d.documentType === 'opening_page');
  const bidderName = resolveBidderName(bid);
  const bidderInitial = bidderName.charAt(0).toUpperCase();
  const tenderObj = typeof bid.tender === 'object' && '_id' in bid.tender ? bid.tender : null;
  const tenderTitle = (tenderObj as any)?.title ?? null;
  const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;
  const complianceItems = bid.complianceChecklist ?? [];
  const allCompliant = complianceItems.length > 0 && complianceItems.every((c) => c.submitted);

  const countdownText = [
    timeLeft.days > 0 && `${timeLeft.days}d`,
    `${String(timeLeft.hours).padStart(2, '0')}h`,
    `${String(timeLeft.minutes).padStart(2, '0')}m`,
    `${String(timeLeft.seconds).padStart(2, '0')}s`,
  ].filter(Boolean).join(' ');

  const ownerCanClick = viewerRole === 'owner' && timeLeft.isPast && !!onClick;
  const bidderCanClick = viewerRole === 'bidder' && !!onClick;
  const isClickable = ownerCanClick || bidderCanClick;

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

  // ── REVEALED STATE ──────────────────────────────────────────────────────────
  if (isBidsRevealed) {
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
        <View style={[styles.strip, { backgroundColor: '#14B8A6' }]} />

        <View style={[styles.body, { gap: spacing.sm }]}>
          {/* Row 1: Header */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              {viewerRole === 'bidder' ? (
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {tenderTitle ?? 'Tender'}
                </Text>
              ) : (
                <View style={styles.bidderRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {bidderInitial}
                    </Text>
                  </View>
                  <Text style={[styles.bidderName, { color: colors.text }]} numberOfLines={1}>
                    {bidderName}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <BidStatusBadge status={bid.status} size="sm" />
              <View style={[styles.revealedBadge, { backgroundColor: colors.successBg }]}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.success }}>
                  🔓 Revealed
                </Text>
              </View>
            </View>
          </View>

          {/* Row 2: Amount */}
          <Text style={[styles.amount, { color: colors.primary }]}>
            {formatCurrency(bid.bidAmount, bid.currency)}
          </Text>

          {/* Row 3: Meta */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatDate(bid.submittedAt || bid.createdAt)}
            </Text>
          </View>

          {/* Owner chips */}
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
            </View>
          )}

          {/* Quote document */}
          {quoteDoc && (
            <Pressable
              onPress={handleDownload}
              disabled={downloading}
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
          )}

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
  }

  // ── SEALED STATE ────────────────────────────────────────────────────────────
  return (
    <Pressable
      onPress={isClickable ? onClick : undefined}
      accessibilityRole={isClickable ? 'button' : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.xl,
          opacity: pressed && isClickable ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.strip, { backgroundColor: '#8B5CF6' }]} />

      <View style={[styles.body, { gap: spacing.sm }]}>
        {/* Row 1: Header */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            {viewerRole === 'bidder' ? (
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {tenderTitle ?? 'Tender'}
              </Text>
            ) : (
              <View style={styles.bidderRow}>
                <View style={[styles.avatar, { backgroundColor: colors.infoBg }]}>
                  <Text style={[styles.avatarText, { color: colors.info }]}>
                    {bidderInitial}
                  </Text>
                </View>
                <Text style={[styles.bidderName, { color: colors.text }]} numberOfLines={1}>
                  {bidderName}
                </Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <BidStatusBadge status={bid.status} size="sm" />
            <View style={[styles.sealedBadge, { backgroundColor: colors.infoBg }]}>
              <Ionicons name="lock-closed" size={8} color={colors.info} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.info }}>
                Sealed
              </Text>
            </View>
          </View>
        </View>

        {/* Row 2: Amount sealed */}
        <View style={[styles.sealedAmount, { backgroundColor: colors.surface }]}>
          <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
          <View>
            <Text style={[styles.sealedAmountTitle, { color: colors.text }]}>
              Bid Amount: Sealed
            </Text>
            <Text style={[styles.sealedAmountSub, { color: colors.textMuted }]}>
              Visible after bids are revealed
            </Text>
          </View>
        </View>

        {/* Row 3: Meta */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatDate(bid.submittedAt || bid.createdAt)}
          </Text>
        </View>

        {/* Row 4: Countdown */}
        {!timeLeft.isPast ? (
          <View style={[styles.countdown, { backgroundColor: colors.warningBg }]}>
            <Ionicons name="hourglass-outline" size={13} color={colors.warning} />
            <Text style={[styles.countdownText, { color: colors.warning }]}>
              Reveal in: {countdownText}
            </Text>
          </View>
        ) : (
          <View style={[styles.countdown, { backgroundColor: colors.warningBg }]}>
            <Text style={[styles.countdownText, { color: colors.warning }]}>
              ⏰ Awaiting reveal
            </Text>
          </View>
        )}

        {/* Row 5: Quote locked */}
        <View style={[styles.sealedDoc, { backgroundColor: colors.infoBg }]}>
          <Ionicons name="lock-closed" size={14} color={colors.info} />
          <Text style={[styles.sealedDocText, { color: colors.info }]}>
            {quoteDoc ? 'Quote Document Sealed' : 'No Quote Document'}
          </Text>
        </View>

        {isClickable && (
          <View style={styles.viewRow}>
            <View style={[styles.viewPill, { backgroundColor: colors.primary }]}>
              <Text style={[styles.viewPillText, { color: colors.textInverse }]}>
                {viewerRole === 'bidder' ? 'View My Bid' : 'View Details'}
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
    flex: 1,
  },
  sealedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  revealedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
  },
  sealedAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sealedAmountTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  sealedAmountSub: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
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
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 12,
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
  sealedDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sealedDocText: {
    fontSize: 12,
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

export default SealedBidCard;