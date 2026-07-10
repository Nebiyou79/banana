import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

export interface FreelanceTenderDeadlineTimerProps {
  deadline: string | Date;
  compact?: boolean;
}

function computeDeadline(deadline: string | Date) {
  const end    = new Date(deadline);
  const diffMs = end.getTime() - Date.now();

  if (diffMs <= 0) return { label: 'Expired', isUrgent: false, isExpired: true };

  const diffHours = diffMs / 3_600_000;
  const diffDays  = diffMs / 86_400_000;

  if (diffHours < 1)  return { label: `${Math.floor(diffMs / 60_000)}m left`, isUrgent: true,  isExpired: false };
  if (diffHours < 24) return { label: `${Math.floor(diffHours)}h left`,       isUrgent: true,  isExpired: false };
  if (diffDays < 4)   return { label: `${Math.floor(diffDays)}d left`,        isUrgent: true,  isExpired: false };
  if (diffDays < 30)  return { label: `${Math.floor(diffDays)}d left`,        isUrgent: false, isExpired: false };

  return {
    label: end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    isUrgent: false,
    isExpired: false,
  };
}

const FreelanceTenderDeadlineTimer: React.FC<FreelanceTenderDeadlineTimerProps> = memo(
  ({ deadline, compact = false }) => {
    const { colors, radius } = useTheme();
    const { label, isUrgent, isExpired } = useMemo(() => computeDeadline(deadline), [deadline]);

    const color = isExpired ? colors.danger : isUrgent ? colors.warning : colors.textMuted;
    const bg    = isExpired
      ? withAlpha(colors.danger, 0.10)
      : isUrgent
      ? withAlpha(colors.warning, 0.10)
      : withAlpha(colors.textMuted, 0.09);

    if (compact) {
      return (
        <View style={[styles.chip, { backgroundColor: bg, borderColor: withAlpha(color, 0.25), borderRadius: radius.sm }]}>
          <Ionicons
            name={isExpired ? 'close-circle' : isUrgent ? 'warning' : 'time-outline'}
            size={10}
            color={color}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.chipText, { color }]}>{label}</Text>
        </View>
      );
    }

    return (
      <View style={styles.inlineRow}>
        <Ionicons
          name={isExpired ? 'close-circle-outline' : isUrgent ? 'warning-outline' : 'time-outline'}
          size={13}
          color={color}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.text, { color }]}>{label}</Text>
      </View>
    );
  },
);

FreelanceTenderDeadlineTimer.displayName = 'FreelanceTenderDeadlineTimer';

const styles = StyleSheet.create({
  text:      { fontSize: 12, fontWeight: '600' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start', borderWidth: 1 },
  chipText:  { fontSize: 11, fontWeight: '700' },
});

export default FreelanceTenderDeadlineTimer;
