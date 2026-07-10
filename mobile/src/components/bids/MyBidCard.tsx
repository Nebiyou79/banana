// src/components/bids/MyBidCard.tsx
// Standalone card for BIDDER viewing their OWN bids.
// Shows: tender title, status badge, amount (hidden if sealed), 
//        countdown timer for sealed bids, RFQ download button.
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
import { Bid, BidCompany } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';

// ── Types ──────────────────────────────────────────────────────────────────

interface MyBidCardProps {
  bid: Bid;
  tenderId?: string;
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

// ── Status accent colors ────────────────────────────────────────────────────

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

export const MyBidCard: React.FC<MyBidCardProps> = ({ bid, tenderId, onClick }) => {
  const { colors, radius, spacing } = useTheme();
  const { mutate: downloadDoc, isPending: downloading } = useDownloadBidDocument();

  // Derive tender info
  const tenderObj = typeof bid.tender === 'object' && '_id' in bid.tender ? bid.tender : null;
  const tenderTitle = (tenderObj as any)?.title ?? 'Tender';
  const tenderRef = (tenderObj as any)?.referenceNumber ?? null;
  const workflowType = (tenderObj as any)?.workflowType ?? 'open';
  const tenderDeadline = (tenderObj as any)?.deadline ?? null;
  const tenderStatus = (tenderObj as any)?.status ?? '';
  const isSealed = workflowType === 'closed';
  const isBidsRevealed = ['revealed', 'closed', 'awarded'].includes(tenderStatus);

  // Countdown for sealed bids
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    tenderDeadline ? calcTimeLeft(tenderDeadline) : { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  );

  useEffect(() => {
    if (!isSealed || isBidsRevealed || !tenderDeadline) return;
    const t = setInterval(() => setTimeLeft(calcTimeLeft(tenderDeadline)), 1000);
    return () => clearInterval(t);
  }, [isSealed, isBidsRevealed, tenderDeadline]);

  const countdownText = [
    timeLeft.days > 0 && `${timeLeft.days}d`,
    `${String(timeLeft.hours).padStart(2, '0')}h`,
    `${String(timeLeft.minutes).padStart(2, '0')}m`,
    `${String(timeLeft.seconds).padStart(2, '0')}s`,
  ].filter(Boolean).join(' ');

  // Company name
  const companyName =
    bid.coverSheet?.companyName?.trim() ||
    (bid.bidderCompany && typeof bid.bidderCompany === 'object' && 'name' in bid.bidderCompany
      ? (bid.bidderCompany as BidCompany).name
      : null);

  const amount = formatCurrency(bid.bidAmount, bid.currency);
  const showAmount = !isSealed || isBidsRevealed;
  const accentStrip = STATUS_ACCENT[bid.status] ?? '#9CA3AF';

  // RFQ document
  const rfqDoc = bid.documents?.find((d) => d.documentType === 'opening_page');
  const canDownload = !!rfqDoc && !!tenderId && (!isSealed || isBidsRevealed);

  // FIXED: Uses shared downloadAndShareBlob utility
  const handleDownload = useCallback(async () => {
    if (!rfqDoc || !tenderId) return;
    downloadDoc(
      { tenderId, bidId: bid._id, docId: rfqDoc._id },
      {
        onSuccess: async (blob: Blob) => {
          await downloadAndShareBlob(
            blob,
            rfqDoc.originalName ?? 'document',
            rfqDoc.mimeType ?? 'application/octet-stream'
          );
        },
      }
    );
  }, [rfqDoc, tenderId, bid._id, downloadDoc]);

  return (
    <Pressable
      onPress={onClick}
      accessibilityRole="button"
      accessibilityLabel={`Bid on ${tenderTitle}`}
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
        {/* Row 1: Workflow + Status */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.workflowBadge,
              {
                backgroundColor: isSealed ? colors.infoBg : colors.successBg,
              },
            ]}
          >
            <Ionicons
              name={isSealed ? 'lock-closed' : 'lock-open'}
              size={9}
              color={isSealed ? colors.info : colors.success}
            />
            <Text style={{ fontSize: 10, fontWeight: '700', color: isSealed ? colors.info : colors.success }}>
              {isSealed ? 'Sealed' : 'Open'}
            </Text>
          </View>
          <BidStatusBadge status={bid.status} size="sm" />
        </View>

        {/* Row 2: Tender title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {tenderTitle}
        </Text>
        {tenderRef && (
          <Text style={[styles.refNum, { color: colors.textMuted }]}>
            Ref: {tenderRef}
          </Text>
        )}
        {companyName && (
          <Text style={[styles.company, { color: colors.textMuted }]}>
            🏢 {companyName}
          </Text>
        )}

        {/* Row 3: Amount */}
        {showAmount ? (
          <Text style={[styles.amount, { color: colors.primary }]}>
            {amount}
          </Text>
        ) : (
          <View style={[styles.sealedAmount, { backgroundColor: colors.warningBg }]}>
            <Ionicons name="lock-closed" size={14} color={colors.warning} />
            <Text style={[styles.sealedAmountText, { color: colors.warning }]}>
              Amount Sealed
            </Text>
          </View>
        )}

        {/* Row 4: Meta */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatDate(bid.submittedAt || bid.createdAt)}
          </Text>
          {bid.bidNumber && (
            <Text style={[styles.bidNum, { color: colors.textMuted }]}>
              #{bid.bidNumber}
            </Text>
          )}
        </View>

        {/* Row 5: Sealed countdown */}
        {isSealed && (
          isBidsRevealed ? (
            <View style={[styles.revealedBadge, { backgroundColor: colors.successBg }]}>
              <Ionicons name="lock-open" size={11} color={colors.success} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>
                Bids Revealed
              </Text>
            </View>
          ) : !timeLeft.isPast ? (
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
          )
        )}

        {/* Row 6: RFQ Download */}
        {rfqDoc && (
          canDownload ? (
            <Pressable
              onPress={handleDownload}
              disabled={downloading}
              style={({ pressed }) => [
                styles.downloadBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed || downloading ? 0.7 : 1,
                  borderRadius: radius.md,
                },
              ]}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              )}
              <Text style={[styles.downloadText, { color: colors.text }]} numberOfLines={1}>
                {downloading ? 'Downloading…' : rfqDoc.originalName ?? 'Download RFQ'}
              </Text>
              <Ionicons name="download-outline" size={14} color={colors.primary} />
            </Pressable>
          ) : isSealed && !isBidsRevealed ? (
            <View style={[styles.sealedDoc, { backgroundColor: colors.surface }]}>
              <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
              <Text style={[styles.sealedDocText, { color: colors.textMuted }]}>
                Document sealed until reveal
              </Text>
            </View>
          ) : null
        )}

        {/* Row 7: View Details */}
        {onClick && (
          <View style={styles.viewRow}>
            <View style={[styles.viewPill, { backgroundColor: colors.primary }]}>
              <Text style={[styles.viewPillText, { color: colors.textInverse }]}>
                View My Bid
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  workflowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  refNum: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  company: {
    fontSize: 11,
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
  },
  sealedAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sealedAmountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  bidNum: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginLeft: 4,
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
  revealedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
  },
  downloadText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  sealedDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sealedDocText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  viewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  viewPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default MyBidCard;