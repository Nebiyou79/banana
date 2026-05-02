// mobile/src/components/freelanceTenders/FreelanceTenderDeadlineTimer.tsx

import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export interface FreelanceTenderDeadlineTimerProps {
  deadline: string | Date;
  /** When true renders a compact single-line chip; default false = plain text */
  compact?: boolean;
}

function computeDeadline(deadline: string | Date): {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const end = new Date(deadline);
  const diffMs = end.getTime() - Date.now();

  if (diffMs <= 0) return { label: 'Expired', isUrgent: false, isExpired: true };

  const diffHours = diffMs / 3_600_000;
  const diffDays = diffMs / 86_400_000;

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / 60_000);
    return { label: `${mins}m left`, isUrgent: true, isExpired: false };
  }
  if (diffHours < 24) {
    return { label: `${Math.floor(diffHours)}h left`, isUrgent: true, isExpired: false };
  }
  if (diffDays < 3) {
    return { label: `${Math.floor(diffDays)}d left`, isUrgent: true, isExpired: false };
  }
  if (diffDays < 30) {
    return { label: `${Math.floor(diffDays)}d left`, isUrgent: false, isExpired: false };
  }

  const formatted = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return { label: formatted, isUrgent: false, isExpired: false };
}

const FreelanceTenderDeadlineTimer: React.FC<FreelanceTenderDeadlineTimerProps> = memo(
  ({ deadline, compact = false }) => {
    const { theme } = useThemeStore();
    const c = theme.colors;

    const { label, isUrgent, isExpired } = useMemo(
      () => computeDeadline(deadline),
      [deadline]
    );

    const color = isExpired ? (c.error ?? '#EF4444') : isUrgent ? (c.error ?? '#EF4444') : c.textMuted;

    if (compact) {
      return (
        <View
          style={[
            styles.chip,
            {
              backgroundColor: (isExpired || isUrgent)
                ? (c.error ?? '#EF4444') + '18'
                : c.textMuted + '18',
            },
          ]}
        >
          <Text style={[styles.chipText, { color }]}>{label}</Text>
        </View>
      );
    }

    return <Text style={[styles.text, { color }]}>{label}</Text>;
  }
);

FreelanceTenderDeadlineTimer.displayName = 'FreelanceTenderDeadlineTimer';

const styles = StyleSheet.create({
  text: { fontSize: 12, fontWeight: '600' },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 11, fontWeight: '700' },
});

export default FreelanceTenderDeadlineTimer;
