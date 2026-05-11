import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

export interface FreelanceTenderDeadlineTimerProps {
  deadline: string | Date;
  compact?: boolean;
}

function computeDeadline(deadline: string | Date) {
  const end = new Date(deadline);
  const diffMs = end.getTime() - Date.now();
  if (diffMs <= 0) return { label: 'Expired', isUrgent: false, isExpired: true };
  const diffHours = diffMs / 3_600_000;
  const diffDays  = diffMs / 86_400_000;
  if (diffHours < 1)  return { label: `${Math.floor(diffMs / 60_000)}m left`, isUrgent: true, isExpired: false };
  if (diffHours < 24) return { label: `${Math.floor(diffHours)}h left`, isUrgent: true, isExpired: false };
  if (diffDays < 3)   return { label: `${Math.floor(diffDays)}d left`, isUrgent: true, isExpired: false };
  if (diffDays < 30)  return { label: `${Math.floor(diffDays)}d left`, isUrgent: false, isExpired: false };
  return {
    label: end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    isUrgent: false, isExpired: false,
  };
}

const FreelanceTenderDeadlineTimer: React.FC<FreelanceTenderDeadlineTimerProps> = memo(
  ({ deadline, compact = false }) => {
    const { colors: c, radius } = useTheme();
    const { label, isUrgent, isExpired } = useMemo(() => computeDeadline(deadline), [deadline]);
    const color = isExpired || isUrgent ? c.danger : c.textMuted;

    if (compact) {
      return (
        <View style={[styles.chip, {
          backgroundColor: isExpired || isUrgent ? withAlpha(c.danger, 0.12) : withAlpha(c.textMuted, 0.12),
          borderRadius: radius.sm,
        }]}>
          <Text style={[styles.chipText, { color }]}>{label}</Text>
        </View>
      );
    }
    return <Text style={[styles.text, { color }]}>{label}</Text>;
  },
);

FreelanceTenderDeadlineTimer.displayName = 'FreelanceTenderDeadlineTimer';

const styles = StyleSheet.create({
  text: { fontSize: 12, fontWeight: '600' },
  chip: { paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start' },
  chipText: { fontSize: 11, fontWeight: '700' },
});

export default FreelanceTenderDeadlineTimer;