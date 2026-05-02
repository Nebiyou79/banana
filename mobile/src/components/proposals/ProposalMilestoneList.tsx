// src/components/proposals/ProposalMilestoneList.tsx
// Banana Mobile App — Module 6B: Proposals
// Renders a visual timeline of proposal milestones with amounts.

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { ProposalMilestone, ProposalCurrency } from '../../types/proposal';

interface ProposalMilestoneListProps {
  milestones: ProposalMilestone[];
  currency: ProposalCurrency;
  totalBid: number;
  style?: ViewStyle;
}

const TOLERANCE = 0.05;

function formatAmt(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export const ProposalMilestoneList: React.FC<ProposalMilestoneListProps> = ({
  milestones,
  currency,
  totalBid,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, spacing } = theme;

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const milestoneTotal = milestones.reduce((sum, m) => sum + (m.amount ?? 0), 0);
  const diff = Math.abs(milestoneTotal - totalBid);
  const isMatch = totalBid === 0 || diff / totalBid <= TOLERANCE;

  return (
    <View style={[styles.container, style]}>
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        return (
          <View key={milestone._id ?? index} style={styles.milestoneRow}>
            {/* Timeline column */}
            <View style={styles.timelineCol}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: '#F1BB03', borderColor: '#F1BB03' },
                ]}
              >
                <Text style={styles.circleNum}>{index + 1}</Text>
              </View>
              {!isLast && (
                <View
                  style={[styles.line, { backgroundColor: colors.border }]}
                />
              )}
            </View>

            {/* Content column */}
            <View style={[styles.contentCol, !isLast && styles.contentColPadded]}>
              <View style={styles.contentHeader}>
                <Text
                  style={[styles.milestoneTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {milestone.title}
                </Text>
                <Text style={[styles.milestoneAmount, { color: '#F1BB03' }]}>
                  {formatAmt(milestone.amount, currency)}
                </Text>
              </View>
              {milestone.description ? (
                <Text
                  style={[styles.milestoneDesc, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {milestone.description}
                </Text>
              ) : null}
              <Text style={[styles.milestoneDuration, { color: colors.textMuted }]}>
                {milestone.duration} {milestone.durationUnit}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Total row */}
      <View
        style={[
          styles.totalRow,
          {
            backgroundColor: isMatch
              ? 'rgba(16,185,129,0.08)'
              : 'rgba(239,68,68,0.08)',
            borderColor: isMatch ? '#10B981' : '#EF4444',
          },
        ]}
      >
        <Text
          style={[
            styles.totalLabel,
            { color: isMatch ? '#059669' : '#DC2626' },
          ]}
        >
          Milestone Total
        </Text>
        <View style={styles.totalRight}>
          <Text
            style={[
              styles.totalAmount,
              { color: isMatch ? '#059669' : '#DC2626' },
            ]}
          >
            {formatAmt(milestoneTotal, currency)}
          </Text>
          <Text
            style={[
              styles.totalCheck,
              { color: isMatch ? '#059669' : '#DC2626' },
            ]}
          >
            {isMatch ? '✓' : '⚠ Mismatch'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineCol: {
    alignItems: 'center',
    width: 28,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  circleNum: {
    color: '#0A2540',
    fontSize: 11,
    fontWeight: '800',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 4,
  },
  contentColPadded: {
    paddingBottom: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  milestoneTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  milestoneAmount: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  milestoneDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  milestoneDuration: {
    fontSize: 11,
    marginTop: 3,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalCheck: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProposalMilestoneList;
