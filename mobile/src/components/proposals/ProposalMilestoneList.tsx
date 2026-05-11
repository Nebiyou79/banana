// src/components/proposals/ProposalMilestoneList.tsx
// Banana Mobile App — Module 6B: Proposals
// Renders a visual timeline of proposal milestones with amounts.
// REFACTORED: useTheme() + withAlpha(). No hardcoded hex.

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
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

const ProposalMilestoneList: React.FC<ProposalMilestoneListProps> = memo(({
  milestones, currency, totalBid, style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  if (!milestones?.length) return null;

  const milestoneTotal = milestones.reduce((sum, m) => sum + (m.amount ?? 0), 0);
  const diff    = Math.abs(milestoneTotal - totalBid);
  const isMatch = totalBid === 0 || diff / totalBid <= TOLERANCE;

  const matchColor = isMatch ? c.success : c.danger;

  return (
    <View style={[styles.container, style]}>
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        return (
          <View key={milestone._id ?? index} style={styles.row}>
            {/* Timeline column */}
            <View style={styles.timelineCol}>
              <View style={[styles.circle, { backgroundColor: c.primary }]}>
                <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 11 }]}>
                  {index + 1}
                </Text>
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: c.border }]} />}
            </View>

            {/* Content column */}
            <View style={[styles.contentCol, !isLast && styles.contentColPadded]}>
              <View style={styles.contentHeader}>
                <Text
                  style={[type.bodySm, { color: c.text, fontWeight: '600', flex: 1, lineHeight: 20 }]}
                  numberOfLines={2}
                >
                  {milestone.title}
                </Text>
                <Text style={[type.bodySm, { color: c.primary, fontWeight: '700', flexShrink: 0 }]}>
                  {formatAmt(milestone.amount, currency)}
                </Text>
              </View>
              {milestone.description ? (
                <Text style={[type.caption, { color: c.textMuted, lineHeight: 18, marginTop: 2 }]} numberOfLines={2}>
                  {milestone.description}
                </Text>
              ) : null}
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={11} color={c.textMuted} />
                <Text style={[type.caption, { color: c.textMuted, marginLeft: 4 }]}>
                  {milestone.duration} {milestone.durationUnit}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Total row */}
      <View style={[styles.totalRow, {
        backgroundColor: withAlpha(matchColor, 0.08),
        borderColor: withAlpha(matchColor, 0.40),
      }]}>
        <View style={styles.totalLeft}>
          <Ionicons
            name={isMatch ? 'checkmark-circle-outline' : 'warning-outline'}
            size={16}
            color={matchColor}
          />
          <Text style={[type.bodySm, { color: matchColor, fontWeight: '600', marginLeft: 6 }]}>
            Milestone Total
          </Text>
        </View>
        <View style={styles.totalRight}>
          <Text style={[type.bodySm, { color: matchColor, fontWeight: '700' }]}>
            {formatAmt(milestoneTotal, currency)}
          </Text>
          {!isMatch && (
            <Text style={[type.caption, { color: matchColor, fontWeight: '600', marginLeft: 6 }]}>
              Mismatch
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

ProposalMilestoneList.displayName = 'ProposalMilestoneList';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    container: { gap: 0 },
    row: { flexDirection: 'row', gap: 12 },
    timelineCol: { alignItems: 'center', width: 28 },
    circle: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    line: {
      width: 2, flex: 1, minHeight: 16,
      marginTop: 4, marginBottom: 4, borderRadius: 1,
    },
    contentCol: { flex: 1, paddingBottom: 4 },
    contentColPadded: { paddingBottom: 16 },
    contentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    durationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: radius.md, borderWidth: 1,
    },
    totalLeft: { flexDirection: 'row', alignItems: 'center' },
    totalRight: { flexDirection: 'row', alignItems: 'center' },
  });

export { ProposalMilestoneList };
export default ProposalMilestoneList;