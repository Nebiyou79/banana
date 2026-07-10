// src/components/bids/BidHeader.tsx
// Dual-role header with breadcrumb, role-specific theming
// Gold (#F1BB03) for bidder, Teal (#2AA198) for owner
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidStatusBadge } from './BidStatusBadge';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BidHeaderProps {
  bid: any;
  tender: any;
  viewerRole: 'bidder' | 'owner';
  onBack: () => void;
  isLoading?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency: string): string {
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

// ─── Component ─────────────────────────────────────────────────────────────

export const BidHeader: React.FC<BidHeaderProps> = ({
  bid,
  tender,
  viewerRole,
  onBack,
  isLoading = false,
}) => {
  const { colors } = useTheme();

  const isBidder = viewerRole === 'bidder';
  const accentColor = isBidder ? '#F1BB03' : '#2AA198';
  const isSealed = tender?.workflowType === 'closed';
  const amount = bid.bidAmount != null ? fmtCurrency(bid.bidAmount, bid.currency) : null;
  const evalScore = bid.evaluation?.combinedScore ?? bid.evaluation?.technicalScore;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={styles.skeleton}>
          <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: 120 }]} />
          <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: '80%', marginTop: 8 }]} />
          <View style={[styles.skelLine, { backgroundColor: colors.skeleton, width: 100, marginTop: 4 }]} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderBottomColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        },
      ]}
    >
      {/* Breadcrumb */}
      <Pressable onPress={onBack} style={styles.breadcrumb}>
        <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
        <Text style={[styles.breadcrumbText, { color: colors.textMuted }]}>Back</Text>
        <Text style={[styles.breadcrumbSep, { color: colors.textDisabled }]}>/</Text>
        <Text style={[styles.breadcrumbTitle, { color: colors.textMuted }]} numberOfLines={1}>
          {tender?.title ?? 'Tender'}
        </Text>
      </Pressable>

      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {tender?.title ?? 'Tender'}
          </Text>
          {tender?.referenceNumber && (
            <Text style={[styles.refNum, { color: colors.textMuted }]}>
              Ref: {tender.referenceNumber}
            </Text>
          )}
        </View>

        {/* Role-specific content */}
        <View style={styles.roleContent}>
          {isBidder ? (
            <>
              <BidStatusBadge status={bid.status} size="sm" />
              {amount && (
                <View style={[styles.amountBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.amount, { color: '#F1BB03' }]}>{amount}</Text>
                  <Text style={[styles.date, { color: colors.textMuted }]}>
                    {formatDate(bid.submittedAt)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Owner view */}
              <View style={[styles.bidderPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {bid.coverSheet?.companyName?.charAt(0)?.toUpperCase() ?? 'B'}
                  </Text>
                </View>
                <Text style={[styles.bidderName, { color: colors.text }]} numberOfLines={1}>
                  {bid.coverSheet?.companyName ?? 'Bidder'}
                </Text>
              </View>
              {amount && (
                <Text style={[styles.amount, { color: '#F1BB03' }]}>{amount}</Text>
              )}
              <BidStatusBadge status={bid.status} size="sm" />
              {evalScore != null && (
                <View style={[styles.scorePill, { backgroundColor: '#F1BB0320' }]}>
                  <Text style={[styles.scoreText, { color: '#F1BB03' }]}>
                    Score: {evalScore.toFixed(1)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {/* Workflow badge */}
      <View style={styles.workflowRow}>
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
            size={10}
            color={isSealed ? colors.info : colors.success}
          />
          <Text style={{ fontSize: 10, fontWeight: '700', color: isSealed ? colors.info : colors.success }}>
            {isSealed ? 'Sealed Tender' : 'Open Tender'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breadcrumbSep: {
    fontSize: 12,
    marginHorizontal: 2,
  },
  breadcrumbTitle: {
    fontSize: 12,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  refNum: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  amountBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  date: {
    fontSize: 10,
  },
  bidderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 160,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bidderName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
  },
  workflowRow: {
    flexDirection: 'row',
  },
  workflowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skeleton: {
    gap: 4,
  },
  skelLine: {
    height: 14,
    borderRadius: 4,
  },
});

export default BidHeader;