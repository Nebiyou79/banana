// src/components/bids/BidStatusCard.tsx
// Bidder-facing status card with withdraw action and status info
// Used in bidder detail screens for status overview + actions
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useWithdrawBid } from '../../hooks/useBid';
import { Bid, BidStatus, BidTender } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';

// ── Types ──────────────────────────────────────────────────────────────────

interface BidStatusCardProps {
  bid: Bid;
  tender: BidTender | any;
  tenderId: string;
  onWithdraw?: () => void;
  onUpdate?: () => void;
}

// ── Status style config ────────────────────────────────────────────────────

interface StatusStyle {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  color: string;
}

const STATUS_STYLES: Record<BidStatus, StatusStyle> = {
  [BidStatus.Submitted]: {
    icon: 'paper-plane',
    title: 'Bid Submitted',
    message: 'Your bid has been received and is awaiting review by the tender owner.',
    color: '#F59E0B',
  },
  [BidStatus.UnderReview]: {
    icon: 'search',
    title: 'Under Review',
    message: 'Your bid is currently being reviewed. You cannot withdraw at this stage.',
    color: '#3B82F6',
  },
  [BidStatus.Shortlisted]: {
    icon: 'star',
    title: 'Shortlisted ⭐',
    message: 'Congratulations! You have been shortlisted. Awaiting the final decision.',
    color: '#14B8A6',
  },
  [BidStatus.InterviewScheduled]: {
    icon: 'calendar',
    title: 'Interview Scheduled',
    message: 'An interview has been scheduled. Please check your email for details.',
    color: '#A855F7',
  },
  [BidStatus.Awarded]: {
    icon: 'trophy',
    title: 'Bid Awarded! 🏆',
    message: 'Congratulations! Your bid has been awarded. The tender owner will contact you for contract signing.',
    color: '#F1BB03',
  },
  [BidStatus.Rejected]: {
    icon: 'close-circle',
    title: 'Not Selected',
    message: 'Thank you for participating. Your bid was not selected this time.',
    color: '#9CA3AF',
  },
  [BidStatus.Withdrawn]: {
    icon: 'arrow-undo-circle',
    title: 'Bid Withdrawn',
    message: 'You have withdrawn this bid.',
    color: '#9CA3AF',
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export const BidStatusCard: React.FC<BidStatusCardProps> = ({
  bid,
  tender,
  tenderId,
  onWithdraw,
  onUpdate,
}) => {
  const { colors, radius, spacing } = useTheme();
  const { mutate: withdraw, isPending: withdrawing } = useWithdrawBid();
  const [showConfirm, setShowConfirm] = useState(false);

  const style = STATUS_STYLES[bid.status] ?? STATUS_STYLES[BidStatus.Submitted];
  const isSealed = tender?.workflowType === 'closed';
  const isBeforeDeadline = tender?.deadline
    ? new Date(tender.deadline) > new Date()
    : false;
  const canWithdraw = bid.status === BidStatus.Submitted && isBeforeDeadline;
  const canUpdate = bid.status === BidStatus.Submitted && isBeforeDeadline;
  const amount = formatCurrency(bid.bidAmount, bid.currency);

  const handleWithdraw = () => {
    withdraw(
      { tenderId, bidId: bid._id },
      {
        onSuccess: () => {
          setShowConfirm(false);
          onWithdraw?.();
        },
      }
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: style.color,
          borderRadius: radius.xl,
        },
      ]}
    >
      {/* Awarded banner */}
      {bid.status === BidStatus.Awarded && (
        <View style={[styles.awardBanner, { backgroundColor: style.color }]}>
          <Ionicons name="trophy" size={24} color="#FFFFFF" />
          <Text style={styles.awardTitle}>Your Bid Has Been Awarded!</Text>
          <Text style={styles.awardSubtitle}>{tender?.title ?? 'Tender'}</Text>
        </View>
      )}

      <View style={[styles.body, { padding: spacing.lg, gap: spacing.md }]}>
        {/* Status header */}
        {bid.status !== BidStatus.Awarded && (
          <View style={styles.statusHeader}>
            <Ionicons name={style.icon} size={28} color={style.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {style.title}
              </Text>
              <Text style={[styles.statusMessage, { color: colors.textMuted }]}>
                {bid.status === BidStatus.Withdrawn
                  ? `You withdrew this bid on ${formatDate(bid.updatedAt)}.`
                  : style.message}
              </Text>
            </View>
          </View>
        )}

        {/* Awarded body */}
        {bid.status === BidStatus.Awarded && (
          <View style={[styles.awardBody, { backgroundColor: colors.warningBg, borderRadius: radius.md }]}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text style={[styles.awardBodyText, { color: colors.warning }]}>
              Performance bond may be required. Check your email for next steps.
            </Text>
          </View>
        )}

        {/* Bid amount */}
        {bid.status !== BidStatus.Withdrawn && bid.status !== BidStatus.Rejected && (
          <View
            style={[
              styles.amountRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Bid Amount</Text>
            {isSealed && bid.bidAmount == null ? (
              <View style={styles.sealedRow}>
                <Ionicons name="lock-closed" size={12} color={colors.warning} />
                <Text style={[styles.sealedText, { color: colors.warning }]}>Sealed</Text>
              </View>
            ) : (
              <Text style={[styles.amountValue, { color: colors.primary }]}>{amount}</Text>
            )}
          </View>
        )}

        {/* Owner notes */}
        {bid.ownerNotes && (
          <View
            style={[
              styles.notesRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Note from Owner</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{bid.ownerNotes}</Text>
          </View>
        )}

        {/* Actions */}
        {(canWithdraw || canUpdate) && (
          <View style={styles.actionsRow}>
            {canUpdate && onUpdate && (
              <Pressable
                onPress={onUpdate}
                style={({ pressed }) => [
                  styles.updateBtn,
                  {
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.updateBtnText, { color: colors.primary }]}>Update Bid</Text>
              </Pressable>
            )}
            {canWithdraw && !showConfirm && (
              <Pressable
                onPress={() => setShowConfirm(true)}
                style={({ pressed }) => [
                  styles.withdrawBtn,
                  {
                    backgroundColor: colors.dangerBg,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="arrow-undo-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.withdrawBtnText, { color: colors.danger }]}>Withdraw Bid</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Confirm withdraw */}
        {showConfirm && (
          <View
            style={[
              styles.confirmBox,
              {
                backgroundColor: colors.dangerBg,
                borderColor: colors.danger,
                borderRadius: radius.md,
              },
            ]}
          >
            <Text style={[styles.confirmText, { color: colors.danger }]}>
              Are you sure? This cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={handleWithdraw}
                disabled={withdrawing}
                style={({ pressed }) => [
                  styles.confirmYes,
                  {
                    backgroundColor: colors.danger,
                    borderRadius: radius.sm,
                    opacity: pressed || withdrawing ? 0.7 : 1,
                  },
                ]}
              >
                {withdrawing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmYesText}>Yes, Withdraw</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setShowConfirm(false)}
                style={({ pressed }) => [
                  styles.confirmNo,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.confirmNoText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  awardBanner: {
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  awardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  awardSubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.8,
  },
  body: {
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 13,
    lineHeight: 19,
  },
  awardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  awardBodyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  sealedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sealedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesRow: {
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  updateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderWidth: 2,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  withdrawBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBox: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmYes: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmYesText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmNo: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmNoText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BidStatusCard;